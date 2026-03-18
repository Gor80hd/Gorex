// ─── Gorex Extension Popup ────────────────────────────────────────────────────

const SERVICE_MAP = {
    'youtube.com':     { name: 'YouTube',     color: '#ff0000' },
    'youtu.be':        { name: 'YouTube',     color: '#ff0000' },
    'twitter.com':     { name: 'Twitter / X', color: '#1d9bf0' },
    'x.com':           { name: 'Twitter / X', color: '#1d9bf0' },
    't.co':            { name: 'Twitter / X', color: '#1d9bf0' },
    'instagram.com':   { name: 'Instagram',   color: '#e1306c' },
    'ddinstagram.com': { name: 'Instagram',   color: '#e1306c' },
    'reddit.com':      { name: 'Reddit',      color: '#ff4500' },
    'redd.it':         { name: 'Reddit',      color: '#ff4500' },
    'vimeo.com':       { name: 'Vimeo',       color: '#1ab7ea' },
    'soundcloud.com':  { name: 'SoundCloud',  color: '#ff5500' },
    'twitch.tv':       { name: 'Twitch',      color: '#9146ff' },
    'facebook.com':    { name: 'Facebook',    color: '#1877f2' },
    'fb.watch':        { name: 'Facebook',    color: '#1877f2' },
    'pinterest.com':   { name: 'Pinterest',   color: '#e60023' },
    'pin.it':          { name: 'Pinterest',   color: '#e60023' },
    'tumblr.com':      { name: 'Tumblr',      color: '#35465c' },
    'snapchat.com':    { name: 'Snapchat',    color: '#fcfc00' },
    'tiktok.com':      { name: 'TikTok',      color: '#ff0050' },
    'bilibili.com':    { name: 'Bilibili',    color: '#00a1d6' },
    'b23.tv':          { name: 'Bilibili',    color: '#00a1d6' },
    'ok.ru':           { name: 'OK',          color: '#f7931e' },
    'vk.com':          { name: 'VKontakte',   color: '#4a76a8' },
    'vk.ru':           { name: 'VKontakte',   color: '#4a76a8' },
    'vkvideo.ru':      { name: 'VK Видео',    color: '#4a76a8' },
    'rutube.ru':       { name: 'Rutube',      color: '#ff5c00' },
    'dailymotion.com': { name: 'Dailymotion', color: '#0066dc' },
    'bsky.app':        { name: 'Bluesky',     color: '#0085ff' },
    'loom.com':        { name: 'Loom',        color: '#625df5' },
    'streamable.com':  { name: 'Streamable',  color: '#41b883' },
    'newgrounds.com':  { name: 'Newgrounds',  color: '#f6a623' },
}

// ── State ──────────────────────────────────────────────────────────────────────
let currentUrl        = ''
let currentFormats    = []
let selectedFormatId  = null
let appOnline         = false
let queuePollTimer    = null
let formatsLoaded     = false
let selectedAudioFmt  = 'mp3'
let selectedAudioKbps = '192'

const $ = id => document.getElementById(id)

// ── Init ───────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    currentUrl = tab?.url || ''
    renderUrlBar(currentUrl)

    // Copy URL
    $('url-copy-btn').addEventListener('click', () => {
        navigator.clipboard.writeText(currentUrl).then(() => {
            const btn = $('url-copy-btn')
            btn.style.color = '#22c55e'
            setTimeout(() => { btn.style.color = '' }, 1200)
        })
    })

    // Trim toggle
    $('trim-enable-cb').addEventListener('change', () => {
        $('trim-controls').classList.toggle('hidden', !$('trim-enable-cb').checked)
    })

    // Audio format chips
    $('audio-format-chips').querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            $('audio-format-chips').querySelectorAll('.chip').forEach(c => c.classList.remove('selected'))
            chip.classList.add('selected')
            selectedAudioFmt = chip.dataset.val
            const badge = $('audio-badge')
            badge.textContent = chip.dataset.val.toUpperCase()
            badge.classList.remove('hidden')
        })
    })

    // Audio bitrate chips
    $('audio-quality-chips').querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            $('audio-quality-chips').querySelectorAll('.chip').forEach(c => c.classList.remove('selected'))
            chip.classList.add('selected')
            selectedAudioKbps = chip.dataset.val
        })
    })

    await checkAppStatus()
    startQueuePoll()
})

