import { detectService } from './features/queue/downloadServices'
import { errorMessage, type AppConfig, type DownloadService, type EncodingSettings, type OutputMode, type SettingsTab, type Theme, type ThemeMode, type UpdateInfo, type VideoTask, type View } from './domain'
import type { TaskId } from './queueState'
import { useDownloadQueue } from './features/queue/useDownloadQueue'
import { useTwitchChat } from './features/twitch/useTwitchChat'
import { appStorage } from './storage'
import { useJobQueue } from './features/queue/useJobQueue'
import { isDownloadItem } from './features/queue/queueItem'
import { useToolUpdates } from './features/tools/useToolUpdates'
import { useState, useEffect, useRef, type DragEvent } from 'react'
import { getCurrentWebview } from '@tauri-apps/api/webview'
import TitleBar from './components/TitleBar/TitleBar'
import CliConsole from './components/CliConsole/CliConsole'
import CliErrorDialog from './components/CliErrorDialog/CliErrorDialog'
import TwitchChatViewer from './components/TwitchChatViewer'
import { useLanguage } from './i18n'
import SourcePage from './pages/SourcePage/SourcePage'
import ListPage from './pages/ListPage/ListPage'
import AboutPage from './pages/AboutPage/AboutPage'
import SettingsPage from './pages/SettingsPage/SettingsPage'
import OnboardingScreen from './components/OnboardingScreen/OnboardingScreen'
import WhatsNewDialog from './components/WhatsNewDialog/WhatsNewDialog'
import { initDefaultSettings, saveGpuVendor, getDefaultSettingsForGpu, normalizeEncoderSettings } from './components/GlobalSettings/GlobalSettings'
import gradientPPL from './assets/images/Gradient_PPL.webm'
import gradientBlack from './assets/images/Gradient_Black.webm'
import gradientWhite from './assets/images/Gradient_White.webm'

const WHATS_NEW_STORAGE_KEY = 'gorex-whats-new-version'

