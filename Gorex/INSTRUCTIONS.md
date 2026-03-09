# BPRESS — Инструкция по разработке интерфейса

> Справочный документ для разработчика. Описывает архитектуру проекта, полный список параметров HandBrake CLI и план расширения UI.

---

## 1. Архитектура проекта

```
Gorex/
├── src/
│   ├── main/index.js          ← Electron main process: IPC-хендлеры, запуск CLI
│   ├── preload/index.js       ← Bridge: экспортирует window.api в renderer
│   └── renderer/src/
│       ├── App.jsx            ← Root: state-машина (view, videos, preset, theme)
│       ├── components/
│       │   └── TitleBar/      ← Шапка: меню, тема, window-controls
│       └── pages/
│           ├── SourcePage/    ← Drag&Drop / выбор файлов
│           ├── ListPage/      ← Список видео + выбор пресета + кнопка старт
│           └── AboutPage/     ← О программе, авторы, лицензии
```

### Поток данных

```
SourcePage → filePaths[] → App.jsx (getVideoData via IPC)
                                          ↓
                            main/index.js: ffprobe + thumbnail
                                          ↓
                            videos[] → ListPage → ProgressBar
                                          ↓
                            [START] → window.api.runCli({filePath, preset, id})
                                          ↓
                            main/index.js: spawn(HandBrakeCLI.exe, args)
                                          ↓
                            stdout: regex /([\d.]+)\s*%/ → cli-progress IPC
                            close: cli-exit IPC → v.status = done/error
```

### IPC-контракт (preload ↔ main)

| Метод в `window.api`          | IPC-канал       | Направление  | Что делает                          |
|-------------------------------|-----------------|--------------|--------------------------------------|
| `selectFiles()`               | `select-files`  | invoke       | Открывает системный диалог           |
| `getVideoData(paths[])`       | `get-video-data`| invoke       | ffprobe + превью → массив объектов   |
| `runCli({filePath, preset, id})` | `run-cli`    | send         | Кодирует один файл                   |
| `onCliProgress(cb)`           | `cli-progress`  | on           | `{ id, progress }` 0–100             |
| `onCliExit(cb)`               | `cli-exit`      | on           | `{ id, code, outputPath }`           |
| `onCliOutput(cb)`             | `cli-output`    | on           | Сырой stdout HandBrake               |
| `onCliError(cb)`              | `cli-error`     | on           | Сырой stderr HandBrake               |
| `ytdlGetFormats(url)`         | `ytdl-get-formats` | invoke    | Получить форматы без загрузки        |
| `ytdlRun({id, url, …})`       | `ytdl-run`      | send         | Скачать + (опц.) конвертировать      |
| `onYtdlProgress(cb)`          | `ytdl-progress` | on           | `{ id, progress }` % загрузки        |
| `onYtdlExit(cb)`              | `ytdl-exit`     | on           | `{ id, code, outputPath, converting }` |
| `onYtdlOutput(cb)`            | `ytdl-output`   | on           | Сырой stdout yt-dlp                  |
| `minimize/maximize/close()`   | `window-*`      | send         | Управление окном                     |

---

## 2. Полный список параметров HandBrake CLI

Путь к бинарнику: `Gorex/resources/HandBrakeCLI.exe`

### 2.1 Общие параметры

| Флаг CLI                          | Тип       | Описание                                                    |
|-----------------------------------|-----------|-------------------------------------------------------------|
| `-h / --help`                     | flag      | Вывод справки                                               |
| `--version`                       | flag      | Вывод версии                                                |
| `--json`                          | flag      | Прогресс и заголовок в JSON (удобно для парсинга в UI)      |
| `-v / --verbose[=N]`              | int 0-4   | Уровень логирования (0=молча, 1=норма, 2=подробно)          |
| `-Z / --preset <name>`            | string    | Выбор встроенного пресета по имени (case-sensitive!)        |
| `-z / --preset-list`              | flag      | Список всех встроенных пресетов                             |
| `--preset-import-file <file>`     | path      | Импорт пресета из JSON-файла                                |
| `--preset-import-gui`             | flag      | Импорт пресетов из GUI HandBrake                            |
| `--preset-export <name>`          | string    | Экспорт текущих настроек как нового пресета                 |
| `--preset-export-file <file>`     | path      | Файл для записи экспортированного пресета                   |
| `--preset-export-description <s>` | string    | Описание для нового пресета                                 |
| `--queue-import-file <file>`      | path      | Импорт очереди из GUI HandBrake                             |
| `--no-dvdnav`                     | flag      | Не использовать dvdnav для DVD                              |

