import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '../../i18n'
import './GlobalSettings.scss'

// ─── RF quality tables per encoder ────────────────────────────────────────────
export const CODEC_RF = {
    x264:          { high: 18, medium: 23, low: 30, potato: 51, min: 0, max: 51 },
    x264_10bit:    { high: 18, medium: 23, low: 30, potato: 51, min: 0, max: 51 },
    x265:          { high: 20, medium: 26, low: 34, potato: 51, min: 0, max: 51 },
    x265_10bit:    { high: 20, medium: 26, low: 34, potato: 51, min: 0, max: 51 },
    x265_12bit:    { high: 20, medium: 26, low: 34, potato: 51, min: 0, max: 51 },
    svt_av1:       { high: 28, medium: 38, low: 50, potato: 63, min: 1, max: 63 },
    svt_av1_10bit: { high: 28, medium: 38, low: 50, potato: 63, min: 1, max: 63 },
    vp8:           { high: 5,  medium: 15, low: 30, potato: 63, min: 0, max: 63 },
    vp9:           { high: 24, medium: 34, low: 46, potato: 63, min: 0, max: 63 },
    vp9_10bit:     { high: 24, medium: 34, low: 46, potato: 63, min: 0, max: 63 },
    nvenc_h264:    { high: 18, medium: 24, low: 32, potato: 51, min: 0, max: 51 },
    nvenc_h265:    { high: 20, medium: 28, low: 38, potato: 51, min: 0, max: 51 },
    nvenc_av1:     { high: 20, medium: 28, low: 38, potato: 51, min: 0, max: 51 },
    qsv_h264:      { high: 18, medium: 24, low: 32, potato: 51, min: 0, max: 51 },
    qsv_h265:      { high: 20, medium: 28, low: 38, potato: 51, min: 0, max: 51 },
    qsv_av1:       { high: 20, medium: 28, low: 38, potato: 51, min: 0, max: 51 },
    vce_h264:      { high: 18, medium: 24, low: 32, potato: 51, min: 0, max: 51 },
    vce_h265:      { high: 20, medium: 28, low: 38, potato: 51, min: 0, max: 51 },
    vce_av1:       { high: 20, medium: 28, low: 38, potato: 51, min: 0, max: 51 },
    mf_h264:       { high: 18, medium: 24, low: 32, potato: 51, min: 0, max: 51 },
    mf_h265:       { high: 20, medium: 28, low: 38, potato: 51, min: 0, max: 51 },
    theora:        { high: 8,  medium: 6,  low: 3,  potato: 0,  min: 0, max: 10 },
    // ── Additional / Legacy / Professional ────────────────────────────────────
    libaom_av1:   { high: 24, medium: 33, low: 45, potato: 63, min: 0, max: 63 },
    mpeg4:        { high: 3,  medium: 8,  low: 18, potato: 31, min: 1, max: 31 },
    mpeg2video:   { high: 2,  medium: 6,  low: 15, potato: 31, min: 1, max: 31 },
    mpeg1video:   { high: 2,  medium: 6,  low: 15, potato: 31, min: 1, max: 31 },
    prores_ks:    { high: 3,  medium: 2,  low: 1,  potato: 0,  min: 0, max: 5  },
    dnxhd:        { high: 3,  medium: 2,  low: 1,  potato: 0,  min: 0, max: 3  },
    ffv1:         { high: 0,  medium: 0,  low: 0,  potato: 0,  min: 0, max: 0  },
    huffyuv:      { high: 0,  medium: 0,  low: 0,  potato: 0,  min: 0, max: 0  },
    mjpeg:        { high: 2,  medium: 8,  low: 18, potato: 31, min: 2, max: 31 },
    wmv2:         { high: 2,  medium: 8,  low: 18, potato: 31, min: 2, max: 31 },
    wmv1:         { high: 2,  medium: 8,  low: 18, potato: 31, min: 2, max: 31 },
    h263p:        { high: 3,  medium: 8,  low: 18, potato: 31, min: 1, max: 31 },
    h263:         { high: 3,  medium: 8,  low: 18, potato: 31, min: 1, max: 31 },
    flv1:         { high: 3,  medium: 8,  low: 18, potato: 31, min: 1, max: 31 },
}

// ─── Encoder speed presets ─────────────────────────────────────────────────────
const X264_X265_SPEEDS = [
    { value: 'ultrafast', label: 'ultrafast', desc: { ru: 'Кодирует в 10–15× быстрее slow. Файл в 2–3× больше при том же качестве. Только для тестов.', en: 'Encodes 10–15× faster than slow. File is 2–3× larger at the same quality. For tests only.' } },
    { value: 'superfast', label: 'superfast', desc: { ru: 'В 7–10× быстрее slow. Файл значительно больше — сжатие слабое.', en: '7–10× faster than slow. File significantly larger — weak compression.' } },
    { value: 'veryfast',  label: 'veryfast',  desc: { ru: 'В 4–5× быстрее slow. Заметный проигрыш в размере файла.', en: '4–5× faster than slow. Noticeable file size penalty.' } },
    { value: 'faster',    label: 'faster',    desc: { ru: 'В 2–3× быстрее slow. Файл немного крупнее при том же качестве.', en: '2–3× faster than slow. File slightly larger at the same quality.' } },
    { value: 'fast',      label: 'fast',      desc: { ru: 'В 1.5× быстрее slow. Небольшая потеря сжатия по сравнению с medium.', en: '1.5× faster than slow. Small compression loss compared to medium.' } },
    { value: 'medium',    label: 'medium',    desc: { ru: 'Дефолтный пресет. Разумный баланс скорости и размера файла.', en: 'Default preset. Reasonable speed and file size balance.' } },
    { value: 'slow',      label: 'slow',      desc: { ru: 'Лучше сжатие, чем medium: файл на 5–10% меньше при том же качестве. Рекомендован для архива.', en: 'Better compression than medium: file 5–10% smaller at same quality. Recommended for archiving.' }, recommended: true },
    { value: 'slower',    label: 'slower',    desc: { ru: 'Файл ещё на 3–5% меньше, чем slow. Заметно дольше кодирование.', en: 'Another 3–5% smaller than slow. Noticeably longer encoding.' } },
    { value: 'veryslow',  label: 'veryslow',  desc: { ru: 'Максимальное сжатие. Файл на ~10% меньше, чем slow, но кодирует в 3–4× дольше.', en: 'Maximum compression. File ~10% smaller than slow, but encodes 3–4× longer.' } },
]

const SVT_AV1_SPEEDS = [
    { value: '12', label: '12 — Fastest',  desc: { ru: 'Максимальная скорость. Файл значительно больше, чем при preset 6.', en: 'Maximum speed. File significantly larger than preset 6.' } },
    { value: '11', label: '11',             desc: { ru: 'Очень быстро, слабое сжатие.', en: 'Very fast, weak compression.' } },
    { value: '10', label: '10',             desc: { ru: 'Быстро, но файл заметно крупнее среднего.', en: 'Fast but file noticeably larger than average.' } },
    { value: '9',  label: '9',              desc: { ru: 'Чуть медленнее 10, ощутимо лучше сжатие.', en: 'Slightly slower than 10, noticeably better compression.' } },
    { value: '8',  label: '8',              desc: { ru: 'Хорошая скорость, приемлемый размер файла.', en: 'Good speed, acceptable file size.' } },
    { value: '7',  label: '7',              desc: { ru: 'Немного медленнее 8, немного меньше файл.', en: 'Slightly slower than 8, slightly smaller file.' } },
    { value: '6',  label: '6 — Balanced',  desc: { ru: 'Оптимальный баланс скорости и размера файла. Рекомендован.', en: 'Optimal speed/file size balance. Recommended.' }, recommended: true },
    { value: '5',  label: '5',              desc: { ru: 'Файл на ~3% меньше, чем при 6, но кодирует заметно дольше.', en: 'File ~3% smaller than 6, but encodes noticeably longer.' } },
    { value: '4',  label: '4',              desc: { ru: 'Хорошее сжатие, кодирование в 2× медленнее, чем при 6.', en: 'Good compression, encoding 2× slower than 6.' } },
    { value: '3',  label: '3',              desc: { ru: 'Отличное сжатие. Заметный прирост времени.', en: 'Excellent compression. Noticeably more time.' } },
    { value: '2',  label: '2',              desc: { ru: 'Очень медленно. Минимальный прирост качества по сравнению с 3.', en: 'Very slow. Minimal quality improvement over 3.' } },
    { value: '1',  label: '1',              desc: { ru: 'Почти максимальное качество. Очень медленно.', en: 'Near-maximum quality. Very slow.' } },
    { value: '0',  label: '0 — Slowest',   desc: { ru: 'Наилучшее сжатие. Кодирует в 5–8× дольше, чем preset 6.', en: 'Best compression. Encodes 5–8× longer than preset 6.' } },
]

