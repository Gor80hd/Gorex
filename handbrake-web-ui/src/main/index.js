import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join, dirname } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { spawn, exec } from 'child_process'

// ─── CLI path resolution (always next to the executable, not configurable) ─────────────
function getCLIPath() {
    if (is.dev) {
        return join(app.getAppPath(), '..', 'build', 'HandBrakeCLI.exe')
    }
    return join(dirname(process.execPath), 'HandBrakeCLI.exe')
}

// ─── Persistent app settings (stored in userData) ───────────────────────────────────────
let settingsFilePath = ''

function getSettingsFilePath() {
    if (!settingsFilePath) settingsFilePath = join(app.getPath('userData'), 'bpress-settings.json')
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

const activeJobs = new Map() // id -> child process

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
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
}

app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.bpress.webui')

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
                { name: 'Videos', extensions: ['mp4', 'mkv', 'avi', 'mov'] }
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

                await new Promise((resolve, reject) => {
                    ffmpeg(filePath)
                        .screenshots({
                            timestamps: ['10%'],
                            folder: thumbDir,
                            filename: thumbName,
                            size: '320x?'
                        })
                        .on('end', resolve)
                        .on('error', reject)
                })

                const thumbData = require('fs').readFileSync(thumbPath)
                const thumbBase64 = `data:image/jpeg;base64,${thumbData.toString('base64')}`

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

        return args
    }

    // IPC handlers for HandBrake CLI
    ipcMain.on('run-cli', (event, { filePath, settings, id, outputMode, customOutputDir, outputName, videoResolution }) => {
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
        const args = buildCliArgs(filePath, outputPath, fallbackSettings, videoResolution)

        console.log(`Running CLI: ${cliPath} ${args.join(' ')}`)

        const stderrLines = []
        const child = spawn(cliPath, args)
        activeJobs.set(id, { child, outputPath })

        child.stdout.on('data', (data) => {
            const str = data.toString()
            // Prefer actual encoding progress lines; fall back to last % match in chunk
            let progressValue = null
            const encodingMatch = str.match(/Encoding:.*?([\d.]+)\s*%/)
            if (encodingMatch) {
                progressValue = parseFloat(encodingMatch[1])
            } else {
                const allMatches = [...str.matchAll(/([\d.]+)\s*%/g)]
                if (allMatches.length > 0) {
                    progressValue = parseFloat(allMatches[allMatches.length - 1][1])
                }
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
            activeJobs.delete(id)
            event.sender.send('cli-exit', { id, code, outputPath, stderr: stderrLines.join('') })
        })
    })

    ipcMain.on('stop-all-cli', () => {
        const fs = require('fs')
        for (const [id, { child, outputPath }] of activeJobs) {
            try { child.kill() } catch (_) {}
            if (outputPath) {
                try {
                    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
                } catch (_) {}
            }
            activeJobs.delete(id)
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
