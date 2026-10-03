import type { VideoTask, TwitchVideo, EncodingSettings, MediaFormat, Translate } from '../../domain'
import type { SelectGroup, SelectTag } from '../../components/GlobalSettings/GlobalSettings'
import { isAudioOnlyOutputFormat } from '../../components/GlobalSettings/settingsModel'

export function isDownloadVideo(video?: VideoTask | null) {
    return !!(video?.isYtdlItem || video?.isTwitchItem)
}

export function getTwitchVideoKey(video?: TwitchVideo | null) {
    return String(video?.id || video?.url || video?.title || '')
}

export function formatTwitchPublishedAt(value?: string) {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleDateString()
}

// ISO 639-1 / common BCP-47 code → human-readable name
export const SUB_LANG_LABELS: Record<string, string> = {
    af: 'Afrikaans', am: 'Amharic', ar: 'Arabic', az: 'Azerbaijani',
    be: 'Belarusian', bg: 'Bulgarian', bn: 'Bengali', bs: 'Bosnian',
    ca: 'Catalan', cs: 'Czech', cy: 'Welsh', da: 'Danish',
    de: 'Deutsch', el: 'Greek', en: 'English', es: 'Español',
    et: 'Estonian', eu: 'Basque', fa: 'Persian', fi: 'Finnish',
    fil: 'Filipino', fr: 'Français', gl: 'Galician', gu: 'Gujarati',
    he: 'Hebrew', hi: 'Hindi', hr: 'Croatian', hu: 'Hungarian',
    hy: 'Armenian', id: 'Indonesian', is: 'Icelandic', it: 'Italiano',
    ja: '日本語', ka: 'Georgian', kk: 'Kazakh', km: 'Khmer',
    kn: 'Kannada', ko: '한국어', lt: 'Lithuanian', lv: 'Latvian',
    mk: 'Macedonian', ml: 'Malayalam', mn: 'Mongolian', mr: 'Marathi',
    ms: 'Malay', my: 'Burmese', nb: 'Norwegian', nl: 'Dutch',
    no: 'Norwegian', pa: 'Punjabi', pl: 'Polish', pt: 'Português',
    'pt-BR': 'Português (Brasil)', ro: 'Romanian', ru: 'Русский',
    si: 'Sinhala', sk: 'Slovak', sl: 'Slovenian', sq: 'Albanian',
    sr: 'Serbian', sv: 'Swedish', sw: 'Swahili', ta: 'Tamil',
    te: 'Telugu', th: 'Thai', tr: 'Turkish', uk: 'Ukrainian',
    ur: 'Urdu', uz: 'Uzbek', vi: 'Vietnamese',
    zh: '中文', 'zh-CN': '中文 (简)', 'zh-Hans': '中文 (简)',
    'zh-TW': '中文 (繁)', 'zh-Hant': '中文 (繁)', zu: 'Zulu',
}

// ─── Hostname → deterministic accent colour ──────────────────────────────────
const BADGE_PALETTE = [
    '#6366f1', '#8b5cf6', '#a855f7', '#ec4899',
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#14b8a6', '#06b6d4', '#3b82f6', '#f43f5e',
]
export function hostnameToColor(hostname: string) {
    let h = 5381
    for (let i = 0; i < hostname.length; i++) h = ((h << 5) + h) ^ hostname.charCodeAt(i)
    return BADGE_PALETTE[Math.abs(h) % BADGE_PALETTE.length]
}

// ─── yt-dlp format helpers ─────────────────────────────────────────────────────
export function formatFileSize(bytes?: number) {
    if (!bytes) return null
    const mb = bytes / (1024 * 1024)
    if (mb < 1024) return mb.toFixed(0) + ' MB'
    return (mb / 1024).toFixed(1) + ' GB'
}

// Codec id → human-readable name
const VCODEC_LABEL: Record<string, string> = {
    'avc1': 'H.264', 'h264': 'H.264',
    'vp09': 'VP9',   'vp9':  'VP9',
    'vp08': 'VP8',   'vp8':  'VP8',
    'av01': 'AV1',   'av1':  'AV1',
    'hvc1': 'H.265', 'hev1': 'H.265', 'h265': 'H.265',
    'theora': 'Theora',
}

export function getCodecLabel(f: MediaFormat) {
    if (!f.vcodec || f.vcodec === 'none') return null
    const base = f.vcodec.split('.')[0].toLowerCase()
    return VCODEC_LABEL[base] || f.vcodec.split('.')[0]
}

export function formatFormatLabel(f: MediaFormat, t?: Translate) {
    const res = f.height ? f.height + 'p' : (f.resolution || null)
    const ext = f.ext ? f.ext.toUpperCase() : null
    const audioOnly = !f.vcodec || f.vcodec === 'none'
    if (audioOnly) return [t ? t('audioOnlyLabel') : 'Audio only', ext].filter(Boolean).join(' ')
    return [res, ext].filter(Boolean).join(' ') || f.format_id
}

