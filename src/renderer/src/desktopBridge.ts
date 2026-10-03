import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { createDesktopBridge } from './desktopClient'
export * from './desktopClient'

export const desktopBridge = createDesktopBridge({ invoke, listen }, navigator.userAgent.includes('Mac') ? 'darwin' : 'win32')

declare global {
  interface Window {
    api: typeof desktopBridge
    electron?: { webUtils?: { getPathForFile(file: File): string } }
  }
}

if ('__TAURI_INTERNALS__' in window) {
  window.api = desktopBridge
}
