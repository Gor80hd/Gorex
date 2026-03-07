"use strict";
const electron = require("electron");
const preload = require("@electron-toolkit/preload");
const api = {
  runCli: (args) => electron.ipcRenderer.send("run-cli", args),
  stopAll: () => electron.ipcRenderer.send("stop-all-cli"),
  pauseAll: () => electron.ipcRenderer.send("pause-all-cli"),
  resumeAll: () => electron.ipcRenderer.send("resume-all-cli"),
  onCliOutput: (callback) => {
    electron.ipcRenderer.removeAllListeners("cli-output");
    electron.ipcRenderer.on("cli-output", (_, data) => callback(data));
  },
  onCliError: (callback) => {
    electron.ipcRenderer.removeAllListeners("cli-error");
    electron.ipcRenderer.on("cli-error", (_, data) => callback(data));
  },
  onCliExit: (callback) => {
    electron.ipcRenderer.removeAllListeners("cli-exit");
    electron.ipcRenderer.on("cli-exit", (_, payload) => callback(payload));
  },
  onCliProgress: (callback) => {
    electron.ipcRenderer.removeAllListeners("cli-progress");
    electron.ipcRenderer.on("cli-progress", (_, payload) => callback(payload));
  },
  selectFiles: () => electron.ipcRenderer.invoke("select-files"),
  selectFolder: () => electron.ipcRenderer.invoke("select-folder"),
  checkCli: () => electron.ipcRenderer.invoke("check-cli"),
  getDefaultOutputDir: () => electron.ipcRenderer.invoke("get-default-output-dir"),
  getVideoData: (filePaths) => electron.ipcRenderer.invoke("get-video-data", filePaths),
  getAppSettings: () => electron.ipcRenderer.invoke("get-app-settings"),
  saveAppSettings: (settings) => electron.ipcRenderer.invoke("save-app-settings", settings),
  getGpuInfo: () => electron.ipcRenderer.invoke("get-gpu-info"),
  minimize: () => electron.ipcRenderer.send("window-minimize"),
  maximize: () => electron.ipcRenderer.send("window-maximize"),
  close: () => electron.ipcRenderer.send("window-close"),
  openDevTools: () => electron.ipcRenderer.send("open-devtools"),
  ytdlGetFormats: (url) => electron.ipcRenderer.invoke("ytdl-get-formats", url),
  ytdlRun: (args) => electron.ipcRenderer.send("ytdl-run", args),
  onYtdlProgress: (callback) => {
    electron.ipcRenderer.removeAllListeners("ytdl-progress");
    electron.ipcRenderer.on("ytdl-progress", (_, data) => callback(data));
  },
  onYtdlExit: (callback) => {
    electron.ipcRenderer.removeAllListeners("ytdl-exit");
    electron.ipcRenderer.on("ytdl-exit", (_, data) => callback(data));
  },
  onYtdlOutput: (callback) => {
    electron.ipcRenderer.removeAllListeners("ytdl-output");
    electron.ipcRenderer.on("ytdl-output", (_, data) => callback(data));
  }
};
if (process.contextIsolated) {
  try {
    electron.contextBridge.exposeInMainWorld("electron", preload.electronAPI);
    electron.contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = preload.electronAPI;
  window.api = api;
}