### 2.2 Источник (Source)

| Флаг CLI                   | Тип         | Описание                                               |
|----------------------------|-------------|--------------------------------------------------------|
| `-i / --input <path>`      | path        | Входной файл или устройство (DVD/Blu-ray)              |
| `-t / --title <N>`         | int         | Номер title (0 = сканировать все, default: 1)          |
| `--min-duration <sec>`     | int         | Минимальная длительность title в секундах (def: 10)    |
| `--max-duration <sec>`     | int         | Максимальная длительность title                        |
| `--scan`                   | flag        | Только сканировать, не кодировать                      |
| `--main-feature`           | flag        | Автоматически выбрать главный title (DVD/BD)           |
| `--keep-duplicate-titles`  | flag        | Не отбрасывать дубли title (только Blu-ray)            |
| `-c / --chapters <range>`  | string      | Диапазон глав: `1-3`, `5`, default = all               |
| `--angle <N>`              | int         | Угол записи (DVD/BD multi-angle)                       |
| `--previews <N:bool>`      | string      | Кол-во превью:сохранять_на_диск (def: `10:0`)          |
| `--start-at-preview <N>`   | int         | Начать кодирование с N-го превью                       |
| `--start-at <type:N>`      | string      | Начало: `seconds:10`, `frames:300`, `pts:900000`       |
| `--stop-at <type:N>`       | string      | Остановить после: `seconds:10`, `frames:300`, etc.     |

### 2.3 Назначение (Destination)

| Флаг CLI                   | Тип     | Описание                                              |
|----------------------------|---------|-------------------------------------------------------|
| `-o / --output <path>`     | path    | Выходной файл                                         |
| `-f / --format <fmt>`      | string  | Контейнер: `av_mp4`, `av_mkv`, `av_webm`              |
| `-m / --markers`           | flag    | Добавить главы (chapter markers)                      |
| `--no-markers`             | flag    | Отключить главы из пресета                            |
| `-O / --optimize`          | flag    | Оптимизировать MP4 для HTTP-стриминга (fast start)    |
| `--no-optimize`            | flag    | Отключить оптимизацию из пресета                      |
| `-I / --ipod-atom`         | flag    | iPod 5G compatibility atom в MP4                      |
| `--align-av`               | flag    | Выровнять старт аудио и видео                         |
| `--keep-metadata`          | flag    | Сохранить метаданные источника                        |
| `--no-metadata`            | flag    | Не копировать метаданные                              |
| `--inline-parameter-sets`  | flag    | SPS/PPS inline (для adaptive streaming / HLS)         |

### 2.4 Видео (Video)

