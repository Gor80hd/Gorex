import { useState, useEffect, useRef, useCallback } from 'react'
import {
    GsSelect,
    DEFAULT_SETTINGS,
    CODEC_RF,
    ENCODER_PRESETS,
    ENCODER_GROUPS,
    initDefaultSettings,
    getDefaultSettingsForGpu,
    WEBM_COMPATIBLE_ENCODERS,
    WEBM_COMPATIBLE_AUDIO,
    ENCODER_DISABLED_FORMATS,
} from '../../components/GlobalSettings/GlobalSettings'
import { useLanguage } from '../../i18n'
import './SettingsPage.scss'

// ─── Audio codec list ─────────────────────────────────────────────────────────
const AUDIO_CODECS = [
    { value: 'av_aac',     label: 'AAC (libavcodec)' },
    { value: 'fdk_aac',    label: 'AAC (FDK)' },
    { value: 'fdk_haac',   label: 'HE-AAC (FDK)' },
    { value: 'mp3',        label: 'MP3' },
    { value: 'ac3',        label: 'AC-3 (Dolby Digital)' },
    { value: 'eac3',       label: 'E-AC-3 (Dolby Plus)' },
    { value: 'vorbis',     label: 'Vorbis' },
    { value: 'flac16',     label: 'FLAC 16-bit' },
    { value: 'flac24',     label: 'FLAC 24-bit' },
    { value: 'opus',       label: 'Opus' },
    { value: 'copy',       label: 'Passthru (auto/авто)' },
    { value: 'copy:aac',   label: 'AAC Passthru' },
    { value: 'copy:ac3',   label: 'AC3 Passthru' },
    { value: 'copy:eac3',  label: 'E-AC3 Passthru' },
    { value: 'copy:dts',   label: 'DTS Passthru' },
    { value: 'copy:dtshd', label: 'DTS-HD Passthru' },
    { value: 'copy:mp3',   label: 'MP3 Passthru' },
    { value: 'copy:truehd',label: 'TrueHD Passthru' },
]

// ─── GPU vendor → primary encoder groups ─────────────────────────────────────
const GPU_VENDOR_LABEL = {
    nvidia: { label: 'NVIDIA', icon: 'bi-gpu-card', color: '#76b900' },
    amd:    { label: 'AMD',    icon: 'bi-gpu-card', color: '#ed1c24' },
    intel:  { label: 'Intel',  icon: 'bi-gpu-card', color: '#0071c5' },
    unknown:{ label: null,     icon: 'bi-question-circle', color: null },
}

function getGpuMeta(gpuName) {
    const n = gpuName.toLowerCase()
    if (n.includes('nvidia')) return GPU_VENDOR_LABEL.nvidia
    if (n.includes('amd') || n.includes('radeon')) return GPU_VENDOR_LABEL.amd
    if (n.includes('intel')) return GPU_VENDOR_LABEL.intel
    return GPU_VENDOR_LABEL.unknown
}

const SOFTWARE_PRIMARY = [
    { value: 'x265',    label: 'H.265 / HEVC (x265)' },
    { value: 'x264',    label: 'H.264 (x264)' },
    { value: 'svt_av1', label: 'AV1 (SVT-AV1)' },
]

function getPrimaryEncoderGroups(vendor, t) {
    if (vendor === 'nvidia') return [
        { label: 'NVIDIA NVENC (' + t('recommended') + ')', encoders: [
            { value: 'nvenc_h265', label: 'H.265 NVENC' },
            { value: 'nvenc_h264', label: 'H.264 NVENC' },
            { value: 'nvenc_av1',  label: 'AV1 NVENC' },
        ]},
        { label: t('softwareEncoders'), encoders: SOFTWARE_PRIMARY },
    ]
    if (vendor === 'amd') return [
        { label: 'AMD VCE (' + t('recommended') + ')', encoders: [
            { value: 'vce_h265', label: 'H.265 VCE' },
            { value: 'vce_h264', label: 'H.264 VCE' },
            { value: 'vce_av1',  label: 'AV1 VCE' },
        ]},
        { label: t('softwareEncoders'), encoders: SOFTWARE_PRIMARY },
    ]
    if (vendor === 'intel') return [
        { label: 'Intel QSV (' + t('recommended') + ')', encoders: [
            { value: 'qsv_h265', label: 'H.265 QSV' },
            { value: 'qsv_h264', label: 'H.264 QSV' },
            { value: 'qsv_av1',  label: 'AV1 QSV' },
        ]},
        { label: t('softwareEncoders'), encoders: SOFTWARE_PRIMARY },
    ]
    return [
        { label: t('softwareEncoders'), encoders: [
            { value: 'x265',          label: 'H.265 / HEVC (x265)' },
            { value: 'x265_10bit',    label: 'H.265 10-bit (x265)' },
            { value: 'x264',          label: 'H.264 (x264)' },
            { value: 'svt_av1',       label: 'AV1 (SVT-AV1)' },
            { value: 'svt_av1_10bit', label: 'AV1 10-bit' },
        ]},
    ]
}

