"use strict";
const electron = require("electron");
const preload = require("@electron-toolkit/preload");
const api = {
  runCli: (args) => electron.ipcRenderer.send("run-cli", args),
  onCliOutput: (callback) => electron.ipcRenderer.on("cli-output", (_, data) => callback(data)),
  onCliError: (callback) => electron.ipcRenderer.on("cli-error", (_, data) => callback(data)),
  onCliExit: (callback) => electron.ipcRenderer.on("cli-exit", (_, payload) => callback(payload)),
  onCliProgress: (callback) => electron.ipcRenderer.on("cli-progress", (_, payload) => callback(payload)),
  selectFiles: () => electron.ipcRenderer.invoke("select-files"),
  getVideoData: (filePaths) => electron.ipcRenderer.invoke("get-video-data", filePaths),
  minimize: () => electron.ipcRenderer.send("window-minimize"),
  maximize: () => electron.ipcRenderer.send("window-maximize"),
  close: () => electron.ipcRenderer.send("window-close")
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