| Флаг CLI                        | Тип      | Описание                                            |
|---------------------------------|----------|-----------------------------------------------------|
| `-e / --encoder <name>`         | string   | Кодек видео (см. раздел 3)                          |
| `--encoder-preset <name>`       | string   | Скорость/эффективность кодека (ultrafast…veryslow)  |
| `--encoder-preset-list <enc>`   | string   | Список доступных пресетов для кодека                |
| `--encoder-tune <name>`         | string   | Тюнинг (film, animation, grain, etc.)               |
| `--encoder-tune-list <enc>`     | string   | Список тюнингов для кодека                          |
| `--encoder-profile <name>`      | string   | Профиль (main, high, main10, etc.)                  |
| `--encoder-profile-list <enc>`  | string   | Список профилей для кодека                          |
| `--encoder-level <name>`        | string   | Уровень (4.0, 4.1, 5.0, etc.)                       |
| `--encoder-level-list <enc>`    | string   | Список уровней для кодека                           |
| `-x / --encopts <k=v:k=v>`      | string   | Дополнительные опции кодека (mencoder-style)        |
| `-q / --quality <float>`        | float    | CRF/CQ: качество (H.264: 22.0, H.265: 28.0)         |
| `-b / --vb <kbps>`              | int      | Битрейт видео в кбит/с                              |
| `--multi-pass`                  | flag     | Двухпроходное кодирование                           |
| `--no-multi-pass`               | flag     | Отключить multi-pass                                |
| `-T / --turbo`                  | flag     | «Турбо» первый проход (x264/x265 only)              |
| `-r / --rate <fps>`             | float    | Частота кадров                                      |
| `--vfr`                         | flag     | Переменная частота кадров (VFR)                     |
| `--cfr`                         | flag     | Постоянная частота кадров (CFR)                     |
| `--pfr`                         | flag     | Peak-limited framerate (PFR, default с -r)          |
| `--hdr-dynamic-metadata <type>` | string   | Сохранить HDR метаданные: `hdr10plus`, `dolbyvision`, `all` |
| `--no-hdr-dynamic-metadata`     | flag     | Отключить HDR dynamic metadata                      |
| `--enable-hw-decoding <type>`   | string   | Аппаратное декодирование: `nvdec`, `qsv`            |
| `--disable-hw-decoding`         | flag     | Принудительно программное декодирование             |

### 2.5 Аудио (Audio)

| Флаг CLI                          | Тип     | Описание                                           |
|-----------------------------------|---------|----------------------------------------------------|
| `--audio-lang-list <langs>`       | string  | Список языков аудио через запятую (ISO 639-2)      |
| `--all-audio`                     | flag    | Добавить все дорожки по языковому списку           |
| `--first-audio`                   | flag    | Выбрать первую дорожку по языковому списку         |
| `-a / --audio <tracks>`           | string  | Номера дорожек: `1,2,3` или `none`                 |
| `-E / --aencoder <codecs>`        | string  | Аудиокодек(и): `av_aac`, `mp3`, `ac3`, `copy:ac3`  |
| `--audio-copy-mask <codecs>`      | string  | Разрешённые кодеки при copy-passthru               |
| `--audio-fallback <codec>`        | string  | Фолбэк при невозможности copy                      |
| `-B / --ab <kbps>`                | int     | Битрейт аудио (на дорожку через запятую)           |
| `-Q / --aq <float>`               | float   | Качество аудио                                     |
| `-C / --ac <float>`               | float   | Компрессия аудио                                   |
| `-6 / --mixdown <mix>`            | string  | Микс: `mono`, `stereo`, `5point1`, `7point1`, etc. |
| `--normalize-mix <0/1>`           | string  | Нормализация уровней (0=нет, 1=да)                 |
| `-R / --arate <kHz>`              | string  | Частота дискретизации: `auto`, `44.1`, `48`, `96`  |
| `-D / --drc <float>`              | float   | Dynamic Range Compression: 1.0–4.0                 |
| `--gain <dB>`                     | float   | Усиление/ослабление аудио в dB                     |
| `--adither <type>`                | string  | Дизеринг перед кодированием                        |
| `--keep-aname`                    | flag    | Сохранить имена аудиодорожек из источника          |
| `--no-keep-aname`                 | flag    | Не сохранять имена                                 |
| `--automatic-naming-behaviour <t>`| string  | `off`, `unnamed`, `all`                            |
| `-A / --aname <names>`            | string  | Имена дорожек через запятую                        |

### 2.6 Картинка (Picture)