// ─── Sidebar tabs ─────────────────────────────────────────────────────────────
const TABS_IDS = [
    { id: 'app',       icon: 'bi-gear' },
    { id: 'video',     icon: 'bi-camera-video' },
    { id: 'audio',     icon: 'bi-music-note-beamed' },
    { id: 'subtitles', icon: 'bi-badge-cc' },
    { id: 'filters',   icon: 'bi-sliders' },
    { id: 'hdr',       icon: 'bi-stars' },
]

// ─── Toggle switch ────────────────────────────────────────────────────────────
function Toggle({ value, onChange, disabled }) {
    return (
        <button
            className={`sp-toggle ${value ? 'on' : 'off'}${disabled ? ' disabled' : ''}`}
            onClick={() => !disabled && onChange(!value)}
            type="button"
        >
            <div className="sp-toggle-knob"></div>
        </button>
    )
}

// ─── Setting row ──────────────────────────────────────────────────────────────
function Row({ label, hint, children, className }) {
    return (
        <div className={`sp-row${className ? ' ' + className : ''}`}>
            <div className="sp-row-label">
                <span className="sp-row-name">{label}</span>
                {hint && <span className="sp-row-hint">{hint}</span>}
            </div>
            <div className="sp-row-control">{children}</div>
        </div>
    )
}

// ─── Path row (with text input + browse button) ───────────────────────────────
function PathRow({ label, hint, value, onChange, onBrowse, placeholder }) {
    return (
        <div className="sp-row sp-row--path">
            <div className="sp-row-label">
                <span className="sp-row-name">{label}</span>
                {hint && <span className="sp-row-hint">{hint}</span>}
            </div>
            <div className="sp-row-control sp-path-control">
                <input
                    className="sp-path-input"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    spellCheck={false}
                />
                <button className="sp-browse-btn" onClick={onBrowse} type="button" title="Выбрать">
                    <i className="bi bi-folder2-open"></i>
                </button>
            </div>
        </div>
    )
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ icon, title }) {
    return (
        <div className="sp-section-header">
            <i className={`bi ${icon}`}></i>
            <span>{title}</span>
        </div>
    )
}