const NVENC_SPEEDS = [
    { value: 'p1', label: 'p1 — Fastest',       desc: { ru: 'Максимальная скорость NVENC. Файл заметно крупнее, чем p4. Только для тестов.', en: 'Maximum NVENC speed. File noticeably larger than p4. For tests only.' } },
    { value: 'p2', label: 'p2 — Faster',        desc: { ru: 'Очень быстро, сжатие слабее среднего.', en: 'Very fast, compression below average.' } },
    { value: 'p3', label: 'p3 — Fast',          desc: { ru: 'Быстро, файл немного крупнее p4.', en: 'Fast, file slightly larger than p4.' } },
    { value: 'p4', label: 'p4 — Medium',        desc: { ru: 'Дефолтный пресет NVENC. Баланс скорости и размера файла.', en: 'Default NVENC preset. Balanced speed and file size.' } },
    { value: 'p5', label: 'p5 — Slow',          desc: { ru: 'Лучше сжатие, чем p4. Файл немного меньше, скорость чуть ниже.', en: 'Better compression than p4. File slightly smaller, slightly lower speed.' }, recommended: true },
    { value: 'p6', label: 'p6 — Slower',        desc: { ru: 'Высокое качество. Кодирует заметно дольше p5.', en: 'High quality. Encodes noticeably slower than p5.' } },
    { value: 'p7', label: 'p7 — Slowest',       desc: { ru: 'Максимальное качество NVENC. Самый маленький файл, самое медленное кодирование.', en: 'Maximum NVENC quality. Smallest file, slowest encoding.' } },
]

const QSV_SPEEDS = [
    { value: 'veryfast', label: 'veryfast', desc: { ru: 'Максимальная скорость QSV. Файл заметно крупнее, чем balanced.', en: 'Maximum QSV speed. File noticeably larger than balanced.' } },
    { value: 'faster',   label: 'faster',   desc: { ru: 'Быстро, сжатие хуже среднего.', en: 'Fast, compression below average.' } },
    { value: 'fast',     label: 'fast',     desc: { ru: 'Немного быстрее balanced, файл чуть больше.', en: 'Slightly faster than balanced, file slightly larger.' } },
    { value: 'balanced', label: 'balanced', desc: { ru: 'Оптимальный баланс скорости и размера файла для QSV. Рекомендован.', en: 'Optimal speed/file size balance for QSV. Recommended.' }, recommended: true },
    { value: 'slow',     label: 'slow',     desc: { ru: 'Лучше сжатие, чем balanced. Файл немного меньше.', en: 'Better compression than balanced. File slightly smaller.' } },
    { value: 'slower',   label: 'slower',   desc: { ru: 'Ещё лучше сжатие, но кодирует заметно дольше.', en: 'Even better compression, but encodes noticeably longer.' } },
    { value: 'veryslow', label: 'veryslow', desc: { ru: 'Максимальное качество QSV. Медленнее, но разница с slower невелика.', en: 'Maximum QSV quality. Slower, but difference from slower is minimal.' } },
]

const VCE_SPEEDS = [
    { value: 'speed',    label: 'speed',    desc: { ru: 'Максимальная скорость AMD VCE. Файл крупнее, чем quality.', en: 'Maximum AMD VCE speed. File larger than quality.' } },
    { value: 'balanced', label: 'balanced', desc: { ru: 'Баланс скорости и размера файла.', en: 'Speed/file size balance.' } },
    { value: 'quality',  label: 'quality',  desc: { ru: 'Лучшее сжатие AMD VCE. Файл на ~10% меньше speed при том же качестве. Рекомендован.', en: 'Best AMD VCE compression. File ~10% smaller than speed at same quality. Recommended.' }, recommended: true },
]

const VP_SPEEDS = [
    { value: 'best',     label: 'best',     desc: { ru: 'Лучшее сжатие VP8/VP9. Файл меньше, кодирование значительно дольше.', en: 'Best VP8/VP9 compression. File smaller, encoding significantly longer.' }, recommended: true },
    { value: 'good',     label: 'good',     desc: { ru: 'Разумный баланс скорости и размера файла.', en: 'Reasonable speed/file size balance.' } },
    { value: 'realtime', label: 'realtime', desc: { ru: 'Очень быстро, но слабое сжатие. Файл значительно крупнее.', en: 'Very fast, but weak compression. File significantly larger.' } },
]

const LIBAOM_AV1_SPEEDS = [
    { value: '0', label: '0 — Slowest',  desc: { ru: 'Максимальное качество libaom AV1. Очень медленно.', en: 'Best libaom AV1 quality. Extremely slow.' } },
    { value: '1', label: '1',            desc: { ru: 'Почти максимальное качество. Очень медленно.', en: 'Near-best quality. Very slow.' } },
    { value: '2', label: '2',            desc: { ru: 'Высокое качество. Значительно медленнее 4.', en: 'High quality. Significantly slower than 4.' } },
    { value: '3', label: '3',            desc: { ru: 'Хорошее качество. Медленнее 4.', en: 'Good quality. Slower than 4.' } },
    { value: '4', label: '4 — Balanced', desc: { ru: 'Оптимальный баланс скорости и качества. Рекомендован.', en: 'Optimal speed/quality balance. Recommended.' }, recommended: true },
    { value: '5', label: '5',            desc: { ru: 'Немного быстрее 4, чуть хуже сжатие.', en: 'Slightly faster than 4, slightly worse compression.' } },
    { value: '6', label: '6',            desc: { ru: 'Быстро. Файл заметно крупнее, чем при 4.', en: 'Fast. File noticeably larger than at 4.' } },
    { value: '7', label: '7',            desc: { ru: 'Быстрее, но значительно хуже качество.', en: 'Faster but significantly worse quality.' } },
    { value: '8', label: '8 — Fastest',  desc: { ru: 'Максимальная скорость. Слабое сжатие.', en: 'Maximum speed. Weak compression.' } },
]

const PRORES_PROFILES = [
    { value: '0', label: 'Proxy (0)',    desc: { ru: 'ProRes 422 Proxy — минимальный размер, для оффлайн-монтажа и предпросмотра.', en: 'ProRes 422 Proxy — smallest size, for offline editing and proxy workflow.' } },
    { value: '1', label: 'LT (1)',       desc: { ru: 'ProRes 422 LT — лёгкий профиль для монтажа. Меньше, чем Standard.', en: 'ProRes 422 LT — lightweight editing profile. Smaller than Standard.' } },
    { value: '2', label: 'Standard (2)', desc: { ru: 'ProRes 422 Standard — стандартный профиль для производства. Рекомендован.', en: 'ProRes 422 Standard — standard production profile. Recommended.' }, recommended: true },
    { value: '3', label: 'HQ (3)',       desc: { ru: 'ProRes 422 HQ — высокое качество, более крупный файл.', en: 'ProRes 422 HQ — high quality, larger file.' } },
    { value: '4', label: '4444 (4)',     desc: { ru: 'ProRes 4444 — включает альфа-канал, 4:4:4 цветовое пространство.', en: 'ProRes 4444 — includes alpha channel, 4:4:4 color space.' } },
    { value: '5', label: '4444 XQ (5)', desc: { ru: 'ProRes 4444 XQ — максимальное качество ProRes. Очень крупные файлы.', en: 'ProRes 4444 XQ — maximum ProRes quality. Very large files.' } },
]

const DNXHD_PROFILES = [
    { value: 'dnxhr_lb',  label: 'DNxHR LB',  desc: { ru: 'DNxHR Low Bandwidth — минимальный битрейт для монтажа.', en: 'DNxHR Low Bandwidth — lowest bitrate for editing.' } },
    { value: 'dnxhr_sq',  label: 'DNxHR SQ',  desc: { ru: 'DNxHR Standard Quality — стандартный профиль. Рекомендован.', en: 'DNxHR Standard Quality — standard profile. Recommended.' }, recommended: true },
    { value: 'dnxhr_hq',  label: 'DNxHR HQ',  desc: { ru: 'DNxHR High Quality — высокое качество для финального рендера.', en: 'DNxHR High Quality — high quality for final render.' } },
    { value: 'dnxhr_444', label: 'DNxHR 444', desc: { ru: 'DNxHR 444 — полное 4:4:4 цветовое пространство для хроматики.', en: 'DNxHR 444 — full 4:4:4 color space for chroma.' } },
]

export const ENCODER_PRESETS = {
    x264:          X264_X265_SPEEDS,
    x264_10bit:    X264_X265_SPEEDS,
    x265:          X264_X265_SPEEDS,
    x265_10bit:    X264_X265_SPEEDS,
    x265_12bit:    X264_X265_SPEEDS,
    svt_av1:       SVT_AV1_SPEEDS,
    svt_av1_10bit: SVT_AV1_SPEEDS,
    nvenc_h264:    NVENC_SPEEDS,
    nvenc_h265:    NVENC_SPEEDS,
    nvenc_av1:     NVENC_SPEEDS,
    qsv_h264:      QSV_SPEEDS,
    qsv_h265:      QSV_SPEEDS,
    qsv_av1:       QSV_SPEEDS,
    vce_h264:      VCE_SPEEDS,
    vce_h265:      VCE_SPEEDS,
    vce_av1:       VCE_SPEEDS,
    mf_h264:       [{ value: 'default', label: 'default', desc: { ru: 'Единственный пресет. Параметры задаются драйвером.', en: 'Single preset. Parameters are set by the driver.' } }],
    mf_h265:       [{ value: 'default', label: 'default', desc: { ru: 'Единственный пресет. Параметры задаются драйвером.', en: 'Single preset. Parameters are set by the driver.' } }],
    vp8:           VP_SPEEDS,
    vp9:           VP_SPEEDS,
    vp9_10bit:     VP_SPEEDS,
    theora:        [],
    libaom_av1:   LIBAOM_AV1_SPEEDS,
    mpeg4:        [],
    mpeg2video:   [],
    mpeg1video:   [],
    prores_ks:    PRORES_PROFILES,
    dnxhd:        DNXHD_PROFILES,
    ffv1:         [],
    huffyuv:      [],
    mjpeg:        [],
    wmv2:         [],
    wmv1:         [],
    h263p:        [],
    h263:         [],
    flv1:         [],
}

