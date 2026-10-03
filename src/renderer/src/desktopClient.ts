import type { invoke } from '@tauri-apps/api/core'
import type { listen, UnlistenFn } from '@tauri-apps/api/event'
import type { TaskId, TaskStatus } from './queueState'
import type { AppConfig, VideoTask, YtdlMetadata, ToolInfo, LatestToolInfo, GpuInfo, UpdateInfo, YoutubeAuth, TwitchVideo, TwitchChannelPicker, ChatMessage } from './domain'

type Payload = Record<string, unknown>
type Listener<T = Payload> = (payload: T) => void

export interface QueueRequest { task: VideoTask; kind: 'ffmpeg' | 'ytdl' | 'twitch'; request: Payload }
export interface QueueEntry { task?: VideoTask;
  id: TaskId; kind: QueueRequest['kind']; status: TaskStatus; progress: number
  startTime: number; endTime: number | null; outputPath: string | null; error: string | null
}
export interface QueueSnapshot { revision: number; active: boolean; paused: boolean; startedAt: number | null; entries: QueueEntry[] }
interface ToolUpdateResult { ok: boolean; info?: ToolInfo; error?: string }
interface TwitchResolved { ok: boolean; type: string; channel?: string; info?: Partial<TwitchVideo>; parsed?: { id?: string; sourceUrl?: string; channel?: string }; error?: string }

export interface JobProgressEvent {
  id: TaskId
  progress: number
  subsPhase?: boolean
  sponsorBlockPhase?: boolean
  sponsorBlockProbePhase?: boolean
}

export interface JobExitEvent {
  id: TaskId
  code: number
  converting?: boolean
  error?: string
  stderr?: string
  outputPath?: string | null
}

export interface ToolOutputEvent {
  id: TaskId
  data: string
}

export interface ToolUpdateEvent {
  stage: string
  percent?: number | null
  receivedBytes?: number
  totalBytes?: number
}

