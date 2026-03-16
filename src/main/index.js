import { app, shell, BrowserWindow, ipcMain, dialog, session, protocol, net, Tray, Menu, nativeImage } from 'electron'
import { join, dirname, extname, normalize } from 'path'
import { createServer } from 'http'
import { readFileSync, existsSync, statSync, createReadStream } from 'fs'
import { Readable } from 'stream'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { spawn, exec } from 'child_process'

// ─── Local HTTP server for production renderer ──────────────────────────────────────────
// Serves the built renderer from http://127.0.0.1:{port}/ so the page has a real HTTP
// origin instead of null (file://). This is required for YouTube iframe embeds: the
// YouTube embed player checks window.location.ancestorOrigins and blocks playback when
// the embedding frame has a null/file:// origin (error 152). Binding to 127.0.0.1 means
// only the local machine can reach it.
const RENDERER_MIME = {
    '.html':  'text/html; charset=utf-8',
    '.js':    'application/javascript',
    '.css':   'text/css',
    '.svg':   'image/svg+xml',
    '.png':   'image/png',
    '.jpg':   'image/jpeg',
    '.jpeg':  'image/jpeg',
    '.ico':   'image/x-icon',
    '.woff':  'font/woff',
    '.woff2': 'font/woff2',
    '.ttf':   'font/ttf',
    '.map':   'application/json',
}

function startRendererServer() {
    const rendererDir = join(__dirname, '../renderer')
    const requestHandler = (req, res) => {
        const urlPath = (req.url || '/').split('?')[0]
        const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\//, '')
        // Guard against path traversal
        const safe = normalize(join(rendererDir, rel))
        if (!safe.startsWith(rendererDir + '\\') && !safe.startsWith(rendererDir + '/') && safe !== rendererDir) {
            res.writeHead(403); res.end(); return
        }
        const filePath = (existsSync(safe) && !statSync(safe).isDirectory()) ? safe : join(rendererDir, 'index.html')
        try {
            const data = readFileSync(filePath)
            res.writeHead(200, {
                'Content-Type': RENDERER_MIME[extname(filePath)] || 'application/octet-stream',
                'Cache-Control': 'no-store',
            })
            res.end(data)
        } catch {
            res.writeHead(404); res.end()
        }
    }
    // Use a fixed preferred port so localStorage persists across launches.
    // localStorage is keyed by origin (protocol + host + port), so a random port
    // on every launch means a fresh empty storage every time — breaking all
    // persisted settings and the onboarding-done flag.
    // Try preferred ports in order; fall back to OS-assigned port only if all are taken.
    const PORTS = [19857, 19858, 19859, 19860, 19861, 0]
    return new Promise((resolve, reject) => {
        const tryNext = (i) => {
            const server = createServer(requestHandler)
            server.listen(PORTS[i], '127.0.0.1', () => resolve(server.address().port))
            server.on('error', (err) => {
                if (err.code === 'EADDRINUSE' && i < PORTS.length - 1) {
                    tryNext(i + 1)
                } else {
                    reject(err)
                }
            })
        }
        tryNext(0)
    })
}

// Register custom scheme for local media preview before app is ready.
// The renderer runs on http://127.0.0.1 so file:// URLs are blocked by Chromium;
// gorex-media:// tunnels requests through the main process instead.
protocol.registerSchemesAsPrivileged([
    { scheme: 'gorex-media', privileges: { secure: true, supportFetchAPI: true, stream: true, corsEnabled: true } }
])

let rendererPort = 0

// ─── Persistent app settings (stored in userData) ───────────────────────────────────────
let settingsFilePath = ''

function getSettingsFilePath() {
    if (!settingsFilePath) settingsFilePath = join(app.getPath('userData'), 'gorex-settings.json')
    return settingsFilePath
}

function readAppSettings() {
    try {
        const data = require('fs').readFileSync(getSettingsFilePath(), 'utf8')
        return JSON.parse(data)
    } catch {
        return {}
    }
}

function writeAppSettings(settings) {
    require('fs').writeFileSync(getSettingsFilePath(), JSON.stringify(settings, null, 2), 'utf8')
}

// ─── yt-dlp error message helpers ───────────────────────────────────────────────────────
function ytdlFriendlyErr(raw) {
    if (raw.includes('Failed to decrypt with DPAPI')) {
        return (
            'Ошибка расшифровки cookies браузера (DPAPI).\n' +
            'Chrome/Edge/Brave шифруют cookies с привязкой к приложению — yt-dlp не может их прочитать напрямую.\n\n' +
            'Решения:\n' +
            '• Используйте Firefox в качестве источника cookies (не имеет этой проблемы)\n' +
            '• Экспортируйте cookies в файл через расширение браузера "Get cookies.txt LOCALLY"\n' +
            '  и укажите этот файл в Настройках → Cookies браузера → Файл cookies.txt'
        )
    }
    if (raw.includes('The page needs to be reloaded')) {
        return (
            'YouTube требует обновления сессии.\n\n' +
            'Если у вас настроены cookies — попробуйте:\n' +
            '• Обновить файл cookies.txt (экспортировать заново из браузера)\n' +
            '• Удалить cookies в Настройках и попробовать без них\n' +
            '• Сменить браузер-источник cookies на Firefox'
        )
    }
    return null
}

const activeJobs = new Map() // id -> child process
let mainWindow = null
let tray = null
let isQuitting = false
let ytdlFetchActiveChildren = new Set()
let ytdlFetchCancelled = false

// ─── Tray helpers ────────────────────────────────────────────────────────────
function isBackgroundModeEnabled() {
    try { return readAppSettings().backgroundMode !== false } catch { return true }
}

let _lastTrayPercent = -2 // sentinel so first update always fires
let _trayColor = '#7c3aed' // purple = download, orange = conversion

function createStaticTrayIcon() {
    const iconPath = join(__dirname, '../../resources/icon.png')
    try {
        return nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
    } catch {
        return nativeImage.createEmpty()
    }
}

async function updateTrayProgress(percent) {
    if (!tray) return
    const rounded = percent !== null ? Math.round(percent) : null
    if (rounded === _lastTrayPercent) return
    _lastTrayPercent = rounded

    tray.setToolTip(rounded !== null ? `Gorex — ${rounded}%` : 'Gorex')

    if (rounded !== null && mainWindow && !mainWindow.isDestroyed()) {
        try {
            const text = String(rounded)
            const fontSize = text.length >= 3 ? 12 : text.length === 2 ? 15 : 20
            const color = _trayColor
            const dataUrl = await mainWindow.webContents.executeJavaScript(`(()=>{
                const c=document.createElement('canvas');c.width=c.height=32;
                const x=c.getContext('2d');
                x.fillStyle='${color}';
                if(x.roundRect){x.beginPath();x.roundRect(0,0,32,32,6);x.fill();}
                else{x.fillRect(0,0,32,32);}
                x.fillStyle='#ffffff';
                x.font='bold ${fontSize}px Arial,sans-serif';
                x.textAlign='center';x.textBaseline='middle';
                x.fillText('${text}',16,17);
                return c.toDataURL('image/png');
            })()`)
            tray.setImage(nativeImage.createFromDataURL(dataUrl))
            return
        } catch (_) {}
    }

    tray.setImage(createStaticTrayIcon())
}

function createTray() {
    tray = new Tray(createStaticTrayIcon())
    tray.setToolTip('Gorex')

    const buildMenu = () => Menu.buildFromTemplate([
        {
            label: 'Показать',
            click: () => {
                if (!mainWindow) return
                mainWindow.show()
                mainWindow.focus()
            }
        },
        { type: 'separator' },
        {
            label: 'Выход',
            click: () => {
                isQuitting = true
                app.quit()
            }
        }
    ])

    tray.setContextMenu(buildMenu())

    tray.on('click', () => {
        if (!mainWindow) return
        if (mainWindow.isVisible()) {
            mainWindow.focus()
        } else {
            mainWindow.show()
            mainWindow.focus()
        }
    })
}

// ─── yt-dlp binary resolver ─────────────────────────────────────────────────────────────
function getYtdlPath() {
    const platform = process.platform
    const bin = platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp_macos'
    if (is.dev) {
        return join(app.getAppPath(), 'resources', 'ytdl', bin)
    }
    return join(dirname(process.execPath), 'resources', 'ytdl', bin)
}

// ─── ffmpeg binary resolver (bundled alongside yt-dlp) ──────────────────────────────────
function getFfmpegPath() {
    const bin = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
    if (is.dev) {
        return join(app.getAppPath(), 'resources', 'ytdl', bin)
    }
    return join(dirname(process.execPath), 'resources', 'ytdl', bin)
}

// ─── Node.js path for yt-dlp --js-runtimes on YouTube ───────────────────────────────────
// Newer yt-dlp versions require a JS runtime to solve YouTube's n-signature challenge.
// Priority: 1) bundled node.exe in resources/ytdl/  2) system Node.js from PATH
let _nodeJsPathPromise = null
function findNodeJsPath() {
    if (_nodeJsPathPromise) return _nodeJsPathPromise
    _nodeJsPathPromise = (async () => {
        // 1. Bundled node binary (ships with the installer, always preferred)
        const bin = process.platform === 'win32' ? 'node.exe' : 'node'
        const bundled = is.dev
            ? join(app.getAppPath(), 'resources', 'ytdl', bin)
            : join(dirname(process.execPath), 'resources', 'ytdl', bin)
        if (require('fs').existsSync(bundled)) return bundled

        // 2. Fallback: system Node.js (useful for developers running from source)
        return new Promise((resolve) => {
            const cmd = process.platform === 'win32' ? 'where node' : 'which node'
            exec(cmd, { timeout: 3000 }, (err, stdout) => {
                const first = (!err && stdout) ? stdout.trim().split(/\r?\n/)[0].trim() : null
                resolve(first || null)
            })
        })
    })()
    return _nodeJsPathPromise
}

// ─── Temp directory for intermediate files (download + convert) ──────────────────────
function getTempDownloadDir() {
    return join(app.getPath('userData'), 'Downloads_Temp')
}

// ─── Download directory: next to exe in 'Downloaded', or user-configured path ──────────
function getDownloadDir(customOutputDir) {
    if (customOutputDir) return customOutputDir
    const s = readAppSettings()
    if (s.defaultOutputDir) return s.defaultOutputDir
    if (is.dev) {
        return join(app.getAppPath(), 'Downloaded')
    }
    return join(dirname(process.execPath), 'Downloaded')
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 850,
        show: false,
        autoHideMenuBar: true,
        frame: false, // Frameless window
        icon: join(__dirname, '../../resources/icon.png'),
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false
        }
    })

    // Strip "Electron/x.x.x" from the User-Agent so YouTube embedded player
    // does not detect a non-browser environment and return error 153.
    const cleanUA = mainWindow.webContents.userAgent
        .replace(/\bElectron\/[\d.]+\s*/g, '')
        .trim()
    mainWindow.webContents.userAgent = cleanUA

    mainWindow.on('ready-to-show', () => {
        mainWindow.show()
    })

    // Wrap setProgressBar so every progress update also mirrors to the tray tooltip
    const _origSetProgressBar = mainWindow.setProgressBar.bind(mainWindow)
    mainWindow.setProgressBar = (progress, opts) => {
        _origSetProgressBar(progress, opts)
        if (progress < 0) {
            updateTrayProgress(null)
        } else {
            updateTrayProgress(Math.round(progress * 100))
        }
    }

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
        mainWindow.loadURL(`http://127.0.0.1:${rendererPort}/index.html`)
    }
}

