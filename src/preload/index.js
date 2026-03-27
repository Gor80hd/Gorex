import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
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
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
    openDevTools: () => ipcRenderer.send('open-devtools'),
    ytdlGetFormats: (url) => ipcRenderer.invoke('ytdl-get-formats', url),
    ytdlCancelFetch: () => ipcRenderer.send('ytdl-cancel-fetch'),
    onYtdlFetchProgress: (callback) => { ipcRenderer.removeAllListeners('ytdl-fetch-progress'); ipcRenderer.on('ytdl-fetch-progress', (_, data) => callback(data)) },
    selectSubtitleFile: () => ipcRenderer.invoke('select-subtitle-file'),
    selectCookiesFile: () => ipcRenderer.invoke('select-cookies-file'),
    ytdlRun: (args) => ipcRenderer.send('ytdl-run', args),
    onYtdlProgress: (callback) => { ipcRenderer.removeAllListeners('ytdl-progress'); ipcRenderer.on('ytdl-progress', (_, data) => callback(data)) },
    onYtdlExit: (callback) => { ipcRenderer.removeAllListeners('ytdl-exit'); ipcRenderer.on('ytdl-exit', (_, data) => callback(data)) },
    onYtdlOutput: (callback) => { ipcRenderer.removeAllListeners('ytdl-output'); ipcRenderer.on('ytdl-output', (_, data) => callback(data)) },
    openTempFolder: () => ipcRenderer.invoke('open-temp-folder'),
    clearTempFolder: () => ipcRenderer.invoke('clear-temp-folder'),
    clearAllSettings: () => ipcRenderer.invoke('clear-all-settings'),
    relaunchApp: () => ipcRenderer.invoke('relaunch-app'),
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    openExternal: (url) => ipcRenderer.invoke('open-external', url),
    setBackgroundMode: (enabled) => ipcRenderer.invoke('set-background-mode', enabled),
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