| Флаг CLI                     | Тип     | Описание                                             |
|------------------------------|---------|------------------------------------------------------|
| `-w / --width <px>`          | int     | Ширина выходного кадра в пикселях                    |
| `-l / --height <px>`         | int     | Высота выходного кадра в пикселях                    |
| `--crop <T:B:L:R>`           | string  | Обрезка в пикселях (Top:Bottom:Left:Right)           |
| `--crop-mode <mode>`         | string  | `auto`, `conservative`, `none`, `custom`             |
| `--crop-threshold-pixels <N>`| int     | Порог пикселей для авто-crop                         |
| `--crop-threshold-frames <N>`| int     | Кол-во кадров для проверки авто-crop                 |
| `--maxHeight <px>`           | int     | Максимальная высота (с масштабированием)             |
| `--maxWidth <px>`            | int     | Максимальная ширина (с масштабированием)             |
| `--display-width <px>`       | int     | Display width (DAR)                                  |
| `--pixel-aspect <W:H>`       | string  | Соотношение сторон пикселя (PAR)                     |
| `--modulus <N>`              | int     | Выравнивание размеров (default: 2)                   |
| `--keep-display-aspect`      | flag    | Сохранять Display Aspect Ratio                       |
| `--itu-par`                  | flag    | Использовать ITU PAR значения                        |
| `--color-range <range>`      | string  | `tv`, `pc` (ограниченный/полный диапазон)            |

### 2.7 Субтитры (Subtitles)

| Флаг CLI                       | Тип     | Описание                                           |
|--------------------------------|---------|----------------------------------------------------|
| `--subtitle-lang-list <langs>` | string  | Список языков субтитров                            |
| `--all-subtitles`              | flag    | Все субтитры по языковому списку                   |
| `--first-subtitle`             | flag    | Первые субтитры по языковому списку                |
| `-s / --subtitle <tracks>`     | string  | Номера дорожек субтитров                           |
| `-F / --subforce <mask>`       | string  | Принудительно отображать субтитры                  |
| `--sub-burned`                 | flag    | Вжечь субтитры в видео                             |
| `--sub-default`                | flag    | Пометить субтитры как default                      |
| `--srt-file <files>`           | path    | Внешние SRT-файлы                                  |
| `--srt-codeset <cs>`           | string  | Кодировка SRT-файлов                               |
| `--srt-offset <ms>`            | int     | Смещение SRT в миллисекундах                       |
| `--srt-lang <langs>`           | string  | Язык SRT-файлов (ISO 639-2)                        |
| `--srt-default <N>`            | int     | Дефолтный SRT-трек                                 |
| `--srt-burn <N>`               | int     | Вжечь указанный SRT                                |
| `--ssa-file <files>`           | path    | Внешние SSA/ASS-файлы                              |
| (и аналогичные --ssa-*)        |         | Те же опции что для SRT                            |

### 2.8 Фильтры (Filters)

