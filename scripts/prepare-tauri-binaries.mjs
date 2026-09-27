import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, copyFileSync, chmodSync, rmSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const root = resolve(import.meta.dirname, '..')
const destination = join(root, 'src-tauri', 'binaries')

const DENO_RELEASE = 'v2.9.7'
const YTDLP_RELEASE = '2026.08.19'
const YTDLP_ASSETS = {
  'darwin-arm64': { name: 'yt-dlp_macos', sha256: '0f192b7ec147ab6288885d6351d9ab67367640029b4377576ef46dd79cf7b202' },
  'win32-x64': { name: 'yt-dlp.exe', sha256: '66674953fe251b89f4d08c5f0e35e0728679bd67ab3d7d05c0562af101dd3e7a' },
}
const TWITCH_RELEASE = '1.56.5'
const TWITCH_ASSETS = {
  'darwin-arm64': { name: 'TwitchDownloaderCLI-1.56.5-MacOSArm64.zip', sha256: '17a0182f83689a0ae429f48cf03c26f1701eed7edcd787fa3d261898a6023d76' },
  'win32-x64': { name: 'TwitchDownloaderCLI-1.56.5-Windows-x64.zip', sha256: '8b1b0695f2b1b6bf0d2535fab4b84032951cded8cf4078dfdf4d58e391c813a0' },
}
const DENO_ASSETS = {
  'darwin-arm64': {
    name: 'deno-aarch64-apple-darwin.zip',
    sha256: '5cd46d6268f6f78f5d88bdc7159d20bd44cdaa4b3303474839f87ec6fe7ae25c',
  },
  'win32-x64': {
    name: 'deno-x86_64-pc-windows-msvc.zip',
    sha256: 'a0c3101b4158d1dfb7d6a78a7bf0f3de80c96bb423c152beec8beb22786f2238',
  },
}

function copyTool(source, name) {
  if (!existsSync(source)) throw new Error(`Missing required binary: ${source}`)
  const target = join(destination, name)
  copyFileSync(source, target)
  if (process.platform !== 'win32') chmodSync(target, 0o755)
  console.log(`${name}: ${source}`)
}

function checksum(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

function downloadVerified(url, target, expectedHash) {
  if (existsSync(target) && checksum(target) === expectedHash) return
  const scratch = `${target}.download`
  try {
    const download = spawnSync('curl', ['--fail', '--location', '--retry', '4', '--retry-all-errors', '--continue-at', '-', '--output', scratch, url], { stdio: 'inherit' })
    if (download.status !== 0) throw new Error(`Download failed: ${download.status ?? download.error}`)
    const digest = checksum(scratch)
    if (digest !== expectedHash) throw new Error(`Archive hash mismatch: ${digest}`)
    copyTool(scratch, basename(target))
  } finally {
    rmSync(scratch, { force: true })
  }
}

async function installDeno(asset, binaryName) {
  const target = join(destination, binaryName)
  if (existsSync(target)) {
    const version = spawnSync(target, ['--version'], { encoding: 'utf8' })
    if (version.status === 0 && version.stdout.startsWith(`deno ${DENO_RELEASE.slice(1)}`)) return
  }
  const scratch = mkdtempSync(join(tmpdir(), 'gorex-deno-'))
  try {
    const url = `https://github.com/denoland/deno/releases/download/${DENO_RELEASE}/${asset.name}`
    const archive = join(scratch, asset.name)
    const download = spawnSync('curl', ['--fail', '--location', '--retry', '4', '--retry-all-errors', '--continue-at', '-', '--output', archive, url], { stdio: 'inherit' })
    if (download.status !== 0) throw new Error(`Deno download failed: ${download.status ?? download.error}`)
    const digest = checksum(archive)
    if (digest !== asset.sha256) throw new Error(`Deno archive hash mismatch: ${digest}`)
    const unpack = process.platform === 'win32'
      ? spawnSync('tar', ['-xf', archive, '-C', scratch], { stdio: 'inherit' })
      : spawnSync('unzip', ['-q', archive, '-d', scratch], { stdio: 'inherit' })
    if (unpack.status !== 0) throw new Error(`Could not extract ${asset.name}`)
    copyTool(join(scratch, binaryName), binaryName)
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
}

function findFile(directory, name) {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry)
    if (entry === name && statSync(path).isFile()) return path
    if (statSync(path).isDirectory()) {
      const found = findFile(path, name)
      if (found) return found
    }
  }
  return null
}

function installTwitch(asset) {
  const folder = join(destination, 'twitch')
  const binaryName = process.platform === 'win32' ? 'TwitchDownloaderCLI.exe' : 'TwitchDownloaderCLI'
  const binary = join(folder, binaryName)
  if (existsSync(binary) && existsSync(join(folder, '.version')) && readFileSync(join(folder, '.version'), 'utf8') === TWITCH_RELEASE) return
  const scratch = mkdtempSync(join(tmpdir(), 'gorex-twitch-'))
  try {
    const archive = join(scratch, asset.name)
    const url = `https://github.com/lay295/TwitchDownloader/releases/download/${TWITCH_RELEASE}/${asset.name}`
    const download = spawnSync('curl', ['--fail', '--location', '--retry', '4', '--retry-all-errors', '--continue-at', '-', '--output', archive, url], { stdio: 'inherit' })
    if (download.status !== 0) throw new Error(`TwitchDownloaderCLI download failed: ${download.status ?? download.error}`)
    if (checksum(archive) !== asset.sha256) throw new Error('TwitchDownloaderCLI SHA256 mismatch')
    const unpack = process.platform === 'win32'
      ? spawnSync('tar', ['-xf', archive, '-C', scratch], { stdio: 'inherit' })
      : spawnSync('unzip', ['-q', archive, '-d', scratch], { stdio: 'inherit' })
    if (unpack.status !== 0) throw new Error('Could not extract TwitchDownloaderCLI')
    const found = findFile(scratch, binaryName)
    if (!found) throw new Error('TwitchDownloaderCLI binary missing from verified archive')
    rmSync(folder, { recursive: true, force: true })
    mkdirSync(folder, { recursive: true })
    copyFileSync(found, binary)
    if (process.platform !== 'win32') chmodSync(binary, 0o755)
    writeFileSync(join(folder, '.version'), TWITCH_RELEASE)
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
}

const target = `${process.platform}-${process.arch}`
const deno = DENO_ASSETS[target]
if (!deno) throw new Error(`Unsupported Gorex release target: ${target}`)
const ytdlp = YTDLP_ASSETS[target]
const twitch = TWITCH_ASSETS[target]
mkdirSync(destination, { recursive: true })
const extension = process.platform === 'win32' ? '.exe' : ''
copyTool(require('ffmpeg-static'), `ffmpeg${extension}`)
copyTool(require('@derhuerst/ffprobe-static'), `ffprobe${extension}`)
downloadVerified(`https://github.com/yt-dlp/yt-dlp/releases/download/${YTDLP_RELEASE}/${ytdlp.name}`, join(destination, `yt-dlp${extension}`), ytdlp.sha256)
await installDeno(deno, `deno${extension}`)
installTwitch(twitch)