app.whenReady().then(async () => {
    electronApp.setAppUserModelId('com.akhmatyarov.gorex')

    // Handle gorex-media:// requests – serves local video files with Range support
    // so the renderer <video> element can seek through files.
    protocol.handle('gorex-media', async (request) => {
        try {
            const urlPath = decodeURIComponent(new URL(request.url).pathname)
            // On Windows /E:/path → E:/path
            const filePath = urlPath.replace(/^\//, '')

            if (!existsSync(filePath)) return new Response('Not found', { status: 404 })

            const stat = statSync(filePath)
            const fileSize = stat.size

            const ext = filePath.split('.').pop().toLowerCase()
            const MIME = {
                mp4: 'video/mp4', m4v: 'video/mp4', mov: 'video/quicktime',
                mkv: 'video/x-matroska', webm: 'video/webm',
                avi: 'video/x-msvideo', ts: 'video/mp2t', flv: 'video/x-flv',
                wmv: 'video/x-ms-wmv', ogv: 'video/ogg',
            }
            const contentType = MIME[ext] || 'video/mp4'

            const rangeHeader = request.headers.get('range')

            if (rangeHeader) {
                const match = rangeHeader.match(/bytes=(\d+)-(\d*)/)
                const start = parseInt(match[1], 10)
                const end = match[2] ? parseInt(match[2], 10) : fileSize - 1
                const chunkSize = end - start + 1
                const nodeStream = createReadStream(filePath, { start, end })
                return new Response(Readable.toWeb(nodeStream), {
                    status: 206,
                    headers: {
                        'Content-Type': contentType,
                        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                        'Content-Length': String(chunkSize),
                        'Accept-Ranges': 'bytes',
                    },
                })
            } else {
                const nodeStream = createReadStream(filePath)
                return new Response(Readable.toWeb(nodeStream), {
                    status: 200,
                    headers: {
                        'Content-Type': contentType,
                        'Content-Length': String(fileSize),
                        'Accept-Ranges': 'bytes',
                    },
                })
            }
        } catch {
            return new Response('Error', { status: 500 })
        }
    })

    // Start the local HTTP server so the renderer has a real http://127.0.0.1 origin,
    // which is required for YouTube iframes to play back without error 152.
    if (!is.dev) {
        rendererPort = await startRendererServer()
    }

    // Configure fluent-ffmpeg to use the bundled ffmpeg/ffprobe binaries.
    // Primary: ytdl-bundled binaries (same dir as yt-dlp).
    // Fallback: ffmpeg-static / ffprobe-static npm packages (always in app.asar.unpacked).
    {
        const _fs = require('fs')
        const fluentFfmpeg = require('fluent-ffmpeg')

        const ffmpegBin = getFfmpegPath()
        const ffprobeBin = join(require('path').dirname(ffmpegBin), process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe')

        if (_fs.existsSync(ffmpegBin)) {
            fluentFfmpeg.setFfmpegPath(ffmpegBin)
        } else {
            try {
                const ffmpegStatic = require('ffmpeg-static')
                if (ffmpegStatic && _fs.existsSync(ffmpegStatic)) fluentFfmpeg.setFfmpegPath(ffmpegStatic)
            } catch (_) {}
        }

        if (_fs.existsSync(ffprobeBin)) {
            fluentFfmpeg.setFfprobePath(ffprobeBin)
        } else {
            try {
                const ffprobeStatic = require('ffprobe-static')
                const p = ffprobeStatic && (ffprobeStatic.path || ffprobeStatic)
                if (p && _fs.existsSync(p)) fluentFfmpeg.setFfprobePath(p)
            } catch (_) {}
        }
    }

    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window)
    })

    // Window Management IPC
    ipcMain.on('window-minimize', () => {
        BrowserWindow.getFocusedWindow()?.minimize()
    })
    ipcMain.on('window-maximize', () => {
        const win = BrowserWindow.getFocusedWindow()
        if (win?.isMaximized()) win.unmaximize()
        else win?.maximize()
    })
    ipcMain.on('window-close', () => {
        if (!isQuitting && isBackgroundModeEnabled()) {
            mainWindow?.hide()
        } else {
            BrowserWindow.getFocusedWindow()?.close()
        }
    })

    ipcMain.handle('set-background-mode', (event, enabled) => {
        const settings = readAppSettings()
        settings.backgroundMode = enabled
        writeAppSettings(settings)
        return true
    })
    ipcMain.on('open-devtools', () => {
        BrowserWindow.getFocusedWindow()?.webContents.openDevTools()
    })

    // IPC handlers for file/folder dialogs
    ipcMain.handle('select-files', async () => {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            properties: ['openFile', 'multiSelections'],
            filters: [
                {
                    name: 'Videos',
                    extensions: [
                        'mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'm4v',
                        'ts', 'm2ts', 'mts', 'mpg', 'mpeg', 'vob', 'webm',
                        '3gp', '3g2', 'ogv', 'ogg', 'divx', 'xvid', 'rmvb',
                        'asf', 'mxf', 'dv', 'f4v', 'h264', 'h265', 'hevc',
                        'avchd'
                    ]
                }
            ]
        })
        return canceled ? [] : filePaths
    })

    ipcMain.handle('select-folder', async () => {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            properties: ['openDirectory']
        })
        return canceled ? null : filePaths[0]
    })

    ipcMain.handle('select-subtitle-file', async () => {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                { name: 'Subtitle Files', extensions: ['srt', 'ass', 'ssa', 'sub', 'vtt'] }
            ]
        })
        return canceled ? null : filePaths[0]
    })

    ipcMain.handle('select-cookies-file', async () => {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                { name: 'Cookies File', extensions: ['txt'] }
            ]
        })
        return canceled ? null : filePaths[0]
    })

    ipcMain.handle('check-cli', async () => {
        const ffmpegBin = getFfmpegPath()
        const fs = require('fs')
        if (!fs.existsSync(ffmpegBin)) {
            return { found: false, version: null, path: ffmpegBin }
        }
        return new Promise((resolve) => {
            const child = spawn(ffmpegBin, ['-version'])
            let output = ''
            child.stdout.on('data', d => { output += d.toString() })
            child.stderr.on('data', d => { output += d.toString() })
            child.on('close', () => {
                const versionMatch = output.match(/ffmpeg version ([\w.]+(?:[-~][\w.]+)*)/i)
                resolve({
                    found: true,
                    version: versionMatch ? versionMatch[1] : output.trim().split('\n')[0],
                    path: ffmpegBin
                })
            })
            child.on('error', () => {
                resolve({ found: false, version: null, path: ffmpegBin })
            })
        })
    })

    ipcMain.handle('get-app-settings', () => {
        return readAppSettings()
    })

    ipcMain.handle('save-app-settings', (event, settings) => {
        writeAppSettings(settings)
        return true
    })

    // Returns the default output directory respecting persisted settings.
    ipcMain.handle('get-default-output-dir', () => {
        const s = readAppSettings()
        return s.defaultOutputDir || app.getPath('videos')
    })

    ipcMain.handle('open-temp-folder', async () => {
        const fs = require('fs')
        const tempDir = getTempDownloadDir()
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })
        await shell.openPath(tempDir)
    })

    ipcMain.handle('clear-temp-folder', () => {
        const fs = require('fs')
        const tempDir = getTempDownloadDir()
        if (!fs.existsSync(tempDir)) return { cleared: 0 }
        let count = 0
        for (const f of fs.readdirSync(tempDir)) {
            try { fs.unlinkSync(join(tempDir, f)); count++ } catch (_) {}
        }
        return { cleared: count }
    })

    ipcMain.handle('clear-all-settings', () => {
        const fs = require('fs')
        const settingsPath = getSettingsFilePath()
        try { if (fs.existsSync(settingsPath)) fs.unlinkSync(settingsPath) } catch (_) {}
        const tempDir = getTempDownloadDir()
        if (fs.existsSync(tempDir)) {
            for (const f of fs.readdirSync(tempDir)) {
                try { fs.unlinkSync(join(tempDir, f)) } catch (_) {}
            }
        }
        return true
    })

    ipcMain.handle('relaunch-app', () => {
        app.relaunch()
        app.exit(0)
    })

    ipcMain.handle('open-external', async (event, url) => {
        if (typeof url === 'string' && (url.startsWith('https://github.com/Gor80hd/Gorex/') || url.startsWith('https://github.com/Gor80hd/Gorex'))) {
            await shell.openExternal(url)
        }
    })

    ipcMain.handle('check-for-updates', async () => {
        try {
            const res = await net.fetch('https://api.github.com/repos/Gor80hd/Gorex/releases/latest', {
                headers: { 'User-Agent': 'Gorex-App/' + app.getVersion() }
            })
            if (!res.ok) return null
            const data = await res.json()
            const latest = (data.tag_name || '').replace(/^v/i, '')
            const current = app.getVersion()
            if (!latest) return null
            const toNums = (v) => v.split('.').map(n => parseInt(n, 10) || 0)
            const [la, lb, lc] = toNums(latest)
            const [ca, cb, cc] = toNums(current)
            const isNewer = la > ca || (la === ca && lb > cb) || (la === ca && lb === cb && lc > cc)
            if (!isNewer) return null
            // Only allow verified github.com release URLs
            const url = typeof data.html_url === 'string' && data.html_url.startsWith('https://github.com/Gor80hd/Gorex/')
                ? data.html_url
                : 'https://github.com/Gor80hd/Gorex/releases/latest'
            return { latestVersion: latest, downloadUrl: url }
        } catch {
            return null
        }
    })

    // ─── Fallback: extract embedded Vimeo/YouTube URL from an arbitrary page ───────────
    async function tryExtractAllEmbeddedVideoUrls(pageUrl) {
        // Use Electron's net module (Chromium network stack) instead of Node's http.
        // This is critical: sites behind Cloudflare/Akamai detect Node's raw TLS
        // fingerprint and return bot challenges. Electron's net module looks identical
        // to a real Chrome request, bypasses bot protection, and decompresses
        // gzip/brotli responses automatically.
        const { net } = require('electron')

        const fetchHtml = (targetUrl) => new Promise((resolve) => {
            let settled = false
            const done = (v) => { if (!settled) { settled = true; resolve(v) } }

            let request
            try {
                request = net.request({
                    method: 'GET',
                    url: targetUrl,
                    redirect: 'follow',
                })
            } catch { resolve(null); return }

            request.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36')
            request.setHeader('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8')
            request.setHeader('Accept-Language', 'en-US,en;q=0.9')
            request.setHeader('Sec-Fetch-Mode', 'navigate')
            request.setHeader('Sec-Fetch-Site', 'none')

            const chunks = []
            request.on('response', (resp) => {
                resp.on('data', d => chunks.push(d))
                resp.on('end', () => done(Buffer.concat(chunks).toString('utf8')))
                resp.on('error', () => done(null))
            })
            request.on('error', () => done(null))
            request.on('redirect', (status, method, redirectUrl) => {
                try { request.followRedirect() } catch { done(null) }
            })

            const timer = setTimeout(() => {
                try { request.abort() } catch {}
                done(null)
            }, 15000)
            request.on('response', () => clearTimeout(timer))

            request.end()
        })

        const html = await fetchHtml(pageUrl)
        if (!html) return null

        // Normalize all common encoding variants so a single regex pass works for:
        //  - Plain HTML attributes (& stays &)
        //  - HTML attribute encoding (&amp; → &)
        //  - JSON strings inside <script> / __NEXT_DATA__ (\u0026 → &, \/ → /, \u003F → ?)
        const normalized = html
            .replace(/\\u0026/gi, '&')
            .replace(/\\u003[fF]/g, '?')
            .replace(/&amp;/g, '&')
            .replace(/\\\//g, '/')

        // Deduplicate by canonical ID — same video may appear more than once in the HTML
        const found = new Map() // key: "vimeo:{id}" | "yt:{id}" → full URL

        // ── Vimeo player URLs (full, including ?h= privacy hash) ─────────────────────
        for (const m of normalized.matchAll(/https?:\/\/player\.vimeo\.com\/video\/(\d+)(\?[a-zA-Z0-9=&._%-]+)?/g)) {
            const key = `vimeo:${m[1]}`
            if (!found.has(key)) found.set(key, `https://player.vimeo.com/video/${m[1]}${m[2] || ''}`)
        }
        // ── Vimeo data attributes / plain URLs ───────────────────────────────────────
        for (const m of normalized.matchAll(/data-vimeo-id="(\d+)"/g)) {
            const key = `vimeo:${m[1]}`
            if (!found.has(key)) found.set(key, `https://vimeo.com/${m[1]}`)
        }
        for (const m of normalized.matchAll(/["']https?:\/\/vimeo\.com\/(\d{7,12})["']/g)) {
            const key = `vimeo:${m[1]}`
            if (!found.has(key)) found.set(key, `https://vimeo.com/${m[1]}`)
        }
        // ── YouTube embeds (incl. nocookie) ──────────────────────────────────────────
        for (const m of normalized.matchAll(/(?:youtube(?:-nocookie)?\.com\/embed)\/([a-zA-Z0-9_-]{11})/g)) {
            const key = `yt:${m[1]}`
            if (!found.has(key)) found.set(key, `https://www.youtube.com/watch?v=${m[1]}`)
        }
        // ── og:video meta tag ─────────────────────────────────────────────────────────
        const ogm = normalized.match(/<meta[^>]+property="og:video(?::url)?"[^>]+content="([^"]+)"/)
            || normalized.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:video(?::url)?"/)
        if (ogm) {
            const v = ogm[1]
            const vm = v.match(/player\.vimeo\.com\/video\/(\d+)/) || v.match(/vimeo\.com\/(\d+)/)
            if (vm) { const key = `vimeo:${vm[1]}`; if (!found.has(key)) found.set(key, v) }
            const ym = v.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
            if (ym) { const key = `yt:${ym[1]}`; if (!found.has(key)) found.set(key, v) }
        }

        return [...found.values()]
    }

    // ─── Fallback: find video IDs encoded in the URL's own query parameters ──────────
    // Returns an array of player URLs (may be empty)
    function tryExtractVideoIdFromQueryParams(pageUrl) {
        let parsed
        try { parsed = new URL(pageUrl) } catch { return [] }

        const VIMEO_PARAM_NAMES = ['video', 'vid', 'vimeo', 'vimeo_id', 'videoid']
        const YT_PARAM_NAMES = ['v', 'youtube', 'yt', 'ytid']
        const found = new Map()

        for (const [key, value] of parsed.searchParams.entries()) {
            const k = key.toLowerCase()
            if (VIMEO_PARAM_NAMES.includes(k) && /^\d{7,12}$/.test(value)) {
                const urlKey = `vimeo:${value}`
                if (!found.has(urlKey)) found.set(urlKey, `https://player.vimeo.com/video/${value}`)
            }
            if (YT_PARAM_NAMES.includes(k) && /^[a-zA-Z0-9_-]{11}$/.test(value)) {
                const urlKey = `yt:${value}`
                if (!found.has(urlKey)) found.set(urlKey, `https://www.youtube.com/watch?v=${value}`)
            }
        }
        // Second pass: any param with a Vimeo-style numeric value not yet captured
        for (const [, value] of parsed.searchParams.entries()) {
            const urlKey = `vimeo:${value}`
            if (/^\d{7,12}$/.test(value) && !found.has(urlKey)) found.set(urlKey, `https://player.vimeo.com/video/${value}`)
        }
        return [...found.values()]
    }

    // ─── yt-dlp: fetch formats + metadata WITHOUT downloading ───────────────────────────
    ipcMain.handle('ytdl-get-formats', async (event, videoUrl) => {
        ytdlFetchCancelled = false
        ytdlFetchActiveChildren.clear()
        const fs = require('fs')
        const ytdlPath = getYtdlPath()
        if (!fs.existsSync(ytdlPath)) throw new Error(`yt-dlp не найден: ${ytdlPath}`)

        const sendStage = (stage, extra = {}) => {
            try { event.sender.send('ytdl-fetch-progress', { stage, ...extra }) } catch {}
        }

        const appCfg = readAppSettings()
        const cookiesFile = appCfg.ytdlCookiesFile || ''
        const nodePath = await findNodeJsPath()

        // Run yt-dlp --dump-json and return { out, err, code }
        const runDumpJson = (url, extraArgs = []) => new Promise((res) => {
            if (ytdlFetchCancelled) return res({ out: '', err: 'cancelled', code: -1 })
            const child = spawn(ytdlPath, [
                '--dump-json',
                '--no-playlist',
                '--extractor-args', 'generic:impersonate',
                ...(nodePath ? ['--js-runtimes', `node:${nodePath}`] : []),
                ...(cookiesFile ? ['--cookies', cookiesFile] : []),
                ...extraArgs,
                url
            ], { windowsHide: true })
            ytdlFetchActiveChildren.add(child)
            let out = '', err = ''
            child.stdout.on('data', d => { out += d.toString() })
            child.stderr.on('data', d => { err += d.toString(); console.error('[ytdl-get-formats stderr]', d.toString().trimEnd()) })
            child.on('close', code => { ytdlFetchActiveChildren.delete(child); res({ out, err, code }) })
            child.on('error', e => { ytdlFetchActiveChildren.delete(child); res({ out: '', err: e.message, code: 1 }) })
        })

        // Build a video info object from a successful yt-dlp JSON output
        const buildInfo = async (rawOut, origUrl, resolvedUrl) => {
            const info = JSON.parse(rawOut.trim())
            const rawFormats = info.formats || []

            const formats = rawFormats
                .filter(f => f.vcodec && f.vcodec !== 'none')
                .map(f => ({
                    format_id: f.format_id,
                    ext: f.ext,
                    resolution: f.resolution || (f.width && f.height ? `${f.width}x${f.height}` : null),
                    width: f.width || null,
                    height: f.height || null,
                    fps: f.fps || null,
                    filesize: f.filesize || f.filesize_approx || null,
                    vcodec: f.vcodec,
                    acodec: f.acodec,
                    tbr: f.tbr || null,
                    format_note: f.format_note || null,
                    hasAudio: !!(f.acodec && f.acodec !== 'none')
                }))
                .sort((a, b) => (b.height || 0) - (a.height || 0))

            const thumbnails = info.thumbnails || []
            const thumbnailUrl = info.thumbnail ||
                (thumbnails.length > 0 ? thumbnails[thumbnails.length - 1].url : null)

            let thumbnailBase64 = null
            if (thumbnailUrl) {
                try {
                    const https = require('https')
                    const http = require('http')
                    thumbnailBase64 = await new Promise((res, rej) => {
                        const protocol = thumbnailUrl.startsWith('https') ? https : http
                        protocol.get(thumbnailUrl, (resp) => {
                            const chunks = []
                            resp.on('data', d => chunks.push(d))
                            resp.on('end', () => {
                                const buf = Buffer.concat(chunks)
                                const mime = (resp.headers['content-type'] || 'image/jpeg').split(';')[0]
                                res(`data:${mime};base64,${buf.toString('base64')}`)
                            })
                            resp.on('error', rej)
                        }).on('error', rej)
                    })
                } catch {
                    // thumbnail fetch failed, leave null
                }
            }

            const chapters = (info.chapters || []).map(ch => ({
                title: ch.title || '',
                start_time: ch.start_time ?? 0,
                end_time: ch.end_time ?? (info.duration || 0)
            }))

            return {
                title: info.title || info.id || 'Видео',
                thumbnailUrl: thumbnailBase64,
                formats,
                duration: info.duration || null,
                chapters,
                url: origUrl,
                resolvedUrl: resolvedUrl || null,
                availableSubs: Object.keys(info.subtitles || {}),
                availableAutoSubs: Object.keys(info.automatic_captions || {}),
            }
        }

        sendStage('ytdlp')
        const firstResult = await runDumpJson(videoUrl)
        if (ytdlFetchCancelled) return null
        console.log('[ytdl-get-formats] exit code:', firstResult.code)

        // Direct success — single video
        if (firstResult.code === 0) {
            try {
                const info = await buildInfo(firstResult.out, videoUrl, null)
                if (ytdlFetchCancelled) return null
                return [info]
            } catch (e) {
                console.error('[ytdl-get-formats] JSON parse error:', e.message)
                throw new Error('Не удалось разобрать ответ yt-dlp: ' + e.message)
            }
        }

        // Only attempt fallback for explicitly unsupported URLs
        if (!firstResult.err.includes('Unsupported URL')) {
            const raw = firstResult.err.trim() || `yt-dlp завершился с кодом ${firstResult.code}`
            console.error('[ytdl-get-formats] FAILED:', raw)
            throw new Error(ytdlFriendlyErr(raw) || raw)
        }

        // 1st attempt: scrape the page HTML for embedded player iframes / og:video
        console.log('[ytdl-get-formats] unsupported URL — trying embedded video extraction for:', videoUrl)
        sendStage('scraping')
        let resolvedUrls = await tryExtractAllEmbeddedVideoUrls(videoUrl)

        // 2nd attempt: extract video IDs directly from the URL query parameters
        if (resolvedUrls.length === 0) {
            console.log('[ytdl-get-formats] page extraction returned nothing — checking URL query params')
            sendStage('queryparams')
            resolvedUrls = tryExtractVideoIdFromQueryParams(videoUrl)
        }

        if (resolvedUrls.length === 0) {
            const raw = firstResult.err.trim() || `yt-dlp завершился с кодом ${firstResult.code}`
            console.error('[ytdl-get-formats] FAILED:', raw)
            throw new Error(ytdlFriendlyErr(raw) || raw)
        }

        console.log(`[ytdl-get-formats] found ${resolvedUrls.length} candidate URL(s) — retrying with referer`)
        sendStage('retry', { total: resolvedUrls.length })
        const retryResults = await Promise.all(
            resolvedUrls.map(u => runDumpJson(u, ['--referer', videoUrl]).then(r => ({ ...r, resolvedUrl: u })))
        )
        if (ytdlFetchCancelled) return null
        retryResults.forEach(r => console.log('[ytdl-get-formats] retry', r.resolvedUrl, '→ code:', r.code))

        const successful = retryResults.filter(r => r.code === 0)
        if (successful.length === 0) {
            const raw = retryResults[0].err.trim() || `yt-dlp завершился с кодом ${retryResults[0].code}`
            console.error('[ytdl-get-formats] all retries FAILED:', raw)
            throw new Error(ytdlFriendlyErr(raw) || raw)
        }

        try {
            const results = await Promise.all(successful.map(r => buildInfo(r.out, videoUrl, r.resolvedUrl)))
            if (ytdlFetchCancelled) return null
            return results
        } catch (e) {
            console.error('[ytdl-get-formats] JSON parse error:', e.message)
            throw new Error('Не удалось разобрать ответ yt-dlp: ' + e.message)
        }
    })

    ipcMain.on('ytdl-cancel-fetch', () => {
        ytdlFetchCancelled = true
        for (const child of ytdlFetchActiveChildren) {
            try { child.kill() } catch {}
        }
        ytdlFetchActiveChildren.clear()
    })

    // ─── yt-dlp: download with selected format + optional post-conversion ────────────
    ipcMain.on('ytdl-run', async (event, { id, url, formatId, outputDir, outputName, convertAfterDownload, conversionSettings, videoResolution, clipStart, clipEnd, ytdlDuration, noAudio, downloadSubs, autoSubs, subLangs, subFormat }) => {
        _trayColor = '#7c3aed'
        const fs = require('fs')
        const ytdlPath = getYtdlPath()

        if (!fs.existsSync(ytdlPath)) {
            event.sender.send('ytdl-exit', { id, code: 1, error: `yt-dlp не найден: ${ytdlPath}` })
            return
        }

        // Resolve output directory: user config > exe-relative 'Downloaded'
        const resolvedDir = getDownloadDir(outputDir)
        if (!fs.existsSync(resolvedDir)) fs.mkdirSync(resolvedDir, { recursive: true })

        // When converting after download, download to a writable temp folder.
        const downloadDir = convertAfterDownload ? getTempDownloadDir() : resolvedDir
        if (convertAfterDownload && !fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true })

        // Sanitize filename
        const safeBase = (outputName || 'video').replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/\.+$/, '').trim() || 'video'

        // Format selector – prefer merging best audio when format is video-only
        // If formatId is a complex yt-dlp selector (contains / or [), use it as-is
        const isAudioOnlyFmt = formatId === 'bestaudio'
        let fmtArg
        if (isAudioOnlyFmt) {
            fmtArg = 'bestaudio/best'
        } else if (!formatId || formatId === 'best') {
            fmtArg = noAudio ? 'bestvideo/best' : 'bestvideo+bestaudio/best'
        } else if (formatId.includes('/') || formatId.includes('[')) {
            fmtArg = formatId
        } else if (noAudio) {
            fmtArg = `${formatId}/bestvideo/best`
        } else {
            fmtArg = `${formatId}+bestaudio/${formatId}/bestvideo+bestaudio/best`
        }

        // When converting after download, use an ASCII-only temp filename
        // to keep the intermediate file name simple and predictable.
        const convertAfterDownloadTemp = !!convertAfterDownload
        const downloadBase = convertAfterDownloadTemp ? `gorex_temp_${id}_${Date.now()}` : safeBase
        const outputTemplate = join(downloadDir, downloadBase + '.%(ext)s')

        // Build time-clipping arguments if a partial range is requested
        const hasClip = (clipStart != null && clipStart > 0) || (clipEnd != null)
        const secToTimestamp = (s) => {
            const sec = Math.max(0, Math.floor(s))
            const h = Math.floor(sec / 3600)
            const m = Math.floor((sec % 3600) / 60)
            const ss = sec % 60
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
        }

        const ffmpegPath = getFfmpegPath()
        const appCfg = readAppSettings()
        const cookiesFile = appCfg.ytdlCookiesFile || ''
        const nodePath = await findNodeJsPath()
        const ytdlArgs = [
            '-f', fmtArg,
            '-o', outputTemplate,
            '--no-playlist',
            '--merge-output-format', 'mp4',
            '--newline',
            '--extractor-args', 'generic:impersonate',
            ...(nodePath ? ['--js-runtimes', `node:${nodePath}`] : []),
            ...(cookiesFile ? ['--cookies', cookiesFile] : []),
            ...(require('fs').existsSync(ffmpegPath) ? ['--ffmpeg-location', ffmpegPath] : []),
        ]

        if (hasClip) {
            const fromTs = secToTimestamp(clipStart ?? 0)
            const toTs = clipEnd != null ? secToTimestamp(clipEnd) : 'inf'
            ytdlArgs.push('--download-sections', `*${fromTs}-${toTs}`)
            // Note: --force-keyframes-at-cuts is intentionally omitted — it runs ffmpeg
            // to probe keyframes before downloading begins, which blocks all progress output.
        }

        if (downloadSubs || autoSubs) {
            // Subtitles are downloaded in a SEPARATE second pass (--skip-download)
            // after the video is fully saved. This prevents yt-dlp from aborting
            // the video download when a subtitle request returns HTTP 429.
        }

        ytdlArgs.push(url)

        console.log('[yt-dlp] spawn:', ytdlPath)
        console.log('[yt-dlp] args:', ytdlArgs.join(' '))

        const child = spawn(ytdlPath, ytdlArgs, { windowsHide: true })
        activeJobs.set(id, { child, outputPath: null, downloadDir, downloadBase, isTempDownload: convertAfterDownloadTemp })

        let downloadedPath = null
        let stderrAccum = ''
        // Tracks fragment download phases so progress doesn't reset between video/audio streams
        let fragPhase = 0
        let fragPhaseOffset = 0
        let lastFragTotal = 0
        // Total duration in seconds for ffmpeg time-based progress (used with --download-sections)
        const clipDuration = (clipEnd != null)
            ? Math.max(1, clipEnd - (clipStart ?? 0))
            : (ytdlDuration ?? null)

        const parseProgress = (str, fromStderr) => {
            // Percentage-based: [download]  25.5% of  123.45MiB
            const progressMatch = str.match(/\[download\]\s+([\d.]+)%/)
            if (progressMatch) {
                const progress = parseFloat(progressMatch[1])
                event.sender.send('ytdl-progress', { id, progress })
                if (activeJobs.has(id)) mainWindow?.setProgressBar(progress / 100)
                return
            }
            // Fragment-based: [download] Downloading fragment 3 of 47
            const fragMatch = str.match(/\[download\] Downloading fragment (\d+) of (\d+)/)
            if (fragMatch) {
                const current = parseInt(fragMatch[1], 10)
                const total = parseInt(fragMatch[2], 10)
                if (total > 0) {
                    // Detect phase change (e.g., video stream -> audio stream)
                    if (total !== lastFragTotal && lastFragTotal > 0) {
                        fragPhase++
                        fragPhaseOffset = fragPhase * 50 // each phase contributes 50% (video + audio = 100%)
                    }
                    lastFragTotal = total
                    const phaseProgress = (current / total) * (lastFragTotal > 0 ? 50 : 100)
                    const progress = Math.min(99, fragPhaseOffset + phaseProgress)
                    event.sender.send('ytdl-progress', { id, progress })
                    if (activeJobs.has(id)) mainWindow?.setProgressBar(progress / 100)
                }
                return
            }
            // ffmpeg time-based progress: frame= 55 fps=0.0 ... time=00:00:02.04 ...
            // Emitted on stderr when yt-dlp uses --download-sections (pipes through ffmpeg)
            if (fromStderr && clipDuration && str.includes('time=')) {
                const timeMatch = str.match(/time=(\d+):(\d+):([\d.]+)/)
                if (timeMatch) {
                    const secs = parseInt(timeMatch[1], 10) * 3600
                        + parseInt(timeMatch[2], 10) * 60
                        + parseFloat(timeMatch[3])
                    const progress = Math.min(99, (secs / clipDuration) * 100)
                    event.sender.send('ytdl-progress', { id, progress })
                    if (activeJobs.has(id)) mainWindow?.setProgressBar(progress / 100)
                }
            }
        }

        child.stdout.on('data', (data) => {
            const str = data.toString()
            console.log('[yt-dlp stdout]', str.trimEnd())
            event.sender.send('ytdl-output', { id, data: str })

            parseProgress(str, false)

            // Capture destination path and stash in activeJobs for cleanup on stop
            const trackPath = (p) => {
                downloadedPath = p
                const job = activeJobs.get(id)
                if (job) {
                    if (!job.trackedPaths) job.trackedPaths = new Set()
                    job.trackedPaths.add(p)
                    job.trackedPaths.add(p + '.part')
                }
            }

            const destMatch = str.match(/\[download\] Destination:\s+(.+)/)
            if (destMatch) trackPath(destMatch[1].trim())

            // yt-dlp ≥ 2023 uses [ffmpeg] prefix; older builds used [Merger]
            const mergeMatch = str.match(/\[(?:Merger|ffmpeg)\] Merging formats into "(.+)"/)
            if (mergeMatch) trackPath(mergeMatch[1].trim())

            const alreadyMatch = str.match(/\[download\] (.+) has already been downloaded/)
            if (alreadyMatch) trackPath(alreadyMatch[1].trim())
        })

        child.stderr.on('data', (data) => {
            const str = data.toString()
            console.log('[yt-dlp stderr]', str.trimEnd())
            event.sender.send('ytdl-output', { id, data: str })
            stderrAccum += str
            // Some yt-dlp builds send progress to stderr — parse it too
            parseProgress(str, true)
        })

        child.on('error', (err) => {
            console.log('[yt-dlp error]', err.message)
            activeJobs.delete(id)
            if (activeJobs.size === 0) mainWindow?.setProgressBar(-1)
            event.sender.send('ytdl-exit', { id, code: 1, error: err.message })
        })

        child.on('close', async (code) => {
            console.log('[yt-dlp exit] code:', code)
            activeJobs.delete(id)

            if (code !== 0) {
                if (activeJobs.size === 0) mainWindow?.setProgressBar(-1)
                event.sender.send('ytdl-exit', { id, code, outputPath: null })
                return
            }

            // Fallback: find most recently created file matching base name
            if (!downloadedPath || !fs.existsSync(downloadedPath)) {
                try {
                    const files = fs.readdirSync(downloadDir)
                    const matching = files
                        .filter(f => f.startsWith(downloadBase + '.') || f.startsWith(downloadBase + ' ('))
                        .map(f => ({ f, mtime: fs.statSync(join(downloadDir, f)).mtimeMs }))
                        .sort((a, b) => b.mtime - a.mtime)
                    if (matching.length > 0) downloadedPath = join(downloadDir, matching[0].f)
                } catch (_) {}
            }

            // Before passing to FFmpeg, verify the file actually has a video stream.
            // yt-dlp may have left an audio-only temp file (e.g. .f251.webm) if the
            // merger message format wasn’t recognised or the selected format is audio-only.

            // ── Subtitle second pass ──────────────────────────────────────────────
            // Run a separate yt-dlp invocation with --skip-download to fetch only
            // subtitles AFTER the video is confirmed saved. Failure is non-fatal.
            // onDone() is called once subs finish (or immediately if no subs requested).
            const runSubtitlePass = (finalOutputPath, onDone) => {
                if (!downloadSubs && !autoSubs) { onDone(); return }

                // Signal renderer: subs phase starting (progress 95%)
                event.sender.send('ytdl-progress', { id, progress: 95, subsPhase: true })

                const finalDir  = require('path').dirname(finalOutputPath)
                const finalBase = require('path').basename(finalOutputPath, require('path').extname(finalOutputPath))
                const subTemplate = join(finalDir, finalBase + '.%(ext)s')

                const subArgs = [
                    '--skip-download',
                    '-o', subTemplate,
                    '--no-playlist',
                    '--newline',
                    '--extractor-args', 'generic:impersonate',
                    ...(nodePath ? ['--js-runtimes', `node:${nodePath}`] : []),
                    ...(cookiesFile ? ['--cookies', cookiesFile] : []),
                    ...(fs.existsSync(ffmpegPath) ? ['--ffmpeg-location', ffmpegPath] : []),
                ]
                if (downloadSubs) subArgs.push('--write-subs')
                if (autoSubs)     subArgs.push('--write-auto-subs')
                if (subLangs && subLangs !== 'all') subArgs.push('--sub-langs', subLangs)
                if (subFormat && subFormat !== 'best') subArgs.push('--convert-subs', subFormat)
                subArgs.push(url)

                console.log('[yt-dlp subs] spawn:', ytdlPath)
                console.log('[yt-dlp subs] args:', subArgs.join(' '))

                const subChild = spawn(ytdlPath, subArgs, { windowsHide: true })
                activeJobs.set(id + '_subs', { child: subChild, outputPath: null })
                subChild.stdout.on('data', d => {
                    const str = d.toString()
                    console.log('[yt-dlp subs stdout]', str.trimEnd())
                    event.sender.send('ytdl-output', { id, data: str })
                })
                subChild.stderr.on('data', d => {
                    const str = d.toString()
                    console.log('[yt-dlp subs stderr]', str.trimEnd())
                    event.sender.send('ytdl-output', { id, data: str })
                })
                subChild.on('close', subCode => {
                    console.log('[yt-dlp subs exit] code:', subCode)
                    activeJobs.delete(id + '_subs')
                    onDone()
                })
            }

            const localFfmpegPath = getFfmpegPath()
            if (convertAfterDownload && downloadedPath && fs.existsSync(downloadedPath) && fs.existsSync(localFfmpegPath)) {
                const ffmpegLib = require('fluent-ffmpeg')
                let hasVideo = false
                let inputDuration = null
                try {
                    const probeResult = await new Promise((res) => {
                        ffmpegLib.ffprobe(downloadedPath, (err, meta) => {
                            if (err) return res(null)
                            res(meta)
                        })
                    })
                    if (probeResult) {
                        hasVideo = !!(probeResult.streams && probeResult.streams.some(s => s.codec_type === 'video'))
                        inputDuration = probeResult.format?.duration ?? null
                    }
                } catch (_) {}

                if (!hasVideo) {
                    // Audio-only file — skip FFmpeg, move to output dir as-is
                    const audioExt = require('path').extname(downloadedPath)
                    const audioBase = (outputName || safeBase).replace(/_converted(\s*\(\d+\))?$/i, '').trimEnd()
                    let audioOut = join(resolvedDir, audioBase + audioExt)
                    if (fs.existsSync(audioOut)) {
                        let c = 1
                        while (fs.existsSync(join(resolvedDir, `${audioBase} (${c})${audioExt}`))) c++
                        audioOut = join(resolvedDir, `${audioBase} (${c})${audioExt}`)
                    }
                    try { fs.renameSync(downloadedPath, audioOut) } catch (_) {
                        try { fs.copyFileSync(downloadedPath, audioOut); fs.unlinkSync(downloadedPath) } catch (__) {}
                    }
                    runSubtitlePass(audioOut, () => {
                        event.sender.send('ytdl-exit', { id, code: 0, outputPath: audioOut })
                    })
                    return
                }

                // Notify renderer download is done, conversion starting
                _trayColor = '#f97316'
                event.sender.send('ytdl-exit', { id, code: 0, outputPath: downloadedPath, converting: true })

                const s = conversionSettings || { format: 'av_mp4', encoder: 'x265', encoderSpeed: 'slow', quality: 'medium', fps: 'source', resolution: 'source' }
                const rawBase = (outputName || safeBase).replace(/_converted(\s*\(\d+\))?$/i, '').trimEnd()
                const convertedBase = rawBase + '_converted'
                const ext = FORMAT_EXT[s.format] || 'mp4'

                let convertedPath = join(resolvedDir, convertedBase + '.' + ext)
                if (fs.existsSync(convertedPath)) {
                    let c = 1
                    while (fs.existsSync(join(resolvedDir, `${convertedBase} (${c}).${ext}`))) c++
                    convertedPath = join(resolvedDir, `${convertedBase} (${c}).${ext}`)
                }

                const os = require('os')
                const PASS_CODECS_CVT = new Set(['libx264', 'libx265', 'libsvtav1', 'libvpx', 'libvpx-vp9', 'libaom-av1'])
                const cvtEncoderCodec = ENCODER_CODEC_MAP[s.encoder || 'x265'] || 'libx265'
                const doCvtTwoPass = !!(s.multiPass) && PASS_CODECS_CVT.has(cvtEncoderCodec)
                const cvtPasslogfile = doCvtTwoPass ? join(os.tmpdir(), `gorex_cvt_pass_${id}`) : null
                const stderrLines = []

                const spawnCvtPass = (passMode) => new Promise((resolve) => {
                    const args = buildFfmpegArgs(downloadedPath, convertedPath, s, videoResolution, null, null, passMode)
                    event.sender.send('cli-output', `$ ${localFfmpegPath} ${args.join(' ')}\n`)
                    const ffChild = spawn(localFfmpegPath, args, { windowsHide: true })
                    activeJobs.set(id + '_cvt', { child: ffChild, outputPath: convertedPath })
                    ffChild.stdout.on('data', (d) => { event.sender.send('cli-output', d.toString()) })
                    ffChild.stderr.on('data', (d) => {
                        const str = d.toString()
                        stderrLines.push(str)
                        event.sender.send('cli-output', str)
                        if (inputDuration) {
                            const m = str.match(/time=(\d+):(\d+):([\d.]+)/)
                            if (m) {
                                const secs = parseInt(m[1]) * 3600 + parseInt(m[2]) * 60 + parseFloat(m[3])
                                let progress = Math.min(99, (secs / inputDuration) * 100)
                                if (doCvtTwoPass) {
                                    progress = passMode?.pass === 1 ? progress * 0.5 : 50 + progress * 0.5
                                }
                                event.sender.send('cli-progress', { id, progress })
                                if (activeJobs.has(id + '_cvt')) mainWindow?.setProgressBar(Math.min(0.99, progress / 100))
                            }
                        }
                    })
                    ffChild.on('error', (err) => {
                        activeJobs.delete(id + '_cvt')
                        stderrLines.push(err.message)
                        resolve(1)
                    })
                    ffChild.on('close', (code) => {
                        activeJobs.delete(id + '_cvt')
                        resolve(code)
                    })
                })

                const cleanupCvtPasslog = () => {
                    if (cvtPasslogfile) {
                        ;[cvtPasslogfile + '-0.log', cvtPasslogfile + '.log'].forEach(f => { try { fs.unlinkSync(f) } catch {} })
                    }
                }

                let ffCode
                if (doCvtTwoPass) {
                    const code1 = await spawnCvtPass({ pass: 1, passlogfile: cvtPasslogfile })
                    if (code1 !== 0) {
                        if (activeJobs.size === 0) mainWindow?.setProgressBar(-1)
                        cleanupCvtPasslog()
                        if (downloadedPath && fs.existsSync(downloadedPath)) {
                            try { fs.unlinkSync(downloadedPath) } catch (_) {}
                        }
                        return
                    }
                    ffCode = await spawnCvtPass({ pass: 2, passlogfile: cvtPasslogfile })
                    cleanupCvtPasslog()
                } else {
                    ffCode = await spawnCvtPass(null)
                }

                if (activeJobs.size === 0) mainWindow?.setProgressBar(-1)
                // Delete the temp downloaded file from Downloads_Temp after conversion
                if (downloadedPath && fs.existsSync(downloadedPath)) {
                    try { fs.unlinkSync(downloadedPath) } catch (_) {}
                }
                // If killed/errored, skip subtitle pass — partial output already deleted by stop handler
                if (ffCode !== 0) return
                runSubtitlePass(convertedPath, () => {
                    event.sender.send('cli-exit', { id, code: ffCode, outputPath: convertedPath, stderr: stderrLines.join('') })
                })
            } else {
                runSubtitlePass(downloadedPath, () => {
                    if (activeJobs.size === 0) mainWindow?.setProgressBar(-1)
                    event.sender.send('ytdl-exit', { id, code: 0, outputPath: downloadedPath })
                })
            }
        })
    })

    ipcMain.handle('get-video-data', async (event, filePaths) => {
        const ffmpeg = require('fluent-ffmpeg')
        const results = []

        // Ensure thumb directory exists
        const thumbDir = join(app.getPath('userData'), 'thumbnails')
        if (!require('fs').existsSync(thumbDir)) require('fs').mkdirSync(thumbDir)

        for (const [index, filePath] of filePaths.entries()) {
            try {
                const metadata = await new Promise((resolve, reject) => {
                    ffmpeg.ffprobe(filePath, (err, data) => {
                        if (err) reject(err)
                        else resolve(data)
                    })
                })

                const videoStream = metadata.streams.find(s => s.codec_type === 'video')
                const audioStream = metadata.streams.find(s => s.codec_type === 'audio')
                const duration = metadata.format.duration
                const formatDuration = (s) => {
                    const hrs = Math.floor(s / 3600)
                    const mins = Math.floor((s % 3600) / 60)
                    const secs = Math.floor(s % 60)
                    return `${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
                }

                const formatSize = (bytes) => {
                    if (!bytes) return '—'
                    const mb = bytes / (1024 * 1024)
                    if (mb < 1024) return mb.toFixed(1) + ' MB'
                    return (mb / 1024).toFixed(2) + ' GB'
                }

                const getFps = (stream) => {
                    if (!stream) return null
                    const r = stream.r_frame_rate || stream.avg_frame_rate
                    if (!r) return null
                    const [num, den] = r.split('/').map(Number)
                    if (!den) return null
                    const fps = num / den
                    return fps % 1 === 0 ? fps.toFixed(0) : fps.toFixed(3).replace(/\.?0+$/, '')
                }

                const getChannels = (stream) => {
                    if (!stream) return null
                    const ch = stream.channels
                    if (!ch) return null
                    if (ch === 1) return 'Mono'
                    if (ch === 2) return 'Stereo'
                    if (ch === 6) return '5.1'
                    if (ch === 8) return '7.1'
                    return `${ch}ch`
                }

                const getBitrate = (format) => {
                    const br = format?.bit_rate
                    if (!br) return null
                    const kbps = Math.round(br / 1000)
                    return kbps >= 1000 ? (kbps / 1000).toFixed(1) + ' Mbps' : kbps + ' kbps'
                }

                const thumbName = `thumb-${Date.now()}-${index}.jpg`
                const thumbPath = join(thumbDir, thumbName)

                const seekTime = duration ? Math.max(0, duration * 0.1) : 0
                let thumbBase64 = null
                try {
                    await new Promise((resolve, reject) => {
                        ffmpeg(filePath)
                            .seekInput(seekTime)
                            .frames(1)
                            .size('320x?')
                            .output(thumbPath)
                            .on('end', resolve)
                            .on('error', reject)
                            .run()
                    })
                    const thumbData = require('fs').readFileSync(thumbPath)
                    thumbBase64 = `data:image/jpeg;base64,${thumbData.toString('base64')}`
                } catch (thumbErr) {
                    console.warn(`Thumbnail failed for ${filePath}:`, thumbErr.message)
                }

                const rawName = filePath.split('\\').pop()
                const ext = rawName.includes('.') ? rawName.split('.').pop().toUpperCase() : ''
                const baseName = rawName.includes('.') ? rawName.split('.').slice(0, -1).join('.') : rawName

                results.push({
                    id: index,
                    title: baseName,
                    outputName: baseName,
                    container: ext || null,
                    path: filePath,
                    duration: formatDuration(duration),
                    durationSecs: duration || 0,
                    resolution: videoStream ? `${videoStream.width}x${videoStream.height}` : null,
                    videoCodec: videoStream?.codec_name?.toUpperCase() || null,
                    fps: getFps(videoStream),
                    audioCodec: audioStream?.codec_name?.toUpperCase() || null,
                    channels: getChannels(audioStream),
                    bitrate: getBitrate(metadata.format),
                    size: formatSize(metadata.format.size),
                    thumbnail: thumbBase64
                })
            } catch (err) {
                console.error(`Failed to process ${filePath}:`, err)
            }
        }
        return results
    })

    // ── FFmpeg argument builder ───────────────────────────────────────────────────
    const FORMAT_EXT = {
        av_mp4: 'mp4', av_mkv: 'mkv', av_webm: 'webm', av_mov: 'mov',
        av_avi: 'avi', av_flv: 'flv', av_ts: 'ts', av_ogg: 'ogg', av_3gp: '3gp',
    }

    const CODEC_RF_TABLE = {
        x264:          { high: 18, medium: 23, low: 30, potato: 51, lossless: 0  },
        x264_10bit:    { high: 18, medium: 23, low: 30, potato: 51, lossless: 0  },
        x265:          { high: 20, medium: 26, low: 34, potato: 51, lossless: 0  },
        x265_10bit:    { high: 20, medium: 26, low: 34, potato: 51, lossless: 0  },
        x265_12bit:    { high: 20, medium: 26, low: 34, potato: 51, lossless: 0  },
        svt_av1:       { high: 28, medium: 38, low: 50, potato: 63, lossless: 1  },
        svt_av1_10bit: { high: 28, medium: 38, low: 50, potato: 63, lossless: 1  },
        vp8:           { high: 5,  medium: 15, low: 30, potato: 63, lossless: 0  },
        vp9:           { high: 24, medium: 34, low: 46, potato: 63, lossless: 0  },
        vp9_10bit:     { high: 24, medium: 34, low: 46, potato: 63, lossless: 0  },
        nvenc_h264:    { high: 18, medium: 24, low: 32, potato: 51, lossless: 0  },
        nvenc_h265:    { high: 20, medium: 28, low: 38, potato: 51, lossless: 0  },
        nvenc_av1:     { high: 20, medium: 28, low: 38, potato: 51, lossless: 0  },
        qsv_h264:      { high: 18, medium: 24, low: 32, potato: 51, lossless: 0  },
        qsv_h265:      { high: 20, medium: 28, low: 38, potato: 51, lossless: 0  },
        qsv_av1:       { high: 20, medium: 28, low: 38, potato: 51, lossless: 0  },
        vce_h264:      { high: 18, medium: 24, low: 32, potato: 51, lossless: 0  },
        vce_h265:      { high: 20, medium: 28, low: 38, potato: 51, lossless: 0  },
        vce_av1:       { high: 20, medium: 28, low: 38, potato: 51, lossless: 0  },
        mf_h264:       { high: 18, medium: 24, low: 32, potato: 51, lossless: 0  },
        mf_h265:       { high: 20, medium: 28, low: 38, potato: 51, lossless: 0  },
        theora:        { high: 8,  medium: 6,  low: 3,  potato: 0,  lossless: 10 },
        libaom_av1:    { high: 24, medium: 33, low: 45, potato: 63, lossless: 0  },
        mpeg4:         { high: 3,  medium: 8,  low: 18, potato: 31, lossless: 1  },
        mpeg2video:    { high: 2,  medium: 6,  low: 15, potato: 31, lossless: 1  },
        mpeg1video:    { high: 2,  medium: 6,  low: 15, potato: 31, lossless: 1  },
        prores_ks:     { high: 3,  medium: 2,  low: 1,  potato: 0,  lossless: 5  },
        dnxhd:         { high: 3,  medium: 2,  low: 1,  potato: 0,  lossless: 3  },
        ffv1:          { high: 0,  medium: 0,  low: 0,  potato: 0,  lossless: 0  },
        huffyuv:       { high: 0,  medium: 0,  low: 0,  potato: 0,  lossless: 0  },
        mjpeg:         { high: 2,  medium: 8,  low: 18, potato: 31, lossless: 2  },
        wmv2:          { high: 2,  medium: 8,  low: 18, potato: 31, lossless: 2  },
        wmv1:          { high: 2,  medium: 8,  low: 18, potato: 31, lossless: 2  },
        h263p:         { high: 3,  medium: 8,  low: 18, potato: 31, lossless: 1  },
        h263:          { high: 3,  medium: 8,  low: 18, potato: 31, lossless: 1  },
        flv1:          { high: 3,  medium: 8,  low: 18, potato: 31, lossless: 1  },
    }

    // Video encoder name → FFmpeg codec name
    const ENCODER_CODEC_MAP = {
        x264:          'libx264',
        x264_10bit:    'libx264',
        x265:          'libx265',
        x265_10bit:    'libx265',
        x265_12bit:    'libx265',
        svt_av1:       'libsvtav1',
        svt_av1_10bit: 'libsvtav1',
        vp8:           'libvpx',
        vp9:           'libvpx-vp9',
        vp9_10bit:     'libvpx-vp9',
        nvenc_h264:    'h264_nvenc',
        nvenc_h265:    'hevc_nvenc',
        nvenc_av1:     'av1_nvenc',
        qsv_h264:      'h264_qsv',
        qsv_h265:      'hevc_qsv',
        qsv_av1:       'av1_qsv',
        vce_h264:      'h264_amf',
        vce_h265:      'hevc_amf',
        vce_av1:       'av1_amf',
        mf_h264:       'h264_mf',
        mf_h265:       'hevc_mf',
        theora:        'libtheora',
        // ── Additional / Legacy / Professional ─────────────────────────────────────────────────
        libaom_av1:    'libaom-av1',
        mpeg4:         'mpeg4',
        mpeg2video:    'mpeg2video',
        mpeg1video:    'mpeg1video',
        prores_ks:     'prores_ks',
        dnxhd:         'dnxhd',
        ffv1:          'ffv1',
        huffyuv:       'huffyuv',
        mjpeg:         'mjpeg',
        wmv2:          'wmv2',
        wmv1:          'wmv1',
        h263p:         'h263p',
        h263:          'h263',
        flv1:          'flv',
    }

    // Audio codec name → FFmpeg codec name
    const AUDIO_CODEC_MAP = {
        av_aac:   'aac',
        fdk_aac:  'libfdk_aac',
        fdk_haac: 'libfdk_aac',
        mp3:      'libmp3lame',
        ac3:      'ac3',
        eac3:     'eac3',
        vorbis:   'libvorbis',
        flac16:   'flac',
        flac24:   'flac',
        opus:     'libopus',
        alac:     'alac',
        pcm_s16le: 'pcm_s16le',
        pcm_s24le: 'pcm_s24le',
        pcm_f32le: 'pcm_f32le',
        mp2:      'mp2',
        wmav2:    'wmav2',
    }

    // Mixdown name → channel count
    const MIXDOWN_CHANNELS = {
        mono:      '1',
        stereo:    '2',
        dpl1:      '2',
        dpl2:      '2',
        '5point1': '6',
        '6point1': '7',
        '7point1': '8',
    }

    // Container format → FFmpeg -f value
    const CONTAINER_FORMAT = {
        av_mp4:  'mp4',
        av_mkv:  'matroska',
        av_webm: 'webm',
        av_mov:  'mov',
        av_avi:  'avi',
        av_flv:  'flv',
        av_ts:   'mpegts',
        av_ogg:  'ogg',
        av_3gp:  '3gp',
    }

    // Subtitle codec appropriate for the output container
    function subCodecForContainer(fmt) {
        if (fmt === 'av_mp4' || fmt === 'av_mov' || fmt === 'av_3gp') return 'mov_text'
        if (fmt === 'av_webm' || fmt === 'av_ogg') return 'webvtt'
        return 'srt'
    }

    // Build FFmpeg arguments for encoding.
    // clipStart / clipEnd are in seconds (numbers or null).
    function buildFfmpegArgs(filePath, outputPath, settings, videoResolution, clipStart = null, clipEnd = null, passMode = null) {
        const args = []

        // ── Hardware decoding (before -i) ──────────────────────────────────────────
        if (settings.hwDecoding === 'nvdec') {
            args.push('-hwaccel', 'nvdec')
        } else if (settings.hwDecoding === 'qsv') {
            args.push('-hwaccel', 'qsv')
        }

        // ── Input-side time seeking (fast, keyframe-accurate) ───────────────────────
        if (clipStart != null && clipStart > 0) {
            args.push('-ss', String(Math.max(0, clipStart)))
        }

        // ── External subtitle as second input (soft subs, no burn-in) ──────────────
        const extSubFile = settings.subtitleExternalFile || ''
        const subBurn = settings.subtitleBurn
        const subMode = settings.subtitleMode || 'none'
        const useExtSubAsInput = !!(extSubFile && !subBurn)

        args.push('-i', filePath)

        if (useExtSubAsInput) {
            args.push('-i', extSubFile)
        }

        // ── Clip duration limit ─────────────────────────────────────────────────────
        if (clipEnd != null) {
            const dur = Math.max(1, clipEnd - (clipStart ?? 0))
            args.push('-t', String(dur))
        }

        // ── Video codec ─────────────────────────────────────────────────────────────
        const WEBM_VIDEO = new Set(['vp8', 'vp9', 'vp9_10bit', 'svt_av1', 'svt_av1_10bit', 'nvenc_av1', 'qsv_av1', 'vce_av1', 'libaom_av1'])
        const OGG_VIDEO  = new Set(['theora', 'vp8', 'vp9', 'vp9_10bit'])
        const FLV_VIDEO  = new Set(['flv1', 'x264', 'x264_10bit', 'nvenc_h264', 'qsv_h264', 'vce_h264', 'mf_h264'])
        const GP3_VIDEO  = new Set(['h263', 'h263p', 'x264', 'x264_10bit', 'nvenc_h264', 'qsv_h264', 'vce_h264', 'mf_h264', 'mpeg4'])
        const WEBM_AUDIO = new Set(['vorbis', 'opus'])
        let encoder = settings.encoder || 'x265'
        if (settings.format === 'av_webm' && !WEBM_VIDEO.has(encoder)) encoder = 'vp9'
        if (settings.format === 'av_ogg'  && !OGG_VIDEO.has(encoder))  encoder = 'theora'
        if (settings.format === 'av_flv'  && !FLV_VIDEO.has(encoder))  encoder = 'flv1'
        if (settings.format === 'av_3gp'  && !GP3_VIDEO.has(encoder))  encoder = 'h263p'

        const ffCodec = ENCODER_CODEC_MAP[encoder] || 'libx265'
        args.push('-c:v', ffCodec)

        // Pixel format for 10/12-bit variants
        if (encoder.endsWith('_10bit')) {
            args.push('-pix_fmt', 'yuv420p10le')
        } else if (encoder.endsWith('_12bit')) {
            args.push('-pix_fmt', 'yuv420p12le')
        } else {
            // Encoders that only support 8-bit YUV: force yuv420p so that 10-bit HDR
            // sources (e.g. VP9 Profile 2 / H.265 Main10) don't cause "10 bit encode
            // not supported" failures at runtime.
            const EIGHT_BIT_ONLY_CODECS = new Set([
                'libx264', 'h264_nvenc', 'h264_qsv', 'h264_amf', 'h264_mf',
                'libvpx', 'libtheora',
                'mpeg4', 'mpeg2video', 'mpeg1video', 'mjpeg', 'wmv2', 'wmv1', 'h263', 'h263p', 'flv',
            ])
            if (EIGHT_BIT_ONLY_CODECS.has(ffCodec)) {
                args.push('-pix_fmt', 'yuv420p')
            }
        }

        // ── Encoder speed preset ────────────────────────────────────────────────────
        if (settings.encoderSpeed) {
            if (['libx264', 'libx265', 'libsvtav1'].includes(ffCodec)) {
                args.push('-preset', settings.encoderSpeed)
            } else if (['h264_nvenc', 'hevc_nvenc', 'av1_nvenc'].includes(ffCodec)) {
                args.push('-preset', settings.encoderSpeed)
            } else if (['h264_qsv', 'hevc_qsv', 'av1_qsv'].includes(ffCodec)) {
                args.push('-preset', settings.encoderSpeed)
            } else if (['h264_amf', 'hevc_amf', 'av1_amf'].includes(ffCodec)) {
                args.push('-quality', settings.encoderSpeed)
            } else if (['libvpx', 'libvpx-vp9'].includes(ffCodec)) {
                args.push('-deadline', settings.encoderSpeed)
            } else if (ffCodec === 'libaom-av1') {
                args.push('-cpu-used', settings.encoderSpeed)
            } else if (ffCodec === 'prores_ks') {
                args.push('-profile:v', settings.encoderSpeed)
            } else if (ffCodec === 'dnxhd') {
                args.push('-profile:v', settings.encoderSpeed)
            }
        }

        // ── Quality (CRF / CQ / global_quality / q:v) ──────────────────────────────
        const rfTable = CODEC_RF_TABLE[encoder] || CODEC_RF_TABLE.x265
        const rfValue = settings.quality === 'lossless'
            ? rfTable.lossless
            : settings.quality === 'custom'
                ? (settings.customQuality ?? rfTable.medium)
                : (rfTable[settings.quality] ?? rfTable.medium)

        if (['libx264', 'libx265', 'libsvtav1'].includes(ffCodec)) {
            args.push('-crf', String(rfValue))
        } else if (['libvpx', 'libvpx-vp9'].includes(ffCodec)) {
            args.push('-crf', String(rfValue), '-b:v', '0')
        } else if (ffCodec === 'libaom-av1') {
            args.push('-crf', String(rfValue), '-b:v', '0')
        } else if (['h264_nvenc', 'hevc_nvenc', 'av1_nvenc'].includes(ffCodec)) {
            if (settings.quality === 'lossless' && ffCodec !== 'av1_nvenc') {
                // NVENC H264/H265 lossless: constant-QP mode (Maxwell GPU+, no -preset needed)
                args.push('-rc', 'constqp', '-qp', '0')
            } else {
                // For NVENC, CQ=0 means "disabled/auto", not maximum quality like CRF=0.
                // Must set -rc vbr to activate CQ mode and clamp to minimum CQ=1.
                const cqVal = Math.max(1, rfValue)
                args.push('-rc', 'vbr', '-cq', String(cqVal))
            }
        } else if (['h264_qsv', 'hevc_qsv', 'av1_qsv'].includes(ffCodec)) {
            args.push('-global_quality', String(rfValue))
        } else if (['h264_amf', 'hevc_amf', 'av1_amf'].includes(ffCodec)) {
            args.push('-rc', 'qvbr', '-qvbr_quality_level', String(rfValue))
        } else if (['h264_mf', 'hevc_mf'].includes(ffCodec)) {
            args.push('-q', String(rfValue))
        } else if (ffCodec === 'libtheora') {
            args.push('-q:v', String(rfValue))
        } else if (['mpeg4', 'mpeg2video', 'mpeg1video', 'mjpeg', 'wmv2', 'wmv1', 'h263', 'h263p', 'flv'].includes(ffCodec)) {
            args.push('-q:v', String(rfValue))
        }
        // ffv1 and huffyuv are lossless — no quality argument needed

        // ── Hardware encoder two-pass / lookahead ───────────────────────────────────────────
        // Software codec two-pass is handled separately via passMode (-pass 1/2 -passlogfile).
        // Hardware encoders require vendor-specific flags instead of the log-file approach.
        if (settings.multiPass && !passMode) {
            if (['h264_nvenc', 'hevc_nvenc', 'av1_nvenc'].includes(ffCodec) && settings.quality !== 'lossless') {
                args.push('-multipass', 'fullres')
            } else if (['h264_qsv', 'hevc_qsv', 'av1_qsv'].includes(ffCodec)) {
                args.push('-look_ahead', '1')
            } else if (['h264_amf', 'hevc_amf', 'av1_amf'].includes(ffCodec)) {
                args.push('-preanalysis', '1')
            }
        }

        // ── Alpha channel: override pix_fmt when supported ──────────────────────────────────
        if (settings.alphaChannel) {
            const ALPHA_PIX_FMT = {
                'libvpx-vp9': 'yuva420p',
                'ffv1':       'yuva420p',
                'libaom-av1': 'yuva420p',
                'prores_ks':  'yuva444p10le',
            }
            const alphaFmt = ALPHA_PIX_FMT[ffCodec]
            if (alphaFmt) {
                const pfIdx = args.lastIndexOf('-pix_fmt')
                if (pfIdx >= 0) {
                    args[pfIdx + 1] = alphaFmt
                } else {
                    args.push('-pix_fmt', alphaFmt)
                }
            }
        }

        // ── HDR applicability ────────────────────────────────────────────────────────
        // Dynamic HDR metadata (HDR10+, Dolby Vision) is only meaningful for codecs
        // that can output at least 10-bit colour depth.
        const HDR_CAPABLE_CODECS = new Set([
            'libx265',   'hevc_nvenc', 'hevc_qsv',  'hevc_amf',
            'libsvtav1', 'av1_nvenc',  'av1_qsv',   'av1_amf', 'libaom-av1',
            'libvpx-vp9', 'ffv1', 'prores_ks', 'dnxhd',
        ])
        const hdrApplicable = !!(settings.hdrMetadata && settings.hdrMetadata !== 'off'
            && HDR_CAPABLE_CODECS.has(ffCodec))

        // ── Video filter chain ──────────────────────────────────────────────────────
        const vfFilters = []

        // Resolution scaling
        if (settings.resolution && settings.resolution !== 'source') {
            const heightMap = { '4k': 2160, '1440p': 1440, '1080p': 1080, '720p': 720, '480p': 480 }
            const targetH = heightMap[settings.resolution]
            if (targetH) {
                if (videoResolution) {
                    const [srcW, srcH] = videoResolution.split('x').map(Number)
                    if (srcW > 0 && srcH > 0) {
                        if (srcH > srcW) {
                            let outH = Math.round(srcH * (targetH / srcW))
                            if (outH % 2 !== 0) outH++
                            vfFilters.push(`scale=${targetH}:${outH}`)
                        } else {
                            let outW = Math.round(srcW * (targetH / srcH))
                            if (outW % 2 !== 0) outW++
                            vfFilters.push(`scale=${outW}:${targetH}`)
                        }
                    } else {
                        vfFilters.push(`scale=-2:${targetH}`)
                    }
                } else {
                    vfFilters.push(`scale=-2:${targetH}`)
                }
            }
        }

        // FPS
        if (settings.fps && settings.fps !== 'source') {
            vfFilters.push(`fps=${settings.fps}`)
        }

        // Deinterlace
        if (settings.deinterlace && settings.deinterlace !== 'off') {
            const bob = settings.deinterlace.includes('bob') ? 1 : 0
            if (settings.deinterlace.startsWith('bwdif')) {
                vfFilters.push(`bwdif=mode=${bob}:parity=-1:deint=0`)
            } else {
                vfFilters.push(`yadif=mode=${bob}:parity=-1:deint=0`)
            }
        }

        // Denoise
        if (settings.denoise && settings.denoise !== 'off') {
            const DENOISE_MAP = {
                'nlmeans_ultralight': 'hqdn3d=1:0.7:1:1.5',
                'nlmeans_light':      'hqdn3d=2:1.5:2:2.5',
                'nlmeans_medium':     'hqdn3d=3:2:3:3',
                'nlmeans_strong':     'hqdn3d=7:5:7:5',
                'hqdn3d_light':       'hqdn3d=2:1:2:3',
                'hqdn3d_medium':      'hqdn3d=3:2:2:3',
                'hqdn3d_strong':      'hqdn3d=7:7:7:5',
            }
            const f = DENOISE_MAP[settings.denoise]
            if (f) vfFilters.push(f)
        }

        // Deblock
        if (settings.deblock && settings.deblock !== 'off') {
            const DEBLOCK_MAP = {
                ultralight: 'deblock=filter=weak:block=4',
                light:      'deblock=filter=weak:block=4',
                medium:     'deblock=filter=strong:block=4',
                strong:     'deblock=filter=strong:block=8',
                stronger:   'deblock=filter=strong:block=8',
            }
            const f = DEBLOCK_MAP[settings.deblock] || 'deblock=filter=weak:block=4'
            vfFilters.push(f)
        }

        // Sharpen
        if (settings.sharpen && settings.sharpen !== 'off') {
            const SHARPEN_MAP = {
                'unsharp_ultralight':  'unsharp=5:5:0.5:5:5:0',
                'unsharp_light':       'unsharp=5:5:0.75:5:5:0',
                'unsharp_medium':      'unsharp=5:5:1.0:5:5:0',
                'unsharp_strong':      'unsharp=5:5:1.5:5:5:0',
                'lapsharp_ultralight': 'unsharp=5:5:0.5:5:5:0',
                'lapsharp_light':      'unsharp=5:5:0.75:5:5:0',
                'lapsharp_medium':     'unsharp=5:5:1.0:5:5:0',
                'lapsharp_strong':     'unsharp=5:5:1.5:5:5:0',
            }
            const f = SHARPEN_MAP[settings.sharpen]
            if (f) vfFilters.push(f)
        }

        // Grayscale
        if (settings.grayscale) vfFilters.push('hue=s=0')

        // Rotate / flip
        if (settings.rotate && settings.rotate !== '0') {
            const ROT_MAP = {
                '90':    'transpose=1',
                '180':   'vflip,hflip',
                '270':   'transpose=2',
                'hflip': 'hflip',
            }
            const r = ROT_MAP[settings.rotate]
            if (r) vfFilters.push(r)
        }

        // Subtitle burn-in via filter
        if (extSubFile && subBurn) {
            const escaped = extSubFile.replace(/\\/g, '/').replace(/:/g, '\\:')
            vfFilters.push(`subtitles='${escaped}'`)
        }

        // HDR metadata: tag colour-space info in the filter graph so scalers/
        // converters downstream preserve BT.2020 primaries and PQ transfer.
        if (hdrApplicable) {
            vfFilters.push('setparams=color_primaries=bt2020:color_trc=smpte2084:colorspace=bt2020nc:range=tv')
        }

        if (vfFilters.length > 0) {
            args.push('-vf', vfFilters.join(','))
        }

        // HDR metadata: stream-level colour tags (effective even without a filter chain)
        if (hdrApplicable) {
            args.push('-color_primaries', 'bt2020')
            args.push('-color_trc',       'smpte2084')
            args.push('-colorspace',      'bt2020nc')
            args.push('-color_range',     'tv')
        }

        // CFR mode
        if (settings.fps && settings.fps !== 'source' && (settings.fpsMode || 'vfr') === 'cfr') {
            args.push('-vsync', 'cfr')
        }

        // ── Audio ────────────────────────────────────────────────────────────────────
        if (settings.noAudio || passMode?.pass === 1) {
            args.push('-an')
        } else {
            let audioCodec = settings.audioCodec || 'av_aac'
            if (settings.format === 'av_webm' && !WEBM_AUDIO.has(audioCodec) && !audioCodec.startsWith('copy')) {
                audioCodec = 'opus'
            }
            if (settings.format === 'av_ogg' && !WEBM_AUDIO.has(audioCodec) && !audioCodec.startsWith('copy')) {
                audioCodec = 'vorbis'
            }
            if (audioCodec.startsWith('copy')) {
                args.push('-c:a', 'copy')
            } else {
                const ffAudio = AUDIO_CODEC_MAP[audioCodec] || 'aac'
                args.push('-c:a', ffAudio)
                if (audioCodec === 'fdk_haac') args.push('-profile:a', 'aac_he')
                if (audioCodec === 'flac24')   args.push('-sample_fmt', 's32')
                if (audioCodec === 'pcm_s24le') args.push('-sample_fmt', 's32')
                const noBitrateCodecs = ['flac16', 'flac24', 'pcm_s16le', 'pcm_s24le', 'pcm_f32le', 'alac']
                if (!noBitrateCodecs.includes(audioCodec)) {
                    args.push('-b:a', `${settings.audioBitrate || 160}k`)
                }
                const channels = MIXDOWN_CHANNELS[settings.audioMixdown] || '2'
                args.push('-ac', channels)
                if (settings.audioSampleRate && settings.audioSampleRate !== 'auto') {
                    args.push('-ar', settings.audioSampleRate)
                }
            }
        }

        // ── Subtitle stream mapping, metadata, chapters (pass 2 / single-pass only) ──
        if (!passMode || passMode.pass !== 1) {
            if (extSubFile && subBurn) {
                // Burned into video — drop any existing subtitle streams
                args.push('-sn')
            } else if (useExtSubAsInput) {
                args.push('-map', '0:v:0', '-map', '0:a?', '-map', '1:0')
                args.push('-c:s', subCodecForContainer(settings.format))
            } else if (subMode === 'first' || subMode === 'scan_forced') {
                args.push('-map', '0:v:0', '-map', '0:a?', '-map', '0:s:0?')
                args.push('-c:s', subCodecForContainer(settings.format))
            } else if (subMode === 'all') {
                args.push('-map', '0:v:0', '-map', '0:a?', '-map', '0:s?')
                args.push('-c:s', subCodecForContainer(settings.format))
            } else {
                args.push('-sn')
            }

            // ── Metadata ──────────────────────────────────────────────────────────────
            args.push('-map_metadata', settings.keepMetadata ? '0' : '-1')

            // ── Chapter markers ───────────────────────────────────────────────────────
            args.push('-map_chapters', settings.chapterMarkers !== false ? '0' : '-1')
        }

        // ── x265-params: HDR metadata + inline parameter sets (merged) ─────────────
        // Both options may contribute x265-params; FFmpeg only honours the last
        // occurrence, so we accumulate all parts and emit a single flag.
        {
            const x265Parts = []
            if (hdrApplicable && ffCodec === 'libx265') {
                // hdr-opt=1  : copy mastering-display / MaxCLL SEI from source
                // repeat-headers : embed VPS/SPS/PPS at every keyframe (required for
                //                  HDR10+ streams in HLS/DASH and for some players)
                x265Parts.push('hdr-opt=1', 'repeat-headers=1')
            }
            if (settings.inlineParamSets) {
                if (ffCodec === 'libx264') {
                    args.push('-x264-params', 'repeat_headers=1')
                } else if (ffCodec === 'libx265' && !x265Parts.includes('repeat-headers=1')) {
                    x265Parts.push('repeat-headers=1')
                }
            }
            if (x265Parts.length > 0) {
                args.push('-x265-params', x265Parts.join(':'))
            }
        }

        // ── Two-pass encoding ────────────────────────────────────────────────────────
        const TWO_PASS_CODECS = new Set(['libx264', 'libx265', 'libsvtav1', 'libvpx', 'libvpx-vp9', 'libaom-av1'])
        if (passMode && TWO_PASS_CODECS.has(ffCodec)) {
            args.push('-pass', String(passMode.pass), '-passlogfile', passMode.passlogfile)
        }

        // ── MP4 fast-start (pass 2 / single-pass only) ──────────────────────────────
        if ((!passMode || passMode.pass !== 1) && settings.optimizeMP4 && settings.format === 'av_mp4') {
            args.push('-movflags', '+faststart')
        }

        // ── Container format + output ───────────────────────────────────────────────
        if (passMode?.pass === 1 && TWO_PASS_CODECS.has(ffCodec)) {
            args.push('-f', 'null', process.platform === 'win32' ? 'NUL' : '/dev/null')
        } else {
            args.push('-f', CONTAINER_FORMAT[settings.format] || 'mp4')
            args.push(outputPath)
        }

        return args
    }

    // IPC handler — FFmpeg encoding
    ipcMain.on('run-cli', async (event, { filePath, settings, id, outputMode, customOutputDir, outputName, videoResolution, clipStart, clipEnd }) => {
        _trayColor = '#f97316'
        const ffmpegPath = getFfmpegPath()
        const fs = require('fs')
        const rawBase = outputName || filePath.split('\\').pop().split('.').slice(0, -1).join('.')
        // Strip an existing _converted suffix so we don't accumulate them
        const strippedBase = rawBase.replace(/_converted(\s*\(\d+\))?$/i, '').trimEnd()
        const convertedBase = strippedBase + '_converted'
        const ext = (settings && FORMAT_EXT[settings.format]) || 'mkv'

        let outputDir
        if (outputMode === 'source') {
            outputDir = dirname(filePath)
        } else if (outputMode === 'custom' && customOutputDir) {
            outputDir = customOutputDir
        } else {
            outputDir = customOutputDir || app.getPath('videos')
            if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })
        }

        // Find a unique path to avoid overwriting
        let outputPath = join(outputDir, convertedBase + '.' + ext)
        if (fs.existsSync(outputPath)) {
            let counter = 1
            while (fs.existsSync(join(outputDir, convertedBase + ' (' + counter + ').' + ext))) counter++
            outputPath = join(outputDir, convertedBase + ' (' + counter + ').' + ext)
        }

        const fallbackSettings = settings || { format: 'av_mkv', encoder: 'x265', encoderSpeed: 'slow', quality: 'high', fps: 'source', resolution: 'source' }

        // Probe input file duration for progress calculation
        let inputDuration = null
        try {
            const fluentFfmpeg = require('fluent-ffmpeg')
            inputDuration = await new Promise((res) => {
                fluentFfmpeg.ffprobe(filePath, (err, meta) => {
                    res(err ? null : (meta?.format?.duration ?? null))
                })
            })
        } catch (_) {}

        // Effective duration for progress bar
        const effectiveDuration = (clipStart != null || clipEnd != null)
            ? Math.max(1, (clipEnd ?? (inputDuration || 0)) - (clipStart ?? 0))
            : (inputDuration || null)

        const os = require('os')
        const PASS_CODECS = new Set(['libx264', 'libx265', 'libsvtav1', 'libvpx', 'libvpx-vp9', 'libaom-av1'])
        const encoderForPass = ENCODER_CODEC_MAP[fallbackSettings.encoder || 'x265'] || 'libx265'
        const doTwoPass = !!(fallbackSettings.multiPass) && PASS_CODECS.has(encoderForPass)
        const passlogfile = doTwoPass ? join(os.tmpdir(), `gorex_pass_${id}`) : null

        const stderrLines = []

        const spawnPass = (passMode) => new Promise((resolve) => {
            const args = buildFfmpegArgs(filePath, outputPath, fallbackSettings, videoResolution, clipStart, clipEnd, passMode)
            console.log(`[ffmpeg] spawn: ${ffmpegPath}`)
            console.log(`[ffmpeg] args: ${args.join(' ')}`)
            event.sender.send('cli-output', `$ ${ffmpegPath} ${args.join(' ')}\n`)

            const child = spawn(ffmpegPath, args, { windowsHide: true })
            activeJobs.set(id, { child, outputPath })

            child.stdout.on('data', (data) => {
                event.sender.send('cli-output', data.toString())
            })

            child.stderr.on('data', (data) => {
                const str = data.toString()
                stderrLines.push(str)
                event.sender.send('cli-output', str)
                if (effectiveDuration) {
                    const m = str.match(/time=(\d+):(\d+):([\d.]+)/)
                    if (m) {
                        const secs = parseInt(m[1]) * 3600 + parseInt(m[2]) * 60 + parseFloat(m[3])
                        let progress = Math.min(99, (secs / effectiveDuration) * 100)
                        if (doTwoPass) {
                            progress = passMode?.pass === 1 ? progress * 0.5 : 50 + progress * 0.5
                        }
                        event.sender.send('cli-progress', { id, progress })
                        if (activeJobs.has(id)) mainWindow?.setProgressBar(progress / 100)
                    }
                }
            })

            child.on('error', (err) => {
                activeJobs.delete(id)
                stderrLines.push(err.message)
                if (activeJobs.size === 0) mainWindow?.setProgressBar(-1)
                resolve(1)
            })

            child.on('close', (code) => {
                activeJobs.delete(id)
                resolve(code)
            })
        })

        const cleanupPasslog = () => {
            if (passlogfile) {
                const _fs = require('fs')
                ;[passlogfile + '-0.log', passlogfile + '.log'].forEach(f => { try { _fs.unlinkSync(f) } catch {} })
            }
        }

        if (doTwoPass) {
            const code1 = await spawnPass({ pass: 1, passlogfile })
            if (code1 !== 0) {
                cleanupPasslog()
                if (activeJobs.size === 0) mainWindow?.setProgressBar(-1)
                event.sender.send('cli-exit', { id, code: code1, outputPath, stderr: stderrLines.join('') })
                return
            }
            const code2 = await spawnPass({ pass: 2, passlogfile })
            cleanupPasslog()
            if (activeJobs.size === 0) mainWindow?.setProgressBar(-1)
            event.sender.send('cli-exit', { id, code: code2, outputPath, stderr: stderrLines.join('') })
        } else {
            const code = await spawnPass(null)
            if (activeJobs.size === 0) mainWindow?.setProgressBar(-1)
            event.sender.send('cli-exit', { id, code, outputPath, stderr: stderrLines.join('') })
        }
    })

    ipcMain.on('stop-all-cli', () => {
        const fs = require('fs')

        const cleanupJob = (outputPath, jDownloadDir, jDownloadBase, isTempDownload, trackedPaths) => {
            // Delete exact paths yt-dlp reported (most reliable)
            if (trackedPaths) {
                for (const p of trackedPaths) {
                    try { if (fs.existsSync(p)) fs.unlinkSync(p) } catch (_) {}
                }
            }
            // Delete the output file (e.g. partial FFmpeg output or converted file)
            if (outputPath) {
                try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath) } catch (_) {}
            }
            // Fallback: scan dir for any remaining partial files with matching prefix
            if (jDownloadDir && jDownloadBase) {
                try {
                    fs.readdirSync(jDownloadDir)
                        .filter(f => {
                            if (!f.startsWith(jDownloadBase)) return false
                            if (isTempDownload) return true
                            return /\.(part|ytdl|ytdlpart)$/.test(f) || /\.f\d+\.[a-z0-9]+$/.test(f)
                        })
                        .forEach(f => { try { fs.unlinkSync(join(jDownloadDir, f)) } catch (_) {} })
                } catch (_) {}
            }
        }

        for (const [jobId, { child, outputPath, downloadDir: jDownloadDir, downloadBase: jDownloadBase, isTempDownload, trackedPaths }] of activeJobs) {
            try {
                if (process.platform === 'win32' && child.pid) {
                    // Run cleanup AFTER taskkill so files are no longer locked
                    exec(`taskkill /F /T /PID ${child.pid}`, () => {
                        cleanupJob(outputPath, jDownloadDir, jDownloadBase, isTempDownload, trackedPaths)
                    })
                } else {
                    child.kill()
                    cleanupJob(outputPath, jDownloadDir, jDownloadBase, isTempDownload, trackedPaths)
                }
            } catch (_) {
                cleanupJob(outputPath, jDownloadDir, jDownloadBase, isTempDownload, trackedPaths)
            }
            activeJobs.delete(jobId)
        }
        mainWindow?.setProgressBar(-1)
    })

    ipcMain.on('pause-all-cli', () => {
        for (const { child } of activeJobs.values()) {
            if (child.pid) {
                exec(`powershell -Command "Suspend-Process -Id ${child.pid}"`)
            }
        }
    })

    ipcMain.on('resume-all-cli', () => {
        for (const { child } of activeJobs.values()) {
            if (child.pid) {
                exec(`powershell -Command "Resume-Process -Id ${child.pid}"`)
            }
        }
    })

    ipcMain.handle('get-gpu-info', async () => {
        const VENDOR_LABELS = { nvidia: 'NVIDIA', amd: 'AMD', intel: 'Intel' }
        const priority = { nvidia: 3, amd: 2, intel: 1, unknown: 0 }

        const vendorOfName = (n) => {
            n = n.toLowerCase()
            if (n.includes('nvidia')) return 'nvidia'
            if (n.includes('amd') || n.includes('radeon')) return 'amd'
            if (n.includes('intel')) return 'intel'
            return 'unknown'
        }

        // Get GPU names — platform-aware, no PowerShell dependency on non-Windows
        const getGpuNames = () => new Promise(res => {
            const { platform } = process

            if (platform === 'win32') {
                // Primary: WMI via PowerShell (ships with every Windows since Vista)
                const ps = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'
                exec(
                    `"${ps}" -NoProfile -NonInteractive -Command "Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name"`,
                    { timeout: 8000, windowsHide: true },
                    (err, stdout) => {
                        if (!err && stdout.trim()) {
                            return res(stdout.split(/\r?\n/).map(s => s.trim()).filter(Boolean))
                        }
                        // Fallback: wmic (deprecated but available on older Windows)
                        exec('wmic path win32_VideoController get name /value', { timeout: 5000, windowsHide: true }, (err2, stdout2) => {
                            if (err2) return res([])
                            res(stdout2.split(/\r?\n/)
                                .filter(l => /^Name=/i.test(l))
                                .map(l => l.replace(/^Name=/i, '').trim())
                                .filter(Boolean))
                        })
                    }
                )
            } else if (platform === 'darwin') {
                // macOS: system_profiler returns GPU info in plain text
                exec("system_profiler SPDisplaysDataType | grep 'Chipset Model' | awk -F': ' '{print $2}'", { timeout: 8000 }, (err, stdout) => {
                    if (!err && stdout.trim()) {
                        return res(stdout.split(/\r?\n/).map(s => s.trim()).filter(Boolean))
                    }
                    res([])
                })
            } else {
                // Linux: lspci lists PCI devices including GPUs
                exec("lspci | grep -Ei 'vga|3d controller|display controller'", { timeout: 5000 }, (err, stdout) => {
                    if (!err && stdout.trim()) {
                        // Strip PCI address prefix, keep device description
                        return res(stdout.split(/\r?\n/)
                            .map(l => l.replace(/^[\da-f:.]+\s+\w[^:]+:\s*/i, '').trim())
                            .filter(Boolean))
                    }
                    res([])
                })
            }
        })

        const names = await getGpuNames()

        // Detect vendor from names
        let finalVendor = 'unknown'
        if (names.length > 0) {
            let bestName = null
            for (const name of names) {
                if (!bestName || priority[vendorOfName(name)] > priority[vendorOfName(bestName)]) {
                    bestName = name
                }
            }
            finalVendor = vendorOfName(bestName)
        }

        // If names yielded nothing, try Electron's built-in GPU info (PCI IDs)
        if (finalVendor === 'unknown') {
            const VENDOR_IDS = { 4318: 'nvidia', 4098: 'amd', 32902: 'intel' } // 0x10DE, 0x1002, 0x8086
            try {
                const info = await app.getGPUInfo('basic')
                const devices = info.gpuDevice || []
                let best = null
                for (const d of devices) {
                    const v = VENDOR_IDS[d.vendorId] || 'unknown'
                    if (!best || priority[v] > priority[VENDOR_IDS[best.vendorId] || 'unknown']) best = d
                }
                if (best) finalVendor = VENDOR_IDS[best.vendorId] || 'unknown'
            } catch {}
        }

        // Build list — always non-empty when vendor is known
        const gpuList = names.length > 0
            ? names
            : (finalVendor !== 'unknown' ? [`${VENDOR_LABELS[finalVendor]} GPU`] : [])

        const primaryGpu = gpuList.find(n => vendorOfName(n) === finalVendor)
            || gpuList[0]
            || null

        return { gpus: gpuList, vendor: finalVendor, primaryGpu }
    })

    // Inject a Referer header for all YouTube requests so the embedded player
    // does not return error 153 when loaded from a local (file://) origin.
    // Without a valid Referer, YouTube embed blocks playback server-side.
    session.defaultSession.webRequest.onBeforeSendHeaders(
        { urls: ['*://*.youtube.com/*', '*://*.youtube-nocookie.com/*', '*://*.googlevideo.com/*', '*://*.ytimg.com/*'] },
        (details, callback) => {
            const headers = { ...details.requestHeaders }
            if (!headers['Referer'] && !headers['referer']) {
                headers['Referer'] = 'https://www.youtube.com/'
            }
            callback({ requestHeaders: headers })
        }
    )

    createWindow()
    createTray()

    // Intercept native window close button (Alt+F4, taskbar close etc.)
    mainWindow.on('close', (e) => {
        if (!isQuitting && isBackgroundModeEnabled()) {
            e.preventDefault()
            mainWindow.hide()
        }
    })

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
        else mainWindow?.show()
    })
})

app.on('before-quit', () => {
    isQuitting = true
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
