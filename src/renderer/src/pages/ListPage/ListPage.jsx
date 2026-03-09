import { useState, useEffect, useRef, useCallback } from 'react'
import './ListPage.scss'
import GlobalSettings, { GsSelect, estimateOutputSize, CODEC_RF, ENCODER_PRESETS, ENCODER_GROUPS, WEBM_COMPATIBLE_ENCODERS, WEBM_COMPATIBLE_AUDIO, ENCODER_DISABLED_FORMATS } from '../../components/GlobalSettings/GlobalSettings'
import { useLanguage } from '../../i18n'

// ─── Service detection (shared with SourcePage) ────────────────────────────────
const SERVICE_MAP = {
    'youtube.com':     { name: 'YouTube',      icon: 'bi-youtube',         color: '#ff0000' },
    'youtu.be':        { name: 'YouTube',      icon: 'bi-youtube',         color: '#ff0000' },
    'twitter.com':     { name: 'Twitter / X',  icon: 'bi-twitter-x',       color: '#ffffff' },
    'x.com':           { name: 'Twitter / X',  icon: 'bi-twitter-x',       color: '#ffffff' },
    'instagram.com':   { name: 'Instagram',    icon: 'bi-instagram',        color: '#e1306c' },
    'ddinstagram.com': { name: 'Instagram',    icon: 'bi-instagram',        color: '#e1306c' },
    'reddit.com':      { name: 'Reddit',       icon: 'bi-reddit',           color: '#ff4500' },
    'vimeo.com':       { name: 'Vimeo',        icon: 'bi-vimeo',            color: '#1ab7ea' },
    'soundcloud.com':  { name: 'SoundCloud',   icon: 'bi-soundcloud',       color: '#ff5500' },
    'twitch.tv':       { name: 'Twitch',       icon: 'bi-twitch',           color: '#9146ff' },
    'facebook.com':    { name: 'Facebook',     icon: 'bi-facebook',         color: '#1877f2' },
    'fb.watch':        { name: 'Facebook',     icon: 'bi-facebook',         color: '#1877f2' },
    'tiktok.com':      { name: 'TikTok',       icon: 'bi-tiktok',           svgPath: 'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.27 8.27 0 0 0 4.84 1.55V6.79a4.85 4.85 0 0 1-1.07-.1z', color: '#ff0050' },
    'vt.tiktok.com':   { name: 'TikTok',       icon: 'bi-tiktok',           svgPath: 'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.27 8.27 0 0 0 4.84 1.55V6.79a4.85 4.85 0 0 1-1.07-.1z', color: '#ff0050' },
    't.co':            { name: 'Twitter / X',  icon: 'bi-twitter-x',        color: '#ffffff' },
    'pinterest.com':   { name: 'Pinterest',    icon: 'bi-pinterest',        color: '#e60023' },
    'pin.it':          { name: 'Pinterest',    icon: 'bi-pinterest',        color: '#e60023' },
    'tumblr.com':      { name: 'Tumblr',       icon: 'bi-tumblr',           color: '#35465c' },
    'snapchat.com':    { name: 'Snapchat',     icon: 'bi-snapchat',         color: '#fffc00' },
    'bilibili.com':    { name: 'Bilibili',     icon: 'bi-play-circle-fill', color: '#00a1d6' },
    'b23.tv':          { name: 'Bilibili',     icon: 'bi-play-circle-fill', color: '#00a1d6' },
    'ok.ru':           { name: 'OK',           icon: 'bi-person-circle',    color: '#f7931e' },
    'vk.com':          { name: 'VKontakte',    icon: 'bi-person-circle',    svgPath: 'M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.523-2.049-1.713-1.033-1.01-1.49-.9-1.49-.9 0 0-.127.1-.127.6v1.556c0 .4-.127.64-1.184.64-1.743 0-3.68-1.06-5.039-3.01C6.094 11.96 5.82 10 5.82 10H7.522s.107.488.32.96c.59 1.32 1.38 1.56 1.38 1.56.21 0 .21-1 .21-1V8.44c0-.5-.19-.66-.19-.66h-.3c-.16 0-.16-.1-.16-.1 0 0 .06-1.26 2.63-1.26 1.48 0 1.48.55 1.48 1.02v2.5c0 .085 0 .65.29.65.194 0 .5-.194 1.06-.82 1.04-1.34 1.55-2.74 1.55-2.74.194-.36.29-.42.29-.42.1-.03.19-.1.57-.1h1.77c.527 0 .527.27.39.53-.16.26-1.25 2.03-1.25 2.03-.67 1.24-.73 1.38.057 2.18.68.68 1.38 1.23 1.38 1.23.6.58.67 1.22.67 1.22z', color: '#4a76a8' },
    'vk.ru':           { name: 'VKontakte',    icon: 'bi-person-circle',    svgPath: 'M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.523-2.049-1.713-1.033-1.01-1.49-.9-1.49-.9 0 0-.127.1-.127.6v1.556c0 .4-.127.64-1.184.64-1.743 0-3.68-1.06-5.039-3.01C6.094 11.96 5.82 10 5.82 10H7.522s.107.488.32.96c.59 1.32 1.38 1.56 1.38 1.56.21 0 .21-1 .21-1V8.44c0-.5-.19-.66-.19-.66h-.3c-.16 0-.16-.1-.16-.1 0 0 .06-1.26 2.63-1.26 1.48 0 1.48.55 1.48 1.02v2.5c0 .085 0 .65.29.65.194 0 .5-.194 1.06-.82 1.04-1.34 1.55-2.74 1.55-2.74.194-.36.29-.42.29-.42.1-.03.19-.1.57-.1h1.77c.527 0 .527.27.39.53-.16.26-1.25 2.03-1.25 2.03-.67 1.24-.73 1.38.057 2.18.68.68 1.38 1.23 1.38 1.23.6.58.67 1.22.67 1.22z', color: '#4a76a8' },
    'vkvideo.ru':      { name: 'VK Видео',    icon: 'bi-person-circle',    svgPath: 'M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.523-2.049-1.713-1.033-1.01-1.49-.9-1.49-.9 0 0-.127.1-.127.6v1.556c0 .4-.127.64-1.184.64-1.743 0-3.68-1.06-5.039-3.01C6.094 11.96 5.82 10 5.82 10H7.522s.107.488.32.96c.59 1.32 1.38 1.56 1.38 1.56.21 0 .21-1 .21-1V8.44c0-.5-.19-.66-.19-.66h-.3c-.16 0-.16-.1-.16-.1 0 0 .06-1.26 2.63-1.26 1.48 0 1.48.55 1.48 1.02v2.5c0 .085 0 .65.29.65.194 0 .5-.194 1.06-.82 1.04-1.34 1.55-2.74 1.55-2.74.194-.36.29-.42.29-.42.1-.03.19-.1.57-.1h1.77c.527 0 .527.27.39.53-.16.26-1.25 2.03-1.25 2.03-.67 1.24-.73 1.38.057 2.18.68.68 1.38 1.23 1.38 1.23.6.58.67 1.22.67 1.22z', color: '#4a76a8' },
    'rutube.ru':       { name: 'Rutube',       icon: 'bi-play-circle-fill', color: '#ff5c00' },
    'dailymotion.com': { name: 'Dailymotion',  icon: 'bi-play-circle-fill', color: '#0066dc' },
    'bsky.app':        { name: 'Bluesky',      icon: 'bi-cloud-fill',       color: '#0085ff' },
    'loom.com':        { name: 'Loom',         icon: 'bi-camera-video-fill',color: '#625df5' },
    'streamable.com':  { name: 'Streamable',   icon: 'bi-play-circle-fill', color: '#41b883' },
}
function detectService(raw) {
    if (!raw) return null
    try {
        const host = new URL(raw).hostname.replace(/^www\./, '')
        return SERVICE_MAP[host] ?? null
    } catch { return null }
}
function isValidUrl(raw) {
    try { new URL(raw); return true } catch { return false }
}