| Флаг CLI / Переменная           | Пресеты по умолчанию | Описание                           |
|---------------------------------|----------------------|------------------------------------|
| `--deinterlace[=preset]`        | yadif: default       | Деинтерлейс (алиас для --yadif)    |
| `--yadif[=preset]`              | default              | Yadif деинтерлейс                  |
| `--bwdif[=preset]`              | default              | BWDif деинтерлейс                  |
| `--no-deinterlace / --no-yadif` | —                    | Отключить деинтерлейс              |
| `--comb-detect[=preset]`        | default              | Определение interlacing            |
| `--no-comb-detect`              | —                    | Отключить                          |
| `--decomb[=preset]`             | default              | Адаптивный деинтерлейс             |
| `--no-decomb`                   | —                    | Отключить                          |
| `--detelecine[=preset]`         | default              | Inverse telecine (IVTC)            |
| `--no-detelecine`               | —                    | Отключить                          |
| `--hqdn3d[=preset]`             | medium               | Шумоподавление HQ 3D               |
| `--no-hqdn3d`                   | —                    | Отключить                          |
| `--nlmeans[=preset]`            | medium               | Шумоподавление NL-Means            |
| `--nlmeans-tune <tune>`         | —                    | Тюнинг nlmeans                     |
| `--no-nlmeans`                  | —                    | Отключить                          |
| `--deblock[=preset]`            | medium               | Деблокинг                          |
| `--deblock-tune <tune>`         | —                    | Тюнинг deblock                     |
| `--no-deblock`                  | —                    | Отключить                          |
| `--unsharp[=preset]`            | medium               | Повышение резкости (Unsharp Mask)  |
| `--unsharp-tune <tune>`         | —                    | Тюнинг unsharp                     |
| `--no-unsharp`                  | —                    | Отключить                          |
| `--lapsharp[=preset]`           | medium               | Повышение резкости (Laplacian)     |
| `--lapsharp-tune <tune>`        | —                    | Тюнинг lapsharp                    |
| `--no-lapsharp`                 | —                    | Отключить                          |
| `--chroma-smooth[=preset]`      | medium               | Сглаживание хромы                  |
| `--chroma-smooth-tune <tune>`   | —                    | Тюнинг                             |
| `--no-chroma-smooth`            | —                    | Отключить                          |
| `--rotate[=angle=N:hflip=0]`    | `angle=180:hflip=0`  | Поворот/горизонтальное отражение   |
| `--grayscale / --no-grayscale`  | —                    | Чёрно-белый режим                  |
| `--colorspace[=preset]`         | bt709                | Цветовое пространство              |
| `--no-colorspace`               | —                    | Отключить                          |
| `--pad <W:H:x:y:color>`         | —                    | Добавить паддинг к кадру           |
| `--no-pad`                      | —                    | Отключить паддинг                  |

---

## 3. Видеокодеки (значения для `-e`)

| Ключ CLI       | Описание                             | Платформа      |
|----------------|--------------------------------------|----------------|
| `x264`         | libx264 H.264                        | Все            |
| `x264_10bit`   | libx264 H.264 10-бит                 | Все            |
| `x265`         | libx265 H.265/HEVC                   | Все            |
| `x265_10bit`   | libx265 H.265 10-бит                 | Все            |
| `x265_12bit`   | libx265 H.265 12-бит                 | Все            |
| `svt_av1`      | SVT-AV1                              | Все            |
| `svt_av1_10bit`| SVT-AV1 10-бит                       | Все            |
| `vp8`          | libvpx VP8                           | Все            |
| `vp9`          | libvpx VP9                           | Все            |
| `vp9_10bit`    | libvpx VP9 10-бит                    | Все            |
| `theora`       | libtheora                             | Все           |
| `nvenc_h264`   | NVIDIA NVENC H.264                   | NVIDIA GPU     |
| `nvenc_h265`   | NVIDIA NVENC H.265                   | NVIDIA GPU     |
| `nvenc_av1`    | NVIDIA NVENC AV1                     | NVIDIA GPU     |
| `qsv_h264`     | Intel QSV H.264                      | Intel GPU      |
| `qsv_h265`     | Intel QSV H.265                      | Intel GPU      |
| `qsv_av1`      | Intel QSV AV1                        | Intel GPU      |
| `vce_h264`     | AMD VCE H.264                        | AMD GPU        |
| `vce_h265`     | AMD VCE H.265                        | AMD GPU        |
| `vce_av1`      | AMD VCE AV1                          | AMD GPU        |
| `mf_h264`      | MediaFoundation H.264 (Windows)      | Windows        |
| `mf_h265`      | MediaFoundation H.265 (Windows)      | Windows        |

---

## 4. Аудиокодеки (значения для `-E`)

