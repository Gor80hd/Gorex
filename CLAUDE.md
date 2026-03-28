# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Electron + Vite with HMR
npm run build      # Compile with electron-vite (no installer)
npm run pack       # Pack without installer (electron-builder --dir)
npm run dist       # Full build with NSIS installer for Windows
npm run preview    # Preview built application
```

No test or lint scripts are configured.

## Architecture

**Gorex** is a Windows desktop video converter/downloader built with Electron + React + Vite.

### Three-tier Electron structure

```
Main Process (Node.js)     →   Preload Bridge        →   Renderer (React SPA)
src/main/index.js              src/preload/index.js       src/renderer/src/
```

- **Main process** (`src/main/index.js`, ~2500 lines) — spawns FFmpeg/ffprobe and yt-dlp as child processes, runs two local HTTP servers, handles all IPC, manages settings persistence in `userData/gorex-settings.json`, GPU detection, and system tray with progress overlay.
- **Preload** (`src/preload/index.js`) — exposes ~40 methods as `window.api` via `contextBridge`. All renderer↔main communication goes through this bridge. Never add `ipcRenderer` calls directly in the renderer.
- **Renderer** (`src/renderer/src/`) — single React SPA. All state lives in `App.jsx` (React hooks). View routing is manual via a `view` state variable: `source → list → settings → about`.

### Two HTTP servers in main process

1. **Renderer server** (ports 19857–19861) — serves the built React SPA over HTTP so `localStorage` has a stable origin. A `file://` origin would reset localStorage on every launch because localStorage is keyed by origin.
2. **Extension API server** (ports 19870–19875) — minimal REST API for the Chrome extension. Endpoints: `GET /gorex-api/ping`, `GET /gorex-api/queue`, `GET /gorex-api/formats?url=`, `POST /gorex-api/queue/add`, `POST /gorex-api/queue/remove`. Only accepts requests from `chrome-extension://` or `127.0.0.1` origins.

### State management in App.jsx

`App.jsx` is the central state machine. Key state:
- `videos` — the queue array. Each item has `id`, `status`, `progress`, and either local file fields or `isYtdlItem: true` with `ytdlUrl/ytdlFormats/ytdlSelectedFormat`.
- `selectedSettings` — global encoding defaults (codec, quality, speed).
- `isEncoding / isPaused` — encoding session state.
- `view` — current page (`'source'`, `'list'`, `'settings'`, `'about'`).

Video `status` values: `ready`, `format_select`, `encoding`, `downloading`, `downloading-subs`, `converting`, `done`, `error`.

### Settings persistence — two stores

- **Renderer-side** (`localStorage`): theme, accent color, encoding defaults (`gorex-default-settings`), app config (`gorex-app-config`), onboarding flag (`gorex-onboarding-done`).
- **Main-side** (`userData/gorex-settings.json`): ytdl cookies path, CLI tool path, background mode, output dir. Read by the main process directly when spawning child processes. Written via `window.api.saveAppSettings()`.

### IPC patterns

- `ipcRenderer.send` / `ipcMain.on` — fire-and-forget (start/stop/pause jobs, window controls).
- `ipcRenderer.invoke` / `ipcMain.handle` — request/response (file dialogs, settings read/write, format fetching).
- `ipcRenderer.on` — streaming events pushed from main (cli-output, cli-progress, ytdl-progress, ytdl-exit, etc.).

IPC listeners for streaming events are registered at **module level** in `App.jsx` (not inside `useEffect`) so they survive HMR without re-subscribing.

### Chrome Extension

Located in `chrome-extension/`. Separate MV3 extension — not bundled with the Electron app. Communicates with the running desktop app via the Extension API server on loopback. Injects download buttons on 25+ video platforms via content scripts. Requires Gorex v2.1.0+ to be running.

### Key files

| File | Purpose |
|------|---------|
| `src/main/index.js` | Main process: IPC handlers, HTTP servers, FFmpeg/yt-dlp runners, GPU detection, tray |
| `src/preload/index.js` | Full `window.api` surface exposed to renderer |
| `src/renderer/src/App.jsx` | Root state machine, IPC listeners, encoding/download orchestration |
| `src/renderer/src/i18n.jsx` | EN/RU translation dictionaries (React context, `useLanguage()` hook) |
| `src/renderer/src/components/GlobalSettings/GlobalSettings.jsx` | Encoder/codec/quality settings logic + `DEFAULT_SETTINGS`, `CODEC_RF` tables |
| `src/renderer/src/pages/ListPage/ListPage.jsx` | Task queue UI, progress bars, per-video controls |
| `chrome-extension/background.js` | Extension service worker |
| `chrome-extension/content/content.js` | Page injection, download buttons, queue overlay |

### Bundled binaries

FFmpeg, ffprobe, and yt-dlp are bundled as native binaries. `asarUnpack` in `package.json` keeps FFmpeg/ffprobe outside the asar archive. yt-dlp lives in `resources/ytdl/`. Access paths via the helper functions in `src/main/index.js` (`getYtdlPath()`, etc.) — never hardcode.

### Custom protocol

`gorex-media://` is a registered privileged scheme that tunnels local file reads through the main process. Required because the renderer runs on `http://127.0.0.1`, where `file://` URLs are blocked by Chromium's CORS policy.

### Styling

SCSS with `modern-compiler` API. Component styles are co-located (`ComponentName.scss` next to `ComponentName.jsx`). Themes (`dark`/`light`) and accent colors (`purple`/`white`) are applied as `data-theme` and `data-accent` attributes on the root element.

### i18n

All UI strings go through `useLanguage()` → `t('key')`. Both `ru` and `en` keys must be added to the `TRANSLATIONS` object in `i18n.jsx`. The language is stored in `localStorage` and detected from the system locale on first launch.
