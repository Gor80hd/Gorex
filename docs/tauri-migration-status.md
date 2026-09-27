# Gorex 3.0 Tauri migration status

This document tracks the migration until the Electron runtime can be removed. The source branch is `codex/Tauri2`; it does not alter `main`.

## Compatibility map

- Desktop commands: `src/preload/index.js` exposes file and folder dialogs, FFmpeg and yt-dlp jobs, Twitch jobs and chat, settings, tool updates, YouTube login and cookies, system windows and menus, and extension queue events. `src/renderer/src/desktopBridge.ts` keeps the same method names for the Tauri renderer. The Rust implementations are grouped in `src-tauri/src/` by feature.
- Streaming events: `cli-*`, `ytdl-*`, `twitch-*`, `native-menu-action`, and `extension-*-queue` retain their renderer event names. Listeners return unsubscribe functions.
- Queue states: `ready`, `format_select`, `encoding`, `downloading`, `downloading-subs`, `probing-keyframes`, `cutting-sponsors`, `converting`, `done`, `error`. `src/renderer/src/queueState.ts` defines shared active-state transitions; the Rust `Jobs` registry owns running processes and their cancellation.
- Chrome extension: loopback ports `19870` through `19875` and `/gorex-api/ping`, `/queue`, `/formats`, `/queue/add`, `/queue/remove` remain available. The local media endpoint is an additional token-based route for preview with byte ranges.
- Bundled tools: platform-specific FFmpeg, ffprobe, yt-dlp, Deno, and TwitchDownloaderCLI are prepared by `npm run prepare:tauri-binaries`. The download script checks SHA-256 digests.

## Checks completed on macOS Apple Silicon

- The debug and release Tauri `.app` start and show the existing React interface.
- A local video converted with VideoToolbox; local preview played and sought to a later position.
- A two-minute local video was started with SVT-AV1, paused via the macOS menu, and resumed. The FFmpeg process entered the OS `T` (stopped) state. Stopping returned the queue to ready, terminated FFmpeg, and removed the partial MP4.
- yt-dlp with bundled Deno fetched YouTube metadata and downloaded a test clip. Gorex completed a YouTube download through its UI. The embedded YouTube player played in WKWebView from an isolated loopback page.
- The extension API returned `200` for a Chrome extension origin and `403` for an unrelated web origin.
- `cargo test --manifest-path src-tauri/Cargo.toml --lib`, `node --test test/*.test.mjs`, `npm run typecheck`, and `npm run build:web` pass.
- macOS `.app` and `.dmg` 3.0.0 build. The generated `.dmg` has not been signed or notarized.
- GitHub Actions completed both macOS `.dmg` and Windows NSIS build jobs for commit `dcb54de`. The Windows package has not been run on Windows.

## Size and idle memory sample

Measured on the same Mac with both apps showing the empty source view. RSS is a process total and double-counts shared pages; these numbers are directional, not a physical-memory measurement.

| Metric | Electron 2.4.0 | Tauri 3.0.0 |
| --- | ---: | ---: |
| macOS `.app` on disk | 392 MiB | 289 MiB |
| macOS `.dmg` | 179 MiB | 162 MiB |
| Idle RSS | 474 MiB across four Electron processes | about 188 MiB including the Gorex process and three WebKit services started with it |

The same conversion file and a controlled cold-launch timing have not yet been measured. Tool-update network requests were running during startup and should be excluded from a final timing protocol.

## Remaining release gates

- The earlier macOS test bundle inherited FFmpeg/ffprobe with `--enable-nonfree`. The bundling script now uses GPLv3 builds without `--enable-nonfree`, with license texts bundled. A full source/license audit is still required before public distribution.
- The product declares macOS 11.0, but the current FFmpeg, ffprobe, Deno, and TwitchDownloaderCLI binaries declare macOS 12.0. Compatible binaries and runtime validation on macOS 11 are required. Existing package size and memory measurements above used the earlier binaries and must be repeated.
- Build and exercise the NSIS installer on Windows 10/11 x64, including migration over GorexSetup, Chrome extension behavior, hardware encoding, media preview, cookies, tray, and repeated launch.
- Test the same full scenario matrix on macOS, especially Twitch VOD and chat, subtitle files, YouTube login and cookie export, and installation over the old app.
- Move queue ownership fully into Rust and complete strict TypeScript conversion of the remaining JSX modules. Electron and its build scripts remain until parity is established.
- Measure controlled cold startup, total idle memory, installer size, and conversion duration on both platforms; fix regressions before replacing Electron in the release workflow.
