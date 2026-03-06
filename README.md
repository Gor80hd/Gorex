# Gorex — BPRESS Build Guide

A fork of [HandBrake](https://github.com/HandBrake/HandBrake) with a custom Electron-based UI called **BPRESS** (React + Vite).

---

## Repository structure

```
Gorex/
├── build/               ← HandBrakeCLI output directory (created after compilation)
├── contrib/             ← Third-party dependencies (built automatically)
├── libhb/               ← HandBrake core library (C)
├── handbrake-web-ui/    ← BPRESS Electron UI (React + Vite)
└── others/              ← Original HandBrake files (GTK, macOS, Windows GUI, scripts)
```

---

## Part 1: Clone the repository

```bash
git clone https://github.com/Gor80hd/Gorex.git
cd Gorex
```

---

## Part 2: Build HandBrakeCLI

> The `build/` directory is not included in the repository. You must compile HandBrakeCLI at least once before running the UI.

### Windows

**Requirements:**

| Tool | Version | Link |
|---|---|---|
| MSYS2 + MinGW-w64 | latest | https://www.msys2.org |
| Git | any | https://git-scm.com |
| Nasm | ≥ 2.13 | https://www.nasm.us |
| Python | ≥ 3.6 | https://www.python.org |

Open **MSYS2 MinGW 64-bit** and install dependencies:

```bash
pacman -Syu
pacman -S base-devel mingw-w64-x86_64-toolchain mingw-w64-x86_64-cmake \
  mingw-w64-x86_64-nasm mingw-w64-x86_64-meson mingw-w64-x86_64-ninja \
  git python3 autoconf automake libtool patch
```

Build:

```bash
# From the repository root, inside MSYS2
./others/configure --launch-jobs=$(nproc) --launch
```

The binary will appear at `build/HandBrakeCLI.exe`.

### macOS

```bash
brew install cmake ninja nasm pkg-config python3 meson
./others/configure --launch-jobs=$(sysctl -n hw.ncpu) --launch
```

### Linux (Ubuntu/Debian)

```bash
sudo apt-get install build-essential cmake nasm ninja-build meson \
  libass-dev libdvdread-dev libdvdnav-dev libxml2-dev \
  libvorbis-dev libopus-dev libx264-dev

./others/configure --launch-jobs=$(nproc) --launch
```

For other distros see the [HandBrake Linux Build Guide](https://handbrake.fr/docs/en/latest/developer/build-linux.html).

---

## Part 3: Run and build BPRESS (Electron UI)

### Requirements

| Tool | Version | Link |
|---|---|---|
| Node.js | ≥ 18 LTS | https://nodejs.org |
| npm | ≥ 9 | included with Node.js |

### Install dependencies

```bash
cd handbrake-web-ui
npm install
```

### Development mode (hot reload)

```bash
npm run dev
```

### Production build

```bash
# Bundle only (no installer)
npm run build

# Package into a folder (no installer)
npm run pack

# Full distribution with installer
npm run dist
```

Output will be in `handbrake-web-ui/dist/`.

---

## Part 4: Full setup from scratch

```bash
# 1. Clone
git clone https://github.com/Gor80hd/Gorex.git
cd Gorex

# 2. (Optional) Build HandBrakeCLI if you need to recompile the core
./others/configure --launch-jobs=$(nproc) --launch

# 3. Install UI dependencies
cd handbrake-web-ui
npm install

# 4a. Run in development mode
npm run dev

# 4b. Or build a distributable
npm run dist
```

---

## Environment variables

Create a `.env` file in `handbrake-web-ui/` if you need to override the CLI path:

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
