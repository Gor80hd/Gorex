import { useState, useEffect, type ReactNode } from 'react'
import type { EncodingSettings } from '../../domain'
import type { SelectProps, SelectGroup, SelectOption } from '../../components/GlobalSettings/GlobalSettings'
import type { VideoSettingsPanelProps } from './types'
import { EIGHT_BIT_ONLY_ENCODERS, AUDIO_CODECS } from '../../features/encoding/encodingOptions'
import { SUB_LANG_LABELS, buildYtdlFormatGroups, resolveYtdlFormat } from './listModel'
import TimeRangeSelector from './TimeRangeSelector'
interface SettingsDraft extends EncodingSettings {
    _convertAfterDownload?: boolean; _ytdlNoAudio: boolean; _ytdlDownloadSubs: boolean; _ytdlAutoSubs?: boolean
    _ytdlSubLangs: string; _ytdlSubFormat: string; _ytdlAudioFormat: string; _ytdlSponsorBlock: boolean; _ytdlSponsorBlockCats: string[]
}
import GlobalSettings, { GsSelect, estimateOutputSize, CODEC_RF, ENCODER_PRESETS, WEBM_COMPATIBLE_ENCODERS, WEBM_COMPATIBLE_AUDIO, ENCODER_DISABLED_FORMATS, NO_CRF_ENCODERS, ALPHA_CAPABLE_ENCODERS, MULTI_PASS_ENCODERS, getEncoderGroupsForPlatform, getAudioFormatDefaults, getFormatOptionGroups, isAudioOnlyOutputFormat, isAudioCodecCompatibleWithFormat, normalizeEncoderSettings } from '../../components/GlobalSettings/GlobalSettings'
import { useLanguage } from '../../i18n'

// ─── VSP helper UI components ──────────────────────────────────────────────────
function VspSectionHeader({ icon, title }: { icon: string; title: string }) {
    return (
        <div className="vsp-section-header">
            <i className={`bi ${icon}`}></i>
            <span>{title}</span>
        </div>
    )
}

function VspRow({ label, hint, children }: { label: ReactNode; hint?: ReactNode; children?: ReactNode }) {
    return (
        <div className="vsp-row">
            <div className="vsp-row-label">
                <span className="vsp-row-name">{label}</span>
                {hint && <span className="vsp-row-hint">{hint}</span>}
            </div>
            <div className="vsp-row-control">{children}</div>
        </div>
    )
}

export function VspToggle({ value, onChange, disabled }: { value?: boolean; onChange: (value: boolean) => void; disabled?: boolean }) {
    return (
        <button
            className={`vsp-toggle ${value ? 'on' : 'off'}${disabled ? ' disabled' : ''}`}
            onClick={() => !disabled && onChange(!value)}
            type="button"
        >
            <div className="vsp-toggle-knob"></div>
        </button>
    )
}

const PanelSelect = (props: SelectProps) => <GsSelect direction="down" {...props} />

function normalizeSettingsForPlatform<T extends EncodingSettings>(settings: T, platform: string): T {
    const availableEncoders = platform === 'darwin'
        ? new Set(getEncoderGroupsForPlatform(platform).flatMap(group => group.encoders.map(encoder => encoder.value)))
        : null
    const hasSupportedEncoder = !availableEncoders || availableEncoders.has(settings.encoder)
    const platformSettings = {
        ...settings,
        ...(platform === 'darwin' ? { hwDecoding: 'videotoolbox' } : {}),
        ...(!hasSupportedEncoder
            ? { encoder: 'vt_h265', encoderSpeed: 'balanced', multiPass: false }
            : {}),
    }
    const supportsMultiPass = MULTI_PASS_ENCODERS.has(platformSettings.encoder)
        && !(platformSettings.quality === 'lossless' && (platformSettings.encoder || '').startsWith('nvenc_'))
    return normalizeEncoderSettings({
        ...platformSettings,
        ...(!supportsMultiPass ? { multiPass: false } : {}),
    })
}