// ─── yt-dlp format helpers ─────────────────────────────────────────────────────
function formatFileSize(bytes) {
    if (!bytes) return null
    const mb = bytes / (1024 * 1024)
    if (mb < 1024) return mb.toFixed(0) + ' MB'
    return (mb / 1024).toFixed(1) + ' GB'
}

// Codec id → human-readable name
const VCODEC_LABEL = {
    'avc1': 'H.264', 'h264': 'H.264',
    'vp09': 'VP9',   'vp9':  'VP9',
    'vp08': 'VP8',   'vp8':  'VP8',
    'av01': 'AV1',   'av1':  'AV1',
    'hvc1': 'H.265', 'hev1': 'H.265', 'h265': 'H.265',
    'theora': 'Theora',
}

function getCodecLabel(f) {
    if (!f.vcodec || f.vcodec === 'none') return null
    const base = f.vcodec.split('.')[0].toLowerCase()
    return VCODEC_LABEL[base] || f.vcodec.split('.')[0]
}

function formatFormatLabel(f, t) {
    const res = f.height ? f.height + 'p' : (f.resolution || null)
    const ext = f.ext ? f.ext.toUpperCase() : null
    const audioOnly = !f.vcodec || f.vcodec === 'none'
    if (audioOnly) return [t ? t('audioOnlyLabel') : 'Audio only', ext].filter(Boolean).join(' ')
    return [res, ext].filter(Boolean).join(' ') || f.format_id
}

function buildFormatTags(f, t) {
    const tags = []
    const codec = getCodecLabel(f)
    if (codec)   tags.push({ key: 'enc', icon: 'bi-cpu',           label: codec,          cls: 'tr-enc' })
    if (f.fps)   tags.push({ key: 'fps', icon: 'bi-camera-video',  label: f.fps + 'fps',  cls: 'tr-fps' })
    const sz = formatFileSize(f.filesize)
    if (sz)      tags.push({ key: 'sz',  icon: 'bi-hdd',           label: '~' + sz,       cls: 'tr-size' })
    if (!f.vcodec || f.vcodec === 'none')
                 tags.push({ key: 'aud', icon: 'bi-music-note',    label: t ? t('audioOnlyTag') : 'audio', cls: 'tr-aud' })
    return tags
}

function buildYtdlFormatGroups(formats, t) {
    if (!formats || !formats.length) return []
    // Dedup: keep best bitrate per resolution+codec combo
    const seen = new Map()
    for (const f of formats) {
        const codec = getCodecLabel(f) || f.ext
        const key = `${f.height || 0}_${codec}`
        const prev = seen.get(key)
        if (!prev || (f.tbr || 0) > (prev.tbr || 0)) seen.set(key, f)
    }
    const sorted = [...seen.values()].sort((a, b) => (b.height || 0) - (a.height || 0))
    return [{ label: t ? t('availableFormats') : 'Available formats', options: sorted.map(f => ({ value: f.format_id, label: formatFormatLabel(f, t), tags: buildFormatTags(f, t) })) }]
}

// ─── Transformation tags helper ────────────────────────────────────────────────
const ENCODER_SHORT = {
    x264: 'H.264', x264_10bit: 'H.264 10b',
    x265: 'H.265', x265_10bit: 'H.265 10b', x265_12bit: 'H.265 12b',
    svt_av1: 'AV1', svt_av1_10bit: 'AV1 10b',
    vp8: 'VP8', vp9: 'VP9', vp9_10bit: 'VP9 10b',
    nvenc_h264: 'H.264 NVENC', nvenc_h265: 'H.265 NVENC', nvenc_av1: 'AV1 NVENC',
    qsv_h264: 'H.264 QSV', qsv_h265: 'H.265 QSV', qsv_av1: 'AV1 QSV',
    vce_h264: 'H.264 VCE', vce_h265: 'H.265 VCE', vce_av1: 'AV1 VCE',
    mf_h264: 'H.264 MF', mf_h265: 'H.265 MF',
    theora: 'Theora',
}
const FORMAT_LABEL = { av_mp4: 'MP4', av_mkv: 'MKV', av_webm: 'WebM', av_mov: 'MOV' }
const RES_LABEL = { '4k': '4K', '1440p': '1440p', '1080p': '1080p', '720p': '720p', '480p': '480p' }

function getTransformTags(video, s, t) {
    const tags = []
    if (!s) return tags
    // Format
    if (s.format && FORMAT_LABEL[s.format]) tags.push({ key: 'fmt',   icon: 'bi-file-earmark-play', label: FORMAT_LABEL[s.format], cls: 'tr-fmt' })
    // Encoder
    if (s.encoder) tags.push({ key: 'enc',   icon: 'bi-cpu',              label: ENCODER_SHORT[s.encoder] || s.encoder, cls: 'tr-enc' })
    // Resolution
    if (s.resolution && s.resolution !== 'source') tags.push({ key: 'res',   icon: 'bi-aspect-ratio',     label: '\u2192 ' + (RES_LABEL[s.resolution] || s.resolution), cls: 'tr-res' })
    // FPS
    if (s.fps && s.fps !== 'source') tags.push({ key: 'fps',   icon: 'bi-camera-video',     label: '\u2192 ' + s.fps + ' fps', cls: 'tr-fps' })
    // Audio codec
    const audioShort = (s.audioCodec || 'av_aac').replace('av_', '').replace('fdk_', '').toUpperCase().replace('COPY:', '').replace('COPY', 'Passthru')
    tags.push({ key: 'aud',   icon: 'bi-music-note',        label: audioShort, cls: 'tr-aud' })
    // Filters
    if (s.grayscale)                       tags.push({ key: 'gray',  icon: 'bi-circle-half',      label: t ? t('filterTagGrayscale') : 'B&W',    cls: 'tr-filter' })
    if (s.rotate && s.rotate !== '0')      tags.push({ key: 'rot',   icon: 'bi-arrow-clockwise',  label: s.rotate === 'hflip' ? (t ? t('filterTagFlip') : 'Flip') : s.rotate + '\u00b0', cls: 'tr-filter' })
    if (s.deinterlace && s.deinterlace !== 'off') tags.push({ key: 'deint', icon: 'bi-layout-split',     label: t ? t('filterTagDeinterlace') : 'Deinterlace', cls: 'tr-filter' })
    if (s.denoise && s.denoise !== 'off')  tags.push({ key: 'dn',    icon: 'bi-snow',             label: t ? t('filterTagDenoise') : 'Denoise', cls: 'tr-filter' })
    if (s.sharpen && s.sharpen !== 'off')  tags.push({ key: 'sh',    icon: 'bi-stars',            label: t ? t('filterTagSharpen') : 'Sharpen', cls: 'tr-filter' })
    if (s.deblock && s.deblock !== 'off')  tags.push({ key: 'db',    icon: 'bi-bounding-box',     label: t ? t('filterTagDeblock') : 'Deblock', cls: 'tr-filter' })
    return tags
}

