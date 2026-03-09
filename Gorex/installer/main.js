'use strict'

const isUninstallMode = process.argv.includes('--uninstall')

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')
const { execSync, execFileSync, spawn } = require('child_process')

let win

function createWindow() {
    win = new BrowserWindow({
        width: 680,
        height: 440,
        frame: false,
        transparent: true,
        resizable: false,
        center: true,
        show: false,
        skipTaskbar: false,
        title: 'Gorex Setup',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
        },
    })

    win.loadFile(path.join(__dirname, 'renderer', 'index.html'))

    win.once('ready-to-show', () => win.show())
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => app.quit())

// ── Window controls ────────────────────────────────────────────────────────────
ipcMain.on('window-close', () => app.quit())
ipcMain.on('window-minimize', () => win.minimize())

// ── Default install directory ──────────────────────────────────────────────────
ipcMain.handle('get-default-install-dir', () =>
    path.join(process.env.LOCALAPPDATA ?? path.join(os.homedir(), 'AppData', 'Local'), 'Programs', 'Gorex'))

// ── Browse for a directory ─────────────────────────────────────────────────────
ipcMain.handle('browse-dir', async () => {
    const r = await dialog.showOpenDialog(win, {
        properties: ['openDirectory', 'createDirectory'],
        title: 'Choose installation folder',
    })
    return r.canceled ? null : r.filePaths[0]
})

// ── Disk space ─────────────────────────────────────────────────────────────────
ipcMain.handle('get-disk-space', (_event, dirPath) => {
    try {
        const letter = path.parse(dirPath).root.toUpperCase().replace(/[\\:/]/g, '')
        const cmd = `powershell -NoProfile -Command "(Get-PSDrive ${letter} -ErrorAction SilentlyContinue).Free"`
        const bytes = parseInt(execSync(cmd, { timeout: 4000 }).toString().trim(), 10)
        if (isNaN(bytes)) return { free: null }
        return { free: (bytes / 1073741824).toFixed(1) }
    } catch {
        return { free: null }
    }
})

// ── Check if installed ───────────────────────────────────────────────────────
ipcMain.handle('get-mode', () => isUninstallMode ? 'uninstall' : 'install')

ipcMain.handle('check-installed', () => getInstalledInfo())

// ── Install ────────────────────────────────────────────────────────────────────
ipcMain.on('install', (event, { destDir, createDesktopShortcut = true, createStartMenuShortcut = true }) => {
    void (async () => {
        // Disable Electron's asar filesystem hooks so that .asar files are treated
        // as plain files (not virtual directories) during the copy operation.
        const _noAsar = process.noAsar
        process.noAsar = true
        try {
            const send = (progress, status) =>
                event.sender.send('install-progress', { progress, status })

            // Locate the bundled Gorex app directory
            const src = [
                path.join(process.resourcesPath, 'gorex-app'),
                path.join(__dirname, 'resources', 'gorex-app'),   // dev fallback
            ].find(p => fs.existsSync(p))

            if (!src) { send(-1, 'Bundle not found. Please rebuild the installer.'); return }

            send(4, 'Preparing…')

            // Check for admin rights if installing to Program Files
            const isProgramFiles = destDir.toLowerCase().includes('program files')
            if (isProgramFiles && !isAdmin()) {
                send(-1, 'Error: Administrative privileges required to install in ' + destDir + '. Please run the installer as administrator.')
                return
            }

            fs.mkdirSync(destDir, { recursive: true })

            // Collect all files for accurate progress
            send(8, 'Scanning files…')
            const files = collectFiles(src)
            const total = files.length
            let copied = 0

            for (const srcFile of files) {
                const rel = path.relative(src, srcFile)
                const dest = path.join(destDir, rel)
                fs.mkdirSync(path.dirname(dest), { recursive: true })
                fs.copyFileSync(srcFile, dest)
                copied++
                if (copied % 25 === 0 || copied === total) {
                    const p = 8 + Math.round((copied / total) * 66)
                    send(p, `Copying…  ${copied} / ${total} files`)
                }
            }

            send(76, 'Creating shortcuts…')
            // Copy the bundled icon into the install dir so shortcuts can reference a real .ico file
            const icoSrc = [
                path.join(process.resourcesPath, 'icon.ico'),
                path.join(__dirname, 'resources', 'icon.ico'),
            ].find(p => { try { return fs.existsSync(p) } catch { return false } })
            const icoInDest = path.join(destDir, 'Gorex.ico')
            if (icoSrc) {
                try { fs.copyFileSync(icoSrc, icoInDest) } catch { /* optional */ }
            }
            createShortcuts(destDir, { desktop: createDesktopShortcut, startMenu: createStartMenuShortcut, icoPath: icoInDest })

            send(84, 'Copying uninstaller…')
            const selfExe = process.env.PORTABLE_EXECUTABLE_FILE || process.execPath
            const uninstExe = path.join(destDir, 'Uninstall Gorex.exe')
            if (path.extname(selfExe).toLowerCase() === '.exe' && fs.existsSync(selfExe)) {
                try { fs.copyFileSync(selfExe, uninstExe) } catch { /* optional */ }
            }

            send(92, 'Writing uninstall record…')
            writeUninstallKey(destDir)

            send(100, 'Done!')
        } catch (err) {
            event.sender.send('install-progress', { progress: -1, status: 'Error: ' + err.message })
        } finally {
            process.noAsar = _noAsar
        }
    })()
})

