import { useState, useRef, useEffect } from 'react'
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
}

// ─── Encoder speed presets ─────────────────────────────────────────────────────
const X264_X265_SPEEDS = [
    { value: 'ultrafast', label: 'ultrafast', desc: 'Кодирует в 10–15× быстрее slow. Файл в 2–3× больше при том же качестве. Только для тестов.' },
    { value: 'superfast', label: 'superfast', desc: 'В 7–10× быстрее slow. Файл значительно больше — сжатие слабое.' },
    { value: 'veryfast',  label: 'veryfast',  desc: 'В 4–5× быстрее slow. Заметный проигрыш в размере файла.' },
    { value: 'faster',    label: 'faster',    desc: 'В 2–3× быстрее slow. Файл немного крупнее при том же качестве.' },
    { value: 'fast',      label: 'fast',      desc: 'В 1.5× быстрее slow. Небольшая потеря сжатия по сравнению с medium.' },
    { value: 'medium',    label: 'medium',    desc: 'Дефолтный пресет. Разумный баланс скорости и размера файла.' },
    { value: 'slow',      label: 'slow',      desc: 'Лучше сжатие, чем medium: файл на 5–10% меньше при том же качестве. Рекомендован для архива.', recommended: true },
    { value: 'slower',    label: 'slower',    desc: 'Файл ещё на 3–5% меньше, чем slow. Заметно дольше кодирование.' },
    { value: 'veryslow',  label: 'veryslow',  desc: 'Максимальное сжатие. Файл на ~10% меньше, чем slow, но кодирует в 3–4× дольше.' },
]

const SVT_AV1_SPEEDS = [
    { value: '12', label: '12 — Fastest',  desc: 'Максимальная скорость. Файл значительно больше, чем при preset 6.' },
    { value: '11', label: '11',             desc: 'Очень быстро, слабое сжатие.' },
    { value: '10', label: '10',             desc: 'Быстро, но файл заметно крупнее среднего.' },
    { value: '9',  label: '9',              desc: 'Чуть медленнее 10, ощутимо лучше сжатие.' },
    { value: '8',  label: '8',              desc: 'Хорошая скорость, приемлемый размер файла.' },
    { value: '7',  label: '7',              desc: 'Немного медленнее 8, немного меньше файл.' },
    { value: '6',  label: '6 — Balanced',  desc: 'Оптимальный баланс скорости и размера файла. Рекомендован.', recommended: true },
    { value: '5',  label: '5',              desc: 'Файл на ~3% меньше, чем при 6, но кодирует заметно дольше.' },
    { value: '4',  label: '4',              desc: 'Хорошее сжатие, кодирование в 2× медленнее, чем при 6.' },
    { value: '3',  label: '3',              desc: 'Отличное сжатие. Заметный прирост времени.' },
    { value: '2',  label: '2',              desc: 'Очень медленно. Минимальный прирост качества по сравнению с 3.' },
    { value: '1',  label: '1',              desc: 'Почти максимальное качество. Очень медленно.' },
    { value: '0',  label: '0 — Slowest',   desc: 'Наилучшее сжатие. Кодирует в 5–8× дольше, чем preset 6.' },
]

const NVENC_SPEEDS = [
    { value: 'default', label: 'default', desc: 'Стандартный пресет NVENC — аналог balanced.' },
    { value: 'hp',      label: 'hp (High Perf)',  desc: 'Максимальная скорость GPU. Файл чуть больше, чем hq.' },
    { value: 'hq',      label: 'hq (High Quality)', desc: 'Лучшее качество при аппаратном кодировании. Файл немного меньше, скорость чуть ниже hp.', recommended: true },
    { value: 'bd',      label: 'bd (Blu-ray)',    desc: 'Настройки для Blu-ray совместимости. Для обычных файлов отличий от default нет.' },
    { value: 'll',      label: 'll (Low Latency)',    desc: 'Сниженная задержка за счёт ухудшения сжатия. Файл крупнее.' },
    { value: 'llhq',    label: 'llhq (LL + HQ)', desc: 'Сниженная задержка с сохранением качества. Компромисс между ll и hq.' },
    { value: 'llhp',    label: 'llhp (LL + HP)', desc: 'Максимальная скорость с низкой задержкой. Файл самый крупный.' },
]

