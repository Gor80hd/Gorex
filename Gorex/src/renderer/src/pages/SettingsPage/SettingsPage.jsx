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
    { value: 'copy',       label: 'Passthru (авто)' },
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

function getPrimaryEncoderGroups(vendor) {
    if (vendor === 'nvidia') return [
        { label: 'NVIDIA NVENC (рекомендован)', encoders: [
            { value: 'nvenc_h265', label: 'H.265 NVENC' },
            { value: 'nvenc_h264', label: 'H.264 NVENC' },
            { value: 'nvenc_av1',  label: 'AV1 NVENC' },
        ]},
        { label: 'Программные', encoders: SOFTWARE_PRIMARY },
    ]
    if (vendor === 'amd') return [
        { label: 'AMD VCE (рекомендован)', encoders: [
            { value: 'vce_h265', label: 'H.265 VCE' },
            { value: 'vce_h264', label: 'H.264 VCE' },
            { value: 'vce_av1',  label: 'AV1 VCE' },
        ]},
        { label: 'Программные', encoders: SOFTWARE_PRIMARY },
    ]
    if (vendor === 'intel') return [
        { label: 'Intel QSV (рекомендован)', encoders: [
            { value: 'qsv_h265', label: 'H.265 QSV' },
            { value: 'qsv_h264', label: 'H.264 QSV' },
            { value: 'qsv_av1',  label: 'AV1 QSV' },
        ]},
        { label: 'Программные', encoders: SOFTWARE_PRIMARY },
    ]
    return [
        { label: 'Программные', encoders: [
            { value: 'x265',          label: 'H.265 / HEVC (x265)' },
            { value: 'x265_10bit',    label: 'H.265 10-bit (x265)' },
            { value: 'x264',          label: 'H.264 (x264)' },
            { value: 'svt_av1',       label: 'AV1 (SVT-AV1)' },
            { value: 'svt_av1_10bit', label: 'AV1 10-bit' },
        ]},
    ]
}