export function buildFormatTags(f: MediaFormat, t?: Translate) {
    const tags: SelectTag[] = []
    const codec = getCodecLabel(f)
    if (codec)   tags.push({ key: 'enc', icon: 'bi-cpu',           label: codec,          cls: 'tr-enc' })
    if (f.fps)   tags.push({ key: 'fps', icon: 'bi-camera-video',  label: f.fps + 'fps',  cls: 'tr-fps' })
    const sz = formatFileSize(f.filesize)
    if (sz)      tags.push({ key: 'sz',  icon: 'bi-hdd',           label: '~' + sz,       cls: 'tr-size' })
    if (!f.vcodec || f.vcodec === 'none')
                 tags.push({ key: 'aud', icon: 'bi-music-note',    label: t ? t('audioOnlyTag') : 'audio', cls: 'tr-aud' })
    return tags
}

export function buildTwitchQualityGroups(video: VideoTask, t?: Translate): SelectGroup[] {
    const sourceLabel = t ? t('qualitySource') : 'Source'
    const raw = Array.isArray(video?.twitchQualityOptions) ? video.twitchQualityOptions : []
    const options = raw.length ? raw : [{ value: 'Source', label: sourceLabel, source: true }]
    return [{
        label: t ? t('availableFormats') : 'Available formats',
        options: options.map(option => ({
            value: option.value,
            label: option.source && option.label === 'Source' ? sourceLabel : option.label,
            tags: option.height ? [
                { key: 'res', icon: 'bi-aspect-ratio', label: `${option.height}p`, cls: 'tr-res' },
                ...(option.fps ? [{ key: 'fps', icon: 'bi-camera-video', label: `${option.fps}fps`, cls: 'tr-fps' }] : []),
            ] : [],
        })),
    }]
}

export function resolveTwitchQuality(value: string | undefined, groups: SelectGroup[]) {
    const options = groups.flatMap(group => group.options || [])
    if (options.some(option => option.value === value)) return value
    return options[0]?.value || 'Source'
}

export function getTwitchQualityLabel(value: string | undefined, groups: SelectGroup[]) {
    for (const group of groups) {
        const found = (group.options || []).find(option => option.value === value)
        if (found) return found.label
    }
    return value || ''
}

export function buildYtdlFormatGroups(formats?: MediaFormat[], t?: Translate): SelectGroup[] {
    const groups: SelectGroup[] = []

    // Audio-only special option (always available)
    groups.push({
        label: t ? t('audioOnlyGroup') : 'Audio only',
        options: [{ value: 'bestaudio', label: t ? t('bestAudioLabel') : 'Best audio (bestaudio)' }]
    })

    if (!formats || !formats.length) return groups
    // Dedup: keep best bitrate per resolution+codec combo
    const seen = new Map<string, MediaFormat>()
    for (const f of formats) {
        const codec = getCodecLabel(f) || f.ext
        const key = `${f.height || 0}_${codec}`
        const prev = seen.get(key)
        if (!prev || (f.tbr || 0) > (prev.tbr || 0)) seen.set(key, f)
    }
    const sorted = [...seen.values()].sort((a, b) => (b.height || 0) - (a.height || 0))
    groups.push({ label: t ? t('availableFormats') : 'Available formats', options: sorted.map(f => ({ value: f.format_id, label: formatFormatLabel(f, t), tags: buildFormatTags(f, t) })) })
    return groups
}

// Returns the effective format value: uses selectedFormat if it exists in groups,
// otherwise falls back to the first video format or 'bestaudio'.
export function resolveYtdlFormat(selectedFormat: string | undefined, groups: SelectGroup[]) {
    if (!groups || !groups.length) return 'bestaudio'
    const allValues = groups.flatMap(g => g.options.map(o => o.value))
    if (selectedFormat && allValues.includes(selectedFormat)) return selectedFormat
    // First video format (second group, first option), or bestaudio
    const videoOptions = groups[1]?.options
    return videoOptions?.length ? videoOptions[0].value : 'bestaudio'
}