function App() {
    const { t, lang } = useLanguage()
    const isMac = window.api.platform === 'darwin'
    const [view, setView] = useState<View>('source')
    const [settingsInitialTab, setSettingsInitialTab] = useState<SettingsTab>('app')
    const [videos, setVideos] = useState<VideoTask[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const [isDraggingOnList, setIsDraggingOnList] = useState(false)
    const [selectedSettings, setSelectedSettings] = useState(() => initDefaultSettings())
    const [showCliConsole, setShowCliConsole] = useState(false)
    const [ytdlFetchError, setYtdlFetchError] = useState<string | null>(null)
    const pendingAutoStartRef = useRef(false)

    const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
        const saved = appStorage.getItem('theme')
        return (saved === 'dark' || saved === 'light') ? saved : 'auto'
    })
    const [theme, setTheme] = useState<Theme>(() => {
        const saved = appStorage.getItem('theme')
        if (saved === 'dark' || saved === 'light') return saved
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    })
    const [accentTheme, setAccentTheme] = useState(() => {
        const saved = appStorage.getItem('gorex-accent-theme')
        // migrate old 'black' value to 'white'
        if (saved === 'black') return 'white'
        return saved || 'purple'
    })
    const [isLoading, setIsLoading] = useState(false)
    const [loadingMessage, setLoadingMessage] = useState<{ type?: string; title?: string; subtitle?: string } | null>(null)
    const [customOutputDir, setCustomOutputDir] = useState('')
    const [outputMode, setOutputMode] = useState<OutputMode>('default')
    // User-configured folder (from settings/onboarding) OR system Videos fallback
    const [defaultOutputDir, setDefaultOutputDir] = useState(() => {
        try {
            const s = JSON.parse(appStorage.getItem('gorex-app-config') || '{}') as AppConfig
            return s.defaultOutputDir || s.defaultCustomOutputDir || ''
        } catch { return '' }
    })
    const [appSettings, setAppSettings] = useState<AppConfig | null>(null)
    const [gpuVendor, setGpuVendor] = useState('unknown')
    const [systemPlatform, setSystemPlatform] = useState(() => window.api.platform || 'unknown')
    const [showOnboarding, setShowOnboarding] = useState(() => !appStorage.getItem('gorex-onboarding-done'))
    const [appVersion, setAppVersion] = useState('')
    const [showWhatsNew, setShowWhatsNew] = useState(false)
    const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
    const nextIdRef = useRef(0)
    useEffect(() => { for (const video of videos) if (typeof video.id === 'number') nextIdRef.current = Math.max(nextIdRef.current, video.id + 1) }, [videos])
    const listDragCounter = useRef(0)
    const { isEncoding, isPaused, encodingStartTime, cliErrors, cliLogs, setCliErrors, setCliLogs,
        appendLog, startEncoding, startPendingBatch, handlePause, handleStop } = useJobQueue({
        videos, setVideos, settings: selectedSettings, outputMode,
        outputDir: outputMode === 'default' ? defaultOutputDir : customOutputDir, t, onRecovered: () => setView('list'),
    })
    const { tool: ytdlTool, update: handleUpdateYtdl, refresh: refreshYtdlToolInfo } = useToolUpdates('ytdl', isEncoding, t)
    const { tool: twitchTool, update: handleUpdateTwitch, refresh: refreshTwitchToolInfo } = useToolUpdates('twitch', isEncoding, t)
    const { twitchChannelPicker, setTwitchChannelPicker, handleDownload, handleDownloadCancel, handleTwitchCancel,
        handleYtdlFormatChange, handleYtdlConvertToggle, handleYtdlConversionSettings, handleYtdlClipChange,
        handleLocalClipChange, handleYtdlOptionsChange, handleTwitchAddChannelVideos, handleTwitchConvertToggle,
        handleTwitchQualityChange } = useDownloadQueue({ onAutoStart: () => { pendingAutoStartRef.current = true }, selectedSettings, appSettings, t, setView, setVideos,
        nextIdRef, setIsLoading, setLoadingMessage, appendLog, setYtdlFetchError })
    const { twitchChatViewer, twitchChatQuery, setTwitchChatQuery, twitchChatExporting, handleTwitchOpenChat,
        handleTwitchLoadFullChat, handleTwitchCloseChat, handleTwitchRetryChat, handleTwitchExportChat } = useTwitchChat(
        t, outputMode === 'default' ? defaultOutputDir : customOutputDir,
        error => setCliErrors(previous => [...previous, error]))


    useEffect(() => {
        let cancelled = false
        window.api.getAppVersion()
            .then(version => {
                if (cancelled) return
                const cleanVersion = String(version || '').trim()
                if (!cleanVersion) return
                setAppVersion(cleanVersion)
                if (appStorage.getItem(WHATS_NEW_STORAGE_KEY) !== cleanVersion) {
                    setShowWhatsNew(true)
                }
            })
            .catch(() => {})
        return () => { cancelled = true }
    }, [])

    // Auto-start encoding when extension adds a video with autoStart flag
    useEffect(() => {
        if (!pendingAutoStartRef.current) return
        if (videos.length === 0) return
        if (isEncoding) return
        pendingAutoStartRef.current = false
        void startPendingBatch()
    }, [videos, isEncoding]) // eslint-disable-line react-hooks/exhaustive-deps

    const loadAndAddVideos = async (paths: string[], downloadService: DownloadService | null = null) => {
        if (!paths || paths.length === 0) return
        setIsLoading(true)
        setLoadingMessage({ type: 'videodata' })
        try {
            const data = await window.api.getVideoData(paths)
            if (data === null) return // cancelled
            const newVideos: VideoTask[] = data.map(v => ({
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
            setLoadingMessage(null)
        }
    }

    const addDroppedFilesRef = useRef(loadAndAddVideos)
    addDroppedFilesRef.current = loadAndAddVideos
    useEffect(() => {
        if (!('__TAURI_INTERNALS__' in window)) return undefined
        let active = true
        let unlisten: (() => void) | undefined
        getCurrentWebview().onDragDropEvent(event => {
            if (!active) return
            if (event.payload.type === 'over') {
                setIsDragging(true)
                setIsDraggingOnList(true)
            } else {
                setIsDragging(false)
                setIsDraggingOnList(false)
                if (event.payload.type === 'drop') void addDroppedFilesRef.current(event.payload.paths)
            }
        }).then(stop => { if (active) unlisten = stop; else stop() })
            .catch(error => console.error('Could not listen for file drops:', error))
        return () => { active = false; unlisten?.() }
    }, [])

    const handleVideoDataCancel = () => {
        window.api.cancelVideoData()
        setIsLoading(false)
        setLoadingMessage(null)
    }

    const handleSelectFiles = async () => {
        try {
            const paths = await window.api.selectFiles()
            if (paths && paths.length > 0) await loadAndAddVideos(paths)
        } catch (err) {
            console.error('Failed to select files:', err)
        }
    }

    const handleRemoveVideo = (id: TaskId) => {
        if (isEncoding) return
        if ('__TAURI_INTERNALS__' in window) void window.api.removeQueueItems([id]).catch(error => appendLog({ type: 'err', text: errorMessage(error) }))
        setVideos(prev => {
            const updated = prev.filter(v => v.id !== id)
            if (updated.length === 0) setView('source')
            return updated
        })
    }

    const handleClearQueue = () => {
        if (isEncoding) return
        if ('__TAURI_INTERNALS__' in window) void window.api.removeQueueItems(videos.map(video => video.id)).catch(error => appendLog({ type: 'err', text: errorMessage(error) }))
        setVideos([])
        setView('source')
    }

    const handleRenameOutput = (id: TaskId, newName: string) => {
        setVideos(prev => prev.map(v => v.id === id ? { ...v, outputName: newName } : v))
    }

    const handleVideoSettingsChange = (id: TaskId, settings: EncodingSettings | null) => {
        setVideos(prev => prev.map(v => v.id === id ? { ...v, customSettings: settings ? normalizeEncoderSettings(settings) : null } : v))
    }

    const toggleTheme = () => {
        setTheme(prev => {
            const next = prev === 'dark' ? 'light' : 'dark'
            appStorage.setItem('theme', next)
            setThemeMode(next)
            return next
        })
    }

    const handleSetThemeMode = (mode: ThemeMode) => {
        setThemeMode(mode)
        if (mode === 'auto') {
            appStorage.removeItem('theme')
            const sys = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
            setTheme(sys)
        } else {
            appStorage.setItem('theme', mode)
            setTheme(mode)
        }
    }

    const handleSetAccentTheme = (accent: string) => {
        setAccentTheme(accent)
        appStorage.setItem('gorex-accent-theme', accent)
    }

    useEffect(() => {
        if (themeMode !== 'auto') return
        const mq = window.matchMedia('(prefers-color-scheme: dark)')
        const handler = (e: MediaQueryListEvent) => setTheme(e.matches ? 'dark' : 'light')
        mq.addEventListener('change', handler)
        return () => mq.removeEventListener('change', handler)
    }, [themeMode])

    const handleViewChange = (newView: View) => {
        setView(newView)
    }

    const handleSaveSettings = async (encodingSettings: EncodingSettings, appConfig: AppConfig) => {
        const cleanAppConfig = { ...(appConfig || {}) }
        const normalizedEncodingSettings = normalizeEncoderSettings(encodingSettings)
        delete cleanAppConfig.ytdlDeepFormatSearch
        // Persist encoding defaults
        appStorage.setItem('gorex-default-settings', JSON.stringify(normalizedEncodingSettings))
        setSelectedSettings(normalizedEncodingSettings)
        // Persist app config (renderer-side)
        appStorage.setItem('gorex-app-config', JSON.stringify(cleanAppConfig))
        // User-set folder becomes the new default; fall back to system Videos if cleared
        if (cleanAppConfig.defaultOutputDir) {
            setDefaultOutputDir(cleanAppConfig.defaultOutputDir)
        } else {
            window.api.getDefaultOutputDir().then(dir => setDefaultOutputDir(dir))
        }
        // Persist to file (main process reads CLI path from here)
        await window.api.saveAppSettings(cleanAppConfig)
        setAppSettings(cleanAppConfig)
    }

    const handleOutputDirChange = async (dir: string) => {
        const existing = JSON.parse(appStorage.getItem('gorex-app-config') || '{}') as AppConfig
        const existingConfig = { ...existing }
        delete existingConfig.ytdlDeepFormatSearch
        const updated = { ...existingConfig, defaultOutputDir: dir || '' }
        appStorage.setItem('gorex-app-config', JSON.stringify(updated))
        await window.api.saveAppSettings(updated)
        setAppSettings(prev => ({ ...(prev || {}), defaultOutputDir: dir || '' }))
        if (dir) {
            setDefaultOutputDir(dir)
        } else {
            // After save completes, main process will now return system Videos
            window.api.getDefaultOutputDir().then(d => setDefaultOutputDir(d))
        }
    }

    const handleOpenYtdlSettings = () => {
        setSettingsInitialTab('updates')
        handleViewChange('settings')
    }

    const handleDismissWhatsNew = () => {
        if (appVersion) {
            appStorage.setItem(WHATS_NEW_STORAGE_KEY, appVersion)
        }
        setShowWhatsNew(false)
    }

    useEffect(() => {
        if (!showWhatsNew) return undefined
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') handleDismissWhatsNew()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [showWhatsNew, appVersion])

    const handleOutputModeChange = async (mode: OutputMode) => {
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

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(false)
        if ('__TAURI_INTERNALS__' in window) return
        if (e.dataTransfer.files.length > 0) {
            const paths = Array.from(e.dataTransfer.files).map(f => window.electron?.webUtils?.getPathForFile(f)).filter((path): path is string => Boolean(path))
            loadAndAddVideos(paths)
        }
    }

    const handleListDragEnter = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        listDragCounter.current++
        setIsDraggingOnList(true)
    }

    const handleListDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        listDragCounter.current--
        if (listDragCounter.current === 0) setIsDraggingOnList(false)
    }

    const handleListDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
    }

    const handleListDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        listDragCounter.current = 0
        setIsDraggingOnList(false)
        if ('__TAURI_INTERNALS__' in window) return
        if (e.dataTransfer.files.length > 0) {
            const paths = Array.from(e.dataTransfer.files).map(f => window.electron?.webUtils?.getPathForFile(f)).filter((path): path is string => Boolean(path))
            loadAndAddVideos(paths)
        }
    }

    useEffect(() => {
        window.api.checkForUpdates().then(info => { if (info) setUpdateInfo(info) }).catch(() => {})
    }, [])
    const extensionHandlers = useRef({ handleDownload, handleRemoveVideo })
    extensionHandlers.current = { handleDownload, handleRemoveVideo }
    // ─── Chrome extension integration ─────────────────────────────────────────────
    useEffect(() => {
        return window.api.onExtensionAddToQueue(async (data) => {
            const { url, formatId, audioOnly, clipStart, clipEnd, convertAfterDownload } = data
            if (!url) return
            // Detect service
            let service = null
            try {
                const host = new URL(url).hostname.replace(/^www\./, '')
                service = detectService(url)
            } catch {}
            try {
                await extensionHandlers.current.handleDownload(url, service, { preselectedFormat: formatId, audioOnly, clipStart, clipEnd, convertAfterDownload, autoStart: true })
            } catch { pendingAutoStartRef.current = false }
        })
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Extension: remove queue item ─────────────────────────────────────────────
    useEffect(() => {
        return window.api.onExtensionRemoveFromQueue((data) => {
            if (data?.id != null) extensionHandlers.current.handleRemoveVideo(data.id)
        })
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Sync queue state to main process so the extension API can report it
    useEffect(() => {
        const summary = videos.map(v => ({
            id: v.id,
            title: v.title || v.outputName || '',
            status: v.status,
            progress: v.progress || 0,
            url: v.ytdlUrl || v.twitchUrl || null,
        }))
        window.api.extensionUpdateQueue(summary)
    }, [videos])

    useEffect(() => {
        // Fall back to system Videos only if user hasn't configured a folder
        window.api.getDefaultOutputDir().then(dir => setDefaultOutputDir(prev => prev || dir))
        window.api.getAppSettings().then(s => { if (s) setAppSettings(s) })
        window.api.getGpuInfo().then(info => {
            if (info && info.vendor) {
                const accelerationVendor = info.accelerationVendor || info.vendor
                setGpuVendor(accelerationVendor)
                setSystemPlatform(info.platform || 'unknown')
                saveGpuVendor(accelerationVendor)
                // Apply GPU-specific encoder only if user has no saved settings
                const hasSaved = !!appStorage.getItem('gorex-default-settings')
                if (!hasSaved) {
                    setSelectedSettings(getDefaultSettingsForGpu(accelerationVendor))
                } else if (info.platform === 'darwin') {
                    // Hardware decoding has no alternate backend on macOS, and
                    // hardware encoders from other platforms cannot run there.
                    setSelectedSettings(prev => {
                        const unsupportedEncoder = /^(nvenc_|qsv_|vce_|mf_)/.test(prev.encoder || '')
                        const fallback = getDefaultSettingsForGpu('apple')
                        return normalizeEncoderSettings({
                            ...prev,
                            hwDecoding: 'videotoolbox',
                            ...(unsupportedEncoder
                                ? { encoder: fallback.encoder, encoderSpeed: fallback.encoderSpeed, multiPass: false }
                                : {}),
                            ...((prev.encoder || '').startsWith('vt_') ? { multiPass: false } : {}),
                        })
                    })
                }
            }
        }).catch(() => {})
    }, [])

    useEffect(() => {
        document.body.className = theme
        document.body.setAttribute('data-accent', accentTheme)
    }, [theme, accentTheme])

    const handleOpenOutputLocation = async (outputPath: string) => {
        if (!outputPath) return
        try {
            await window.api.openOutputLocation(outputPath)
        } catch (err) {
            console.error('Failed to open output location:', err)
        }
    }

    const macMenuHandlersRef = useRef<Record<string, () => void | Promise<void>>>({})
    macMenuHandlersRef.current = {
        'open-source': () => {
            setView('source')
            handleSelectFiles()
        },
        'clear-queue': handleClearQueue,
        'start-encoding': startEncoding,
        'toggle-pause': handlePause,
        stop: handleStop,
        'debug-console': () => setShowCliConsole(value => !value),
        settings: () => setView('settings'),
        about: () => setView('about'),
    }

    useEffect(() => {
        if (!isMac || !window.api.onNativeMenuAction) return undefined
        return window.api.onNativeMenuAction(action => macMenuHandlersRef.current[action]?.())
    }, [isMac])

    useEffect(() => {
        if (!isMac || !window.api.updateNativeMenu) return
        window.api.updateNativeMenu({
            hasVideos: videos.length > 0,
            isEncoding,
            isPaused,
            labels: {
                file: t('menuFile'),
                settings: t('navSettings'),
                about: t('navAbout'),
                openSource: t('menuOpenSource'),
                clearQueue: t('menuClearQueue'),
                startEncoding: t('menuStartEncoding'),
                pause: t('menuPause'),
                resume: t('menuResume'),
                stop: t('menuStop'),
                debugConsole: t('menuDebugConsole'),
                exit: t('menuExit'),
            },
        })
    }, [isMac, lang, videos.length, isEncoding, isPaused, t])

    const renderPage = () => {
        switch (view) {
            case 'about':
                return (
                    <AboutPage
                        theme={theme}
                        appVersion={appVersion}
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
                        onOutputDirChange={handleOutputDirChange}
                        initialTab={settingsInitialTab}
                        ytdlTool={ytdlTool}
                        onUpdateYtdl={handleUpdateYtdl}
                        onRefreshYtdl={refreshYtdlToolInfo}
                        twitchTool={twitchTool}
                        onUpdateTwitch={handleUpdateTwitch}
                        onRefreshTwitch={refreshTwitchToolInfo}
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
                        systemPlatform={systemPlatform}
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
                        onOpenOutputLocation={handleOpenOutputLocation}
                        onOpenSettings={(tab) => { setSettingsInitialTab(tab || 'app'); handleViewChange('settings') }}
                        twitchChannelPicker={twitchChannelPicker}
                        onTwitchAddChannelVideos={handleTwitchAddChannelVideos}
                        onTwitchCloseChannelPicker={() => setTwitchChannelPicker(null)}
                        onTwitchOpenChat={handleTwitchOpenChat}
                        onTwitchConvertToggle={handleTwitchConvertToggle}
                        onTwitchQualityChange={handleTwitchQualityChange}
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
                        isLoading={isLoading}
                    />
                )
        }
    }

    return (
        <div className={`app-wrapper ${theme}${isMac ? ' platform-mac' : ''}`}>
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
                ytdlTool={ytdlTool}
                twitchTool={twitchTool}
                onOpenYtdlSettings={handleOpenYtdlSettings}
            />
            {updateInfo && (
                <div className={`update-popup ${theme}`}>
                    <button className="update-popup-close" onClick={() => setUpdateInfo(null)}>
                        <i className="bi bi-x"></i>
                    </button>
                    <div className="update-popup-icon">
                        <i className="bi bi-arrow-up-circle-fill"></i>
                    </div>
                    <div className="update-popup-title">{t('updateAvailable').replace('{v}', updateInfo.latestVersion || '')}</div>
                    <div className="update-popup-sub">{t('updateSub')}</div>
                    <button
                        className="update-popup-btn"
                        onClick={() => window.api.openExternal(updateInfo.downloadUrl || 'https://github.com/Gor80hd/Gorex/releases/latest')}
                    >
                        <i className="bi bi-download"></i> {t('updateDownload')}
                    </button>
                </div>
            )}
            {showWhatsNew && !showOnboarding && (
                <WhatsNewDialog theme={theme} version={appVersion || '3.0.0'} onDismiss={handleDismissWhatsNew} />
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
                        {(loadingMessage?.title === t('loadingFetchingFormats') || loadingMessage?.type === 'videodata' || loadingMessage?.type === 'twitch') && (
                            <button className="loading-cancel-btn" onClick={loadingMessage?.type === 'videodata' ? handleVideoDataCancel : loadingMessage?.type === 'twitch' ? handleTwitchCancel : handleDownloadCancel}>
                                {t('loadingCancel')}
                            </button>
                        )}
                    </div>
                </div>
            )}
            <TwitchChatViewer
                theme={theme}
                viewer={twitchChatViewer}
                query={twitchChatQuery}
                onQueryChange={setTwitchChatQuery}
                onClose={handleTwitchCloseChat}
                onExport={handleTwitchExportChat}
                onLoadFull={handleTwitchLoadFullChat}
                onRetry={handleTwitchRetryChat}
                exporting={twitchChatExporting}
                t={t}
            />
            {cliErrors.length > 0 && (
                <CliErrorDialog errors={cliErrors} theme={theme} onDismiss={() => setCliErrors([])} />
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
                    themeMode={themeMode}
                    accentTheme={accentTheme}
                    onThemeModeChange={handleSetThemeMode}
                    onAccentThemeChange={handleSetAccentTheme}
                    onDone={(settings) => {
                        if (settings) {
                            const newAppSettings = {
                                defaultOutputDir: settings.outputDir || '',
                                backgroundMode: settings.backgroundMode !== false,
                            }
                            window.api.saveAppSettings(newAppSettings)
                            window.api.setBackgroundMode(newAppSettings.backgroundMode)
                            setAppSettings(prev => ({ ...(prev || {}), ...newAppSettings }))
                            // Sync outputDir to appStorage and session state
                            const existingConfig = JSON.parse(appStorage.getItem('gorex-app-config') || '{}') as AppConfig
                            const cleanExistingConfig = { ...existingConfig }
                            delete cleanExistingConfig.ytdlDeepFormatSearch
                            appStorage.setItem('gorex-app-config', JSON.stringify({ ...cleanExistingConfig, ...newAppSettings }))
                            if (settings.outputDir) {
                                setDefaultOutputDir(settings.outputDir)
                            }
                            if (settings.encoder) {
                                const cur = JSON.parse(appStorage.getItem('gorex-default-settings') || '{}')
                                const updated = normalizeEncoderSettings({ ...cur, encoder: settings.encoder })
                                appStorage.setItem('gorex-default-settings', JSON.stringify(updated))
                                setSelectedSettings(prev => normalizeEncoderSettings({ ...prev, encoder: settings.encoder || prev.encoder }))
                            }
                        }
                        appStorage.setItem('gorex-onboarding-done', '1')
                        setShowOnboarding(false)
                    }}
                />
            )}
        </div>
    )
}

export default App