// ─── Default settings ──────────────────────────────────────────────────────────
export const DEFAULT_SETTINGS = {
    // Video
    format: 'av_mp4',
    resolution: 'source',
    fps: 'source',
    fpsMode: 'vfr',
    quality: 'high',
    customQuality: 20,
    encoder: 'x265',
    encoderSpeed: 'slow',
    hwDecoding: 'none',
    multiPass: false,
    // Audio
    audioCodec: 'av_aac',
    audioBitrate: '160',
    audioMixdown: 'stereo',
    audioSampleRate: 'auto',
    chapterMarkers: true,
    optimizeMP4: false,
    // Subtitles
    subtitleMode: 'none',
    subtitleBurn: false,
    subtitleDefault: false,
    subtitleLanguage: 'any',
    subtitleExternalFile: '',
    // Filters
    deinterlace: 'off',
    denoise: 'off',
    deblock: 'off',
    sharpen: 'off',
    grayscale: false,
    rotate: '0',
    // HDR & Meta
    hdrMetadata: 'off',
    keepMetadata: false,
    inlineParamSets: false,
    // Video output
    alphaChannel: false,
    // UI
    showAllCodecs: false,
}

// ─── GPU-aware defaults ────────────────────────────────────────────────────────
const GPU_ENCODER_MAP = {
    nvidia: { encoder: 'nvenc_h264', encoderSpeed: 'p5' },
    amd:    { encoder: 'vce_h264',   encoderSpeed: 'quality' },
    intel:  { encoder: 'qsv_h264',   encoderSpeed: 'balanced' },
}

export function getDefaultSettingsForGpu(vendor) {
    return { ...DEFAULT_SETTINGS, ...(GPU_ENCODER_MAP[vendor] || {}) }
}

export function getStoredGpuVendor() {
    try { return localStorage.getItem('gorex-gpu-vendor') || null } catch { return null }
}

export function saveGpuVendor(vendor) {
    try { localStorage.setItem('gorex-gpu-vendor', vendor) } catch {}
}

// ─── Default settings initializer (respects saved GPU vendor) ─────────────────
const NVENC_ENCODERS = new Set(['nvenc_h264', 'nvenc_h265', 'nvenc_av1'])
const NVENC_LEGACY_SPEED_MAP = {
    default: 'p4', hp: 'p2', hq: 'p5', bd: 'p4', ll: 'p2', llhq: 'p4', llhp: 'p1',
}

export function initDefaultSettings() {
    try {
        const saved = localStorage.getItem('gorex-default-settings')
        if (saved) {
            const parsed = JSON.parse(saved)
            if (NVENC_ENCODERS.has(parsed.encoder) && NVENC_LEGACY_SPEED_MAP[parsed.encoderSpeed]) {
                parsed.encoderSpeed = NVENC_LEGACY_SPEED_MAP[parsed.encoderSpeed]
                localStorage.setItem('gorex-default-settings', JSON.stringify(parsed))
            }
            return { ...DEFAULT_SETTINGS, ...parsed }
        }
    } catch {}
    const vendor = getStoredGpuVendor()
    return vendor ? getDefaultSettingsForGpu(vendor) : { ...DEFAULT_SETTINGS }
}

// ─── Encoder groups ────────────────────────────────────────────────────────────
export const ENCODER_GROUPS = [
    {
        id: 'software', label: 'Программные', labelKey: 'softwareEncoders',
        encoders: [
            { value: 'x265',          label: 'H.265 / HEVC (x265)',   desc: { ru: 'Вдвое эффективнее H.264. Лучший выбор для архива и 4K. Медленнее.', en: 'Twice as efficient as H.264. Best choice for archives and 4K. Slower.' } },
            { value: 'x265_10bit',    label: 'H.265 10-bit (x265)',   desc: { ru: 'H.265 с расширенным цветом. Лучше для HDR и плавных градиентов.', en: 'H.265 with extended color. Better for HDR and smooth gradients.' } },
            { value: 'x265_12bit',    label: 'H.265 12-bit (x265)',   desc: { ru: 'H.265 профессионального уровня. Избыточен для большинства задач.', en: 'Professional-grade H.265. Overkill for most tasks.' } },
            { value: 'x264',          label: 'H.264 (x264)',          desc: { ru: 'Максимальная совместимость. Воспроизводится на любом устройстве.', en: 'Maximum compatibility. Plays on any device.' } },
            { value: 'x264_10bit',    label: 'H.264 10-bit (x264)',   desc: { ru: 'H.264 с улучшенным цветом. Чуть хуже совместимость со старыми ТВ.', en: 'H.264 with improved color. Slightly lower compatibility with older TVs.' } },
            { value: 'svt_av1',       label: 'AV1 (SVT-AV1)',        desc: { ru: 'Современный открытый кодек. Эффективнее H.265, но значительно медленнее.', en: 'Modern open codec. More efficient than H.265, but significantly slower.' } },
            { value: 'svt_av1_10bit', label: 'AV1 10-bit (SVT-AV1)', desc: { ru: 'AV1 с поддержкой широкого цвета и HDR.', en: 'AV1 with wide color gamut and HDR support.' } },
            { value: 'vp9',           label: 'VP9 (libvpx)',          desc: { ru: 'Открытый кодек Google. Хорош для YouTube и HTML5 видео.', en: "Google's open codec. Great for YouTube and HTML5 video." } },
            { value: 'vp9_10bit',     label: 'VP9 10-bit (libvpx)',   desc: { ru: 'VP9 с расширенным диапазоном цвета.', en: 'VP9 with extended color range.' } },
            { value: 'vp8',           label: 'VP8 (libvpx)',          desc: { ru: 'Устаревший. Рекомендуется только для контейнера WebM.', en: 'Deprecated. Recommended only for WebM container.' } },
            { value: 'theora',        label: 'Theora',                desc: { ru: 'Открытый кодек для OGG. Устарел, не рекомендуется.', en: 'Open codec for OGG container. Deprecated, not recommended.' } },
        ],
    },
    {
        id: 'nvenc', label: 'NVIDIA (NVENC)',
        encoders: [
            { value: 'nvenc_h264', label: 'H.264 NVENC', desc: { ru: 'Аппаратный H.264 на GPU NVIDIA. В 10–20× быстрее x264, качество чуть ниже.', en: 'Hardware H.264 on NVIDIA GPU. 10–20× faster than x264, quality slightly lower.' } },
            { value: 'nvenc_h265', label: 'H.265 NVENC', desc: { ru: 'Быстрый H.265 через NVENC. Карты Pascal и новее.', en: 'Fast H.265 via NVENC. Pascal cards and newer.' } },
            { value: 'nvenc_av1',  label: 'AV1 NVENC',  desc: { ru: 'Аппаратный AV1. Только RTX 40xx и новее.', en: 'Hardware AV1. RTX 40xx and newer only.' } },
        ],
    },
    {
        id: 'qsv', label: 'Intel (QSV)',
        encoders: [
            { value: 'qsv_h264', label: 'H.264 QSV', desc: { ru: 'Аппаратный H.264 через Intel Quick Sync. Быстро, умеренное качество.', en: 'Hardware H.264 via Intel Quick Sync. Fast, moderate quality.' } },
            { value: 'qsv_h265', label: 'H.265 QSV', desc: { ru: 'Быстрый H.265 через QSV. Skylake и новее.', en: 'Fast H.265 via QSV. Skylake and newer.' } },
            { value: 'qsv_av1',  label: 'AV1 QSV',  desc: { ru: 'Аппаратный AV1 через QSV. Только Intel Arc.', en: 'Hardware AV1 via QSV. Intel Arc only.' } },
        ],
    },
    {
        id: 'vce', label: 'AMD (VCE)',
        encoders: [
            { value: 'vce_h264', label: 'H.264 VCE', desc: { ru: 'Аппаратный H.264 на видеокартах AMD. Быстро, совместимость везде.', en: 'Hardware H.264 on AMD GPUs. Fast, compatible everywhere.' } },
            { value: 'vce_h265', label: 'H.265 VCE', desc: { ru: 'Быстрый H.265 на AMD. Карты RX 5xxx и новее.', en: 'Fast H.265 on AMD. RX 5xxx cards and newer.' } },
            { value: 'vce_av1',  label: 'AV1 VCE',  desc: { ru: 'Аппаратный AV1 на AMD. Только RX 7xxx и новее.', en: 'Hardware AV1 on AMD. RX 7xxx and newer only.' } },
        ],
    },
    {
        id: 'mf', label: 'Windows (MediaFoundation)',
        encoders: [
            { value: 'mf_h264', label: 'H.264 MF', desc: { ru: 'H.264 через Windows Media API. Резервный вариант при отсутствии NVENC/QSV/VCE.', en: 'H.264 via Windows Media API. Fallback when NVENC/QSV/VCE is unavailable.' } },
            { value: 'mf_h265', label: 'H.265 MF', desc: { ru: 'H.265 через Windows Media API. Совместимость зависит от драйверов.', en: 'H.265 via Windows Media API. Compatibility depends on drivers.' } },
        ],
    },
    {
        id: 'intermediate', label: 'ProRes / DNxHD / Lossless', labelKey: 'intermediateEncoders',
        encoders: [
            { value: 'prores_ks',  label: 'Apple ProRes',       desc: { ru: 'Apple ProRes — профессиональный промежуточный кодек. Профиль выбирается через «пресет».', en: 'Apple ProRes — professional intermediate codec. Profile is selected via the speed preset.' } },
            { value: 'dnxhd',     label: 'Avid DNxHD/DNxHR',  desc: { ru: 'Avid DNxHD/DNxHR — промежуточный кодек для монтажных систем. Аналог ProRes для Avid.', en: 'Avid DNxHD/DNxHR — intermediate codec for editing suites. ProRes equivalent for Avid.' } },
            { value: 'ffv1',      label: 'FFV1 (Lossless)',    desc: { ru: 'FFV1 — полностью без потерь. Идеален для архивирования исходников. Крупные файлы.', en: 'FFV1 — fully lossless. Ideal for archiving sources. Large files.' } },
            { value: 'huffyuv',   label: 'HuffYUV (Lossless)', desc: { ru: 'HuffYUV — быстрый кодек без потерь для промежуточного рабочего процесса.', en: 'HuffYUV — fast lossless codec for intermediate workflow.' } },
            { value: 'libaom_av1', label: 'AV1 (libaom)',      desc: { ru: 'AV1 (libaom) — референсный энкодер AV1. Лучшее качество, но значительно медленнее SVT-AV1.', en: 'AV1 (libaom) — reference AV1 encoder. Best quality but significantly slower than SVT-AV1.' } },
        ],
    },
    {
        id: 'legacy', label: 'Legacy', labelKey: 'legacyEncoders',
        encoders: [
            { value: 'mpeg4',      label: 'MPEG-4 Part 2',    desc: { ru: 'MPEG-4 Part 2 — устаревший кодек, совместимый с Xvid/DivX. Для контейнеров AVI и MP4.', en: 'MPEG-4 Part 2 — legacy codec compatible with Xvid/DivX. For AVI and MP4 containers.' } },
            { value: 'mpeg2video', label: 'MPEG-2',            desc: { ru: 'MPEG-2 — стандарт DVD и вещательного ТВ. Для контейнеров AVI, MKV, MPEG-TS.', en: 'MPEG-2 — DVD and broadcast TV standard. For AVI, MKV, MPEG-TS containers.' } },
            { value: 'mpeg1video', label: 'MPEG-1',            desc: { ru: 'MPEG-1 — кодек уровня Video CD. Для AVI и MPEG-TS. Очень устаревший.', en: 'MPEG-1 — Video CD era codec. For AVI and MPEG-TS. Very outdated.' } },
            { value: 'mjpeg',      label: 'Motion JPEG',       desc: { ru: 'Motion JPEG — последовательность JPEG-кадров. Совместим с большинством устройств.', en: 'Motion JPEG — a sequence of JPEG frames. Compatible with most devices.' } },
            { value: 'wmv2',       label: 'WMV8 (wmv2)',       desc: { ru: 'Windows Media Video 8 — устаревший кодек Microsoft. Работает в AVI и MKV.', en: 'Windows Media Video 8 — legacy Microsoft codec. Works in AVI and MKV.' } },
            { value: 'wmv1',       label: 'WMV7 (wmv1)',       desc: { ru: 'Windows Media Video 7 — ранний кодек Microsoft. Только для старых проектов.', en: 'Windows Media Video 7 — early Microsoft codec. For legacy projects only.' } },
            { value: 'h263p',      label: 'H.263+ (h263p)',    desc: { ru: 'H.263+ — улучшенный H.263 для видеоконференций. Используется в 3GP и MPEG-TS.', en: 'H.263+ — enhanced H.263 for video conferencing. Used in 3GP and MPEG-TS.' } },
            { value: 'h263',       label: 'H.263',             desc: { ru: 'H.263 — устаревший видеокодек для мобильных устройств и 3G звонков.', en: 'H.263 — legacy video codec for mobile devices and 3G calls.' } },
            { value: 'flv1',       label: 'Sorenson Spark (FLV)', desc: { ru: 'Sorenson Spark / FLV1 — кодек Flash Video. Только для FLV-контейнера.', en: 'Sorenson Spark / FLV1 — Flash Video codec. FLV container only.' } },
        ],
    },
]

