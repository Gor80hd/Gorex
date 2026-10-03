import type { QueueRequest } from '../../desktopBridge'
import type { EncodingSettings, OutputMode, VideoTask } from '../../domain'

export function createJobRequests(videos: readonly VideoTask[], settings: EncodingSettings, outputMode: OutputMode, outputDir: string): QueueRequest[] {
    return videos.map(video => {
        const shared = {
            id: video.id, outputName: video.outputName,
            clipStart: video.clipStart ?? null, clipEnd: video.clipEnd ?? null,
        }
        if (video.isTwitchItem) return { task: video, kind: 'twitch', request: {
            ...shared, type: video.twitchType || 'vod', url: video.twitchUrl, outputDir,
            convertAfterDownload: video.convertAfterDownload,
            conversionSettings: video.conversionSettings || settings,
            videoResolution: video.videoResolution || null, twitchQuality: video.twitchQuality,
        } }
        if (video.isYtdlItem) return { task: video, kind: 'ytdl', request: {
            ...shared, url: video.ytdlUrl, formatId: video.ytdlSelectedFormat || 'best', outputDir,
            convertAfterDownload: video.convertAfterDownload,
            conversionSettings: video.conversionSettings || settings, videoResolution: video.resolution,
            ytdlDuration: video.ytdlDuration ?? null, noAudio: video.ytdlNoAudio ?? false,
            downloadSubs: video.ytdlDownloadSubs ?? false, autoSubs: video.ytdlAutoSubs ?? false,
            subLangs: video.ytdlSubLangs ?? 'all', subFormat: video.ytdlSubFormat ?? 'srt',
            audioFormat: video.ytdlAudioFormat ?? 'best', sponsorBlock: video.ytdlSponsorBlock ?? false,
            sponsorBlockCats: video.ytdlSponsorBlockCats ?? ['sponsor'],
        } }
        return { task: video, kind: 'ffmpeg', request: {
            ...shared, filePath: video.path, settings: video.customSettings || settings,
            outputMode, customOutputDir: outputDir, videoResolution: video.resolution,
        } }
    })
}
