import { createHash } from 'node:crypto'
import { createReadStream, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir, platform, arch, cpus, release } from 'node:os'
import { join, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import { spawnSync } from 'node:child_process'

const [inputFile, electronTool, tauriTool] = process.argv.slice(2)
if (!inputFile || !electronTool || !tauriTool) {
  throw new Error('Usage: node scripts/benchmark-conversion.mjs INPUT ELECTRON_FFMPEG TAURI_FFMPEG')
}
const input = resolve(inputFile)
const digest = createHash('sha256')
for await (const chunk of createReadStream(input)) digest.update(chunk)
const scratch = mkdtempSync(join(tmpdir(), 'gorex-conversion-benchmark-'))
const tools = [
  { runtime: 'Electron baseline', path: resolve(electronTool), seconds: [] },
  { runtime: 'Tauri', path: resolve(tauriTool), seconds: [] },
]
const argumentsFor = output => [
  '-hide_banner', '-loglevel', 'error', '-y', '-i', input,
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '23',
  '-c:a', 'aac', '-b:a', '160k', output,
]
const run = (tool, iteration) => {
  const started = performance.now()
  const output = spawnSync(tool.path, argumentsFor(join(scratch, `${iteration}.mp4`)), { encoding: 'utf8' })
  if (output.error || output.status !== 0) throw new Error(`${tool.runtime}: ${output.error?.message || output.stderr}`)
  return (performance.now() - started) / 1000
}

try {
  for (const tool of tools) {
    const version = spawnSync(tool.path, ['-version'], { encoding: 'utf8' })
    if (version.status !== 0) throw new Error(`Cannot read FFmpeg version: ${tool.path}`)
    tool.version = version.stdout.split('\n')[0]
    run(tool, 'warmup')
  }
  // Alternate the run order to reduce a consistent cache/temperature advantage.
  for (let iteration = 0; iteration < 3; iteration++) {
    for (const tool of iteration % 2 ? [...tools].reverse() : tools) {
      tool.seconds.push(run(tool, `${iteration}-${tool.runtime}`))
    }
  }
  for (const tool of tools) {
    tool.medianSeconds = [...tool.seconds].sort((a, b) => a - b)[1]
  }
  console.log(JSON.stringify({
    measuredAt: new Date().toISOString(), platform: platform(), arch: arch(), osRelease: release(),
    cpu: cpus()[0]?.model, input, inputSha256: digest.digest('hex'),
    method: 'FFmpeg process wall time including disk output; one warmup and three alternating runs per binary. Does not measure UI/queue overhead or cold launch.',
    arguments: argumentsFor('<temporary-output.mp4>'), tools,
    tauriTimeChangePercent: (tools[1].medianSeconds / tools[0].medianSeconds - 1) * 100,
  }, null, 2))
} finally {
  rmSync(scratch, { recursive: true, force: true })
}
