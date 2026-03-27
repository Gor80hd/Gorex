# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm install       # Install dependencies
npm run dev       # Start Electron + Vite with HMR

# Build
npm run build     # Compile with electron-vite (no installer)
npm run pack      # Pack without installer (electron-builder --dir)
npm run dist      # Full build with NSIS installer for Windows

# Preview
npm run preview   # Preview built application
```

No test or lint scripts are configured.

## Architecture

**Gorex** is a Windows desktop video converter/downloader built with Electron + React + Vite.

### Three-tier Electron structure

```
Main Process (Node.js)     →   Preload Bridge   →   Renderer (React SPA)
src/main/index.js              src/preload/index.js   src/renderer/src/
```

- **Main process** spawns FFmpeg/ffprobe and yt-dlp as child processes, runs two local HTTP servers (one to serve the React SPA, one REST API for the Chrome extension on ports 19870–19875), handles IPC, manages settings persistence in `userData/settings.json`, GPU detection, and system tray.
- **Preload** exposes ~40 methods as `window.api` via `contextBridge` — all renderer↔main communication goes through this bridge.
- **Renderer** is a single React SPA. State lives in `App.jsx` (React hooks + localStorage). View routing is manual: `source → list → settings → about`.

### Chrome Extension (MV3)

Located in `chrome-extension/`. Separate from the Electron app. Communicates with the running desktop app via loopback REST API (127.0.0.1:19870–19875). Injects download buttons on 25+ video platforms via content scripts. Requires Gorex v2.1.0+ to be running.

### Key files

| File | Purpose |
|------|---------|
| `src/main/index.js` | Main process: IPC, HTTP servers, FFmpeg/yt-dlp runners, GPU detection |
| `src/preload/index.js` | Exposes `window.api` to renderer |
| `src/renderer/src/App.jsx` | Root state machine, IPC listeners, encoding orchestration |
| `src/renderer/src/i18n.jsx` | EN/RU translation dictionaries (context-based) |
| `src/renderer/src/components/GlobalSettings/GlobalSettings.jsx` | Encoder/codec/quality settings logic |
| `src/renderer/src/pages/ListPage/ListPage.jsx` | Task queue, progress bars, per-video controls |
| `chrome-extension/background.js` | Extension service worker |
| `chrome-extension/content/content.js` | Page injection, download buttons, queue overlay |

### Bundled binaries

FFmpeg, ffprobe, and yt-dlp are bundled as native binaries and configured as `asarUnpack` in electron-builder so they remain accessible outside the asar archive. yt-dlp lives in `resources/ytdl/`.

### Build system

`electron.vite.config.mjs` configures three Vite builds (main, preload, renderer). The renderer uses the `@renderer` alias for `src/renderer/src`. SCSS uses the modern-compiler API. The dev server binds to `127.0.0.1` only.

### Settings persistence

User settings are stored in Electron's `userData` directory as `settings.json`. The renderer accesses settings via `window.api` IPC calls, not directly via localStorage.

### Languages

UI supports English and Russian. Translations are in `src/renderer/src/i18n.jsx` as static dictionaries wrapped in a React context.