// ─── Encoder groups for conversion page (GPU-aware) ───────────────────────────
export function getConversionEncoderGroups(vendor, showAll, t) {
    const software   = ENCODER_GROUPS.find(g => g.id === 'software')
    const nvenc      = ENCODER_GROUPS.find(g => g.id === 'nvenc')
    const qsv        = ENCODER_GROUPS.find(g => g.id === 'qsv')
    const vce        = ENCODER_GROUPS.find(g => g.id === 'vce')

    const gpuGroupMap = { nvidia: nvenc, intel: qsv, amd: vce }
    const gpuGroup = gpuGroupMap[vendor]

    const rec = t ? t('recommended') : 'рекомендован'
    const swLabel = t ? t('softwareEncoders') : (software?.label || 'Программные')

    const softwarePrimary = {
        label: swLabel,
        encoders: [
            { value: 'x265',    label: 'H.265 / HEVC (x265)', desc: { ru: 'Вдвое эффективнее H.264. Лучший выбор для архива и 4K. Медленнее.', en: 'Twice as efficient as H.264. Best choice for archives and 4K. Slower.' } },
            { value: 'x264',    label: 'H.264 (x264)',         desc: { ru: 'Максимальная совместимость. Воспроизводится на любом устройстве.', en: 'Maximum compatibility. Plays on any device.' } },
            { value: 'svt_av1', label: 'AV1 (SVT-AV1)',       desc: { ru: 'Современный открытый кодек. Эффективнее H.265, но значительно медленнее.', en: 'Modern open codec. More efficient than H.265, but significantly slower.' } },
        ],
    }

    if (!showAll) {
        if (gpuGroup) {
            const gpuLabel = {
                nvidia: `NVIDIA NVENC (${rec})`,
                intel:  `Intel QSV (${rec})`,
                amd:    `AMD VCE (${rec})`,
            }[vendor]
            return [
                { label: gpuLabel, encoders: gpuGroup.encoders },
                softwarePrimary,
            ]
        }
        return [softwarePrimary]
    }

    // showAll = true: GPU group first (with translated label), then the rest
    if (gpuGroup) {
        const others = ENCODER_GROUPS.filter(g => g !== gpuGroup)
        const translateLabel = (g) => g.labelKey && t ? t(g.labelKey) : g.label
        return [gpuGroup, ...others].map(g => ({ ...g, label: translateLabel(g) }))
    }
    return ENCODER_GROUPS.map(g => g.labelKey && t ? { ...g, label: t(g.labelKey) } : g)
}

// ─── WebM codec compatibility ─────────────────────────────────────────────────
export const WEBM_COMPATIBLE_ENCODERS = new Set(['vp8', 'vp9', 'vp9_10bit', 'svt_av1', 'svt_av1_10bit', 'nvenc_av1', 'qsv_av1', 'vce_av1', 'libaom_av1'])
export const WEBM_COMPATIBLE_AUDIO    = new Set(['vorbis', 'opus'])

// ─── Encoders where CRF/quality does not apply ────────────────────────────────
// prores_ks and dnxhd use profile-based quality via the speed preset selector.
// ffv1 and huffyuv are truly lossless — no quality parameter is used.
export const NO_CRF_ENCODERS = new Set(['ffv1', 'huffyuv', 'prores_ks', 'dnxhd'])

// ─── Encoders that support alpha channel (transparency) ──────────────────────
export const ALPHA_CAPABLE_ENCODERS = new Set(['vp9', 'vp9_10bit', 'ffv1', 'prores_ks', 'libaom_av1'])