// ─── Audio codecs ──────────────────────────────────────────────────────────────
const AUDIO_CODECS = [
    { value: 'av_aac',      label: 'AAC (libavcodec)' },
    { value: 'fdk_aac',     label: 'AAC (FDK)' },
    { value: 'fdk_haac',    label: 'HE-AAC (FDK)' },
    { value: 'mp3',         label: 'MP3' },
    { value: 'ac3',         label: 'AC-3 (Dolby Digital)' },
    { value: 'eac3',        label: 'E-AC-3 (Dolby Plus)' },
    { value: 'vorbis',      label: 'Vorbis' },
    { value: 'flac16',      label: 'FLAC 16-bit' },
    { value: 'flac24',      label: 'FLAC 24-bit' },
    { value: 'opus',        label: 'Opus' },
    { value: 'copy',        label: 'Passthru (auto)' },
    { value: 'copy:aac',    label: 'AAC Passthru' },
    { value: 'copy:ac3',    label: 'AC3 Passthru' },
    { value: 'copy:eac3',   label: 'E-AC3 Passthru' },
    { value: 'copy:dts',    label: 'DTS Passthru' },
    { value: 'copy:dtshd',  label: 'DTS-HD Passthru' },
    { value: 'copy:mp3',    label: 'MP3 Passthru' },
    { value: 'copy:truehd', label: 'TrueHD Passthru' },
]

// ─── VSP helper UI components ──────────────────────────────────────────────────
function VspSectionHeader({ icon, title }) {
    return (
        <div className="vsp-section-header">
            <i className={`bi ${icon}`}></i>
            <span>{title}</span>
        </div>
    )
}

function VspRow({ label, hint, children }) {
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

function VspToggle({ value, onChange, disabled }) {
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

// ─── Time formatting helper ────────────────────────────────────────────────────
function formatTime(sec) {
    const s = Math.max(0, Math.floor(sec))
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const ss = s % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
    return `${m}:${String(ss).padStart(2, '0')}`
}

// ─── Time input helpers ────────────────────────────────────────────────────────
function timeToInput(sec) {
    if (sec == null) return ''
    const s = Math.max(0, Math.floor(sec))
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const ss = s % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
    return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

function parseTimeInput(str) {
    const parts = str.trim().split(':').map(p => parseInt(p, 10))
    if (parts.some(isNaN)) return null
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
    if (parts.length === 2) return parts[0] * 60 + parts[1]
    if (parts.length === 1) return parts[0]
    return null
}

// ─── YouTube iframe postMessage helpers ─────────────────────────────────────
function ytSeek(iframeEl, sec) {
    if (!iframeEl?.contentWindow) return
    iframeEl.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'seekTo', args: [Math.max(0, sec), true] }),
        'https://www.youtube-nocookie.com'
    )
}

// ─── TimeRangeSelector component ──────────────────────────────────────────────
function getYouTubeId(url) {
    try {
        const u = new URL(url)
        if (u.hostname === 'youtu.be') return u.pathname.slice(1)
        if (u.hostname.includes('youtube.com')) return u.searchParams.get('v')
    } catch {}
    return null
}

