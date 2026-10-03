import type { ReactNode, CSSProperties } from 'react'
import type { Theme, ThemeMode, SettingsTab, AppConfig, EncodingSettings, GpuInfo, ToolInfo, ToolState, YoutubeAuth } from '../../domain'
import { errorMessage } from '../../domain'
export interface SettingsPageProps {
    theme: Theme; themeMode: ThemeMode; onThemeModeChange: (mode: ThemeMode) => void
    accentTheme: string; onAccentThemeChange: (accent: string) => void; onBack: () => void
    appSettings: AppConfig | null; onSave: (settings: EncodingSettings, config: AppConfig) => void | Promise<void>
    onOutputDirChange: (path: string) => void | Promise<void>; initialTab?: SettingsTab
    ytdlTool: ToolState; onUpdateYtdl: () => Promise<unknown>; onRefreshYtdl: () => Promise<unknown>
    twitchTool: ToolState; onUpdateTwitch: () => Promise<unknown>; onRefreshTwitch: () => Promise<unknown>
}
interface ToolUpdateState { status: string; message: string; stageMessage: string; progress: number | null; receivedBytes: number; totalBytes: number | null }
interface AppUpdateState { status: string; message: string; currentVersion: string; latestVersion: string; downloadUrl: string }
import { appStorage } from '../../storage'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
    GsSelect,
    DEFAULT_SETTINGS,
    CODEC_RF,
    ENCODER_PRESETS,
    initDefaultSettings,
    getDefaultSettingsForGpu,
    WEBM_COMPATIBLE_ENCODERS,
    WEBM_COMPATIBLE_AUDIO,
    ENCODER_DISABLED_FORMATS,
    NO_CRF_ENCODERS,
    ALPHA_CAPABLE_ENCODERS,
    MULTI_PASS_ENCODERS,
    getEncoderGroupsForPlatform,
    normalizeEncoderSettings,
} from '../../components/GlobalSettings/GlobalSettings'
import { useLanguage } from '../../i18n'

// ─── Audio codec list ─────────────────────────────────────────────────────────
// ─── GPU vendor → primary encoder groups ─────────────────────────────────────
const GPU_VENDOR_LABEL = {
    apple:  { label: 'Apple',  icon: 'bi-cpu',      color: '#a3a3a3' },
    nvidia: { label: 'NVIDIA', icon: 'bi-gpu-card', color: '#76b900' },
    amd:    { label: 'AMD',    icon: 'bi-gpu-card', color: '#ed1c24' },
    intel:  { label: 'Intel',  icon: 'bi-gpu-card', color: '#0071c5' },
    unknown:{ label: null,     icon: 'bi-question-circle', color: null },
}

export function getGpuMeta(gpuName: string) {
    const n = gpuName.toLowerCase()
    if (n.includes('apple')) return GPU_VENDOR_LABEL.apple
    if (n.includes('nvidia')) return GPU_VENDOR_LABEL.nvidia
    if (n.includes('amd') || n.includes('radeon')) return GPU_VENDOR_LABEL.amd
    if (n.includes('intel')) return GPU_VENDOR_LABEL.intel
    return GPU_VENDOR_LABEL.unknown
}

// ─── Sidebar tabs ─────────────────────────────────────────────────────────────
const TABS_IDS: { id: SettingsTab; icon: string }[] = [
    { id: 'app',       icon: 'bi-gear' },
    { id: 'video',     icon: 'bi-camera-video' },
    { id: 'audio',     icon: 'bi-music-note-beamed' },
    { id: 'subtitles', icon: 'bi-badge-cc' },
    { id: 'filters',   icon: 'bi-sliders' },
    { id: 'hdr',       icon: 'bi-stars' },
    { id: 'updates',   icon: 'bi-arrow-repeat' },
    { id: 'other',     icon: 'bi-three-dots' },
]

const YTDL_UPDATE_STAGE_KEYS: Record<string, string> = {
    preparing: 'ytdlUpdateStagePreparing',
    connecting: 'ytdlUpdateStageConnecting',
    downloading: 'ytdlUpdateStageDownloading',
    downloaded: 'ytdlUpdateStageDownloaded',
    verifying: 'ytdlUpdateStageVerifying',
    installing: 'ytdlUpdateStageInstalling',
    done: 'ytdlUpdateStageDone',
    error: 'ytdlUpdateStageError',
}