// ─── Sidebar tabs ─────────────────────────────────────────────────────────────
const TABS = [
    { id: 'app',       label: 'Приложение', icon: 'bi-gear' },
    { id: 'video',     label: 'Видео',      icon: 'bi-camera-video' },
    { id: 'audio',     label: 'Аудио',      icon: 'bi-music-note-beamed' },
    { id: 'subtitles', label: 'Субтитры',   icon: 'bi-badge-cc' },
    { id: 'filters',   label: 'Фильтры',    icon: 'bi-sliders' },
    { id: 'hdr',       label: 'HDR / Мета', icon: 'bi-stars' },
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
    const [activeSection, setActiveSection] = useState('app')
    const [savedFlash, setSavedFlash] = useState(false)
    const [gpuInfo, setGpuInfo] = useState({ gpus: [], vendor: 'unknown' })

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
                    Назад
                </button>
                <div className="sp-header-title">
                    <i className="bi bi-gear-fill"></i>
                    Настройки
                </div>
                <div className="sp-header-actions">
                    <button className="sp-btn-reset" onClick={handleReset} title="Сбросить настройки кодирования до значений по умолчанию">
                        <i className="bi bi-arrow-counterclockwise"></i>
                        Сброс
                    </button>
                    <button className={`sp-btn-save${savedFlash ? ' saved' : ''}`} onClick={handleSave}>
                        {savedFlash
                            ? <><i className="bi bi-check-lg"></i>Сохранено</>
                            : <><i className="bi bi-floppy"></i>Сохранить</>
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
                        Настройки применяются как значения по умолчанию для новых задач кодирования
                    </p>
                </div>

                {/* ── Content ── */}
                <div className="sp-content" ref={contentRef}>

                    {/* ══ APP ══ */}
                    <div className="sp-section" data-section="app" ref={sectionRef('app')}>
                        <SectionHeader icon="bi-palette" title="Оформление" />
                        <Row label="Тема оформления" hint="Выбор темы интерфейса приложения">
                            <div className="sp-theme-selector">
                                {[
                                    { mode: 'dark',  icon: 'bi-moon-fill',     label: 'Тёмная' },
                                    { mode: 'light', icon: 'bi-sun-fill',      label: 'Светлая' },
                                    { mode: 'auto',  icon: 'bi-circle-half',   label: 'Авто' },
                                ].map(({ mode, icon, label }) => (
                                    <button
                                        key={mode}
                                        className={`sp-theme-btn${themeMode === mode ? ' active' : ''}`}
                                        onClick={() => onThemeModeChange(mode)}
                                        type="button"
                                    >
                                        <i className={`bi ${icon}`}></i>
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </Row>

                        <SectionHeader icon="bi-terminal" title="HandBrake CLI" />
                        <Row label="Статус" hint="HandBrakeCLI.exe рядом с приложением">
                            {cliStatus === 'checking' && (
                                <span className="sp-cli-status sp-cli-status--checking">
                                    <i className="bi bi-arrow-repeat"></i> Проверка...
                                </span>
                            )}
                            {cliStatus === 'ok' && (
                                <span className="sp-cli-status sp-cli-status--ok">
                                    <i className="bi bi-check-circle-fill"></i>
                                    Обнаружен{cliVersion ? ` · v${cliVersion}` : ''}
                                </span>
                            )}
                            {cliStatus === 'error' && (
                                <span className="sp-cli-status sp-cli-status--error" title={cliPath}>
                                    <i className="bi bi-x-circle-fill"></i> Не найден
                                </span>
                            )}
                        </Row>

                        <SectionHeader icon="bi-gpu-card" title="Видеокарта" />
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
                                    <span className="sp-gpu-hint">Доступные кодеки GPU автоматически показаны первыми в разделе «Видеокодек»</span>
                                </>
                            ) : (
                                <span className="sp-gpu-none">
                                    <i className="bi bi-question-circle"></i>
                                    Видеокарта не определена — показаны программные кодеки
                                </span>
                            )}
                        </div>
                        <Row label="Показывать все кодеки" hint="На странице конвертации показывать все, а не только GPU-рекомендованные">
                            <Toggle value={!!enc.showAllCodecs} onChange={v => updateEnc('showAllCodecs', v)} />
                        </Row>

                        <SectionHeader icon="bi-folder2" title="Папка вывода по умолчанию" />
                        <div className="sp-folder-widget">
                            <div className="sp-folder-widget__info">
                                <span className="sp-folder-widget__path">{resolvedOutputDir || '…'}</span>
                                {!appConfig.defaultOutputDir && (
                                    <span className="sp-folder-widget__tag">папка «Видео» по умолчанию</span>
                                )}
                            </div>
                            <div className="sp-folder-widget__actions">
                                {appConfig.defaultOutputDir && (
                                    <button className="sp-folder-widget__reset" onClick={handleResetOutputDir} title="Сбросить к папке Видео">
                                        <i className="bi bi-x-lg"></i>
                                    </button>
                                )}
                                <button className="sp-folder-widget__browse" onClick={handleBrowseOutputDir}>
                                    <i className="bi bi-folder2-open"></i> Изменить
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ══ VIDEO ══ */}
                    <div className="sp-section" data-section="video" ref={sectionRef('video')}>
                        <p className="sp-tab-description">Параметры кодирования по умолчанию. Применяются к каждому новому файлу — можно изменить для конкретной задачи в списке.</p>
                        <SectionHeader icon="bi-file-earmark-play" title="Контейнер" />
                        <Row label="Формат" hint="Контейнер для выходного файла">
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

                        <SectionHeader icon="bi-cpu" title="Кодировщик" />
                        <Row label="Видеокодек" hint="Алгоритм сжатия видео">
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
                            <Row label="Скорость / пресет" hint="Соотношение скорость↔эффективность кодека">
                                <GsSelect
                                    value={enc.encoderSpeed}
                                    options={speedPresets.map(sp => ({ value: sp.value, label: sp.label }))}
                                    onChange={v => updateEnc('encoderSpeed', v)}
                                />
                            </Row>
                        )}

                        <SectionHeader icon="bi-sliders2" title="Качество" />
                        <Row label="Режим качества" hint="Предустановка или точное значение RF/CRF">
                            <GsSelect
                                value={enc.quality}
                                options={[
                                    { value: 'source', label: 'Исходное (без потерь)' },
                                    { value: 'high',   label: `Высокое (RF ${rfTable.high})` },
                                    { value: 'medium', label: `Среднее (RF ${rfTable.medium})` },
                                    { value: 'low',    label: `Низкое (RF ${rfTable.low})` },
                                    { value: 'potato', label: `Максимальное сжатие (RF ${rfTable.potato})` },
                                    { value: 'custom', label: enc.quality === 'custom' ? `Своё (RF ${enc.customQuality})` : 'Своё значение...' },
                                ]}
                                onChange={v => updateEnc('quality', v)}
                            />
                        </Row>
                        {enc.quality === 'custom' && (
                            <Row
                                label={`RF / CRF: ${enc.customQuality}`}
                                hint={`Диапазон: ${rfTable.min} (лучше) — ${rfTable.max} (хуже)`}
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

                        <SectionHeader icon="bi-aspect-ratio" title="Разрешение и частота кадров" />
                        <Row label="Разрешение" hint="Максимальное разрешение (масштабирование вниз)">
                            <GsSelect
                                value={enc.resolution}
                                options={[
                                    { value: 'source', label: 'По исходному' },
                                    { value: '4k',     label: '4K (2160p)' },
                                    { value: '1440p',  label: '2K (1440p)' },
                                    { value: '1080p',  label: '1080p (Full HD)' },
                                    { value: '720p',   label: '720p (HD)' },
                                    { value: '480p',   label: '480p (SD)' },
                                ]}
                                onChange={v => updateEnc('resolution', v)}
                            />
                        </Row>
                        <Row label="Частота кадров" hint="Целевой FPS выходного видео">
                            <GsSelect
                                value={enc.fps}
                                options={[
                                    { value: 'source', label: 'По исходному' },
                                    { value: '60',     label: '60 fps' },
                                    { value: '30',     label: '30 fps' },
                                    { value: '25',     label: '25 fps (PAL)' },
                                    { value: '24',     label: '24 fps (кино)' },
                                    { value: '23.976', label: '23.976 fps (NTSC)' },
                                ]}
                                onChange={v => updateEnc('fps', v)}
                            />
                        </Row>
                        <Row label="Режим FPS" hint="VFR = переменный, CFR = постоянный, PFR = с ограничением">
                            <GsSelect
                                value={enc.fpsMode || 'vfr'}
                                options={[
                                    { value: 'vfr', label: 'VFR — переменный (рекомендован)' },
                                    { value: 'cfr', label: 'CFR — постоянный' },
                                    { value: 'pfr', label: 'PFR — с пиковым ограничением' },
                                ]}
                                onChange={v => updateEnc('fpsMode', v)}
                            />
                        </Row>

                        <SectionHeader icon="bi-lightning-charge" title="Аппаратное ускорение" />
                        <Row label="Аппаратное декодирование" hint="Разгружает CPU при чтении источника">
                            <GsSelect
                                value={enc.hwDecoding || 'none'}
                                options={[
                                    { value: 'none',  label: 'Отключено (программное)' },
                                    { value: 'nvdec', label: 'NVDEC (NVIDIA)' },
                                    { value: 'qsv',   label: 'Quick Sync (Intel)' },
                                ]}
                                onChange={v => updateEnc('hwDecoding', v)}
                            />
                        </Row>
                        <Row label="Двухпроходное кодирование" hint="2-pass: лучше распределяет битрейт, кодирует в 2× дольше">
                            <Toggle value={!!enc.multiPass} onChange={v => updateEnc('multiPass', v)} />
                        </Row>
                    </div>

                    {/* ══ AUDIO ══ */}
                    <div className="sp-section" data-section="audio" ref={sectionRef('audio')}>
                        <SectionHeader icon="bi-music-note-beamed" title="Кодек аудио" />
                        <Row label="Аудиокодек" hint="Кодек для аудиодорожки выходного файла">
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
                                <SectionHeader icon="bi-speaker" title="Параметры аудио" />
                                <Row label="Битрейт" hint="Битрейт аудиодорожки в кбит/с">
                                    <GsSelect
                                        value={enc.audioBitrate || '160'}
                                        options={[
                                            { value: '64',  label: '64 kbps' },
                                            { value: '96',  label: '96 kbps' },
                                            { value: '128', label: '128 kbps' },
                                            { value: '160', label: '160 kbps (по умолчанию)' },
                                            { value: '192', label: '192 kbps' },
                                            { value: '256', label: '256 kbps' },
                                            { value: '320', label: '320 kbps' },
                                        ]}
                                        onChange={v => updateEnc('audioBitrate', v)}
                                    />
                                </Row>
                                <Row label="Микшинг" hint="Количество каналов в выходной аудиодорожке">
                                    <GsSelect
                                        value={enc.audioMixdown || 'stereo'}
                                        options={[
                                            { value: 'mono',    label: 'Моно (1.0)' },
                                            { value: 'stereo',  label: 'Стерео (2.0)' },
                                            { value: 'dpl2',    label: 'Dolby Pro Logic II' },
                                            { value: '5point1', label: 'Surround 5.1' },
                                            { value: '6point1', label: 'Surround 6.1' },
                                            { value: '7point1', label: 'Surround 7.1' },
                                        ]}
                                        onChange={v => updateEnc('audioMixdown', v)}
                                    />
                                </Row>
                                <Row label="Частота дискретизации" hint="Sample rate аудио">
                                    <GsSelect
                                        value={enc.audioSampleRate || 'auto'}
                                        options={[
                                            { value: 'auto',  label: 'Авто (по исходному)' },
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

                        <SectionHeader icon="bi-collection-play" title="Метаданные файла" />
                        <Row label="Метки глав (Chapter markers)" hint="Добавлять chapter markers в контейнер">
                            <Toggle value={enc.chapterMarkers !== false} onChange={v => updateEnc('chapterMarkers', v)} />
                        </Row>
                        <Row label="Оптимизировать MP4 (fast start)" hint="Moov-атом в начале файла — для HTTP стриминга. Только MP4.">
                            <Toggle
                                value={!!enc.optimizeMP4}
                                onChange={v => updateEnc('optimizeMP4', v)}
                                disabled={enc.format !== 'av_mp4'}
                            />
                        </Row>
                    </div>

                    {/* ══ SUBTITLES ══ */}
                    <div className="sp-section" data-section="subtitles" ref={sectionRef('subtitles')}>
                        <SectionHeader icon="bi-badge-cc" title="Дорожки субтитров" />
                        <Row label="Субтитры" hint="Какие дорожки субтитров включить в выходной файл">
                            <GsSelect
                                value={enc.subtitleMode || 'none'}
                                options={[
                                    { value: 'none',         label: 'Не включать' },
                                    { value: 'first',        label: 'Первая дорожка' },
                                    { value: 'all',          label: 'Все дорожки' },
                                    { value: 'scan_forced',  label: 'Авто (принудительные / иностранные)' },
                                ]}
                                onChange={v => updateEnc('subtitleMode', v)}
                            />
                        </Row>
                        {enc.subtitleMode !== 'none' && enc.subtitleMode !== 'all' && (
                            <Row label="Вшивать субтитры" hint="Субтитры рендерятся прямо в кадр (burn-in). Не требует поддержки контейнером">
                                <Toggle value={!!enc.subtitleBurn} onChange={v => updateEnc('subtitleBurn', v)} />
                            </Row>
                        )}
                        {enc.subtitleMode !== 'none' && !enc.subtitleBurn && enc.subtitleMode !== 'all' && (
                            <Row label="Субтитры по умолчанию" hint="Отметить дорожку субтитров как выбранную по умолчанию в плеере">
                                <Toggle value={!!enc.subtitleDefault} onChange={v => updateEnc('subtitleDefault', v)} />
                            </Row>
                        )}

                        <SectionHeader icon="bi-translate" title="Язык субтитров" />
                        <Row label="Предпочитаемый язык" hint="Нативный язык: при наличии такой дорожки, она будет выбрана автоматически">
                            <GsSelect
                                value={enc.subtitleLanguage || 'any'}
                                options={[
                                    { value: 'any', label: 'Любой (не фильтровать)' },
                                    { value: 'eng', label: 'Английский (eng)' },
                                    { value: 'rus', label: 'Русский (rus)' },
                                    { value: 'jpn', label: 'Японский (jpn)' },
                                    { value: 'chi', label: 'Китайский (chi)' },
                                    { value: 'kor', label: 'Корейский (kor)' },
                                    { value: 'fra', label: 'Французский (fra)' },
                                    { value: 'deu', label: 'Немецкий (deu)' },
                                    { value: 'spa', label: 'Испанский (spa)' },
                                    { value: 'por', label: 'Португальский (por)' },
                                    { value: 'ita', label: 'Итальянский (ita)' },
                                    { value: 'ara', label: 'Арабский (ara)' },
                                ]}
                                onChange={v => updateEnc('subtitleLanguage', v)}
                            />
                        </Row>
                    </div>

                    {/* ══ FILTERS ══ */}
                    <div className="sp-section" data-section="filters" ref={sectionRef('filters')}>
                        <SectionHeader icon="bi-intersect" title="Деинтерлейс" />
                        <Row label="Деинтерлейс" hint="Устраняет гребёнку от чересстрочной развёртки">
                            <GsSelect
                                value={enc.deinterlace || 'off'}
                                options={[
                                    { value: 'off',           label: 'Отключён' },
                                    { value: 'yadif_default', label: 'Yadif — стандартный' },
                                    { value: 'yadif_bob',     label: 'Yadif Bob (двойной FPS)' },
                                    { value: 'bwdif_default', label: 'BWDif — стандартный' },
                                    { value: 'bwdif_bob',     label: 'BWDif Bob (двойной FPS)' },
                                ]}
                                onChange={v => updateEnc('deinterlace', v)}
                            />
                        </Row>

                        <SectionHeader icon="bi-snow2" title="Шумоподавление" />
                        <Row label="Денойз" hint="Убирает видеошум. Требует дополнительного времени.">
                            <GsSelect
                                value={enc.denoise || 'off'}
                                options={[
                                    { value: 'off',                label: 'Отключено' },
                                    { value: 'nlmeans_ultralight', label: 'NL-Means — минимальный' },
                                    { value: 'nlmeans_light',      label: 'NL-Means — лёгкий' },
                                    { value: 'nlmeans_medium',     label: 'NL-Means — средний' },
                                    { value: 'nlmeans_strong',     label: 'NL-Means — сильный' },
                                    { value: 'hqdn3d_light',       label: 'HQ 3D — лёгкий' },
                                    { value: 'hqdn3d_medium',      label: 'HQ 3D — средний' },
                                    { value: 'hqdn3d_strong',      label: 'HQ 3D — сильный' },
                                ]}
                                onChange={v => updateEnc('denoise', v)}
                            />
                        </Row>

                        <SectionHeader icon="bi-grid-3x3" title="Деблокинг" />
                        <Row label="Деблокинг" hint="Убирает блочные артефакты от кодека источника">
                            <GsSelect
                                value={enc.deblock || 'off'}
                                options={[
                                    { value: 'off',        label: 'Отключён' },
                                    { value: 'ultralight', label: 'Минимальный' },
                                    { value: 'light',      label: 'Лёгкий' },
                                    { value: 'medium',     label: 'Средний' },
                                    { value: 'strong',     label: 'Сильный' },
                                    { value: 'stronger',   label: 'Максимальный' },
                                ]}
                                onChange={v => updateEnc('deblock', v)}
                            />
                        </Row>

                        <SectionHeader icon="bi-zoom-in" title="Резкость" />
                        <Row label="Повышение резкости" hint="Unsharp Mask или Laplacian Sharpen">
                            <GsSelect
                                value={enc.sharpen || 'off'}
                                options={[
                                    { value: 'off',                 label: 'Отключено' },
                                    { value: 'unsharp_ultralight',  label: 'Unsharp — минимальный' },
                                    { value: 'unsharp_light',       label: 'Unsharp — лёгкий' },
                                    { value: 'unsharp_medium',      label: 'Unsharp — средний' },
                                    { value: 'unsharp_strong',      label: 'Unsharp — сильный' },
                                    { value: 'lapsharp_ultralight', label: 'Lapsharp — минимальный' },
                                    { value: 'lapsharp_light',      label: 'Lapsharp — лёгкий' },
                                    { value: 'lapsharp_medium',     label: 'Lapsharp — средний' },
                                    { value: 'lapsharp_strong',     label: 'Lapsharp — сильный' },
                                ]}
                                onChange={v => updateEnc('sharpen', v)}
                            />
                        </Row>

                        <SectionHeader icon="bi-camera" title="Трансформация кадра" />
                        <Row label="Чёрно-белый режим" hint="Удаляет цветовую информацию (grayscale)">
                            <Toggle value={!!enc.grayscale} onChange={v => updateEnc('grayscale', v)} />
                        </Row>
                        <Row label="Поворот / отражение" hint="Повернуть или отразить кадр">
                            <GsSelect
                                value={enc.rotate || '0'}
                                options={[
                                    { value: '0',     label: 'Без поворота' },
                                    { value: '90',    label: '90° по часовой' },
                                    { value: '180',   label: '180°' },
                                    { value: '270',   label: '270° (90° против часовой)' },
                                    { value: 'hflip', label: 'Горизонтальное отражение' },
                                ]}
                                onChange={v => updateEnc('rotate', v)}
                            />
                        </Row>
                    </div>

                    {/* ══ HDR / META ══ */}
                    <div className="sp-section" data-section="hdr" ref={sectionRef('hdr')}>
                        <SectionHeader icon="bi-brightness-high" title="HDR" />
                        <Row label="Динамические метаданные HDR" hint="Передать HDR10+ или Dolby Vision metadata в выходной файл">
                            <GsSelect
                                value={enc.hdrMetadata || 'off'}
                                options={[
                                    { value: 'off',         label: 'Отключено' },
                                    { value: 'hdr10plus',   label: 'HDR10+' },
                                    { value: 'dolbyvision', label: 'Dolby Vision' },
                                    { value: 'all',         label: 'Все (HDR10+ и Dolby Vision)' },
                                ]}
                                onChange={v => updateEnc('hdrMetadata', v)}
                            />
                        </Row>

                        <SectionHeader icon="bi-tag" title="Метаданные файла" />
                        <Row label="Сохранять метаданные" hint="Копировать теги, описание, обложку из источника в выходной файл">
                            <Toggle value={!!enc.keepMetadata} onChange={v => updateEnc('keepMetadata', v)} />
                        </Row>
                        <Row label="Inline Parameter Sets" hint="SPS/PPS inline в каждом кадре — требуется для HLS-стриминга">
                            <Toggle value={!!enc.inlineParamSets} onChange={v => updateEnc('inlineParamSets', v)} />
                        </Row>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default SettingsPage
