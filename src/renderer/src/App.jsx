import { useState, useEffect, useRef } from 'react'
import TitleBar from './components/TitleBar/TitleBar'
import CliConsole from './components/CliConsole/CliConsole'
import { useLanguage } from './i18n'

// Register CLI output IPC listeners at module level so they survive HMR without
// needing useEffect to re-run. The callback ref is wired inside the component.
const _cliLogEmitter = { callback: null }
window.api.onCliOutput(data => _cliLogEmitter.callback?.({ type: 'out', text: data }))
window.api.onCliError(data => _cliLogEmitter.callback?.({ type: 'err', text: data }))
window.api.onYtdlOutput(({ data }) => _cliLogEmitter.callback?.({ type: 'ytdl', text: data }))
import SourcePage from './pages/SourcePage/SourcePage'
import ListPage from './pages/ListPage/ListPage'
import AboutPage from './pages/AboutPage/AboutPage'
import SettingsPage from './pages/SettingsPage/SettingsPage'
import OnboardingScreen from './components/OnboardingScreen/OnboardingScreen'
import { DEFAULT_SETTINGS, initDefaultSettings, saveGpuVendor, getDefaultSettingsForGpu } from './components/GlobalSettings/GlobalSettings'
import gradientPPL from './assets/images/Gradient_PPL.webm'
import gradientBlack from './assets/images/Gradient_Black.webm'
import gradientWhite from './assets/images/Gradient_White.webm'

function getEncoderErrorHint(stderr, t) {
    if (/No capable devices found/i.test(stderr)) {
        if (/av1_nvenc/i.test(stderr)) return t('gpuErrNvencAv1')
        if (/h265_nvenc|hevc_nvenc/i.test(stderr)) return t('gpuErrNvencH265')
        if (/nvenc/i.test(stderr)) return t('gpuErrNvenc')
        if (/av1_amf|av1_vce/i.test(stderr)) return t('gpuErrVceAv1')
        if (/av1_qsv/i.test(stderr)) return t('gpuErrQsvAv1')
        return t('gpuErrHwUnavailable')
    }
    if (/avcodec_open failed|Failure to initialise thread/i.test(stderr)) {
        if (/nvenc/i.test(stderr)) return t('gpuErrNvencInit')
        if (/qsv/i.test(stderr)) return t('gpuErrQsvInit')
        if (/vce|amf/i.test(stderr)) return t('gpuErrVceInit')
    }
    return null
}