| Ключ CLI     | Описание                    |
|--------------|-----------------------------|
| `av_aac`     | AAC (libavcodec, default)   |
| `fdk_aac`    | AAC (Fraunhofer FDK)        |
| `fdk_haac`   | HE-AAC (FDK-AAC)            |
| `mp3`        | MP3 (lame)                  |
| `ac3`        | Dolby Digital AC-3          |
| `eac3`       | Dolby Digital Plus E-AC-3   |
| `vorbis`     | Vorbis                      |
| `flac16`     | FLAC 16-бит                 |
| `flac24`     | FLAC 24-бит                 |
| `opus`       | Opus                        |
| `speex`      | Speex                       |
| `copy`       | Passthru (авто-определение) |
| `copy:aac`   | AAC passthru                |
| `copy:ac3`   | AC3 passthru                |
| `copy:eac3`  | E-AC3 passthru              |
| `copy:dtshd` | DTS-HD passthru             |
| `copy:dts`   | DTS passthru                |
| `copy:mp3`   | MP3 passthru                |
| `copy:truehd`| TrueHD passthru             |

---

## 5. Встроенные пресеты HandBrake

### General (общие)
```
Very Fast 2160p60 4K AV1       Fast 2160p60 4K AV1       HQ 2160p60 4K AV1 Surround       Super HQ 2160p60 4K AV1 Surround
Very Fast 2160p60 4K HEVC      Fast 2160p60 4K HEVC      HQ 2160p60 4K HEVC Surround      Super HQ 2160p60 4K HEVC Surround
Very Fast 1080p30              Fast 1080p30               HQ 1080p30 Surround               Super HQ 1080p30 Surround
Very Fast 720p30               Fast 720p30                HQ 720p30 Surround                Super HQ 720p30 Surround
Very Fast 576p25               Fast 576p25                HQ 576p25 Surround                Super HQ 576p25 Surround
Very Fast 480p30               Fast 480p30                HQ 480p30 Surround                Super HQ 480p30 Surround
```

### Web / Creator / Social
```
Creator 2160p60 4K    Creator 1440p60 2.5K    Creator 1080p60    Creator 720p60
Social 25 MB 30 Seconds 1080p60 ... (6 пресетов)
Social 10 MB ... (3 пресета)
```

### Устройства
```
Amazon Fire: 2160p60 4K HEVC, 1080p30, 720p30
Android: 1080p30, 720p30, 576p25, 480p30
Apple: 2160p60 4K HEVC, 1080p60, 1080p30, 720p30, 540p30
Chromecast: 2160p60 4K HEVC, 1080p60, 1080p30
Playstation: 2160p60 4K, 1080p30, 720p30, 540p30
Roku: 2160p60 4K HEVC, 1080p30, 720p30, 576p25, 480p30
```

> **Текущие пресеты в UI** (`ListPage.jsx`):
> ```js
> 'Fast 1080p30', 'Very Fast 1080p30', 'HQ 1080p30 Surround',
> 'Android 1080p30', 'Apple 1080p60', 'H.265 MKV 1080p30'
> ```
> ⚠️ «H.265 MKV 1080p30» — не существующий встроенный пресет. Заменить или убрать.

---

## 6. Как CLI вызывается сейчас (main/index.js)

```js
const args = [
    '-i', filePath,
    '-o', outputPath,
    '--preset', preset        // ← только пресет
]
spawn(cliPath, args)
```

Прогресс парсится по regex: `/([\d.]+)\s*%/` из stdout.

---

## 7. Что нужно добавить в UI: карта параметров

### Приоритет A — базовые настройки (сделать сейчас)

| UI-элемент                  | CLI-флаг         | Варианты                                               |
|-----------------------------|------------------|--------------------------------------------------------|
| Папка вывода                | `-o` (dir)       | По умолчанию `userData/output`, кнопка "Изменить"     |
| Формат контейнера           | `-f / --format`  | `av_mp4` (MP4), `av_mkv` (MKV), `av_webm` (WebM)     |
| Видеокодек                  | `-e / --encoder` | x264, x265, svt_av1, nvenc_h264, nvenc_h265...        |
| Качество CRF                | `-q / --quality` | Слайдер 0–51 (H.264: оптим. 18–28, H.265: 24–32)     |
| Пресет кодировщика          | `--encoder-preset` | ultrafast → veryslow (x264/x265)                    |
| Частота кадров              | `-r / --rate`    | Auto, 23.976, 25, 29.97, 30, 60                       |
| Режим FPS                   | `--vfr/cfr/pfr`  | VFR (default), CFR, PFR                               |