// ─── Video Settings Panel ──────────────────────────────────────────────────────
function VideoSettingsPanel({ video, globalSettings, systemPlatform, onClose, onSave, onReset, onYtdlFormatChange, onYtdlConvertToggle, onYtdlClipChange, onYtdlOptionsChange, onLocalClipChange, onOpenSettings }: VideoSettingsPanelProps) {
    const { t } = useLanguage()
    const VSP_TABS = [
        { id: 'video',     label: t('tabVideo'),     icon: 'bi-camera-video' },
        { id: 'audio',     label: t('tabAudio'),     icon: 'bi-music-note-beamed' },
        { id: 'subtitles', label: t('tabSubtitles'), icon: 'bi-badge-cc' },
        { id: 'filters',   label: t('tabFilters'),   icon: 'bi-sliders' },
        { id: 'hdr',       label: t('tabHdr'),       icon: 'bi-stars' },
    ]
    const VSP_TABS_YTDL = [
        { id: 'download',  label: t('vspTabDownload'), icon: 'bi-cloud-arrow-down' },
        { id: 'video',     label: t('tabVideo'),       icon: 'bi-camera-video' },
        { id: 'audio',     label: t('tabAudio'),       icon: 'bi-music-note-beamed' },
        { id: 'subtitles', label: t('tabSubtitles'),   icon: 'bi-badge-cc' },
        { id: 'filters',   label: t('tabFilters'),     icon: 'bi-sliders' },
        { id: 'hdr',       label: t('tabHdr'),         icon: 'bi-stars' },
    ]
    const isYtdl = !!video.isYtdlItem
    const tabs = isYtdl ? VSP_TABS_YTDL : VSP_TABS
    const [draft, setDraft] = useState<SettingsDraft>(() => normalizeSettingsForPlatform({
        ...(video.customSettings || video.conversionSettings || { ...globalSettings }),
        noAudio: (video.customSettings || video.conversionSettings)?.noAudio ?? false,
        _ytdlNoAudio:       video.ytdlNoAudio       ?? false,
        _ytdlDownloadSubs:  video.ytdlDownloadSubs  ?? false,
        // Encode source (manual vs auto) into the lang value with "auto:" prefix.
        // If the user already has a saved preference — use it.
        // Otherwise auto-pick the first available language to avoid rate-limit
        // errors caused by yt-dlp requesting all languages at once ("all").
        _ytdlSubLangs: (() => {
            if (video.ytdlSubLangs) {
                return video.ytdlAutoSubs
                    ? `auto:${video.ytdlSubLangs}`
                    : video.ytdlSubLangs
            }
            const manuals = (video.ytdlAvailableSubs || []).filter(c => !c.endsWith('-orig'))
            if (manuals.length > 0) return manuals[0]
            const autos = (video.ytdlAvailableAutoSubs || [])
                .filter(c => !c.endsWith('-orig') && !!SUB_LANG_LABELS[c])
            if (autos.length > 0) return `auto:${autos[0]}`
            return 'all'
        })(),
        _ytdlSubFormat:          video.ytdlSubFormat          ?? 'srt',
        _ytdlAudioFormat:        video.ytdlAudioFormat        ?? 'best',
        _ytdlSponsorBlock:       video.ytdlSponsorBlock       ?? false,
        _ytdlSponsorBlockCats:   video.ytdlSponsorBlockCats   ?? ['sponsor'],
    }, systemPlatform))
    const [activeTab, setActiveTab] = useState(isYtdl ? 'download' : 'video')
    const audioOnly = isAudioOnlyOutputFormat(draft.format)

    useEffect(() => {
        if (audioOnly && ['subtitles', 'filters', 'hdr'].includes(activeTab)) {
            setActiveTab('audio')
        }
    }, [audioOnly, activeTab])

    useEffect(() => {
        setDraft(prev => normalizeSettingsForPlatform(prev, systemPlatform))
    }, [systemPlatform])

    const update = <K extends keyof SettingsDraft,>(key: K, val: SettingsDraft[K]) => setDraft(prev => ({ ...prev, [key]: val }))

    const handleFormatChange = (fmt: string) => {
        const audioDefaults = getAudioFormatDefaults(fmt)
        if (audioDefaults) {
            setDraft(prev => ({
                ...prev,
                format: fmt,
                ...audioDefaults,
                noAudio: false,
                subtitleMode: 'none',
                subtitleBurn: false,
                subtitleExternalFile: '',
                alphaChannel: false,
                hwDecoding: 'none',
                multiPass: false,
            }))
            setActiveTab('audio')
            return
        }
        const patch: Partial<EncodingSettings> = { format: fmt }
        if (fmt === 'av_webm') {
            if (!WEBM_COMPATIBLE_ENCODERS.has(draft.encoder)) {
                const speeds = ENCODER_PRESETS.vp9
                patch.encoder = 'vp9'
                patch.encoderSpeed = speeds[Math.floor(speeds.length / 2)]?.value ?? 'good'
            }
            const audioCodec = draft.audioCodec || 'av_aac'
            if (!WEBM_COMPATIBLE_AUDIO.has(audioCodec) && !audioCodec.startsWith('copy')) {
                patch.audioCodec = 'opus'
            }
        } else if (fmt === 'av_ogg') {
            if (!new Set(['theora', 'vp8', 'vp9', 'vp9_10bit']).has(draft.encoder)) {
                patch.encoder = 'theora'
                patch.encoderSpeed = undefined
            }
            const audioCodec = draft.audioCodec || 'av_aac'
            if (!WEBM_COMPATIBLE_AUDIO.has(audioCodec) && !audioCodec.startsWith('copy')) {
                patch.audioCodec = 'vorbis'
            }
        } else if (fmt === 'av_flv') {
            if (!new Set(['flv1', 'x264', 'x264_10bit', 'nvenc_h264', 'qsv_h264', 'vce_h264', 'mf_h264', 'vt_h264']).has(draft.encoder)) {
                patch.encoder = 'flv1'
                patch.encoderSpeed = undefined
            }
        } else if (fmt === 'av_3gp') {
            if (!new Set(['h263', 'h263p', 'x264', 'x264_10bit', 'nvenc_h264', 'qsv_h264', 'vce_h264', 'mf_h264', 'vt_h264', 'mpeg4']).has(draft.encoder)) {
                patch.encoder = 'h263p'
                patch.encoderSpeed = undefined
            }
        } else {
            const disabledFormats = ENCODER_DISABLED_FORMATS[draft.encoder]
            if (disabledFormats?.has(fmt)) {
                const speeds = ENCODER_PRESETS.x265
                patch.encoder = 'x265'
                patch.encoderSpeed = speeds?.find(s => s.value === 'slow')?.value
                    ?? speeds?.[Math.floor((speeds?.length ?? 0) / 2)]?.value ?? 'slow'
            }
            if (fmt === 'av_mp4' || fmt === 'av_mov' || fmt === 'av_avi' || fmt === 'av_ts' || fmt === 'av_flv' || fmt === 'av_3gp') {
                const audioCodec = draft.audioCodec || 'av_aac'
                const containerUnsafeAudio = new Set(['vorbis', 'opus', 'flac16', 'flac24', 'pcm_s16le', 'pcm_s24le', 'pcm_f32le', 'alac', 'wmav2'])
                if ((WEBM_COMPATIBLE_AUDIO.has(audioCodec) || containerUnsafeAudio.has(audioCodec)) && !audioCodec.startsWith('copy')) {
                    patch.audioCodec = 'av_aac'
                }
            }
        }
        setDraft(prev => ({ ...prev, ...patch }))
    }

    const rfTable = CODEC_RF[draft.encoder] || CODEC_RF.x265
    const speedPresets = ENCODER_PRESETS[draft.encoder] ?? []
    const isPassthru = (draft.audioCodec || 'av_aac').startsWith('copy')
    const isHWEncoder = ['nvenc_', 'qsv_', 'vce_', 'mf_', 'vt_'].some(p => (draft.encoder || '').startsWith(p))
    const isMac = systemPlatform === 'darwin'
    const supportsMultiPass = MULTI_PASS_ENCODERS.has(draft.encoder)
        && !(draft.quality === 'lossless' && (draft.encoder || '').startsWith('nvenc_'))
    const encoderGroups = getEncoderGroupsForPlatform(systemPlatform).map(g => ({
        label: g.labelKey ? t(g.labelKey) : g.label,
        options: g.encoders.map(e => ({ value: e.value, label: e.label, desc: e.desc }))
    }))

    const handleSave = () => {
        if (isYtdl) {
            onYtdlConvertToggle(video.id, draft._convertAfterDownload ?? !!video.convertAfterDownload)
            if (onYtdlOptionsChange) {
                const rawLang = draft._ytdlSubLangs || 'all'
                const isAllLangs = rawLang === 'all'
                const isAutoLang = !isAllLangs && rawLang.startsWith('auto:')
                const langCode = isAutoLang ? rawLang.slice(5) : rawLang
                onYtdlOptionsChange(video.id, {
                    noAudio:            !!draft._ytdlNoAudio,
                    downloadSubs:       !!draft._ytdlDownloadSubs && (isAllLangs || !isAutoLang),
                    autoSubs:           !!draft._ytdlDownloadSubs && (isAllLangs || isAutoLang),
                    subLangs:           langCode,
                    subFormat:          draft._ytdlSubFormat  || 'srt',
                    audioFormat:        draft._ytdlAudioFormat || 'best',
                    sponsorBlock:       !!draft._ytdlSponsorBlock,
                    sponsorBlockCats:   draft._ytdlSponsorBlockCats?.length ? draft._ytdlSponsorBlockCats : ['sponsor'],
                })
            }
            // Strip internal flags before persisting as conversionSettings
            const { _convertAfterDownload: _, _ytdlNoAudio: __, _ytdlDownloadSubs: ___, _ytdlAutoSubs: ____, _ytdlSubLangs: _____, _ytdlSubFormat: ______, _ytdlAudioFormat: _______, _ytdlSponsorBlock: ________, _ytdlSponsorBlockCats: _________, ...cleanDraft } = draft
            onSave(video.id, normalizeSettingsForPlatform(cleanDraft, systemPlatform))
        } else {
            onSave(video.id, normalizeSettingsForPlatform(draft, systemPlatform))
        }
        onClose()
    }
    const handleReset = () => { onReset(video.id); onClose() }

    // For yt-dlp: local state for convert toggle (managed through draft)
    const convertAfterDownload = isYtdl
        ? (draft._convertAfterDownload !== undefined ? draft._convertAfterDownload : !!video.convertAfterDownload)
        : false

    const ytdlFormatGroups = isYtdl ? buildYtdlFormatGroups(video.ytdlFormats) : []
    const selectedYtdlFmt = isYtdl ? resolveYtdlFormat(video.ytdlSelectedFormat, ytdlFormatGroups) : ''

    // Build grouped subtitle language options from what this video actually has.
    // Manual subs: ytdlAvailableSubs (real subtitles added by humans).
    // Auto subs: ytdlAvailableAutoSubs filtered to known language codes only
    //   (avoids listing 100+ YouTube machine-translated languages like sm, sg, crs, etc.)
    const manualSubLangs = (video.ytdlAvailableSubs || []).filter(c => !c.endsWith('-orig'))
    const autoSubLangs   = (video.ytdlAvailableAutoSubs || [])
        .filter(c => !c.endsWith('-orig') && !!SUB_LANG_LABELS[c])

    const hasAnySubData = manualSubLangs.length > 0 || autoSubLangs.length > 0

    const makeLangOption = (code: string, prefix = '') => ({
        value: `${prefix}${code}`,
        label: SUB_LANG_LABELS[code] ? `${SUB_LANG_LABELS[code]} (${code})` : code,
    })

    let subLangGroups: SelectGroup[] | undefined
    let subLangFlatOptions: SelectOption[] | undefined

    if (hasAnySubData) {
        const groups = []
        // Only show manual group if there are actual manual subtitles
        if (manualSubLangs.length > 0) {
            groups.push({
                label: t('vspSubsGroupManual'),
                options: [
                    ...manualSubLangs.map(c => makeLangOption(c)),
                ],
            })
        }
        if (autoSubLangs.length > 0) {
            groups.push({
                label: t('vspSubsGroupAuto'),
                options: [
                    ...autoSubLangs.map(c => makeLangOption(c, 'auto:')),
                ],
            })
        }
        subLangGroups = groups
    } else {
        // No subtitle data (non-YouTube or info not available) — flat fallback list
        subLangFlatOptions = [
            { value: 'en',  label: t('subLangEng') },
            { value: 'ru',  label: t('subLangRus') },
            { value: 'ja',  label: t('subLangJpn') },
            { value: 'zh',  label: t('subLangChi') },
            { value: 'ko',  label: t('subLangKor') },
            { value: 'fr',  label: t('subLangFra') },
            { value: 'de',  label: t('subLangDeu') },
            { value: 'es',  label: t('subLangSpa') },
            { value: 'pt',  label: t('subLangPor') },
            { value: 'it',  label: t('subLangIta') },
            { value: 'ar',  label: t('subLangAra') },
        ]
    }

    return (
        <div className="vsp-overlay" onClick={onClose}>
            <div className="vsp-panel" onClick={e => e.stopPropagation()}>

                {/* ── Header ── */}
                <div className="vsp-header">
                    <div className="vsp-header-info">
                        {video.thumbnail
                            ? <img className="vsp-thumb" src={video.thumbnail} alt="" />
                            : <div className="vsp-thumb vsp-thumb--placeholder"><i className="bi bi-film"></i></div>
                        }
                        <div className="vsp-title-block">
                            <span className="vsp-title">{video.title}</span>
                            <span className="vsp-subtitle">
                                {isYtdl ? t('vspDownloadTitle') : t('vspConvTitle')}
                            </span>
                        </div>
                    </div>
                    <button className="vsp-close" onClick={onClose}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>

                {/* ── Body: sidebar + content ── */}
                <div className="vsp-body">
                    <div className="vsp-sidebar">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                className={`vsp-tab${activeTab === tab.id ? ' active' : ''}${isYtdl && tab.id !== 'download' && !convertAfterDownload ? ' vsp-tab--dim' : ''}${audioOnly && ['subtitles', 'filters', 'hdr'].includes(tab.id) ? ' vsp-tab--dim' : ''}`}
                                disabled={audioOnly && ['subtitles', 'filters', 'hdr'].includes(tab.id)}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <i className={`bi ${tab.icon}`}></i>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="vsp-content">

                        {/* ═══ DOWNLOAD (yt-dlp only) ═══ */}
                        {activeTab === 'download' && isYtdl && (
                            <div className="vsp-section">
                                <VspSectionHeader icon="bi-cloud-arrow-down" title={t('vspDownloadFormat')} />
                                <VspRow label={t('vspQualityFormat')} hint={t('vspHintQualityFormat')}>
                                    <PanelSelect
                                        value={selectedYtdlFmt}
                                        groups={ytdlFormatGroups}
                                        onChange={v => onYtdlFormatChange(video.id, v)}
                                    />
                                </VspRow>

                                {/* ── Audio options ── */}
                                <VspSectionHeader icon="bi-volume-mute" title={t('vspAudioOptions')} />
                                {selectedYtdlFmt === 'bestaudio' ? (
                                    <VspRow label={t('vspAudioFileFormat')} hint={t('vspHintAudioFileFormat')}>
                                        <PanelSelect
                                            value={draft._ytdlAudioFormat || 'best'}
                                            options={[
                                                { value: 'best',  label: t('audioFmtBest') },
                                                { value: 'mp3',   label: t('audioFmtMp3') },
                                                { value: 'm4a',   label: t('audioFmtM4a') },
                                                { value: 'flac',  label: t('audioFmtFlac') },
                                                { value: 'opus',  label: t('audioFmtOpus') },
                                                { value: 'wav',   label: t('audioFmtWav') },
                                                { value: 'vorbis',label: t('audioFmtOgg') },
                                            ]}
                                            onChange={v => setDraft(prev => ({ ...prev, _ytdlAudioFormat: v }))}
                                        />
                                    </VspRow>
                                ) : (
                                    <VspRow label={t('vspNoAudio')} hint={t('vspHintNoAudio')}>
                                        <VspToggle
                                            value={!!draft._ytdlNoAudio}
                                            onChange={v => setDraft(prev => ({ ...prev, _ytdlNoAudio: v }))}
                                        />
                                    </VspRow>
                                )}

                                <VspSectionHeader icon="bi-arrow-repeat" title={t('vspConvertAfterDl')} />
                                <VspRow label={t('vspConvertFile')} hint={t('vspHintConvertFile')}>
                                    <VspToggle
                                        value={convertAfterDownload}
                                        onChange={v => setDraft(prev => ({ ...prev, _convertAfterDownload: v }))}
                                    />
                                </VspRow>
                                {!convertAfterDownload && (
                                    <div className="vsp-notice">
                                        <i className="bi bi-info-circle"></i>
                                        {t('vspConvertNotice')}
                                    </div>
                                )}

                                {/* ── Subtitle download ── */}
                                <VspSectionHeader icon="bi-badge-cc" title={t('vspSubDownloadSection')} />
                                <VspRow label={t('vspDownloadSubtitles')} hint={t('vspHintDownloadSubtitles')}>
                                    <VspToggle
                                        value={!!draft._ytdlDownloadSubs}
                                        onChange={v => setDraft(prev => ({ ...prev, _ytdlDownloadSubs: v }))}
                                    />
                                </VspRow>
                                {draft._ytdlDownloadSubs && (
                                    <>
                                        <VspRow label={t('vspSubLangs')} hint={t('vspHintSubLangs')}>
                                            <PanelSelect
                                                value={draft._ytdlSubLangs || 'all'}
                                                groups={subLangGroups ? [{ label: '', options: [{ value: 'all', label: t('subLangAll') }] }, ...subLangGroups] : undefined}
                                                options={subLangGroups ? undefined : [{ value: 'all', label: t('subLangAll') }, ...(subLangFlatOptions || [])]}
                                                onChange={v => setDraft(prev => ({ ...prev, _ytdlSubLangs: v }))}
                                            />
                                        </VspRow>
                                        {!!draft._ytdlDownloadSubs && (
                                            <div className="vsp-notice vsp-notice--warn">
                                                <i className="bi bi-exclamation-triangle"></i>
                                                <span>
                                                    {t('vspSubsAllWarning')}{' '}
                                                    {onOpenSettings && (
                                                        <button
                                                            type="button"
                                                            className="vsp-notice-link"
                                                            onClick={() => { onClose(); onOpenSettings('other') }}
                                                        >
                                                            {t('vspSubsAllWarningLink')}
                                                        </button>
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                        <VspRow label={t('vspSubFormat')} hint={t('vspHintSubFormat')}>
                                            <PanelSelect
                                                value={draft._ytdlSubFormat || 'srt'}
                                                options={[
                                                    { value: 'srt',  label: t('subFormatSrt') },
                                                    { value: 'vtt',  label: t('subFormatVtt') },
                                                    { value: 'ass',  label: t('subFormatAss') },
                                                    { value: 'best', label: t('subFormatBest') },
                                                ]}
                                                onChange={v => setDraft(prev => ({ ...prev, _ytdlSubFormat: v }))}
                                            />
                                        </VspRow>
                                    </>
                                )}

                                {/* ── SponsorBlock ── */}
                                <VspSectionHeader icon="bi-skip-forward-fill" title={t('vspSponsorBlockSection')} />
                                <VspRow label={t('vspSponsorBlockEnable')} hint={t('vspHintSponsorBlockEnable')}>
                                    <VspToggle
                                        value={!!draft._ytdlSponsorBlock}
                                        onChange={v => setDraft(prev => ({ ...prev, _ytdlSponsorBlock: v }))}
                                    />
                                </VspRow>
                                {draft._ytdlSponsorBlock && (
                                    <VspRow label={t('vspSponsorBlockCats')} hint={t('vspHintSponsorBlockCats')}>
                                        <div className="sb-cats">
                                            {[
                                                { id: 'sponsor',        labelKey: 'sbCatSponsor' },
                                                { id: 'intro',          labelKey: 'sbCatIntro' },
                                                { id: 'outro',          labelKey: 'sbCatOutro' },
                                                { id: 'selfpromo',      labelKey: 'sbCatSelfPromo' },
                                                { id: 'preview',        labelKey: 'sbCatPreview' },
                                                { id: 'filler',         labelKey: 'sbCatFiller' },
                                                { id: 'interaction',    labelKey: 'sbCatInteraction' },
                                                { id: 'music_offtopic', labelKey: 'sbCatMusicOfftopic' },
                                            ].map(cat => {
                                                const cats = draft._ytdlSponsorBlockCats ?? ['sponsor']
                                                const active = cats.includes(cat.id)
                                                return (
                                                    <button
                                                        key={cat.id}
                                                        type="button"
                                                        className={`sb-cat${active ? ' active' : ''}`}
                                                        onClick={() => {
                                                            const next = active
                                                                ? cats.filter(c => c !== cat.id)
                                                                : [...cats, cat.id]
                                                            setDraft(prev => ({ ...prev, _ytdlSponsorBlockCats: next.length ? next : [cat.id] }))
                                                        }}
                                                    >
                                                        {t(cat.labelKey)}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </VspRow>
                                )}

                                {/* ── Time range clip ── */}
                                {(video.ytdlDuration || 0) > 0 && (
                                    <>
                                        <VspSectionHeader icon="bi-scissors" title={t('vspTimeClip')} />
                                        <div className="vsp-clip-wrap">
                                            <TimeRangeSelector
                                                duration={video.ytdlDuration}
                                                chapters={video.ytdlChapters || []}
                                                clipStart={video.clipStart ?? null}
                                                clipEnd={video.clipEnd ?? null}
                                                thumbnail={video.thumbnail}
                                                videoUrl={video.ytdlUrl}
                                                onChange={(s, e) => onYtdlClipChange(video.id, s, e)}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* ═══ VIDEO ═══ */}
                        {activeTab === 'video' && (
                            <div className={`vsp-section${audioOnly ? ' vsp-section--audio-output' : ''}`}>
                                <VspSectionHeader icon="bi-file-earmark-play" title={t('sectionContainer')} />
                                <VspRow label={t('rowFormat')} hint={t('hintFormat')}>
                                    <PanelSelect
                                        value={draft.format}
                                        groups={getFormatOptionGroups(t)}
                                        onChange={handleFormatChange}
                                    />
                                </VspRow>

                                <VspSectionHeader icon="bi-cpu" title={t('sectionEncoder')} />
                                <VspRow label={t('rowVideoCodec')} hint={t('hintVideoCodec')}>
                                    <PanelSelect
                                        value={draft.encoder}
                                        groups={encoderGroups.map(g => ({
                                            ...g,
                                        options: g.options.map(e => ({
                                                ...e,
                                                disabled: ENCODER_DISABLED_FORMATS[e.value]?.has(draft.format) ||
                                                    (draft.format === 'av_webm' && !WEBM_COMPATIBLE_ENCODERS.has(e.value)),
                                            }))
                                        }))}
                                        onChange={v => {
                                            setDraft(prev => normalizeEncoderSettings({ ...prev, encoder: v }))
                                        }}
                                    />
                                </VspRow>
                                {EIGHT_BIT_ONLY_ENCODERS.has(draft.encoder) && (
                                    <div className="vsp-notice vsp-notice--warn">
                                        <i className="bi bi-exclamation-triangle"></i>
                                        {t('warn8bitEncoder')}
                                    </div>
                                )}
                                {speedPresets.length > 0 && (
                                    <VspRow label={t('rowSpeedPreset')} hint={t('hintSpeedPreset')}>
                                        <PanelSelect
                                            value={draft.encoderSpeed}
                                            options={speedPresets}
                                            onChange={v => update('encoderSpeed', v)}
                                        />
                                    </VspRow>
                                )}

                                <VspSectionHeader icon="bi-sliders2" title={t('sectionQuality')} />
                                {NO_CRF_ENCODERS.has(draft.encoder) ? (
                                    <div className="vsp-notice">
                                        <i className="bi bi-info-circle"></i>
                                        {['ffv1', 'huffyuv'].includes(draft.encoder)
                                            ? t('noCrfNoticeLossless')
                                            : t('noCrfNoticeProfile')
                                        }
                                    </div>
                                ) : (
                                <>
                                <VspRow label={t('rowQualityMode')} hint={t('hintQualityMode')}>
                                    <PanelSelect
                                        value={draft.quality}
                                        options={[
                                            { value: 'lossless', label: `${t('qualityMaxQual')} (RF ${rfTable.min})` },
                                            { value: 'high',     label: `${t('qualityHigh')} (RF ${rfTable.high})` },
                                            { value: 'medium',   label: `${t('qualityMedium')} (RF ${rfTable.medium})` },
                                            { value: 'low',      label: `${t('qualityLow')} (RF ${rfTable.low})` },
                                            { value: 'potato',   label: `${t('qualityPotato')} (RF ${rfTable.potato})` },
                                            { value: 'custom',   label: draft.quality === 'custom' ? `${t('qualityCustomLabel')} (RF ${draft.customQuality})` : t('qualityCustomEmpty') },
                                        ]}
                                        onChange={v => update('quality', v)}
                                    />
                                </VspRow>
                                {draft.quality === 'custom' && (
                                    <VspRow
                                        label={`RF / CRF: ${draft.customQuality}`}
                                        hint={`${rfTable.min} (${t('vspQualityHint')}) — ${rfTable.max} (${t('vspQualityHintWorse')})`}
                                    >
                                        <div className="vsp-slider-wrap">
                                            <span className="vsp-slider-edge">{rfTable.min}</span>
                                            <input
                                                type="range"
                                                className="vsp-slider"
                                                min={rfTable.min}
                                                max={rfTable.max}
                                                step={1}
                                                value={draft.customQuality}
                                                onChange={e => update('customQuality', Number(e.target.value))}
                                            />
                                            <span className="vsp-slider-edge">{rfTable.max}</span>
                                        </div>
                                    </VspRow>
                                )}
                                </>
                                )}

                                <VspSectionHeader icon="bi-layers" title={t('rowAlphaChannel')} />
                                <VspRow
                                    label={t('rowAlphaChannel')}
                                    hint={ALPHA_CAPABLE_ENCODERS.has(draft.encoder) ? t('hintAlphaChannel') : t('hintAlphaNoSupport')}
                                >
                                    <VspToggle
                                        value={!!draft.alphaChannel}
                                        onChange={v => update('alphaChannel', v)}
                                        disabled={!ALPHA_CAPABLE_ENCODERS.has(draft.encoder)}
                                    />
                                </VspRow>

                                <VspSectionHeader icon="bi-aspect-ratio" title={t('sectionResFps')} />
                                <VspRow label={t('rowResolution')} hint={t('hintResolution')}>
                                    <PanelSelect
                                        value={draft.resolution}
                                        options={[
                                            { value: 'source', label: t('resSource') },
                                            { value: '4k',     label: '4K (2160p)' },
                                            { value: '1440p',  label: '2K (1440p)' },
                                            { value: '1080p',  label: '1080p (Full HD)' },
                                            { value: '720p',   label: '720p (HD)' },
                                            { value: '480p',   label: '480p (SD)' },
                                        ]}
                                        onChange={v => update('resolution', v)}
                                    />
                                </VspRow>
                                <VspRow label={t('rowFps')} hint={t('hintFps')}>
                                    <PanelSelect
                                        value={draft.fps}
                                        options={[
                                            { value: 'source', label: t('fpsSource') },
                                            { value: '60',     label: '60 fps' },
                                            { value: '30',     label: '30 fps' },
                                            { value: '25',     label: '25 fps (PAL)' },
                                            { value: '24',     label: t('fpsCinema') },
                                            { value: '23.976', label: '23.976 fps (NTSC)' },
                                        ]}
                                        onChange={v => update('fps', v)}
                                    />
                                </VspRow>
                                <VspRow label={t('rowFpsMode')} hint={t('hintFpsMode')}>
                                    <PanelSelect
                                        value={draft.fpsMode || 'vfr'}
                                        options={[
                                            { value: 'vfr', label: t('fpsVfr') },
                                            { value: 'cfr', label: t('fpsCfr') },
                                            { value: 'pfr', label: t('fpsPfr') },
                                        ]}
                                        onChange={v => update('fpsMode', v)}
                                    />
                                </VspRow>

                                {(!isMac || supportsMultiPass) && (
                                    <VspSectionHeader icon="bi-lightning-charge" title={t('sectionHwAccel')} />
                                )}
                                {!isMac && (
                                    <VspRow label={t('rowHwDecoding')} hint={t('hintHwDecodingVsp')}>
                                        <PanelSelect
                                            value={draft.hwDecoding || 'none'}
                                            options={[
                                                { value: 'none',  label: t('hwDecodingNone') },
                                                { value: 'videotoolbox', label: 'VideoToolbox (Apple)' },
                                                { value: 'nvdec', label: 'NVDEC (NVIDIA)' },
                                                { value: 'qsv',   label: 'Quick Sync (Intel)' },
                                            ]}
                                            onChange={v => update('hwDecoding', v)}
                                        />
                                    </VspRow>
                                )}
                                {supportsMultiPass && (
                                    <VspRow label={t('rowMultiPass')} hint={t('hintMultiPass')}>
                                        <VspToggle value={!!draft.multiPass} onChange={v => update('multiPass', v)} />
                                    </VspRow>
                                )}

                                {/* ── Time trim for local file conversion ── */}
                                {!isYtdl && !audioOnly && (video.durationSecs || 0) > 0 && (
                                    <>
                                        <VspSectionHeader icon="bi-scissors" title={t('vspTimeClip')} />
                                        <div className="vsp-clip-wrap">
                                            <TimeRangeSelector
                                                duration={video.durationSecs}
                                                chapters={[]}
                                                clipStart={video.clipStart ?? null}
                                                clipEnd={video.clipEnd ?? null}
                                                thumbnail={video.thumbnail}
                                                videoUrl={undefined}
                                                localPath={video.path}
                                                localPreviewUrl={video.previewUrl}
                                                onChange={(s, e) => onLocalClipChange && onLocalClipChange(video.id, s, e)}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* ═══ AUDIO ═══ */}
                        {activeTab === 'audio' && (
                            <div className="vsp-section">
                                {/* No audio option for local file conversion */}
                                {!isYtdl && !audioOnly && (
                                    <>
                                        <VspSectionHeader icon="bi-volume-mute" title={t('vspAudioOptions')} />
                                        <VspRow label={t('vspNoAudio')} hint={t('vspHintNoAudioConv')}>
                                            <VspToggle
                                                value={!!draft.noAudio}
                                                onChange={v => update('noAudio', v)}
                                            />
                                        </VspRow>
                                    </>
                                )}
                                <VspSectionHeader icon="bi-music-note-beamed" title={t('sectionAudioCodec')} />
                                <VspRow label={t('rowAudioCodec')} hint={t('hintAudioCodec')}>
                                    <PanelSelect
                                        value={draft.audioCodec || 'av_aac'}
                                        options={AUDIO_CODECS.map(c => ({
                                            ...c,
                                            disabled: (draft.format === 'av_webm' && !WEBM_COMPATIBLE_AUDIO.has(c.value) && !c.value.startsWith('copy')) || (audioOnly && !isAudioCodecCompatibleWithFormat(draft.format, c.value)),
                                        }))}
                                        onChange={v => update('audioCodec', v)}
                                    />
                                </VspRow>

                                {!isPassthru && (
                                    <>
                                        <VspSectionHeader icon="bi-speaker" title={t('sectionAudioParams')} />
                                        <VspRow label={t('rowBitrate')} hint={t('hintBitrate')}>
                                            <PanelSelect
                                                value={draft.audioBitrate || '160'}
                                                options={[
                                                    { value: '64',  label: '64 kbps' },
                                                    { value: '96',  label: '96 kbps' },
                                                    { value: '128', label: '128 kbps' },
                                                    { value: '160', label: `160 kbps (${t('bitrateDefault')})` },
                                                    { value: '192', label: '192 kbps' },
                                                    { value: '256', label: '256 kbps' },
                                                    { value: '320', label: '320 kbps' },
                                                ]}
                                                onChange={v => update('audioBitrate', v)}
                                            />
                                        </VspRow>
                                        <VspRow label={t('rowMixdown')} hint={t('hintMixdown')}>
                                            <PanelSelect
                                                value={draft.audioMixdown || 'stereo'}
                                                options={[
                                                    { value: 'mono',    label: t('mixMono') },
                                                    { value: 'stereo',  label: t('mixStereo') },
                                                    { value: 'dpl2',    label: 'Dolby Pro Logic II' },
                                                    { value: '5point1', label: 'Surround 5.1' },
                                                    { value: '6point1', label: 'Surround 6.1' },
                                                    { value: '7point1', label: 'Surround 7.1' },
                                                ]}
                                                onChange={v => update('audioMixdown', v)}
                                            />
                                        </VspRow>
                                        <VspRow label={t('rowSampleRate')} hint={t('hintSampleRate')}>
                                            <PanelSelect
                                                value={draft.audioSampleRate || 'auto'}
                                                options={[
                                                    { value: 'auto',  label: t('srAuto') },
                                                    { value: '22.05', label: '22.05 kHz' },
                                                    { value: '32',    label: '32 kHz' },
                                                    { value: '44.1',  label: '44.1 kHz' },
                                                    { value: '48',    label: '48 kHz' },
                                                    { value: '96',    label: '96 kHz' },
                                                ]}
                                                onChange={v => update('audioSampleRate', v)}
                                            />
                                        </VspRow>
                                    </>
                                )}

                                <VspSectionHeader icon="bi-collection-play" title={t('sectionFileMetadata')} />
                                <VspRow label={t('rowChapterMarkers')} hint={t('hintChapterMarkers')}>
                                    <VspToggle value={draft.chapterMarkers !== false} onChange={v => update('chapterMarkers', v)} />
                                </VspRow>
                                <VspRow label={t('rowOptimizeMp4')} hint={t('hintOptimizeMp4')}>
                                    <VspToggle
                                        value={!!draft.optimizeMP4}
                                        onChange={v => update('optimizeMP4', v)}
                                        disabled={draft.format !== 'av_mp4'}
                                    />
                                </VspRow>
                            </div>
                        )}

                        {/* ═══ SUBTITLES ═══ */}
                        {activeTab === 'subtitles' && (
                            <div className="vsp-section">
                                <VspSectionHeader icon="bi-badge-cc" title={t('sectionSubtitleTracks')} />
                                <VspRow label={t('rowSubtitles')} hint={t('hintSubtitles')}>
                                    <PanelSelect
                                        value={draft.subtitleMode || 'none'}
                                        options={[
                                            { value: 'none',        label: t('subNone') },
                                            { value: 'first',       label: t('subFirst') },
                                            { value: 'all',         label: t('subAll') },
                                            { value: 'scan_forced', label: t('subScanForced') },
                                        ]}
                                        onChange={v => update('subtitleMode', v)}
                                    />
                                </VspRow>
                                {draft.subtitleMode !== 'none' && draft.subtitleMode !== 'all' && (
                                    <VspRow label={t('rowSubtitleBurn')} hint={t('hintSubtitleBurn')}>
                                        <VspToggle value={!!draft.subtitleBurn} onChange={v => update('subtitleBurn', v)} />
                                    </VspRow>
                                )}
                                {draft.subtitleMode !== 'none' && !draft.subtitleBurn && draft.subtitleMode !== 'all' && (
                                    <VspRow label={t('rowSubtitleDefault')} hint={t('hintSubtitleDefaultShort')}>
                                        <VspToggle value={!!draft.subtitleDefault} onChange={v => update('subtitleDefault', v)} />
                                    </VspRow>
                                )}

                                <VspSectionHeader icon="bi-translate" title={t('sectionSubtitleLang')} />
                                <VspRow label={t('rowSubtitleLang')} hint={t('hintSubtitleLang')}>
                                    <PanelSelect
                                        value={draft.subtitleLanguage || 'any'}
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
                                        onChange={v => update('subtitleLanguage', v)}
                                    />
                                </VspRow>

                                <VspSectionHeader icon="bi-file-earmark-text" title={t('sectionSubtitleExt')} />
                                <VspRow label={t('rowSubtitleExtFile')} hint={t('hintSubtitleExtFile')}>
                                    <div className="vsp-file-pick">
                                        {draft.subtitleExternalFile ? (
                                            <span className="vsp-file-pick__name" title={draft.subtitleExternalFile}>
                                                {draft.subtitleExternalFile.split(/[\\/]/).pop()}
                                            </span>
                                        ) : (
                                            <span className="vsp-file-pick__empty">{t('subExtFileEmpty')}</span>
                                        )}
                                        <button
                                            className="vsp-file-pick__btn"
                                            type="button"
                                            onClick={async () => {
                                                const file = await window.api.selectSubtitleFile()
                                                if (file) update('subtitleExternalFile', file)
                                            }}
                                        >
                                            <i className="bi bi-folder2-open"></i>
                                        </button>
                                        {draft.subtitleExternalFile && (
                                            <button
                                                className="vsp-file-pick__clear"
                                                type="button"
                                                title={t('removeFile')}
                                                onClick={() => update('subtitleExternalFile', '')}
                                            >
                                                <i className="bi bi-x-lg"></i>
                                            </button>
                                        )}
                                    </div>
                                </VspRow>
                                {draft.subtitleExternalFile && (
                                    <VspRow label={t('rowSubtitleExtBurn')} hint={t('hintSubtitleExtBurn')}>
                                        <VspToggle value={!!draft.subtitleBurn} onChange={v => update('subtitleBurn', v)} />
                                    </VspRow>
                                )}
                                {draft.subtitleExternalFile && !draft.subtitleBurn && (
                                    <VspRow label={t('rowSubtitleDefault')} hint={t('hintSubtitleDefaultShort')}>
                                        <VspToggle value={!!draft.subtitleDefault} onChange={v => update('subtitleDefault', v)} />
                                    </VspRow>
                                )}
                            </div>
                        )}

                        {/* ═══ FILTERS ═══ */}
                        {activeTab === 'filters' && (
                            <div className="vsp-section">
                                <VspSectionHeader icon="bi-intersect" title={t('sectionDeinterlace')} />
                                <VspRow label={t('rowDeinterlace')} hint={t('hintDeinterlace')}>
                                    <PanelSelect
                                        value={draft.deinterlace || 'off'}
                                        options={[
                                            { value: 'off',           label: t('deintOff') },
                                            { value: 'yadif_default', label: t('deintYadif') },
                                            { value: 'yadif_bob',     label: t('deintYadifBob') },
                                            { value: 'bwdif_default', label: t('deintBwdif') },
                                            { value: 'bwdif_bob',     label: t('deintBwdifBob') },
                                        ]}
                                        onChange={v => update('deinterlace', v)}
                                    />
                                </VspRow>

                                <VspSectionHeader icon="bi-snow2" title={t('sectionDenoise')} />
                                <VspRow label={t('rowDenoise')} hint={t('hintDenoise')}>
                                    <PanelSelect
                                        value={draft.denoise || 'off'}
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
                                        onChange={v => update('denoise', v)}
                                    />
                                </VspRow>

                                <VspSectionHeader icon="bi-grid-3x3" title={t('sectionDeblock')} />
                                <VspRow label={t('rowDeblock')} hint={t('hintDeblock')}>
                                    <PanelSelect
                                        value={draft.deblock || 'off'}
                                        options={[
                                            { value: 'off',        label: t('deblockOff') },
                                            { value: 'ultralight', label: t('deblockUltralight') },
                                            { value: 'light',      label: t('deblockLight') },
                                            { value: 'medium',     label: t('deblockMedium') },
                                            { value: 'strong',     label: t('deblockStrong') },
                                            { value: 'stronger',   label: t('deblockStronger') },
                                        ]}
                                        onChange={v => update('deblock', v)}
                                    />
                                </VspRow>

                                <VspSectionHeader icon="bi-zoom-in" title={t('sectionSharpen')} />
                                <VspRow label={t('rowSharpen')} hint={t('hintSharpen')}>
                                    <PanelSelect
                                        value={draft.sharpen || 'off'}
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
                                        onChange={v => update('sharpen', v)}
                                    />
                                </VspRow>

                                <VspSectionHeader icon="bi-camera" title={t('sectionFrameTransform')} />
                                <VspRow label={t('rowGrayscale')} hint={t('hintGrayscale')}>
                                    <VspToggle value={!!draft.grayscale} onChange={v => update('grayscale', v)} />
                                </VspRow>
                                <VspRow label={t('rowRotate')} hint={t('hintRotate')}>
                                    <PanelSelect
                                        value={draft.rotate || '0'}
                                        options={[
                                            { value: '0',     label: t('rotateNone') },
                                            { value: '90',    label: t('rotate90') },
                                            { value: '180',   label: t('rotate180') },
                                            { value: '270',   label: t('rotate270') },
                                            { value: 'hflip', label: t('rotateHflip') },
                                        ]}
                                        onChange={v => update('rotate', v)}
                                    />
                                </VspRow>
                            </div>
                        )}

                        {/* ═══ HDR / META ═══ */}
                        {activeTab === 'hdr' && (
                            <div className="vsp-section">
                                <VspSectionHeader icon="bi-brightness-high" title={t('sectionHdr')} />
                                <VspRow label={t('rowHdrMetadata')} hint={t('hintHdrMetadata')}>
                                    <PanelSelect
                                        value={draft.hdrMetadata || 'off'}
                                        options={[
                                            { value: 'off',         label: t('hdrOff') },
                                            { value: 'hdr10plus',   label: 'HDR10+' },
                                            { value: 'dolbyvision', label: 'Dolby Vision' },
                                            { value: 'all',         label: t('hdrAll') },
                                        ]}
                                        onChange={v => update('hdrMetadata', v)}
                                    />
                                </VspRow>

                                <VspSectionHeader icon="bi-tag" title={t('sectionFileMeta')} />
                                <VspRow label={t('rowKeepMetadata')} hint={t('hintKeepMetadataShort')}>
                                    <VspToggle value={!!draft.keepMetadata} onChange={v => update('keepMetadata', v)} />
                                </VspRow>
                                <VspRow label={t('rowInlineParamSets')} hint={t('hintInlineParamSets')}>
                                    <VspToggle value={!!draft.inlineParamSets} onChange={v => update('inlineParamSets', v)} />
                                </VspRow>
                            </div>
                        )}

                    </div>
                </div>

                {/* ── Footer ── */}
                <div className="vsp-footer">
                    {(video.customSettings || video.conversionSettings) && !isYtdl && (
                        <button className="vsp-reset-btn" onClick={handleReset}>
                            <i className="bi bi-arrow-counterclockwise"></i>
                            {t('vspResetBtn')}
                        </button>
                    )}
                    <div className="vsp-footer-right">
                        <button className="vsp-cancel-btn" onClick={onClose}>{t('cancel')}</button>
                        <button className="vsp-save-btn" onClick={handleSave}>
                            <i className="bi bi-check2"></i>
                            {t('apply')}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    )
}


export default VideoSettingsPanel
