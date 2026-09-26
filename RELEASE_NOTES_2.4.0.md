# Gorex 2.4.0 — Gorex is finally on Mac

**Updated installers:** The Mac DMG and ZIP and the Windows installer now include the refined What's New screen and a fix for overlapping queue actions. The Mac build also includes native window controls and the macOS menu bar. If you downloaded an installer before this correction, please download it again.

Gorex now has an Apple Silicon build for macOS 11 and newer. This release also updates the Windows installer and brings the download, Twitch and queue improvements developed since 2.3.0.

## What's new

- **macOS support:** Download and convert videos on Apple Silicon Macs with bundled FFmpeg, ffprobe and yt-dlp. Apple VideoToolbox encoding is available where supported by the selected format.
- **Mac interface:** Native traffic-light window controls, a macOS application menu for queue and app actions, and a dedicated Dock icon.
- **Twitch downloads:** Add VODs, clips and channel videos to the queue, choose a quality and download chat data.
- **Twitch chat preview:** Browse and search messages, load the full chat, retry failed requests and export the result.
- **Better queue and settings:** Clearer task controls and progress, more reliable cancellation, and improved handling of per-video conversion settings.
- **Clearer What's New screen:** Separate highlights for Twitch chat preview, download reliability, queue controls and tool updates, plus a Mac availability note.
- **Tool management:** Check and update yt-dlp and TwitchDownloader from Settings.

## Fixes and polish

- Improved Twitch request cancellation and cleanup of temporary chat data.
- Improved readability and layout across the queue, source, settings and About screens.
- Separated the completed video's output-folder and delete buttons so both actions can be clicked reliably.
- Fixed several download and settings edge cases, including stale encoding presets and tool update states.

## Downloads

- **Mac (Apple Silicon, macOS 11+):** `Gorex-2.4.0-macOS-arm64.dmg` — open the DMG and drag Gorex to Applications. A ZIP is also provided.
- **Windows 10/11 (x64):** the `Gorex Setup 2.4.0.exe` NSIS installer.

The macOS build is ad-hoc signed and has not been notarized by Apple. If macOS blocks the first launch, open Gorex from Finder using **Control-click → Open**. There is no Intel Mac build in this release.

---

# Gorex 2.4.0 — наконец-то на Mac

**Обновлённые установщики:** DMG и ZIP для Mac и установщик Windows теперь содержат уточнённый экран «Что нового» и исправление кнопок очереди. В сборке для Mac также есть нативный светофор окна и меню macOS. Если вы скачали установщик раньше, загрузите его повторно.

Впервые выпускаем Gorex для Mac с Apple Silicon и macOS 11+. Установщик Windows тоже обновлён.

- Добавлены загрузка и конвертация на Mac с FFmpeg, ffprobe, yt-dlp и поддержкой аппаратного кодирования VideoToolbox там, где оно доступно.
- На Mac используются нативный светофор окна, системное меню с действиями приложения и отдельная иконка Dock.
- Расширена работа с Twitch: записи, клипы и видео каналов, выбор качества, загрузка чата.
- Добавлены просмотр и поиск сообщений Twitch, полная загрузка чата, повторная попытка и экспорт.
- Улучшены очередь, прогресс, отмена задач и индивидуальные настройки конвертации.
- Экран «Что нового» теперь отдельно рассказывает о чате Twitch, надёжности загрузок, очереди, инструментах и выходе версии для Mac.
- Кнопки открытия папки результата и удаления готового видео больше не перекрывают друг друга.
- В настройках можно проверять и обновлять yt-dlp и TwitchDownloader.
- Исправлены отмена запросов Twitch, очистка временного чата, устаревшие пресеты кодирования и отображение состояний обновления инструментов; повышена читаемость интерфейса.

Для Mac скачайте DMG, откройте его и перетащите Gorex в «Программы». Сборка подписана временной подписью и пока не нотарифицирована Apple. Если macOS блокирует первый запуск, в Finder нажмите **Control-click → Открыть**. Версии для Intel Mac в этом выпуске нет.
