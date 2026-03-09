/**
 * Gorex — Build installer
 *
 * Run this script AFTER building the main Gorex app with electron-vite build.
 *
 * Workflow:
 *   1.  electron-builder --dir  →  dist/win-unpacked/   (the actual Gorex app)
 *   2.  Copy dist/win-unpacked/ → installer/resources/gorex-app/
 *   3.  Copy resources/icon.png → installer/resources/icon.png
 *   4.  Convert icon.png        → installer/resources/icon.ico  (via magick/ps, optional)
 *   5.  npm install             in installer/
 *   6.  electron-builder        in installer/  →  dist/installer-out/GorexSetup.exe
 *
 * Usage:  node build/make-installer.js
 */

'use strict'

const fs            = require('fs')
const path          = require('path')
const { execSync }  = require('child_process')

const ROOT          = path.resolve(__dirname, '..')
const BUILD_DIR     = path.join(ROOT, 'build')
const INSTALLER_DIR = path.join(ROOT, 'installer')
const RES_DIR       = path.join(INSTALLER_DIR, 'resources')
const APP_SRC       = path.join(ROOT, 'dist', 'win-unpacked')
const APP_DEST      = path.join(RES_DIR, 'gorex-app')

// ── Helpers ────────────────────────────────────────────────────────────────────

function step(msg) { console.log('\n  \x1b[36m→\x1b[0m  ' + msg) }
function ok(msg)   { console.log('  \x1b[32m✓\x1b[0m  ' + msg) }
function fail(msg) { console.error('  \x1b[31m✗\x1b[0m  ' + msg); process.exit(1) }

function run(cmd, cwd = ROOT) {
    execSync(cmd, { cwd, stdio: 'inherit' })
}

function copyDirSync(src, dest) {
    fs.mkdirSync(dest, { recursive: true })
    for (const name of fs.readdirSync(src)) {
        const s = path.join(src, name)
        const d = path.join(dest, name)
        fs.statSync(s).isDirectory() ? copyDirSync(s, d) : fs.copyFileSync(s, d)
    }
}

function countFiles(dir) {
    let n = 0
    for (const f of fs.readdirSync(dir)) {
        const full = path.join(dir, f)
        n += fs.statSync(full).isDirectory() ? countFiles(full) : 1
    }
    return n
}

// ── Step 1: pack the main Gorex app ───────────────────────────────────────────

step('Building Gorex (electron-vite build)…')
run('npx electron-vite build')
ok('electron-vite build done')

step('Packing Gorex (electron-builder --dir)…')
run('npx electron-builder --dir --config.directories.output=dist', ROOT)
if (!fs.existsSync(APP_SRC)) fail(`win-unpacked not found at ${APP_SRC}`)
ok(`Packed: ${countFiles(APP_SRC)} files`)

// ── Step 2: copy app files into installer/resources/ ──────────────────────────

step('Copying app bundle → installer/resources/gorex-app/')
if (fs.existsSync(APP_DEST)) fs.rmSync(APP_DEST, { recursive: true, force: true })
fs.mkdirSync(RES_DIR, { recursive: true })
copyDirSync(APP_SRC, APP_DEST)
ok(`Copied ${countFiles(APP_DEST)} files`)

// ── Step 3: copy icon ──────────────────────────────────────────────────────────

step('Copying icon…')
const pngSrc  = path.join(ROOT, 'resources', 'icon.png')
const pngDest = path.join(RES_DIR, 'icon.png')
if (fs.existsSync(pngSrc)) {
    fs.copyFileSync(pngSrc, pngDest)
    ok('icon.png copied')
} else {
    console.warn('  ⚠   icon.png not found, skipping icon copy')
}

// ── Step 4: copy Gorex.ico ────────────────────────────────────────────────────

const icoSrc  = path.join(ROOT, 'src', 'renderer', 'src', 'assets', 'images', 'Gorex.ico')
const icoDest = path.join(RES_DIR, 'icon.ico')
step('Copying icon.ico…')
if (fs.existsSync(icoSrc)) {
    fs.copyFileSync(icoSrc, icoDest)
    ok('icon.ico copied from Gorex.ico')
} else {
    console.warn('  ⚠   Gorex.ico not found, skipping icon')
}

// ── Step 5: install installer deps ────────────────────────────────────────────

step('Installing installer dependencies…')
run('npm install', INSTALLER_DIR)
ok('Dependencies ready')

// ── Step 6: build installer exe ───────────────────────────────────────────────

step('Building GorexSetup.exe…')
run('npx electron-builder', INSTALLER_DIR)

const outDir  = path.join(ROOT, 'dist', 'installer-out')
const exeFile = fs.existsSync(outDir)
    ? fs.readdirSync(outDir).find(f => f.endsWith('.exe'))
    : null

if (exeFile) {
    ok(`Done! → dist/installer-out/${exeFile}`)
} else {
    console.log('  \x1b[33m⚠\x1b[0m  Build finished — check dist/installer-out/')
}