// ─── Per-encoder disabled formats ─────────────────────────────────────────────────
export const ENCODER_DISABLED_FORMATS = {
    // VP8 / VP9 — несовместимы с MP4, MOV и legacy контейнерами
    vp8:        new Set(['av_mp4', 'av_mov', 'av_avi', 'av_flv', 'av_ts', 'av_3gp']),
    vp9:        new Set(['av_mp4', 'av_mov', 'av_avi', 'av_flv', 'av_ts', 'av_3gp']),
    vp9_10bit:  new Set(['av_mp4', 'av_mov', 'av_avi', 'av_flv', 'av_ts', 'av_3gp']),
    // Theora — только MKV и OGG
    theora:     new Set(['av_mp4', 'av_mov', 'av_webm', 'av_avi', 'av_flv', 'av_ts', 'av_3gp']),
    // SVT-AV1 / HW AV1 — не подходят для legacy контейнеров
    svt_av1:        new Set(['av_avi', 'av_flv', 'av_3gp']),
    svt_av1_10bit:  new Set(['av_avi', 'av_flv', 'av_3gp']),
    nvenc_av1:      new Set(['av_avi', 'av_flv', 'av_3gp']),
    qsv_av1:        new Set(['av_avi', 'av_flv', 'av_3gp']),
    vce_av1:        new Set(['av_avi', 'av_flv', 'av_3gp']),
    // x265 — не стандартен для FLV, OGG, 3GP
    x265:         new Set(['av_flv', 'av_ogg', 'av_3gp']),
    x265_10bit:   new Set(['av_flv', 'av_ogg', 'av_3gp']),
    x265_12bit:   new Set(['av_flv', 'av_ogg', 'av_3gp']),
    nvenc_h265:   new Set(['av_flv', 'av_ogg', 'av_3gp']),
    qsv_h265:     new Set(['av_flv', 'av_ogg', 'av_3gp']),
    vce_h265:     new Set(['av_flv', 'av_ogg', 'av_3gp']),
    mf_h265:      new Set(['av_flv', 'av_ogg', 'av_3gp']),
    // libaom AV1 — не подходит для legacy/специфичных контейнеров
    libaom_av1:   new Set(['av_avi', 'av_flv', 'av_3gp']),
    // MPEG-4 Part 2 — не работает в WebM и OGG
    mpeg4:        new Set(['av_webm', 'av_ogg']),
    // MPEG-2 — только AVI, MKV, TS
    mpeg2video:   new Set(['av_webm', 'av_ogg', 'av_flv', 'av_3gp', 'av_mp4', 'av_mov']),
    // MPEG-1 — только AVI, MKV, TS
    mpeg1video:   new Set(['av_webm', 'av_ogg', 'av_flv', 'av_3gp', 'av_mp4', 'av_mov']),
    // ProRes — только MOV и MKV
    prores_ks:    new Set(['av_webm', 'av_avi', 'av_flv', 'av_ts', 'av_ogg', 'av_3gp', 'av_mp4']),
    // DNxHD — только MOV и MKV
    dnxhd:        new Set(['av_webm', 'av_avi', 'av_flv', 'av_ts', 'av_ogg', 'av_3gp', 'av_mp4']),
    // FFV1 — только MKV и AVI
    ffv1:         new Set(['av_mp4', 'av_mov', 'av_webm', 'av_flv', 'av_ts', 'av_ogg', 'av_3gp']),
    // HuffYUV — только MKV и AVI
    huffyuv:      new Set(['av_mp4', 'av_mov', 'av_webm', 'av_flv', 'av_ts', 'av_ogg', 'av_3gp']),
    // Motion JPEG — не работает в WebM, OGG, FLV
    mjpeg:        new Set(['av_webm', 'av_ogg', 'av_flv']),
    // WMV — только AVI и MKV
    wmv2:         new Set(['av_mp4', 'av_mov', 'av_webm', 'av_ts', 'av_ogg', 'av_3gp', 'av_flv']),
    wmv1:         new Set(['av_mp4', 'av_mov', 'av_webm', 'av_ts', 'av_ogg', 'av_3gp', 'av_flv']),
    // H.263 — только 3GP, TS, AVI
    h263p:        new Set(['av_webm', 'av_ogg', 'av_mkv', 'av_mov', 'av_flv']),
    h263:         new Set(['av_webm', 'av_ogg', 'av_mkv', 'av_mov', 'av_flv']),
    // FLV1 / Sorenson Spark — только FLV
    flv1:         new Set(['av_mp4', 'av_mkv', 'av_mov', 'av_webm', 'av_ts', 'av_ogg', 'av_3gp', 'av_avi']),
}

// ─── Help texts (i18n-based lookups) ──────────────────────────────────────────
function getFormatHelp(format, t) {
    const key = {
        av_mp4:  'helpFmtMp4',
        av_mkv:  'helpFmtMkv',
        av_webm: 'helpFmtWebm',
        av_mov:  'helpFmtMov',
        av_avi:  'helpFmtAvi',
        av_flv:  'helpFmtFlv',
        av_ts:   'helpFmtTs',
        av_ogg:  'helpFmtOgg',
        av_3gp:  'helpFmt3gp',
    }[format]
    return key ? t(key) : t('hintFormat')
}
function getResolutionHelp(res, t) {
    const key = { source: 'helpResSource', '4k': 'helpRes4k', '1440p': 'helpRes1440p', '1080p': 'helpRes1080p', '720p': 'helpRes720p', '480p': 'helpRes480p' }[res]
    return key ? t(key) : t('hintResolution')
}
function getFpsHelp(fps, t) {
    const key = { source: 'helpFpsSource', '60': 'helpFps60', '30': 'helpFps30', '25': 'helpFps25', '24': 'helpFps24', '23.976': 'helpFps23976' }[fps]
    return key ? t(key) : t('hintFps')
}
function getQualityHelp(quality, t) {
    const key = { lossless: 'helpQualLossless', high: 'helpQualHigh', medium: 'helpQualMedium', low: 'helpQualLow', potato: 'helpQualPotato', custom: 'helpQualCustom' }[quality]
    return key ? t(key) : t('hintQualityMode')
}
function getEncoderHelpText(encoder, t) {
    const key = {
        x265: 'helpEncX265', x265_10bit: 'helpEncX265_10bit', x265_12bit: 'helpEncX265_12bit',
        x264: 'helpEncX264', x264_10bit: 'helpEncX264_10bit',
        svt_av1: 'helpEncSvtAv1', svt_av1_10bit: 'helpEncSvtAv1_10bit',
        vp9: 'helpEncVp9', vp9_10bit: 'helpEncVp9_10bit', vp8: 'helpEncVp8', theora: 'helpEncTheora',
        nvenc_h264: 'helpEncNvencH264', nvenc_h265: 'helpEncNvencH265', nvenc_av1: 'helpEncNvencAv1',
        qsv_h264: 'helpEncQsvH264', qsv_h265: 'helpEncQsvH265', qsv_av1: 'helpEncQsvAv1',
        vce_h264: 'helpEncVceH264', vce_h265: 'helpEncVceH265', vce_av1: 'helpEncVceAv1',
        mf_h264: 'helpEncMfH264', mf_h265: 'helpEncMfH265',
        libaom_av1: 'helpEncLibaomAv1',
        mpeg4: 'helpEncMpeg4', mpeg2video: 'helpEncMpeg2', mpeg1video: 'helpEncMpeg1',
        prores_ks: 'helpEncProres', dnxhd: 'helpEncDnxhd',
        ffv1: 'helpEncFfv1', huffyuv: 'helpEncHuffyuv',
        mjpeg: 'helpEncMjpeg', wmv2: 'helpEncWmv2', wmv1: 'helpEncWmv1',
        h263p: 'helpEncH263p', h263: 'helpEncH263', flv1: 'helpEncFlv1',
    }[encoder]
    return key ? t(key) : t('hintVideoCodec')
}

// ─── Helper: resolution options ────────────────────────────────────────────────
function getResolutionOptions(videos, t) {
    const srcLabel = t ? t('resSource') : 'По исходному'
    const opts = [{ value: 'source', label: srcLabel }]

    let isPortrait = false
    let maxDim = 0

    if (videos && videos.length > 0) {
        const portraitCount = videos.filter(v => {
            if (!v.resolution) return false
            const [w, h] = v.resolution.split('x').map(Number)
            return h > w
        }).length
        isPortrait = portraitCount > videos.length / 2

        videos.forEach(v => {
            if (!v.resolution) return
            const [w, h] = v.resolution.split('x').map(Number)
            maxDim = Math.max(maxDim, w, h)
        })
    }

    const p = t ? t('resPortrait') : 'вертикально'
    const standard = [
        { value: '4k',    label: isPortrait ? `4K ${p} (2160p)` : '4K (2160p)',  short: 2160 },
        { value: '1440p', label: isPortrait ? `2K ${p} (1440p)` : '2K (1440p)',  short: 1440 },
        { value: '1080p', label: isPortrait ? `1080p ${p}`       : '1080p',       short: 1080 },
        { value: '720p',  label: isPortrait ? `720p ${p}`        : '720p',        short: 720  },
        { value: '480p',  label: isPortrait ? `480p ${p}`        : '480p',        short: 480  },
    ]

    standard.forEach(r => {
        if (maxDim === 0 || r.short <= maxDim + 20) {
            opts.push(r)
        }
    })

    return opts
}

function getEncoderLabel(encoder) {
    for (const g of ENCODER_GROUPS) {
        const found = g.encoders.find(e => e.value === encoder)
        if (found) return found.label
    }
    return encoder
}