// ─── Main component ───────────────────────────────────────────────────────────
function SettingsPage({ theme, themeMode, onThemeModeChange, onBack, appSettings, onSave }) {
    const { t, lang, setLang } = useLanguage()
    const [activeSection, setActiveSection] = useState('app')
    const [savedFlash, setSavedFlash] = useState(false)
    const [gpuInfo, setGpuInfo] = useState({ gpus: [], vendor: 'unknown' })

    const TABS = TABS_IDS.map(tab => ({
        ...tab,
        label: t({ app: 'tabApp', video: 'tabVideo', audio: 'tabAudio', subtitles: 'tabSubtitles', filters: 'tabFilters', hdr: 'tabHdr' }[tab.id]),
    }))

    // App-level config (output folder)
    const [appConfig, setAppConfig] = useState({
        defaultOutputDir: '',
    })

    // Default encoding settings
    const [enc, setEnc] = useState(() => initDefaultSettings())

    // CLI status
    const [cliStatus, setCliStatus] = useState('checking') // 'checking' | 'ok' | 'error'
    const [cliVersion, setCliVersion] = useState('')
    const [cliPath, setCliPath] = useState('')

    // Resolved output dir (actual system path shown in UI)
    const [resolvedOutputDir, setResolvedOutputDir] = useState('')

    // Refs for scroll
    const contentRef = useRef(null)
    const sectionRefs = useRef({})
    const isScrollingRef = useRef(false)

    // Sync appConfig when prop arrives from IPC
    useEffect(() => {
        if (appSettings) {
            setAppConfig(prev => ({ ...prev, ...appSettings }))
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
            const decoderMap = { nvidia: 'nvdec', intel: 'qsv' }
            const decoder = decoderMap[info.vendor]
            if (decoder) setEnc(prev => prev.hwDecoding === 'none' ? { ...prev, hwDecoding: decoder } : prev)
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
                        setActiveSection(entry.target.dataset.section)
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

    const scrollToSection = useCallback((id) => {
        const container = contentRef.current
        const el = sectionRefs.current[id]
        if (!container || !el) return
        setActiveSection(id)
        isScrollingRef.current = true
        container.scrollTo({ top: el.offsetTop - 16, behavior: 'smooth' })
        setTimeout(() => { isScrollingRef.current = false }, 600)
    }, [])

    const updateEnc = (key, val) => setEnc(prev => ({ ...prev, [key]: val }))
    const updateApp = (key, val) => setAppConfig(prev => ({ ...prev, [key]: val }))

    const handleSave = () => {
        onSave(enc, appConfig)
        setSavedFlash(true)
        setTimeout(() => setSavedFlash(false), 2000)
    }

    const handleReset = () => {
        const decoderMap = { nvidia: 'nvdec', intel: 'qsv' }
        const decoder = decoderMap[gpuInfo.vendor] || 'none'
        const vendor = gpuInfo?.vendor || null
        const base = vendor ? getDefaultSettingsForGpu(vendor) : { ...DEFAULT_SETTINGS }
        setEnc({ ...base, hwDecoding: decoder })
    }

    const handleBrowseOutputDir = async () => {
        const dir = await window.api.selectFolder()
        if (dir) {
            updateApp('defaultOutputDir', dir)
            setResolvedOutputDir(dir)
        }
    }

    const handleResetOutputDir = () => {
        updateApp('defaultOutputDir', '')
        window.api.getDefaultOutputDir().then(dir => setResolvedOutputDir(dir))
    }

    // Derived values for video tab
    const rfTable = CODEC_RF[enc.encoder] || CODEC_RF.x265
    const speedPresets = ENCODER_PRESETS[enc.encoder] ?? []
    const isHWEncoder = ['nvenc', 'qsv', 'vce', 'mf'].some(p => (enc.encoder || '').startsWith(p))
    const isPassthru = (enc.audioCodec || 'av_aac').startsWith('copy')

    const sectionRef = (id) => (el) => { sectionRefs.current[id] = el }

    return (
        <div className={`sp-page ${theme}`}>

            {/* ── Header ── */}
            <div className="sp-header">
                <button className="sp-back-btn" onClick={onBack}>
                    <i className="bi bi-arrow-left"></i>
                    {t('back')}
                </button>
                <div className="sp-header-title">
                    <i className="bi bi-gear-fill"></i>
                    {t('settingsTitle')}
                </div>
                <div className="sp-header-actions">
                    <button className="sp-btn-reset" onClick={handleReset} title={t('settingsResetTitle')}>
                        <i className="bi bi-arrow-counterclockwise"></i>
                        {t('reset')}
                    </button>
                    <button className={`sp-btn-save${savedFlash ? ' saved' : ''}`} onClick={handleSave}>
                        {savedFlash
                            ? <><i className="bi bi-check-lg"></i>{t('saved')}</>
                            : <><i className="bi bi-floppy"></i>{t('save')}</>
                        }
                    </button>
                </div>
            </div>

            <div className="sp-body">

                {/* ── Sidebar ── */}
                <div className="sp-sidebar">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            className={`sp-tab${activeSection === tab.id ? ' active' : ''}`}
                            onClick={() => scrollToSection(tab.id)}
                        >
                            <i className={`bi ${tab.icon}`}></i>
                            {tab.label}
                        </button>
                    ))}
                    <div className="sp-sidebar-spacer"></div>
                    <p className="sp-sidebar-hint">
                        {t('settingsSidebarHint')}
                    </p>
                </div>

                {/* ── Content ── */}
                <div className="sp-content" ref={contentRef}>

                    {/* ══ APP ══ */}
                    <div className="sp-section" data-section="app" ref={sectionRef('app')}>
                        <SectionHeader icon="bi-palette" title={t('sectionAppearance')} />
                        <Row label={t('rowTheme')} hint={t('hintTheme')}>
                            <div className="sp-theme-selector">
                                {[
                                    { mode: 'dark',  icon: 'bi-moon-fill',     labelKey: 'themeDark' },
                                    { mode: 'light', icon: 'bi-sun-fill',      labelKey: 'themeLight' },
                                    { mode: 'auto',  icon: 'bi-circle-half',   labelKey: 'themeAuto' },
                                ].map(({ mode, icon, labelKey }) => (
                                    <button
                                        key={mode}
                                        className={`sp-theme-btn${themeMode === mode ? ' active' : ''}`}
                                        onClick={() => onThemeModeChange(mode)}
                                        type="button"
                                    >
                                        <i className={`bi ${icon}`}></i>
                                        {t(labelKey)}
                                    </button>
                                ))}
                            </div>
                        </Row>

                        <SectionHeader icon="bi-translate" title={t('sectionLanguage')} />
                        <Row label={t('rowLanguage')} hint={t('hintLanguage')}>
                            <div className="sp-theme-selector">
                                {[
                                    { code: 'ru', labelKey: 'langRu' },
                                    { code: 'en', labelKey: 'langEn' },
                                ].map(({ code, labelKey }) => (
                                    <button
                                        key={code}
                                        className={`sp-theme-btn${lang === code ? ' active' : ''}`}
                                        onClick={() => setLang(code)}
                                        type="button"
                                    >
                                        {t(labelKey)}
                                    </button>
                                ))}
                            </div>
                        </Row>

                        <SectionHeader icon="bi-terminal" title={t('sectionCli')} />
                        <Row label={t('rowCliStatus')} hint={t('hintCliStatus')}>
                            {cliStatus === 'checking' && (
                                <span className="sp-cli-status sp-cli-status--checking">
                                    <i className="bi bi-arrow-repeat"></i> {t('cliChecking')}
                                </span>
                            )}
                            {cliStatus === 'ok' && (
                                <span className="sp-cli-status sp-cli-status--ok">
                                    <i className="bi bi-check-circle-fill"></i>
                                    {t('cliFound')}{cliVersion ? ` · v${cliVersion}` : ''}
                                </span>
                            )}
                            {cliStatus === 'error' && (
                                <span className="sp-cli-status sp-cli-status--error" title={cliPath}>
                                    <i className="bi bi-x-circle-fill"></i> {t('cliNotFound')}
                                </span>
                            )}
                        </Row>

                        <SectionHeader icon="bi-gpu-card" title={t('sectionGpu')} />
                        <div className="sp-gpu-widget">
                            {gpuInfo.gpus.length > 0 ? (
                                <>
                                    <div className="sp-gpu-items-row">
                                        {gpuInfo.gpus.map((gpu, i) => {
                                            const meta = getGpuMeta(gpu)
                                            const isPrimary = gpu === gpuInfo.primaryGpu
                                            return (
                                                <div key={i} className={`sp-gpu-item${isPrimary ? ' sp-gpu-item--primary' : ''}`}>
                                                    <span
                                                        className="sp-gpu-badge"
                                                        style={meta.color ? { color: meta.color, borderColor: meta.color + '40' } : {}}
                                                    >
                                                        <i className={`bi ${meta.icon}`}></i>
                                                        {meta.label || 'GPU'}
                                                    </span>
                                                    {isPrimary && <span className="sp-gpu-primary-dot"></span>}
                                                    <span className="sp-gpu-name">{gpu}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <span className="sp-gpu-hint">{t('gpuCodecHint')}</span>
                                </>
                            ) : (
                                <span className="sp-gpu-none">
                                    <i className="bi bi-question-circle"></i>
                                    {t('gpuUnknown')}
                                </span>
                            )}
                        </div>
                        <Row label={t('rowShowAllCodecs')} hint={t('hintShowAllCodecs')}>
                            <Toggle value={!!enc.showAllCodecs} onChange={v => updateEnc('showAllCodecs', v)} />
                        </Row>

                        <SectionHeader icon="bi-folder2" title={t('sectionOutputFolder')} />
                        <div className="sp-folder-widget">
                            <div className="sp-folder-widget__info">
                                <span className="sp-folder-widget__path">{resolvedOutputDir || '…'}</span>
                                {!appConfig.defaultOutputDir && (
                                    <span className="sp-folder-widget__tag">{t('folderDefault')}</span>
                                )}
                            </div>
                            <div className="sp-folder-widget__actions">
                                {appConfig.defaultOutputDir && (
                                    <button className="sp-folder-widget__reset" onClick={handleResetOutputDir} title={t('folderResetTitle')}>
                                        <i className="bi bi-x-lg"></i>
                                    </button>
                                )}
                                <button className="sp-folder-widget__browse" onClick={handleBrowseOutputDir}>
                                    <i className="bi bi-folder2-open"></i> {t('folderChange')}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ══ VIDEO ══ */}
                    <div className="sp-section" data-section="video" ref={sectionRef('video')}>
                        <p className="sp-tab-description">{t('videoTabDesc')}</p>
                        <SectionHeader icon="bi-file-earmark-play" title={t('sectionContainer')} />
                        <Row label={t('rowFormat')} hint={t('hintFormat')}>
                            <GsSelect
                                value={enc.format}
                                options={(() => {
                                    const disabledSet = ENCODER_DISABLED_FORMATS[enc.encoder] || new Set()
                                    return [
                                        { value: 'av_mp4',  label: 'MP4',  disabled: disabledSet.has('av_mp4') },
                                        { value: 'av_mkv',  label: 'MKV' },
                                        { value: 'av_webm', label: 'WebM', disabled: disabledSet.has('av_webm') },
                                        { value: 'av_mov',  label: 'MOV',  disabled: disabledSet.has('av_mov') },
                                    ]
                                })()}
                                onChange={v => {
                                    const patch = { format: v }
                                    if (v === 'av_webm') {
                                        if (!WEBM_COMPATIBLE_ENCODERS.has(enc.encoder)) {
                                            const speeds = ENCODER_PRESETS.vp9
                                            patch.encoder = 'vp9'
                                            patch.encoderSpeed = speeds[Math.floor(speeds.length / 2)]?.value ?? 'good'
                                        }
                                        const audioCodec = enc.audioCodec || 'av_aac'
                                        if (!WEBM_COMPATIBLE_AUDIO.has(audioCodec) && !audioCodec.startsWith('copy')) {
                                            patch.audioCodec = 'opus'
                                        }
                                    }
                                    setEnc(prev => ({ ...prev, ...patch }))
                                }}
                            />
                        </Row>

                        <SectionHeader icon="bi-cpu" title={t('sectionEncoder')} />
                        <Row label={t('rowVideoCodec')} hint={t('hintVideoCodec')}>
                            <GsSelect
                                value={enc.encoder}
                                groups={ENCODER_GROUPS.map(g => ({
                                    label: g.label,
                                    options: g.encoders.map(e => ({
                                        value: e.value,
                                        label: e.label,
                                        disabled: enc.format === 'av_webm' && !WEBM_COMPATIBLE_ENCODERS.has(e.value),
                                    }))
                                }))}
                                onChange={v => {
                                    const speeds = ENCODER_PRESETS[v] ?? []
                                    const mid = speeds[Math.floor(speeds.length / 2)]?.value ?? 'medium'
                                    setEnc(prev => ({ ...prev, encoder: v, encoderSpeed: mid }))
                                }}
                            />
                        </Row>
                        {speedPresets.length > 0 && (
                            <Row label={t('rowSpeedPreset')} hint={t('hintSpeedPreset')}>
                                <GsSelect
                                    value={enc.encoderSpeed}
                                    options={speedPresets.map(sp => ({ value: sp.value, label: sp.label }))}
                                    onChange={v => updateEnc('encoderSpeed', v)}
                                />
                            </Row>
                        )}

                        <SectionHeader icon="bi-sliders2" title={t('sectionQuality')} />
                        <Row label={t('rowQualityMode')} hint={t('hintQualityMode')}>
                            <GsSelect
                                value={enc.quality}
                                options={[
                                    { value: 'source', label: t('qualitySource') },
                                    { value: 'high',   label: `${t('qualityHigh')} (RF ${rfTable.high})` },
                                    { value: 'medium', label: `${t('qualityMedium')} (RF ${rfTable.medium})` },
                                    { value: 'low',    label: `${t('qualityLow')} (RF ${rfTable.low})` },
                                    { value: 'potato', label: `${t('qualityPotato')} (RF ${rfTable.potato})` },
                                    { value: 'custom', label: enc.quality === 'custom' ? `${t('qualityCustomLabel')} (RF ${enc.customQuality})` : t('qualityCustomEmpty') },
                                ]}
                                onChange={v => updateEnc('quality', v)}
                            />
                        </Row>
                        {enc.quality === 'custom' && (
                            <Row
                                label={`RF / CRF: ${enc.customQuality}`}
                                hint={`${t('rfRange')} ${rfTable.min} (${t('rfBetter')}) — ${rfTable.max} (${t('rfWorse')})`}
                            >
                                <div className="sp-slider-wrap">
                                    <span className="sp-slider-edge">{rfTable.min}</span>
                                    <input
                                        type="range"
                                        className="sp-slider"
                                        min={rfTable.min}
                                        max={rfTable.max}
                                        step={1}
                                        value={enc.customQuality}
                                        onChange={e => updateEnc('customQuality', Number(e.target.value))}
                                    />
                                    <span className="sp-slider-edge">{rfTable.max}</span>
                                </div>
                            </Row>
                        )}

                        <SectionHeader icon="bi-aspect-ratio" title={t('sectionResFps')} />
                        <Row label={t('rowResolution')} hint={t('hintResolution')}>
                            <GsSelect
                                value={enc.resolution}
                                options={[
                                    { value: 'source', label: t('resSource') },
                                    { value: '4k',     label: '4K (2160p)' },
                                    { value: '1440p',  label: '2K (1440p)' },
                                    { value: '1080p',  label: '1080p (Full HD)' },
                                    { value: '720p',   label: '720p (HD)' },
                                    { value: '480p',   label: '480p (SD)' },
                                ]}
                                onChange={v => updateEnc('resolution', v)}
                            />
                        </Row>
                        <Row label={t('rowFps')} hint={t('hintFps')}>
                            <GsSelect
                                value={enc.fps}
                                options={[
                                    { value: 'source', label: t('fpsSource') },
                                    { value: '60',     label: '60 fps' },
                                    { value: '30',     label: '30 fps' },
                                    { value: '25',     label: '25 fps (PAL)' },
                                    { value: '24',     label: t('fpsCinema') },
                                    { value: '23.976', label: '23.976 fps (NTSC)' },
                                ]}
                                onChange={v => updateEnc('fps', v)}
                            />
                        </Row>
                        <Row label={t('rowFpsMode')} hint={t('hintFpsMode')}>
                            <GsSelect
                                value={enc.fpsMode || 'vfr'}
                                options={[
                                    { value: 'vfr', label: t('fpsVfr') },
                                    { value: 'cfr', label: t('fpsCfr') },
                                    { value: 'pfr', label: t('fpsPfr') },
                                ]}
                                onChange={v => updateEnc('fpsMode', v)}
                            />
                        </Row>

                        <SectionHeader icon="bi-lightning-charge" title={t('sectionHwAccel')} />
                        <Row label={t('rowHwDecoding')} hint={t('hintHwDecoding')}>
                            <GsSelect
                                value={enc.hwDecoding || 'none'}
                                options={[
                                    { value: 'none',  label: t('hwDecodingNone') },
                                    { value: 'nvdec', label: 'NVDEC (NVIDIA)' },
                                    { value: 'qsv',   label: 'Quick Sync (Intel)' },
                                ]}
                                onChange={v => updateEnc('hwDecoding', v)}
                            />
                        </Row>
                        <Row label={t('rowMultiPass')} hint={t('hintMultiPass')}>
                            <Toggle value={!!enc.multiPass} onChange={v => updateEnc('multiPass', v)} />
                        </Row>
                    </div>

                    {/* ══ AUDIO ══ */}
                    <div className="sp-section" data-section="audio" ref={sectionRef('audio')}>
                        <SectionHeader icon="bi-music-note-beamed" title={t('sectionAudioCodec')} />
                        <Row label={t('rowAudioCodec')} hint={t('hintAudioCodec')}>
                            <GsSelect
                                value={enc.audioCodec || 'av_aac'}
                                options={AUDIO_CODECS.map(c => ({
                                    ...c,
                                    disabled: enc.format === 'av_webm' && !WEBM_COMPATIBLE_AUDIO.has(c.value) && !c.value.startsWith('copy'),
                                }))}
                                onChange={v => updateEnc('audioCodec', v)}
                            />
                        </Row>

                        {!isPassthru && (
                            <>
                                <SectionHeader icon="bi-speaker" title={t('sectionAudioParams')} />
                                <Row label={t('rowBitrate')} hint={t('hintBitrate')}>
                                    <GsSelect
                                        value={enc.audioBitrate || '160'}
                                        options={[
                                            { value: '64',  label: '64 kbps' },
                                            { value: '96',  label: '96 kbps' },
                                            { value: '128', label: '128 kbps' },
                                            { value: '160', label: `160 kbps (${t('bitrateDefault')})` },
                                            { value: '192', label: '192 kbps' },
                                            { value: '256', label: '256 kbps' },
                                            { value: '320', label: '320 kbps' },
                                        ]}
                                        onChange={v => updateEnc('audioBitrate', v)}
                                    />
                                </Row>
                                <Row label={t('rowMixdown')} hint={t('hintMixdown')}>
                                    <GsSelect
                                        value={enc.audioMixdown || 'stereo'}
                                        options={[
                                            { value: 'mono',    label: t('mixMono') },
                                            { value: 'stereo',  label: t('mixStereo') },
                                            { value: 'dpl2',    label: 'Dolby Pro Logic II' },
                                            { value: '5point1', label: 'Surround 5.1' },
                                            { value: '6point1', label: 'Surround 6.1' },
                                            { value: '7point1', label: 'Surround 7.1' },
                                        ]}
                                        onChange={v => updateEnc('audioMixdown', v)}
                                    />
                                </Row>
                                <Row label={t('rowSampleRate')} hint={t('hintSampleRate')}>
                                    <GsSelect
                                        value={enc.audioSampleRate || 'auto'}
                                        options={[
                                            { value: 'auto',  label: t('srAuto') },
                                            { value: '22.05', label: '22.05 kHz' },
                                            { value: '32',    label: '32 kHz' },
                                            { value: '44.1',  label: '44.1 kHz' },
                                            { value: '48',    label: '48 kHz' },
                                            { value: '96',    label: '96 kHz' },
                                        ]}
                                        onChange={v => updateEnc('audioSampleRate', v)}
                                    />
                                </Row>
                            </>
                        )}

                        <SectionHeader icon="bi-collection-play" title={t('sectionFileMetadata')} />
                        <Row label={t('rowChapterMarkers')} hint={t('hintChapterMarkers')}>
                            <Toggle value={enc.chapterMarkers !== false} onChange={v => updateEnc('chapterMarkers', v)} />
                        </Row>
                        <Row label={t('rowOptimizeMp4')} hint={t('hintOptimizeMp4')}>
                            <Toggle
                                value={!!enc.optimizeMP4}
                                onChange={v => updateEnc('optimizeMP4', v)}
                                disabled={enc.format !== 'av_mp4'}
                            />
                        </Row>
                    </div>

                    {/* ══ SUBTITLES ══ */}
                    <div className="sp-section" data-section="subtitles" ref={sectionRef('subtitles')}>
                        <SectionHeader icon="bi-badge-cc" title={t('sectionSubtitleTracks')} />
                        <Row label={t('rowSubtitles')} hint={t('hintSubtitles')}>
                            <GsSelect
                                value={enc.subtitleMode || 'none'}
                                options={[
                                    { value: 'none',         label: t('subNone') },
                                    { value: 'first',        label: t('subFirst') },
                                    { value: 'all',          label: t('subAll') },
                                    { value: 'scan_forced',  label: t('subScanForced') },
                                ]}
                                onChange={v => updateEnc('subtitleMode', v)}
                            />
                        </Row>
                        {enc.subtitleMode !== 'none' && enc.subtitleMode !== 'all' && (
                            <Row label={t('rowSubtitleBurn')} hint={t('hintSubtitleBurn')}>
                                <Toggle value={!!enc.subtitleBurn} onChange={v => updateEnc('subtitleBurn', v)} />
                            </Row>
                        )}
                        {enc.subtitleMode !== 'none' && !enc.subtitleBurn && enc.subtitleMode !== 'all' && (
                            <Row label={t('rowSubtitleDefault')} hint={t('hintSubtitleDefault')}>
                                <Toggle value={!!enc.subtitleDefault} onChange={v => updateEnc('subtitleDefault', v)} />
                            </Row>
                        )}

                        <SectionHeader icon="bi-translate" title={t('sectionSubtitleLang')} />
                        <Row label={t('rowSubtitleLang')} hint={t('hintSubtitleLang')}>
                            <GsSelect
                                value={enc.subtitleLanguage || 'any'}
                                options={[
                                    { value: 'any', label: t('subLangAny') },
                                    { value: 'eng', label: t('subLangEng') },
                                    { value: 'rus', label: t('subLangRus') },
                                    { value: 'jpn', label: t('subLangJpn') },
                                    { value: 'chi', label: t('subLangChi') },
                                    { value: 'kor', label: t('subLangKor') },
                                    { value: 'fra', label: t('subLangFra') },
                                    { value: 'deu', label: t('subLangDeu') },
                                    { value: 'spa', label: t('subLangSpa') },
                                    { value: 'por', label: t('subLangPor') },
                                    { value: 'ita', label: t('subLangIta') },
                                    { value: 'ara', label: t('subLangAra') },
                                ]}
                                onChange={v => updateEnc('subtitleLanguage', v)}
                            />
                        </Row>
                    </div>

                    {/* ══ FILTERS ══ */}
                    <div className="sp-section" data-section="filters" ref={sectionRef('filters')}>
                        <SectionHeader icon="bi-intersect" title={t('sectionDeinterlace')} />
                        <Row label={t('rowDeinterlace')} hint={t('hintDeinterlace')}>
                            <GsSelect
                                value={enc.deinterlace || 'off'}
                                options={[
                                    { value: 'off',           label: t('deintOff') },
                                    { value: 'yadif_default', label: t('deintYadif') },
                                    { value: 'yadif_bob',     label: t('deintYadifBob') },
                                    { value: 'bwdif_default', label: t('deintBwdif') },
                                    { value: 'bwdif_bob',     label: t('deintBwdifBob') },
                                ]}
                                onChange={v => updateEnc('deinterlace', v)}
                            />
                        </Row>

                        <SectionHeader icon="bi-snow2" title={t('sectionDenoise')} />
                        <Row label={t('rowDenoise')} hint={t('hintDenoise')}>
                            <GsSelect
                                value={enc.denoise || 'off'}
                                options={[
                                    { value: 'off',                label: t('denoiseOff') },
                                    { value: 'nlmeans_ultralight', label: t('denoiseNlUltralight') },
                                    { value: 'nlmeans_light',      label: t('denoiseNlLight') },
                                    { value: 'nlmeans_medium',     label: t('denoiseNlMedium') },
                                    { value: 'nlmeans_strong',     label: t('denoiseNlStrong') },
                                    { value: 'hqdn3d_light',       label: t('denoiseHqLight') },
                                    { value: 'hqdn3d_medium',      label: t('denoiseHqMedium') },
                                    { value: 'hqdn3d_strong',      label: t('denoiseHqStrong') },
                                ]}
                                onChange={v => updateEnc('denoise', v)}
                            />
                        </Row>

                        <SectionHeader icon="bi-grid-3x3" title={t('sectionDeblock')} />
                        <Row label={t('rowDeblock')} hint={t('hintDeblock')}>
                            <GsSelect
                                value={enc.deblock || 'off'}
                                options={[
                                    { value: 'off',        label: t('deblockOff') },
                                    { value: 'ultralight', label: t('deblockUltralight') },
                                    { value: 'light',      label: t('deblockLight') },
                                    { value: 'medium',     label: t('deblockMedium') },
                                    { value: 'strong',     label: t('deblockStrong') },
                                    { value: 'stronger',   label: t('deblockStronger') },
                                ]}
                                onChange={v => updateEnc('deblock', v)}
                            />
                        </Row>

                        <SectionHeader icon="bi-zoom-in" title={t('sectionSharpen')} />
                        <Row label={t('rowSharpen')} hint={t('hintSharpen')}>
                            <GsSelect
                                value={enc.sharpen || 'off'}
                                options={[
                                    { value: 'off',                 label: t('sharpenOff') },
                                    { value: 'unsharp_ultralight',  label: t('sharpenUnsharpUltralight') },
                                    { value: 'unsharp_light',       label: t('sharpenUnsharpLight') },
                                    { value: 'unsharp_medium',      label: t('sharpenUnsharpMedium') },
                                    { value: 'unsharp_strong',      label: t('sharpenUnsharpStrong') },
                                    { value: 'lapsharp_ultralight', label: t('sharpenLapUltralight') },
                                    { value: 'lapsharp_light',      label: t('sharpenLapLight') },
                                    { value: 'lapsharp_medium',     label: t('sharpenLapMedium') },
                                    { value: 'lapsharp_strong',     label: t('sharpenLapStrong') },
                                ]}
                                onChange={v => updateEnc('sharpen', v)}
                            />
                        </Row>

                        <SectionHeader icon="bi-camera" title={t('sectionFrameTransform')} />
                        <Row label={t('rowGrayscale')} hint={t('hintGrayscale')}>
                            <Toggle value={!!enc.grayscale} onChange={v => updateEnc('grayscale', v)} />
                        </Row>
                        <Row label={t('rowRotate')} hint={t('hintRotate')}>
                            <GsSelect
                                value={enc.rotate || '0'}
                                options={[
                                    { value: '0',     label: t('rotateNone') },
                                    { value: '90',    label: t('rotate90') },
                                    { value: '180',   label: t('rotate180') },
                                    { value: '270',   label: t('rotate270') },
                                    { value: 'hflip', label: t('rotateHflip') },
                                ]}
                                onChange={v => updateEnc('rotate', v)}
                            />
                        </Row>
                    </div>

                    {/* ══ HDR / META ══ */}
                    <div className="sp-section" data-section="hdr" ref={sectionRef('hdr')}>
                        <SectionHeader icon="bi-brightness-high" title={t('sectionHdr')} />
                        <Row label={t('rowHdrMetadata')} hint={t('hintHdrMetadata')}>
                            <GsSelect
                                value={enc.hdrMetadata || 'off'}
                                options={[
                                    { value: 'off',         label: t('hdrOff') },
                                    { value: 'hdr10plus',   label: 'HDR10+' },
                                    { value: 'dolbyvision', label: 'Dolby Vision' },
                                    { value: 'all',         label: t('hdrAll') },
                                ]}
                                onChange={v => updateEnc('hdrMetadata', v)}
                            />
                        </Row>

                        <SectionHeader icon="bi-tag" title={t('sectionFileMeta')} />
                        <Row label={t('rowKeepMetadata')} hint={t('hintKeepMetadata')}>
                            <Toggle value={!!enc.keepMetadata} onChange={v => updateEnc('keepMetadata', v)} />
                        </Row>
                        <Row label={t('rowInlineParamSets')} hint={t('hintInlineParamSets')}>
                            <Toggle value={!!enc.inlineParamSets} onChange={v => updateEnc('inlineParamSets', v)} />
                        </Row>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default SettingsPage
