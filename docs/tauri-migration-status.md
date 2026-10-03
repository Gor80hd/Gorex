# Gorex 3.0 Tauri migration status

This document tracks the migration until the Electron runtime can be removed. The source branch is `codex/Tauri2`; it does not alter `main`.

## Compatibility map

- Desktop commands: `src/preload/index.js` exposes file and folder dialogs, FFmpeg and yt-dlp jobs, Twitch jobs and chat, settings, tool updates, YouTube login and cookies, system windows and menus, and extension queue events. `src/renderer/src/desktopBridge.ts` keeps the same method names for the Tauri renderer. The Rust implementations are grouped in `src-tauri/src/` by feature.
- Streaming events: `cli-*`, `ytdl-*`, `twitch-*`, `native-menu-action`, and `extension-*-queue` retain their renderer event names. Listeners return unsubscribe functions.
- Queue states: `ready`, `format_select`, `encoding`, `downloading`, `downloading-subs`, `probing-keyframes`, `cutting-sponsors`, `converting`, `done`, `error`. `src/renderer/src/queueState.ts` defines shared active-state transitions; the Rust `Queue` owns batch lifecycle and state snapshots; `Jobs` owns running processes and their cancellation.
- Chrome extension: loopback ports `19870` through `19875` and `/gorex-api/ping`, `/queue`, `/formats`, `/queue/add`, `/queue/remove` remain available. The local media endpoint is an additional token-based route for preview with byte ranges.
- Bundled tools: platform-specific FFmpeg, ffprobe, yt-dlp, Deno, and TwitchDownloaderCLI are prepared by `npm run prepare:tauri-binaries`. The download script checks SHA-256 digests.

## Current refactor (2026-10-03)

- Strict TypeScript checks, 34 JavaScript tests, 23 Rust tests in release profile, Vite web build, and FFmpeg/ffprobe smoke pass locally after the follow-up fixes.
- Processing queue lifecycle now belongs to Rust. Commands are serialized against a new start; cancellation waits for the batch to drain, progress events carry revisions, and task metadata supports WebView recovery.
- `App`, `ListPage`, and `SettingsPage` are TypeScript modules split into feature hooks, models and UI components. SCSS is unchanged.
- Default npm development/build/distribution commands use Tauri; explicit `:electron` commands retain the comparison baseline until parity gates pass.
- The final local macOS `.app` and `.dmg` 3.0.0 are built. DMG size: 188,641,780 bytes (179.90 MiB); disk-image checksums verify. Cross-platform CI for implementation commit `03af7da` passed: https://github.com/Gor80hd/Gorex/actions/runs/37135218821. Windows passed 22 Rust tests (including real-process pause/resume), 33 JavaScript tests, media-tool smoke, and a silent NSIS install/uninstall to a custom directory. NSIS size: 181,980,626 bytes (173.55 MiB); the installer is saved at `dist/tauri/windows/Gorex_3.0.0_x64-setup.exe`.
- The follow-up macOS `.app` and `.dmg` build and disk-image verification pass; the current DMG is 188,658,288 bytes (179.92 MiB). The Windows artifact and CI results above belong to the preceding implementation commit; these follow-up changes require a new Windows build.
- Development now resolves the same prepared Tauri tool bundle as production. It no longer falls back to Electron's older FFmpeg/ffprobe packages.
- FFmpeg reports its available encoders to the typed client. Both audio codec selectors disable unavailable encoders with localized explanations, including FDK AAC and HE-AAC, instead of submitting commands that the bundled GPL FFmpeg cannot run. FDK output remains unavailable in the current distributable build; full codec parity is still a release decision/gate.
- Current GUI checks: file selection and local HEVC VideoToolbox conversion complete; `ffprobe` confirms HEVC + AAC, 640×360, 12 seconds, and the extension queue reports `done`/100%. The rebuilt app launches again, the native Settings menu opens the correct screen, and the FDK options are visibly disabled. The YouTube window loads YouTube and the Google sign-in form. Authenticated cookie export still awaits a manual account sign-in. Screen locking interrupted the rest of the interactive scenarios.

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

