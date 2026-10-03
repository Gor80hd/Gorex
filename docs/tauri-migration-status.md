# Gorex 3.0 Tauri migration status

This document tracks the migration until the Electron runtime can be removed. The source branch is `codex/Tauri2`; it does not alter `main`.

## Compatibility map

- Desktop commands: `src/preload/index.js` exposes file and folder dialogs, FFmpeg and yt-dlp jobs, Twitch jobs and chat, settings, tool updates, YouTube login and cookies, system windows and menus, and extension queue events. `src/renderer/src/desktopBridge.ts` keeps the same method names for the Tauri renderer. The Rust implementations are grouped in `src-tauri/src/` by feature.
- Streaming events: `cli-*`, `ytdl-*`, `twitch-*`, `native-menu-action`, and `extension-*-queue` retain their renderer event names. Listeners return unsubscribe functions.
- Queue states: `ready`, `format_select`, `encoding`, `downloading`, `downloading-subs`, `probing-keyframes`, `cutting-sponsors`, `converting`, `done`, `error`. `src/renderer/src/queueState.ts` defines shared active-state transitions; the Rust `Queue` owns batch lifecycle and state snapshots; `Jobs` owns running processes and their cancellation.
- Chrome extension: loopback ports `19870` through `19875` and `/gorex-api/ping`, `/queue`, `/formats`, `/queue/add`, `/queue/remove` remain available. The local media endpoint is an additional token-based route for preview with byte ranges.
- Bundled tools: platform-specific FFmpeg, ffprobe, yt-dlp, Deno, and TwitchDownloaderCLI are prepared by `npm run prepare:tauri-binaries`. The download script checks SHA-256 digests.

## Current refactor (2026-10-03)

- Strict TypeScript checks, 33 JavaScript tests, 21 Rust tests in release profile, Vite web build, and FFmpeg/ffprobe smoke pass.
- Processing queue lifecycle now belongs to Rust. Commands are serialized against a new start; cancellation waits for the batch to drain, progress events carry revisions, and task metadata supports WebView recovery.
- `App`, `ListPage`, and `SettingsPage` are TypeScript modules split into feature hooks, models and UI components. SCSS is unchanged.
- Default npm development/build/distribution commands use Tauri; explicit `:electron` commands retain the comparison baseline until parity gates pass.
- These results cover automated code and tool checks. The current GUI still needs revalidation; the Mac control tool reports a locked screen.

## Earlier checks completed on macOS Apple Silicon

- The debug and release Tauri `.app` start and show the existing React interface.
- A local video converted with VideoToolbox; local preview played and sought to a later position.
- A two-minute local video was started with SVT-AV1, paused via the macOS menu, and resumed. The FFmpeg process entered the OS `T` (stopped) state. Stopping returned the queue to ready, terminated FFmpeg, and removed the partial MP4.
- yt-dlp with bundled Deno fetched YouTube metadata and downloaded a test clip. Gorex completed a YouTube download through its UI. The embedded YouTube player played in WKWebView from an isolated loopback page.
- The extension API returned `200` for a Chrome extension origin and `403` for an unrelated web origin.
- `cargo test --manifest-path src-tauri/Cargo.toml --lib`, `node --test test/*.test.mjs`, `npm run typecheck`, and `npm run build:web` pass.
- macOS `.app` and `.dmg` 3.0.0 build. The generated `.dmg` has not been signed or notarized.
- GitHub Actions completed both macOS `.dmg` and Windows NSIS build jobs for commit `f0870a1`. Windows CI passed the process pause/resume smoke, FFmpeg/ffprobe H.264 and AV1 media smoke, and a silent install/uninstall smoke that checked the custom install directory and bundled tool files. Interactive Windows application behavior has not been verified.
- `GlobalSettings` now has a strict TypeScript UI module and a separate typed settings model for presets, compatibility rules, persistence defaults, and output-size estimates. Its former imports still resolve through the UI module; the Tauri web build and legacy Electron build pass after this extraction.

## Size and idle memory sample

Measured on the same Mac with both apps showing the empty source view. RSS is a process total and double-counts shared pages; these numbers are directional, not a physical-memory measurement.

| Metric | Electron 2.4.0 | Tauri 3.0.0 |
| --- | ---: | ---: |
| macOS `.app` on disk | 392 MiB | 328 MiB with GPL FFmpeg |
| macOS `.dmg` | 179 MiB | 179.2 MiB with GPL FFmpeg |
| Idle RSS | 474 MiB across four Electron processes | about 188 MiB including the Gorex process and three WebKit services started with it |

The memory sample used the earlier Tauri tool bundle; it must be repeated with the current binaries. The same conversion file and a controlled cold-launch timing have not yet been measured. Tool-update network requests were running during startup and should be excluded from a final timing protocol.

The local Electron 2.4.0 Windows installer is 197,487,195 bytes (188.34 MiB). The first Tauri 3.0.0 NSIS installer was 214,588,736 bytes (204.65 MiB). Using Gyan's full GPLv3 FFmpeg build for codecs and the same-version essentials ffprobe reduced the successful CI installer to 181,848,515 bytes (173.42 MiB): 32,740,221 bytes smaller than the first Tauri package and 15,638,680 bytes (7.92%) smaller than Electron. The full FFmpeg retains SVT-AV1 and hardware encoders. CI has confirmed H.264 and AV1 encoding and probing with this combination.

## Remaining release gates

- The earlier macOS test bundle inherited FFmpeg/ffprobe with `--enable-nonfree`. The bundling script now uses GPLv3 builds without `--enable-nonfree`, with license texts bundled. A full source/license audit is still required before public distribution.
- The product target remains macOS 11.0, but the current FFmpeg, ffprobe, Deno, and TwitchDownloaderCLI binaries declare macOS 12.0. Test bundles therefore declare 12.0 as their minimum, so macOS 11 users cannot start a package whose tools would fail. Compatible binaries and runtime validation on macOS 11 are required before changing the package minimum to 11.0.
- The yt-dlp EJS guide requires Deno 2.3.0 or newer. An inspected official Deno 2.0.0 Apple Silicon binary declares macOS 14.0, so simply pinning an old Deno 2 release does not solve macOS 11 support. A compatible bundled runtime must be identified or built and tested with real YouTube downloads. See `https://github.com/yt-dlp/yt-dlp/wiki/EJS`.
- Exercise the NSIS installer interactively on Windows 10/11 x64, including migration over GorexSetup, Chrome extension behavior, hardware encoding, media preview, cookies, tray, and repeated launch. CI now covers a fresh silent install/uninstall in a custom directory.
- Test the same full scenario matrix on macOS, especially Twitch VOD and chat, subtitle files, YouTube login and cookie export, and installation over the old app.
- Queue ownership and strict TypeScript conversion of all renderer JSX modules are implemented. The current refactor requires real-device parity validation before removing the remaining Electron baseline. See `tauri-refactor.md` for the new module map and automated checks.
- Confirm Windows pause/resume and process-tree cancellation on a real Windows installation. A Windows-only process-control smoke test now runs in CI, but user-facing behavior remains unverified.
- Measure controlled cold startup, total idle memory, installer size, and conversion duration on both platforms; fix regressions before replacing Electron in the release workflow.