### Приоритет B — расширенные настройки

| UI-элемент               | CLI-флаг              | Варианты                                             |
|--------------------------|-----------------------|------------------------------------------------------|
| Аудиокодек               | `-E / --aencoder`     | av_aac, ac3, copy, eac3, flac16...                   |
| Аудиобитрейт             | `-B / --ab`           | 64/96/128/160/192/320 kbps                           |
| Аудио mixdown            | `-6 / --mixdown`      | mono, stereo, dpl2, 5point1, 6point1, 7point1        |
| Частота дискретизации    | `-R / --arate`        | auto, 44.1, 48, 96 kHz                               |
| Добавить главы           | `-m / --markers`      | checkbox                                             |
| Optimize MP4             | `-O`                  | checkbox (только для MP4)                            |
| Обрезка                  | `--crop T:B:L:R`      | авто / ручная                                        |
| Масштабирование          | `-w` / `-l`           | Ширина × Высота с выбором режима                     |
| Hardware acceleration    | `--enable-hw-decoding`| nvdec, qsv                                           |
| Multi-pass               | `--multi-pass`        | checkbox                                             |

### Приоритет C — фильтры (отдельная вкладка)

| UI-элемент           | CLI-флаг           | Пресеты                        |
|----------------------|--------------------|--------------------------------|
| Деинтерлейс          | `--yadif / --bwdif`| off, default, bob, etc.        |
| Шумоподавление       | `--nlmeans / --hqdn3d` | off, ultralight, light, medium, strong |
| Деблокинг            | `--deblock`        | off, ultralight, light, medium, strong, stronger |
| Резкость             | `--unsharp / --lapsharp` | off, ultralight, light, medium, strong |
| Grayscale            | `--grayscale`      | checkbox                       |
| Rotate               | `--rotate`         | 90°, 180°, 270°, H-flip        |

### Приоритет D — HDR и мета

| UI-элемент           | CLI-флаг                      | Варианты                         |
|----------------------|-------------------------------|----------------------------------|
| HDR passthru         | `--hdr-dynamic-metadata`      | off, hdr10plus, dolbyvision, all |
| Метаданные           | `--keep-metadata`             | checkbox                         |
| Imline params (HLS)  | `--inline-parameter-sets`     | checkbox                         |

---

## 8. Как добавить новый параметр (пошаговый маршрут)

### Шаг 1: State в App.jsx
```jsx
const [outputFormat, setOutputFormat] = useState('av_mp4')
const [videoQuality, setVideoQuality] = useState(22.0)
const [encoderPreset, setEncoderPreset] = useState('medium')
```

### Шаг 2: Передать в ListPage.jsx как props
```jsx
<ListPage
    outputFormat={outputFormat}
    videoQuality={videoQuality}
    encoderPreset={encoderPreset}
    onFormatChange={setOutputFormat}
    onQualityChange={setVideoQuality}
    onEncoderPresetChange={setEncoderPreset}
    ...
/>
```