// ─── Custom dropdown ─────────────────────────────────────────────────────────
export function GsSelect({ value, onChange, options, groups, disabled, className, onSpecial, direction = 'up', footer }) {
    const [open, setOpen] = useState(false)
    const ref = useRef(null)
    const { t, lang } = useLanguage()

    const resolveDesc = (desc) => {
        if (!desc) return null
        if (typeof desc === 'object') return desc[lang] || desc.en || desc.ru || null
        return desc
    }

    useEffect(() => {
        if (!open) return
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [open])

    let currentLabel = value
    if (options) {
        const found = options.find(o => o.value === value)
        if (found) currentLabel = found.label
    }
    if (groups) {
        outer: for (const g of groups) {
            for (const o of g.options) {
                if (o.value === value) { currentLabel = o.label; break outer }
            }
        }
    }

    const handleSelect = (optValue, special, optDisabled) => {
        if (optDisabled) return
        setOpen(false)
        if (special && onSpecial) { onSpecial(optValue); return }
        onChange(optValue)
    }

    return (
        <div
            className={`gs-dropdown${disabled ? ' gs-dropdown--disabled' : ''}${open ? ' gs-dropdown--open' : ''}${direction === 'down' ? ' gs-dropdown--down' : ''}${className ? ' ' + className : ''}`}
            ref={ref}
        >
            <button
                className="gs-dropdown-trigger"
                type="button"
                onClick={() => { if (!disabled) setOpen(v => !v) }}
            >
                <span className="gs-dropdown-value">{currentLabel}</span>
                <i className="bi bi-chevron-down gs-dropdown-chevron"></i>
            </button>
            {open && (
                <div className="gs-dropdown-menu">
                    <div className="gs-dropdown-menu-scroll">
                    {options && options.map(o => (
                        <button
                            key={o.value}
                            type="button"
                            disabled={!!o.disabled}
                            className={`gs-dropdown-item${o.value === value ? ' active' : ''}${o.special ? ' gs-dropdown-item--special' : ''}${o.disabled ? ' gs-dropdown-item--disabled' : ''}${o.tags && o.tags.length ? ' gs-dropdown-item--with-tags' : ''}`}
                            onClick={() => handleSelect(o.value, o.special, o.disabled)}
                        >
                            <span className="gs-dropdown-item-main">
                                {o.label}
                            {o.recommended && <span className="gs-dropdown-item-badge">{t('recommended')}</span>}
                            </span>
                            {o.tags && o.tags.length > 0 && (
                                <span className="gs-dropdown-item-tags">
                                    {o.tags.map(tag => (
                                        <span key={tag.key} className={`gs-item-tag ${tag.cls}`}>
                                            <i className={`bi ${tag.icon}`}></i>{tag.label}
                                        </span>
                                    ))}
                                </span>
                            )}
                            {o.desc && <span className="gs-dropdown-item-desc">{resolveDesc(o.desc)}</span>}
                        </button>
                    ))}
                    {groups && groups.map((g, gi) => (
                        <div key={g.label} className={`gs-dropdown-group${gi > 0 ? ' gs-dropdown-group--sep' : ''}`}>
                            <div className="gs-dropdown-group-label">{g.label}</div>
                            {g.options.map(o => (
                                <button
                                    key={o.value}
                                    type="button"
                                    disabled={!!o.disabled}
                                    className={`gs-dropdown-item${o.value === value ? ' active' : ''}${o.disabled ? ' gs-dropdown-item--disabled' : ''}${o.tags && o.tags.length ? ' gs-dropdown-item--with-tags' : ''}`}
                                    onClick={() => handleSelect(o.value, false, o.disabled)}
                                >
                                    <span className="gs-dropdown-item-main">{o.label}</span>
                                    {o.tags && o.tags.length > 0 && (
                                        <span className="gs-dropdown-item-tags">
                                            {o.tags.map(t => (
                                                <span key={t.key} className={`gs-item-tag ${t.cls}`}>
                                                    <i className={`bi ${t.icon}`}></i>{t.label}
                                                </span>
                                            ))}
                                        </span>
                                    )}
                                    {o.desc && <span className="gs-dropdown-item-desc">{resolveDesc(o.desc)}</span>}
                                </button>
                            ))}
                        </div>
                    ))}
                    </div>
                    {footer && (
                        <div className="gs-dropdown-footer">{footer}</div>
                    )}
                </div>
            )}
        </div>
    )
}

// ─── Tooltip component ─────────────────────────────────────────────────────────
function Tooltip({ text }) {
    const [visible, setVisible] = useState(false)

    return (
        <span className="gs-tooltip-wrap">
            <button
                className="gs-help-btn"
                onMouseEnter={() => setVisible(true)}
                onMouseLeave={() => setVisible(false)}
                onClick={e => { e.stopPropagation(); setVisible(v => !v) }}
                tabIndex={-1}
            >
                <i className="bi bi-question-circle"></i>
            </button>
            {visible && (
                <span className="gs-tooltip">{text}</span>
            )}
        </span>
    )
}

// ─── Main component ────────────────────────────────────────────────────────────
function GlobalSettings({ settings, onChange, videos, disabled, gpuVendor }) {
    const { t } = useLanguage()
    const [showCustomQuality, setShowCustomQuality] = useState(false)
    const [draftRF, setDraftRF] = useState(settings.customQuality)
    const [showMoreCodecs, setShowMoreCodecs] = useState(false)

    const rfTable = CODEC_RF[settings.encoder] || CODEC_RF.x265
    const speedPresets = ENCODER_PRESETS[settings.encoder] ?? []
    const resOptions = getResolutionOptions(videos, t)
    const encoderGroups = getConversionEncoderGroups(gpuVendor || 'unknown', showMoreCodecs, t)

    const update = (key, value) => onChange({ ...settings, [key]: value })

    const handleFormatChange = (fmt) => {
        const patch = { format: fmt }
        if (fmt === 'av_webm') {
            if (!WEBM_COMPATIBLE_ENCODERS.has(settings.encoder)) {
                const speeds = ENCODER_PRESETS.vp9
                patch.encoder = 'vp9'
                patch.encoderSpeed = speeds[Math.floor(speeds.length / 2)]?.value ?? 'good'
            }
            const audioCodec = settings.audioCodec || 'av_aac'
            if (!WEBM_COMPATIBLE_AUDIO.has(audioCodec) && !audioCodec.startsWith('copy')) {
                patch.audioCodec = 'opus'
            }
        } else if (fmt === 'av_ogg') {
            // OGG: auto-switch to Theora if current encoder is not OGG-compatible
            if (!new Set(['theora', 'vp8', 'vp9', 'vp9_10bit']).has(settings.encoder)) {
                patch.encoder = 'theora'
                patch.encoderSpeed = undefined
            }
            const audioCodec = settings.audioCodec || 'av_aac'
            if (!WEBM_COMPATIBLE_AUDIO.has(audioCodec) && !audioCodec.startsWith('copy')) {
                patch.audioCodec = 'vorbis'
            }
        } else if (fmt === 'av_flv') {
            // FLV: only flv1 or x264 are valid; switch to flv1 if incompatible
            if (!new Set(['flv1', 'x264', 'x264_10bit', 'nvenc_h264', 'qsv_h264', 'vce_h264', 'mf_h264']).has(settings.encoder)) {
                patch.encoder = 'flv1'
                patch.encoderSpeed = undefined
            }
        } else if (fmt === 'av_3gp') {
            // 3GP: only h263/h263p/h264 are valid
            if (!new Set(['h263', 'h263p', 'x264', 'x264_10bit', 'nvenc_h264', 'qsv_h264', 'vce_h264', 'mf_h264', 'mpeg4']).has(settings.encoder)) {
                patch.encoder = 'h263p'
                patch.encoderSpeed = undefined
            }
        } else {
            const disabledFormats = ENCODER_DISABLED_FORMATS[settings.encoder]
            if (disabledFormats?.has(fmt)) {
                const speeds = ENCODER_PRESETS.x265
                patch.encoder = 'x265'
                patch.encoderSpeed = speeds?.find(s => s.value === 'slow')?.value
                    ?? speeds?.[Math.floor((speeds?.length ?? 0) / 2)]?.value ?? 'slow'
            }
            if (fmt === 'av_mp4' || fmt === 'av_mov' || fmt === 'av_avi' || fmt === 'av_ts') {
                const audioCodec = settings.audioCodec || 'av_aac'
                if (WEBM_COMPATIBLE_AUDIO.has(audioCodec) && !audioCodec.startsWith('copy')) {
                    patch.audioCodec = 'av_aac'
                }
            }
        }
        onChange({ ...settings, ...patch })
    }

    const openCustomQuality = () => {
        setDraftRF(settings.quality === 'custom' ? settings.customQuality : rfTable[settings.quality] ?? rfTable.medium)
        setShowCustomQuality(true)
    }

    const confirmCustomQuality = () => {
        onChange({ ...settings, quality: 'custom', customQuality: draftRF })
        setShowCustomQuality(false)
    }

    const handleEncoderChange = (enc) => {
        const speeds = ENCODER_PRESETS[enc] ?? []
        const mid = speeds[Math.floor(speeds.length / 2)]?.value ?? 'medium'
        onChange({ ...settings, encoder: enc, encoderSpeed: mid })
    }

    const qualityPresets = [
        { key: 'high',   label: t('qualityHigh'),   rf: rfTable.high },
        { key: 'medium', label: t('qualityMedium'),  rf: rfTable.medium },
        { key: 'low',    label: t('qualityLow'),     rf: rfTable.low },
        { key: 'potato', label: t('qualityPotato'),  rf: rfTable.potato },
    ]

    const currentQualityRF = settings.quality === 'custom'
        ? settings.customQuality
        : rfTable[settings.quality]

    const currentFormatHelp  = getFormatHelp(settings.format, t)
    const currentResHelp     = getResolutionHelp(settings.resolution, t)
    const currentFpsHelp     = getFpsHelp(settings.fps, t)
    const currentQualityHelp = getQualityHelp(settings.quality === 'custom' ? 'custom' : settings.quality, t)
    const currentEncHelp     = getEncoderHelpText(settings.encoder, t)

    return (
        <>
            <div className="global-settings">

                {/* ── Format ── */}
                <div className="gs-card gs-card--format">
                    <div className="gs-card-header">
                        <i className="bi bi-file-earmark-play gs-icon"></i>
                        <span className="gs-card-label">{t('rowFormat')}</span>
                        <Tooltip text={currentFormatHelp} />
                    </div>
                    {/* Format dropdown */}
                    <GsSelect
                        value={settings.format}
                        options={[
                            { value: 'av_mp4',  label: 'MP4' },
                            { value: 'av_mkv',  label: 'MKV' },
                            { value: 'av_webm', label: 'WebM' },
                            { value: 'av_mov',  label: 'MOV' },
                            { value: 'av_avi',  label: 'AVI' },
                            { value: 'av_ts',   label: 'MPEG-TS' },
                            { value: 'av_flv',  label: 'FLV' },
                            { value: 'av_ogg',  label: 'OGG' },
                            { value: 'av_3gp',  label: '3GP' },
                        ]}
                        onChange={handleFormatChange}
                        disabled={disabled}
                    />
                </div>


                {/* ── Resolution ── */}
                <div className="gs-card gs-card--resolution">
                    <div className="gs-card-header">
                        <i className="bi bi-aspect-ratio gs-icon"></i>
                        <span className="gs-card-label">{t('rowResolution')}</span>
                        <Tooltip text={currentResHelp} />
                    </div>
                    <GsSelect
                        value={settings.resolution}
                        options={resOptions.map(o => ({ value: o.value, label: o.label }))}
                        onChange={v => update('resolution', v)}
                        disabled={disabled}
                    />
                </div>

                {/* ── FPS ── */}
                <div className="gs-card gs-card--fps">
                    <div className="gs-card-header">
                        <i className="bi bi-camera-video gs-icon"></i>
                        <span className="gs-card-label">FPS</span>
                        <Tooltip text={currentFpsHelp} />
                    </div>
                    <GsSelect
                        value={settings.fps}
                        options={[
                            { value: 'source', label: t('fpsSource') },
                            { value: '60',     label: '60 fps' },
                            { value: '30',     label: '30 fps' },
                            { value: '25',     label: '25 fps' },
                            { value: '24',     label: '24 fps' },
                            { value: '23.976', label: '23.976 fps' },
                        ]}
                        onChange={v => update('fps', v)}
                        disabled={disabled}
                    />
                </div>

                {/* ── Quality ── */}
                <div className="gs-card gs-card--quality">
                    <div className="gs-card-header">
                        <i className="bi bi-sliders2 gs-icon"></i>
                        <span className="gs-card-label">{t('sectionQuality')}</span>
                        <Tooltip text={currentQualityHelp} />
                    </div>
                    {NO_CRF_ENCODERS.has(settings.encoder) ? (
                        <div className="gs-notice">
                            <i className="bi bi-info-circle"></i>
                            {['ffv1', 'huffyuv'].includes(settings.encoder)
                                ? t('noCrfNoticeLossless')
                                : t('noCrfNoticeProfile')
                            }
                        </div>
                    ) : (
                    <GsSelect
                        value={settings.quality}
                        options={[
                            { value: 'lossless', label: `${t('qualityMaxQual')} (RF ${rfTable.min})` },
                            ...qualityPresets.map(p => ({ value: p.key, label: `${p.label} (RF ${p.rf})` })),
                            { value: 'custom', label: settings.quality === 'custom' ? `${t('qualityCustomLabel')} (RF ${settings.customQuality})` : t('qualityCustomEmpty'), special: true },
                        ]}
                        onChange={v => update('quality', v)}
                        onSpecial={() => openCustomQuality()}
                        disabled={disabled}
                    />
                    )}
                </div>

                {/* ── Codec ── */}
                <div className="gs-card gs-card--codec">
                    <div className="gs-card-header">
                        <i className="bi bi-cpu gs-icon"></i>
                        <span className="gs-card-label">{t('gsCodecCard')}</span>
                        <Tooltip text={currentEncHelp} />
                    </div>
                    <div className="gs-codec-row">
                        <GsSelect
                            value={settings.encoder}
                            groups={encoderGroups.map(g => ({ label: g.label, options: g.encoders.map(e => ({
                                value: e.value,
                                label: e.label,
                                desc: e.desc,
                                disabled: ENCODER_DISABLED_FORMATS[e.value]?.has(settings.format) ||
                                    (settings.format === 'av_webm' && !WEBM_COMPATIBLE_ENCODERS.has(e.value)),
                            })) }))
                            }
                            onChange={handleEncoderChange}
                            disabled={disabled}
                            className="gs-dropdown--encoder"
                            footer={
                                <button
                                    type="button"
                                    className="gs-show-more-codecs"
                                    onMouseDown={e => e.stopPropagation()}
                                    onClick={e => { e.stopPropagation(); setShowMoreCodecs(v => !v) }}
                                >
                                    <i className={`bi bi-chevron-${showMoreCodecs ? 'up' : 'down'}`}></i>
                                    {showMoreCodecs ? t('collapseCodecs') : t('expandCodecs')}
                                </button>
                            }
                        />
                        {speedPresets.length > 0 && (
                            <GsSelect
                                value={settings.encoderSpeed}
                                options={speedPresets}
                                onChange={v => update('encoderSpeed', v)}
                                disabled={disabled}
                                className="gs-dropdown--speed"
                            />
                        )}
                    </div>
                </div>

            </div>

            {/* ── Custom quality popup ── */}
            {showCustomQuality && (
                <div className="gs-quality-overlay" onClick={() => setShowCustomQuality(false)}>
                    <div className="gs-quality-popup" onClick={e => e.stopPropagation()}>
                        <div className="gs-qpopup-title">
                            <i className="bi bi-sliders2"></i>
                            {t('gsCustomQualityTitle')}
                        </div>
                        <p className="gs-qpopup-subtitle">
                            RF {rfTable.min} = {t('gsQualityBest')} &nbsp;·&nbsp; RF {rfTable.max} = {t('gsQualityWorst')}
                        </p>
                        <div className="gs-qpopup-value">RF {draftRF}</div>
                        <input
                            type="range"
                            className="gs-quality-slider"
                            min={rfTable.min}
                            max={rfTable.max}
                            step={1}
                            value={draftRF}
                            onChange={e => setDraftRF(Number(e.target.value))}
                        />
                        <div className="gs-qpopup-labels">
                            <span>{t('rfBetter')}</span>
                            <span>{t('rfWorse')}</span>
                        </div>
                        <div className="gs-qpopup-hint">
                            {t('helpQualCustom')}
                        </div>
                        <div className="gs-qpopup-actions">
                            <button className="gs-qpopup-cancel" onClick={() => setShowCustomQuality(false)}>
                                {t('cancel')}
                            </button>
                            <button className="gs-qpopup-confirm" onClick={confirmCustomQuality}>
                                {t('apply')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default GlobalSettings

// ─── Size estimation ───────────────────────────────────────────────────────────
const COMPRESSION_RATIOS = {
    // [high, medium, low, potato] — fraction of source VIDEO size.
    // Calibrated for each encoder's recommended (baseline) preset:
    //   x264/x265 → slow | svt_av1 → preset 6 | nvenc → hq
    //   qsv → balanced | vce → quality | vp8/vp9 → best
    x265:          [0.58, 0.39, 0.23, 0.10],
    x265_10bit:    [0.58, 0.39, 0.23, 0.10],
    x265_12bit:    [0.58, 0.39, 0.23, 0.10],
    x264:          [0.80, 0.58, 0.36, 0.17],
    x264_10bit:    [0.78, 0.56, 0.34, 0.16],
    svt_av1:       [0.50, 0.33, 0.19, 0.08],
    svt_av1_10bit: [0.50, 0.33, 0.19, 0.08],
    vp9:           [0.63, 0.44, 0.27, 0.13],
    vp9_10bit:     [0.63, 0.44, 0.27, 0.13],
    vp8:           [0.88, 0.65, 0.42, 0.20],
    nvenc_h264:    [0.85, 0.62, 0.39, 0.19],
    nvenc_h265:    [0.60, 0.41, 0.25, 0.12],
    nvenc_av1:     [0.53, 0.36, 0.22, 0.10],
    qsv_h264:      [0.83, 0.60, 0.38, 0.18],
    qsv_h265:      [0.57, 0.39, 0.24, 0.11],
    qsv_av1:       [0.53, 0.36, 0.22, 0.10],
    vce_h264:      [0.85, 0.63, 0.40, 0.19],
    vce_h265:      [0.61, 0.42, 0.26, 0.12],
    vce_av1:       [0.55, 0.37, 0.23, 0.11],
    mf_h264:       [0.87, 0.65, 0.41, 0.20],
    mf_h265:       [0.62, 0.43, 0.27, 0.13],
    theora:        [0.90, 0.70, 0.50, 0.24],
    libaom_av1:    [0.48, 0.32, 0.18, 0.08],
    mpeg4:         [0.88, 0.66, 0.44, 0.22],
    mpeg2video:    [0.95, 0.75, 0.52, 0.28],
    mpeg1video:    [1.10, 0.90, 0.65, 0.38],
    prores_ks:     [2.50, 2.00, 1.50, 1.00],
    dnxhd:         [2.20, 1.80, 1.30, 0.90],
    ffv1:          [3.00, 3.00, 3.00, 3.00],
    huffyuv:       [3.50, 3.50, 3.50, 3.50],
    mjpeg:         [0.70, 0.50, 0.35, 0.20],
    wmv2:          [0.92, 0.72, 0.50, 0.26],
    wmv1:          [0.95, 0.75, 0.54, 0.28],
    h263p:         [0.93, 0.74, 0.52, 0.27],
    h263:          [0.96, 0.78, 0.56, 0.30],
    flv1:          [0.94, 0.75, 0.53, 0.28],
}

// Size multipliers per speed preset relative to each encoder's baseline.
// Values > 1.0 = larger file; < 1.0 = smaller file than baseline.
const SPEED_MULT = {
    x264:       { ultrafast: 2.40, superfast: 1.80, veryfast: 1.40, faster: 1.20, fast: 1.10, medium: 1.05, slow: 1.00, slower: 0.93, veryslow: 0.87 },
    x265:       { ultrafast: 2.20, superfast: 1.70, veryfast: 1.35, faster: 1.18, fast: 1.08, medium: 1.04, slow: 1.00, slower: 0.94, veryslow: 0.88 },
    svt_av1:    { '12': 1.60, '11': 1.45, '10': 1.30, '9': 1.18, '8': 1.10, '7': 1.05, '6': 1.00, '5': 0.97, '4': 0.93, '3': 0.89, '2': 0.87, '1': 0.85, '0': 0.83 },
    nvenc_h264: { p1: 1.28, p2: 1.18, p3: 1.10, p4: 1.04, p5: 1.00, p6: 0.96, p7: 0.92 },
    nvenc_h265: { p1: 1.28, p2: 1.18, p3: 1.10, p4: 1.04, p5: 1.00, p6: 0.96, p7: 0.92 },
    nvenc_av1:  { p1: 1.28, p2: 1.18, p3: 1.10, p4: 1.04, p5: 1.00, p6: 0.96, p7: 0.92 },
    qsv_h264:   { veryfast: 1.30, faster: 1.18, fast: 1.08, balanced: 1.00, slow: 0.95, slower: 0.91, veryslow: 0.88 },
    qsv_h265:   { veryfast: 1.30, faster: 1.18, fast: 1.08, balanced: 1.00, slow: 0.95, slower: 0.91, veryslow: 0.88 },
    qsv_av1:    { veryfast: 1.30, faster: 1.18, fast: 1.08, balanced: 1.00, slow: 0.95, slower: 0.91, veryslow: 0.88 },
    vce_h264:   { speed: 1.20, balanced: 1.05, quality: 1.00 },
    vce_h265:   { speed: 1.20, balanced: 1.05, quality: 1.00 },
    vce_av1:    { speed: 1.20, balanced: 1.05, quality: 1.00 },
    vp8:        { realtime: 1.30, good: 1.10, best: 1.00 },
    vp9:        { realtime: 1.30, good: 1.10, best: 1.00 },
}

function parseSizeMB(str) {
    if (!str || str === '—') return null
    const m = str.match(/([\d.]+)\s*(GB|MB)/i)
    if (!m) return null
    const v = parseFloat(m[1])
    return m[2].toLowerCase() === 'gb' ? v * 1024 : v
}

function fmtMB(mb) {
    if (mb >= 1024) return (mb / 1024).toFixed(2) + ' GB'
    return Math.round(mb) + ' MB'
}

// Parse "HH:MM:SS" or "MM:SS" → total seconds
function parseDurationSec(str) {
    if (!str || str === '—') return null
    const parts = str.split(':').map(Number)
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
    if (parts.length === 2) return parts[0] * 60 + parts[1]
    return null
}

// Parse "5.2 Mbps" or "1500 kbps" → numeric kbps
function parseBitrateKbps(str) {
    if (!str || str === '—') return null
    const m = str.match(/([\d.]+)\s*(Mbps|kbps)/i)
    if (!m) return null
    const v = parseFloat(m[1])
    return m[2].toLowerCase() === 'mbps' ? v * 1000 : v
}

function getSpeedMult(encoder, speed) {
    const base = encoder.replace(/_10bit|_12bit/, '')
    const table = SPEED_MULT[encoder] || SPEED_MULT[base]
    return (table && speed != null && table[speed] != null) ? table[speed] : 1.0
}

// Interpolate compression ratio for a custom RF using the four quality anchor points.
// Works for both normal scales (higher RF = worse quality, e.g. x265) and
// inverted scales (higher value = better quality, e.g. theora).
function getRatioForCustomRF(customRF, rfTable, ratios) {
    const anchors = [
        { rf: rfTable.high,   ratio: ratios[0] },
        { rf: rfTable.medium, ratio: ratios[1] },
        { rf: rfTable.low,    ratio: ratios[2] },
        { rf: rfTable.potato, ratio: ratios[3] },
    ].sort((a, b) => a.rf - b.rf)

    if (customRF <= anchors[0].rf) return anchors[0].ratio
    if (customRF >= anchors[anchors.length - 1].rf) return anchors[anchors.length - 1].ratio

    for (let i = 0; i < anchors.length - 1; i++) {
        if (customRF >= anchors[i].rf && customRF <= anchors[i + 1].rf) {
            const t = (customRF - anchors[i].rf) / (anchors[i + 1].rf - anchors[i].rf)
            return anchors[i].ratio + t * (anchors[i + 1].ratio - anchors[i].ratio)
        }
    }
    return ratios[1]
}

export function estimateOutputSize(video, settings) {
    if (!video || !settings || settings.quality === 'lossless') return null
    const sourceMB = parseSizeMB(video.size)
    if (!sourceMB || sourceMB <= 0) return null

    const encoder = settings.encoder || 'x265'
    const ratios = COMPRESSION_RATIOS[encoder] || COMPRESSION_RATIOS.x265
    const rfTable = CODEC_RF[encoder] || CODEC_RF.x265

    // 1. Base video compression ratio for the selected quality level
    let videoRatio
    if (settings.quality === 'custom') {
        videoRatio = getRatioForCustomRF(settings.customQuality, rfTable, ratios)
    } else {
        const idx = { high: 0, medium: 1, low: 2, potato: 3 }
        videoRatio = ratios[idx[settings.quality] ?? 1]
    }

    // 2. Speed preset multiplier
    videoRatio *= getSpeedMult(encoder, settings.encoderSpeed)

    // 3. Resolution scaling (affects video portion only)
    if (settings.resolution && settings.resolution !== 'source' && video.resolution) {
        const PX = { '4k': 3840*2160, '1440p': 2560*1440, '1080p': 1920*1080, '720p': 1280*720, '480p': 854*480 }
        const [w, h] = video.resolution.split('x').map(Number)
        const srcPx = w * h
        const tgtPx = PX[settings.resolution]
        if (tgtPx && tgtPx < srcPx) videoRatio *= Math.pow(tgtPx / srcPx, 0.65)
    }

    // 4. FPS scaling (affects video portion only)
    if (settings.fps && settings.fps !== 'source' && video.fps) {
        const srcFps = parseFloat(video.fps)
        const tgtFps = parseFloat(settings.fps)
        if (srcFps > 0 && tgtFps < srcFps) videoRatio *= tgtFps / srcFps
    }

    // 5. Separate video and audio contributions using duration
    const durationSec = parseDurationSec(video.duration)
    if (durationSec && durationSec > 0) {
        // Estimate source audio portion from total bitrate (cap at 512 kbps)
        const totalKbps = parseBitrateKbps(video.bitrate)
        const srcAudioKbps = totalKbps ? Math.min(totalKbps * 0.12, 512) : 192
        const srcAudioMB = srcAudioKbps * 1000 * durationSec / (8 * 1024 * 1024)
        // Source video = total minus estimated audio (at least 80% of source)
        const srcVideoMB = Math.max(sourceMB - srcAudioMB, sourceMB * 0.80)

        const outVideoMB = srcVideoMB * videoRatio
        const outAudioKbps = parseInt(settings.audioBitrate) || 160
        const outAudioMB = outAudioKbps * 1000 * durationSec / (8 * 1024 * 1024)

        return fmtMB(outVideoMB + outAudioMB)
    }

    // Fallback when duration is unavailable
    return fmtMB(sourceMB * videoRatio)
}
