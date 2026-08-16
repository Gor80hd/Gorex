import { useState, useEffect, useRef } from 'react'
import TitleBar from './components/TitleBar/TitleBar'
import CliConsole from './components/CliConsole/CliConsole'
import { useLanguage } from './i18n'
import { getMissingToolStatus, isToolUpdateAlreadyRunningError, shouldAutoDownloadMissingTool, shouldAutoUpdateExistingTool } from './toolAutoUpdatePolicy.mjs'

// Register CLI output IPC listeners at module level so they survive HMR without
// needing useEffect to re-run. The callback ref is wired inside the component.
const _cliLogEmitter = { callback: null }
window.api.onCliOutput(data => _cliLogEmitter.callback?.({ type: 'out', text: data }))
window.api.onCliError(data => _cliLogEmitter.callback?.({ type: 'err', text: data }))
window.api.onYtdlOutput(({ data }) => _cliLogEmitter.callback?.({ type: 'ytdl', text: data }))
window.api.onTwitchOutput?.(({ data }) => _cliLogEmitter.callback?.({ type: 'twitch', text: data }))
import SourcePage from './pages/SourcePage/SourcePage'
import ListPage from './pages/ListPage/ListPage'
import AboutPage from './pages/AboutPage/AboutPage'
import SettingsPage from './pages/SettingsPage/SettingsPage'
import OnboardingScreen from './components/OnboardingScreen/OnboardingScreen'
import { initDefaultSettings, saveGpuVendor, getDefaultSettingsForGpu, normalizeEncoderSettings } from './components/GlobalSettings/GlobalSettings'
import gradientPPL from './assets/images/Gradient_PPL.webm'
import gradientBlack from './assets/images/Gradient_Black.webm'
import gradientWhite from './assets/images/Gradient_White.webm'