const QSV_SPEEDS = [
    { value: 'veryfast', label: 'veryfast', desc: 'Максимальная скорость QSV. Файл заметно крупнее, чем balanced.' },
    { value: 'faster',   label: 'faster',   desc: 'Быстро, сжатие хуже среднего.' },
    { value: 'fast',     label: 'fast',     desc: 'Немного быстрее balanced, файл чуть больше.' },
    { value: 'balanced', label: 'balanced', desc: 'Оптимальный баланс скорости и размера файла для QSV. Рекомендован.', recommended: true },
    { value: 'slow',     label: 'slow',     desc: 'Лучше сжатие, чем balanced. Файл немного меньше.' },
    { value: 'slower',   label: 'slower',   desc: 'Ещё лучше сжатие, но кодирует заметно дольше.' },
    { value: 'veryslow', label: 'veryslow', desc: 'Максимальное качество QSV. Медленнее, но разница с slower невелика.' },
]

const VCE_SPEEDS = [
    { value: 'speed',    label: 'speed',    desc: 'Максимальная скорость AMD VCE. Файл крупнее, чем quality.' },
    { value: 'balanced', label: 'balanced', desc: 'Баланс скорости и размера файла.' },
    { value: 'quality',  label: 'quality',  desc: 'Лучшее сжатие AMD VCE. Файл на ~10% меньше speed при том же качестве. Рекомендован.', recommended: true },
]

const VP_SPEEDS = [
    { value: 'best',     label: 'best',     desc: 'Лучшее сжатие VP8/VP9. Файл меньше, кодирование значительно дольше.', recommended: true },
    { value: 'good',     label: 'good',     desc: 'Разумный баланс скорости и размера файла.' },
    { value: 'realtime', label: 'realtime', desc: 'Очень быстро, но слабое сжатие. Файл значительно крупнее.' },
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
    mf_h264:       [{ value: 'default', label: 'default', desc: 'Единственный пресет. Параметры задаются драйвером.' }],
    mf_h265:       [{ value: 'default', label: 'default', desc: 'Единственный пресет. Параметры задаются драйвером.' }],
    vp8:           VP_SPEEDS,
    vp9:           VP_SPEEDS,
    vp9_10bit:     VP_SPEEDS,
    theora:        [],
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
    // UI
    showAllCodecs: false,
}