// ── URL bar ────────────────────────────────────────────────────────────────────
function renderUrlBar(url) {
    $('url-display').textContent = url || 'Нет URL'
    if (!url) return

    let host = ''
    try { host = new URL(url).hostname.replace(/^www\./, '') } catch { return }

    const svc = SERVICE_MAP[host]
    $('service-name').textContent = svc ? svc.name : ''
    $('service-name').classList.toggle('hidden', !svc)

    const icon = $('service-icon')
    icon.src = `https://icons.duckduckgo.com/ip3/${host}.ico`
    icon.style.display = 'inline'
    icon.onerror = () => { icon.style.display = 'none' }

    $('unsupported-hint').classList.toggle('hidden', !!svc)
}

// ── App status ─────────────────────────────────────────────────────────────────
async function checkAppStatus() {
    const resp = await bgMessage({ type: 'GOREX_PING' })
    appOnline = resp?.online === true

    if (appOnline) {
        $('status-dot').className = 'status-dot online'
        $('status-text').textContent = 'Активен'
        $('offline-banner').classList.add('hidden')
        $('video-tab').disabled = false
        $('audio-tab').disabled = false
    } else {
        $('status-dot').className = 'status-dot offline'
        $('status-text').textContent = 'Не запущен'
        $('offline-banner').classList.remove('hidden')
        $('video-tab').disabled = true
        $('audio-tab').disabled = true
    }
}

// ── Panel toggle ───────────────────────────────────────────────────────────────
function togglePanel(name) {
    const tab        = $(`${name}-tab`)
    const panel      = $(`${name}-panel`)
    const otherName  = name === 'video' ? 'audio' : 'video'
    const otherTab   = $(`${otherName}-tab`)
    const otherPanel = $(`${otherName}-panel`)
    const isOpen     = panel.classList.contains('open')

    // Close the other panel
    otherTab.classList.remove('active')
    otherPanel.classList.remove('open')

    if (isOpen) {
        tab.classList.remove('active')
        panel.classList.remove('open')
    } else {
        tab.classList.add('active')
        panel.classList.add('open')
        // Auto-load formats on first video panel open
        if (name === 'video' && !formatsLoaded) {
            loadFormats()
        }
    }
}

// ── Load formats ───────────────────────────────────────────────────────────────
async function loadFormats() {
    if (!appOnline || !currentUrl) return

    $('formats-loading').classList.remove('hidden')
    $('format-options').classList.add('hidden')
    $('action-buttons').classList.add('hidden')
    $('quick-buttons').classList.add('hidden')
    $('error-msg').classList.add('hidden')

    const resp = await bgMessage({ type: 'GOREX_GET_FORMATS', url: currentUrl })
    $('formats-loading').classList.add('hidden')

    if (!resp?.ok) {
        showError(resp?.error || 'Не удалось получить форматы')
        $('quick-buttons').classList.remove('hidden')
        return
    }

    const data = resp.data
    currentFormats = data.formats || []
    formatsLoaded  = true

    // Thumbnail preview
    if (data.thumbnailUrl) {
        $('thumb-img').src = data.thumbnailUrl
        $('thumb-title').textContent = data.title || ''
        if (data.duration) {
            $('thumb-duration').textContent = formatDuration(data.duration)
            $('thumb-duration').classList.remove('hidden')
        }
        $('thumb-preview').classList.remove('hidden')
    }

    // Build quality chips (deduplicated by height)
    const heights = new Map()
    for (const f of currentFormats) {
        if (!f.height) continue
        const ex = heights.get(f.height)
        if (!ex || (f.tbr || 0) > (ex.tbr || 0)) heights.set(f.height, f)
    }
    const sorted = [...heights.entries()].sort((a, b) => b[0] - a[0])
    const items = [
        { label: 'Лучшее', formatId: 'best' },
        ...sorted.map(([h, f]) => ({ label: h + 'p', formatId: f.format_id })),
    ]

    const grid = $('quality-grid')
    grid.innerHTML = ''
    items.forEach((item, i) => {
        const chip = document.createElement('button')
        chip.className = 'chip' + (i === 0 ? ' selected' : '')
        chip.textContent = item.label
        chip.dataset.formatId = item.formatId
        chip.addEventListener('click', () => {
            grid.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'))
            chip.classList.add('selected')
            selectedFormatId = item.formatId === 'best' ? null : item.formatId
            const badge = $('video-badge')
            badge.textContent = item.label
            badge.classList.remove('hidden')
        })
        grid.appendChild(chip)
    })
    selectedFormatId = null

    // Update video tab badge
    $('video-badge').textContent = 'Лучшее'
    $('video-badge').classList.remove('hidden')

    $('format-options').classList.remove('hidden')
    $('action-buttons').classList.remove('hidden')
}