export function createDesktopBridge(transport: { invoke: typeof invoke; listen: typeof listen }, platform: string) {
  const { invoke, listen } = transport
  function subscribe<T>(event: string, callback: Listener<T>): () => void {
    let active = true
    let unlisten: UnlistenFn | undefined
    void listen<T>(event, ({ payload }) => {
      if (active) callback(payload)
    }).then((stop) => {
      if (active) unlisten = stop
      else stop()
    }).catch(error => console.error(`[Gorex] Could not subscribe to ${event}`, error))
    return () => {
      active = false
      unlisten?.()
    }
  }

  function send(command: string, args?: Payload): void {
    void invoke(command, args).catch((error: unknown) => {
      console.error(`[Gorex] ${command} failed`, error)
    })
  }

  return {
    platform: platform,
    getAppVersion: () => invoke<string>('get_app_version'),
    getAppSettings: () => invoke<AppConfig>('get_app_settings'),
    saveAppSettings: (settings: Payload) => invoke<void>('save_app_settings', { settings }),
    clearAllSettings: () => invoke<void>('clear_all_settings'),
    getDefaultOutputDir: () => invoke<string>('get_default_output_dir'),
    selectFiles: () => invoke<string[]>('select_files'),
    selectFolder: () => invoke<string | null>('select_folder'),
    selectSubtitleFile: () => invoke<string | null>('select_subtitle_file'),
    selectCookiesFile: () => invoke<string | null>('select_cookies_file'),
    getVideoData: (filePaths: string[]) => invoke<Omit<VideoTask, 'status' | 'progress'>[] | null>('get_video_data', { filePaths }),
    cancelVideoData: () => send('cancel_video_data'),
    checkCli: () => invoke<ToolInfo & { error?: string }>('check_cli'),
    getGpuInfo: () => invoke<GpuInfo>('get_gpu_info'),
    runCli: (request: Payload) => send('run_cli', { request }),
    startQueue: (requests: QueueRequest[]) => invoke<QueueSnapshot>('start_queue', { requests }),
    removeQueueItems: (ids: TaskId[]) => invoke<void>('remove_queue_items', { ids }),
    getQueueState: () => invoke<QueueSnapshot>('get_queue_state'),
    onQueueState: (callback: Listener<QueueSnapshot>) => subscribe('queue-state', callback),
    stopAll: () => invoke<void>('stop_all'),
    pauseAll: () => invoke<void>('pause_all'),
    resumeAll: () => invoke<void>('resume_all'),
    onCliOutput: (callback: Listener<string>) => subscribe('cli-output', callback),
    onCliError: (callback: Listener<string>) => subscribe('cli-error', callback),
    onCliExit: (callback: Listener<JobExitEvent>) => subscribe('cli-exit', callback),
    onCliProgress: (callback: Listener<JobProgressEvent>) => subscribe('cli-progress', callback),
    ytdlGetFormats: (url: string, options: Payload = {}) => invoke<YtdlMetadata[]>('ytdl_get_formats', { request: { url, ...options } }),
    ytdlCancelFetch: () => send('ytdl_cancel_fetch'),
    ytdlRun: (request: Payload) => send('ytdl_run', { request }),
    onYtdlFetchProgress: (callback: Listener<{ stage: string; total?: number }>) => subscribe('ytdl-fetch-progress', callback),
    onYtdlProgress: (callback: Listener<JobProgressEvent>) => subscribe('ytdl-progress', callback),
    onYtdlOutput: (callback: Listener<ToolOutputEvent>) => subscribe('ytdl-output', callback),
    onYtdlExit: (callback: Listener<JobExitEvent>) => subscribe('ytdl-exit', callback),
    getYtdlInfo: () => invoke<ToolInfo>('get_ytdl_info'),
    getYoutubePlayerUrl: (id: string, start: number) => invoke<string>('get_youtube_player_url', { id, start: Math.max(0, Math.floor(start)) }),
    getYtdlLatestInfo: () => invoke<LatestToolInfo>('get_ytdl_latest_info'),
    updateYtdl: () => invoke<ToolUpdateResult>('update_ytdl'),
    onYtdlUpdateProgress: (callback: Listener<ToolUpdateEvent>) => subscribe('ytdl-update-progress', callback),
    twitchResolveUrl: (url: string) => invoke<TwitchResolved>('twitch_resolve_url', { url }),
    twitchGetChannelVideos: (channel: string, options: Payload = {}) => invoke<TwitchChannelPicker & { ok: boolean; error?: string }>('twitch_get_channel_videos', { channel, ...options }),
    twitchDownloadChat: (request: Payload) => invoke<{ ok: boolean; error?: string; messages: ChatMessage[]; isComplete: boolean; previewMinutes: number }>('twitch_download_chat', { request }),
    twitchExportChat: (request: Payload) => invoke<{ ok: boolean; error?: string; outputPath?: string }>('twitch_export_chat', { request }),
    twitchRun: (request: Payload) => send('twitch_run', { request }),
    getTwitchInfo: () => invoke<ToolInfo>('get_twitch_info'),
    getTwitchLatestInfo: () => invoke<LatestToolInfo>('get_twitch_latest_info'),
    updateTwitch: () => invoke<ToolUpdateResult>('update_twitch'),
    onTwitchUpdateProgress: (callback: Listener<ToolUpdateEvent>) => subscribe('twitch-update-progress', callback),
    onTwitchProgress: (callback: Listener<JobProgressEvent>) => subscribe('twitch-progress', callback),
    onTwitchOutput: (callback: Listener<ToolOutputEvent>) => subscribe('twitch-output', callback),
    onTwitchExit: (callback: Listener<JobExitEvent>) => subscribe('twitch-exit', callback),
    extensionUpdateQueue: (queue: Payload[]) => send('extension_update_queue', { queue }),
    onExtensionAddToQueue: (callback: Listener<{ url: string; formatId?: string; audioOnly?: boolean; clipStart?: number; clipEnd?: number; convertAfterDownload?: boolean }>) => subscribe('extension-add-to-queue', callback),
    onExtensionRemoveFromQueue: (callback: Listener<{ id: TaskId }>) => subscribe('extension-remove-from-queue', callback),
    minimize: () => send('window_minimize'),
    maximize: () => send('window_maximize'),
    close: () => send('window_close'),
    quit: () => send('app_quit'),
    updateNativeMenu: (state: Payload) => send('update_native_menu', { state }),
    onNativeMenuAction: (callback: Listener<string>) => subscribe('native-menu-action', callback),
    openDevTools: () => send('open_devtools'),
    openExternal: (url: string) => invoke<void>('open_external', { url }),
    openOutputLocation: (outputPath: string) => invoke<void>('open_output_location', { outputPath }),
    openTempFolder: () => invoke<void>('open_temp_folder'),
    clearTempFolder: () => invoke<void>('clear_temp_folder'),
    relaunchApp: () => invoke<void>('relaunch_app'),
    checkForUpdates: (options: Payload = {}) => invoke<UpdateInfo | null>('check_for_updates', { options }),
    setBackgroundMode: (enabled: boolean) => invoke<void>('set_background_mode', { enabled }),
    openYoutubeLoginWindow: () => invoke<void>('open_youtube_login_window'),
    exportYoutubeCookies: () => invoke<YoutubeAuth>('export_youtube_cookies'),
    clearYoutubeAuth: () => invoke<YoutubeAuth>('clear_youtube_auth'),
    getYoutubeAuthStatus: () => invoke<YoutubeAuth>('get_youtube_auth_status'),
  }
}