function TimeRangeSelector({ duration, chapters, clipStart, clipEnd, thumbnail, videoUrl, onChange }) {
    const { t } = useLanguage()
    const trackRef = useRef(null)
    const draggingRef = useRef(null) // 'start' | 'end'
    const iframeRef = useRef(null)
    const timeRef = useRef(0)       // local time counter for playhead
    const pollRef = useRef(null)

    const dur = duration || 1
    const effectiveStart = clipStart ?? 0
    const effectiveEnd = clipEnd ?? dur

    const [startInput, setStartInput] = useState(timeToInput(effectiveStart))
    const [endInput, setEndInput] = useState(timeToInput(effectiveEnd))
    const [startInputError, setStartInputError] = useState(false)
    const [endInputError, setEndInputError] = useState(false)
    const [hoverTime, setHoverTime] = useState(null)
    const [hoverPct, setHoverPct] = useState(0)
    const [embedSec, setEmbedSec] = useState(null) // null = player hidden
    const [currentTime, setCurrentTime] = useState(null) // playhead position

    // Sync inputs when external values change
    useEffect(() => { setStartInput(timeToInput(clipStart ?? 0)) }, [clipStart])
    useEffect(() => { setEndInput(timeToInput(clipEnd ?? dur)) }, [clipEnd, dur])

    // Playhead tracking via YouTube postMessage events
    useEffect(() => {
        if (embedSec === null) {
            clearInterval(pollRef.current)
            pollRef.current = null
            setCurrentTime(null)
            return
        }
        timeRef.current = embedSec
        setCurrentTime(embedSec)

        const onMessage = (e) => {
            if (e.origin !== 'https://www.youtube.com' && e.origin !== 'https://www.youtube-nocookie.com') return
            let data
            try { data = JSON.parse(e.data) } catch { return }
            if (data.event === 'onStateChange') {
                if (data.info === 1) { // playing
                    clearInterval(pollRef.current)
                    pollRef.current = setInterval(() => {
                        timeRef.current = Math.min(timeRef.current + 0.2, dur)
                        setCurrentTime(timeRef.current)
                    }, 200)
                } else { // paused / buffering / ended
                    clearInterval(pollRef.current)
                }
            }
        }
        window.addEventListener('message', onMessage)
        return () => {
            window.removeEventListener('message', onMessage)
            clearInterval(pollRef.current)
        }
    }, [embedSec, dur])

    // Cleanup on unmount
    useEffect(() => () => { clearInterval(pollRef.current) }, [])

    const seekPlayer = (sec) => {
        ytSeek(iframeRef.current, sec)
        timeRef.current = sec
        setCurrentTime(sec)
    }

    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

    const posFromEvent = useCallback((e) => {
        const rect = trackRef.current?.getBoundingClientRect()
        if (!rect) return 0
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left
        return clamp(x / rect.width, 0, 1)
    }, [])

    const handleTrackMouseDown = useCallback((e, handle) => {
        e.preventDefault()
        draggingRef.current = handle

        const onMove = (ev) => {
            const pos = posFromEvent(ev)
            const sec = Math.round(pos * dur)
            if (draggingRef.current === 'start') {
                const newStart = clamp(sec, 0, (clipEnd ?? dur) - 1)
                onChange(newStart, clipEnd ?? dur)
                seekPlayer(newStart)
            } else {
                const newEnd = clamp(sec, (clipStart ?? 0) + 1, dur)
                onChange(clipStart ?? 0, newEnd)
                seekPlayer(newEnd)
            }
        }

        const onUp = () => {
            draggingRef.current = null
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
            window.removeEventListener('touchmove', onMove)
            window.removeEventListener('touchend', onUp)
        }

        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
        window.addEventListener('touchmove', onMove, { passive: false })
        window.addEventListener('touchend', onUp)
    }, [dur, clipStart, clipEnd, onChange, posFromEvent])

    const handleTrackMouseMove = useCallback((e) => {
        const pos = posFromEvent(e)
        setHoverTime(Math.round(pos * dur))
        setHoverPct(pos * 100)
    }, [dur, posFromEvent])

    const handleStartInputBlur = () => {
        const s = parseTimeInput(startInput)
        if (s === null || s < 0 || s >= (clipEnd ?? dur)) {
            setStartInputError(true)
            setStartInput(timeToInput(clipStart ?? 0))
            return
        }
        setStartInputError(false)
        onChange(s, clipEnd ?? dur)
    }

    const handleEndInputBlur = () => {
        const s = parseTimeInput(endInput)
        if (s === null || s <= (clipStart ?? 0) || s > dur) {
            setEndInputError(true)
            setEndInput(timeToInput(clipEnd ?? dur))
            return
        }
        setEndInputError(false)
        onChange(clipStart ?? 0, s)
    }

    const handleInputKeyDown = (e, handler) => {
        if (e.key === 'Enter') { e.target.blur(); handler() }
        if (e.key === 'Escape') e.target.blur()
    }

    const selectChapter = (ch) => {
        onChange(Math.round(ch.start_time), Math.round(ch.end_time))
    }

    const isFullRange = effectiveStart === 0 && effectiveEnd >= dur - 1
    const selectedSec = Math.max(0, effectiveEnd - effectiveStart)

    const startPct = (effectiveStart / dur) * 100
    const endPct   = (effectiveEnd   / dur) * 100

    const ytId = videoUrl ? getYouTubeId(videoUrl) : null

    const openAtTime = (sec) => {
        if (!videoUrl) return
        let url = videoUrl
        if (ytId) url = `https://www.youtube.com/watch?v=${ytId}&t=${Math.floor(sec)}s`
        window.open(url, '_blank')
    }

    return (
        <div className="trs-root">
            {/* ─ Preview / embed ─ */}
            {(thumbnail || ytId) && (
                <div className="trs-preview-area">
                    {/* YouTube iframe embed – shown when a preview button is clicked */}
                    {ytId && embedSec !== null ? (
                        <div className="trs-embed-wrap">
                            <iframe
                                ref={iframeRef}
                                className="trs-embed"
                                src={`https://www.youtube-nocookie.com/embed/${ytId}?start=${Math.floor(embedSec)}&autoplay=1&enablejsapi=1&controls=1&rel=0&origin=${encodeURIComponent(window.location.origin)}`}
                                allow="autoplay; encrypted-media; picture-in-picture"
                                allowFullScreen
                                title="Preview"
                            />
                            <button
                                className="trs-embed-close"
                                onClick={() => setEmbedSec(null)}
                                title={t('trsClosePlayer')}
                                type="button"
                            >
                                <i className="bi bi-x-lg" />
                            </button>
                        </div>
                    ) : (
                        /* Static thumbnail with two preview buttons */
                        <div className="trs-thumb-area">
                            {thumbnail && (
                                <div className="trs-thumb-wrap">
                                    <img src={thumbnail} alt="" className="trs-thumb-img" />
                                    <div className="trs-thumb-overlay">
                                        <span className="trs-thumb-range">
                                            <i className="bi bi-scissors" />
                                            {isFullRange ? t('trsFullVideo') : `${timeToInput(effectiveStart)} — ${timeToInput(effectiveEnd)} (${timeToInput(selectedSec)})`}
                                        </span>
                                    </div>
                                </div>
                            )}
                            {ytId && (
                                <div className="trs-thumb-btns">
                                    <button
                                        className="trs-thumb-play-btn trs-thumb-play-btn--start"
                                        onClick={() => setEmbedSec(effectiveStart)}
                                        type="button"
                                    >
                                        <i className="bi bi-play-fill" />
                                        {t('trsFrom')} {timeToInput(effectiveStart)}
                                    </button>
                                    <button
                                        className="trs-thumb-play-btn trs-thumb-play-btn--end"
                                        onClick={() => setEmbedSec(effectiveEnd)}
                                        type="button"
                                    >
                                        <i className="bi bi-play-fill" />
                                        {t('trsTo')} {timeToInput(effectiveEnd)}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ─ Track ─ */}
            <div className="trs-track-wrap">
                <div
                    className="trs-track"
                    ref={trackRef}
                    onMouseMove={handleTrackMouseMove}
                    onMouseLeave={() => setHoverTime(null)}
                    onClick={(e) => {
                        if (embedSec === null) return
                        seekPlayer(Math.round(posFromEvent(e) * dur))
                    }}
                >
                    {/* Shaded outside region (left) */}
                    <div className="trs-outside trs-outside--left" style={{ width: `${startPct}%` }} />
                    {/* Shaded outside region (right) */}
                    <div className="trs-outside trs-outside--right" style={{ left: `${endPct}%`, width: `${100 - endPct}%` }} />
                    {/* Selected region */}
                    <div
                        className="trs-region"
                        style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }}
                    />
                    {/* Chapter markers */}
                    {(chapters || []).map((ch, i) => (
                        <div
                            key={i}
                            className="trs-chapter-mark"
                            style={{ left: `${(ch.start_time / dur) * 100}%` }}
                            title={ch.title}
                        />
                    ))}
                    {/* Start handle */}
                    <div
                        className="trs-handle trs-handle--start"
                        style={{ left: `${startPct}%` }}
                        onMouseDown={e => handleTrackMouseDown(e, 'start')}
                        onTouchStart={e => handleTrackMouseDown(e, 'start')}
                    >
                        <div className="trs-handle-inner" />
                    </div>
                    {/* End handle */}
                    <div
                        className="trs-handle trs-handle--end"
                        style={{ left: `${endPct}%` }}
                        onMouseDown={e => handleTrackMouseDown(e, 'end')}
                        onTouchStart={e => handleTrackMouseDown(e, 'end')}
                    >
                        <div className="trs-handle-inner" />
                    </div>
                    {/* Playhead */}
                    {currentTime !== null && (
                        <div
                            className="trs-playhead"
                            style={{ left: `${(currentTime / dur) * 100}%` }}
                        />
                    )}
                    {/* Hover time tooltip */}
                    {hoverTime !== null && (
                        <div
                            className="trs-hover-tip"
                            style={{ left: `${hoverPct}%` }}
                        >
                            {timeToInput(hoverTime)}
                        </div>
                    )}
                </div>
                {/* Duration ticks */}
                <div className="trs-ticks">
                    <span>0:00</span>
                    <span>{timeToInput(Math.round(dur / 4))}</span>
                    <span>{timeToInput(Math.round(dur / 2))}</span>
                    <span>{timeToInput(Math.round(dur * 3 / 4))}</span>
                    <span>{timeToInput(dur)}</span>
                </div>
            </div>

            {/* ─ Inputs ─ */}
            <div className="trs-inputs">
                <div className="trs-input-group">
                    <label className="trs-input-label">
                        <i className="bi bi-skip-start-fill" /> {t('trsFrom')}
                    </label>
                    <input
                        className={`trs-input${startInputError ? ' trs-input--error' : ''}`}
                        type="text"
                        value={startInput}
                        placeholder="0:00"
                        onChange={e => { setStartInput(e.target.value); setStartInputError(false) }}
                        onBlur={handleStartInputBlur}
                        onKeyDown={e => handleInputKeyDown(e, handleStartInputBlur)}
                        spellCheck={false}
                    />
                </div>

                <div className="trs-duration-badge">
                    <i className="bi bi-scissors" />
                    {isFullRange ? t('trsFullVideo') : timeToInput(selectedSec)}
                </div>

                <div className="trs-input-group">
                    <label className="trs-input-label">
                        <i className="bi bi-skip-end-fill" /> {t('trsTo')}
                    </label>
                    <input
                        className={`trs-input${endInputError ? ' trs-input--error' : ''}`}
                        type="text"
                        value={endInput}
                        placeholder={timeToInput(dur)}
                        onChange={e => { setEndInput(e.target.value); setEndInputError(false) }}
                        onBlur={handleEndInputBlur}
                        onKeyDown={e => handleInputKeyDown(e, handleEndInputBlur)}
                        spellCheck={false}
                    />
                </div>

                {!isFullRange && (
                    <button
                        className="trs-reset-btn"
                        onClick={() => onChange(0, dur)}
                        title={t('trsRemoveClip')}
                    >
                        <i className="bi bi-x-lg" />
                    </button>
                )}
            </div>

            {/* ─ Chapter tags ─ */}
            {chapters && chapters.length > 0 && (
                <div className="trs-chapters">
                    <span className="trs-chapters-label"><i className="bi bi-bookmark-fill" /> {t('trsChapters')}</span>
                    <div className="trs-chapter-tags">
                        {chapters.map((ch, i) => {
                            const isActive = Math.abs(effectiveStart - ch.start_time) < 2 && Math.abs(effectiveEnd - ch.end_time) < 2
                            return (
                                <button
                                    key={i}
                                    className={`trs-chapter-tag${isActive ? ' active' : ''}`}
                                    onClick={() => selectChapter(ch)}
                                    title={`${timeToInput(ch.start_time)} – ${timeToInput(ch.end_time)}`}
                                >
                                    <span className="trs-chapter-time">{timeToInput(ch.start_time)}</span>
                                    <span className="trs-chapter-title">{ch.title}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Panel-scoped select (always opens downward) ───────────────────────────
const PanelSelect = (props) => <GsSelect direction="down" {...props} />

// ─── Video Settings Panel ──────────────────────────────────────────────────────
function VideoSettingsPanel({ video, globalSettings, onClose, onSave, onReset, onYtdlFormatChange, onYtdlConvertToggle, onYtdlClipChange }) {
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
    const [draft, setDraft] = useState(video.customSettings || video.conversionSettings || { ...globalSettings })
    const [activeTab, setActiveTab] = useState(isYtdl ? 'download' : 'video')

    const update = (key, val) => setDraft(prev => ({ ...prev, [key]: val }))

    const handleFormatChange = (fmt) => {
        const patch = { format: fmt }
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
        } else {
            const disabledFormats = ENCODER_DISABLED_FORMATS[draft.encoder]
            if (disabledFormats?.has(fmt)) {
                const speeds = ENCODER_PRESETS.x265
                patch.encoder = 'x265'
                patch.encoderSpeed = speeds?.find(s => s.value === 'slow')?.value
                    ?? speeds?.[Math.floor((speeds?.length ?? 0) / 2)]?.value ?? 'slow'
            }
            if (fmt === 'av_mp4' || fmt === 'av_mov') {
                const audioCodec = draft.audioCodec || 'av_aac'
                if (WEBM_COMPATIBLE_AUDIO.has(audioCodec) && !audioCodec.startsWith('copy')) {
                    patch.audioCodec = 'av_aac'
                }
            }
        }
        setDraft(prev => ({ ...prev, ...patch }))
    }

    const rfTable = CODEC_RF[draft.encoder] || CODEC_RF.x265
    const speedPresets = ENCODER_PRESETS[draft.encoder] ?? []
    const isPassthru = (draft.audioCodec || 'av_aac').startsWith('copy')
    const isHWEncoder = ['nvenc_', 'qsv_', 'vce_', 'mf_'].some(p => (draft.encoder || '').startsWith(p))
    const encoderGroups = ENCODER_GROUPS.map(g => ({
        label: g.label,
        options: g.encoders.map(e => ({ value: e.value, label: e.label, desc: e.desc }))
    }))

    const handleSave = () => {
        if (isYtdl) {
            onYtdlConvertToggle(video.id, draft._convertAfterDownload ?? !!video.convertAfterDownload)
            // Strip internal flag before persisting as conversionSettings
            const { _convertAfterDownload: _, ...cleanDraft } = draft
            onSave(video.id, cleanDraft)
        } else {
            onSave(video.id, draft)
        }
        onClose()
    }
    const handleReset = () => { onReset(video.id); onClose() }

    // For yt-dlp: local state for convert toggle (managed through draft)
    const convertAfterDownload = isYtdl
        ? (draft._convertAfterDownload !== undefined ? draft._convertAfterDownload : !!video.convertAfterDownload)
        : false

    const ytdlFormatGroups = isYtdl ? buildYtdlFormatGroups(video.ytdlFormats) : []
    const selectedYtdlFmt = isYtdl ? (video.ytdlSelectedFormat || '') : ''

    return (
        <div className="vsp-overlay" onClick={onClose}>
            <div className="vsp-panel" onClick={e => e.stopPropagation()}>

                {/* ── Header ── */}
                <div className="vsp-header">
                    <div className="vsp-header-info">
                        <img className="vsp-thumb" src={video.thumbnail} alt="" />
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
                                className={`vsp-tab${activeTab === tab.id ? ' active' : ''}${isYtdl && tab.id !== 'download' && !convertAfterDownload ? ' vsp-tab--dim' : ''}`}
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

                                {/* ── Time range clip ── */}
                                {video.ytdlDuration > 0 && (
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
                            <div className="vsp-section">
                                <VspSectionHeader icon="bi-file-earmark-play" title={t('sectionContainer')} />
                                <VspRow label={t('rowFormat')} hint={t('hintFormat')}>
                                    <PanelSelect
                                        value={draft.format}
                                        options={[
                                            { value: 'av_mp4',  label: 'MP4' },
                                            { value: 'av_mkv',  label: 'MKV' },
                                            { value: 'av_webm', label: 'WebM' },
                                            { value: 'av_mov',  label: 'MOV' },
                                        ]}
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
                                                disabled: draft.format === 'av_webm' && !WEBM_COMPATIBLE_ENCODERS.has(e.value),
                                            }))
                                        }))}
                                        onChange={v => {
                                            const speeds = ENCODER_PRESETS[v] ?? []
                                            const mid = speeds[Math.floor(speeds.length / 2)]?.value ?? 'medium'
                                            setDraft(prev => ({ ...prev, encoder: v, encoderSpeed: mid }))
                                        }}
                                    />
                                </VspRow>
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
                                <VspRow label={t('rowQualityMode')} hint={t('hintQualityMode')}>
                                    <PanelSelect
                                        value={draft.quality}
                                        options={[
                                            { value: 'lossless', label: `Lossless (RF ${rfTable.min})` },
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

                                <VspSectionHeader icon="bi-lightning-charge" title={t('sectionHwAccel')} />
                                <VspRow label={t('rowHwDecoding')} hint={t('hintHwDecodingVsp')}>
                                    <PanelSelect
                                        value={draft.hwDecoding || 'none'}
                                        options={[
                                            { value: 'none',  label: t('hwDecodingNone') },
                                            { value: 'nvdec', label: 'NVDEC (NVIDIA)' },
                                            { value: 'qsv',   label: 'Quick Sync (Intel)' },
                                        ]}
                                        onChange={v => update('hwDecoding', v)}
                                    />
                                </VspRow>
                                <VspRow label={t('rowMultiPass')} hint={t('hintMultiPass')}>
                                    <VspToggle value={!!draft.multiPass} onChange={v => update('multiPass', v)} />
                                </VspRow>
                            </div>
                        )}

                        {/* ═══ AUDIO ═══ */}
                        {activeTab === 'audio' && (
                            <div className="vsp-section">
                                <VspSectionHeader icon="bi-music-note-beamed" title={t('sectionAudioCodec')} />
                                <VspRow label={t('rowAudioCodec')} hint={t('hintAudioCodec')}>
                                    <PanelSelect
                                        value={draft.audioCodec || 'av_aac'}
                                        options={AUDIO_CODECS.map(c => ({
                                            ...c,
                                            disabled: draft.format === 'av_webm' && !WEBM_COMPATIBLE_AUDIO.has(c.value) && !c.value.startsWith('copy'),
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

function ListPage({
    videos, settings, isEncoding, theme,
    onSettingsChange, onStartEncoding, onStop,
    outputMode, customOutputDir, defaultOutputDir, onOutputModeChange,
    onAddFiles, onDownload, onRemoveVideo, onClearQueue, onRenameOutput, onVideoSettingsChange,
    onYtdlFormatChange, onYtdlConvertToggle, onYtdlConversionSettings, onYtdlClipChange,
    isDraggingOnList, onListDragEnter, onListDragLeave, onListDragOver, onListDrop,
    gpuVendor, encodingStartTime
}) {
    const [editingId, setEditingId] = useState(null)
    const [editingValue, setEditingValue] = useState('')
    const [editingVideoId, setEditingVideoId] = useState(null)
    const [tickNow, setTickNow] = useState(Date.now())
    const [addUrl, setAddUrl] = useState('')
    const [isAddingUrl, setIsAddingUrl] = useState(false)
    const [addUrlError, setAddUrlError] = useState('')
    const { t } = useLanguage()

    useEffect(() => {
        if (!isEncoding) return
        const timer = setInterval(() => setTickNow(Date.now()), 1000)
        return () => clearInterval(timer)
    }, [isEncoding])

    const startEdit = (v) => {
        setEditingId(v.id)
        setEditingValue(v.outputName || v.title)
    }

    const commitEdit = (id) => {
        const trimmed = editingValue.trim()
        if (trimmed) onRenameOutput(id, trimmed)
        setEditingId(null)
    }

    const handleEditKeyDown = (e, id) => {
        if (e.key === 'Enter') commitEdit(id)
        if (e.key === 'Escape') setEditingId(null)
    }

    const addUrlTrimmed = addUrl.trim()
    const addUrlService = detectService(addUrlTrimmed)
    const addUrlValid = isValidUrl(addUrlTrimmed)
    const addUrlUnsupported = addUrlTrimmed && addUrlValid && !addUrlService

    const handleAddUrl = async () => {
        if (!addUrlTrimmed || isAddingUrl || addUrlUnsupported || !onDownload) return
        setAddUrlError('')
        setIsAddingUrl(true)
        try {
            await onDownload(addUrlTrimmed, addUrlService)
            setAddUrl('')
        } catch (err) {
            setAddUrlError(err?.message || t('error'))
        } finally {
            setIsAddingUrl(false)
        }
    }

    const customCount = videos.filter(v => v.customSettings).length
    const globalCount = videos.length - customCount

    const hasOnlyDownloads = videos.length > 0 && videos.every(v => v.isYtdlItem)
    const hasRegular = videos.some(v => !v.isYtdlItem)
    const hasDownloads = videos.some(v => v.isYtdlItem)
    const hasYtdlConvert = videos.some(v => v.isYtdlItem && v.convertAfterDownload)
    const globalSettingsActive = hasRegular || hasYtdlConvert
    const allReady = videos.every(v =>
        v.isYtdlItem ? ['format_select', 'error'].includes(v.status) : ['ready', 'done', 'error'].includes(v.status)
    )

    const startBtnLabel = hasOnlyDownloads ? t('btnDownload') : hasDownloads ? t('btnStart') : t('btnConvert')

    const editingVideo = editingVideoId !== null ? videos.find(v => v.id === editingVideoId) : null

    return (
        <div className="video-list-container">
            <div className="video-list-header">
                <div className="video-list-topbar">
                    <div className={`list-url-bar${addUrlUnsupported ? ' list-url-bar--error' : ''}${addUrlService ? ' list-url-bar--ok' : ''}`}>
                        <span className="list-url-icon">
                            {isAddingUrl
                                ? <span className="list-url-spinner" />
                                : addUrlService
                                    ? <i className={`bi ${addUrlService.icon}`} style={{ color: addUrlService.color }} />
                                    : addUrlUnsupported
                                        ? <i className="bi bi-x-circle-fill" style={{ color: '#ef4444' }} />
                                        : <i className="bi bi-link-45deg" style={{ opacity: 0.35 }} />
                            }
                        </span>
                        <input
                            className="list-url-input"
                            type="url"
                            placeholder={t('urlPlaceholder')}
                            value={addUrl}
                            onChange={e => { setAddUrl(e.target.value); setAddUrlError('') }}
                            onKeyDown={e => e.key === 'Enter' && handleAddUrl()}
                            disabled={isAddingUrl || isEncoding}
                            spellCheck={false}
                        />
                        {addUrlService && <span className="list-url-svc">{addUrlService.name}</span>}
                        <button
                            className="list-url-btn"
                            onClick={handleAddUrl}
                            disabled={!addUrlTrimmed || isAddingUrl || addUrlUnsupported || isEncoding}
                            title={t('addToQueueTitle')}
                        >
                            {isAddingUrl ? <span className="list-url-spinner" /> : <i className="bi bi-cloud-arrow-down-fill" />}
                        </button>
                    </div>
                    <button
                        className="add-button"
                        onClick={onAddFiles}
                        disabled={isEncoding}
                        title={t('addFilesTitle')}
                    >
                        <i className="bi bi-plus-lg"></i>
                    </button>
                    <button
                        className="add-button clear-button"
                        onClick={onClearQueue}
                        disabled={isEncoding}
                        title={t('clearQueueTitle')}
                    >
                        <i className="bi bi-trash3"></i>
                    </button>
                </div>
                {addUrlError && <div className="list-url-error">{addUrlError}</div>}
            </div>

            <div
                className={`video-list-drop-zone ${isDraggingOnList ? 'dragging' : ''}`}
                onDragEnter={onListDragEnter}
                onDragLeave={onListDragLeave}
                onDragOver={onListDragOver}
                onDrop={onListDrop}
            >
                <div className={`video-list-scroll ${isDraggingOnList ? 'blurred' : ''}`}>
                    {videos.map(v => {
                        const isActive = ['encoding', 'downloading', 'converting'].includes(v.status)
                        return (
                        <div
                            key={v.id}
                            className={`video-item ${v.status} ${theme}${(v.customSettings || (v.isYtdlItem && v.conversionSettings)) ? ' has-custom-settings' : ''}`}
                            style={{
                                ...(v.downloadService ? {
                                    borderColor: `color-mix(in srgb, ${v.downloadService.color} 40%, transparent)`,
                                    background: `color-mix(in srgb, ${v.downloadService.color} 8%, transparent)`
                                } : {}),
                                ...(!isEncoding && !isActive ? { cursor: 'pointer' } : {})
                            }}
                            onClick={() => !isEncoding && !isActive && setEditingVideoId(v.id)}
                        >
                            <div className="video-thumbnail">
                                <img src={v.thumbnail} alt="Thumbnail" />
                                {isActive && (
                                    <div className="encoding-overlay">
                                        <div className="spinner"></div>
                                    </div>
                                )}
                            </div>
                            <div className="video-info">
                                <div className="video-title-row">
                                    {v.downloadService && (
                                        <span className="svc-icon-tag" style={{ color: v.downloadService.color }} title={v.downloadService.name}>
                                            {v.downloadService.svgPath
                                                ? <svg viewBox="0 0 24 24" fill="currentColor" className="svc-svg-icon"><path d={v.downloadService.svgPath} /></svg>
                                                : <i className={`bi ${v.downloadService.icon}`}></i>
                                            }
                                        </span>
                                    )}
                                    <div className="video-title">{v.title}</div>
                                    {(v.customSettings || (v.isYtdlItem && v.conversionSettings)) && (
                                        <span className="vtag custom-tag">
                                            <i className="bi bi-sliders2"></i>
                                            {t('indCustomTag')}
                                        </span>
                                    )}
                                    {!isEncoding && !isActive && (
                                        editingId === v.id
                                            ? <input
                                                className="output-name-input"
                                                value={editingValue}
                                                autoFocus
                                                onChange={e => setEditingValue(e.target.value)}
                                                onBlur={() => commitEdit(v.id)}
                                                onKeyDown={e => handleEditKeyDown(e, v.id)}
                                                onClick={e => e.stopPropagation()}
                                            />
                                            : <button
                                                className="rename-btn"
                                                onClick={e => { e.stopPropagation(); startEdit(v) }}
                                                title={t('renameFileTitle')}
                                            >
                                                <i className="bi bi-pencil"></i>
                                                <span>{v.outputName || v.title}</span>
                                            </button>
                                    )}
                                </div>
                                <div className="video-tags">
                                    {v.container && <span className="vtag fmt"><i className="bi bi-file-earmark-play"></i>{v.container}</span>}
                                    {v.resolution && <span className="vtag"><i className="bi bi-aspect-ratio"></i>{v.resolution}</span>}
                                    {v.videoCodec && <span className="vtag"><i className="bi bi-cpu"></i>{v.videoCodec}</span>}
                                    {v.fps && <span className="vtag"><i className="bi bi-camera-video"></i>{v.fps} fps</span>}
                                    {v.audioCodec && <span className="vtag audio"><i className="bi bi-music-note"></i>{v.audioCodec}</span>}
                                    {v.channels && <span className="vtag audio"><i className="bi bi-speaker"></i>{v.channels}</span>}
                                    {v.bitrate && <span className="vtag bitrate"><i className="bi bi-speedometer2"></i>{v.bitrate}</span>}
                                    {v.duration && <span className="vtag duration"><i className="bi bi-clock"></i>{v.duration}</span>}
                                </div>

                                {/* ── yt-dlp inline controls ── */}
                                {v.isYtdlItem && v.status !== 'done' && ((
                                    () => {
                                        const selFmt = (v.ytdlFormats || []).find(f => f.format_id === v.ytdlSelectedFormat)
                                        const fmtTags = selFmt ? buildFormatTags(selFmt) : []
                                        return (
                                            <div className="ytdl-controls">
                                                <div className="ytdl-format-row">
                                                    <i className="bi bi-cloud-arrow-down ytdl-icon"></i>
                                                    <span className="ytdl-label">{t('ytdlFormatLabel')}</span>
                                                    <span onClick={e => e.stopPropagation()}>
                                                        <GsSelect
                                                            className="ytdl-format-gs"
                                                            groups={buildYtdlFormatGroups(v.ytdlFormats, t)}
                                                            value={v.ytdlSelectedFormat || ''}
                                                            onChange={val => onYtdlFormatChange(v.id, val)}
                                                            disabled={isEncoding}
                                                            direction="down"
                                                        />
                                                    </span>
                                                    <span onClick={e => e.stopPropagation()}>
                                                        <VspToggle
                                                            value={!!v.convertAfterDownload}
                                                            onChange={val => onYtdlConvertToggle(v.id, val)}
                                                            disabled={isEncoding}
                                                        />
                                                    </span>
                                                    <span className="ytdl-label">{t('ytdlConvertLabel')}</span>
                                                </div>
                                                {fmtTags.length > 0 && (
                                                    <span className="ytdl-fmt-tags">
                                                        {fmtTags.map(t => (
                                                            <span key={t.key} className={`vtag transform-tag ${t.cls}`}>
                                                                <i className={`bi ${t.icon}`}></i>{t.label}
                                                            </span>
                                                        ))}
                                                    </span>
                                                )}
                                            </div>
                                        )
                                    }
                                )())}

                                {/* ── conversion transform tags (non-ytdl, or ytdl with convert) ── */}
                                {(!v.isYtdlItem || v.convertAfterDownload) && (() => {
                                    const effectiveSettings = v.isYtdlItem
                                        ? (v.conversionSettings || settings)
                                        : (v.customSettings || settings)
                                    const transformTags = getTransformTags(v, effectiveSettings, t)
                                    if (!transformTags.length) return null
                                    return (
                                        <div className="video-transform-tags">
                                            <span className="vtag-arrow"><i className="bi bi-arrow-down-short"></i></span>
                                            {transformTags.map(t => (
                                                <span key={t.key} className={`vtag transform-tag ${t.cls}`}>
                                                    <i className={`bi ${t.icon}`}></i>{t.label}
                                                </span>
                                            ))}
                                        </div>
                                    )
                                })()}
                                <div className="video-progress">
                                    <div className="progress-bar-bg">
                                        <div
                                            className={`progress-bar-fill${v.status === 'downloading' ? ' progress-bar-fill--download' : v.status === 'converting' ? ' progress-bar-fill--convert' : ''}`}
                                            style={{ width: `${v.progress}%` }}
                                        ></div>
                                    </div>
                                    <span className="progress-text">
                                        {v.status === 'downloading' ? `↓ ${v.progress.toFixed(1)}%` :
                                         v.status === 'converting' ? `⚙ ${v.progress.toFixed(1)}%` :
                                         `${v.progress.toFixed(1)}%`}
                                    </span>
                                </div>
                                {(v.status === 'encoding' || v.status === 'downloading' || v.status === 'converting') && v.startTime && (
                                    <div className="video-time-info">
                                        <span className="vtime elapsed">
                                            <i className="bi bi-clock-history"></i>
                                            {formatTime((tickNow - v.startTime) / 1000)}
                                        </span>
                                        {v.progress > 0.5 && (
                                            <span className="vtime remaining">
                                                <i className="bi bi-hourglass-split"></i>
                                                ~{formatTime((tickNow - v.startTime) / 1000 * (100 - v.progress) / v.progress)}
                                            </span>
                                        )}
                                    </div>
                                )}
                                {v.status === 'done' && v.startTime && v.endTime && (
                                    <div className="video-time-info done">
                                        <span className="vtime done">
                                            <i className="bi bi-check2-circle"></i>
                                            {formatTime((v.endTime - v.startTime) / 1000)}
                                        </span>
                                    </div>
                                )}
                                {v.status === 'error' && v.startTime && v.endTime && (
                                    <div className="video-time-info error">
                                        <span className="vtime error">
                                            <i className="bi bi-exclamation-circle"></i>
                                            {formatTime((v.endTime - v.startTime) / 1000)}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="video-size">
                                {v.status === 'done'
                                    ? <i className="bi bi-check-circle-fill success"></i>
                                    : v.status === 'error'
                                        ? <i className="bi bi-x-circle-fill error-icon"></i>
                                        : (() => {
                                        if (v.isYtdlItem) return null
                                        const effectiveSettings = v.customSettings || settings
                                        const estimated = v.status !== 'encoding'
                                            ? estimateOutputSize(v, effectiveSettings)
                                            : null
                                        const hasEst = !!estimated
                                        return (
                                            <div className={`size-display${hasEst ? ' has-estimate' : ''}`}>
                                                <span className="sv-source">{v.size}</span>
                                                <div className="sv-row">
                                                    <i className="bi bi-arrow-right sv-arrow"></i>
                                                    <span className="sv-estimated">{estimated || ''}</span>
                                                </div>
                                            </div>
                                        )
                                    })()
                                }
                                {v.status !== 'encoding' && v.status !== 'downloading' && v.status !== 'converting' && !isEncoding && (
                                    <button
                                        className="delete-video-btn"
                                        onClick={e => { e.stopPropagation(); onRemoveVideo(v.id) }}
                                    >
                                        <i className="bi bi-trash3"></i>
                                    </button>
                                )}
                            </div>
                        </div>
                        )
                    })}
                </div>
                {isDraggingOnList && (
                    <div className="list-drop-overlay">
                        <div className="list-drop-inner">
                            <i className="bi bi-plus-circle"></i>
                            <span>{t('addToQueueLabel')}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="list-bottom-panel">
                {/* Header adapts to content type */}
                <div className="list-bottom-header">
                    <span className="list-bottom-title">
                        {hasOnlyDownloads
                            ? t('downloadSettings')
                            : hasDownloads
                                ? t('globalConvSettings')
                                : t('globalConvSettings')}
                    </span>
                </div>

                {/* Global conversion settings — always visible; dimmed when no video is set for conversion */}
                <div className={`gs-section${!globalSettingsActive ? ' gs-section--dimmed' : ''}`}>
                    <GlobalSettings
                        settings={settings}
                        onChange={onSettingsChange}
                        videos={videos.filter(v => !v.isYtdlItem)}
                        disabled={isEncoding || !globalSettingsActive}
                        gpuVendor={gpuVendor}
                    />
                </div>

                {/* Notice when mixed queue */}
                {hasRegular && hasDownloads && (
                    <div className="ytdl-global-notice">
                        <i className="bi bi-info-circle-fill"></i>
                        {videos.filter(v => v.isYtdlItem).length} {t('mixedQueueNotice')}
                    </div>
                )}

                <div className="list-bottom-actions">
                    <div className="list-output-section">
                        <div className="list-output-top">
                            <span className="list-output-label">
                                {hasOnlyDownloads ? t('downloadFolder') : t('saveFolder')}
                            </span>
                            {!hasOnlyDownloads && (
                                <GsSelect
                                    value={outputMode}
                                    options={[
                                        { value: 'default', label: t('outputDefault') },
                                        { value: 'custom',  label: t('outputCustom') },
                                        { value: 'source',  label: t('outputSource') },
                                    ]}
                                    onChange={onOutputModeChange}
                                    disabled={isEncoding}
                                    className="list-output-mode-dropdown"
                                />
                            )}
                        </div>
                        <div className="list-output-path-row">
                            <div className="list-output-path-display">
                                {outputMode === 'custom'
                                    ? (customOutputDir || t('downloadsFolderDefault'))
                                    : outputMode === 'source'
                                        ? t('outputSourcePath')
                                        : (defaultOutputDir || t('downloadsFolderDefault'))}
                            </div>
                            <button
                                className="list-folder-btn"
                                onClick={() => onOutputModeChange('custom')}
                                disabled={isEncoding}
                                title="Выбрать папку"
                            >
                                <i className="bi bi-folder2-open"></i>
                            </button>
                        </div>
                    </div>

                    <button
                        className="start-button"
                        onClick={onStartEncoding}
                        disabled={isEncoding}
                        style={isEncoding ? { display: 'none' } : {}}
                    >
                        {startBtnLabel}
                        <i className="bi bi-arrow-right"></i>
                    </button>
                    {isEncoding && (
                        <button
                            className="stop-button"
                            onClick={onStop}
                        >
                            СТОП
                            <i className="bi bi-stop-fill"></i>
                        </button>
                    )}
                </div>

                <div className="list-bottom-status">
                    <span>
                        {hasDownloads && (
                            <><i className="bi bi-cloud-arrow-down"></i>&nbsp;<b>{videos.filter(v => v.isYtdlItem).length}</b>&nbsp;{t('countDownloads')}</>
                        )}
                        {hasDownloads && hasRegular && <>&nbsp;&nbsp;·&nbsp;&nbsp;</>}
                        {hasRegular && globalCount > 0 && (
                            <><i className="bi bi-globe2"></i>&nbsp;<b>{globalCount}</b>&nbsp;{globalCount === 1 ? t('countInQueue1') : globalCount < 5 ? t('countInQueue234') : t('countInQueueMany')} {t('countByGlobal')}</>
                        )}
                        {hasRegular && globalCount > 0 && customCount > 0 && <>&nbsp;&nbsp;·&nbsp;&nbsp;</>}
                        {hasRegular && customCount > 0 && (
                            <><i className="bi bi-sliders2"></i>&nbsp;<b>{customCount}</b>&nbsp;{customCount === 1 ? t('countInQueue1') : customCount < 5 ? t('countInQueue234') : t('countInQueueMany')} {t('countByCustom')}</>
                        )}
                        {videos.some(v => v.status === 'done') && (
                            <>&nbsp;&nbsp;·&nbsp;&nbsp;{videos.filter(v => v.status === 'done').length} {t('countDone')}</>
                        )}
                        {isEncoding && encodingStartTime && (() => {
                            const elapsed = (tickNow - encodingStartTime) / 1000
                            const encVideos = videos.filter(v => v.status === 'encoding' && v.startTime && v.progress > 0.5)
                            const eta = encVideos.length
                                ? encVideos.reduce((max, v) => {
                                    const ve = (tickNow - v.startTime) / 1000
                                    return Math.max(max, ve * (100 - v.progress) / v.progress)
                                }, 0)
                                : null
                            return (
                                <span className="global-time-info">
                                    &nbsp;&nbsp;·&nbsp;&nbsp;
                                    <i className="bi bi-clock-history"></i>&nbsp;{formatTime(elapsed)}
                                    {eta !== null && <>&nbsp;&nbsp;<i className="bi bi-hourglass-split"></i>&nbsp;~{formatTime(eta)}</>}
                                </span>
                            )
                        })()}
                    </span>
                    <span>{videos.length} {videos.length === 1 ? t('countInQueue1') : videos.length < 5 ? t('countInQueue234') : t('countInQueueMany')}</span>
                </div>
            </div>

            {editingVideo && (
                <VideoSettingsPanel
                    video={editingVideo}
                    globalSettings={settings}
                    onClose={() => setEditingVideoId(null)}
                    onSave={editingVideo.isYtdlItem ? onYtdlConversionSettings : onVideoSettingsChange}
                    onReset={(id) => editingVideo.isYtdlItem ? onYtdlConversionSettings(id, null) : onVideoSettingsChange(id, null)}
                    onYtdlFormatChange={onYtdlFormatChange}
                    onYtdlConvertToggle={onYtdlConvertToggle}
                    onYtdlClipChange={onYtdlClipChange}
                />
            )}
        </div>
    )
}

export default ListPage
