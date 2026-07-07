import test from 'node:test'
import assert from 'node:assert/strict'
import {
    compareYtdlVersions,
    getAudioOnlyFormatConfig,
    isAudioOnlyFormat,
    isYtdlAuthError,
    isYtdlUpdateAvailable,
    serializeCookiesToNetscape,
} from '../src/main/ytdlHelpers.mjs'

test('compares yt-dlp date versions with optional prefixes', () => {
    assert.equal(compareYtdlVersions('2025.02.19', '2025.02.19'), 0)
    assert.equal(compareYtdlVersions('yt-dlp 2025.10.22', '2025.02.19'), 1)
    assert.equal(compareYtdlVersions('v2024.12.31', '2025.01.01'), -1)
    assert.equal(compareYtdlVersions('2025.01.01.1', '2025.01.01'), 1)
})

test('detects when latest yt-dlp release is newer', () => {
    assert.equal(isYtdlUpdateAvailable('2025.02.19', '2025.03.01'), true)
    assert.equal(isYtdlUpdateAvailable('2025.03.01', '2025.03.01'), false)
    assert.equal(isYtdlUpdateAvailable('', '2025.03.01'), false)
})

test('maps audio-only output formats to ffmpeg container settings', () => {
    assert.equal(isAudioOnlyFormat('audio_mp3'), true)
    assert.equal(isAudioOnlyFormat('av_mp4'), false)
    assert.deepEqual(getAudioOnlyFormatConfig('audio_m4a'), {
        ext: 'm4a',
        container: 'ipod',
        audioCodec: 'av_aac',
    })
})

test('serializes only YouTube and Google cookies in Netscape format', () => {
    const text = serializeCookiesToNetscape([
        { domain: '.youtube.com', path: '/', secure: true, expirationDate: 1893456000, name: 'SID', value: 'secret' },
        { domain: 'example.com', path: '/', secure: false, expirationDate: 1893456000, name: 'NOPE', value: 'ignored' },
        { domain: '.accounts.google.com', path: '/', secure: true, name: 'LSID', value: 'login' },
    ])

    assert.match(text, /# Netscape HTTP Cookie File/)
    assert.match(text, /\.youtube\.com\tTRUE\t\/\tTRUE\t1893456000\tSID\tsecret/)
    assert.match(text, /\.accounts\.google\.com\tTRUE\t\/\tTRUE\t0\tLSID\tlogin/)
    assert.doesNotMatch(text, /example\.com/)
})

test('detects auth-related yt-dlp failures for cookie retry', () => {
    assert.equal(isYtdlAuthError('Sign in to confirm you are not a bot'), true)
    assert.equal(isYtdlAuthError('ERROR: This video is members-only'), true)
    assert.equal(isYtdlAuthError('HTTP Error 404: Not Found'), false)
})

