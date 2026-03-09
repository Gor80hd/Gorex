# Gorex — BPRESS Build Guide

A fork of [HandBrake](https://github.com/HandBrake/HandBrake) with a custom Electron-based UI called **BPRESS** (React + Vite).

---

## Repository structure

```
├── src/                 ← Electron UI source (React + Vite)
│   ├── main/            ← Electron main process
│   ├── preload/         ← Preload bridge
│   └── renderer/        ← React UI
├── resources/           ← Bundled binaries (HandBrakeCLI.exe, ytdl, ffmpeg)
├── installer/           ← Custom installer (Electron-based)
├── build/               ← Build scripts (make-installer.js, etc.)
└── out/                 ← Compiled output (auto-generated, not in git)
```

---

## Quick start (after clone)

```bash
git clone https://github.com/Gor80hd/Gorex.git
cd Gorex
npm install
npm run dev
```

> `HandBrakeCLI.exe` is already bundled in `resources/` — no manual compilation needed.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Development mode with hot reload |
| `npm run build` | Compile to `out/` |
| `npm run dist` | Full production build + NSIS installer |
| `npm run make-installer` | Build custom installer (`build/make-installer.js`) |

---

## Part 4: Full setup from scratch

```bash
# 1. Clone
git clone https://github.com/Gor80hd/Gorex.git
cd Gorex

# 2. (Optional) Build HandBrakeCLI if you need to recompile the core
./others/configure --launch-jobs=$(nproc) --launch

# 3. Install UI dependencies
cd Gorex
npm install

# 4a. Run in development mode
npm run dev

# 4b. Or build a distributable
npm run dist
```

---

## Environment variables

Create a `.env` file in `Gorex/` if you need to override the CLI path:

```env
# Default: ../build/HandBrakeCLI.exe (Windows) or ../build/HandBrakeCLI (Linux/macOS)
HANDBRAKE_CLI_PATH=../build/HandBrakeCLI.exe
```

---

## Useful links

- [HandBrake Documentation](https://handbrake.fr/docs)
- [HandBrake Windows Build Guide](https://handbrake.fr/docs/en/latest/developer/build-windows.html)
- [HandBrake macOS Build Guide](https://handbrake.fr/docs/en/latest/developer/build-mac.html)
- [HandBrake Linux Build Guide](https://handbrake.fr/docs/en/latest/developer/build-linux.html)
- [electron-vite docs](https://electron-vite.org)
- [electron-builder docs](https://www.electron.build)