// ─── Transformation tags helper ────────────────────────────────────────────────
const ENCODER_SHORT: Record<string, string> = {
    x264: 'H.264', x264_10bit: 'H.264 10b',
    x265: 'H.265', x265_10bit: 'H.265 10b', x265_12bit: 'H.265 12b',
    svt_av1: 'AV1', svt_av1_10bit: 'AV1 10b',
    vp8: 'VP8', vp9: 'VP9', vp9_10bit: 'VP9 10b',
    nvenc_h264: 'H.264 NVENC', nvenc_h265: 'H.265 NVENC', nvenc_av1: 'AV1 NVENC',
    qsv_h264: 'H.264 QSV', qsv_h265: 'H.265 QSV', qsv_av1: 'AV1 QSV',
    vce_h264: 'H.264 VCE', vce_h265: 'H.265 VCE', vce_av1: 'AV1 VCE',
    mf_h264: 'H.264 MF', mf_h265: 'H.265 MF',
    vt_h264: 'H.264 VideoToolbox', vt_h265: 'H.265 VideoToolbox',
    theora: 'Theora',
    libaom_av1: 'AV1 libaom',
    mpeg4: 'MPEG-4', mpeg2video: 'MPEG-2', mpeg1video: 'MPEG-1',
    prores_ks: 'ProRes', dnxhd: 'DNxHD',
    ffv1: 'FFV1', huffyuv: 'HuffYUV',
    mjpeg: 'MJPEG',
    wmv2: 'WMV8', wmv1: 'WMV7',
    h263p: 'H.263+', h263: 'H.263',
    flv1: 'FLV1',
}
const FORMAT_LABEL: Record<string, string> = { av_mp4: 'MP4', av_mkv: 'MKV', av_webm: 'WebM', av_mov: 'MOV', av_avi: 'AVI', av_ts: 'TS', av_flv: 'FLV', av_ogg: 'OGG', av_3gp: '3GP', audio_mp3: 'MP3', audio_m4a: 'M4A', audio_flac: 'FLAC', audio_wav: 'WAV', audio_opus: 'Opus', audio_ogg: 'Ogg' }
const RES_LABEL: Record<string, string> = { '4k': '4K', '1440p': '1440p', '1080p': '1080p', '720p': '720p', '480p': '480p' }

export function getTransformTags(video: VideoTask, s: EncodingSettings | null | undefined, t?: Translate) {
    const tags: SelectTag[] = []
    if (!s) return tags
    const audioOnly = isAudioOnlyOutputFormat(s.format)
    // Format
    if (s.format && FORMAT_LABEL[s.format]) tags.push({ key: 'fmt',   icon: audioOnly ? 'bi-file-earmark-music' : 'bi-file-earmark-play', label: FORMAT_LABEL[s.format], cls: 'tr-fmt' })
    // Encoder
    if (!audioOnly && s.encoder) tags.push({ key: 'enc',   icon: 'bi-cpu',              label: ENCODER_SHORT[s.encoder] || s.encoder, cls: 'tr-enc' })
    // Resolution
    if (!audioOnly && s.resolution && s.resolution !== 'source') tags.push({ key: 'res',   icon: 'bi-aspect-ratio',     label: '\u2192 ' + (RES_LABEL[s.resolution] || s.resolution), cls: 'tr-res' })
    // FPS
    if (!audioOnly && s.fps && s.fps !== 'source') tags.push({ key: 'fps',   icon: 'bi-camera-video',     label: '\u2192 ' + s.fps + ' fps', cls: 'tr-fps' })
    // Audio codec
    const audioShort = (s.audioCodec || 'av_aac').replace('av_', '').replace('fdk_', '').toUpperCase().replace('COPY:', '').replace('COPY', 'Passthru')
    tags.push({ key: 'aud',   icon: 'bi-music-note',        label: audioShort, cls: 'tr-aud' })
    if (audioOnly) return tags
    // Filters
    if (s.grayscale)                       tags.push({ key: 'gray',  icon: 'bi-circle-half',      label: t ? t('filterTagGrayscale') : 'B&W',    cls: 'tr-filter' })
    if (s.rotate && s.rotate !== '0')      tags.push({ key: 'rot',   icon: 'bi-arrow-clockwise',  label: s.rotate === 'hflip' ? (t ? t('filterTagFlip') : 'Flip') : s.rotate + '\u00b0', cls: 'tr-filter' })
    if (s.deinterlace && s.deinterlace !== 'off') tags.push({ key: 'deint', icon: 'bi-layout-split',     label: t ? t('filterTagDeinterlace') : 'Deinterlace', cls: 'tr-filter' })
    if (s.denoise && s.denoise !== 'off')  tags.push({ key: 'dn',    icon: 'bi-snow',             label: t ? t('filterTagDenoise') : 'Denoise', cls: 'tr-filter' })
    if (s.sharpen && s.sharpen !== 'off')  tags.push({ key: 'sh',    icon: 'bi-stars',            label: t ? t('filterTagSharpen') : 'Sharpen', cls: 'tr-filter' })
    if (s.deblock && s.deblock !== 'off')  tags.push({ key: 'db',    icon: 'bi-bounding-box',     label: t ? t('filterTagDeblock') : 'Deblock', cls: 'tr-filter' })
    return tags
}
