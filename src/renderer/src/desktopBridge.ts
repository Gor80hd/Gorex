import { invoke } from '@tauri-apps/api/core'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import type { TaskId } from './queueState'

type Payload = Record<string, unknown>
type Listener<T = Payload> = (payload: T) => void

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

function subscribe<T>(event: string, callback: Listener<T>): () => void {
  let active = true
  let unlisten: UnlistenFn | undefined
  void listen<T>(event, ({ payload }) => {
    if (active) callback(payload)
  }).then((stop) => {
    if (active) unlisten = stop
    else stop()
  })
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

export const desktopBridge = {
  platform: navigator.userAgent.includes('Mac') ? 'darwin' : 'win32',
  getAppVersion: () => invoke<string>('get_app_version'),
  getAppSettings: () => invoke<Payload>('get_app_settings'),
  saveAppSettings: (settings: Payload) => invoke<void>('save_app_settings', { settings }),
  clearAllSettings: () => invoke<void>('clear_all_settings'),
  getDefaultOutputDir: () => invoke<string>('get_default_output_dir'),
  selectFiles: () => invoke<string[]>('select_files'),
  selectFolder: () => invoke<string | null>('select_folder'),
  selectSubtitleFile: () => invoke<string | null>('select_subtitle_file'),
  selectCookiesFile: () => invoke<string | null>('select_cookies_file'),
  getVideoData: (filePaths: string[]) => invoke<Payload[]>('get_video_data', { filePaths }),
  cancelVideoData: () => send('cancel_video_data'),
  checkCli: () => invoke<Payload>('check_cli'),
  getGpuInfo: () => invoke<Payload>('get_gpu_info'),
  runCli: (request: Payload) => send('run_cli', { request }),
  stopAll: () => send('stop_all'),
  pauseAll: () => send('pause_all'),
  resumeAll: () => send('resume_all'),
  onCliOutput: (callback: Listener<string>) => subscribe('cli-output', callback),
  onCliError: (callback: Listener<string>) => subscribe('cli-error', callback),
  onCliExit: (callback: Listener<JobExitEvent>) => subscribe('cli-exit', callback),
  onCliProgress: (callback: Listener<JobProgressEvent>) => subscribe('cli-progress', callback),
  ytdlGetFormats: (url: string, options: Payload = {}) => invoke<Payload>('ytdl_get_formats', { request: { url, ...options } }),
  ytdlCancelFetch: () => send('ytdl_cancel_fetch'),
  ytdlRun: (request: Payload) => send('ytdl_run', { request }),
  onYtdlFetchProgress: (callback: Listener) => subscribe('ytdl-fetch-progress', callback),
  onYtdlProgress: (callback: Listener<JobProgressEvent>) => subscribe('ytdl-progress', callback),
  onYtdlOutput: (callback: Listener<ToolOutputEvent>) => subscribe('ytdl-output', callback),
  onYtdlExit: (callback: Listener<JobExitEvent>) => subscribe('ytdl-exit', callback),
  getYtdlInfo: () => invoke<Payload>('get_ytdl_info'),
  getYoutubePlayerUrl: (id: string, start: number) => invoke<string>('get_youtube_player_url', { id, start: Math.max(0, Math.floor(start)) }),
  getYtdlLatestInfo: () => invoke<Payload>('get_ytdl_latest_info'),
  updateYtdl: () => invoke<Payload>('update_ytdl'),
  onYtdlUpdateProgress: (callback: Listener<ToolUpdateEvent>) => subscribe('ytdl-update-progress', callback),
  twitchResolveUrl: (url: string) => invoke<Payload>('twitch_resolve_url', { url }),
  twitchGetChannelVideos: (channel: string, options: Payload = {}) => invoke<Payload>('twitch_get_channel_videos', { channel, ...options }),
  twitchDownloadChat: (request: Payload) => invoke<Payload>('twitch_download_chat', { request }),
  twitchExportChat: (request: Payload) => invoke<Payload>('twitch_export_chat', { request }),
  twitchRun: (request: Payload) => send('twitch_run', { request }),
  getTwitchInfo: () => invoke<Payload>('get_twitch_info'),
  getTwitchLatestInfo: () => invoke<Payload>('get_twitch_latest_info'),
  updateTwitch: () => invoke<Payload>('update_twitch'),
  onTwitchUpdateProgress: (callback: Listener<ToolUpdateEvent>) => subscribe('twitch-update-progress', callback),
  onTwitchProgress: (callback: Listener<JobProgressEvent>) => subscribe('twitch-progress', callback),
  onTwitchOutput: (callback: Listener<ToolOutputEvent>) => subscribe('twitch-output', callback),
  onTwitchExit: (callback: Listener<JobExitEvent>) => subscribe('twitch-exit', callback),
  extensionUpdateQueue: (queue: Payload[]) => send('extension_update_queue', { queue }),
  onExtensionAddToQueue: (callback: Listener) => subscribe('extension-add-to-queue', callback),
  onExtensionRemoveFromQueue: (callback: Listener) => subscribe('extension-remove-from-queue', callback),
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
  checkForUpdates: (options: Payload = {}) => invoke<Payload | null>('check_for_updates', { options }),
  setBackgroundMode: (enabled: boolean) => invoke<void>('set_background_mode', { enabled }),
  openYoutubeLoginWindow: () => invoke<void>('open_youtube_login_window'),
  exportYoutubeCookies: () => invoke<Payload>('export_youtube_cookies'),
  clearYoutubeAuth: () => invoke<void>('clear_youtube_auth'),
  getYoutubeAuthStatus: () => invoke<Payload>('get_youtube_auth_status'),
}

declare global {
  interface Window {
    api: typeof desktopBridge
  }
}

if ('__TAURI_INTERNALS__' in window) {
  window.api = desktopBridge
}
