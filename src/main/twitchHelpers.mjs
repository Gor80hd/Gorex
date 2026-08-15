const TWITCH_RESERVED_PATHS = new Set([
    'about',
    'activate',
    'bits',
    'clips',
    'clip',
    'collections',
    'directory',
    'downloads',
    'drops',
    'embed',
    'inventory',
    'jobs',
    'login',
    'p',
    'popout',
    'products',
    'search',
    'settings',
    'signup',
    'subscriptions',
    'turbo',
    'videos',
    'wallet',
])

const TWITCH_CHANNEL_RE = /^[a-zA-Z0-9_]{3,25}$/

export function normalizeTwitchVersion(version) {
    const text = String(version || '')
        .trim()
        .replace(/^TwitchDownloader(?:CLI)?\s*/i, '')
        .replace(/^v/i, '')
        .trim()
    const match = text.match(/\d+(?:\.\d+)+(?:[-+][0-9A-Za-z.-]+)?/)
    return match ? match[0].split('+')[0] : ''
}

export function compareTwitchVersions(a, b) {
    const left = normalizeTwitchVersion(a).match(/\d+/g)?.map(Number) || []
    const right = normalizeTwitchVersion(b).match(/\d+/g)?.map(Number) || []
    const max = Math.max(left.length, right.length)

    for (let i = 0; i < max; i += 1) {
        const av = left[i] || 0
        const bv = right[i] || 0
        if (av > bv) return 1
        if (av < bv) return -1
    }
    return 0
}

export function isTwitchUpdateAvailable(currentVersion, latestVersion) {
    if (!currentVersion || !latestVersion) return false
    return compareTwitchVersions(latestVersion, currentVersion) > 0
}

function cleanHost(hostname) {
    return String(hostname || '').toLowerCase().replace(/^www\./, '').replace(/^m\./, '')
}

function cleanPathSegments(pathname) {
    return String(pathname || '')
        .split('/')
        .map(segment => decodeURIComponent(segment).trim())
        .filter(Boolean)
}

function normalizeTwitchUrl(url) {
    const u = new URL(url)
    u.hash = ''
    return u.toString()
}

function isValidChannelName(channel) {
    const clean = String(channel || '').trim()
    return TWITCH_CHANNEL_RE.test(clean) && !TWITCH_RESERVED_PATHS.has(clean.toLowerCase())
}

export function parseTwitchUrl(raw) {
    if (!raw || typeof raw !== 'string') {
        return { ok: false, type: 'unknown', reason: 'empty' }
    }

    let url
    try {
        url = new URL(raw.trim())
    } catch {
        return { ok: false, type: 'unknown', reason: 'invalid-url' }
    }

    const host = cleanHost(url.hostname)
    const segments = cleanPathSegments(url.pathname)

    if (host === 'clips.twitch.tv') {
        const slug = segments[0]
        if (!slug) return { ok: false, type: 'unknown', reason: 'missing-clip-id' }
        return {
            ok: true,
            type: 'clip',
            id: slug,
            slug,
            sourceUrl: normalizeTwitchUrl(url),
        }
    }

    if (host !== 'twitch.tv') {
        return { ok: false, type: 'unknown', reason: 'not-twitch' }
    }

    if (segments[0] === 'videos' && /^\d+$/.test(segments[1] || '')) {
        return {
            ok: true,
            type: 'vod',
            id: segments[1],
            sourceUrl: normalizeTwitchUrl(url),
        }
    }

    if (segments[0] === 'clip' && segments[1]) {
        return {
            ok: true,
            type: 'clip',
            id: segments[1],
            slug: segments[1],
            sourceUrl: normalizeTwitchUrl(url),
        }
    }

    if (isValidChannelName(segments[0]) && segments[1] === 'clip' && segments[2]) {
        return {
            ok: true,
            type: 'clip',
            id: segments[2],
            slug: segments[2],
            channel: segments[0],
            sourceUrl: normalizeTwitchUrl(url),
        }
    }

    if (isValidChannelName(segments[0])) {
        return {
            ok: true,
            type: 'channel',
            id: segments[0],
            channel: segments[0],
            sourceUrl: `https://www.twitch.tv/${segments[0]}`,
        }
    }

    return { ok: false, type: 'unknown', reason: 'unsupported-twitch-url' }
}

export function getTwitchCliModeForType(type) {
    if (type === 'vod') return 'videodownload'
    if (type === 'clip') return 'clipdownload'
    return null
}

const DEFAULT_TWITCH_QUALITY_OPTIONS = [
    { value: 'Source', label: 'Source', height: 0, fps: 0, source: true },
    { value: '1080p60', label: '1080p60', height: 1080, fps: 60 },
    { value: '1080p', label: '1080p', height: 1080, fps: 30 },
    { value: '720p60', label: '720p60', height: 720, fps: 60 },
    { value: '720p', label: '720p', height: 720, fps: 30 },
    { value: '480p', label: '480p', height: 480, fps: 30 },
    { value: '360p', label: '360p', height: 360, fps: 30 },
    { value: '160p', label: '160p', height: 160, fps: 30 },
]