export const createYtdlUpdateState = (overrides: Partial<ToolUpdateState> = {}): ToolUpdateState => ({
    status: 'idle',
    message: '',
    stageMessage: '',
    progress: null,
    receivedBytes: 0,
    totalBytes: null,
    ...overrides,
})

const createGorexUpdateState = (overrides: Partial<AppUpdateState> = {}): AppUpdateState => ({
    status: 'idle',
    message: '',
    currentVersion: '',
    latestVersion: '',
    downloadUrl: '',
    ...overrides,
})

const cleanYtdlUpdateError = (message: unknown) => {
    const text = String(message || '')
        .replace(/^Error invoking remote method 'update-ytdl':\s*/i, '')
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

const cleanGorexUpdateError = (message: unknown) => {
    const text = String(message || '')
        .replace(/^Error invoking remote method 'check-for-updates':\s*/i, '')
        .replace(/^Error:\s*/i, '')
        .trim()

    if (/net::ERR_CONNECTION_RESET/i.test(text)) {
        return 'Соединение с GitHub было сброшено. Проверьте сеть или попробуйте позже.'
    }
    if (/net::ERR_INTERNET_DISCONNECTED|ENOTFOUND|EAI_AGAIN/i.test(text)) {
        return 'Нет соединения с GitHub. Проверьте интернет и попробуйте позже.'
    }
    if (/net::ERR_TIMED_OUT|timeout/i.test(text)) {
        return 'GitHub не ответил вовремя. Попробуйте проверить обновления позже.'
    }

    return text
}

const formatUpdateBytes = (bytes: number | null | undefined) => {
    const value = Number(bytes)
    if (!Number.isFinite(value) || value <= 0) return ''
    const units = ['B', 'KB', 'MB', 'GB']
    let size = value
    let unit = 0
    while (size >= 1024 && unit < units.length - 1) {
        size /= 1024
        unit += 1
    }
    return `${size >= 10 || unit === 0 ? size.toFixed(0) : size.toFixed(1)} ${units[unit]}`
}

// ─── Main component ───────────────────────────────────────────────────────────
export function useSettingsPage({ theme, themeMode, onThemeModeChange, accentTheme, onAccentThemeChange, onBack, appSettings, onSave, onOutputDirChange, initialTab, ytdlTool, onUpdateYtdl, onRefreshYtdl, twitchTool, onUpdateTwitch, onRefreshTwitch }: SettingsPageProps) {
    const { t, lang, setLang } = useLanguage()
    const [activeSection, setActiveSection] = useState<SettingsTab>(initialTab || 'app')
    const [savedFlash, setSavedFlash] = useState(false)
    const [gpuInfo, setGpuInfo] = useState<GpuInfo>({ gpus: [], vendor: 'unknown', platform: window.api.platform || 'unknown' })

    const TABS = TABS_IDS.map(tab => ({
        ...tab,
        label: t({ app: 'tabApp', video: 'tabVideo', audio: 'tabAudio', subtitles: 'tabSubtitles', filters: 'tabFilters', hdr: 'tabHdr', updates: 'tabUpdates', other: 'tabOther' }[tab.id]),
    }))

    // App-level config (output folder)
    const [appConfig, setAppConfig] = useState<AppConfig>(() => {
        try {
            const s = JSON.parse(appStorage.getItem('gorex-app-config') || '{}')
            return {
                defaultOutputDir: s.defaultOutputDir || '',
                ytdlCookiesFile: s.ytdlCookiesFile || '',
                ytdlManagedCookiesFile: s.ytdlManagedCookiesFile || '',
                ytdlCookiesMode: s.ytdlCookiesMode || 'auto',
                ytdlAuthLastExportAt: s.ytdlAuthLastExportAt || '',
                backgroundMode: s.backgroundMode !== false,
                defaultAudioFormat: s.defaultAudioFormat || 'wav',
            }
        } catch {}
        return { defaultOutputDir: '', ytdlCookiesFile: '', ytdlManagedCookiesFile: '', ytdlCookiesMode: 'auto', ytdlAuthLastExportAt: '', backgroundMode: true, defaultAudioFormat: 'wav' }
    })

    // Default encoding settings
    const [enc, setEnc] = useState(() => initDefaultSettings())

    // CLI status
    const [cliStatus, setCliStatus] = useState('checking') // 'checking' | 'ok' | 'error'
    const [cliVersion, setCliVersion] = useState('')
    const [cliPath, setCliPath] = useState('')
    const [ytdlInfo, setYtdlInfo] = useState<ToolInfo | null>(null)
    const [ytdlUpdateState, setYtdlUpdateState] = useState(() => createYtdlUpdateState())
    const [gorexUpdateState, setGorexUpdateState] = useState(() => createGorexUpdateState())
    const [youtubeAuthStatus, setYoutubeAuthStatus] = useState<YoutubeAuth | null>(null)
    const [youtubeAuthBusy, setYoutubeAuthBusy] = useState(false)
    const [youtubeAuthError, setYoutubeAuthError] = useState('')

    // Resolved output dir (actual system path shown in UI)
    const [resolvedOutputDir, setResolvedOutputDir] = useState('')

    // Refs for scroll
    const contentRef = useRef<HTMLDivElement>(null)
    const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
    const isScrollingRef = useRef(false)

    // Sync appConfig when prop arrives from IPC
    useEffect(() => {
        if (appSettings) {
            const cleanAppSettings = { ...appSettings }
            delete cleanAppSettings.ytdlDeepFormatSearch
            setAppConfig(prev => ({ ...prev, ...cleanAppSettings }))
        }
    }, [appSettings])

    useEffect(() => {
        window.api.checkCli().then(result => {
            setCliStatus(result.found ? 'ok' : 'error')
            setCliVersion(result.version || '')
            setCliPath(result.path || '')
        }).catch(() => setCliStatus('error'))
        window.api.getDefaultOutputDir().then(dir => setResolvedOutputDir(dir))
        window.api.getGpuInfo().then(info => {
            setGpuInfo(info)
            // Auto-enable hw decoding when GPU is detected and setting is at default
            const decoderMap: Record<string, string> = { apple: 'videotoolbox', nvidia: 'nvdec', intel: 'qsv' }
            const accelerationVendor = info.accelerationVendor || info.vendor
            const decoder = decoderMap[accelerationVendor]
            setEnc(prev => {
                const availableEncoders = new Set(
                    getEncoderGroupsForPlatform(info.platform).flatMap(group => group.encoders.map(encoder => encoder.value))
                )
                const fallback = getDefaultSettingsForGpu(accelerationVendor)
                const next = {
                    ...prev,
                    ...(decoder && (info.platform === 'darwin' || prev.hwDecoding === 'none')
                        ? { hwDecoding: decoder }
                        : {}),
                    ...(!availableEncoders.has(prev.encoder)
                        ? { encoder: fallback.encoder, encoderSpeed: fallback.encoderSpeed, multiPass: false }
                        : {}),
                }
                const supportsMultiPass = MULTI_PASS_ENCODERS.has(next.encoder)
                    && !(next.quality === 'lossless' && (next.encoder || '').startsWith('nvenc_'))
                return normalizeEncoderSettings({
                    ...next,
                    ...(!supportsMultiPass ? { multiPass: false } : {}),
                })
            })
        }).catch(() => {})
    }, [])

    // IntersectionObserver — highlight active tab while scrolling
    useEffect(() => {
        const container = contentRef.current
        if (!container) return

        const observer = new IntersectionObserver(
            (entries) => {
                if (isScrollingRef.current) return
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const section = (entry.target as HTMLElement).dataset.section
                        if (TABS_IDS.some(tab => tab.id === section)) setActiveSection(section as SettingsTab)
                    }
                })
            },
            { root: container, rootMargin: '-30% 0px -60% 0px', threshold: 0 }
        )

        TABS.forEach(tab => {
            const el = sectionRefs.current[tab.id]
            if (el) observer.observe(el)
        })

        // Activate last tab when scrolled to the very bottom
        const handleScroll = () => {
            if (isScrollingRef.current) return
            const { scrollTop, scrollHeight, clientHeight } = container
            if (scrollHeight - scrollTop - clientHeight < 8) {
                setActiveSection(TABS[TABS.length - 1].id)
            }
        }
        container.addEventListener('scroll', handleScroll, { passive: true })

        return () => { observer.disconnect(); container.removeEventListener('scroll', handleScroll) }
    }, [])

    const scrollToSection = useCallback((id: SettingsTab) => {
        const container = contentRef.current
        const el = sectionRefs.current[id]
        if (!container || !el) return
        setActiveSection(id)
        isScrollingRef.current = true
        container.scrollTo({ top: el.offsetTop - 16, behavior: 'smooth' })
        setTimeout(() => { isScrollingRef.current = false }, 600)
    }, [])

    useEffect(() => {
        if (initialTab) scrollToSection(initialTab)
    }, [initialTab, scrollToSection])

    const refreshYoutubeAuthStatus = useCallback(async () => {
        try {
            const status = await window.api.getYoutubeAuthStatus()
            setYoutubeAuthStatus(status)
            if (status?.managedCookiesFile || status?.lastExportAt) {
                setAppConfig(prev => ({
                    ...prev,
                    ytdlManagedCookiesFile: status.managedCookiesFile || prev.ytdlManagedCookiesFile || '',
                    ytdlCookiesMode: status.cookiesMode || prev.ytdlCookiesMode || 'auto',
                    ytdlAuthLastExportAt: status.lastExportAt || prev.ytdlAuthLastExportAt || '',
                }))
            }
        } catch (err) {
            setYoutubeAuthError(errorMessage(err) || t('dlErrorDefault'))
        }
    }, [t])

    useEffect(() => {
        refreshYoutubeAuthStatus()
    }, [refreshYoutubeAuthStatus])

    const updateEnc = <K extends keyof EncodingSettings,>(key: K, val: EncodingSettings[K]) => setEnc(prev => ({ ...prev, [key]: val }))
    const updateApp = <K extends keyof AppConfig,>(key: K, val: AppConfig[K]) => setAppConfig(prev => ({ ...prev, [key]: val }))
    const getYtdlUpdateStageText = useCallback((stage: string) => {
        return t(YTDL_UPDATE_STAGE_KEYS[stage] || 'ytdlUpdateChecking')
    }, [t])

    const refreshYtdlInfo = useCallback(async () => {
        try {
            const info = await window.api.getYtdlInfo()
            setYtdlInfo(info)
        } catch {
            setYtdlInfo({ found: false, version: null, source: 'bundled' })
        }
    }, [])

    useEffect(() => {
        refreshYtdlInfo()
    }, [refreshYtdlInfo])

    useEffect(() => {
        if (ytdlTool) return
        if (!window.api.onYtdlUpdateProgress) return
        return window.api.onYtdlUpdateProgress((payload) => {
            setYtdlUpdateState(prev => {
                const isError = payload.stage === 'error'
                const isDone = payload.stage === 'done'
                const hasPercent = Object.prototype.hasOwnProperty.call(payload, 'percent')
                const progress = isError
                    ? prev.progress
                    : hasPercent
                        ? typeof payload.percent === 'number' && Number.isFinite(payload.percent)
                            ? Math.max(0, Math.min(100, payload.percent))
                            : null
                        : prev.progress

                return {
                    ...prev,
                    status: isError ? 'error' : (isDone ? 'ok' : 'updating'),
                    stageMessage: isError ? prev.stageMessage : getYtdlUpdateStageText(payload.stage),
                    progress,
                    receivedBytes: payload.receivedBytes ?? prev.receivedBytes,
                    totalBytes: payload.totalBytes ?? prev.totalBytes,
                }
            })
        })
    }, [getYtdlUpdateStageText, ytdlTool])

    const handleSave = async () => {
        const supportsMultiPass = MULTI_PASS_ENCODERS.has(enc.encoder)
            && !(enc.quality === 'lossless' && (enc.encoder || '').startsWith('nvenc_'))
        const normalizedEnc = normalizeEncoderSettings({
            ...enc,
            ...(gpuInfo.platform === 'darwin' ? { hwDecoding: 'videotoolbox' } : {}),
            ...(!supportsMultiPass ? { multiPass: false } : {}),
        })
        setEnc(normalizedEnc)
        try {
            await onSave(normalizedEnc, appConfig)
            await window.api.setBackgroundMode(appConfig.backgroundMode !== false)
            setSavedFlash(true)
            setTimeout(() => setSavedFlash(false), 2000)
        } catch (error) {
            setYoutubeAuthError(errorMessage(error, t('dlErrorDefault')))
        }
    }

    const handleReset = () => {
        const decoderMap: Record<string, string> = { apple: 'videotoolbox', nvidia: 'nvdec', intel: 'qsv' }
        const vendor = gpuInfo?.accelerationVendor || gpuInfo?.vendor || null
        const decoder = decoderMap[vendor || ''] || 'none'
        const base = vendor ? getDefaultSettingsForGpu(vendor) : { ...DEFAULT_SETTINGS }
        setEnc({ ...base, hwDecoding: decoder })
    }

    const handleBrowseOutputDir = async () => {
        const dir = await window.api.selectFolder()
        if (dir) {
            updateApp('defaultOutputDir', dir)
            setResolvedOutputDir(dir)
            onOutputDirChange?.(dir)
        }
    }

    const handleResetOutputDir = async () => {
        updateApp('defaultOutputDir', '')
        await onOutputDirChange?.('')
        window.api.getDefaultOutputDir().then(dir => setResolvedOutputDir(dir))
    }

    const handleBrowseCookiesFile = async () => {
        const file = await window.api.selectCookiesFile()
        if (file) updateApp('ytdlCookiesFile', file)
    }

    const handleClearCookiesFile = () => updateApp('ytdlCookiesFile', '')

    const handleCheckGorexUpdates = async () => {
        setGorexUpdateState(prev => createGorexUpdateState({
            ...prev,
            status: 'checking',
            message: t('gorexUpdateChecking'),
        }))
        try {
            const result = await window.api.checkForUpdates({ manual: true })
            if (result?.ok === false) {
                throw new Error(result.error || t('dlErrorDefault'))
            }
            const currentVersion = result?.currentVersion || gorexUpdateState.currentVersion || ''
            const latestVersion = result?.latestVersion || currentVersion
            if (result?.updateAvailable) {
                setGorexUpdateState(createGorexUpdateState({
                    status: 'update-available',
                    message: t('gorexUpdateAvailableManual').replace('{v}', latestVersion),
                    currentVersion,
                    latestVersion,
                    downloadUrl: result.downloadUrl || 'https://github.com/Gor80hd/Gorex/releases/latest',
                }))
            } else {
                setGorexUpdateState(createGorexUpdateState({
                    status: 'ok',
                    message: t('gorexUpdateLatest').replace('{v}', latestVersion || currentVersion),
                    currentVersion,
                    latestVersion,
                    downloadUrl: result?.downloadUrl || '',
                }))
            }
        } catch (err) {
            const errorText = cleanGorexUpdateError(errorMessage(err)) || t('dlErrorDefault')
            setGorexUpdateState(prev => ({
                ...prev,
                status: 'error',
                message: `${t('gorexUpdateFailed')}: ${errorText}`,
            }))
        }
    }

    const handleOpenGorexRelease = () => {
        const url = gorexUpdateState.downloadUrl || 'https://github.com/Gor80hd/Gorex/releases/latest'
        window.api.openExternal(url)
    }

    const handleYoutubeLogin = async () => {
        setYoutubeAuthBusy(true)
        setYoutubeAuthError('')
        try {
            await window.api.openYoutubeLoginWindow()
            await refreshYoutubeAuthStatus()
        } catch (err) {
            setYoutubeAuthError(errorMessage(err) || t('dlErrorDefault'))
        } finally {
            setYoutubeAuthBusy(false)
        }
    }

    const handleExportYoutubeCookies = async () => {
        setYoutubeAuthBusy(true)
        setYoutubeAuthError('')
        try {
            const status = await window.api.exportYoutubeCookies()
            setYoutubeAuthStatus(status)
            setAppConfig(prev => ({
                ...prev,
                ytdlManagedCookiesFile: status?.managedCookiesFile || prev.ytdlManagedCookiesFile || '',
                ytdlCookiesMode: 'auto',
                ytdlAuthLastExportAt: status?.lastExportAt || new Date().toISOString(),
            }))
        } catch (err) {
            setYoutubeAuthError(errorMessage(err) || t('dlErrorDefault'))
        } finally {
            setYoutubeAuthBusy(false)
        }
    }

    const handleClearYoutubeAuth = async () => {
        setYoutubeAuthBusy(true)
        setYoutubeAuthError('')
        try {
            const status = await window.api.clearYoutubeAuth()
            setYoutubeAuthStatus(status)
            setAppConfig(prev => ({ ...prev, ytdlManagedCookiesFile: '', ytdlAuthLastExportAt: '' }))
        } catch (err) {
            setYoutubeAuthError(errorMessage(err) || t('dlErrorDefault'))
        } finally {
            setYoutubeAuthBusy(false)
        }
    }

    const handleUpdateYtdl = async () => {
        setYtdlUpdateState(createYtdlUpdateState({
            status: 'updating',
            stageMessage: t('ytdlUpdateStagePreparing'),
            progress: 0,
        }))
        try {
            const result = await window.api.updateYtdl()
            if (result?.ok === false) {
                throw new Error(result.error || t('dlErrorDefault'))
            }
            const info = result.info ?? await window.api.getYtdlInfo()
            setYtdlInfo(info)
            setYtdlUpdateState(createYtdlUpdateState({
                status: 'ok',
                message: t('ytdlUpdateSuccess'),
                stageMessage: t('ytdlUpdateStageDone'),
                progress: 100,
            }))
        } catch (err) {
            const errorText = cleanYtdlUpdateError(errorMessage(err)) || t('dlErrorDefault')
            setYtdlUpdateState(prev => ({
                ...prev,
                status: 'error',
                message: `${t('ytdlUpdateFailed')}: ${errorText}`,
                stageMessage: prev.stageMessage || t('ytdlUpdateStageError'),
            }))
        }
    }

    const handleOpenTemp = () => {
        window.api.openTempFolder()
    }

    const [showResetConfirm, setShowResetConfirm] = useState(false)
    const handleClearCache = () => setShowResetConfirm(true)
    const handleConfirmReset = async () => {
        await window.api.clearAllSettings()
        appStorage.clear()
        window.api.relaunchApp()
    }

    // Derived values for video tab
    const rfTable = CODEC_RF[enc.encoder] || CODEC_RF.x265
    const speedPresets = ENCODER_PRESETS[enc.encoder] ?? []
    const isMac = gpuInfo.platform === 'darwin'
    const platformEncoderGroups = getEncoderGroupsForPlatform(gpuInfo.platform)
    const supportsMultiPass = MULTI_PASS_ENCODERS.has(enc.encoder)
        && !(enc.quality === 'lossless' && (enc.encoder || '').startsWith('nvenc_'))
    const isHWEncoder = ['nvenc', 'qsv', 'vce', 'mf', 'vt_'].some(p => (enc.encoder || '').startsWith(p))
    const isPassthru = (enc.audioCodec || 'av_aac').startsWith('copy')
    const effectiveYtdlInfo = ytdlTool?.info || ytdlInfo
    const effectiveYtdlUpdateState = ytdlTool ? {
        status: ytdlTool.status === 'up-to-date' ? 'ok' : ytdlTool.status,
        progress: ytdlTool.progress,
        receivedBytes: ytdlTool.receivedBytes || 0,
        totalBytes: ytdlTool.totalBytes || 0,
        message: ytdlTool.message || '',
        stageMessage: ytdlTool.stageMessage || '',
    } : ytdlUpdateState
    const ytdlVersionText = !effectiveYtdlInfo
        ? t('ytdlUpdateChecking')
        : effectiveYtdlInfo.found
            ? `yt-dlp ${effectiveYtdlInfo.version || t('ytdlToolVersionUnknown')}`
            : t('ytdlUpdateNotFound')
    const ytdlSourceText = effectiveYtdlInfo?.source === 'user' ? t('ytdlToolSourceUpdated') : t('ytdlToolSourceBundled')
    const ytdlUpdateProgress = typeof effectiveYtdlUpdateState.progress === 'number' && Number.isFinite(effectiveYtdlUpdateState.progress)
        ? Math.round(Math.max(0, Math.min(100, effectiveYtdlUpdateState.progress)))
        : null
    const ytdlUpdateBytesText = effectiveYtdlUpdateState.receivedBytes > 0
        ? effectiveYtdlUpdateState.totalBytes
            ? `${formatUpdateBytes(effectiveYtdlUpdateState.receivedBytes)} / ${formatUpdateBytes(effectiveYtdlUpdateState.totalBytes)}`
            : formatUpdateBytes(effectiveYtdlUpdateState.receivedBytes)
        : ''
    const showYtdlUpdateProgress = effectiveYtdlUpdateState.status === 'updating' || effectiveYtdlUpdateState.progress !== null
    const ytdlUpdateIndeterminate = effectiveYtdlUpdateState.status === 'updating' && ytdlUpdateProgress === null
    const effectiveTwitchInfo = twitchTool?.info || null
    const effectiveTwitchUpdateState = twitchTool ? {
        status: twitchTool.status === 'up-to-date' ? 'ok' : twitchTool.status,
        progress: twitchTool.progress,
        receivedBytes: twitchTool.receivedBytes || 0,
        totalBytes: twitchTool.totalBytes || 0,
        message: twitchTool.message || '',
        stageMessage: twitchTool.stageMessage || '',
    } : createYtdlUpdateState()
    const twitchVersionText = !effectiveTwitchInfo
        ? t('ytdlUpdateChecking')
        : effectiveTwitchInfo.found
            ? `TwitchDownloaderCLI ${effectiveTwitchInfo.version || t('twitchToolVersionUnknown')}`
            : t('twitchUpdateNotFound')
    const twitchSourceText = effectiveTwitchInfo?.source === 'user' ? t('twitchToolSourceUpdated') : t('twitchToolSourceBundled')
    const twitchUpdateProgress = typeof effectiveTwitchUpdateState.progress === 'number' && Number.isFinite(effectiveTwitchUpdateState.progress)
        ? Math.round(Math.max(0, Math.min(100, effectiveTwitchUpdateState.progress)))
        : null
    const twitchUpdateBytesText = effectiveTwitchUpdateState.receivedBytes > 0
        ? effectiveTwitchUpdateState.totalBytes
            ? `${formatUpdateBytes(effectiveTwitchUpdateState.receivedBytes)} / ${formatUpdateBytes(effectiveTwitchUpdateState.totalBytes)}`
            : formatUpdateBytes(effectiveTwitchUpdateState.receivedBytes)
        : ''
    const showTwitchUpdateProgress = effectiveTwitchUpdateState.status === 'updating' || effectiveTwitchUpdateState.progress !== null
    const twitchUpdateIndeterminate = effectiveTwitchUpdateState.status === 'updating' && twitchUpdateProgress === null
    const gorexVersionTag = gorexUpdateState.currentVersion
        ? t('gorexUpdateCurrentTag').replace('{v}', gorexUpdateState.currentVersion)
        : t('gorexUpdateManualTag')
    const gorexUpdateAvailable = gorexUpdateState.status === 'update-available' && !!gorexUpdateState.downloadUrl

    const sectionRef = (id: string) => (el: HTMLElement | null) => { sectionRefs.current[id] = el }

    return { t, lang, setLang, activeSection, setActiveSection, savedFlash, setSavedFlash, gpuInfo, setGpuInfo, TABS, appConfig, setAppConfig, enc, setEnc, cliStatus, setCliStatus, cliVersion, setCliVersion, cliPath, setCliPath, ytdlInfo, setYtdlInfo, ytdlUpdateState, setYtdlUpdateState, gorexUpdateState, setGorexUpdateState, youtubeAuthStatus, setYoutubeAuthStatus, youtubeAuthBusy, setYoutubeAuthBusy, youtubeAuthError, setYoutubeAuthError, resolvedOutputDir, setResolvedOutputDir, contentRef, sectionRefs, isScrollingRef, scrollToSection, refreshYoutubeAuthStatus, updateEnc, updateApp, getYtdlUpdateStageText, refreshYtdlInfo, handleSave, handleReset, handleBrowseOutputDir, handleResetOutputDir, handleBrowseCookiesFile, handleClearCookiesFile, handleCheckGorexUpdates, handleOpenGorexRelease, handleYoutubeLogin, handleExportYoutubeCookies, handleClearYoutubeAuth, handleUpdateYtdl, handleOpenTemp, showResetConfirm, setShowResetConfirm, handleClearCache, handleConfirmReset, rfTable, speedPresets, isMac, platformEncoderGroups, supportsMultiPass, isHWEncoder, isPassthru, effectiveYtdlInfo, effectiveYtdlUpdateState, ytdlVersionText, ytdlSourceText, ytdlUpdateProgress, ytdlUpdateBytesText, showYtdlUpdateProgress, ytdlUpdateIndeterminate, effectiveTwitchInfo, effectiveTwitchUpdateState, twitchVersionText, twitchSourceText, twitchUpdateProgress, twitchUpdateBytesText, showTwitchUpdateProgress, twitchUpdateIndeterminate, gorexVersionTag, gorexUpdateAvailable, sectionRef }
}
