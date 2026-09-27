# Bundled FFmpeg and ffprobe

The Tauri test packages bundle separate GPLv3 command-line programs. Gorex communicates with them by spawning processes. The archive hashes are pinned in `scripts/prepare-tauri-binaries.mjs`; that script rejects an FFmpeg build configured with `--enable-nonfree`.

| Platform | Build | Upstream package | Source |
| --- | --- | --- | --- |
| macOS arm64 | FFmpeg 9.0.2, Martin Riedl | `https://ffmpeg.martin-riedl.de/download/macos/arm64/1789931890_9.0.2/` | `https://ffmpeg.org/releases/ffmpeg-9.0.2.tar.xz` |
| Windows x64 | FFmpeg 8.1.2 full, ffprobe 8.1.2 essentials, gyan.dev | `https://www.gyan.dev/ffmpeg/builds/packages/ffmpeg-8.1.2-full_build.7z` and `https://www.gyan.dev/ffmpeg/builds/packages/ffmpeg-8.1.2-essentials_build.7z` | `https://github.com/FFmpeg/FFmpeg/commit/38b88335f9` |

The GPLv3 text is in `GPL-3.0.txt`. Both build providers publish package hashes, which the preparation script checks. The Windows archive also contains its own license and build configuration. The upstream FFmpeg source and the libraries enabled in each binary have their own licenses and corresponding source requirements; these must be audited before public release.

**macOS compatibility gate:** The current macOS binaries declare macOS 12.0 as their minimum version, and test packages declare the same minimum. The product target remains macOS 11.0, so these test packages do not yet meet that target. Compatible tool builds and runtime validation on a macOS 11 machine are required before release.
