import { useState, useEffect, useRef } from 'react'
import TitleBar from './components/TitleBar/TitleBar'
import SourcePage from './pages/SourcePage/SourcePage'
import ListPage from './pages/ListPage/ListPage'
import AboutPage from './pages/AboutPage/AboutPage'
import SettingsPage from './pages/SettingsPage/SettingsPage'
import { DEFAULT_SETTINGS, initDefaultSettings, saveGpuVendor, getDefaultSettingsForGpu } from './components/GlobalSettings/GlobalSettings'

function getEncoderErrorHint(stderr) {
    if (/No capable devices found/i.test(stderr)) {
        if (/av1_nvenc/i.test(stderr)) return 'Ваш GPU не поддерживает AV1 NVENC.'
        if (/h265_nvenc|hevc_nvenc/i.test(stderr)) return 'Ваш GPU не поддерживает H.265 NVENC.'
        if (/nvenc/i.test(stderr)) return 'Ваш GPU не поддерживает выбранный NVENC-кодировщик.'
        if (/av1_amf|av1_vce/i.test(stderr)) return 'Ваш GPU не поддерживает AV1 VCE.'
        if (/av1_qsv/i.test(stderr)) return 'Ваш GPU не поддерживает AV1 QSV.'
        return 'Выбранный аппаратный кодировщик недоступен на данном GPU.'
    }
    if (/avcodec_open failed|Failure to initialise thread/i.test(stderr)) {
        if (/nvenc/i.test(stderr)) return 'Не удалось инициализировать NVENC. Убедитесь, что драйверы NVIDIA актуальны.'
        if (/qsv/i.test(stderr)) return 'Не удалось инициализировать Intel QSV. Проверьте драйверы Intel.'
        if (/vce|amf/i.test(stderr)) return 'Не удалось инициализировать AMD VCE/AMF. Проверьте драйверы AMD.'
    }
    return null
}

