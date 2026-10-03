import test from 'node:test'
import assert from 'node:assert/strict'
import { getEncoderErrorHint } from '../src/renderer/src/features/encoding/encoderErrorHint.ts'
import { isTwitchUrl, normalizeTwitchSelectedQuality } from '../src/renderer/src/features/twitch/twitchQueue.ts'
import { isTwitchToolUpdateAvailable, isYtdlUpdateAvailable } from '../src/renderer/src/features/tools/updateHelpers.ts'

test('version checks handle prefixed CLI versions and reject equal releases', () => {
    assert.equal(isTwitchToolUpdateAvailable('TwitchDownloaderCLI 1.56.4+hash', '1.56.4'), false)
    assert.equal(isTwitchToolUpdateAvailable('1.56.4', '1.56.5'), true)
    assert.equal(isYtdlUpdateAvailable('yt-dlp 2026.08.19', 'v2026.09.01'), true)
    assert.equal(isYtdlUpdateAvailable('2026.09.01', '2026.09.01'), false)
})

test('Twitch queue selection falls back to Source and recognizes only Twitch hosts', () => {
    assert.deepEqual(normalizeTwitchSelectedQuality({}), {
        options: [{ value: 'Source', label: 'Source', source: true }],
        selected: 'Source',
        label: 'Source',
    })
    assert.equal(isTwitchUrl('https://clips.twitch.tv/SomeClip'), true)
    assert.equal(isTwitchUrl('https://twitch.tv.evil.example/videos/123'), false)
})

test('encoder errors provide the matching hardware hint', () => {
    assert.equal(getEncoderErrorHint('av1_nvenc: No capable devices found', key => key), 'gpuErrNvencAv1')
    assert.equal(getEncoderErrorHint('h264_videotoolbox: Cannot create compression session: -12908', key => key), 'gpuErrHwUnavailable')
})

const { createJobRequests } = await import('../src/renderer/src/features/queue/jobRequests.ts')

test('queue client passes the three job kinds with recovery metadata and clip options', () => {
    const settings = { encoder: 'x264', format: 'av_mp4' }
    const local = { id: 1, title: 'Local', outputName: 'local', path: '/input.mp4', status: 'ready', progress: 0, clipStart: 2, clipEnd: 8 }
    const youtube = { id: 2, title: 'YouTube', outputName: 'youtube', status: 'format_select', progress: 0, isYtdlItem: true, ytdlUrl: 'https://youtu.be/test', ytdlSelectedFormat: '137', ytdlAutoSubs: true, ytdlSubLangs: 'en' }
    const twitch = { id: 3, title: 'Twitch', outputName: 'twitch', status: 'format_select', progress: 0, isTwitchItem: true, twitchUrl: 'https://twitch.tv/videos/123', twitchQuality: '720p60' }
    const requests = createJobRequests([local, youtube, twitch], settings, 'custom', '/output')
    assert.deepEqual(requests.map(request => request.kind), ['ffmpeg', 'ytdl', 'twitch'])
    assert.equal(requests[0].task, local)
    assert.equal(requests[0].request.filePath, '/input.mp4')
    assert.equal(requests[0].request.clipStart, 2)
    assert.equal(requests[0].request.clipEnd, 8)
    assert.equal(requests[1].request.formatId, '137')
    assert.equal(requests[1].request.autoSubs, true)
    assert.equal(requests[1].request.subLangs, 'en')
    assert.equal(requests[2].request.twitchQuality, '720p60')
})