The memory sample used the earlier Tauri tool bundle; it must be repeated with the current binaries. That earlier sample did not measure same-file conversion or controlled cold launch. Tool-update network requests were running during startup and should be excluded from a final timing protocol.

### Controlled FFmpeg conversion sample (2026-10-03)

On this Apple M5 Mac, a generated 60-second 1920×1080/30fps H.264 + AAC input was converted with identical `libx264`, `medium`, CRF 23, AAC 160k arguments. Each binary had one warmup followed by three alternating measured runs; the Rust build had already finished before this sample. Median process wall time was **9.658 seconds** for Electron's FFmpeg 6.0 and **9.524 seconds** for Tauri's FFmpeg 9.0.2 (−1.39%). This small difference does not establish a meaningful encoding speed improvement from Tauri: it compares the tool versions, includes disk output, and excludes application queue/UI overhead. Cold launch, current idle memory, and Windows measurements remain outstanding.

Raw measurements, input hash and all arguments: [macos-conversion-2026-10-03.json](benchmarks/macos-conversion-2026-10-03.json). Reproduce on either platform with `node scripts/benchmark-conversion.mjs INPUT ELECTRON_FFMPEG TAURI_FFMPEG`; Windows accepts paths to the respective `.exe` files.

The local Electron 2.4.0 Windows installer is 197,487,195 bytes (188.34 MiB). The first Tauri 3.0.0 NSIS installer was 214,588,736 bytes (204.65 MiB). Using Gyan's full GPLv3 FFmpeg build for codecs and the same-version essentials ffprobe reduced the successful CI installer to 181,848,515 bytes (173.42 MiB): 32,740,221 bytes smaller than the first Tauri package and 15,638,680 bytes (7.92%) smaller than Electron. The full FFmpeg retains SVT-AV1 and hardware encoders. CI has confirmed H.264 and AV1 encoding and probing with this combination.

## Remaining release gates

- The earlier macOS test bundle inherited FFmpeg/ffprobe with `--enable-nonfree`. The bundling script now uses GPLv3 builds without `--enable-nonfree`, with license texts bundled. A full source/license audit is still required before public distribution.
- The product target remains macOS 11.0, but the current FFmpeg, ffprobe, Deno, and TwitchDownloaderCLI binaries declare macOS 12.0. Test bundles therefore declare 12.0 as their minimum, so macOS 11 users cannot start a package whose tools would fail. Compatible binaries and runtime validation on macOS 11 are required before changing the package minimum to 11.0.
- The yt-dlp EJS guide requires Deno 2.3.0 or newer. An inspected official Deno 2.0.0 Apple Silicon binary declares macOS 14.0, so simply pinning an old Deno 2 release does not solve macOS 11 support. A compatible bundled runtime must be identified or built and tested with real YouTube downloads. See `https://github.com/yt-dlp/yt-dlp/wiki/EJS`.
- Exercise the NSIS installer interactively on Windows 10/11 x64, including migration over GorexSetup, Chrome extension behavior, hardware encoding, media preview, cookies, tray, and repeated launch. CI now covers a fresh silent install/uninstall in a custom directory.
- Test the same full scenario matrix on macOS, especially Twitch VOD and chat, subtitle files, YouTube login and cookie export, and installation over the old app.
- Queue ownership and strict TypeScript conversion of all renderer JSX modules are implemented. The current refactor requires real-device parity validation before removing the remaining Electron baseline. See `tauri-refactor.md` for the new module map and automated checks.
- Confirm Windows pause/resume and process-tree cancellation on a real Windows installation. A Windows-only process-control smoke test now runs in CI, but user-facing behavior remains unverified.
- Measure controlled cold startup and current total idle memory on both platforms, Windows conversion duration, and application-level conversion overhead; fix regressions before replacing Electron in the release workflow. The macOS FFmpeg-only conversion sample and installer sizes are recorded above.
