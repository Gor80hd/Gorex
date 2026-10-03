import { useState, useRef, useEffect, type ReactNode } from 'react'
import { useLanguage } from '../../i18n'
import {
    CODEC_RF, ENCODER_PRESETS, DEFAULT_SETTINGS, normalizeEncoderSettings,
    GLOBAL_AUDIO_CODEC_OPTIONS, AUDIO_BITRATE_OPTIONS, AUDIO_SAMPLE_RATE_OPTIONS,
    isAudioOnlyOutputFormat, getAudioFormatDefaults, isAudioCodecCompatibleWithFormat,
    getFormatOptionGroups, ENCODER_GROUPS, getConversionEncoderGroups,
    WEBM_COMPATIBLE_ENCODERS, WEBM_COMPATIBLE_AUDIO, NO_CRF_ENCODERS,
    ENCODER_DISABLED_FORMATS,
} from './settingsModel'
export * from './settingsModel'
import './GlobalSettings.scss'

type Translate = (key: string) => string
type Settings = Omit<typeof DEFAULT_SETTINGS, 'encoderSpeed'> & { encoderSpeed?: string; noAudio?: boolean }
export type SelectTag = { key: string; cls: string; icon: string; label: string }
export type SelectOption = {
    value: string
    label: string
    desc?: string | { ru?: string; en?: string }
    disabled?: boolean
    special?: boolean
    recommended?: boolean
    tags?: SelectTag[]
}
export type SelectGroup = { label: string; options: SelectOption[] }
export type SelectProps = {
    value?: string
    onChange: (value: string) => void
    options?: SelectOption[]
    groups?: SelectGroup[]
    disabled?: boolean
    className?: string
    onSpecial?: (value: string) => void
    direction?: 'up' | 'down'
    footer?: ReactNode
}

// ─── Help texts (i18n-based lookups) ──────────────────────────────────────────
function getFormatHelp(format: string, t: Translate) {
    const key = ({
        av_mp4:  'helpFmtMp4',
        av_mkv:  'helpFmtMkv',
        av_webm: 'helpFmtWebm',
        av_mov:  'helpFmtMov',
        av_avi:  'helpFmtAvi',
        av_flv:  'helpFmtFlv',
        av_ts:   'helpFmtTs',
        av_ogg:  'helpFmtOgg',
        av_3gp:  'helpFmt3gp',
    } as Record<string, string>)[format]
    return key ? t(key) : t('hintFormat')
}
function getResolutionHelp(res: string, t: Translate) {
    const key = ({ source: 'helpResSource', '4k': 'helpRes4k', '1440p': 'helpRes1440p', '1080p': 'helpRes1080p', '720p': 'helpRes720p', '480p': 'helpRes480p' } as Record<string, string>)[res]
    return key ? t(key) : t('hintResolution')
}
function getFpsHelp(fps: string, t: Translate) {
    const key = ({ source: 'helpFpsSource', '60': 'helpFps60', '30': 'helpFps30', '25': 'helpFps25', '24': 'helpFps24', '23.976': 'helpFps23976' } as Record<string, string>)[fps]
    return key ? t(key) : t('hintFps')
}
function getQualityHelp(quality: string, t: Translate) {
    const key = ({ lossless: 'helpQualLossless', high: 'helpQualHigh', medium: 'helpQualMedium', low: 'helpQualLow', potato: 'helpQualPotato', custom: 'helpQualCustom' } as Record<string, string>)[quality]
    return key ? t(key) : t('hintQualityMode')
}
function getEncoderHelpText(encoder: string, t: Translate) {
    const key = ({
        x265: 'helpEncX265', x265_10bit: 'helpEncX265_10bit', x265_12bit: 'helpEncX265_12bit',
        x264: 'helpEncX264', x264_10bit: 'helpEncX264_10bit',
        svt_av1: 'helpEncSvtAv1', svt_av1_10bit: 'helpEncSvtAv1_10bit',
        vp9: 'helpEncVp9', vp9_10bit: 'helpEncVp9_10bit', vp8: 'helpEncVp8', theora: 'helpEncTheora',
        nvenc_h264: 'helpEncNvencH264', nvenc_h265: 'helpEncNvencH265', nvenc_av1: 'helpEncNvencAv1',
        qsv_h264: 'helpEncQsvH264', qsv_h265: 'helpEncQsvH265', qsv_av1: 'helpEncQsvAv1',
        vce_h264: 'helpEncVceH264', vce_h265: 'helpEncVceH265', vce_av1: 'helpEncVceAv1',
        mf_h264: 'helpEncMfH264', mf_h265: 'helpEncMfH265',
        vt_h264: 'helpEncVtH264', vt_h265: 'helpEncVtH265',
        libaom_av1: 'helpEncLibaomAv1',
        mpeg4: 'helpEncMpeg4', mpeg2video: 'helpEncMpeg2', mpeg1video: 'helpEncMpeg1',
        prores_ks: 'helpEncProres', dnxhd: 'helpEncDnxhd',
        ffv1: 'helpEncFfv1', huffyuv: 'helpEncHuffyuv',
        mjpeg: 'helpEncMjpeg', wmv2: 'helpEncWmv2', wmv1: 'helpEncWmv1',
        h263p: 'helpEncH263p', h263: 'helpEncH263', flv1: 'helpEncFlv1',
    } as Record<string, string>)[encoder]
    return key ? t(key) : t('hintVideoCodec')
}