function App() {
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
    const videosRef = useRef([])
    // Spike filter: tracks per-video { current, pending } to ignore one-time forward jumps
    const progressStateRef = useRef(new Map())
    const [themeMode, setThemeMode] = useState(() => {
        const saved = localStorage.getItem('theme')
        return (saved === 'dark' || saved === 'light') ? saved : 'auto'
    })
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('theme')
        if (saved === 'dark' || saved === 'light') return saved
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    })
    const [isLoading, setIsLoading] = useState(false)
    const [outputMode, setOutputMode] = useState('default')
    const [customOutputDir, setCustomOutputDir] = useState(() => {
        try {
            const s = JSON.parse(localStorage.getItem('bpress-app-config') || '{}')
            return s.defaultOutputDir || s.defaultCustomOutputDir || ''
        } catch { return '' }
    })
    const [defaultOutputDir, setDefaultOutputDir] = useState('')
    const [appSettings, setAppSettings] = useState(null)
    const [gpuVendor, setGpuVendor] = useState('unknown')
    const nextIdRef = useRef(0)
    const listDragCounter = useRef(0)

    useEffect(() => { videosRef.current = videos }, [videos])

    const loadAndAddVideos = async (paths) => {
        if (!paths || paths.length === 0) return
        setIsLoading(true)
        try {
            const data = await window.api.getVideoData(paths)
            const newVideos = data.map(v => ({
                ...v,
                id: nextIdRef.current++,
                progress: 0,
                status: 'ready',
                customSettings: null
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
        window.api.stopAll()
        setIsEncoding(false)
        setIsPaused(false)
        setEncodingStartTime(null)
        progressStateRef.current.clear()
        setVideos(prev => prev.map(v =>
            v.status === 'encoding' ? { ...v, status: 'ready', progress: 0, startTime: null, endTime: null } : v
        ))
    }

    const handleViewChange = (newView) => {
        setView(newView)
    }

    const handleSaveSettings = async (encodingSettings, appConfig) => {
        // Persist encoding defaults
        localStorage.setItem('bpress-default-settings', JSON.stringify(encodingSettings))
        setSelectedSettings(encodingSettings)
        // Persist app config (renderer-side)
        localStorage.setItem('bpress-app-config', JSON.stringify(appConfig))
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
                ? { ...v, progress: 0, status: 'ready', startTime: null, endTime: null }
                : v
        ))
        const resolvedOutputDir = outputMode === 'default' ? defaultOutputDir : customOutputDir
        videos.forEach(v => {
            window.api.runCli({
                filePath: v.path,
                settings: v.customSettings || selectedSettings,
                id: v.id,
                outputMode,
                customOutputDir: resolvedOutputDir,
                outputName: v.outputName,
                videoResolution: v.resolution
            })
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
                const hasSaved = !!localStorage.getItem('bpress-default-settings')
                if (!hasSaved) {
                    setSelectedSettings(getDefaultSettingsForGpu(info.vendor))
                }
            }
        }).catch(() => {})
    }, [])

    useEffect(() => {
        document.body.className = theme
    }, [theme])

    useEffect(() => {
        window.api.onCliProgress(({ id, progress }) => {
            const ps = progressStateRef.current
            const state = ps.get(id) || { current: 0, pending: null }
            const SPIKE_THRESHOLD = 20 // jumps > 20% in one step are potential scan-phase spikes

            if (state.pending !== null) {
                // Had a deferred spike — next update resolves it; apply the new value (allow rollback)
                const resolved = progress
                ps.set(id, { current: resolved, pending: null })
                setVideos(prev => prev.map(v =>
                    v.id === id
                        ? { ...v, progress: resolved, status: 'encoding', startTime: v.startTime ?? Date.now() }
                        : v
                ))
            } else if (progress > state.current + SPIKE_THRESHOLD && progress < 99.5) {
                // Large one-time jump — defer until next update to confirm it's real
                ps.set(id, { current: state.current, pending: progress })
            } else {
                // Normal update — apply directly (rollbacks are allowed)
                ps.set(id, { current: progress, pending: null })
                setVideos(prev => prev.map(v =>
                    v.id === id
                        ? { ...v, progress, status: 'encoding', startTime: v.startTime ?? Date.now() }
                        : v
                ))
            }
        })

        window.api.onCliExit(({ id, code, stderr }) => {
            progressStateRef.current.delete(id)
            setVideos(prev => {
                const updated = prev.map(v => v.id === id
                    ? { ...v, progress: 100, status: code === 0 ? 'done' : 'error', endTime: Date.now() }
                    : v
                )
                if (!updated.some(v => v.status === 'encoding')) {
                    setIsEncoding(false)
                    setEncodingStartTime(null)
                }
                return updated
            })
            if (code !== 0) {
                const v = videosRef.current.find(v => v.id === id)
                const title = v ? (v.title || v.path?.split(/[\/\\]/).pop() || 'Неизвестный файл') : 'Неизвестный файл'
                const hint = getEncoderErrorHint(stderr || '')
                setCliErrors(prev => [...prev, { title, stderr: (stderr || '').trim() || '(нет вывода)', hint }])
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
                        onRemoveVideo={handleRemoveVideo}
                        onClearQueue={handleClearQueue}
                        onRenameOutput={handleRenameOutput}
                        onVideoSettingsChange={handleVideoSettingsChange}
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
            />
            <main className="container">
                {renderPage()}
            </main>
            {isLoading && (
                <div className={`loading-overlay ${theme}`}>
                    <div className="loading-popup">
                        <div className="loading-popup-title">Анализ файлов...</div>
                        <div className="loading-popup-subtitle">Считываем метаданные видео</div>
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
                                {cliErrors.length === 1 ? 'Ошибка кодирования' : `Ошибки кодирования (${cliErrors.length})`}
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
                                            title="Копировать"
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
                                    {copiedIdx === 'all' ? 'Скопировано' : 'Копировать всё'}
                                </button>
                            )}
                            <button className="cli-error-dismiss" onClick={() => setCliErrors([])}>
                                Закрыть
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default App