### Шаг 3: UI в ListPage.jsx
```jsx
<select value={outputFormat} onChange={e => onFormatChange(e.target.value)}>
    <option value="av_mp4">MP4</option>
    <option value="av_mkv">MKV</option>
    <option value="av_webm">WebM</option>
</select>

---

## 8. youtube-dl — ядро для скачивания видео

Расположение в проекте: `Gorex/resources/ytdl/`

### 8.1 Что такое youtube-dl

youtube-dl — кроссплатформенный CLI-инструмент для скачивания видео с сотен платформ (YouTube, Twitter/X, Instagram, Vimeo, SoundCloud, Reddit и др.). Источник: https://github.com/ytdl-org/youtube-dl.

В BPRESS используется как встроенный бинарник — отдельный сервер не нужен. Электрон запускает его как дочерний процесс напрямую.

### 8.2 Расположение бинарников

```
resources/ytdl/
├── youtube-dl.exe   ← Windows
└── youtube-dl       ← macOS / Linux
```

Бинарник выбирается автоматически по `process.platform`. Путь резолвится через `getYtdlPath()` в `src/main/index.js`.

### 8.3 IPC — `ytdl-download`

| Параметр | Тип     | Описание                         |
|:---------|:--------|:---------------------------------|
| `url`    | string  | URL видео для скачивания         |

**Возвращает:** абсолютный путь к скачанному файлу в папке `temp`.

Алгоритм:
1. `--get-filename` — определить целевой путь без скачивания
2. Скачать по тому же шаблону `-o ytdl-%(title)s.%(ext)s`
3. Проверить что файл существует и размер > 512 байт
4. Вернуть путь — App.jsx передаёт его в `loadAndAddVideos`

### 8.4 Ключевые флаги

| Флаг               | Описание                              |
|:-------------------|:--------------------------------------|
| `--no-playlist`    | Скачать только одно видео, не плейлист |
| `-o <template>`    | Шаблон имени выходного файла           |
| `--get-filename`   | Вывести resolved путь без скачивания   |

---

### Шаг 4: Передать в runCli через IPC
```js
// App.jsx – startEncoding()
window.api.runCli({
    filePath: v.path,
    preset: selectedPreset,
    id: v.id,
    outputFormat,
    videoQuality,
    encoderPreset
})
```

### Шаг 5: Собрать args в main/index.js
```js
ipcMain.on('run-cli', (event, { filePath, preset, id, outputFormat, videoQuality, encoderPreset }) => {
    const ext = outputFormat === 'av_mkv' ? '.mkv' : outputFormat === 'av_webm' ? '.webm' : '.mp4'
    const outputPath = join(outputDir, baseName + ext)

    const args = [
        '-i', filePath,
        '-o', outputPath,
        '--preset', preset,
        '-f', outputFormat,
        '-q', String(videoQuality),
        '--encoder-preset', encoderPreset
    ]

    const child = spawn(cliPath, args)
    // ...
})
```

---

## 9. Парсинг прогресса из HandBrake JSON-режима

Для более надёжного парсинга прогресса можно передавать `--json`:

```js
const args = [...existingArgs, '--json']

child.stdout.on('data', (data) => {
    const str = data.toString()
    // JSON формат: Progress: {"State":"WORKING","Working":{"Progress":0.42,...}}
    const jsonMatch = str.match(/^Progress:\s*(.+)$/m)
    if (jsonMatch) {
        const state = JSON.parse(jsonMatch[1])
        if (state.Working) {
            const progress = state.Working.Progress * 100
            event.sender.send('cli-progress', { id, progress })
        }
    }
})
```

---

## 10. Важные замечания

1. **Пресет vs. ручные параметры**: При использовании `--preset` HandBrake берёт все настройки из пресета. Явно переданные флаги CLI **перекрывают** значения из пресета. Порядок не важен, приоритет у явных флагов.

2. **Путь к HandBrakeCLI.exe**: Бинарник лежит в `resources/HandBrakeCLI.exe` и подхватывается автоматически через `getCLIPath()` как в dev, так и в prod режиме.

3. **Папка output**: Сейчас `userData/output` без возможности изменить. Нужна кнопка выбора папки вывода.

4. **Расширение выходного файла**: Сейчас всегда `.mp4` — не соответствует формату, если пресет MKV. Нужно определять по `--format` или по имени пресета.

5. **Перезапуск IPC listeners**: В `useEffect` регистрируются `onCliProgress/onCliExit` без cleanup-функции — при hot reload может накапливаться. Добавить `return () => ipcRenderer.removeAllListeners(...)`.

6. **«H.265 MKV 1080p30»**: Не является встроенным пресетом HandBrake. Если нужен H.265 MKV — использовать явный флаг `-e x265 -f av_mkv` или создать кастомный пресет через `--preset-export`.