// ─── GPU-aware defaults ────────────────────────────────────────────────────────
const GPU_ENCODER_MAP = {
    nvidia: { encoder: 'nvenc_h264', encoderSpeed: 'hq' },
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
export function initDefaultSettings() {
    try {
        const saved = localStorage.getItem('gorex-default-settings')
        if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
    } catch {}
    const vendor = getStoredGpuVendor()
    return vendor ? getDefaultSettingsForGpu(vendor) : { ...DEFAULT_SETTINGS }
}

// ─── Encoder groups ────────────────────────────────────────────────────────────
export const ENCODER_GROUPS = [
    {
        label: 'Программные',
        encoders: [
            { value: 'x265',          label: 'H.265 / HEVC (x265)',   desc: 'Вдвое эффективнее H.264. Лучший выбор для архива и 4K. Медленнее.' },
            { value: 'x265_10bit',    label: 'H.265 10-bit (x265)',   desc: 'H.265 с расширенным цветом. Лучше для HDR и плавных градиентов.' },
            { value: 'x265_12bit',    label: 'H.265 12-bit (x265)',   desc: 'H.265 профессионального уровня. Избыточен для большинства задач.' },
            { value: 'x264',          label: 'H.264 (x264)',          desc: 'Максимальная совместимость. Воспроизводится на любом устройстве.' },
            { value: 'x264_10bit',    label: 'H.264 10-bit (x264)',   desc: 'H.264 с улучшенным цветом. Чуть хуже совместимость со старыми ТВ.' },
            { value: 'svt_av1',       label: 'AV1 (SVT-AV1)',        desc: 'Современный открытый кодек. Эффективнее H.265, но значительно медленнее.' },
            { value: 'svt_av1_10bit', label: 'AV1 10-bit (SVT-AV1)', desc: 'AV1 с поддержкой широкого цвета и HDR.' },
            { value: 'vp9',           label: 'VP9 (libvpx)',          desc: 'Открытый кодек Google. Хорош для YouTube и HTML5 видео.' },
            { value: 'vp9_10bit',     label: 'VP9 10-bit (libvpx)',   desc: 'VP9 с расширенным диапазоном цвета.' },
            { value: 'vp8',           label: 'VP8 (libvpx)',          desc: 'Устаревший. Рекомендуется только для контейнера WebM.' },
            { value: 'theora',        label: 'Theora',                desc: 'Открытый кодек для OGG. Устарел, не рекомендуется.' },
        ],
    },
    {
        label: 'NVIDIA (NVENC)',
        encoders: [
            { value: 'nvenc_h264', label: 'H.264 NVENC', desc: 'Аппаратный H.264 на GPU NVIDIA. В 10–20× быстрее x264, качество чуть ниже.' },
            { value: 'nvenc_h265', label: 'H.265 NVENC', desc: 'Быстрый H.265 через NVENC. Карты Pascal и новее.' },
            { value: 'nvenc_av1',  label: 'AV1 NVENC',  desc: 'Аппаратный AV1. Только RTX 40xx и новее.' },
        ],
    },
    {
        label: 'Intel (QSV)',
        encoders: [
            { value: 'qsv_h264', label: 'H.264 QSV', desc: 'Аппаратный H.264 через Intel Quick Sync. Быстро, умеренное качество.' },
            { value: 'qsv_h265', label: 'H.265 QSV', desc: 'Быстрый H.265 через QSV. Skylake и новее.' },
            { value: 'qsv_av1',  label: 'AV1 QSV',  desc: 'Аппаратный AV1 через QSV. Только Intel Arc.' },
        ],
    },
    {
        label: 'AMD (VCE)',
        encoders: [
            { value: 'vce_h264', label: 'H.264 VCE', desc: 'Аппаратный H.264 на видеокартах AMD. Быстро, совместимость везде.' },
            { value: 'vce_h265', label: 'H.265 VCE', desc: 'Быстрый H.265 на AMD. Карты RX 5xxx и новее.' },
            { value: 'vce_av1',  label: 'AV1 VCE',  desc: 'Аппаратный AV1 на AMD. Только RX 7xxx и новее.' },
        ],
    },
    {
        label: 'Windows (MediaFoundation)',
        encoders: [
            { value: 'mf_h264', label: 'H.264 MF', desc: 'H.264 через Windows Media API. Резервный вариант при отсутствии NVENC/QSV/VCE.' },
            { value: 'mf_h265', label: 'H.265 MF', desc: 'H.265 через Windows Media API. Совместимость зависит от драйверов.' },
        ],
    },
]

// ─── Encoder groups for conversion page (GPU-aware) ───────────────────────────
export function getConversionEncoderGroups(vendor, showAll) {
    const software   = ENCODER_GROUPS.find(g => g.label === 'Программные')
    const nvenc      = ENCODER_GROUPS.find(g => g.label === 'NVIDIA (NVENC)')
    const qsv        = ENCODER_GROUPS.find(g => g.label === 'Intel (QSV)')
    const vce        = ENCODER_GROUPS.find(g => g.label === 'AMD (VCE)')
    const mf         = ENCODER_GROUPS.find(g => g.label === 'Windows (MediaFoundation)')

    const gpuGroupMap = { nvidia: nvenc, intel: qsv, amd: vce }
    const gpuGroup = gpuGroupMap[vendor]

    const softwarePrimary = {
        label: 'Программные',
        encoders: [
            { value: 'x265',    label: 'H.265 / HEVC (x265)', desc: 'Вдвое эффективнее H.264. Лучший выбор для архива и 4K. Медленнее.' },
            { value: 'x264',    label: 'H.264 (x264)',         desc: 'Максимальная совместимость. Воспроизводится на любом устройстве.' },
            { value: 'svt_av1', label: 'AV1 (SVT-AV1)',       desc: 'Современный открытый кодек. Эффективнее H.265, но значительно медленнее.' },
        ],
    }

    if (!showAll) {
        if (gpuGroup) {
            const gpuLabel = {
                nvidia: 'NVIDIA NVENC (рекомендован)',
                intel:  'Intel QSV (рекомендован)',
                amd:    'AMD VCE (рекомендован)',
            }[vendor]
            return [
                { label: gpuLabel, encoders: gpuGroup.encoders },
                softwarePrimary,
            ]
        }
        return [softwarePrimary]
    }

    // showAll = true: GPU group first, then the rest
    if (gpuGroup) {
        const others = ENCODER_GROUPS.filter(g => g !== gpuGroup)
        return [gpuGroup, ...others]
    }
    return ENCODER_GROUPS
}

// ─── WebM codec compatibility ─────────────────────────────────────────────────
export const WEBM_COMPATIBLE_ENCODERS = new Set(['vp8', 'vp9', 'vp9_10bit', 'svt_av1', 'svt_av1_10bit', 'nvenc_av1', 'qsv_av1', 'vce_av1'])
export const WEBM_COMPATIBLE_AUDIO    = new Set(['vorbis', 'opus'])

// ─── Per-encoder disabled formats ─────────────────────────────────────────────────
export const ENCODER_DISABLED_FORMATS = {
    // VP8 / VP9 — несовместимы с MP4 и MOV
    vp8:        new Set(['av_mp4', 'av_mov']),
    vp9:        new Set(['av_mp4', 'av_mov']),
    vp9_10bit:  new Set(['av_mp4', 'av_mov']),
    // Theora — только MKV
    theora:     new Set(['av_mp4', 'av_mov', 'av_webm']),
}

// ─── Help texts ────────────────────────────────────────────────────────────────
const FORMAT_HELP = {
    av_mp4:  'MP4 — универсальный контейнер. Совместим с любыми устройствами, ТВ, смартфонами и браузерами. Лучший выбор для публикации.',
    av_mkv:  'MKV — гибкий контейнер без ограничений на количество дорожек. Идеален для архивирования, поддерживает любые кодеки.',
    av_webm: 'WebM — контейнер для веба. Поддерживает только VP8/VP9/AV1 и аудио Vorbis/Opus. При выборе WebM кодек автоматически скорректируется.',
    av_mov:  'MOV — контейнер Apple QuickTime. Хорошо совместим с macOS / iOS, поддерживает H.264, H.265 и большинство кодеков.',
}

const RESOLUTION_HELP = {
    source:  'Разрешение исходного видео сохраняется без изменений. Никакого масштабирования.',
    '4k':    '4K (2160p) — Ultra HD. Используется для архива и больших экранов. Сохраняет пропорции источника.',
    '1440p': '2K (1440p) — Quad HD. Оптимально для мониторов 2K и архива высокого качества.',
    '1080p': '1080p (Full HD) — стандарт для большинства экранов и видеоплатформ. Хороший баланс качества и размера.',
    '720p':  '720p (HD) — меньший файл при приемлемом качестве. Хорошо для мобильных устройств.',
    '480p':  '480p (SD) — минимальное разрешение. Самые маленькие файлы, заметная потеря деталей.',
}

const FPS_HELP = {
    source:   'Частота кадров сохраняется как в источнике. Рекомендуется для большинства случаев.',
    '60':     '60 fps — максимальная плавность для геймплея, экшна и спорта. Файл будет значительно крупнее.',
    '30':     '30 fps — стандарт для ТВ, YouTube и соцсетей. Хороший баланс плавности и размера.',
    '25':     '25 fps — европейский ТВ-стандарт (PAL). Для совместимости с PAL-устройствами.',
    '24':     '24 fps — кинематографический стандарт. Создаёт "киношный" облик видео.',
    '23.976': '23.976 fps — NTSC-кинематографический стандарт. Совместим с большинством медиаплееров.',
}

const QUALITY_HELP = {
    lossless: 'Lossless — RF 0, кодирование без потерь. Файл будет значительно больше исходника, так как хранит декодированный YUV без сжатия.',
    high:   'Высокое качество — визуально близко к оригиналу. Рекомендуется для архива и дальнейшего редактирования.',
    medium: 'Баланс качества и размера — минимально заметная потеря детализации при значительном уменьшении файла.',
    low:    'Низкое качество — заметные артефакты компрессии. Маленький файл для быстрой передачи.',
    potato: 'Максимальное сжатие — качество уровня VHS. Артефакты гарантированы. Только если файл нужен очень маленьким.',
    custom: 'RF (Rate Factor): чем ниже значение — тем лучше качество и больше размер файла. RF 0 ≈ lossless.',
}

const ENCODER_HELP = {
    x265:          'H.265/HEVC (libx265) — в 2× эффективнее H.264 при том же качестве. Рекомендован для 4K и архива.',
    x265_10bit:    'H.265 10-bit — лучше сохраняет HDR, плавные градиенты и контент с широким цветом.',
    x265_12bit:    'H.265 12-bit — для профессионального мастеринга. Избыточен для большинства задач.',
    x264:          'H.264 (libx264) — самый совместимый кодек. Воспроизводится на любом устройстве.',
    x264_10bit:    'H.264 10-bit — лучшее сохранение цвета при чуть меньшей совместимости.',
    svt_av1:       'AV1 (SVT-AV1) — современный открытый кодек. Эффективнее H.265, но медленнее в кодировании.',
    svt_av1_10bit: 'AV1 10-bit — AV1 с поддержкой широкого цвета и HDR.',
    vp9:           'VP9 (libvpx) — открытый кодек Google. Хорош для YouTube и HTML5 видео.',
    vp9_10bit:     'VP9 10-bit — VP9 с расширенным диапазоном цвета.',
    vp8:           'VP8 (libvpx) — устаревший кодек. Рекомендуется только в контейнере WebM.',
    theora:        'Theora — открытый кодек для контейнера OGG. Устарел, использовать не рекомендуется.',
    nvenc_h264:    'NVIDIA NVENC H.264 — аппаратное кодирование на GPU NVIDIA. Очень быстро, качество чуть ниже x264.',
    nvenc_h265:    'NVIDIA NVENC H.265 — быстрый аппаратный H.265 на картах NVIDIA Pascal и новее.',
    nvenc_av1:     'NVIDIA NVENC AV1 — аппаратный AV1 на картах RTX 40xx+.',
    qsv_h264:      'Intel QSV H.264 — аппаратное ускорение через Intel Graphics или Arc.',
    qsv_h265:      'Intel QSV H.265 — быстрый H.265 через Intel Quick Sync (Skylake+).',
    qsv_av1:       'Intel QSV AV1 — аппаратный AV1 на Intel Arc.',
    vce_h264:      'AMD VCE H.264 — аппаратное кодирование на видеокартах AMD.',
    vce_h265:      'AMD VCE H.265 — аппаратный H.265 на AMD RX 5xxx+.',
    vce_av1:       'AMD VCE AV1 — аппаратный AV1 на AMD RX 7xxx+.',
    mf_h264:       'MediaFoundation H.264 — аппаратное кодирование через Windows Media API.',
    mf_h265:       'MediaFoundation H.265 — H.265 через Windows Media API.',
}

// ─── Helper: resolution options ────────────────────────────────────────────────
function getResolutionOptions(videos) {
    const opts = [{ value: 'source', label: 'По исходному' }]

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

    const standard = [
        { value: '4k',    label: isPortrait ? '4K вертикально (2160p)' : '4K (2160p)',  short: 2160 },
        { value: '1440p', label: isPortrait ? '2K вертикально (1440p)' : '2K (1440p)',  short: 1440 },
        { value: '1080p', label: isPortrait ? '1080p вертикально'      : '1080p',       short: 1080 },
        { value: '720p',  label: isPortrait ? '720p вертикально'       : '720p',        short: 720  },
        { value: '480p',  label: isPortrait ? '480p вертикально'       : '480p',        short: 480  },
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
export function GsSelect({ value, onChange, options, groups, disabled, className, onSpecial, direction = 'up' }) {
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

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
                                {o.recommended && <span className="gs-dropdown-item-badge">рекомендован</span>}
                            </span>
                            {o.tags && o.tags.length > 0 && (
                                <span className="gs-dropdown-item-tags">
                                    {o.tags.map(t => (
                                        <span key={t.key} className={`gs-item-tag ${t.cls}`}>
                                            <i className={`bi ${t.icon}`}></i>{t.label}
                                        </span>
                                    ))}
                                </span>
                            )}
                            {o.desc && <span className="gs-dropdown-item-desc">{o.desc}</span>}
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
                                    {o.desc && <span className="gs-dropdown-item-desc">{o.desc}</span>}
                                </button>
                            ))}
                        </div>
                    ))}
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
    const [showCustomQuality, setShowCustomQuality] = useState(false)
    const [draftRF, setDraftRF] = useState(settings.customQuality)

    const rfTable = CODEC_RF[settings.encoder] || CODEC_RF.x265
    const speedPresets = ENCODER_PRESETS[settings.encoder] ?? []
    const resOptions = getResolutionOptions(videos)
    const encoderGroups = getConversionEncoderGroups(gpuVendor || 'unknown', !!settings.showAllCodecs)

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
        } else {
            const disabledFormats = ENCODER_DISABLED_FORMATS[settings.encoder]
            if (disabledFormats?.has(fmt)) {
                const speeds = ENCODER_PRESETS.x265
                patch.encoder = 'x265'
                patch.encoderSpeed = speeds?.find(s => s.value === 'slow')?.value
                    ?? speeds?.[Math.floor((speeds?.length ?? 0) / 2)]?.value ?? 'slow'
            }
            if (fmt === 'av_mp4' || fmt === 'av_mov') {
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
        { key: 'high',   label: 'Высокое', rf: rfTable.high },
        { key: 'medium', label: 'Среднее', rf: rfTable.medium },
        { key: 'low',    label: 'Низкое',  rf: rfTable.low },
        { key: 'potato', label: 'Шакал',   rf: rfTable.potato },
    ]

    const currentQualityRF = settings.quality === 'custom'
        ? settings.customQuality
        : rfTable[settings.quality]

    const currentFormatHelp  = FORMAT_HELP[settings.format] || 'Контейнер для выходного файла.'
    const currentResHelp     = RESOLUTION_HELP[settings.resolution] || 'Целевое разрешение выходного видео.'
    const currentFpsHelp     = FPS_HELP[settings.fps] || 'Частота кадров выходного видео.'
    const currentQualityHelp = settings.quality === 'custom' ? QUALITY_HELP.custom : (QUALITY_HELP[settings.quality] || QUALITY_HELP.custom)
    const currentEncHelp     = ENCODER_HELP[settings.encoder] || 'Видеокодек для кодирования.'

    return (
        <>
            <div className="global-settings">

                {/* ── Format ── */}
                <div className="gs-card gs-card--format">
                    <div className="gs-card-header">
                        <i className="bi bi-file-earmark-play gs-icon"></i>
                        <span className="gs-card-label">Формат</span>
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
                        ]}
                        onChange={handleFormatChange}
                        disabled={disabled}
                    />
                </div>


                {/* ── Resolution ── */}
                <div className="gs-card gs-card--resolution">
                    <div className="gs-card-header">
                        <i className="bi bi-aspect-ratio gs-icon"></i>
                        <span className="gs-card-label">Разрешение</span>
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
                            { value: 'source', label: 'По исходному' },
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
                        <span className="gs-card-label">Качество</span>
                        <Tooltip text={currentQualityHelp} />
                    </div>
                    <GsSelect
                        value={settings.quality}
                        options={[
                            { value: 'lossless', label: `Lossless (RF ${rfTable.min})` },
                            ...qualityPresets.map(p => ({ value: p.key, label: `${p.label} (RF ${p.rf})` })),
                            { value: 'custom', label: settings.quality === 'custom' ? `Своё (RF ${settings.customQuality})` : 'Своё...', special: true },
                        ]}
                        onChange={v => update('quality', v)}
                        onSpecial={() => openCustomQuality()}
                        disabled={disabled}
                    />
                </div>

                {/* ── Codec ── */}
                <div className="gs-card gs-card--codec">
                    <div className="gs-card-header">
                        <i className="bi bi-cpu gs-icon"></i>
                        <span className="gs-card-label">Кодек / Кодировщик</span>
                        <Tooltip text={currentEncHelp} />
                    </div>
                    <div className="gs-codec-row">
                        <GsSelect
                            value={settings.encoder}
                            groups={encoderGroups.map(g => ({ label: g.label, options: g.encoders.map(e => ({
                                value: e.value,
                                label: e.label,
                                desc: e.desc,
                                disabled: settings.format === 'av_webm' && !WEBM_COMPATIBLE_ENCODERS.has(e.value),
                            })) }))
                            }
                            onChange={handleEncoderChange}
                            disabled={disabled}
                            className="gs-dropdown--encoder"
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
                            Пользовательское качество
                        </div>
                        <p className="gs-qpopup-subtitle">
                            RF {rfTable.min} = максимальное качество &nbsp;·&nbsp; RF {rfTable.max} = минимальное качество
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
                            <span>Лучше</span>
                            <span>Хуже</span>
                        </div>
                        <div className="gs-qpopup-hint">
                            {QUALITY_HELP.custom}
                        </div>
                        <div className="gs-qpopup-actions">
                            <button className="gs-qpopup-cancel" onClick={() => setShowCustomQuality(false)}>
                                Отмена
                            </button>
                            <button className="gs-qpopup-confirm" onClick={confirmCustomQuality}>
                                Применить
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
}