function getEncoderErrorHint(stderr, t) {
    if (/videotoolbox|compression session.*-\d+/i.test(stderr)) {
        return t('gpuErrHwUnavailable')
    }
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

const YTDL_STAGE_LABELS = {
    preparing: 'ytdlUpdateStagePreparing',
    connecting: 'ytdlUpdateStageConnecting',
    downloading: 'ytdlUpdateStageDownloading',
    downloaded: 'ytdlUpdateStageDownloaded',
    verifying: 'ytdlUpdateStageVerifying',
    installing: 'ytdlUpdateStageInstalling',
    done: 'ytdlUpdateStageDone',
    error: 'ytdlUpdateStageError',
}

const WHATS_NEW_STORAGE_KEY = 'gorex-whats-new-version'

const WHATS_NEW_ITEMS = [
    { icon: 'bi-twitch', titleKey: 'whatsNewTwitchTitle', textKey: 'whatsNewTwitchText' },
    { icon: 'bi-chat-square-text-fill', titleKey: 'whatsNewChatPreviewTitle', textKey: 'whatsNewChatPreviewText' },
    { icon: 'bi-arrow-down-circle-fill', titleKey: 'whatsNewReliableDownloadsTitle', textKey: 'whatsNewReliableDownloadsText' },
    { icon: 'bi-sliders', titleKey: 'whatsNewQueueSettingsTitle', textKey: 'whatsNewQueueSettingsText' },
    { icon: 'bi-arrow-repeat', titleKey: 'whatsNewToolsTitle', textKey: 'whatsNewToolsText' },
]

function createYtdlToolState(overrides = {}) {
    return {
        status: 'checking',
        info: null,
        latest: null,
        progress: null,
        receivedBytes: 0,
        totalBytes: 0,
        stageMessage: '',
        message: '',
        ...overrides,
    }
}

function createTwitchToolState(overrides = {}) {
    return {
        status: 'checking',
        info: null,
        latest: null,
        progress: null,
        receivedBytes: 0,
        totalBytes: 0,
        stageMessage: '',
        message: '',
        ...overrides,
    }
}

function isTwitchUrl(raw) {
    try {
        const host = new URL(raw).hostname.replace(/^www\./, '').replace(/^m\./, '').toLowerCase()
        return host === 'twitch.tv' || host === 'clips.twitch.tv'
    } catch {
        return false
    }
}

function isDownloadItem(video) {
    return !!(video?.isYtdlItem || video?.isTwitchItem)
}

function getTwitchQualityLabel(options, value) {
    const list = Array.isArray(options) ? options : []
    const found = list.find(option => option?.value === value)
    return found?.label || value || ''
}

function normalizeTwitchQualityOptions(options) {
    const clean = Array.isArray(options) ? options.filter(option => option?.value && option?.label) : []
    return clean.length ? clean : [{ value: 'Source', label: 'Source', source: true }]
}

function normalizeTwitchSelectedQuality(info) {
    const options = normalizeTwitchQualityOptions(info?.qualityOptions)
    const selected = info?.twitchQuality || options[0]?.value || 'Source'
    return {
        options,
        selected,
        label: getTwitchQualityLabel(options, selected),
    }
}

function normalizeTwitchToolVersion(version) {
    const text = String(version || '').trim().replace(/^TwitchDownloader(?:CLI)?\s*/i, '').replace(/^v/i, '')
    const match = text.match(/\d+(?:\.\d+)+(?:[-+][0-9A-Za-z.-]+)?/)
    return match ? match[0].split('+')[0] : ''
}

function compareTwitchToolVersions(a, b) {
    const pa = normalizeTwitchToolVersion(a).split(/[.-]/).map(part => Number.parseInt(part, 10) || 0)
    const pb = normalizeTwitchToolVersion(b).split(/[.-]/).map(part => Number.parseInt(part, 10) || 0)
    const len = Math.max(pa.length, pb.length)
    for (let i = 0; i < len; i += 1) {
        const diff = (pa[i] || 0) - (pb[i] || 0)
        if (diff !== 0) return diff > 0 ? 1 : -1
    }
    return 0
}

function isTwitchToolUpdateAvailable(currentVersion, latestVersion) {
    if (!currentVersion || !latestVersion) return false
    return compareTwitchToolVersions(latestVersion, currentVersion) > 0
}

function TwitchChatViewer({ theme, viewer, query, onQueryChange, onClose, onExport, onLoadFull, onRetry, exporting, t }) {
    if (!viewer) return null
    const allMessages = Array.isArray(viewer.messages) ? viewer.messages : []
    const q = query.trim().toLowerCase()
    const messages = q
        ? allMessages.filter(message => (`${message.timeLabel} ${message.username} ${message.body}`).toLowerCase().includes(q))
        : allMessages
    const controlsDisabled = viewer.loading || viewer.loadingFull || !!viewer.error
    return (
        <div className={`twitch-chat-overlay ${theme}`} onClick={onClose} role="presentation">
            <div
                className="twitch-chat-panel"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="twitch-chat-dialog-title"
            >
                <div className="twitch-chat-header">
                    <div className="twitch-chat-title">
                        <i className="bi bi-twitch"></i>
                        <span id="twitch-chat-dialog-title" title={viewer.video?.title || t('twitchChatTitle')}>
                            {viewer.video?.title || t('twitchChatTitle')}
                        </span>
                    </div>
                    <button className="twitch-chat-close" onClick={onClose} title={t('close')} aria-label={t('close')}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>
                <div className="twitch-chat-tools">
                    <div className="twitch-chat-search">
                        <i className="bi bi-search"></i>
                        <input
                            value={query}
                            onChange={e => onQueryChange(e.target.value)}
                            placeholder={t('twitchChatSearch')}
                            spellCheck={false}
                            disabled={controlsDisabled}
                        />
                    </div>
                    <button className="twitch-chat-action" onClick={() => onExport('json')} disabled={controlsDisabled || !!exporting}>
                        <i className="bi bi-braces"></i>
                        {exporting === 'json' ? t('loading') : 'JSON'}
                    </button>
                    <button className="twitch-chat-action" onClick={() => onExport('txt')} disabled={controlsDisabled || !!exporting}>
                        <i className="bi bi-filetype-txt"></i>
                        {exporting === 'txt' ? t('loading') : 'TXT'}
                    </button>
                </div>
                <div className="twitch-chat-meta">
                    <span className="twitch-chat-count">
                        {viewer.loading ? t('twitchChatPreparing') : `${messages.length} / ${allMessages.length}`}
                    </span>
                    {!viewer.loading && !viewer.error && (
                        viewer.isComplete
                            ? <span className="twitch-chat-complete"><i className="bi bi-check-circle"></i>{t('twitchChatComplete')}</span>
                            : (
                                <div className="twitch-chat-preview-note">
                                    <span>{t('twitchChatPreviewNote').replace('{minutes}', viewer.previewMinutes || 15)}</span>
                                    <button type="button" onClick={onLoadFull} disabled={viewer.loadingFull}>
                                        {viewer.loadingFull ? t('twitchChatLoadingFull') : t('twitchChatLoadFull')}
                                    </button>
                                </div>
                            )
                    )}
                </div>
                <div className="twitch-chat-list">
                    {viewer.loading && (
                        <div className="twitch-chat-state">
                            <span className="twitch-chat-spinner"></span>
                            <strong>{t('twitchChatPreparing')}</strong>
                            <span>{t('twitchChatCacheSession')}</span>
                        </div>
                    )}
                    {viewer.error && (
                        <div className="twitch-chat-state twitch-chat-state--error">
                            <i className="bi bi-exclamation-triangle"></i>
                            <strong>{t('twitchChatLoadFailed')}</strong>
                            <span>{viewer.error}</span>
                            <button type="button" onClick={onRetry}>{t('twitchChatRetry')}</button>
                        </div>
                    )}
                    {!viewer.loading && !viewer.error && messages.map(message => (
                        <div key={message.id} className="twitch-chat-message">
                            <span className="twitch-chat-time">{message.timeLabel}</span>
                            <span className="twitch-chat-user">{message.username || 'unknown'}</span>
                            <span className="twitch-chat-body">{message.body}</span>
                        </div>
                    ))}
                    {!viewer.loading && !viewer.error && messages.length === 0 && (
                        <div className="twitch-chat-empty">{t('twitchChatNoMatches')}</div>
                    )}
                </div>
            </div>
        </div>
    )
}
function normalizeYtdlVersion(version) {
    return String(version || '').trim().replace(/^yt-dlp\s+/i, '').replace(/^v/i, '')
}

function compareYtdlVersions(a, b) {
    const pa = normalizeYtdlVersion(a).split(/[.-]/).map(part => Number.parseInt(part, 10) || 0)
    const pb = normalizeYtdlVersion(b).split(/[.-]/).map(part => Number.parseInt(part, 10) || 0)
    const len = Math.max(pa.length, pb.length)
    for (let i = 0; i < len; i += 1) {
        const diff = (pa[i] || 0) - (pb[i] || 0)
        if (diff !== 0) return diff > 0 ? 1 : -1
    }
    return 0
}

function isYtdlUpdateAvailable(currentVersion, latestVersion) {
    if (!currentVersion || !latestVersion) return false
    return compareYtdlVersions(latestVersion, currentVersion) > 0
}

function cleanYtdlToolError(message) {
    const text = String(message || '')
        .replace(/^Error invoking remote method '[-a-z]+':\s*/i, '')
        .replace(/^Error:\s*/i, '')
        .trim()

    if (/net::ERR_CONNECTION_RESET/i.test(text)) {
        return 'Соединение с GitHub было сброшено. Проверьте сеть или попробуйте позже.'
    }
    if (/net::ERR_INTERNET_DISCONNECTED|ENOTFOUND|EAI_AGAIN/i.test(text)) {
        return 'Нет соединения с GitHub. Проверьте интернет и попробуйте позже.'
    }
    if (/net::ERR_TIMED_OUT|timeout/i.test(text)) {
        return 'GitHub не ответил вовремя. Попробуйте обновить yt-dlp позже.'
    }

    return text
}
function App() {
    const { t, lang } = useLanguage()
    const isMac = window.api.platform === 'darwin'
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
    const pendingAutoStartRef = useRef(false)

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
    const [customOutputDir, setCustomOutputDir] = useState('')
    const [outputMode, setOutputMode] = useState('default')
    // User-configured folder (from settings/onboarding) OR system Videos fallback
    const [defaultOutputDir, setDefaultOutputDir] = useState(() => {
        try {
            const s = JSON.parse(localStorage.getItem('gorex-app-config') || '{}')
            return s.defaultOutputDir || s.defaultCustomOutputDir || ''
        } catch { return '' }
    })
    const [appSettings, setAppSettings] = useState(null)
    const [gpuVendor, setGpuVendor] = useState('unknown')
    const [systemPlatform, setSystemPlatform] = useState(() => window.api.platform || 'unknown')
    const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('gorex-onboarding-done'))
    const [appVersion, setAppVersion] = useState('')
    const [showWhatsNew, setShowWhatsNew] = useState(false)
    const [updateInfo, setUpdateInfo] = useState(null)
    const [ytdlTool, setYtdlTool] = useState(() => createYtdlToolState())
    const [twitchTool, setTwitchTool] = useState(() => createTwitchToolState())
    const [twitchChannelPicker, setTwitchChannelPicker] = useState(null)
    const [twitchChatViewer, setTwitchChatViewer] = useState(null)
    const [twitchChatQuery, setTwitchChatQuery] = useState('')
    const [twitchChatExporting, setTwitchChatExporting] = useState('')
    const twitchResolveRequestRef = useRef(0)
    const twitchChatRequestRef = useRef(0)
    const nextIdRef = useRef(0)
    const listDragCounter = useRef(0)
    const ytdlUpdateInFlightRef = useRef(false)
    const twitchUpdateInFlightRef = useRef(false)

    useEffect(() => { videosRef.current = videos }, [videos])

    useEffect(() => {
        let cancelled = false
        window.api.getAppVersion()
            .then(version => {
                if (cancelled) return
                const cleanVersion = String(version || '').trim()
                if (!cleanVersion) return
                setAppVersion(cleanVersion)
                if (localStorage.getItem(WHATS_NEW_STORAGE_KEY) !== cleanVersion) {
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
        startEncoding()
    }, [videos]) // eslint-disable-line react-hooks/exhaustive-deps

    const loadAndAddVideos = async (paths, downloadService = false) => {
        if (!paths || paths.length === 0) return
        setIsLoading(true)
        setLoadingMessage({ type: 'videodata' })
        try {
            const data = await window.api.getVideoData(paths)
            if (data === null) return // cancelled
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
            setLoadingMessage(null)
        }
    }

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
        setVideos(prev => prev.map(v => v.id === id ? { ...v, customSettings: normalizeEncoderSettings(settings) } : v))
    }

    const ytdlFetchCancelledRef = useRef(false)

    const handleTwitchDownload = async (url, service, extensionOpts = null) => {
        const requestId = ++twitchResolveRequestRef.current
        const isCurrentRequest = () => twitchResolveRequestRef.current === requestId
        setIsLoading(true)
        setLoadingMessage({ type: 'twitch', title: t('loadingFetchingFormats'), subtitle: t('twitchLoadingResolving') })
        try {
            const resolved = await window.api.twitchResolveUrl(url)
            if (!isCurrentRequest()) return
            if (resolved?.ok === false) throw new Error(resolved.error || t('dlErrorDefault'))

            if (resolved.type === 'channel') {
                setLoadingMessage({ type: 'twitch', title: t('twitchChannelVideosTitle'), subtitle: t('twitchLoadingChannel') })
                const result = await window.api.twitchGetChannelVideos(resolved.channel, { limit: 36 })
                if (!isCurrentRequest()) return
                if (result?.ok === false) throw new Error(result.error || t('dlErrorDefault'))
                setTwitchChannelPicker({
                    channel: result.channel,
                    displayName: result.displayName || result.channel,
                    avatar: result.avatar || '',
                    videos: result.videos || [],
                })
                setView('list')
                return
            }

            const info = resolved.info || {}
            const parsed = resolved.parsed || {}
            const safeOutputName = (info.title || (resolved.type === 'clip' ? 'Twitch Clip' : 'Twitch VOD'))
                .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
                .replace(/\.+$/, '')
                .trim() || 'Twitch Video'
            const twitchService = service || { name: 'Twitch', color: '#9146ff' }
            const quality = normalizeTwitchSelectedQuality(info)
            const newVideo = {
                id: nextIdRef.current++,
                isTwitchItem: true,
                twitchType: resolved.type,
                twitchId: info.id || parsed.id || '',
                twitchUrl: info.url || parsed.sourceUrl || url,
                title: info.title || safeOutputName,
                outputName: safeOutputName,
                thumbnail: info.thumbnail || '',
                duration: info.duration || '',
                durationSecs: info.durationSeconds || 0,
                channel: info.channel || parsed.channel || '',
                resolution: info.resolution || quality.label || '',
                videoResolution: info.videoResolution || '',
                twitchQuality: quality.selected,
                twitchQualityOptions: quality.options,
                status: 'format_select',
                progress: 0,
                downloadService: twitchService,
                convertAfterDownload: extensionOpts?.convertAfterDownload ?? false,
                conversionSettings: extensionOpts?.convertAfterDownload ? selectedSettings : null,
                customSettings: null,
                clipStart: extensionOpts?.clipStart ?? null,
                clipEnd: extensionOpts?.clipEnd ?? null,
            }
            setVideos(prev => [...prev, newVideo])
            setView('list')
        } catch (err) {
            if (!isCurrentRequest()) return
            console.error('Failed to fetch Twitch data:', err)
            const errText = `[Twitch] Ошибка получения данных:\n${err.message}\n`
            _cliLogEmitter.callback?.({ type: 'err', text: errText })
            setYtdlFetchError(err.message || t('dlErrorDefault'))
        } finally {
            if (isCurrentRequest()) {
                setIsLoading(false)
                setLoadingMessage(null)
            }
        }
    }

    const handleTwitchCancel = () => {
        twitchResolveRequestRef.current += 1
        setIsLoading(false)
        setLoadingMessage(null)
    }
    const handleDownload = async (url, service, extensionOpts = null) => {
        if (isTwitchUrl(url)) {
            await handleTwitchDownload(url, service, extensionOpts)
            return
        }
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
                    convertAfterDownload: extensionOpts?.convertAfterDownload ?? false,
                    conversionSettings: extensionOpts?.convertAfterDownload ? selectedSettings : null,
                    customSettings: null,
                    ytdlNoAudio: extensionOpts?.audioOnly ?? false,
                    ytdlAudioFormat: appSettings?.defaultAudioFormat || 'wav',
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
        setVideos(prev => prev.map(v => v.id === id ? { ...v, conversionSettings: normalizeEncoderSettings(settings) } : v))
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
                ytdlNoAudio:          opts.noAudio,
                ytdlDownloadSubs:     opts.downloadSubs,
                ytdlAutoSubs:         opts.autoSubs,
                ytdlSubLangs:         opts.subLangs,
                ytdlSubFormat:        opts.subFormat,
                ytdlAudioFormat:      opts.audioFormat,
                ytdlSponsorBlock:     opts.sponsorBlock,
                ytdlSponsorBlockCats: opts.sponsorBlockCats,
            } : v
        ))
    }

    const handleTwitchAddChannelVideos = (items) => {
        const selected = Array.isArray(items) ? items : []
        if (!selected.length) return
        const twitchService = { name: 'Twitch', color: '#9146ff' }
        const newVideos = selected.map(info => {
            const safeOutputName = (info.title || 'Twitch VOD')
                .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
                .replace(/\.+$/, '')
                .trim() || 'Twitch VOD'
            const quality = normalizeTwitchSelectedQuality(info)
            return {
                id: nextIdRef.current++,
                isTwitchItem: true,
                twitchType: info.type || 'vod',
                twitchId: info.id || '',
                twitchUrl: info.url || `https://www.twitch.tv/videos/${info.id}`,
                title: info.title || safeOutputName,
                outputName: safeOutputName,
                thumbnail: info.thumbnail || '',
                duration: info.duration || '',
                durationSecs: info.durationSeconds || 0,
                channel: info.channel || twitchChannelPicker?.displayName || '',
                resolution: info.resolution || quality.label || '',
                videoResolution: info.videoResolution || '',
                twitchQuality: quality.selected,
                twitchQualityOptions: quality.options,
                status: 'format_select',
                progress: 0,
                downloadService: twitchService,
                convertAfterDownload: false,
                conversionSettings: null,
                customSettings: null,
                clipStart: null,
                clipEnd: null,
            }
        })
        setVideos(prev => [...prev, ...newVideos])
        setTwitchChannelPicker(null)
        setView('list')
    }

    const handleTwitchConvertToggle = (id, val) => {
        setVideos(prev => prev.map(v => v.id === id ? { ...v, convertAfterDownload: val, conversionSettings: val ? (v.conversionSettings || selectedSettings) : null } : v))
    }

    const handleTwitchQualityChange = (id, qualityValue) => {
        setVideos(prev => prev.map(v => {
            if (v.id !== id) return v
            const options = Array.isArray(v.twitchQualityOptions) ? v.twitchQualityOptions : []
            const selected = options.find(option => option?.value === qualityValue)
            const label = selected?.label || getTwitchQualityLabel(options, qualityValue)
            const selectedResolution = selected?.width && selected?.height
                ? `${selected.width}x${selected.height}`
                : v.videoResolution
            return { ...v, twitchQuality: qualityValue, resolution: label || v.resolution || '', videoResolution: selectedResolution || '' }
        }))
    }

    const handleTwitchOpenChat = async (video) => {
        if (!video?.twitchUrl) return
        const requestId = ++twitchChatRequestRef.current
        setTwitchChatQuery('')
        setTwitchChatViewer({
            video,
            messages: [],
            loading: true,
            loadingFull: false,
            error: '',
            isComplete: false,
            previewMinutes: 15,
        })
        try {
            const result = await window.api.twitchDownloadChat({
                url: video.twitchUrl,
                id: video.twitchId,
                full: false,
            })
            if (twitchChatRequestRef.current !== requestId) return
            if (result?.ok === false) throw new Error(result.error || t('dlErrorDefault'))
            setTwitchChatViewer({
                video,
                messages: result.messages || [],
                loading: false,
                loadingFull: false,
                error: '',
                isComplete: !!result.isComplete,
                previewMinutes: result.previewMinutes || 15,
            })
        } catch (err) {
            if (twitchChatRequestRef.current !== requestId) return
            const text = (err?.message || t('dlErrorDefault')).trim()
            setTwitchChatViewer(prev => prev ? { ...prev, loading: false, error: text } : prev)
        }
    }

    const handleTwitchLoadFullChat = async () => {
        const video = twitchChatViewer?.video
        if (!video || twitchChatViewer.loadingFull) return
        const requestId = ++twitchChatRequestRef.current
        setTwitchChatViewer(prev => prev ? { ...prev, loadingFull: true } : prev)
        try {
            const result = await window.api.twitchDownloadChat({
                url: video.twitchUrl,
                id: video.twitchId,
                full: true,
            })
            if (twitchChatRequestRef.current !== requestId) return
            if (result?.ok === false) throw new Error(result.error || t('dlErrorDefault'))
            setTwitchChatViewer(prev => prev ? {
                ...prev,
                messages: result.messages || [],
                loadingFull: false,
                isComplete: true,
            } : prev)
        } catch (err) {
            if (twitchChatRequestRef.current !== requestId) return
            const text = (err?.message || t('dlErrorDefault')).trim()
            setTwitchChatViewer(prev => prev ? { ...prev, loadingFull: false } : prev)
            setCliErrors(prev => [...prev, { title: video.title || 'Twitch chat', stderr: text, hint: '' }])
        }
    }

    const handleTwitchCloseChat = () => {
        twitchChatRequestRef.current += 1
        setTwitchChatViewer(null)
        setTwitchChatQuery('')
    }

    const handleTwitchRetryChat = () => {
        const video = twitchChatViewer?.video
        if (video) handleTwitchOpenChat(video)
    }

    const handleTwitchExportChat = async (format) => {
        if (!twitchChatViewer?.video) return
        const resolvedOutputDir = outputMode === 'default' ? defaultOutputDir : customOutputDir
        setTwitchChatExporting(format)
        try {
            const result = await window.api.twitchExportChat({
                url: twitchChatViewer.video.twitchUrl,
                id: twitchChatViewer.video.twitchId,
                format,
                outputDir: resolvedOutputDir,
            })
            if (result?.ok === false) throw new Error(result.error || t('dlErrorDefault'))
            if (result?.outputPath) await handleOpenOutputLocation(result.outputPath)
        } catch (err) {
            const text = (err?.message || t('dlErrorDefault')).trim()
            setCliErrors(prev => [...prev, { title: twitchChatViewer.video.title || 'Twitch chat', stderr: text, hint: '' }])
        } finally {
            setTwitchChatExporting('')
        }
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
            .filter(v => ['encoding', 'downloading', 'downloading-subs', 'probing-keyframes', 'cutting-sponsors', 'converting'].includes(v.status))
            .forEach(v => stoppedJobsRef.current.add(v.id))
        window.api.stopAll()
        setIsEncoding(false)
        setIsPaused(false)
        setEncodingStartTime(null)
        progressStateRef.current.clear()
        setVideos(prev => prev.map(v =>
            ['encoding', 'downloading', 'downloading-subs', 'probing-keyframes', 'cutting-sponsors', 'converting'].includes(v.status)
                ? { ...v, status: isDownloadItem(v) ? 'format_select' : 'ready', progress: 0, startTime: null, endTime: null, outputPath: null }
                : v
        ))
    }

    const handleViewChange = (newView) => {
        setView(newView)
    }

    const handleSaveSettings = async (encodingSettings, appConfig) => {
        const cleanAppConfig = { ...(appConfig || {}) }
        const normalizedEncodingSettings = normalizeEncoderSettings(encodingSettings)
        delete cleanAppConfig.ytdlDeepFormatSearch
        // Persist encoding defaults
        localStorage.setItem('gorex-default-settings', JSON.stringify(normalizedEncodingSettings))
        setSelectedSettings(normalizedEncodingSettings)
        // Persist app config (renderer-side)
        localStorage.setItem('gorex-app-config', JSON.stringify(cleanAppConfig))
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

    const handleOutputDirChange = async (dir) => {
        const existing = JSON.parse(localStorage.getItem('gorex-app-config') || '{}')
        const existingConfig = { ...existing }
        delete existingConfig.ytdlDeepFormatSearch
        const updated = { ...existingConfig, defaultOutputDir: dir || '' }
        localStorage.setItem('gorex-app-config', JSON.stringify(updated))
        await window.api.saveAppSettings(updated)
        setAppSettings(prev => ({ ...(prev || {}), defaultOutputDir: dir || '' }))
        if (dir) {
            setDefaultOutputDir(dir)
        } else {
            // After save completes, main process will now return system Videos
            window.api.getDefaultOutputDir().then(d => setDefaultOutputDir(d))
        }
    }

    const getYtdlStageText = (stage) => t(YTDL_STAGE_LABELS[stage] || 'ytdlUpdateChecking')

    const handleUpdateYtdl = async () => {
        if (ytdlUpdateInFlightRef.current) {
            setYtdlTool(prev => ({
                ...prev,
                status: 'updating',
                message: t('toolUpdateAlreadyRunning'),
                stageMessage: prev.stageMessage || t('toolUpdateAlreadyRunning'),
            }))
            return null
        }

        ytdlUpdateInFlightRef.current = true
        setYtdlTool(prev => createYtdlToolState({
            ...prev,
            status: 'updating',
            progress: 0,
            stageMessage: t('ytdlUpdateStagePreparing'),
            message: '',
        }))
        try {
            const result = await window.api.updateYtdl()
            if (result?.ok === false) throw new Error(result.error || t('dlErrorDefault'))
            const info = result?.info || result
            setYtdlTool(prev => createYtdlToolState({
                ...prev,
                status: 'up-to-date',
                info,
                progress: 100,
                stageMessage: t('ytdlUpdateStageDone'),
                message: t('ytdlUpdateSuccess'),
            }))
            return info
        } catch (err) {
            if (isToolUpdateAlreadyRunningError(err?.message)) {
                setYtdlTool(prev => ({
                    ...prev,
                    status: 'updating',
                    message: t('toolUpdateAlreadyRunning'),
                    stageMessage: prev.stageMessage || t('toolUpdateAlreadyRunning'),
                }))
                return null
            }
            const errorText = cleanYtdlToolError(err?.message) || t('dlErrorDefault')
            setYtdlTool(prev => ({
                ...prev,
                status: 'error',
                message: `${t('ytdlUpdateFailed')}: ${errorText}`,
                stageMessage: prev.stageMessage || t('ytdlUpdateStageError'),
            }))
            return null
        } finally {
            ytdlUpdateInFlightRef.current = false
        }
    }

    const refreshYtdlToolInfo = async ({ autoUpdate = false } = {}) => {
        setYtdlTool(prev => ({ ...prev, status: prev.status === 'updating' ? 'updating' : 'checking', message: '' }))
        try {
            const info = await window.api.getYtdlInfo()
            if (!info?.found) {
                const autoDownloadMissing = shouldAutoDownloadMissingTool(info, { autoUpdate, isEncoding })
                setYtdlTool(prev => ({
                    ...prev,
                    status: getMissingToolStatus(info),
                    info,
                    latest: null,
                    stageMessage: t('ytdlUpdateNotFound'),
                    message: autoDownloadMissing ? '' : t('ytdlUpdateNotFound'),
                    progress: null,
                }))
                if (autoDownloadMissing) {
                    setTimeout(() => { handleUpdateYtdl() }, 0)
                }
                return
            }

            let latest = null
            let latestError = null
            try {
                latest = await window.api.getYtdlLatestInfo()
            } catch (err) {
                latestError = cleanYtdlToolError(err?.message) || t('dlErrorDefault')
            }

            if (latestError) {
                setYtdlTool(prev => ({
                    ...prev,
                    status: 'check-failed',
                    info,
                    latest: null,
                    stageMessage: t('ytdlUpdateCheckFailed'),
                    message: `${t('ytdlUpdateCheckFailed')}: ${latestError}`,
                    progress: null,
                }))
                return
            }

            const updateAvailable = info?.found && latest?.latestVersion && isYtdlUpdateAvailable(info.version, latest.latestVersion)
            setYtdlTool(prev => ({
                ...prev,
                status: updateAvailable ? 'update-available' : 'up-to-date',
                info,
                latest,
                stageMessage: updateAvailable ? t('ytdlBadgeUpdateAvailable') : t('ytdlBadgeReady'),
                message: '',
                progress: updateAvailable ? null : 100,
            }))
            if (shouldAutoUpdateExistingTool(info, updateAvailable, { autoUpdate, isEncoding })) {
                setTimeout(() => { handleUpdateYtdl() }, 0)
            }
        } catch (err) {
            setYtdlTool(prev => ({
                ...prev,
                status: 'error',
                message: err?.message || t('dlErrorDefault'),
                stageMessage: t('ytdlUpdateStageError'),
            }))
        }
    }

    const handleUpdateTwitch = async () => {
        if (twitchUpdateInFlightRef.current) {
            setTwitchTool(prev => ({
                ...prev,
                status: 'updating',
                message: t('toolUpdateAlreadyRunning'),
                stageMessage: prev.stageMessage || t('toolUpdateAlreadyRunning'),
            }))
            return null
        }

        twitchUpdateInFlightRef.current = true
        setTwitchTool(prev => createTwitchToolState({
            ...prev,
            status: 'updating',
            progress: 0,
            stageMessage: t('ytdlUpdateStagePreparing'),
            message: '',
        }))
        try {
            const result = await window.api.updateTwitch()
            if (result?.ok === false) throw new Error(result.error || t('dlErrorDefault'))
            const info = result?.info || result
            setTwitchTool(prev => createTwitchToolState({
                ...prev,
                status: 'up-to-date',
                info,
                latest: info?.latest || prev.latest,
                progress: 100,
                stageMessage: t('ytdlUpdateStageDone'),
                message: t('twitchUpdateSuccess'),
            }))
            return info
        } catch (err) {
            if (isToolUpdateAlreadyRunningError(err?.message)) {
                setTwitchTool(prev => ({
                    ...prev,
                    status: 'updating',
                    message: t('toolUpdateAlreadyRunning'),
                    stageMessage: prev.stageMessage || t('toolUpdateAlreadyRunning'),
                }))
                return null
            }
            const errorText = cleanYtdlToolError(err?.message) || t('dlErrorDefault')
            setTwitchTool(prev => ({
                ...prev,
                status: 'error',
                message: `${t('twitchUpdateFailed')}: ${errorText}`,
                stageMessage: prev.stageMessage || t('ytdlUpdateStageError'),
            }))
            return null
        } finally {
            twitchUpdateInFlightRef.current = false
        }
    }

    const refreshTwitchToolInfo = async ({ autoUpdate = false } = {}) => {
        setTwitchTool(prev => ({ ...prev, status: prev.status === 'updating' ? 'updating' : 'checking', message: '' }))
        try {
            const info = await window.api.getTwitchInfo()
            let latest = null
            let latestError = null
            try {
                latest = await window.api.getTwitchLatestInfo()
            } catch (err) {
                latestError = cleanYtdlToolError(err?.message) || t('dlErrorDefault')
            }

            if (latestError) {
                setTwitchTool(prev => ({
                    ...prev,
                    status: 'check-failed',
                    info,
                    latest: null,
                    stageMessage: t('twitchUpdateCheckFailed'),
                    message: `${t('twitchUpdateCheckFailed')}: ${latestError}`,
                    progress: null,
                }))
                return
            }

            const updateAvailable = info?.found && latest?.latestVersion && isTwitchToolUpdateAvailable(info.version, latest.latestVersion)
            const autoDownloadMissing = shouldAutoDownloadMissingTool(info, { autoUpdate, isEncoding })
            const autoUpdateExisting = shouldAutoUpdateExistingTool(info, updateAvailable, { autoUpdate, isEncoding })
            setTwitchTool(prev => ({
                ...prev,
                status: !info?.found ? getMissingToolStatus(info) : (updateAvailable ? 'update-available' : 'up-to-date'),
                info,
                latest,
                stageMessage: !info?.found ? t('twitchUpdateNotFound') : (updateAvailable ? t('twitchBadgeUpdateAvailable') : t('twitchBadgeReady')),
                message: '',
                progress: updateAvailable || !info?.found ? null : 100,
            }))
            if (autoUpdateExisting || autoDownloadMissing) {
                setTimeout(() => { handleUpdateTwitch() }, 0)
            }
        } catch (err) {
            setTwitchTool(prev => ({
                ...prev,
                status: 'error',
                message: err?.message || t('dlErrorDefault'),
                stageMessage: t('ytdlUpdateStageError'),
            }))
        }
    }
    const handleOpenYtdlSettings = () => {
        setSettingsInitialTab('updates')
        handleViewChange('settings')
    }

    const handleDismissWhatsNew = () => {
        if (appVersion) {
            localStorage.setItem(WHATS_NEW_STORAGE_KEY, appVersion)
        }
        setShowWhatsNew(false)
    }

    useEffect(() => {
        if (!showWhatsNew) return undefined
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') handleDismissWhatsNew()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [showWhatsNew, appVersion])

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
                ? { ...v, progress: 0, status: isDownloadItem(v) ? 'format_select' : 'ready', startTime: null, endTime: null, outputPath: null }
                : v
        ))
        const resolvedOutputDir = outputMode === 'default' ? defaultOutputDir : customOutputDir
        videos.forEach(v => {
            if (v.isTwitchItem) {
                window.api.twitchRun({
                    id: v.id,
                    type: v.twitchType || 'vod',
                    url: v.twitchUrl,
                    outputDir: resolvedOutputDir,
                    outputName: v.outputName,
                    convertAfterDownload: v.convertAfterDownload,
                    conversionSettings: v.conversionSettings || selectedSettings,
                    videoResolution: v.videoResolution || null,
                    twitchQuality: v.twitchQuality,
                    clipStart: v.clipStart ?? null,
                    clipEnd: v.clipEnd ?? null,
                })
            } else if (v.isYtdlItem) {
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
                    noAudio:            v.ytdlNoAudio          ?? false,
                    downloadSubs:       v.ytdlDownloadSubs     ?? false,
                    autoSubs:           v.ytdlAutoSubs         ?? false,
                    subLangs:           v.ytdlSubLangs         ?? 'all',
                    subFormat:          v.ytdlSubFormat        ?? 'srt',
                    audioFormat:        v.ytdlAudioFormat      ?? 'best',
                    sponsorBlock:       v.ytdlSponsorBlock     ?? false,
                    sponsorBlockCats:   v.ytdlSponsorBlockCats ?? ['sponsor'],
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
    useEffect(() => {
        if (window.api.onYtdlUpdateProgress) {
            window.api.onYtdlUpdateProgress((payload = {}) => {
                setYtdlTool(prev => {
                    const isError = payload.stage === 'error'
                    const isDone = payload.stage === 'done'
                    const hasPercent = Object.prototype.hasOwnProperty.call(payload, 'percent')
                    const progress = isError
                        ? prev.progress
                        : hasPercent
                            ? Number.isFinite(payload.percent)
                                ? Math.max(0, Math.min(100, payload.percent))
                                : null
                            : prev.progress
                    return {
                        ...prev,
                        status: isError ? 'error' : (isDone ? 'up-to-date' : 'updating'),
                        stageMessage: isError ? prev.stageMessage : getYtdlStageText(payload.stage),
                        progress,
                        receivedBytes: payload.receivedBytes ?? prev.receivedBytes,
                        totalBytes: payload.totalBytes ?? prev.totalBytes,
                    }
                })
            })
        }
        if (window.api.onTwitchUpdateProgress) {
            window.api.onTwitchUpdateProgress((payload = {}) => {
                setTwitchTool(prev => {
                    const isError = payload.stage === 'error'
                    const isDone = payload.stage === 'done'
                    const hasPercent = Object.prototype.hasOwnProperty.call(payload, 'percent')
                    const progress = isError
                        ? prev.progress
                        : hasPercent
                            ? Number.isFinite(payload.percent)
                                ? Math.max(0, Math.min(100, payload.percent))
                                : null
                            : prev.progress
                    return {
                        ...prev,
                        status: isError ? 'error' : (isDone ? 'up-to-date' : 'updating'),
                        stageMessage: isError ? prev.stageMessage : getYtdlStageText(payload.stage),
                        progress,
                        receivedBytes: payload.receivedBytes ?? prev.receivedBytes,
                        totalBytes: payload.totalBytes ?? prev.totalBytes,
                    }
                })
            })
        }
        refreshTwitchToolInfo({ autoUpdate: true })
        refreshYtdlToolInfo({ autoUpdate: true })
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Chrome extension integration ─────────────────────────────────────────────
    useEffect(() => {
        window.api.onExtensionAddToQueue(async (data) => {
            const { url, formatId, audioOnly, clipStart, clipEnd, convertAfterDownload } = data
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
                    'twitch.tv': { name: 'Twitch', color: '#9146ff' },
                    'clips.twitch.tv': { name: 'Twitch', color: '#9146ff' },
                    'vk.com': { name: 'VKontakte', color: '#4a76a8' },
                    'vkvideo.ru': { name: 'VK Видео', color: '#4a76a8' },
                    'rutube.ru': { name: 'Rutube', color: '#ff5c00' },
                }
                service = SERVICE_MAP[host] || null
            } catch {}
            pendingAutoStartRef.current = true
            await handleDownload(url, service, { preselectedFormat: formatId, audioOnly, clipStart, clipEnd, convertAfterDownload })
        })
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Extension: remove queue item ─────────────────────────────────────────────
    useEffect(() => {
        window.api.onExtensionRemoveFromQueue((data) => {
            if (data?.id != null) handleRemoveVideo(data.id)
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
                const hasSaved = !!localStorage.getItem('gorex-default-settings')
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

        window.api.onYtdlProgress(({ id, progress, subsPhase, sponsorBlockPhase, sponsorBlockProbePhase }) => {
            if (stoppedJobsRef.current.has(id)) return
            const newStatus = subsPhase ? 'downloading-subs'
                : sponsorBlockProbePhase ? 'probing-keyframes'
                : sponsorBlockPhase ? 'cutting-sponsors'
                : 'downloading'
            setVideos(prev => prev.map(v =>
                v.id === id
                    ? { ...v, progress, status: newStatus, startTime: v.startTime ?? Date.now() }
                    : v
            ))
        })

        window.api.onTwitchProgress?.(({ id, progress }) => {
            if (stoppedJobsRef.current.has(id)) return
            setVideos(prev => prev.map(v =>
                v.id === id
                    ? { ...v, progress, status: 'downloading', startTime: v.startTime ?? Date.now() }
                    : v
            ))
        })

        window.api.onTwitchExit?.(({ id, code, converting, error, stderr, outputPath }) => {
            if (stoppedJobsRef.current.has(id)) {
                stoppedJobsRef.current.delete(id)
                return
            }
            if (converting) {
                setVideos(prev => prev.map(v =>
                    v.id === id ? { ...v, progress: 0, status: 'converting', startTime: Date.now(), outputPath: null } : v
                ))
            } else {
                setVideos(prev => {
                    const updated = prev.map(v => v.id === id
                        ? { ...v, progress: 100, status: code === 0 ? 'done' : 'error', endTime: Date.now(), outputPath: code === 0 ? (outputPath || v.outputPath || null) : null }
                        : v
                    )
                    if (!updated.some(v => ['encoding', 'downloading', 'downloading-subs', 'probing-keyframes', 'cutting-sponsors', 'converting'].includes(v.status))) {
                        setIsEncoding(false)
                        setEncodingStartTime(null)
                    }
                    return updated
                })
                if (code !== 0) {
                    const v = videosRef.current.find(v => v.id === id)
                    const title = v ? (v.title || v.outputName || t('unknownFile')) : t('unknownFile')
                    const text = (stderr || error || '').trim() || t('noOutput')
                    setCliErrors(prev => [...prev, { title, stderr: text, hint: error || '' }])
                }
            }
        })
        window.api.onYtdlExit(({ id, code, converting, error, stderr, outputPath }) => {
            if (stoppedJobsRef.current.has(id)) {
                stoppedJobsRef.current.delete(id)
                return
            }
            if (converting) {
                // Download finished, conversion phase starting
                setVideos(prev => prev.map(v =>
                    v.id === id ? { ...v, progress: 0, status: 'converting', startTime: Date.now(), outputPath: null } : v
                ))
            } else {
                setVideos(prev => {
                    const updated = prev.map(v => v.id === id
                        ? { ...v, progress: 100, status: code === 0 ? 'done' : 'error', endTime: Date.now(), outputPath: code === 0 ? (outputPath || v.outputPath || null) : null }
                        : v
                    )
                    if (!updated.some(v => ['encoding', 'downloading', 'downloading-subs', 'probing-keyframes', 'cutting-sponsors', 'converting'].includes(v.status))) {
                        setIsEncoding(false)
                        setEncodingStartTime(null)
                    }
                    return updated
                })
                if (code !== 0) {
                    const v = videosRef.current.find(v => v.id === id)
                    const title = v ? (v.title || v.outputName || t('unknownFile')) : t('unknownFile')
                    const text = (stderr || error || '').trim() || t('noOutput')
                    setCliErrors(prev => [...prev, { title, stderr: text, hint: error || '' }])
                }
            }
        })

        window.api.onCliExit(({ id, code, stderr, outputPath }) => {
            if (stoppedJobsRef.current.has(id)) {
                stoppedJobsRef.current.delete(id)
                progressStateRef.current.delete(id)
                return
            }
            progressStateRef.current.delete(id)
            setVideos(prev => {
                const updated = prev.map(v => v.id === id
                    ? { ...v, progress: 100, status: code === 0 ? 'done' : 'error', endTime: Date.now(), outputPath: code === 0 ? (outputPath || v.outputPath || null) : null }
                    : v
                )
                if (!updated.some(v => ['encoding', 'downloading', 'downloading-subs', 'probing-keyframes', 'cutting-sponsors', 'converting'].includes(v.status))) {
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

    const handleOpenOutputLocation = async (outputPath) => {
        if (!outputPath) return
        try {
            await window.api.openOutputLocation(outputPath)
        } catch (err) {
            console.error('Failed to open output location:', err)
        }
    }

    const macMenuHandlersRef = useRef({})
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
        if (window.api.platform !== 'darwin' || !window.api.onNativeMenuAction) return undefined
        return window.api.onNativeMenuAction(action => macMenuHandlersRef.current[action]?.())
    }, [])

    useEffect(() => {
        if (window.api.platform !== 'darwin' || !window.api.updateNativeMenu) return
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
    }, [lang, videos.length, isEncoding, isPaused, t])

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
            {showWhatsNew && !showOnboarding && (
                <div className={`whats-new-overlay ${theme}`} role="dialog" aria-modal="true" aria-labelledby="whats-new-title" onClick={handleDismissWhatsNew}>
                    <div className="whats-new-card" onClick={e => e.stopPropagation()}>
                        <button className="whats-new-close" onClick={handleDismissWhatsNew} title={t('close')}>
                            <i className="bi bi-x-lg"></i>
                        </button>
                        <div className="whats-new-kicker">{t('whatsNewKicker').replace('{v}', appVersion || '2.4.0')}</div>
                        <h2 id="whats-new-title" className="whats-new-title">{t('whatsNewTitle')}</h2>
                        <p className="whats-new-subtitle">{t('whatsNewSubtitle')}</p>
                        <div className="whats-new-list">
                            {WHATS_NEW_ITEMS.map((item, index) => (
                                <div key={item.titleKey} className="whats-new-item" style={{ animationDelay: `${index * 45}ms` }}>
                                    <span className="whats-new-item-icon">
                                        <i className={`bi ${item.icon}`}></i>
                                    </span>
                                    <span className="whats-new-item-copy">
                                        <span className="whats-new-item-title">{t(item.titleKey)}</span>
                                        <span className="whats-new-item-text">{t(item.textKey)}</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                        <p className="whats-new-mac-note">
                            <i className="bi bi-apple" aria-hidden="true"></i>
                            {t('whatsNewMacNote')}
                        </p>
                        <div className="whats-new-footer">
                            <button className="whats-new-primary" onClick={handleDismissWhatsNew}>
                                {t('whatsNewDone')}
                                <i className="bi bi-check2"></i>
                            </button>
                        </div>
                    </div>
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
                            // Sync outputDir to localStorage and session state
                            const existingConfig = JSON.parse(localStorage.getItem('gorex-app-config') || '{}')
                            const cleanExistingConfig = { ...existingConfig }
                            delete cleanExistingConfig.ytdlDeepFormatSearch
                            localStorage.setItem('gorex-app-config', JSON.stringify({ ...cleanExistingConfig, ...newAppSettings }))
                            if (settings.outputDir) {
                                setDefaultOutputDir(settings.outputDir)
                            }
                            if (settings.encoder) {
                                const cur = JSON.parse(localStorage.getItem('gorex-default-settings') || '{}')
                                const updated = normalizeEncoderSettings({ ...cur, encoder: settings.encoder })
                                localStorage.setItem('gorex-default-settings', JSON.stringify(updated))
                                setSelectedSettings(prev => normalizeEncoderSettings({ ...prev, encoder: settings.encoder }))
                            }
                        }
                        localStorage.setItem('gorex-onboarding-done', '1')
                        setShowOnboarding(false)
                    }}
                />
            )}
        </div>
    )
}

export default App
