import { invoke } from '@tauri-apps/api/core'

const isTauri = '__TAURI_INTERNALS__' in window
const values = new Map<string, string>()
let flushTimer: ReturnType<typeof setTimeout> | undefined

function flush(): void {
  if (!isTauri) return
  if (flushTimer) clearTimeout(flushTimer)
  flushTimer = setTimeout(() => {
    flushTimer = undefined
    void invoke('save_renderer_storage', { entries: Object.fromEntries(values) }).catch(error => {
      console.error('[Gorex] Could not save preferences', error)
    })
  }, 100)
}

export async function hydrateAppStorage(): Promise<void> {
  if (!isTauri) return
  const settings = await invoke<Record<string, unknown>>('get_app_settings')
  const storage = settings.__rendererStorage
  if (!storage || typeof storage !== 'object' || Array.isArray(storage)) return
  for (const [key, value] of Object.entries(storage)) {
    if (typeof value === 'string') values.set(key, value)
  }
}

export const appStorage = {
  getItem(key: string): string | null {
    return isTauri ? values.get(key) ?? null : localStorage.getItem(key)
  },
  setItem(key: string, value: string): void {
    if (!isTauri) { localStorage.setItem(key, value); return }
    values.set(key, String(value))
    flush()
  },
  removeItem(key: string): void {
    if (!isTauri) { localStorage.removeItem(key); return }
    values.delete(key)
    flush()
  },
  clear(): void {
    if (!isTauri) { localStorage.clear(); return }
    values.clear()
    flush()
  },
}
