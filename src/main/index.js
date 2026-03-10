import { app, shell, BrowserWindow, ipcMain, dialog, session, protocol, net } from 'electron'
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

// ─── CLI path resolution ────────────────────────────────────────────────────────────────
function getCLIPath() {
    if (is.dev) {
        return join(app.getAppPath(), 'resources', 'HandBrakeCLI.exe')
    }
    return join(dirname(process.execPath), 'resources', 'HandBrakeCLI.exe')
}

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
            '  и укажите этот файл в Настройках → Cookies браузера → Файл cookies.txt\n\n' +
            'Исходная ошибка:\n' + raw
        )
    }
    return raw
}

const activeJobs = new Map() // id -> child process
let ytdlFetchActiveChildren = new Set()
let ytdlFetchCancelled = false

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
    const mainWindow = new BrowserWindow({
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
        BrowserWindow.getFocusedWindow()?.close()
    })
    ipcMain.on('open-devtools', () => {
        BrowserWindow.getFocusedWindow()?.webContents.openDevTools()
    })

    // IPC handlers for HandBrake CLI
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
        const cliPath = getCLIPath()
        const fs = require('fs')
        if (!fs.existsSync(cliPath)) {
            return { found: false, version: null, path: cliPath }
        }
        return new Promise((resolve) => {
            const child = spawn(cliPath, ['--version'])
            let output = ''
            child.stdout.on('data', d => { output += d.toString() })
            child.stderr.on('data', d => { output += d.toString() })
            child.on('close', () => {
                const versionMatch = output.match(/HandBrake\s+([\d.]+)/i)
                resolve({
                    found: true,
                    version: versionMatch ? versionMatch[1] : output.trim().split('\n')[0],
                    path: cliPath
                })
            })
            child.on('error', () => {
                resolve({ found: false, version: null, path: cliPath })
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
            throw new Error(ytdlFriendlyErr(raw))
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
            throw new Error(ytdlFriendlyErr(raw))
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
            throw new Error(ytdlFriendlyErr(raw))
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
        const fs = require('fs')
        const ytdlPath = getYtdlPath()
        const cliPath = getCLIPath()

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

        // When converting after download, use an ASCII-only temp filename.
        // HandBrakeCLI (MinGW build) cannot handle non-ASCII paths because its C
        // runtime decodes argv via the system ANSI code page, garbling Unicode.
        const downloadBase = convertAfterDownload ? `gorex_temp_${id}_${Date.now()}` : safeBase
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
        activeJobs.set(id, { child, outputPath: null })

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
                }
            }
        }

        child.stdout.on('data', (data) => {
            const str = data.toString()
            console.log('[yt-dlp stdout]', str.trimEnd())
            event.sender.send('ytdl-output', { id, data: str })

            parseProgress(str, false)

            // Capture destination path
            const destMatch = str.match(/\[download\] Destination:\s+(.+)/)
            if (destMatch) downloadedPath = destMatch[1].trim()

            // yt-dlp ≥ 2023 uses [ffmpeg] prefix; older builds used [Merger]
            const mergeMatch = str.match(/\[(?:Merger|ffmpeg)\] Merging formats into "(.+)"/)
            if (mergeMatch) downloadedPath = mergeMatch[1].trim()

            const alreadyMatch = str.match(/\[download\] (.+) has already been downloaded/)
            if (alreadyMatch) downloadedPath = alreadyMatch[1].trim()
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
            event.sender.send('ytdl-exit', { id, code: 1, error: err.message })
        })

        child.on('close', async (code) => {
            console.log('[yt-dlp exit] code:', code)
            activeJobs.delete(id)

            if (code !== 0) {
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

            // Before passing to HandBrake, verify the file actually has a video stream.
            // yt-dlp may have left an audio-only temp file (e.g. .f251.webm) if the
            // merger message format wasn't recognised or the selected format is audio-only.

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
                    onDone()
                })
            }

            if (convertAfterDownload && downloadedPath && fs.existsSync(downloadedPath) && fs.existsSync(cliPath)) {
                const ffmpeg = require('fluent-ffmpeg')
                let hasVideo = false
                try {
                    hasVideo = await new Promise((res) => {
                        ffmpeg.ffprobe(downloadedPath, (err, meta) => {
                            if (err) return res(false)
                            res(!!(meta && meta.streams && meta.streams.some(s => s.codec_type === 'video')))
                        })
                    })
                } catch (_) { hasVideo = false }

                if (!hasVideo) {
                    // Audio-only file — skip HandBrake, move to output dir as-is
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

                const args = buildCliArgs(downloadedPath, convertedPath, s, videoResolution)
                const stderrLines = []
                const hbChild = spawn(cliPath, args)
                activeJobs.set(id + '_cvt', { child: hbChild, outputPath: convertedPath })

                hbChild.stdout.on('data', (d) => {
                    const str = d.toString()
                    let pv = null
                    const em = str.match(/Encoding:.*?([\d.]+)\s*%/)
                    if (em) {
                        pv = parseFloat(em[1])
                    } else {
                        const all = [...str.matchAll(/([\d.]+)\s*%/g)]
                        if (all.length > 0) pv = parseFloat(all[all.length - 1][1])
                    }
                    if (pv !== null && pv <= 100) event.sender.send('cli-progress', { id, progress: pv })
                })

                hbChild.stderr.on('data', (d) => { stderrLines.push(d.toString()) })

                hbChild.on('close', (hbCode) => {
                    activeJobs.delete(id + '_cvt')
                    // Delete the temp downloaded file from Downloads_Temp after conversion
                    if (downloadedPath && fs.existsSync(downloadedPath)) {
                        try { fs.unlinkSync(downloadedPath) } catch (_) {}
                    }
                    runSubtitlePass(convertedPath, () => {
                        event.sender.send('cli-exit', { id, code: hbCode, outputPath: convertedPath, stderr: stderrLines.join('') })
                    })
                })
            } else {
                runSubtitlePass(downloadedPath, () => {
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

    // ── CLI argument builder ──────────────────────────────────────────────────────
    const FORMAT_EXT = { av_mp4: 'mp4', av_mkv: 'mkv', av_webm: 'webm', av_mov: 'mov' }

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
    }

    function getResolutionArgs(resolutionKey, videoResolution) {
        const heightMap = { '4k': 2160, '1440p': 1440, '1080p': 1080, '720p': 720, '480p': 480 }
        const targetShort = heightMap[resolutionKey]
        if (!targetShort) return []

        if (videoResolution) {
            const parts = videoResolution.split('x')
            if (parts.length === 2) {
                const srcW = parseInt(parts[0], 10)
                const srcH = parseInt(parts[1], 10)
                if (srcW > 0 && srcH > 0) {
                    const isPortrait = srcH > srcW
                    let outW, outH
                    if (isPortrait) {
                        // Portrait: 480p means width = 480
                        outW = targetShort
                        outH = Math.round(srcH * (targetShort / srcW))
                        if (outH % 2 !== 0) outH++
                    } else {
                        // Landscape: 480p means height = 480
                        outH = targetShort
                        outW = Math.round(srcW * (targetShort / srcH))
                        if (outW % 2 !== 0) outW++
                    }
                    return ['--width', String(outW), '--height', String(outH)]
                }
            }
        }

        // Fallback when source resolution is unknown
        return ['--maxHeight', String(targetShort), '--keep-display-aspect']
    }

    function buildCliArgs(filePath, outputPath, settings, videoResolution) {
        const args = ['-i', filePath, '-o', outputPath]

        // Container format
        if (settings.format) args.push('-f', settings.format)

        // Video encoder
        let encoder = settings.encoder || 'x265'

        // WebM only supports VP8 / VP9 / AV1 video and Vorbis / Opus audio.
        // Auto-correct incompatible encoder/audio if the user somehow saved bad settings.
        const WEBM_VIDEO = new Set(['vp8', 'vp9', 'vp9_10bit', 'svt_av1', 'svt_av1_10bit', 'nvenc_av1', 'qsv_av1', 'vce_av1'])
        const WEBM_AUDIO = new Set(['vorbis', 'opus'])
        if (settings.format === 'av_webm' && !WEBM_VIDEO.has(encoder)) {
            encoder = 'vp9'
        }
        args.push('-e', encoder)

        // Encoder speed preset
        if (settings.encoderSpeed) args.push('--encoder-preset', settings.encoderSpeed)

        // Quality (RF / CRF)
        const rfTable = CODEC_RF_TABLE[encoder] || CODEC_RF_TABLE.x265
        const rfValue = settings.quality === 'lossless'
            ? rfTable.lossless
            : settings.quality === 'custom'
                ? settings.customQuality
                : (rfTable[settings.quality] ?? rfTable.medium)
        args.push('-q', String(rfValue))

        // Resolution scaling
        if (settings.resolution && settings.resolution !== 'source') {
            args.push(...getResolutionArgs(settings.resolution, videoResolution))
        }

        // Frame rate + mode
        if (settings.fps && settings.fps !== 'source') {
            const fpsMode = settings.fpsMode || 'pfr'
            args.push('-r', settings.fps, `--${fpsMode}`)
        } else if (settings.fpsMode && settings.fpsMode !== 'vfr') {
            args.push(`--${settings.fpsMode}`)
        }

        // Hardware decoding
        if (settings.hwDecoding && settings.hwDecoding !== 'none') {
            args.push('--enable-hw-decoding', settings.hwDecoding)
        }

        // Multi-pass
        if (settings.multiPass) {
            args.push('--multi-pass')
        }

        // Audio
        if (settings.noAudio) {
            args.push('-a', 'none')
        } else {
            let audioCodec = settings.audioCodec || 'av_aac'
            if (settings.format === 'av_webm' && !WEBM_AUDIO.has(audioCodec) && !audioCodec.startsWith('copy')) {
                audioCodec = 'opus'
            }
            args.push('-a', '1', '-E', audioCodec)
            if (!audioCodec.startsWith('copy')) {
                args.push('-B', String(settings.audioBitrate || '160'))
                args.push('-6', settings.audioMixdown || 'stereo')
            }
            if (settings.audioSampleRate && settings.audioSampleRate !== 'auto') {
                args.push('-R', settings.audioSampleRate)
            }
        }

        // Chapter markers (default on)
        if (settings.chapterMarkers !== false) {
            args.push('-m')
        } else {
            args.push('--no-markers')
        }

        // Optimize MP4 for HTTP streaming
        if (settings.optimizeMP4 && settings.format === 'av_mp4') {
            args.push('-O')
        }

        // ─ Filters ───────────────────────────────────────────────────────
        // Deinterlace
        if (settings.deinterlace && settings.deinterlace !== 'off') {
            if (settings.deinterlace.startsWith('bwdif')) {
                args.push(`--bwdif=${settings.deinterlace.replace('bwdif_', '')}`)
            } else {
                args.push(`--yadif=${settings.deinterlace.replace('yadif_', '')}`)
            }
        }

        // Denoise
        if (settings.denoise && settings.denoise !== 'off') {
            const parts = settings.denoise.split('_')
            const denoiseType = parts[0]
            const denoisePreset = parts.slice(1).join('_') || 'medium'
            args.push(`--${denoiseType}=${denoisePreset}`)
        }

        // Deblock
        if (settings.deblock && settings.deblock !== 'off') {
            args.push(`--deblock=${settings.deblock}`)
        }

        // Sharpen
        if (settings.sharpen && settings.sharpen !== 'off') {
            const parts = settings.sharpen.split('_')
            const sharpenType = parts[0]
            const sharpenPreset = parts.slice(1).join('_') || 'medium'
            args.push(`--${sharpenType}=${sharpenPreset}`)
        }

        // Grayscale
        if (settings.grayscale) args.push('--grayscale')

        // Rotate
        if (settings.rotate && settings.rotate !== '0') {
            const rotateMap = {
                '90': 'angle=90:hflip=0',
                '180': 'angle=180:hflip=0',
                '270': 'angle=270:hflip=0',
                'hflip': 'angle=0:hflip=1',
            }
            const rotateArg = rotateMap[settings.rotate]
            if (rotateArg) args.push(`--rotate=${rotateArg}`)
        }

        // ─ HDR & Meta ───────────────────────────────────────────────────
        if (settings.hdrMetadata && settings.hdrMetadata !== 'off') {
            args.push('--hdr-dynamic-metadata', settings.hdrMetadata)
        }
        if (settings.keepMetadata) {
            args.push('--keep-metadata')
        }
        if (settings.inlineParamSets) {
            args.push('--inline-parameter-sets')
        }

        // ─ Subtitles ─────────────────────────────────────────────────
        const subMode = settings.subtitleMode || 'none'
        const extFile = settings.subtitleExternalFile || ''

        // External subtitle file (SRT/ASS/etc.) — takes priority, added as track 1
        if (extFile) {
            args.push('--srt-file', extFile)
            if (settings.subtitleBurn) {
                args.push('--srt-burn', '1')
            } else if (settings.subtitleDefault) {
                args.push('--srt-default', '1')
            }
        } else if (subMode === 'first') {
            args.push('--subtitle', '1')
            if (settings.subtitleBurn) {
                args.push('--subtitle-burn', '1')
            } else if (settings.subtitleDefault) {
                args.push('--subtitle-default', '1')
            }
        } else if (subMode === 'all') {
            args.push('--all-subtitles')
        } else if (subMode === 'scan_forced') {
            args.push('--subtitle', 'scan')
            if (settings.subtitleBurn) {
                args.push('--subtitle-burn', '1')
            } else if (settings.subtitleDefault) {
                args.push('--subtitle-default', '1')
            }
        }
        if (subMode !== 'none' && !extFile && settings.subtitleLanguage && settings.subtitleLanguage !== 'any') {
            args.push('--native-language', settings.subtitleLanguage)
        }

        return args
    }

    // IPC handlers for HandBrake CLI
    ipcMain.on('run-cli', (event, { filePath, settings, id, outputMode, customOutputDir, outputName, videoResolution, clipStart, clipEnd }) => {
        const cliPath = getCLIPath()
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

        // HandBrakeCLI (MinGW) cannot open files with non-ASCII paths because its
        // C runtime decodes argv via the system ANSI code page, garbling Unicode.
        // Create a hard link with an ASCII-only name pointing to the source file,
        // pass that to HandBrake, then delete the link when encoding finishes.
        let hbInputPath = filePath
        if (process.platform === 'win32' && /[^\x00-\x7F]/.test(filePath)) {
            const { extname } = require('path')
            const { tmpdir } = require('os')
            const asciiLink = join(tmpdir(), `gorex_encode_${id}_${Date.now()}${extname(filePath)}`)
            try {
                fs.linkSync(filePath, asciiLink)
                hbInputPath = asciiLink
            } catch (_) {
                // Hard link failed (e.g. cross-device); fall back to original path
            }
        }

        const args = buildCliArgs(hbInputPath, outputPath, fallbackSettings, videoResolution)

        // Time-based trim (HandBrakeCLI --start-at / --stop-at)
        if (clipStart != null && clipStart > 0) {
            args.push('--start-at', `duration:${Math.round(clipStart)}`)
        }
        if (clipEnd != null && clipEnd > 0) {
            const clipDur = Math.max(1, clipEnd - (clipStart ?? 0))
            args.push('--stop-at', `duration:${Math.round(clipDur)}`)
        }

        console.log(`Running CLI: ${cliPath} ${args.join(' ')}`)

        const stderrLines = []
        const child = spawn(cliPath, args)
        activeJobs.set(id, { child, outputPath })

        child.stdout.on('data', (data) => {
            const str = data.toString()
            // Parse "Encoding: task X of Y[, Searching for start time], Z %" from the chunk.
            // Take the LAST match in the chunk (most recent update).
            // Apply the macOS multi-pass formula: (Z + (X-1)*100) / Y to get total progress
            // so the bar never jumps backward when a new pass starts.
            let progressValue = null
            const encodingMatches = [...str.matchAll(/Encoding: task (\d+) of (\d+).*?([\d.]+)\s*%/g)]
            if (encodingMatches.length > 0) {
                const last = encodingMatches[encodingMatches.length - 1]
                const pass = parseInt(last[1])
                const passCount = parseInt(last[2])
                const passPercent = parseFloat(last[3])
                progressValue = (passPercent + (pass - 1) * 100) / passCount
            }
            if (progressValue !== null && progressValue <= 100) {
                event.sender.send('cli-progress', { id, progress: progressValue })
            }
            event.sender.send('cli-output', str)
        })

        child.stderr.on('data', (data) => {
            const str = data.toString()
            stderrLines.push(str)
            event.sender.send('cli-error', str)
        })

        child.on('close', (code) => {
            // Remove the ASCII hard link if one was created
            if (hbInputPath !== filePath && fs.existsSync(hbInputPath)) {
                try { fs.unlinkSync(hbInputPath) } catch (_) {}
            }
            activeJobs.delete(id)
            event.sender.send('cli-exit', { id, code, outputPath, stderr: stderrLines.join('') })
        })
    })

    ipcMain.on('stop-all-cli', () => {
        const fs = require('fs')
        for (const [jobId, { child, outputPath }] of activeJobs) {
            try {
                // On Windows, child.kill() only kills yt-dlp but leaves ffmpeg (spawned by yt-dlp)
                // running as an orphan. Use taskkill /T to kill the whole process tree.
                if (process.platform === 'win32' && child.pid) {
                    exec(`taskkill /F /T /PID ${child.pid}`, () => {})
                } else {
                    child.kill()
                }
            } catch (_) {}
            if (outputPath) {
                try {
                    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
                } catch (_) {}
            }
            activeJobs.delete(jobId)
        }
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

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
