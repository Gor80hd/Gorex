import type { TaskId, TaskStatus } from './queueState'

export type Translate = (key: string) => string
export type Theme = 'dark' | 'light'
export type ThemeMode = Theme | 'auto'
export type View = 'source' | 'list' | 'settings' | 'about'
export type OutputMode = 'default' | 'custom' | 'source'
export type SettingsTab = 'app' | 'video' | 'audio' | 'subtitles' | 'filters' | 'hdr' | 'updates' | 'other'
export interface DownloadService { name: string; color: string; icon?: string; svgPath?: string }
export interface EncodingSettings {
    format: string; resolution: string; fps: string; fpsMode: string
    quality: string; customQuality: number; encoder: string; encoderSpeed?: string
    hwDecoding: string; multiPass: boolean; audioCodec: string; audioBitrate: string
    audioMixdown: string; audioSampleRate: string; chapterMarkers: boolean; optimizeMP4: boolean
    subtitleMode: string; subtitleBurn: boolean; subtitleDefault: boolean; subtitleLanguage: string
    subtitleExternalFile: string; deinterlace: string; denoise: string; deblock: string; sharpen: string
    grayscale: boolean; rotate: string; hdrMetadata: string; keepMetadata: boolean
    inlineParamSets: boolean; alphaChannel: boolean; showAllCodecs: boolean; noAudio?: boolean
}
export interface AppConfig {
    defaultOutputDir?: string; defaultCustomOutputDir?: string; ytdlCookiesFile?: string
    ytdlManagedCookiesFile?: string; ytdlCookiesMode?: string; ytdlAuthLastExportAt?: string
    backgroundMode?: boolean; defaultAudioFormat?: string; cliPath?: string; ytdlDeepFormatSearch?: boolean
    [key: string]: unknown
}
export interface MediaFormat {
    format_id: string; ext?: string; vcodec?: string; acodec?: string; resolution?: string
    height?: number; width?: number; fps?: number; tbr?: number; abr?: number
    filesize?: number; filesize_approx?: number; format_note?: string; audio_channels?: number
}
export interface Chapter { title: string; start_time: number; end_time: number }
export interface SubtitleLanguage { code: string; name?: string; label?: string }
export interface TwitchQuality { value: string; label: string; source?: boolean; height?: number; width?: number; fps?: number }
export interface VideoTask {
    id: TaskId; title: string; outputName: string; status: TaskStatus; progress: number
    path?: string; thumbnail?: string; previewUrl?: string; container?: string; duration?: string
    durationSecs?: number; resolution?: string; videoResolution?: string; videoCodec?: string
    fps?: string; audioCodec?: string; channels?: string; bitrate?: string; size?: string; channel?: string
    startTime?: number | null; endTime?: number | null; outputPath?: string | null
    customSettings?: EncodingSettings | null; conversionSettings?: EncodingSettings | null
    clipStart?: number | null; clipEnd?: number | null; downloadService?: DownloadService | null
    isYtdlItem?: boolean; isTwitchItem?: boolean; convertAfterDownload?: boolean
    ytdlUrl?: string; ytdlFormats?: MediaFormat[]; ytdlSelectedFormat?: string; ytdlChapters?: Chapter[]
    ytdlDuration?: number; ytdlAvailableSubs?: string[]; ytdlAvailableAutoSubs?: string[]
    ytdlNoAudio?: boolean; ytdlDownloadSubs?: boolean; ytdlAutoSubs?: boolean; ytdlSubLangs?: string
    ytdlSubFormat?: string; ytdlAudioFormat?: string; ytdlSponsorBlock?: boolean; ytdlSponsorBlockCats?: string[]
    twitchType?: string; twitchId?: string; twitchUrl?: string; twitchQuality?: string; twitchQualityOptions?: TwitchQuality[]
}
export interface DownloadOptions { autoStart?: boolean;
    preselectedFormat?: string; audioOnly?: boolean; clipStart?: number | null; clipEnd?: number | null; convertAfterDownload?: boolean
}
export interface YtdlOptions {
    noAudio: boolean; downloadSubs: boolean; autoSubs: boolean; subLangs: string; subFormat: string
    audioFormat: string; sponsorBlock: boolean; sponsorBlockCats: string[]
}
export interface ToolInfo { found: boolean; version?: string | null; path?: string | null; error?: string; source?: string; latest?: LatestToolInfo }
export interface LatestToolInfo { latestVersion?: string; downloadUrl?: string; releaseUrl?: string; assetName?: string; publishedAt?: string; [key: string]: unknown }
export interface ToolState {
    status: string; info: ToolInfo | null; latest: LatestToolInfo | null; progress: number | null
    receivedBytes: number; totalBytes: number; stageMessage: string; message: string
}
export interface UpdateInfo { ok?: boolean; available?: boolean; updateAvailable?: boolean; latestVersion?: string; currentVersion?: string; releaseUrl?: string; downloadUrl?: string; error?: string; notes?: string }
export interface GpuInfo { primaryGpu?: string | null; gpus: string[]; vendor: string; accelerationVendor?: string; platform: string }
export interface YoutubeAuth { signedIn?: boolean; cookieCount?: number; managedCookiesFile?: string; cookiesMode?: string; lastExportAt?: string | null }
export interface YtdlMetadata {
    title: string; resolvedUrl?: string; thumbnailUrl?: string; duration?: number; formats: MediaFormat[]
    chapters?: Chapter[]; availableSubs?: string[]; availableAutoSubs?: string[]
}
export interface TwitchVideo {
    id: string; title: string; type?: string; url?: string; thumbnail?: string; duration?: string
    durationSeconds?: number; channel?: string; resolution?: string; videoResolution?: string
    qualityOptions?: TwitchQuality[]; selectedQuality?: string; publishedAt?: string; viewCount?: number; twitchQuality?: string
}
export interface TwitchChannelPicker { channel: string; displayName: string; avatar: string; videos: TwitchVideo[] }
export interface ChatMessage { id: TaskId; timeLabel: string; username?: string; body: string }
export interface ChatViewer {
    video: VideoTask; messages: ChatMessage[]; loading: boolean; loadingFull: boolean
    error: string; isComplete: boolean; previewMinutes: number
}
export interface CliLog { type: 'out' | 'err' | 'ytdl' | 'twitch'; text: string }
export interface CliError { title: string; stderr: string; hint: string }
export function errorMessage(error: unknown, fallback = ''): string {
    return error instanceof Error ? error.message : typeof error === 'string' ? error : fallback
}