// Size multipliers per speed preset relative to each encoder's baseline.
// Values > 1.0 = larger file; < 1.0 = smaller file than baseline.
const SPEED_MULT = {
    x264:       { ultrafast: 2.40, superfast: 1.80, veryfast: 1.40, faster: 1.20, fast: 1.10, medium: 1.05, slow: 1.00, slower: 0.93, veryslow: 0.87 },
    x265:       { ultrafast: 2.20, superfast: 1.70, veryfast: 1.35, faster: 1.18, fast: 1.08, medium: 1.04, slow: 1.00, slower: 0.94, veryslow: 0.88 },
    svt_av1:    { '12': 1.60, '11': 1.45, '10': 1.30, '9': 1.18, '8': 1.10, '7': 1.05, '6': 1.00, '5': 0.97, '4': 0.93, '3': 0.89, '2': 0.87, '1': 0.85, '0': 0.83 },
    nvenc_h264: { hp: 1.08, default: 1.03, bd: 1.03, hq: 1.00, ll: 1.15, llhq: 1.08, llhp: 1.18 },
    nvenc_h265: { hp: 1.08, default: 1.03, bd: 1.03, hq: 1.00, ll: 1.15, llhq: 1.08, llhp: 1.18 },
    nvenc_av1:  { hp: 1.08, default: 1.03, bd: 1.03, hq: 1.00, ll: 1.15, llhq: 1.08, llhp: 1.18 },
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
