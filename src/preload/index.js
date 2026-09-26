import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
    platform: process.platform,
    runCli: (args) => ipcRenderer.send('run-cli', args),
    stopAll: () => ipcRenderer.send('stop-all-cli'),
    pauseAll: () => ipcRenderer.send('pause-all-cli'),
    resumeAll: () => ipcRenderer.send('resume-all-cli'),
    onCliOutput: (callback) => { ipcRenderer.removeAllListeners('cli-output'); ipcRenderer.on('cli-output', (_, data) => callback(data)) },
    onCliError: (callback) => { ipcRenderer.removeAllListeners('cli-error'); ipcRenderer.on('cli-error', (_, data) => callback(data)) },
    onCliExit: (callback) => { ipcRenderer.removeAllListeners('cli-exit'); ipcRenderer.on('cli-exit', (_, payload) => callback(payload)) },
    onCliProgress: (callback) => { ipcRenderer.removeAllListeners('cli-progress'); ipcRenderer.on('cli-progress', (_, payload) => callback(payload)) },
    selectFiles: () => ipcRenderer.invoke('select-files'),
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    checkCli: () => ipcRenderer.invoke('check-cli'),
    getDefaultOutputDir: () => ipcRenderer.invoke('get-default-output-dir'),
    getVideoData: (filePaths) => ipcRenderer.invoke('get-video-data', filePaths),
    getAppSettings: () => ipcRenderer.invoke('get-app-settings'),
    saveAppSettings: (settings) => ipcRenderer.invoke('save-app-settings', settings),
    getGpuInfo: () => ipcRenderer.invoke('get-gpu-info'),
    getYtdlInfo: () => ipcRenderer.invoke('get-ytdl-info'),
    getYtdlLatestInfo: () => ipcRenderer.invoke('get-ytdl-latest-info'),
    updateYtdl: () => ipcRenderer.invoke('update-ytdl'),
    onYtdlUpdateProgress: (callback) => { ipcRenderer.removeAllListeners('ytdl-update-progress'); ipcRenderer.on('ytdl-update-progress', (_, data) => callback(data)) },
    getTwitchInfo: () => ipcRenderer.invoke('get-twitch-info'),
    getTwitchLatestInfo: () => ipcRenderer.invoke('get-twitch-latest-info'),
    updateTwitch: () => ipcRenderer.invoke('update-twitch'),
    onTwitchUpdateProgress: (callback) => { ipcRenderer.removeAllListeners('twitch-update-progress'); ipcRenderer.on('twitch-update-progress', (_, data) => callback(data)) },
    twitchResolveUrl: (url) => ipcRenderer.invoke('twitch-resolve-url', { url }),
    twitchGetChannelVideos: (channel, options = {}) => ipcRenderer.invoke('twitch-get-channel-videos', { channel, ...options }),
    twitchDownloadChat: (args) => ipcRenderer.invoke('twitch-download-chat', args),
    twitchExportChat: (args) => ipcRenderer.invoke('twitch-export-chat', args),
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
    quit: () => ipcRenderer.send('app-quit'),
    updateNativeMenu: (state) => ipcRenderer.send('native-menu-state', state),
    onNativeMenuAction: (callback) => {
        const listener = (_, action) => callback(action)
        ipcRenderer.on('native-menu-action', listener)
        return () => ipcRenderer.removeListener('native-menu-action', listener)
    },
    openDevTools: () => ipcRenderer.send('open-devtools'),
    ytdlGetFormats: (url, options = {}) => ipcRenderer.invoke('ytdl-get-formats', { url, ...options }),
    ytdlCancelFetch: () => ipcRenderer.send('ytdl-cancel-fetch'),
    cancelVideoData: () => ipcRenderer.send('cancel-video-data'),
    onYtdlFetchProgress: (callback) => { ipcRenderer.removeAllListeners('ytdl-fetch-progress'); ipcRenderer.on('ytdl-fetch-progress', (_, data) => callback(data)) },
    selectSubtitleFile: () => ipcRenderer.invoke('select-subtitle-file'),
    selectCookiesFile: () => ipcRenderer.invoke('select-cookies-file'),
    ytdlRun: (args) => ipcRenderer.send('ytdl-run', args),
    onYtdlProgress: (callback) => { ipcRenderer.removeAllListeners('ytdl-progress'); ipcRenderer.on('ytdl-progress', (_, data) => callback(data)) },
    onYtdlExit: (callback) => { ipcRenderer.removeAllListeners('ytdl-exit'); ipcRenderer.on('ytdl-exit', (_, data) => callback(data)) },
    onYtdlOutput: (callback) => { ipcRenderer.removeAllListeners('ytdl-output'); ipcRenderer.on('ytdl-output', (_, data) => callback(data)) },
    twitchRun: (args) => ipcRenderer.send('twitch-run', args),
    onTwitchProgress: (callback) => { ipcRenderer.removeAllListeners('twitch-progress'); ipcRenderer.on('twitch-progress', (_, data) => callback(data)) },
    onTwitchExit: (callback) => { ipcRenderer.removeAllListeners('twitch-exit'); ipcRenderer.on('twitch-exit', (_, data) => callback(data)) },
    onTwitchOutput: (callback) => { ipcRenderer.removeAllListeners('twitch-output'); ipcRenderer.on('twitch-output', (_, data) => callback(data)) },
    openTempFolder: () => ipcRenderer.invoke('open-temp-folder'),
    openOutputLocation: (outputPath) => ipcRenderer.invoke('open-output-location', outputPath),
    clearTempFolder: () => ipcRenderer.invoke('clear-temp-folder'),
    clearAllSettings: () => ipcRenderer.invoke('clear-all-settings'),
    relaunchApp: () => ipcRenderer.invoke('relaunch-app'),
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    checkForUpdates: (options = {}) => ipcRenderer.invoke('check-for-updates', options),
    openExternal: (url) => ipcRenderer.invoke('open-external', url),
    setBackgroundMode: (enabled) => ipcRenderer.invoke('set-background-mode', enabled),
    openYoutubeLoginWindow: () => ipcRenderer.invoke('open-youtube-login-window'),
    exportYoutubeCookies: () => ipcRenderer.invoke('export-youtube-cookies'),
    clearYoutubeAuth: () => ipcRenderer.invoke('clear-youtube-auth'),
    getYoutubeAuthStatus: () => ipcRenderer.invoke('get-youtube-auth-status'),
    // Chrome extension integration
    onExtensionAddToQueue: (callback) => {
        ipcRenderer.removeAllListeners('extension-add-to-queue')
        ipcRenderer.on('extension-add-to-queue', (_, data) => callback(data))
    },
    onExtensionRemoveFromQueue: (callback) => {
        ipcRenderer.removeAllListeners('extension-remove-from-queue')
        ipcRenderer.on('extension-remove-from-queue', (_, data) => callback(data))
    },
    extensionUpdateQueue: (queue) => ipcRenderer.send('extension-update-queue', queue),
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('electron', electronAPI)
        contextBridge.exposeInMainWorld('api', api)
    } catch (error) {
        console.error(error)
    }
} else {
    window.electron = electronAPI
    window.api = api
}
