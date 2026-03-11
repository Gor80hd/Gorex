# Gorex

[English](README.md) | **Русский**

https://github.com/user-attachments/assets/9de1dbf9-ff2e-4f53-b424-2972f7036ba2

**Gorex** — самостоятельное десктопное приложение для конвертации и загрузки видео с открытым исходным кодом. Построено на Electron + React + Vite и предлагает профессиональный, отшлифованный интерфейс, который делает мощную обработку видео доступной для каждого — без терминала, без конфигов, без лишних сложностей.

---

## Что умеет Gorex

- **Конвертация локальных файлов** — перетащи файлы в окно или выбери через диалог, настрой параметры и запусти очередь.
- **Загрузка видео из сети** — вставь ссылку из YouTube, TikTok, Twitter/X, Instagram, VK, Reddit, Twitch, Vimeo, Rutube и ещё десятков сервисов. Gorex скачает видео и при желании сразу конвертирует на лету.
- **Гибкие настройки кодирования**:
  - Видеокодеки: H.264, H.265/HEVC, AV1 (SVT-AV1), VP8, VP9 — программные и аппаратные (NVIDIA NVENC, Intel QSV, AMD VCE/AMF, MediaFoundation).
  - Полный контроль качества (RF/CQ), скорости кодирования, разрешения, FPS, кроп-режимов, деинтерлейсинга.
  - Аудиокодеки: AAC, HE-AAC, MP3, AC-3, E-AC-3, Vorbis, Opus, FLAC, passthru.
  - Поддержка субтитров и HDR-метаданных.
  - Фильтры: деинтерлейс, деблок, денойз, резкость.
- **Авто-определение GPU** — при первом запуске Gorex определяет видеокарту и подставляет оптимальные настройки аппаратного кодирования.
- **Тёмная/светлая тема** — ручное переключение или следование системной теме.
- **Мультиязычный интерфейс** — русский и английский.

---

## Философия проекта

> Я не программист. Я дизайнер и видеограф — человек, который годами работает с видео и остро чувствует, каким должен быть инструмент для таких же людей, как я.
>
> Всё существующее либо выглядит так, будто застряло в 2005-м, либо стоит денег за каждый чих, либо просто не работает как надо. Я давно хотел сделать что-то по-настоящему красивое и удобное — не для разработчиков, а для людей из сферы. Концепт жил у меня в голове очень долго, но реализовать его самому было невозможно.
>
> И вот благодаря технологиям ИИ — [Claude](https://claude.ai) — я наконец смог воплотить эту идею в жизнь. Gorex — это не просто очередной конвертер видео. Это концепция: инструмент, который уважает твоё время, выглядит как продукт, за который не стыдно, и работает именно так, как ожидает профессионал в видео.

---

## Стек технологий

| Слой           | Технология                              |
|----------------|-----------------------------------------|
| Оболочка       | Electron 28                             |
| UI             | React 18 + Vite 5                       |
| Стили          | SCSS + Bootstrap Icons                  |
| Видеодвижок    | FFmpeg (bundled)                        |
| Загрузка       | yt-dlp (bundled)                        |
| Медиаинфо      | ffprobe / fluent-ffmpeg (bundled)       |
| Сборка         | electron-vite + electron-builder        |

---

## Требования

- **Node.js** ≥ 18
- **npm** ≥ 9
- **Windows 10/11** (основная платформа; macOS-поддержка в разработке)

---

## Запуск в режиме разработки

```bash
# 1. Клонировать репозиторий
git clone https://github.com/Gor80hd/Gorex.git
cd Gorex

# 2. Установить зависимости
npm install

# 3. Запустить в режиме разработки (Electron + Vite HMR)
npm run dev
```

Откроется окно приложения. Изменения в `src/renderer` применяются мгновенно через Hot Module Replacement.

---

## Сборка

```bash
# Только компиляция (без установщика)
npm run pack

# Полная сборка с NSIS-установщиком для Windows
npm run dist
```

Собранный установщик появится в папке `dist/`.

---

## Структура проекта

```
src/
├── main/index.js          ← Electron main: IPC-хендлеры, запуск CLI, управление окном
├── preload/index.js       ← Bridge: window.api → renderer
└── renderer/src/
    ├── App.jsx            ← Root: state-машина (view, очередь, настройки, тема)
    ├── i18n.jsx           ← Словари переводов (ru / en)
    ├── components/
    │   ├── TitleBar/      ← Шапка, главное меню, тема, управление окном
    │   ├── CliConsole/    ← Панель отладки CLI-вывода
    │   ├── GlobalSettings/← Логика настроек кодирования (энкодеры, RF, скорости)
    │   └── OnboardingScreen/ ← Первый запуск: определение GPU
    └── pages/
        ├── SourcePage/    ← Drag&Drop / ввод URL для загрузки
        ├── ListPage/      ← Очередь задач + прогресс-бары
        ├── SettingsPage/  ← Полные настройки: видео, аудио, субтитры, фильтры, HDR
        └── AboutPage/     ← О программе, авторы, библиотеки
```

---

## Лицензия

Gorex распространяется под лицензией **GNU General Public License v2**. Подробности — в файле [COPYING](COPYING).

---

## Открытые библиотеки

Gorex стоит на плечах выдающихся open-source проектов. Приложение включает или использует следующие библиотеки:

| Библиотека | Лицензия |
|------------|----------|
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

Полные тексты лицензий доступны на экране «О программе» внутри приложения.
