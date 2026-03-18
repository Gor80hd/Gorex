// ─── Gorex Extension Background Service Worker ────────────────────────────────
// Manages connection to the Gorex desktop app (http://127.0.0.1:19870+),
// handles context menus, badge updates, and message routing.

const API_PORTS = [19870, 19871, 19872, 19873, 19874, 19875]
let gorexPort = null   // cached working port

// ── API helpers ──────────────────────────────────────────────────────────────

async function findApiPort() {
    // Try cached port first
    if (gorexPort !== null) {
        try {
            const r = await fetch(`http://127.0.0.1:${gorexPort}/gorex-api/ping`, { signal: AbortSignal.timeout(1500) })
            if (r.ok) return gorexPort
        } catch {}
        gorexPort = null
    }
    // Scan all ports in parallel — resolves as soon as one responds
    const results = await Promise.all(
        API_PORTS.map(port =>
            fetch(`http://127.0.0.1:${port}/gorex-api/ping`, { signal: AbortSignal.timeout(1500) })
                .then(r => r.ok ? port : null)
                .catch(() => null)
        )
    )
    const found = results.find(p => p !== null) ?? null
    if (found !== null) { gorexPort = found; return found }
    return null
}

async function apiGet(path) {
    const port = await findApiPort()
    if (!port) throw new Error('APP_OFFLINE')
    const r = await fetch(`http://127.0.0.1:${port}${path}`, { signal: AbortSignal.timeout(20000) })
    if (!r.ok) throw new Error(await r.text())
    return r.json()
}

async function apiPost(path, body) {
    const port = await findApiPort()
    if (!port) throw new Error('APP_OFFLINE')
    const r = await fetch(`http://127.0.0.1:${port}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000),
    })
    if (!r.ok) throw new Error(await r.text())
    return r.json()
}

// ── Context menu ─────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'gorex-download',
        title: 'Скачать через Gorex',
        contexts: ['page', 'link', 'video'],
    })
    chrome.contextMenus.create({
        id: 'gorex-download-audio',
        title: 'Скачать аудио через Gorex',
        contexts: ['page', 'link', 'video'],
    })
})

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    const url = info.linkUrl || info.srcUrl || info.pageUrl || tab?.url
    if (!url) return
    const audioOnly = info.menuItemId === 'gorex-download-audio'
    await quickAddToQueue(url, { audioOnly }, tab)
})

// ── Quick add to queue ────────────────────────────────────────────────────────

async function quickAddToQueue(url, opts = {}, tab = null) {
    try {
        await apiPost('/gorex-api/queue/add', { url, ...opts })
        // Notify content script in the active tab
        if (tab?.id) {
            chrome.tabs.sendMessage(tab.id, {
                type: 'GOREX_QUEUED',
                url,
                title: tab.title || url,
            }).catch(() => {})
        }
        updateBadge(true)
    } catch (e) {
        if (e.message === 'APP_OFFLINE') {
            updateBadge(false)
            chrome.notifications.create('gorex-offline', {
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'Gorex не запущен',
                message: 'Запустите приложение Gorex, затем попробуйте снова.',
            })
        }
    }
}

// ── Badge helpers ─────────────────────────────────────────────────────────────

function updateBadge(appOnline) {
    if (appOnline) {
        chrome.action.setBadgeText({ text: '' })
        chrome.action.setBadgeBackgroundColor({ color: '#7c3aed' })
    } else {
        chrome.action.setBadgeText({ text: '!' })
        chrome.action.setBadgeBackgroundColor({ color: '#ef4444' })
    }
}

// ── Queue polling (for badge progress) ───────────────────────────────────────

async function pollQueue() {
    try {
        const data = await apiGet('/gorex-api/queue')
        const active = (data.queue || []).filter(v =>
            ['downloading', 'encoding', 'converting', 'downloading-subs'].includes(v.status)
        )
        if (active.length > 0) {
            const avg = Math.round(active.reduce((s, v) => s + v.progress, 0) / active.length)
            chrome.action.setBadgeText({ text: avg + '%' })
            chrome.action.setBadgeBackgroundColor({ color: '#7c3aed' })
        } else if (data.queue && data.queue.length > 0) {
            chrome.action.setBadgeText({ text: String(data.queue.length) })
            chrome.action.setBadgeBackgroundColor({ color: '#4f46e5' })
        } else {
            chrome.action.setBadgeText({ text: '' })
        }
    } catch {
        // App offline – clear badge silently
        chrome.action.setBadgeText({ text: '' })
    }
}

// Poll every 3 seconds
setInterval(pollQueue, 3000)

// ── Message bus ───────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'GOREX_PING') {
        findApiPort().then(port => sendResponse({ online: !!port, port })).catch(() => sendResponse({ online: false }))
        return true  // async
    }
    if (msg.type === 'GOREX_GET_FORMATS') {
        apiGet('/gorex-api/formats?url=' + encodeURIComponent(msg.url))
            .then(data => sendResponse({ ok: true, data }))
            .catch(e => sendResponse({ ok: false, error: e.message }))
        return true
    }
    if (msg.type === 'GOREX_ADD_TO_QUEUE') {
        apiPost('/gorex-api/queue/add', msg.payload)
            .then(() => {
                updateBadge(true)
                sendResponse({ ok: true })
            })
            .catch(e => {
                if (e.message === 'APP_OFFLINE') updateBadge(false)
                sendResponse({ ok: false, error: e.message })
            })
        return true
    }
    if (msg.type === 'GOREX_GET_QUEUE') {
        apiGet('/gorex-api/queue')
            .then(data => sendResponse({ ok: true, data }))
            .catch(e => sendResponse({ ok: false, error: e.message }))
        return true
    }
})