// ─── Helper: resolution options ────────────────────────────────────────────────
function getResolutionOptions(videos: { resolution?: string }[], t: Translate) {
    const srcLabel = t ? t('resSource') : 'По исходному'
    const opts: SelectOption[] = [{ value: 'source', label: srcLabel }]

    let isPortrait = false
    let maxDim = 0

    if (videos && videos.length > 0) {
        const portraitCount = videos.filter(v => {
            if (!v.resolution) return false
            const [w, h] = v.resolution.split('x').map(Number)
            return h > w
        }).length
        isPortrait = portraitCount > videos.length / 2

        videos.forEach(v => {
            if (!v.resolution) return
            const [w, h] = v.resolution.split('x').map(Number)
            maxDim = Math.max(maxDim, w, h)
        })
    }

    const p = t ? t('resPortrait') : 'вертикально'
    const standard = [
        { value: '4k',    label: isPortrait ? `4K ${p} (2160p)` : '4K (2160p)',  short: 2160 },
        { value: '1440p', label: isPortrait ? `2K ${p} (1440p)` : '2K (1440p)',  short: 1440 },
        { value: '1080p', label: isPortrait ? `1080p ${p}`       : '1080p',       short: 1080 },
        { value: '720p',  label: isPortrait ? `720p ${p}`        : '720p',        short: 720  },
        { value: '480p',  label: isPortrait ? `480p ${p}`        : '480p',        short: 480  },
    ]

    standard.forEach(r => {
        if (maxDim === 0 || r.short <= maxDim + 20) {
            opts.push(r)
        }
    })

    return opts
}

function getEncoderLabel(encoder: string) {
    for (const g of ENCODER_GROUPS) {
        const found = g.encoders.find(e => e.value === encoder)
        if (found) return found.label
    }
    return encoder
}

