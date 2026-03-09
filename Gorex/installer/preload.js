'use strict'

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
    closeWindow:        ()        => ipcRenderer.send('window-close'),
    minimizeWindow:     ()        => ipcRenderer.send('window-minimize'),

    getDefaultInstallDir: ()      => ipcRenderer.invoke('get-default-install-dir'),
    browseDir:          ()        => ipcRenderer.invoke('browse-dir'),
    getDiskSpace:       (p)       => ipcRenderer.invoke('get-disk-space', p),

    install:            (opts)    => ipcRenderer.send('install', opts),
    onInstallProgress:  (cb)      => {
        ipcRenderer.on('install-progress', (_e, data) => cb(data))
    },

    getMode:            ()        => ipcRenderer.invoke('get-mode'),
    checkInstalled:     ()        => ipcRenderer.invoke('check-installed'),
    uninstall:          (opts)    => ipcRenderer.send('uninstall', opts),
    onUninstallProgress:(cb)      => {
        ipcRenderer.on('uninstall-progress', (_e, data) => cb(data))
    },

    launchApp:          (opts)    => ipcRenderer.send('launch-app', opts),
    elevate:            ()        => ipcRenderer.invoke('elevate'),
})
