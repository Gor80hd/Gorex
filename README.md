# Gorex

**English** | [Русский](README.ru.md)

https://github.com/user-attachments/assets/9de1dbf9-ff2e-4f53-b424-2972f7036ba2

**Gorex** is a standalone open-source desktop application for video conversion and downloading. Built with Electron + React + Vite, it delivers a professional-grade, polished experience that makes powerful video processing accessible to everyone — no terminal, no config files, no headaches.

---

## Features

- **Local file conversion** — drag files into the window or pick them via a dialog, configure encoding settings, and start the queue.
- **Download & convert from the web** — paste a link from YouTube, TikTok, Twitter/X, Instagram, VK, Reddit, Twitch, Vimeo, Rutube, and dozens of other services. Gorex downloads the video and can convert it on the fly.
- **Flexible encoding settings**:
  - Video codecs: H.264, H.265/HEVC, AV1 (SVT-AV1), VP8, VP9 — software and hardware (NVIDIA NVENC, Intel QSV, AMD VCE/AMF, MediaFoundation).
  - Full control over quality (RF/CQ), encoding speed, resolution, FPS, crop modes, and deinterlacing.
  - Audio codecs: AAC, HE-AAC, MP3, AC-3, E-AC-3, Vorbis, Opus, FLAC, passthru.
  - Subtitle and HDR metadata support.
  - Filters: deinterlace, deblock, denoise, sharpen.
- **Auto GPU detection** — on first launch Gorex detects your GPU and pre-fills optimal hardware encoding settings.
- **Dark / light theme** — manual toggle or follow the system theme.
- **Multilingual UI** — English and Russian.

---

## Philosophy

*In the words of the author, Egor Akhmatyarov:*

> I'm not a programmer. I'm a designer and videographer — someone who has worked with video for years and knows exactly what a tool for people like me should feel like.
>
> Everything out there either looks like it got stuck in 2005, costs money for every little thing, or just doesn't work right. For a long time I wanted to build something truly beautiful and convenient — not for developers, but for people in the field. The concept lived in my head for a very long time, but making it myself was impossible.
>
> And thanks to AI technology — [Claude](https://claude.ai) — I was finally able to bring this idea to life. Gorex is not just another conversion tool. It's a concept: a tool that respects your time, looks like a product worth being proud of, and works exactly the way a video professional expects.

---

## Tech Stack

| Layer          | Technology                              |
|----------------|-----------------------------------------|
| Shell          | Electron 28                             |
| UI             | React 18 + Vite 5                       |
| Styles         | SCSS + Bootstrap Icons                  |
| Video engine   | FFmpeg (bundled)                        |
| Downloader     | yt-dlp (bundled)                        |
| Media info     | ffprobe / fluent-ffmpeg (bundled)       |
| Build          | electron-vite + electron-builder        |

---

## Requirements

- **Node.js** ≥ 18
- **npm** ≥ 9
- **Windows 10/11** (primary platform; macOS support in progress)

---

## Development

```bash
# 1. Clone the repository
git clone https://github.com/Gor80hd/Gorex.git
cd Gorex

# 2. Install dependencies
npm install

# 3. Start in dev mode (Electron + Vite HMR)
npm run dev
```

The app window will open. Changes in `src/renderer` are applied instantly via Hot Module Replacement.

---

## Build

```bash
# Compile only (no installer)
npm run pack

# Full build with NSIS installer for Windows
npm run dist
```

The built installer will appear in the `dist/` folder.

---

## Project Structure

```
src/
├── main/index.js          ← Electron main: IPC handlers, CLI launch, window management
├── preload/index.js       ← Bridge: window.api → renderer
└── renderer/src/
    ├── App.jsx            ← Root: state machine (view, queue, settings, theme)
    ├── i18n.jsx           ← Translation dictionaries (ru / en)
    ├── components/
    │   ├── TitleBar/      ← Header, main menu, theme toggle, window controls
    │   ├── CliConsole/    ← CLI output debug panel
    │   ├── GlobalSettings/← Encoding settings logic (encoders, RF, speeds)
    │   └── OnboardingScreen/ ← First launch: GPU detection
    └── pages/
        ├── SourcePage/    ← Drag&Drop / URL input for downloads
        ├── ListPage/      ← Task queue + progress bars
        ├── SettingsPage/  ← Full settings: video, audio, subtitles, filters, HDR
        └── AboutPage/     ← About, authors, libraries
```

---

## License

Gorex is distributed under the **GNU General Public License v2**. See [COPYING](COPYING) for details.

---

## Open Source Libraries

Gorex stands on the shoulders of outstanding open-source projects. The application bundles or links the following libraries:

| Library | License |
|---------|---------|
| [yt-dlp](https://github.com/yt-dlp/yt-dlp) | Unlicense |
| [FFmpeg](https://ffmpeg.org/) | LGPL v2.1 / GPL v2 |
| [libx264](https://www.videolan.org/developers/x264.html) | GPL v2 |
| [libx265](http://x265.org/) | GPL v2 |
| [SVT-AV1](https://gitlab.com/AOMediaCodec/SVT-AV1) | BSD 3-Clause |
| [libvpx](https://github.com/webmproject/libvpx/) | BSD 3-Clause |
| [libopus](https://www.opus-codec.org/) | BSD 3-Clause |
| [libvorbis](https://xiph.org/vorbis/) | BSD 3-Clause |
| [libass](https://github.com/libass/libass) | ISC |
| [libdovi](https://github.com/quietvoid/dovi_tool) | MIT |
| [AMD AMF](https://github.com/GPUOpen-LibrariesAndSDKs/AMF) | MIT |
| [NV-codec-headers](https://git.videolan.org/?p=ffmpeg/nv-codec-headers.git) | MIT |
| [libmfx / libvpl](https://github.com/intel/libvpl) | MIT |
| [React](https://react.dev/) | MIT |
| [Electron](https://www.electronjs.org/) | MIT |
| [Vite](https://vitejs.dev/) | MIT |
| [fluent-ffmpeg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg) | MIT |
| [Bootstrap Icons](https://icons.getbootstrap.com/) | MIT |

Full license texts are available in the app's About screen.