// ── Elevate and relaunch ──────────────────────────────────────────────────────
ipcMain.handle('elevate', () => {
    // NSIS portable sets PORTABLE_EXECUTABLE_FILE to the original .exe path
    const exe = process.env.PORTABLE_EXECUTABLE_FILE || process.execPath
    const psPath = exe.replace(/`/g, '``').replace(/'/g, "''")
    try {
        execSync(`powershell -NoProfile -NonInteractive -Command "Start-Process -FilePath '${psPath}' -Verb RunAs"`, { timeout: 8000 })
        app.quit()
        return true
    } catch {
        return false
    }
})

// ── Launch installed app ───────────────────────────────────────────────────────
ipcMain.on('launch-app', (_event, { destDir }) => {
    const exe = path.join(destDir, 'Gorex.exe')
    if (fs.existsSync(exe)) shell.openPath(exe)
    app.quit()
})

// ── Uninstall ────────────────────────────────────────────────────────────────
ipcMain.on('uninstall', (event, { installDir }) => {
    void (async () => {
        try {
            const send = (progress, status) =>
                event.sender.send('uninstall-progress', { progress, status })

            send(10, 'Removing shortcuts…')
            const isAdminUser = isAdmin()
            const desktopDir = isAdminUser
                ? path.join(process.env.PUBLIC ?? 'C:\\Users\\Public', 'Desktop')
                : getDesktopPath()
            const startMenuDir = isAdminUser
                ? path.join(process.env.ProgramData ?? 'C:\\ProgramData', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Gorex')
                : path.join(process.env.APPDATA ?? '', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Gorex')
            try { fs.unlinkSync(path.join(desktopDir, 'Gorex.lnk')) } catch { /* optional */ }
            try { fs.rmSync(startMenuDir, { recursive: true, force: true }) } catch { /* optional */ }

            send(40, 'Removing registry entries…')
            for (const root of ['HKCU', 'HKLM']) {
                try { execSync(`reg delete "${root}\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Gorex" /f`, { timeout: 3000 }) } catch { /* optional */ }
            }

            send(70, 'Removing files…')

            // Move the running uninstaller exe out of installDir first so
            // the entire folder can be deleted while the process is alive.
            const uninstExePath = path.join(installDir, 'Uninstall Gorex.exe')
            let tempExe = null
            try {
                tempExe = path.join(os.tmpdir(), `GorexUninstall_${Date.now()}.exe`)
                fs.renameSync(uninstExePath, tempExe)
            } catch { tempExe = null }

            // PowerShell with a hidden window: wait 5 s (enough for the
            // Electron process to exit), then delete the install folder and
            // the temp exe copy.
            const escDir = installDir.replace(/'/g, "''")
            const psLines = [
                'Start-Sleep -Seconds 5',
                `Remove-Item -LiteralPath '${escDir}' -Recurse -Force -ErrorAction SilentlyContinue`,
            ]
            if (tempExe) {
                psLines.push(`Remove-Item -LiteralPath '${tempExe.replace(/'/g, "''")}' -Force -ErrorAction SilentlyContinue`)
            }
            spawn(
                'powershell.exe',
                ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-Command', psLines.join('; ')],
                { detached: true, stdio: 'ignore', windowsHide: true },
            ).unref()

            send(100, 'Done!')
            // Auto-quit after a short delay so all file handles are released
            // before PowerShell's cleanup runs.
            setTimeout(() => app.quit(), 3500)
        } catch (err) {
            event.sender.send('uninstall-progress', { progress: -1, status: 'Error: ' + err.message })
        }
    })()
})

// ── Helpers ────────────────────────────────────────────────────────────────────
function isAdmin() {
    try {
        execSync('net session', { stdio: 'ignore' })
        return true
    } catch {
        return false
    }
}

function collectFiles(dir) {
    const out = []
    for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name)
        fs.statSync(full).isDirectory() ? out.push(...collectFiles(full)) : out.push(full)
    }
    return out
}

