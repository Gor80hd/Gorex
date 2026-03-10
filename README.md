# Gorex

**English** | [Русский](README.ru.md)

https://github.com/user-attachments/assets/d112d762-f4d3-490e-bd82-d2ae558a3f2f

**Gorex** is an open-source desktop video conversion app built on Electron + React + Vite. It provides a friendly graphical interface for HandBrake CLI and yt-dlp — no command-line knowledge required.

---

## Features

- **Local file conversion** — drag files into the window or pick them via a dialog, configure encoding settings, and start the queue.
- **Download & convert from the web** — paste a link from YouTube, TikTok, Twitter/X, Instagram, VK, Reddit, Twitch, Vimeo, Rutube, and dozens of other services. Gorex downloads via yt-dlp and can convert on the fly.
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
> And thanks to AI technology — [Claude](https://claude.ai) — I was finally able to bring this idea to life. Gorex is not just a wrapper around HandBrake. It's a concept: a tool that respects your time, looks like a product worth being proud of, and works exactly the way a video professional expects.

Gorex is a modern Electron interface for the legendary HandBrake transcoder and yt-dlp downloader. It preserves all the power of the original HandBrake CLI while delivering a convenient and aesthetic open-source user experience.

---

## Tech Stack

| Layer          | Technology                              |
|----------------|-----------------------------------------|
| Shell          | Electron 28                             |
| UI             | React 18 + Vite 5                       |
| Styles         | SCSS + Bootstrap Icons                  |
| Video engine   | HandBrake CLI (bundled)                 |
| Downloader     | yt-dlp (bundled)                        |
| Media info     | ffprobe / fluent-ffmpeg (bundled)       |
| Build          | electron-vite + electron-builder        |

---

## Requirements

- **Node.js** ≥ 18
- **npm** ≥ 9
- **Windows 10/11** (primary platform; macOS support in progress)
- `resources/HandBrakeCLI.exe` — the HandBrake CLI binary must be present in the `resources/` folder

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

> Before building, make sure `resources/HandBrakeCLI.exe` is present — it is not bundled in the repository and must be downloaded separately from the [HandBrake website](https://handbrake.fr/downloads2.php).

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

Bundled components carry their own licenses:
- **HandBrake** — GPL v2
- **yt-dlp** — Unlicense
- **ffmpeg / ffprobe** — LGPL v2.1 / GPL v2
