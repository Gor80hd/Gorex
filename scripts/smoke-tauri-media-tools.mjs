import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const binaryDir = resolve(import.meta.dirname, '..', 'src-tauri', 'binaries')
const suffix = process.platform === 'win32' ? '.exe' : ''
const scratch = mkdtempSync(join(tmpdir(), 'gorex-media-smoke-'))

function run(name, args) {
  const result = spawnSync(join(binaryDir, `${name}${suffix}`), args, {
    encoding: 'utf8',
    timeout: 30_000,
    maxBuffer: 2 * 1024 * 1024,
  })
  if (result.status !== 0) {
    throw new Error(`${name} failed (${result.status ?? result.error}): ${result.stderr?.slice(-2000)}`)
  }
  return result.stdout
}

try {
  const sample = join(scratch, 'probe-sample.mp4')
  run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=black:s=64x64:r=1', '-t', '1', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', sample])
  const data = JSON.parse(run('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_name:format=duration', '-of', 'json', sample]))
  if (data.streams?.[0]?.codec_name !== 'h264' || Number(data.format?.duration) <= 0) {
    throw new Error(`ffprobe did not read the encoded sample: ${JSON.stringify(data)}`)
  }
  const av1Sample = join(scratch, 'probe-av1.mkv')
  run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=black:s=64x64:r=1', '-frames:v', '1', '-c:v', 'libsvtav1', '-preset', '12', av1Sample])
  const av1 = JSON.parse(run('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_name', '-of', 'json', av1Sample]))
  if (av1.streams?.[0]?.codec_name !== 'av1') {
    throw new Error(`ffprobe did not recognize SVT-AV1 output: ${JSON.stringify(av1)}`)
  }
  console.log(`FFmpeg and ffprobe smoke passed (${process.platform}-${process.arch})`)
} finally {
  rmSync(scratch, { recursive: true, force: true })
}