function getInstalledInfo() {
    for (const root of ['HKCU', 'HKLM']) {
        try {
            const key = `${root}\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Gorex`
            const out = execSync(`reg query "${key}" /v InstallLocation`, { timeout: 3000 }).toString()
            const match = out.match(/InstallLocation\s+REG_SZ\s+(.+)/)
            if (match) {
                const installDir = match[1].trim()
                let version = '1.0.0'
                try {
                    const verOut = execSync(`reg query "${key}" /v DisplayVersion`, { timeout: 3000 }).toString()
                    const verMatch = verOut.match(/DisplayVersion\s+REG_SZ\s+(.+)/)
                    if (verMatch) version = verMatch[1].trim()
                } catch { /* optional */ }
                return { installed: true, installDir, version }
            }
        } catch { /* not installed */ }
    }
    return { installed: false, installDir: null, version: null }
}

function getDesktopPath() {
    try {
        const out = execSync(
            `powershell -NoProfile -Command "[Environment]::GetFolderPath('Desktop')"`,
            { timeout: 4000 }
        ).toString().trim()
        if (out) return out
    } catch { /* fall through */ }
    return path.join(os.homedir(), 'Desktop')
}

function createShortcuts(destDir, { desktop = true, startMenu = true, icoPath = null } = {}) {
    const exe = path.join(destDir, 'Gorex.exe')
    const isAdminUser = isAdmin()

    // Use Public/All Users folders if admin, otherwise resolve via Shell API
    const desktopDir = isAdminUser
        ? path.join(process.env.PUBLIC ?? 'C:\\Users\\Public', 'Desktop')
        : getDesktopPath()

    const startMenuDir = isAdminUser
        ? path.join(process.env.ProgramData ?? 'C:\\ProgramData', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Gorex')
        : path.join(process.env.APPDATA ?? '',
            'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Gorex')

    const makeVBS = (linkPath, target) => {
        // VBScript does NOT treat backslash as an escape character, so paths
        // must be written with single backslashes — no doubling needed.
        // Prefer an explicit .ico file so the icon is shown correctly on all machines.
        const icon = (icoPath && fs.existsSync(icoPath)) ? icoPath : target
        const vbs = [
            `Set ws = WScript.CreateObject("WScript.Shell")`,
            `Set lnk = ws.CreateShortcut("${linkPath}")`,
            `lnk.TargetPath = "${target}"`,
            `lnk.WorkingDirectory = "${destDir}"`,
            `lnk.IconLocation = "${icon},0"`,
            `lnk.Description = "Gorex"`,
            `lnk.Save`,
        ].join('\r\n')
        const tmp = path.join(os.tmpdir(), `gorex_lnk_${Date.now()}.vbs`)
        fs.writeFileSync(tmp, vbs, 'utf8')
        execSync(`cscript //NoLogo "${tmp}"`, { timeout: 5000 })
        fs.unlinkSync(tmp)
    }

    if (desktop) {
        try { makeVBS(path.join(desktopDir, 'Gorex.lnk'), exe) } catch { /* optional */ }
    }
    if (startMenu) {
        try {
            fs.mkdirSync(startMenuDir, { recursive: true })
            makeVBS(path.join(startMenuDir, 'Gorex.lnk'), exe)
        } catch { /* optional */ }
    }

    // Tell the Windows Shell to refresh the icon cache so the desktop
    // shortcut icon appears immediately without a reboot/Explorer restart.
    try { execSync('ie4uinit.exe -show', { timeout: 4000, stdio: 'ignore' }) } catch { /* optional */ }
}

function writeUninstallKey(destDir) {
    const isSystem = destDir.toLowerCase().includes('program files') || isAdmin()
    const root = isSystem ? 'HKLM' : 'HKCU'
    const key = `${root}\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Gorex`
    const uninstExe = path.join(destDir, 'Uninstall Gorex.exe')
    const icoPath = path.join(destDir, 'Gorex.ico')
    const displayIcon = fs.existsSync(icoPath) ? icoPath : `${path.join(destDir, 'Gorex.exe')},0`
    // Use execFileSync so arguments are passed directly to reg.exe,
    // bypassing shell quoting entirely.  Values can contain double-quotes
    // (e.g. the UninstallString) without breaking the command.
    const add = (name, type, value) => {
        try { execFileSync('reg', ['add', key, '/v', name, '/t', type, '/d', value, '/f'], { timeout: 3000, stdio: 'ignore' }) } catch { /* optional */ }
    }
    add('DisplayName', 'REG_SZ', 'Gorex')
    add('DisplayVersion', 'REG_SZ', '1.0.0')
    add('Publisher', 'REG_SZ', 'Akhmatyarov')
    add('DisplayIcon', 'REG_SZ', displayIcon)
    add('InstallLocation', 'REG_SZ', destDir)
    add('UninstallString', 'REG_SZ', `"${uninstExe}" --uninstall`)
    add('QuietUninstallString', 'REG_SZ', `"${uninstExe}" --uninstall --quiet`)
    add('NoModify', 'REG_DWORD', '1')
    add('NoRepair', 'REG_DWORD', '1')
}