function cloneQualityOption(option) {
    return { ...option }
}

export function getDefaultTwitchQualityOptions() {
    return DEFAULT_TWITCH_QUALITY_OPTIONS.map(cloneQualityOption)
}

function parseM3u8Attributes(line) {
    const attrs = {}
    const text = String(line || '')
    const re = /([A-Z0-9-]+)=((?:"[^"]+")|[^,]+)/gi
    let match
    while ((match = re.exec(text))) {
        attrs[match[1].toUpperCase()] = String(match[2] || '').replace(/^"|"$/g, '')
    }
    return attrs
}

function qualityFromStreamInfo(infoLine, urlLine = '') {
    const attrs = parseM3u8Attributes(infoLine)
    const resolution = attrs.RESOLUTION || ''
    const [width, height] = resolution.split('x').map(part => Number(part) || 0)
    const fps = Math.round(Number(attrs['FRAME-RATE'] || 0) || 0)
    const lower = `${attrs.NAME || ''} ${attrs.VIDEO || ''} ${attrs['GROUP-ID'] || ''} ${urlLine || ''}`.toLowerCase()

    if (lower.includes('audio_only')) return null
    if (lower.includes('chunked') || lower.includes('source')) {
        return { value: 'Source', label: height ? `Source (${height}p${fps >= 50 ? fps : ''})` : 'Source', width, height, fps, source: true }
    }
    if (!height) return null

    const value = `${height}p${fps >= 50 ? fps : ''}`
    return { value, label: value, width, height, fps, source: false }
}

export function parseTwitchM3u8QualityOptions(output) {
    const lines = String(output || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean)
    const byValue = new Map()

    for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i]
        if (!line.startsWith('#EXT-X-STREAM-INF')) continue
        const option = qualityFromStreamInfo(line, lines[i + 1] || '')
        if (!option) continue
        const existing = byValue.get(option.value)
        if (!existing || (option.height || 0) > (existing.height || 0) || (option.fps || 0) > (existing.fps || 0)) {
            byValue.set(option.value, option)
        }
    }

    const parsed = [...byValue.values()]
    if (!parsed.length) return []

    const source = parsed.find(option => option.source) || { value: 'Source', label: 'Source', height: 0, fps: 0, source: true }
    const rest = parsed
        .filter(option => option.value !== source.value)
        .sort((a, b) => (b.height || 0) - (a.height || 0) || (b.fps || 0) - (a.fps || 0))
    return [source, ...rest]
}

export function mergeTwitchQualityOptions(options) {
    const clean = Array.isArray(options) ? options.filter(option => option?.value && option?.label) : []
    return clean.length ? clean.map(cloneQualityOption) : getDefaultTwitchQualityOptions()
}

export function sanitizeTwitchOutputName(name, fallback = 'twitch_video') {
    return String(name || fallback)
        .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
        .replace(/\.+$/, '')
        .trim() || fallback
}

function assetPlatformNeedles(platform) {
    if (platform === 'win32') return ['windows', 'win32']
    if (platform === 'darwin') return ['macos', 'darwin', 'osx']
    return ['linux']
}

function assetArchNeedles(arch) {
    if (arch === 'arm64') return ['arm64', 'aarch64']
    if (arch === 'arm') return ['arm']
    return ['x64', 'x86_64', 'amd64']
}

export function selectTwitchDownloaderAsset(release, platform = process.platform, arch = process.arch) {
    const assets = Array.isArray(release?.assets) ? release.assets : []
    const platformNeedles = assetPlatformNeedles(platform)
    const archNeedles = assetArchNeedles(arch)

    const isCliZip = (asset) => {
        const name = String(asset?.name || '').toLowerCase()
        return name.includes('twitchdownloadercli') && name.endsWith('.zip')
    }

    const scored = assets
        .filter(asset => {
            if (!isCliZip(asset)) return false
            const name = String(asset.name || '').toLowerCase()
            return platformNeedles.some(needle => name.includes(needle))
        })
        .map(asset => {
            const name = String(asset.name || '').toLowerCase()
            let score = 0
            if (platformNeedles.some(needle => name.includes(needle))) score += 20
            if (archNeedles.some(needle => name.includes(needle))) score += 10
            if (!name.includes('wpf') && !name.includes('gui')) score += 4
            if (name.includes('self-contained') || name.includes('portable')) score += 2
            return { asset, score }
        })
        .sort((a, b) => b.score - a.score)

    return scored[0]?.asset || null
}

export function summarizeTwitchRelease(release, platform = process.platform, arch = process.arch) {
    const asset = selectTwitchDownloaderAsset(release, platform, arch)
    const latestVersion = normalizeTwitchVersion(release?.tag_name || release?.name || '')
    return {
        latestVersion,
        releaseName: release?.name || release?.tag_name || '',
        publishedAt: release?.published_at || '',
        releaseUrl: release?.html_url || 'https://github.com/lay295/TwitchDownloader/releases/latest',
        downloadUrl: asset?.browser_download_url || '',
        assetName: asset?.name || '',
        body: release?.body || '',
    }
}