// ── Download actions ───────────────────────────────────────────────────────────
async function quickDownload()      { await doSend({ quality: 'best',  audioOnly: false }) }
async function addToQueue()         { await doSend({ queue: true,       audioOnly: false }) }
async function downloadNow()        { await doSend({ queue: false,      audioOnly: false }) }
async function addToQueueAudio()    { await doSend({ queue: true,       audioOnly: true  }) }
async function downloadNowAudio()   { await doSend({ queue: false,      audioOnly: true  }) }

async function doSend(extra = {}) {
    $('error-msg').classList.add('hidden')
    $('success-msg').classList.add('hidden')

    const audioOnly         = extra.audioOnly === true
    const thumbnailDownload = !audioOnly && $('thumbnail-cb').checked
    const trimEnabled       = !audioOnly && $('trim-enable-cb').checked

    let clipStart = null, clipEnd = null
    if (trimEnabled) {
        clipStart = parseTime($('trim-start').value)
        clipEnd   = parseTime($('trim-end').value)
    }

    const payload = {
        url:               currentUrl,
        formatId:          audioOnly ? null : (selectedFormatId || null),
        audioOnly,
        audioFormat:       audioOnly ? selectedAudioFmt  : undefined,
        audioBitrate:      audioOnly ? selectedAudioKbps : undefined,
        clipStart,
        clipEnd,
        downloadThumbnail: thumbnailDownload,
        ...extra,
    }

    const btns = audioOnly
        ? [$('audio-queue-btn'),  $('audio-dl-btn')]
        : [$('add-queue-btn'),    $('download-now-btn'), $('quick-download-btn')]
    btns.forEach(b => b && (b.disabled = true))

    const resp = await bgMessage({ type: 'GOREX_ADD_TO_QUEUE', payload })
    btns.forEach(b => b && (b.disabled = false))

    if (resp?.ok) {
        $('success-msg').classList.remove('hidden')
        setTimeout(() => $('success-msg').classList.add('hidden'), 3000)
        refreshQueue()
    } else {
        const errMsg = resp?.error === 'APP_OFFLINE'
            ? 'Приложение Gorex не запущено'
            : (resp?.error || 'Неизвестная ошибка')
        showError(errMsg)
    }
}

// ── Queue ──────────────────────────────────────────────────────────────────────
async function refreshQueue() {
    const resp = await bgMessage({ type: 'GOREX_GET_QUEUE' })
    if (!resp?.ok) return
    renderQueue(resp.data?.queue || [])
}

function renderQueue(queue) {
    if (!queue.length) {
        $('queue-section').classList.add('hidden')
        return
    }
    $('queue-section').classList.remove('hidden')
    const list = $('queue-list')
    list.innerHTML = ''
    queue.forEach(item => {
        const el = document.createElement('div')
        el.className = 'queue-item'
        const statusLabel = {
            ready:            'Готов',
            format_select:    'Выбор',
            downloading:      `${item.progress || 0}%`,
            downloading_subs: 'Субт.',
            converting:       `${item.progress || 0}%`,
            encoding:         `${item.progress || 0}%`,
            done:             '✓',
            error:            'Ошибка',
        }[item.status] || item.status

        el.innerHTML = `
            <div class="queue-item-title" title="${escapeHtml(item.title || item.url || '')}">${escapeHtml(item.title || item.url || 'Без названия')}</div>
            <span class="queue-status ${item.status}">${escapeHtml(statusLabel)}</span>
        `
        list.appendChild(el)
    })
}

function startQueuePoll() {
    if (queuePollTimer) clearInterval(queuePollTimer)
    refreshQueue()
    queuePollTimer = setInterval(refreshQueue, 3000)
}

// ── Open app ───────────────────────────────────────────────────────────────────
function openGorex()    { chrome.tabs.create({ url: 'gorex://open' }) }
function openGorexApp() { chrome.tabs.create({ url: 'gorex://open' }) }

// ── Helpers ────────────────────────────────────────────────────────────────────
function bgMessage(msg) {
    return new Promise(resolve => {
        try { chrome.runtime.sendMessage(msg, resolve) }
        catch { resolve(null) }
    })
}

function showError(msg) {
    const el = $('error-msg')
    el.textContent = msg
    el.classList.remove('hidden')
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

function formatDuration(secs) {
    if (!secs) return ''
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = Math.floor(secs % 60)
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${m}:${String(s).padStart(2, '0')}`
}

function parseTime(str) {
    if (!str || !str.trim()) return null
    const parts = str.trim().split(':').map(Number)
    if (parts.some(isNaN)) return null
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
    if (parts.length === 2) return parts[0] * 60 + parts[1]
    if (parts.length === 1) return parts[0]
    return null
}