function App() {
    const { t } = useLanguage()
    const [view, setView] = useState('source')
    const [settingsInitialTab, setSettingsInitialTab] = useState('app')
    const [videos, setVideos] = useState([])
    const [isDragging, setIsDragging] = useState(false)
    const [isDraggingOnList, setIsDraggingOnList] = useState(false)
    const [selectedSettings, setSelectedSettings] = useState(() => initDefaultSettings())
    const [isEncoding, setIsEncoding] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [encodingStartTime, setEncodingStartTime] = useState(null)
    const [cliErrors, setCliErrors] = useState([])
    const [copiedIdx, setCopiedIdx] = useState(null)
    const [cliLogs, setCliLogs] = useState([])
    const [showCliConsole, setShowCliConsole] = useState(false)
    const [ytdlFetchError, setYtdlFetchError] = useState(null)
    const videosRef = useRef([])

    // Wire the module-level IPC emitter to the React state setter
    useEffect(() => {
        _cliLogEmitter.callback = (entry) => setCliLogs(prev => [...prev, entry])
        return () => { _cliLogEmitter.callback = null }
    }, [])    // Tracks last-seen progress per video to prevent backward movement
    const progressStateRef = useRef(new Map())
    // Track IDs stopped by user so cli-exit/ytdl-exit doesn't set them to 'error'
    const stoppedJobsRef = useRef(new Set())
    const [themeMode, setThemeMode] = useState(() => {
        const saved = localStorage.getItem('theme')
        return (saved === 'dark' || saved === 'light') ? saved : 'auto'
    })
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('theme')
        if (saved === 'dark' || saved === 'light') return saved
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    })
    const [accentTheme, setAccentTheme] = useState(() => {
        const saved = localStorage.getItem('gorex-accent-theme')
        // migrate old 'black' value to 'white'
        if (saved === 'black') return 'white'
        return saved || 'purple'
    })
    const [isLoading, setIsLoading] = useState(false)
    const [loadingMessage, setLoadingMessage] = useState(null)
    const [outputMode, setOutputMode] = useState('default')
    const [customOutputDir, setCustomOutputDir] = useState(() => {
        try {
            const s = JSON.parse(localStorage.getItem('gorex-app-config') || '{}')
            return s.defaultOutputDir || s.defaultCustomOutputDir || ''
        } catch { return '' }
    })
    const [defaultOutputDir, setDefaultOutputDir] = useState('')
    const [appSettings, setAppSettings] = useState(null)
    const [gpuVendor, setGpuVendor] = useState('unknown')
    const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('gorex-onboarding-done'))
    const [updateInfo, setUpdateInfo] = useState(null)
    const nextIdRef = useRef(0)
    const listDragCounter = useRef(0)

    useEffect(() => { videosRef.current = videos }, [videos])

    const loadAndAddVideos = async (paths, downloadService = false) => {
        if (!paths || paths.length === 0) return
        setIsLoading(true)
        try {
            const data = await window.api.getVideoData(paths)
            const newVideos = data.map(v => ({
                ...v,
                id: nextIdRef.current++,
                progress: 0,
                status: 'ready',
                customSettings: null,
                clipStart: null,
                clipEnd: null,
                downloadService: downloadService && typeof downloadService === 'object' ? downloadService : null
            }))
            setVideos(prev => {
                const updated = [...prev, ...newVideos]
                return updated
            })
            if (newVideos.length > 0) setView('list')
        } catch (err) {
            console.error('Failed to load video data:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSelectFiles = async () => {
        try {
            const paths = await window.api.selectFiles()
            if (paths && paths.length > 0) await loadAndAddVideos(paths)
        } catch (err) {
            console.error('Failed to select files:', err)
        }
    }

    const handleRemoveVideo = (id) => {
        setVideos(prev => {
            const updated = prev.filter(v => v.id !== id)
            if (updated.length === 0) setView('source')
            return updated
        })
    }

    const handleClearQueue = () => {
        setVideos([])
        setView('source')
    }

    const handleRenameOutput = (id, newName) => {
        setVideos(prev => prev.map(v => v.id === id ? { ...v, outputName: newName } : v))
    }

    const handleVideoSettingsChange = (id, settings) => {
        setVideos(prev => prev.map(v => v.id === id ? { ...v, customSettings: settings } : v))
    }

    const ytdlFetchCancelledRef = useRef(false)

    const handleDownload = async (url, service, extensionOpts = null) => {
        ytdlFetchCancelledRef.current = false
        setIsLoading(true)
        setLoadingMessage({ title: t('loadingFetchingFormats'), subtitle: t('loadingStageYtdlp') })

        const stageLabels = {
            ytdlp:       () => t('loadingStageYtdlp'),
            scraping:    () => t('loadingStageScraping'),
            queryparams: () => t('loadingStageQueryparams'),
            retry:       () => t('loadingStageRetry'),
        }
        window.api.onYtdlFetchProgress(({ stage, total }) => {
            if (stage === 'retry') {
                const subtitle = total > 1
                    ? t('loadingStageRetryMany').replace('{n}', total)
                    : t('loadingStageRetry')
                setLoadingMessage({ title: t('loadingFetchingFormats'), subtitle })
            } else if (stageLabels[stage]) {
                setLoadingMessage({ title: t('loadingFetchingFormats'), subtitle: stageLabels[stage]() })
            }
        })

        try {
            const infos = await window.api.ytdlGetFormats(url)
            if (ytdlFetchCancelledRef.current) return

            const newVideos = infos.map(info => {
                const safeOutputName = (info.title || 'video')
                    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
                    .replace(/\.+$/, '')
                    .trim() || 'video'

                let bestFormatId = ''
                if (info.formats && info.formats.length) {
                    const seen = new Map()
                    for (const f of info.formats) {
                        if (!f.vcodec || f.vcodec === 'none') continue
                        const base = (f.vcodec || '').split('.')[0].toLowerCase()
                        const key = `${f.height || 0}_${base}`
                        const prev = seen.get(key)
                        if (!prev || (f.tbr || 0) > (prev.tbr || 0)) seen.set(key, f)
                    }
                    const sorted = [...seen.values()].sort((a, b) => (b.height || 0) - (a.height || 0))
                    bestFormatId = sorted[0]?.format_id || ''
                }
                // If extension pre-selected a specific format, use it
                const selectedFmt = extensionOpts?.preselectedFormat || bestFormatId

                return {
                    id: nextIdRef.current++,
                    isYtdlItem: true,
                    ytdlUrl: info.resolvedUrl || url,
                    ytdlFormats: info.formats,
                    ytdlSelectedFormat: selectedFmt,
                    ytdlChapters: info.chapters || [],
                    ytdlDuration: info.duration || 0,
                    ytdlAvailableSubs: info.availableSubs || [],
                    ytdlAvailableAutoSubs: info.availableAutoSubs || [],
                    clipStart: extensionOpts?.clipStart ?? null,
                    clipEnd: extensionOpts?.clipEnd ?? null,
                    title: info.title,
                    outputName: safeOutputName,
                    thumbnail: info.thumbnailUrl,
                    status: 'format_select',
                    progress: 0,
                    downloadService: service,
                    convertAfterDownload: false,
                    conversionSettings: null,
                    customSettings: null,
                    ytdlNoAudio: extensionOpts?.audioOnly ?? false,
                }
            })
            setVideos(prev => [...prev, ...newVideos])
            setView('list')
        } catch (err) {
            if (ytdlFetchCancelledRef.current) return
            console.error('Failed to fetch yt-dlp formats:', err)
            const errText = `[yt-dlp] Ошибка получения метаданных:\n${err.message}\n`
            _cliLogEmitter.callback?.({ type: 'err', text: errText })
            setYtdlFetchError(err.message || t('dlErrorDefault'))
        } finally {
            setIsLoading(false)
            setLoadingMessage(null)
        }
    }

    const handleDownloadCancel = () => {
        ytdlFetchCancelledRef.current = true
        window.api.ytdlCancelFetch()
        setIsLoading(false)
        setLoadingMessage(null)
    }

    const handleYtdlFormatChange = (id, formatId) => {
        setVideos(prev => prev.map(v => v.id === id ? { ...v, ytdlSelectedFormat: formatId } : v))
    }

    const handleYtdlConvertToggle = (id, val) => {
        setVideos(prev => prev.map(v => v.id === id ? { ...v, convertAfterDownload: val } : v))
    }

    const handleYtdlConversionSettings = (id, settings) => {
        setVideos(prev => prev.map(v => v.id === id ? { ...v, conversionSettings: settings } : v))
    }

    const handleYtdlClipChange = (id, clipStart, clipEnd) => {
        setVideos(prev => prev.map(v => v.id === id ? { ...v, clipStart, clipEnd } : v))
    }

    const handleLocalClipChange = (id, clipStart, clipEnd) => {
        setVideos(prev => prev.map(v => v.id === id ? { ...v, clipStart, clipEnd } : v))
    }

    const handleYtdlOptionsChange = (id, opts) => {
        setVideos(prev => prev.map(v =>
            v.id === id ? { ...v,
                ytdlNoAudio:      opts.noAudio,
                ytdlDownloadSubs: opts.downloadSubs,
                ytdlAutoSubs:     opts.autoSubs,
                ytdlSubLangs:     opts.subLangs,
                ytdlSubFormat:    opts.subFormat,
            } : v
        ))
    }

    const toggleTheme = () => {
        setTheme(prev => {
            const next = prev === 'dark' ? 'light' : 'dark'
            localStorage.setItem('theme', next)
            setThemeMode(next)
            return next
        })
    }

    const handleSetThemeMode = (mode) => {
        setThemeMode(mode)
        if (mode === 'auto') {
            localStorage.removeItem('theme')
            const sys = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
            setTheme(sys)
        } else {
            localStorage.setItem('theme', mode)
            setTheme(mode)
        }
    }

    const handleSetAccentTheme = (accent) => {
        setAccentTheme(accent)
        localStorage.setItem('gorex-accent-theme', accent)
    }

    useEffect(() => {
        if (themeMode !== 'auto') return
        const mq = window.matchMedia('(prefers-color-scheme: dark)')
        const handler = (e) => setTheme(e.matches ? 'dark' : 'light')
        mq.addEventListener('change', handler)
        return () => mq.removeEventListener('change', handler)
    }, [themeMode])

    const handlePause = () => {
        if (!isEncoding) return
        if (isPaused) {
            window.api.resumeAll()
            setIsPaused(false)
        } else {
            window.api.pauseAll()
            setIsPaused(true)
        }
    }

    const handleStop = () => {
        // Record all active job IDs so their cli-exit/ytdl-exit/progress events are ignored
        videosRef.current
            .filter(v => ['encoding', 'downloading', 'downloading-subs', 'converting'].includes(v.status))
            .forEach(v => stoppedJobsRef.current.add(v.id))
        window.api.stopAll()
        setIsEncoding(false)
        setIsPaused(false)
        setEncodingStartTime(null)
        progressStateRef.current.clear()
        setVideos(prev => prev.map(v =>
            ['encoding', 'downloading', 'downloading-subs', 'converting'].includes(v.status)
                ? { ...v, status: v.isYtdlItem ? 'format_select' : 'ready', progress: 0, startTime: null, endTime: null }
                : v
        ))
    }

    const handleViewChange = (newView) => {
        setView(newView)
    }

    const handleSaveSettings = async (encodingSettings, appConfig) => {
        // Persist encoding defaults
        localStorage.setItem('gorex-default-settings', JSON.stringify(encodingSettings))
        setSelectedSettings(encodingSettings)
        // Persist app config (renderer-side)
        localStorage.setItem('gorex-app-config', JSON.stringify(appConfig))
        // Apply output dir to current session
        if (appConfig.defaultOutputDir) setCustomOutputDir(appConfig.defaultOutputDir)
        // Persist to file (main process reads CLI path from here)
        await window.api.saveAppSettings(appConfig)
        setAppSettings(appConfig)
        // Refresh default output dir
        window.api.getDefaultOutputDir().then(dir => setDefaultOutputDir(dir))
    }

    const handleOutputModeChange = async (mode) => {
        if (mode === 'custom') {
            const dir = await window.api.selectFolder()
            if (dir) {
                setCustomOutputDir(dir)
                setOutputMode('custom')
            }
        } else {
            setOutputMode(mode)
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setIsDragging(false)
        if (e.dataTransfer.files.length > 0) {
            const paths = Array.from(e.dataTransfer.files).map(f => window.electron.webUtils.getPathForFile(f)).filter(Boolean)
            loadAndAddVideos(paths)
        }
    }

    const handleListDragEnter = (e) => {
        e.preventDefault()
        listDragCounter.current++
        setIsDraggingOnList(true)
    }

    const handleListDragLeave = (e) => {
        e.preventDefault()
        listDragCounter.current--
        if (listDragCounter.current === 0) setIsDraggingOnList(false)
    }

    const handleListDragOver = (e) => {
        e.preventDefault()
    }

    const handleListDrop = (e) => {
        e.preventDefault()
        listDragCounter.current = 0
        setIsDraggingOnList(false)
        if (e.dataTransfer.files.length > 0) {
            const paths = Array.from(e.dataTransfer.files).map(f => window.electron.webUtils.getPathForFile(f)).filter(Boolean)
            loadAndAddVideos(paths)
        }
    }

    const startEncoding = () => {
        const now = Date.now()
        setIsEncoding(true)
        setIsPaused(false)
        setEncodingStartTime(now)
        progressStateRef.current.clear()
        // Reset progress for already-finished videos so they get re-encoded
        setVideos(prev => prev.map(v =>
            v.status === 'done' || v.status === 'error'
                ? { ...v, progress: 0, status: v.isYtdlItem ? 'format_select' : 'ready', startTime: null, endTime: null }
                : v
        ))
        const resolvedOutputDir = outputMode === 'default' ? defaultOutputDir : customOutputDir
        videos.forEach(v => {
            if (v.isYtdlItem) {
                window.api.ytdlRun({
                    id: v.id,
                    url: v.ytdlUrl,
                    formatId: v.ytdlSelectedFormat || 'best',
                    outputDir: resolvedOutputDir,
                    outputName: v.outputName,
                    convertAfterDownload: v.convertAfterDownload,
                    conversionSettings: v.conversionSettings || selectedSettings,
                    videoResolution: v.resolution,
                    clipStart: v.clipStart ?? null,
                    clipEnd: v.clipEnd ?? null,
                    ytdlDuration: v.ytdlDuration ?? null,
                    noAudio:      v.ytdlNoAudio      ?? false,
                    downloadSubs: v.ytdlDownloadSubs ?? false,
                    autoSubs:     v.ytdlAutoSubs     ?? false,
                    subLangs:     v.ytdlSubLangs     ?? 'all',
                    subFormat:    v.ytdlSubFormat    ?? 'srt',
                })
            } else {
                window.api.runCli({
                    filePath: v.path,
                    settings: v.customSettings || selectedSettings,
                    id: v.id,
                    outputMode,
                    customOutputDir: resolvedOutputDir,
                    outputName: v.outputName,
                    videoResolution: v.resolution,
                    clipStart: v.clipStart ?? null,
                    clipEnd: v.clipEnd ?? null,
                })
            }
        })
    }

    useEffect(() => {
        window.api.checkForUpdates().then(info => { if (info) setUpdateInfo(info) }).catch(() => {})
    }, [])

    // ─── Chrome extension integration ─────────────────────────────────────────────
    useEffect(() => {
        window.api.onExtensionAddToQueue(async (data) => {
            const { url, formatId, audioOnly, clipStart, clipEnd } = data
            if (!url) return
            // Detect service
            let service = null
            try {
                const host = new URL(url).hostname.replace(/^www\./, '')
                const SERVICE_MAP = {
                    'youtube.com': { name: 'YouTube', color: '#ff0000' },
                    'youtu.be': { name: 'YouTube', color: '#ff0000' },
                    'twitter.com': { name: 'Twitter / X', color: '#ffffff' },
                    'x.com': { name: 'Twitter / X', color: '#ffffff' },
                    'instagram.com': { name: 'Instagram', color: '#e1306c' },
                    'tiktok.com': { name: 'TikTok', color: '#ff0050' },
                    'vk.com': { name: 'VKontakte', color: '#4a76a8' },
                    'vkvideo.ru': { name: 'VK Видео', color: '#4a76a8' },
                    'rutube.ru': { name: 'Rutube', color: '#ff5c00' },
                }
                service = SERVICE_MAP[host] || null
            } catch {}
            await handleDownload(url, service, { preselectedFormat: formatId, audioOnly, clipStart, clipEnd })
        })
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Sync queue state to main process so the extension API can report it
    useEffect(() => {
        const summary = videos.map(v => ({
            id: v.id,
            title: v.title || v.outputName || '',
            status: v.status,
            progress: v.progress || 0,
            url: v.ytdlUrl || null,
        }))
        window.api.extensionUpdateQueue(summary)
    }, [videos])

    useEffect(() => {
        window.api.getDefaultOutputDir().then(dir => setDefaultOutputDir(dir))
        window.api.getAppSettings().then(s => { if (s) setAppSettings(s) })
        window.api.getGpuInfo().then(info => {
            if (info && info.vendor) {
                setGpuVendor(info.vendor)
                saveGpuVendor(info.vendor)
                // Apply GPU-specific encoder only if user has no saved settings
                const hasSaved = !!localStorage.getItem('gorex-default-settings')
                if (!hasSaved) {
                    setSelectedSettings(getDefaultSettingsForGpu(info.vendor))
                }
            }
        }).catch(() => {})
    }, [])

    useEffect(() => {
        document.body.className = theme
        document.body.setAttribute('data-accent', accentTheme)
    }, [theme, accentTheme])

    useEffect(() => {
        window.api.onCliProgress(({ id, progress }) => {
            if (stoppedJobsRef.current.has(id)) return
            const ps = progressStateRef.current
            const state = ps.get(id) || { current: 0 }
            // Progress is already multi-pass-aware (linearized in main process),
            // so only apply forward movement to avoid any stray backward updates.
            if (progress < state.current) return
            ps.set(id, { current: progress })
            setVideos(prev => prev.map(v =>
                v.id === id
                    ? { ...v, progress, status: 'encoding', startTime: v.startTime ?? Date.now() }
                    : v
            ))
        })

        window.api.onYtdlProgress(({ id, progress, subsPhase }) => {
            if (stoppedJobsRef.current.has(id)) return
            setVideos(prev => prev.map(v =>
                v.id === id
                    ? { ...v, progress, status: subsPhase ? 'downloading-subs' : 'downloading', startTime: v.startTime ?? Date.now() }
                    : v
            ))
        })

        window.api.onYtdlExit(({ id, code, converting }) => {
            if (stoppedJobsRef.current.has(id)) {
                stoppedJobsRef.current.delete(id)
                return
            }
            if (converting) {
                // Download finished, conversion phase starting
                setVideos(prev => prev.map(v =>
                    v.id === id ? { ...v, progress: 0, status: 'converting', startTime: Date.now() } : v
                ))
            } else {
                setVideos(prev => {
                    const updated = prev.map(v => v.id === id
                        ? { ...v, progress: 100, status: code === 0 ? 'done' : 'error', endTime: Date.now() }
                        : v
                    )
                    if (!updated.some(v => ['encoding', 'downloading', 'downloading-subs', 'converting'].includes(v.status))) {
                        setIsEncoding(false)
                        setEncodingStartTime(null)
                    }
                    return updated
                })
            }
        })

        window.api.onCliExit(({ id, code, stderr }) => {
            if (stoppedJobsRef.current.has(id)) {
                stoppedJobsRef.current.delete(id)
                progressStateRef.current.delete(id)
                return
            }
            progressStateRef.current.delete(id)
            setVideos(prev => {
                const updated = prev.map(v => v.id === id
                    ? { ...v, progress: 100, status: code === 0 ? 'done' : 'error', endTime: Date.now() }
                    : v
                )
                if (!updated.some(v => ['encoding', 'downloading', 'downloading-subs', 'converting'].includes(v.status))) {
                    setIsEncoding(false)
                    setEncodingStartTime(null)
                }
                return updated
            })
            if (code !== 0) {
                const v = videosRef.current.find(v => v.id === id)
                const title = v ? (v.title || v.path?.split(/[/\\]/).pop() || t('unknownFile')) : t('unknownFile')
                const hint = getEncoderErrorHint(stderr || '', t)
                setCliErrors(prev => [...prev, { title, stderr: (stderr || '').trim() || t('noOutput'), hint }])
            }
        })
    }, [])

    const renderPage = () => {
        switch (view) {
            case 'about':
                return (
                    <AboutPage
                        theme={theme}
                        onBack={() => setView(videos.length > 0 ? 'list' : 'source')}
                    />
                )
            case 'settings':
                return (
                    <SettingsPage
                        theme={theme}
                        themeMode={themeMode}
                        onThemeModeChange={handleSetThemeMode}
                        accentTheme={accentTheme}
                        onAccentThemeChange={handleSetAccentTheme}
                        onBack={() => setView(videos.length > 0 ? 'list' : 'source')}
                        appSettings={appSettings}
                        onSave={handleSaveSettings}
                        initialTab={settingsInitialTab}
                    />
                )
            case 'list':
                return (
                    <ListPage
                        videos={videos}
                        settings={selectedSettings}
                        isEncoding={isEncoding}
                        theme={theme}
                        gpuVendor={gpuVendor}
                        encodingStartTime={encodingStartTime}
                        onSettingsChange={setSelectedSettings}
                        onStartEncoding={startEncoding}
                        onStop={handleStop}
                        outputMode={outputMode}
                        customOutputDir={customOutputDir}
                        defaultOutputDir={defaultOutputDir}
                        onOutputModeChange={handleOutputModeChange}
                        onAddFiles={handleSelectFiles}
                        onDownload={handleDownload}
                        onRemoveVideo={handleRemoveVideo}
                        onClearQueue={handleClearQueue}
                        onRenameOutput={handleRenameOutput}
                        onVideoSettingsChange={handleVideoSettingsChange}
                        onYtdlFormatChange={handleYtdlFormatChange}
                        onYtdlConvertToggle={handleYtdlConvertToggle}
                        onYtdlConversionSettings={handleYtdlConversionSettings}
                        onYtdlClipChange={handleYtdlClipChange}
                        onLocalClipChange={handleLocalClipChange}
                        onYtdlOptionsChange={handleYtdlOptionsChange}
                        onOpenSettings={(tab) => { setSettingsInitialTab(tab || 'app'); handleViewChange('settings') }}
                        isDraggingOnList={isDraggingOnList}
                        onListDragEnter={handleListDragEnter}
                        onListDragLeave={handleListDragLeave}
                        onListDragOver={handleListDragOver}
                        onListDrop={handleListDrop}
                    />
                )
            default:
                return (
                    <SourcePage
                        theme={theme}
                        isDragging={isDragging}
                        onSelectFiles={handleSelectFiles}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onDownload={handleDownload}
                    />
                )
        }
    }

    return (
        <div className={`app-wrapper ${theme}`}>
            {(isEncoding || isLoading) && (
                <div className="bg-video-wrap">
                    <video
                        key={accentTheme + theme}
                        src={accentTheme === 'white' ? (theme === 'dark' ? gradientWhite : gradientBlack) : gradientPPL}
                        autoPlay
                        loop
                        muted
                        playsInline
                    />
                </div>
            )}
            <TitleBar
                onOpen={handleSelectFiles}
                theme={theme}
                toggleTheme={toggleTheme}
                onViewChange={handleViewChange}
                currentView={view}
                isEncoding={isEncoding}
                isPaused={isPaused}
                hasVideos={videos.length > 0}
                onStartEncoding={startEncoding}
                onPause={handlePause}
                onStop={handleStop}
                onClearQueue={handleClearQueue}
                onOpenCliConsole={() => setShowCliConsole(v => !v)}
            />
            {updateInfo && (
                <div className={`update-popup ${theme}`}>
                    <button className="update-popup-close" onClick={() => setUpdateInfo(null)}>
                        <i className="bi bi-x"></i>
                    </button>
                    <div className="update-popup-icon">
                        <i className="bi bi-arrow-up-circle-fill"></i>
                    </div>
                    <div className="update-popup-title">{t('updateAvailable').replace('{v}', updateInfo.latestVersion)}</div>
                    <div className="update-popup-sub">{t('updateSub')}</div>
                    <button
                        className="update-popup-btn"
                        onClick={() => window.api.openExternal(updateInfo.downloadUrl)}
                    >
                        <i className="bi bi-download"></i> {t('updateDownload')}
                    </button>
                </div>
            )}
            <main className="container">
                {renderPage()}
            </main>
            {isLoading && (
                <div className={`loading-overlay ${theme}`}>
                    <div className="loading-popup">
                        <div className="loading-popup-title">{loadingMessage?.title ?? t('loadingAnalyzing')}</div>
                        <div className="loading-popup-subtitle">{loadingMessage?.subtitle ?? t('loadingReadingMeta')}</div>
                        <div className="loading-bar-track">
                            <div className="loading-bar-fill"></div>
                        </div>
                        {loadingMessage?.title === t('loadingFetchingFormats') && (
                            <button className="loading-cancel-btn" onClick={handleDownloadCancel}>
                                {t('loadingCancel')}
                            </button>
                        )}
                    </div>
                </div>
            )}
            {cliErrors.length > 0 && (
                <div className={`cli-error-overlay ${theme}`} onClick={() => setCliErrors([])}>
                    <div className="cli-error-popup" onClick={e => e.stopPropagation()}>
                        <div className="cli-error-header">
                            <i className="bi bi-exclamation-triangle-fill cli-error-icon"></i>
                            <span className="cli-error-title">
                                {cliErrors.length === 1 ? t('encodingError') : `${t('encodingErrors')} (${cliErrors.length})`}
                            </span>
                            <button className="cli-error-close" onClick={() => setCliErrors([])}>
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>
                        <div className="cli-error-body">
                            {cliErrors.map((err, i) => (
                                <div key={i} className="cli-error-item">
                                    <div className="cli-error-item-header">
                                        <div className="cli-error-item-title">{err.title}</div>
                                        <button
                                            className={`cli-error-copy${copiedIdx === i ? ' copied' : ''}`}
                                            title={t('copyToClipboard')}
                                            onClick={() => {
                                                navigator.clipboard.writeText(err.stderr)
                                                setCopiedIdx(i)
                                                setTimeout(() => setCopiedIdx(c => c === i ? null : c), 1500)
                                            }}
                                        >
                                            <i className={`bi ${copiedIdx === i ? 'bi-check-lg' : 'bi-clipboard'}`}></i>
                                        </button>
                                    </div>
                                    {err.hint && (
                                        <div className="cli-error-hint">
                                            <i className="bi bi-lightbulb-fill"></i>
                                            {err.hint}
                                        </div>
                                    )}
                                    <pre className="cli-error-log">{err.stderr}</pre>
                                </div>
                            ))}
                        </div>
                        <div className="cli-error-footer">
                            {cliErrors.length > 1 && (
                                <button
                                    className={`cli-error-copy-all${copiedIdx === 'all' ? ' copied' : ''}`}
                                    onClick={() => {
                                        const all = cliErrors.map((e, i) => `[${i + 1}] ${e.title}\n${e.stderr}`).join('\n\n')
                                        navigator.clipboard.writeText(all)
                                        setCopiedIdx('all')
                                        setTimeout(() => setCopiedIdx(c => c === 'all' ? null : c), 1500)
                                    }}
                                >
                                    <i className={`bi ${copiedIdx === 'all' ? 'bi-check-lg' : 'bi-clipboard'}`}></i>
                                    {copiedIdx === 'all' ? t('copied') : t('copyAll')}
                                </button>
                            )}
                            <button className="cli-error-dismiss" onClick={() => setCliErrors([])}>
                                {t('close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {ytdlFetchError && (
                <div className={`cli-error-overlay ${theme}`} onClick={() => setYtdlFetchError(null)}>
                    <div className="cli-error-popup" onClick={e => e.stopPropagation()}>
                        <div className="cli-error-header">
                            <i className="bi bi-exclamation-triangle-fill cli-error-icon"></i>
                            <span className="cli-error-title">{t('ytdlFetchErrorTitle')}</span>
                            <button className="cli-error-close" onClick={() => setYtdlFetchError(null)}>
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>
                        <div className="cli-error-body">
                            <div className="cli-error-item">
                                <p style={{ margin: 0, fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{ytdlFetchError}</p>
                            </div>
                        </div>
                        <div className="cli-error-footer">
                            <button className="cli-error-dismiss" onClick={() => { setYtdlFetchError(null); setShowCliConsole(true) }}>
                                <i className="bi bi-terminal"></i> {t('openConsole')}
                            </button>
                            <button className="cli-error-dismiss" onClick={() => setYtdlFetchError(null)}>
                                {t('close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showCliConsole && (
                <CliConsole
                    logs={cliLogs}
                    onClear={() => setCliLogs([])}
                    onClose={() => setShowCliConsole(false)}
                    theme={theme}
                />
            )}
            {showOnboarding && (
                <OnboardingScreen
                    theme={theme}
                    onDone={() => {
                        localStorage.setItem('gorex-onboarding-done', '1')
                        setShowOnboarding(false)
                    }}
                />
            )}
        </div>
    )
}

export default App
