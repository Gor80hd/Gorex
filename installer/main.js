'use strict'

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')
const { execSync, exec } = require('child_process')

let win

function createWindow() {
    win = new BrowserWindow({
        width: 680,
        height: 440,
        frame: false,
        backgroundColor: '#121118', // solid bg — avoids layered-window GPU init delay
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

    // Show as soon as the first frame is painted — the backgroundColor above
    // prevents any white flash while the page is still loading.
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
ipcMain.handle('get-disk-space', (_event, dirPath) => new Promise((resolve) => {
    try {
        const letter = path.parse(dirPath).root.toUpperCase().replace(/[\\:/]/g, '')
        const cmd = `powershell -NoProfile -Command "(Get-PSDrive ${letter} -ErrorAction SilentlyContinue).Free"`
        exec(cmd, { timeout: 4000 }, (err, stdout) => {
            if (err) { resolve({ free: null }); return }
            const bytes = parseInt(stdout.toString().trim(), 10)
            resolve(isNaN(bytes) ? { free: null } : { free: (bytes / 1073741824).toFixed(1) })
        })
    } catch {
        resolve({ free: null })
    }
}))

// ── Check for existing installation ─────────────────────────────────────────
ipcMain.handle('check-already-installed', () => {
    // 1. Registry check (HKCU then HKLM)
    const regFound = (() => {
        const hives = ['HKCU', 'HKLM']
        for (const hive of hives) {
            try {
                const out = execSync(
                    `reg query "${hive}\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Gorex" /v InstallLocation`,
                    { timeout: 3000, stdio: ['ignore', 'pipe', 'ignore'] }
                ).toString()
                const m = out.match(/InstallLocation\s+REG_SZ\s+(.+)/)
                if (m) {
                    const location = m[1].trim()
                    // try to get version too
                    let version = null
                    try {
                        const vOut = execSync(
                            `reg query "${hive}\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Gorex" /v DisplayVersion`,
                            { timeout: 3000, stdio: ['ignore', 'pipe', 'ignore'] }
                        ).toString()
                        const vm = vOut.match(/DisplayVersion\s+REG_SZ\s+(.+)/)
                        if (vm) version = vm[1].trim()
                    } catch { /* version is optional */ }
                    return { location, version }
                }
            } catch { /* key not found in this hive */ }
        }
        return null
    })()
    if (regFound) return regFound

    // 2. Filesystem fallback — scan common install locations for Gorex.exe
    const localAppData  = process.env.LOCALAPPDATA  ?? path.join(os.homedir(), 'AppData', 'Local')
    const programFiles  = process.env.ProgramFiles   ?? 'C:\\Program Files'
    const programFiles86 = process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)'
    const appData       = process.env.APPDATA        ?? path.join(os.homedir(), 'AppData', 'Roaming')

    const candidates = [
        path.join(localAppData,   'Programs', 'Gorex'),
        path.join(programFiles,   'Gorex'),
        path.join(programFiles86, 'Gorex'),
        path.join(appData,        'Gorex'),
    ]
    for (const dir of candidates) {
        try {
            if (fs.existsSync(path.join(dir, 'Gorex.exe'))) {
                return { location: dir, version: null }
            }
        } catch { /* skip */ }
    }

    return null
})

// ── Uninstall existing installation ──────────────────────────────────────────
ipcMain.handle('uninstall-existing', (_event, { location }) => {
    const vbs = path.join(location ?? '', 'Uninstall Gorex.vbs')
    if (!fs.existsSync(vbs)) {
        return { success: false, error: `Uninstaller not found at:\n${vbs}` }
    }
    exec(`wscript.exe "${vbs}"`)
    return { success: true }
})

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
                if (!fs.existsSync(srcFile)) {
                    const name = path.basename(srcFile)
                    const isExe = name.endsWith('.exe') || name.endsWith('.dll') || name === 'yt-dlp' || name === 'yt-dlp_macos'
                    const hint = isExe
                        ? `\n\nВозможная причина: антивирус удалил файл "${name}" из временной папки.\nДобавьте папку установки и папку TEMP в исключения антивируса и попробуйте снова.`
                        : ''
                    throw new Error(`File removed before it could be copied: ${srcFile}${hint}`)
                }
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

            send(90, 'Registering uninstaller…')
            try {
                const isAdminUser = isAdmin()
                writeUninstaller(destDir)
                registerUninstaller(destDir, { isAdminUser })
            } catch { /* uninstaller registration is optional */ }

            send(100, 'Done!')
        } catch (err) {
            let msg = err.message
            // ENOENT during copyfile usually means antivirus quarantined the file
            if (!msg.includes('антивирус') && err.code === 'ENOENT' && /copyfile/i.test(msg)) {
                const m = msg.match(/copyfile '([^']+)'/)
                const name = m ? path.basename(m[1]) : ''
                msg = `Файл не найден: ${name || msg}\n\nВероятная причина: антивирус удалил файл из временной папки установщика.\nДобавьте исключение для папки %TEMP% и папки назначения, затем повторите установку.`
            }
            event.sender.send('install-progress', { progress: -1, status: 'Error: ' + msg })
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
    const startCmd = `Start-Process -FilePath '${psPath}' -Verb RunAs`
    try {
        execSync(`powershell -NoProfile -NonInteractive -Command "${startCmd}"`, { timeout: 8000 })
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

// ── Write VBScript uninstaller ─────────────────────────────────────────────────
function writeUninstaller(destDir) {
    const vbs = [
        "' Gorex Uninstaller",
        "Option Explicit",
        "",
        "Dim fso, ws",
        'Set fso = CreateObject("Scripting.FileSystemObject")',
        'Set ws  = CreateObject("WScript.Shell")',
        "",
        'If ws.Popup("Are you sure you want to uninstall Gorex?", 0, "Uninstall Gorex", 4 + 32) <> 6 Then',
        "    WScript.Quit",
        "End If",
        "",
        "Dim installDir",
        "installDir = fso.GetParentFolderName(WScript.ScriptFullName)",
        "",
        "' -- Remove shortcuts --",
        "Dim paths(3)",
        'paths(0) = ws.SpecialFolders("Desktop") & "\\Gorex.lnk"',
        'paths(1) = ws.ExpandEnvironmentStrings("%PUBLIC%") & "\\Desktop\\Gorex.lnk"',
        'paths(2) = ws.SpecialFolders("Programs") & "\\Gorex"',
        'paths(3) = ws.ExpandEnvironmentStrings("%ProgramData%") & "\\Microsoft\\Windows\\Start Menu\\Programs\\Gorex"',
        "",
        "Dim p",
        "For Each p In paths",
        "    On Error Resume Next",
        "    If fso.FileExists(p)   Then fso.DeleteFile   p, True",
        "    If fso.FolderExists(p) Then fso.DeleteFolder p, True",
        "    On Error GoTo 0",
        "Next",
        "",
        "' -- Remove registry entries --",
        'ws.Run "cmd /c reg delete ""HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Gorex"" /f", 0, True',
        'ws.Run "cmd /c reg delete ""HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Gorex"" /f", 0, True',
        "",
        "' -- Done --",
        'ws.Popup "Gorex has been uninstalled successfully.", 0, "Uninstall Gorex", 64',
        "",
        "' -- Delete install directory (deferred via PowerShell) --",
        "Dim esc",
        'esc = Replace(installDir, Chr(39), Chr(39) & Chr(39))',
        'ws.Run "powershell -NoProfile -WindowStyle Hidden -Command ""Start-Sleep 2; Remove-Item -Path \'" & esc & "\' -Recurse -Force -ErrorAction SilentlyContinue""", 0, False',
    ].join('\r\n')

    fs.writeFileSync(path.join(destDir, 'Uninstall Gorex.vbs'), vbs, 'utf8')
}

// ── Register in Windows "Programs and Features" ────────────────────────────────
function registerUninstaller(destDir, { isAdminUser = false, version = '2.2.0' } = {}) {
    // Try to get the version from the main app's package.json
    try {
        const pkgPath = [
            path.join(destDir, 'resources', 'app', 'package.json'),
            path.join(destDir, 'resources', 'app.asar.unpacked', 'package.json'),
        ].find(p => fs.existsSync(p))
        if (pkgPath) version = JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version || version
    } catch { /* use default */ }

    const hive    = isAdminUser ? 'HKLM' : 'HKCU'
    const regKey  = `${hive}\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Gorex`
    const vbsPath = path.join(destDir, 'Uninstall Gorex.vbs')
    const icoPath = path.join(destDir, 'Gorex.ico')

    // Use PowerShell to safely set registry values (handles paths with spaces/special chars)
    const esc = s => s.replace(/'/g, "''")  // escape for PS single-quoted strings
    const ps = [
        `$k = 'Registry::${esc(regKey)}'`,
        `if (-not (Test-Path $k)) { New-Item -Path $k -Force | Out-Null }`,
        `$props = [ordered]@{`,
        `    DisplayName          = 'Gorex'`,
        `    Publisher            = 'Akhmatyarov'`,
        `    DisplayVersion       = '${esc(version)}'`,
        `    InstallLocation      = '${esc(destDir)}'`,
        `    DisplayIcon          = '${esc(icoPath)},0'`,
        `    UninstallString      = 'wscript.exe "${esc(vbsPath)}"'`,
        `    QuietUninstallString = 'wscript.exe "${esc(vbsPath)}"'`,
        `    NoModify             = [int32]1`,
        `    NoRepair             = [int32]1`,
        `}`,
        `foreach ($name in $props.Keys) {`,
        `    $val  = $props[$name]`,
        `    $type = if ($val -is [int32]) { 'DWord' } else { 'String' }`,
        `    Set-ItemProperty -Path $k -Name $name -Value $val -Type $type`,
        `}`,
    ].join('\n')

    const tmp = path.join(os.tmpdir(), `gorex_unreg_${Date.now()}.ps1`)
    try {
        fs.writeFileSync(tmp, ps, 'utf8')
        execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tmp}"`, { timeout: 10000 })
    } finally {
        try { fs.unlinkSync(tmp) } catch { /* ignore */ }
    }
}


