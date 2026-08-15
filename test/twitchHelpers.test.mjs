import test from 'node:test'
import assert from 'node:assert/strict'
import {
    compareTwitchVersions,
    formatTwitchChatText,
    isTwitchUpdateAvailable,
    normalizeTwitchVersion,
    parseTwitchM3u8QualityOptions,
    normalizeTwitchVideoInfo,
    parseTwitchChatMessages,
    parseTwitchInfoOutput,
    parseTwitchUrl,
    selectTwitchDownloaderAsset,
} from '../src/main/twitchHelpers.mjs'

test('detects Twitch VOD, clip and channel URLs', () => {
    assert.deepEqual(parseTwitchUrl('https://www.twitch.tv/videos/123456789?filter=archives'), {
        ok: true,
        type: 'vod',
        id: '123456789',
        sourceUrl: 'https://www.twitch.tv/videos/123456789?filter=archives',
    })

    const clip = parseTwitchUrl('https://clips.twitch.tv/NurturingCalmHamburgerVoHiYo')
    assert.equal(clip.ok, true)
    assert.equal(clip.type, 'clip')
    assert.equal(clip.id, 'NurturingCalmHamburgerVoHiYo')

    const channelClip = parseTwitchUrl('https://www.twitch.tv/some_channel/clip/SlugHere')
    assert.equal(channelClip.type, 'clip')
    assert.equal(channelClip.channel, 'some_channel')

    const channel = parseTwitchUrl('https://twitch.tv/some_channel/videos')
    assert.equal(channel.ok, true)
    assert.equal(channel.type, 'channel')
    assert.equal(channel.channel, 'some_channel')
})

test('rejects unsupported Twitch paths as channels', () => {
    assert.equal(parseTwitchUrl('https://www.twitch.tv/directory').ok, false)
    assert.equal(parseTwitchUrl('https://example.com/videos/123').ok, false)
})

test('selects the CLI release asset for the current platform', () => {
    const release = {
        assets: [
            { name: 'TwitchDownloaderWPF-1.56.4-Windows-x64.zip', browser_download_url: 'gui' },
            { name: 'TwitchDownloaderCLI-1.56.4-Linux-x64.zip', browser_download_url: 'linux' },
            { name: 'TwitchDownloaderCLI-1.56.4-Windows-x64.zip', browser_download_url: 'win' },
        ],
    }

    assert.equal(selectTwitchDownloaderAsset(release, 'win32', 'x64').browser_download_url, 'win')
})

test('selects Apple Silicon CLI assets without falling back to another OS', () => {
    const release = {
        assets: [
            { name: 'TwitchDownloaderCLI-1.56.4-Linux-arm64.zip', browser_download_url: 'linux-arm' },
            { name: 'TwitchDownloaderCLI-1.56.4-MacOS-arm64.zip', browser_download_url: 'mac-arm' },
        ],
    }

    assert.equal(selectTwitchDownloaderAsset(release, 'darwin', 'arm64').browser_download_url, 'mac-arm')
    assert.equal(selectTwitchDownloaderAsset({ assets: release.assets.slice(0, 1) }, 'darwin', 'arm64'), null)
})

test('compares TwitchDownloader versions', () => {
    assert.equal(normalizeTwitchVersion('TwitchDownloaderCLI 1.56.4+7e8b587c9c57e660bf53bbdd9bc11ad5d25dc1d8'), '1.56.4')
    assert.equal(compareTwitchVersions('TwitchDownloaderCLI 1.56.4', '1.56.3'), 1)
    assert.equal(compareTwitchVersions('TwitchDownloaderCLI 1.56.4+7e8b587c9c57e660bf53bbdd9bc11ad5d25dc1d8', '1.56.4'), 0)
    assert.equal(isTwitchUpdateAvailable('1.56.4', '1.56.4'), false)
    assert.equal(isTwitchUpdateAvailable('1.56.4+7e8b587c9c57e660bf53bbdd9bc11ad5d25dc1d8', '1.56.4'), false)
    assert.equal(isTwitchUpdateAvailable('1.55.9', '1.56.4'), true)
})

test('parses table-like CLI info and normalizes a queue item', () => {
    const parsed = parseTwitchInfoOutput('Title: Stream title\nChannel: streamer\nDuration: 3600')
    const info = normalizeTwitchVideoInfo(parsed, { id: '123', type: 'vod', url: 'https://twitch.tv/videos/123' })
    assert.equal(info.id, '123')
    assert.equal(info.title, 'Stream title')
    assert.equal(info.channel, 'streamer')
    assert.equal(info.duration, '1:00:00')
})

test('normalizes Twitch GQL thumbnail fields and quality options', () => {
    const info = normalizeTwitchVideoInfo({
        id: '123',
        title: 'Stream title',
        previewThumbnailURL: 'https://static-cdn.jtvnw.net/thumb.jpg',
        length_seconds: 120,
        qualityOptions: [{ value: 'Source', label: 'Source (1080p60)', source: true, height: 1080, fps: 60 }],
    }, { type: 'vod', url: 'https://twitch.tv/videos/123' })

    assert.equal(info.thumbnail, 'https://static-cdn.jtvnw.net/thumb.jpg')
    assert.equal(info.duration, '2:00')
    assert.equal(info.twitchQuality, 'Source')
    assert.equal(info.resolution, 'Source (1080p60)')
})

test('parses Twitch M3U8 quality variants', () => {
    const qualities = parseTwitchM3u8QualityOptions(`#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=7816000,RESOLUTION=1920x1080,FRAME-RATE=60.000,VIDEO="chunked"
https://example.com/chunked/index-dvr.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=3360000,RESOLUTION=1280x720,FRAME-RATE=60.000,VIDEO="720p60"
https://example.com/720p60/index-dvr.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1600000,RESOLUTION=852x480,FRAME-RATE=30.000,VIDEO="480p30"
https://example.com/480p30/index-dvr.m3u8`)

    assert.deepEqual(qualities.map(option => option.value), ['Source', '720p60', '480p'])
    assert.equal(qualities[0].label, 'Source (1080p60)')
})

test('parses Twitch chat JSON into searchable messages', () => {
    const messages = parseTwitchChatMessages({
        comments: [
            {
                _id: 'a',
                content_offset_seconds: 83.2,
                commenter: { display_name: 'Viewer' },
                message: { body: 'hello chat' },
            },
            {
                _id: 'b',
                content_offset_seconds: 90,
                commenter: { name: 'other' },
                message: { fragments: [{ text: 'pog' }, { text: ' moment' }] },
            },
        ],
    })

    assert.equal(messages.length, 2)
    assert.equal(messages[0].timeLabel, '1:23')
    assert.equal(messages[1].body, 'pog moment')
    assert.match(formatTwitchChatText(messages), /\[1:23\] Viewer: hello chat/)
})