// ─── Custom dropdown ─────────────────────────────────────────────────────────
export function GsSelect({ value, onChange, options, groups, disabled, className, onSpecial, direction = 'up', footer }: SelectProps) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    const { t, lang } = useLanguage()

    const resolveDesc = (desc: SelectOption['desc']) => {
        if (!desc) return null
        if (typeof desc === 'object') return desc[lang] || desc.en || desc.ru || null
        return desc
    }

    useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [open])

    let currentLabel = value
    if (options) {
        const found = options.find(o => o.value === value)
        if (found) currentLabel = found.label
    }
    if (groups) {
        outer: for (const g of groups) {
            for (const o of g.options) {
                if (o.value === value) { currentLabel = o.label; break outer }
            }
        }
    }

    const handleSelect = (optValue: string, special?: boolean, optDisabled?: boolean) => {
        if (optDisabled) return
        setOpen(false)
        if (special && onSpecial) { onSpecial(optValue); return }
        onChange(optValue)
    }

    return (
        <div
            className={`gs-dropdown${disabled ? ' gs-dropdown--disabled' : ''}${open ? ' gs-dropdown--open' : ''}${direction === 'down' ? ' gs-dropdown--down' : ''}${className ? ' ' + className : ''}`}
            ref={ref}
        >
            <button
                className="gs-dropdown-trigger"
                type="button"
                onClick={() => { if (!disabled) setOpen(v => !v) }}
            >
                <span className="gs-dropdown-value">{currentLabel}</span>
                <i className="bi bi-chevron-down gs-dropdown-chevron"></i>
            </button>
            {open && (
                <div className="gs-dropdown-menu">
                    <div className="gs-dropdown-menu-scroll">
                    {options && options.map(o => (
                        <button
                            key={o.value}
                            type="button"
                            disabled={!!o.disabled}
                            className={`gs-dropdown-item${o.value === value ? ' active' : ''}${o.special ? ' gs-dropdown-item--special' : ''}${o.disabled ? ' gs-dropdown-item--disabled' : ''}${o.tags && o.tags.length ? ' gs-dropdown-item--with-tags' : ''}`}
                            onClick={() => handleSelect(o.value, o.special, o.disabled)}
                        >
                            <span className="gs-dropdown-item-main">
                                {o.label}
                            {o.recommended && <span className="gs-dropdown-item-badge">{t('recommended')}</span>}
                            </span>
                            {o.tags && o.tags.length > 0 && (
                                <span className="gs-dropdown-item-tags">
                                    {o.tags.map(tag => (
                                        <span key={tag.key} className={`gs-item-tag ${tag.cls}`}>
                                            <i className={`bi ${tag.icon}`}></i>{tag.label}
                                        </span>
                                    ))}
                                </span>
                            )}
                            {o.desc && <span className="gs-dropdown-item-desc">{resolveDesc(o.desc)}</span>}
                        </button>
                    ))}
                    {groups && groups.map((g, gi) => (
                        <div key={g.label} className={`gs-dropdown-group${gi > 0 ? ' gs-dropdown-group--sep' : ''}`}>
                            <div className="gs-dropdown-group-label">{g.label}</div>
                            {g.options.map(o => (
                                <button
                                    key={o.value}
                                    type="button"
                                    disabled={!!o.disabled}
                                    className={`gs-dropdown-item${o.value === value ? ' active' : ''}${o.disabled ? ' gs-dropdown-item--disabled' : ''}${o.tags && o.tags.length ? ' gs-dropdown-item--with-tags' : ''}`}
                                    onClick={() => handleSelect(o.value, false, o.disabled)}
                                >
                                    <span className="gs-dropdown-item-main">{o.label}</span>
                                    {o.tags && o.tags.length > 0 && (
                                        <span className="gs-dropdown-item-tags">
                                            {o.tags.map(t => (
                                                <span key={t.key} className={`gs-item-tag ${t.cls}`}>
                                                    <i className={`bi ${t.icon}`}></i>{t.label}
                                                </span>
                                            ))}
                                        </span>
                                    )}
                                    {o.desc && <span className="gs-dropdown-item-desc">{resolveDesc(o.desc)}</span>}
                                </button>
                            ))}
                        </div>
                    ))}
                    </div>
                    {footer && (
                        <div className="gs-dropdown-footer">{footer}</div>
                    )}
                </div>
            )}
        </div>
    )
}

