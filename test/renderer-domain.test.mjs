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