export function parseTwitchInfoOutput(output) {
    const text = String(output || '').trim()
    if (!text) return {}

    try {
        const parsed = JSON.parse(text)
        if (parsed && typeof parsed === 'object') return parsed
    } catch {}

    const info = {}
    for (const line of text.split(/\r?\n/)) {
        const clean = line.trim()
        if (!clean) continue
        const match = clean.match(/^([^:=|]+?)\s*(?::=|:|\|)\s*(.+)$/)
        if (!match) continue
        const key = match[1].trim().toLowerCase().replace(/\s+/g, '_')
        const value = match[2].trim()
        if (key && value && !info[key]) info[key] = value
    }
    return info
}

function firstValue(obj, keys) {
    for (const key of keys) {
        const value = obj?.[key]
        if (value != null && value !== '') return value
    }
    return null
}

function secondsToDuration(seconds) {
    const sec = Math.max(0, Math.round(Number(seconds) || 0))
    if (!sec) return ''
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = sec % 60
    return h > 0
        ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
        : `${m}:${String(s).padStart(2, '0')}`
}

export function normalizeTwitchVideoInfo(info, fallback = {}) {
    const raw = info && typeof info === 'object' ? info : {}
    const id = String(firstValue(raw, ['id', 'video_id', 'vod_id', 'slug']) || fallback.id || '')
    const title = String(firstValue(raw, ['title', 'name']) || fallback.title || (fallback.type === 'clip' ? 'Twitch Clip' : 'Twitch VOD'))
    const durationSeconds = Number(firstValue(raw, ['durationSeconds', 'duration_seconds', 'length_seconds', 'duration']) || fallback.durationSeconds || 0) || 0
    const qualityOptions = mergeTwitchQualityOptions(raw.qualityOptions || raw.qualities || fallback.qualityOptions)
    const sourceQuality = qualityOptions.find(option => option.source) || qualityOptions[0]
    const bestQuality = qualityOptions.find(option => !option.source && option.height) || sourceQuality
    return {
        id,
        type: fallback.type || raw.type || 'vod',
        title,
        channel: String(firstValue(raw, ['channel', 'channel_name', 'streamer', 'creator_name', 'user_name', 'displayName', 'display_name']) || fallback.channel || ''),
        thumbnail: firstValue(raw, ['thumbnail', 'thumbnail_url', 'thumbnailURL', 'preview_image_url', 'previewThumbnailURL']) || fallback.thumbnail || '',
        createdAt: firstValue(raw, ['created_at', 'createdAt', 'published_at', 'publishedAt']) || fallback.createdAt || '',
        durationSeconds,
        duration: secondsToDuration(durationSeconds) || String(firstValue(raw, ['duration_text', 'length']) || fallback.duration || ''),
        url: fallback.url || raw.url || '',
        qualityOptions,
        twitchQuality: raw.twitchQuality || fallback.twitchQuality || sourceQuality?.value || 'Source',
        resolution: raw.resolution || fallback.resolution || bestQuality?.label || '',
        videoResolution: raw.videoResolution || fallback.videoResolution || (bestQuality?.width && bestQuality?.height ? String(bestQuality.width) + 'x' + String(bestQuality.height) : ''),
    }
}

function textFromFragments(fragments) {
    if (!Array.isArray(fragments)) return ''
    return fragments
        .map(fragment => fragment?.text || fragment?.body || fragment?.emote?.name || '')
        .join('')
}

export function parseTwitchChatMessages(jsonText) {
    const data = typeof jsonText === 'string' ? JSON.parse(jsonText) : jsonText
    const comments = Array.isArray(data) ? data : (Array.isArray(data?.comments) ? data.comments : [])

    return comments.map((comment, index) => {
        const message = comment?.message || {}
        const body = message.body || message.text || textFromFragments(message.fragments)
        const username = comment?.commenter?.display_name
            || comment?.commenter?.name
            || comment?.user_name
            || comment?.username
            || ''
        const offsetSeconds = Number(comment?.content_offset_seconds ?? comment?.offset_seconds ?? comment?.time ?? 0) || 0
        return {
            id: comment?._id || comment?.id || `${index}`,
            offsetSeconds,
            timeLabel: secondsToDuration(offsetSeconds) || '0:00',
            username,
            body: String(body || '').trim(),
            createdAt: comment?.created_at || comment?.createdAt || '',
        }
    }).filter(message => message.body)
}

export function formatTwitchChatText(messages) {
    return (Array.isArray(messages) ? messages : [])
        .map(message => `[${message.timeLabel || secondsToDuration(message.offsetSeconds)}] ${message.username || 'unknown'}: ${message.body}`)
        .join('\n')
}
