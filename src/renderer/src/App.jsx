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
                downloadService: downloadService && typeof downloadService === 'object' ? downloadService : null
            }))
            setVideos(prev => {
                const updated = [...prev, ...newVideos]
                return updated
            })
            setView('list')
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

    const handleDownload = async (url, service) => {
        setIsLoading(true)
        setLoadingMessage({ title: t('loadingFetchingFormats'), subtitle: t('loadingRequestingInfo') })
        try {
            const info = await window.api.ytdlGetFormats(url)
            const safeOutputName = (info.title || 'video')
                .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
                .replace(/\.+$/, '')
                .trim() || 'video'

            // Pick best available format: highest resolution with video, deduped by height+codec
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

            const newVideo = {
                id: nextIdRef.current++,
                isYtdlItem: true,
                ytdlUrl: url,
                ytdlFormats: info.formats,
                ytdlSelectedFormat: bestFormatId,
                ytdlChapters: info.chapters || [],
                ytdlDuration: info.duration || 0,
                clipStart: null,
                clipEnd: null,
                title: info.title,
                outputName: safeOutputName,
                thumbnail: info.thumbnailUrl,
                status: 'format_select',
                progress: 0,
                downloadService: service,
                convertAfterDownload: false,
                conversionSettings: null,
                customSettings: null,
            }
            setVideos(prev => [...prev, newVideo])
            setView('list')
        } catch (err) {
            console.error('Failed to fetch yt-dlp formats:', err)
        } finally {
            setIsLoading(false)
            setLoadingMessage(null)
        }
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
        // Record all active job IDs so their cli-exit/ytdl-exit events are ignored
        videosRef.current
            .filter(v => ['encoding', 'downloading', 'converting'].includes(v.status))
            .forEach(v => stoppedJobsRef.current.add(v.id))
        window.api.stopAll()
        setIsEncoding(false)
        setIsPaused(false)
        setEncodingStartTime(null)
        progressStateRef.current.clear()
        setVideos(prev => prev.map(v =>
            ['encoding', 'downloading', 'converting'].includes(v.status)
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
            const paths = Array.from(e.dataTransfer.files).map(f => f.path)
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
            const paths = Array.from(e.dataTransfer.files).map(f => f.path)
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
                    ytdlDuration: v.ytdlDuration ?? null
                })
            } else {
                window.api.runCli({
                    filePath: v.path,
                    settings: v.customSettings || selectedSettings,
                    id: v.id,
                    outputMode,
                    customOutputDir: resolvedOutputDir,
                    outputName: v.outputName,
                    videoResolution: v.resolution
                })
            }
        })
    }

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

        window.api.onYtdlProgress(({ id, progress }) => {
            setVideos(prev => prev.map(v =>
                v.id === id
                    ? { ...v, progress, status: 'downloading', startTime: v.startTime ?? Date.now() }
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
                    if (!updated.some(v => ['encoding', 'downloading', 'converting'].includes(v.status))) {
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
                if (!updated.some(v => ['encoding', 'downloading', 'converting'].includes(v.status))) {
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