// ─── Tooltip component ─────────────────────────────────────────────────────────
function Tooltip({ text }: { text: string }) {
    const [visible, setVisible] = useState(false)

    return (
        <span className="gs-tooltip-wrap">
            <button
                className="gs-help-btn"
                onMouseEnter={() => setVisible(true)}
                onMouseLeave={() => setVisible(false)}
                onClick={e => { e.stopPropagation(); setVisible(v => !v) }}
                tabIndex={-1}
            >
                <i className="bi bi-question-circle"></i>
            </button>
            {visible && (
                <span className="gs-tooltip">{text}</span>
            )}
        </span>
    )
}

// ─── Main component ────────────────────────────────────────────────────────────
function GlobalSettings({ settings, onChange, videos, disabled, gpuVendor, systemPlatform }: {
    settings: Settings
    onChange: (settings: Settings) => void
    videos: { resolution?: string }[]
    disabled?: boolean
    gpuVendor?: string
    systemPlatform?: string
}) {
    const { t } = useLanguage()
    const [showCustomQuality, setShowCustomQuality] = useState(false)
    const [draftRF, setDraftRF] = useState(settings.customQuality)
    const [showMoreCodecs, setShowMoreCodecs] = useState(false)

    const rfTable = (CODEC_RF as Record<string, typeof CODEC_RF.x265>)[settings.encoder] || CODEC_RF.x265
    const speedPresets = (ENCODER_PRESETS as Record<string, SelectOption[]>)[settings.encoder] ?? []
    const resOptions = getResolutionOptions(videos, t)
    const encoderGroups = getConversionEncoderGroups(gpuVendor || 'unknown', showMoreCodecs, t, systemPlatform)
    const audioOnly = isAudioOnlyOutputFormat(settings.format)
    const isAudioPassthru = (settings.audioCodec || 'av_aac').startsWith('copy')

    const update = <K extends keyof Settings>(key: K, value: Settings[K]) => onChange({ ...settings, [key]: value })

    const handleFormatChange = (fmt: string) => {
        const audioDefaults = getAudioFormatDefaults(fmt)
        if (audioDefaults) {
            onChange({
                ...settings,
                format: fmt,
                ...audioDefaults,
                noAudio: false,
                subtitleMode: 'none',
                subtitleBurn: false,
                subtitleExternalFile: '',
                alphaChannel: false,
                hwDecoding: 'none',
                multiPass: false,
            })
            return
        }
        const patch: Partial<Settings> = { format: fmt }
        if (fmt === 'av_webm') {
            if (!WEBM_COMPATIBLE_ENCODERS.has(settings.encoder)) {
                const speeds = ENCODER_PRESETS.vp9
                patch.encoder = 'vp9'
                patch.encoderSpeed = speeds[Math.floor(speeds.length / 2)]?.value ?? 'good'
            }
            const audioCodec = settings.audioCodec || 'av_aac'
            if (!WEBM_COMPATIBLE_AUDIO.has(audioCodec) && !audioCodec.startsWith('copy')) {
                patch.audioCodec = 'opus'
            }
        } else if (fmt === 'av_ogg') {
            // OGG: auto-switch to Theora if current encoder is not OGG-compatible
            if (!new Set(['theora', 'vp8', 'vp9', 'vp9_10bit']).has(settings.encoder)) {
                patch.encoder = 'theora'
                patch.encoderSpeed = undefined
            }
            const audioCodec = settings.audioCodec || 'av_aac'
            if (!WEBM_COMPATIBLE_AUDIO.has(audioCodec) && !audioCodec.startsWith('copy')) {
                patch.audioCodec = 'vorbis'
            }
        } else if (fmt === 'av_flv') {
            // FLV: only flv1 or x264 are valid; switch to flv1 if incompatible
            if (!new Set(['flv1', 'x264', 'x264_10bit', 'nvenc_h264', 'qsv_h264', 'vce_h264', 'mf_h264', 'vt_h264']).has(settings.encoder)) {
                patch.encoder = 'flv1'
                patch.encoderSpeed = undefined
            }
        } else if (fmt === 'av_3gp') {
            // 3GP: only h263/h263p/h264 are valid
            if (!new Set(['h263', 'h263p', 'x264', 'x264_10bit', 'nvenc_h264', 'qsv_h264', 'vce_h264', 'mf_h264', 'vt_h264', 'mpeg4']).has(settings.encoder)) {
                patch.encoder = 'h263p'
                patch.encoderSpeed = undefined
            }
        } else {
            const disabledFormats = (ENCODER_DISABLED_FORMATS as Record<string, Set<string>>)[settings.encoder]
            if (disabledFormats?.has(fmt)) {
                const speeds = ENCODER_PRESETS.x265
                patch.encoder = 'x265'
                patch.encoderSpeed = speeds?.find(s => s.value === 'slow')?.value
                    ?? speeds?.[Math.floor((speeds?.length ?? 0) / 2)]?.value ?? 'slow'
            }
            if (fmt === 'av_mp4' || fmt === 'av_mov' || fmt === 'av_avi' || fmt === 'av_ts' || fmt === 'av_flv' || fmt === 'av_3gp') {
                const audioCodec = settings.audioCodec || 'av_aac'
                const containerUnsafeAudio = new Set(['vorbis', 'opus', 'flac16', 'flac24', 'pcm_s16le', 'pcm_s24le', 'pcm_f32le', 'alac', 'wmav2'])
                if ((WEBM_COMPATIBLE_AUDIO.has(audioCodec) || containerUnsafeAudio.has(audioCodec)) && !audioCodec.startsWith('copy')) {
                    patch.audioCodec = 'av_aac'
                }
            }
        }
        onChange({ ...settings, ...patch })
    }

    const openCustomQuality = () => {
        setDraftRF(settings.quality === 'custom' ? settings.customQuality : (rfTable as Record<string, number>)[settings.quality] ?? rfTable.medium)
        setShowCustomQuality(true)
    }

    const confirmCustomQuality = () => {
        onChange({ ...settings, quality: 'custom', customQuality: draftRF })
        setShowCustomQuality(false)
    }

    const handleEncoderChange = (enc: string) => {
        onChange(normalizeEncoderSettings({ ...settings, encoder: enc }))
    }

    const qualityPresets = [
        { key: 'high',   label: t('qualityHigh'),   rf: rfTable.high },
        { key: 'medium', label: t('qualityMedium'),  rf: rfTable.medium },
        { key: 'low',    label: t('qualityLow'),     rf: rfTable.low },
        { key: 'potato', label: t('qualityPotato'),  rf: rfTable.potato },
    ]

    const currentQualityRF = settings.quality === 'custom'
        ? settings.customQuality
        : (rfTable as Record<string, number>)[settings.quality]

    const currentFormatHelp  = getFormatHelp(settings.format, t)
    const currentResHelp     = getResolutionHelp(settings.resolution, t)
    const currentFpsHelp     = getFpsHelp(settings.fps, t)
    const currentQualityHelp = getQualityHelp(settings.quality === 'custom' ? 'custom' : settings.quality, t)
    const currentEncHelp     = getEncoderHelpText(settings.encoder, t)

    return (
        <>
            <div className={`global-settings${audioOnly ? ' global-settings--audio-only' : ''}`}>

                {/* ── Format ── */}
                <div className="gs-card gs-card--format">
                    <div className="gs-card-header">
                        <i className="bi bi-file-earmark-play gs-icon"></i>
                        <span className="gs-card-label">{t('rowFormat')}</span>
                        <Tooltip text={currentFormatHelp} />
                    </div>
                    {/* Format dropdown */}
                    <GsSelect
                        value={settings.format}
                        groups={getFormatOptionGroups(t)}
                        onChange={handleFormatChange}
                        disabled={disabled}
                    />
                </div>
                {audioOnly && (
                    <>
                        <div className="gs-card gs-card--audio-codec">
                            <div className="gs-card-header">
                                <i className="bi bi-music-note-beamed gs-icon"></i>
                                <span className="gs-card-label">{t('rowAudioCodec')}</span>
                            </div>
                            <GsSelect
                                value={settings.audioCodec || 'av_aac'}
                                options={GLOBAL_AUDIO_CODEC_OPTIONS.map(o => ({
                                    ...o,
                                    disabled: !isAudioCodecCompatibleWithFormat(settings.format, o.value),
                                }))}
                                onChange={v => update('audioCodec', v)}
                                disabled={disabled}
                            />
                        </div>
                        {!isAudioPassthru && (
                            <div className="gs-card gs-card--audio-bitrate">
                                <div className="gs-card-header">
                                    <i className="bi bi-speaker gs-icon"></i>
                                    <span className="gs-card-label">{t('rowBitrate')}</span>
                                </div>
                                <GsSelect
                                    value={settings.audioBitrate || '160'}
                                    options={AUDIO_BITRATE_OPTIONS}
                                    onChange={v => update('audioBitrate', v)}
                                    disabled={disabled}
                                />
                            </div>
                        )}
                        <div className="gs-card gs-card--audio-sample-rate">
                            <div className="gs-card-header">
                                <i className="bi bi-soundwave gs-icon"></i>
                                <span className="gs-card-label">{t('rowSampleRate')}</span>
                            </div>
                            <GsSelect
                                value={settings.audioSampleRate || 'auto'}
                                options={AUDIO_SAMPLE_RATE_OPTIONS.map(o => o.value === 'auto' ? { ...o, label: t('srAuto') } : o)}
                                onChange={v => update('audioSampleRate', v)}
                                disabled={disabled}
                            />
                        </div>
                    </>
                )}


                {/* ── Resolution ── */}
                <div className="gs-card gs-card--resolution">
                    <div className="gs-card-header">
                        <i className="bi bi-aspect-ratio gs-icon"></i>
                        <span className="gs-card-label">{t('rowResolution')}</span>
                        <Tooltip text={currentResHelp} />
                    </div>
                    <GsSelect
                        value={settings.resolution}
                        options={resOptions.map(o => ({ value: o.value, label: o.label }))}
                        onChange={v => update('resolution', v)}
                        disabled={disabled}
                    />
                </div>

                {/* ── FPS ── */}
                <div className="gs-card gs-card--fps">
                    <div className="gs-card-header">
                        <i className="bi bi-camera-video gs-icon"></i>
                        <span className="gs-card-label">FPS</span>
                        <Tooltip text={currentFpsHelp} />
                    </div>
                    <GsSelect
                        value={settings.fps}
                        options={[
                            { value: 'source', label: t('fpsSource') },
                            { value: '60',     label: '60 fps' },
                            { value: '30',     label: '30 fps' },
                            { value: '25',     label: '25 fps' },
                            { value: '24',     label: '24 fps' },
                            { value: '23.976', label: '23.976 fps' },
                        ]}
                        onChange={v => update('fps', v)}
                        disabled={disabled}
                    />
                </div>

                {/* ── Quality ── */}
                <div className="gs-card gs-card--quality">
                    <div className="gs-card-header">
                        <i className="bi bi-sliders2 gs-icon"></i>
                        <span className="gs-card-label">{t('sectionQuality')}</span>
                        <Tooltip text={currentQualityHelp} />
                    </div>
                    {NO_CRF_ENCODERS.has(settings.encoder) ? (
                        <div className="gs-notice">
                            <i className="bi bi-info-circle"></i>
                            {['ffv1', 'huffyuv'].includes(settings.encoder)
                                ? t('noCrfNoticeLossless')
                                : t('noCrfNoticeProfile')
                            }
                        </div>
                    ) : (
                    <GsSelect
                        value={settings.quality}
                        options={[
                            { value: 'lossless', label: `${t('qualityMaxQual')} (RF ${rfTable.min})` },
                            ...qualityPresets.map(p => ({ value: p.key, label: `${p.label} (RF ${p.rf})` })),
                            { value: 'custom', label: settings.quality === 'custom' ? `${t('qualityCustomLabel')} (RF ${settings.customQuality})` : t('qualityCustomEmpty'), special: true },
                        ]}
                        onChange={v => update('quality', v)}
                        onSpecial={() => openCustomQuality()}
                        disabled={disabled}
                    />
                    )}
                </div>

                {/* ── Codec ── */}
                <div className="gs-card gs-card--codec">
                    <div className="gs-card-header">
                        <i className="bi bi-cpu gs-icon"></i>
                        <span className="gs-card-label">{t('gsCodecCard')}</span>
                        <Tooltip text={currentEncHelp} />
                    </div>
                    <div className="gs-codec-row">
                        <GsSelect
                            value={settings.encoder}
                            groups={encoderGroups.map(g => ({ label: g.label, options: g.encoders.map(e => ({
                                value: e.value,
                                label: e.label,
                                desc: e.desc,
                                disabled: (ENCODER_DISABLED_FORMATS as Record<string, Set<string>>)[e.value]?.has(settings.format) ||
                                    (settings.format === 'av_webm' && !WEBM_COMPATIBLE_ENCODERS.has(e.value)),
                            })) }))
                            }
                            onChange={handleEncoderChange}
                            disabled={disabled}
                            className="gs-dropdown--encoder"
                            footer={
                                <button
                                    type="button"
                                    className="gs-show-more-codecs"
                                    onMouseDown={e => e.stopPropagation()}
                                    onClick={e => { e.stopPropagation(); setShowMoreCodecs(v => !v) }}
                                >
                                    <i className={`bi bi-chevron-${showMoreCodecs ? 'up' : 'down'}`}></i>
                                    {showMoreCodecs ? t('collapseCodecs') : t('expandCodecs')}
                                </button>
                            }
                        />
                        {speedPresets.length > 0 && (
                            <GsSelect
                                value={settings.encoderSpeed}
                                options={speedPresets}
                                onChange={v => update('encoderSpeed', v)}
                                disabled={disabled}
                                className="gs-dropdown--speed"
                            />
                        )}
                    </div>
                </div>

            </div>

            {/* ── Custom quality popup ── */}
            {showCustomQuality && (
                <div className="gs-quality-overlay" onClick={() => setShowCustomQuality(false)}>
                    <div className="gs-quality-popup" onClick={e => e.stopPropagation()}>
                        <div className="gs-qpopup-title">
                            <i className="bi bi-sliders2"></i>
                            {t('gsCustomQualityTitle')}
                        </div>
                        <p className="gs-qpopup-subtitle">
                            RF {rfTable.min} = {t('gsQualityBest')} &nbsp;·&nbsp; RF {rfTable.max} = {t('gsQualityWorst')}
                        </p>
                        <div className="gs-qpopup-value">RF {draftRF}</div>
                        <input
                            type="range"
                            className="gs-quality-slider"
                            min={rfTable.min}
                            max={rfTable.max}
                            step={1}
                            value={draftRF}
                            onChange={e => setDraftRF(Number(e.target.value))}
                        />
                        <div className="gs-qpopup-labels">
                            <span>{t('rfBetter')}</span>
                            <span>{t('rfWorse')}</span>
                        </div>
                        <div className="gs-qpopup-hint">
                            {t('helpQualCustom')}
                        </div>
                        <div className="gs-qpopup-actions">
                            <button className="gs-qpopup-cancel" onClick={() => setShowCustomQuality(false)}>
                                {t('cancel')}
                            </button>
                            <button className="gs-qpopup-confirm" onClick={confirmCustomQuality}>
                                {t('apply')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default GlobalSettings
