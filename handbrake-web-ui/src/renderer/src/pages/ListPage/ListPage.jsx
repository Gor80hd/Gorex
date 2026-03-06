import { useState, useEffect } from 'react'
import './ListPage.scss'
import GlobalSettings, { GsSelect, estimateOutputSize, CODEC_RF, ENCODER_PRESETS, ENCODER_GROUPS, WEBM_COMPATIBLE_ENCODERS, WEBM_COMPATIBLE_AUDIO, ENCODER_DISABLED_FORMATS } from '../../components/GlobalSettings/GlobalSettings'

// ─── Transformation tags helper ────────────────────────────────────────────────
const ENCODER_SHORT = {
    x264: 'H.264', x264_10bit: 'H.264 10b',
    x265: 'H.265', x265_10bit: 'H.265 10b', x265_12bit: 'H.265 12b',
    svt_av1: 'AV1', svt_av1_10bit: 'AV1 10b',
    vp8: 'VP8', vp9: 'VP9', vp9_10bit: 'VP9 10b',
    nvenc_h264: 'H.264 NVENC', nvenc_h265: 'H.265 NVENC', nvenc_av1: 'AV1 NVENC',
    qsv_h264: 'H.264 QSV', qsv_h265: 'H.265 QSV', qsv_av1: 'AV1 QSV',
    vce_h264: 'H.264 VCE', vce_h265: 'H.265 VCE', vce_av1: 'AV1 VCE',
    mf_h264: 'H.264 MF', mf_h265: 'H.265 MF',
    theora: 'Theora',
}
const FORMAT_LABEL = { av_mp4: 'MP4', av_mkv: 'MKV', av_webm: 'WebM', av_mov: 'MOV' }
const RES_LABEL = { '4k': '4K', '1440p': '1440p', '1080p': '1080p', '720p': '720p', '480p': '480p' }

function getTransformTags(video, s) {
    const tags = []
    if (!s) return tags
    // Format
    if (s.format && FORMAT_LABEL[s.format]) tags.push({ key: 'fmt',   icon: 'bi-file-earmark-play', label: FORMAT_LABEL[s.format], cls: 'tr-fmt' })
    // Encoder
    if (s.encoder) tags.push({ key: 'enc',   icon: 'bi-cpu',              label: ENCODER_SHORT[s.encoder] || s.encoder, cls: 'tr-enc' })
    // Resolution
    if (s.resolution && s.resolution !== 'source') tags.push({ key: 'res',   icon: 'bi-aspect-ratio',     label: '→ ' + (RES_LABEL[s.resolution] || s.resolution), cls: 'tr-res' })
    // FPS
    if (s.fps && s.fps !== 'source') tags.push({ key: 'fps',   icon: 'bi-camera-video',     label: '→ ' + s.fps + ' fps', cls: 'tr-fps' })
    // Audio codec
    const audioShort = (s.audioCodec || 'av_aac').replace('av_', '').replace('fdk_', '').toUpperCase().replace('COPY:', '').replace('COPY', 'Passthru')
    tags.push({ key: 'aud',   icon: 'bi-music-note',        label: audioShort, cls: 'tr-aud' })
    // Filters
    if (s.grayscale)                       tags.push({ key: 'gray',  icon: 'bi-circle-half',      label: 'ЧБ',    cls: 'tr-filter' })
    if (s.rotate && s.rotate !== '0')      tags.push({ key: 'rot',   icon: 'bi-arrow-clockwise',  label: s.rotate === 'hflip' ? 'Отражение' : s.rotate + '°', cls: 'tr-filter' })
    if (s.deinterlace && s.deinterlace !== 'off') tags.push({ key: 'deint', icon: 'bi-layout-split',     label: 'Деинтерлейс', cls: 'tr-filter' })
    if (s.denoise && s.denoise !== 'off')  tags.push({ key: 'dn',    icon: 'bi-snow',             label: 'Шумодав', cls: 'tr-filter' })
    if (s.sharpen && s.sharpen !== 'off')  tags.push({ key: 'sh',    icon: 'bi-stars',            label: 'Резкость', cls: 'tr-filter' })
    if (s.deblock && s.deblock !== 'off')  tags.push({ key: 'db',    icon: 'bi-bounding-box',     label: 'Деблок', cls: 'tr-filter' })
    return tags
}

// ─── Audio codecs ──────────────────────────────────────────────────────────────
const AUDIO_CODECS = [
    { value: 'av_aac',      label: 'AAC (libavcodec)' },
    { value: 'fdk_aac',     label: 'AAC (FDK)' },
    { value: 'fdk_haac',    label: 'HE-AAC (FDK)' },
    { value: 'mp3',         label: 'MP3' },
    { value: 'ac3',         label: 'AC-3 (Dolby Digital)' },
    { value: 'eac3',        label: 'E-AC-3 (Dolby Plus)' },
    { value: 'vorbis',      label: 'Vorbis' },
    { value: 'flac16',      label: 'FLAC 16-bit' },
    { value: 'flac24',      label: 'FLAC 24-bit' },
    { value: 'opus',        label: 'Opus' },
    { value: 'copy',        label: 'Passthru (авто)' },
    { value: 'copy:aac',    label: 'AAC Passthru' },
    { value: 'copy:ac3',    label: 'AC3 Passthru' },
    { value: 'copy:eac3',   label: 'E-AC3 Passthru' },
    { value: 'copy:dts',    label: 'DTS Passthru' },
    { value: 'copy:dtshd',  label: 'DTS-HD Passthru' },
    { value: 'copy:mp3',    label: 'MP3 Passthru' },
    { value: 'copy:truehd', label: 'TrueHD Passthru' },
]

// ─── VSP helper UI components ──────────────────────────────────────────────────
function VspSectionHeader({ icon, title }) {
    return (
        <div className="vsp-section-header">
            <i className={`bi ${icon}`}></i>
            <span>{title}</span>
        </div>
    )
}

function VspRow({ label, hint, children }) {
    return (
        <div className="vsp-row">
            <div className="vsp-row-label">
                <span className="vsp-row-name">{label}</span>
                {hint && <span className="vsp-row-hint">{hint}</span>}
            </div>
            <div className="vsp-row-control">{children}</div>
        </div>
    )
}

function VspToggle({ value, onChange, disabled }) {
    return (
        <button
            className={`vsp-toggle ${value ? 'on' : 'off'}${disabled ? ' disabled' : ''}`}
            onClick={() => !disabled && onChange(!value)}
            type="button"
        >
            <div className="vsp-toggle-knob"></div>
        </button>
    )
}

// ─── Time formatting helper ────────────────────────────────────────────────────
function formatTime(sec) {
    const s = Math.max(0, Math.floor(sec))
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const ss = s % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
    return `${m}:${String(ss).padStart(2, '0')}`
}

// ─── Panel-scoped select (always opens downward) ───────────────────────────
const PanelSelect = (props) => <GsSelect direction="down" {...props} />

// ─── Video Settings Panel ──────────────────────────────────────────────────────
const VSP_TABS = [
    { id: 'video',   label: 'Видео',      icon: 'bi-camera-video' },
    { id: 'audio',   label: 'Аудио',      icon: 'bi-music-note-beamed' },
    { id: 'filters', label: 'Фильтры',    icon: 'bi-sliders' },
    { id: 'hdr',     label: 'HDR / Мета', icon: 'bi-stars' },
]

function VideoSettingsPanel({ video, globalSettings, onClose, onSave, onReset }) {
    const [draft, setDraft] = useState(video.customSettings || { ...globalSettings })
    const [activeTab, setActiveTab] = useState('video')

    const update = (key, val) => setDraft(prev => ({ ...prev, [key]: val }))

    const handleFormatChange = (fmt) => {
        const patch = { format: fmt }
        if (fmt === 'av_webm') {
            if (!WEBM_COMPATIBLE_ENCODERS.has(draft.encoder)) {
                const speeds = ENCODER_PRESETS.vp9
                patch.encoder = 'vp9'
                patch.encoderSpeed = speeds[Math.floor(speeds.length / 2)]?.value ?? 'good'
            }
            const audioCodec = draft.audioCodec || 'av_aac'
            if (!WEBM_COMPATIBLE_AUDIO.has(audioCodec) && !audioCodec.startsWith('copy')) {
                patch.audioCodec = 'opus'
            }
        }
        setDraft(prev => ({ ...prev, ...patch }))
    }

    const rfTable = CODEC_RF[draft.encoder] || CODEC_RF.x265
    const speedPresets = ENCODER_PRESETS[draft.encoder] ?? []
    const isPassthru = (draft.audioCodec || 'av_aac').startsWith('copy')
    const isHWEncoder = ['nvenc_', 'qsv_', 'vce_', 'mf_'].some(p => (draft.encoder || '').startsWith(p))
    const encoderGroups = ENCODER_GROUPS.map(g => ({
        label: g.label,
        options: g.encoders.map(e => ({ value: e.value, label: e.label, desc: e.desc }))
    }))

    const handleSave = () => { onSave(video.id, draft); onClose() }
    const handleReset = () => { onReset(video.id); onClose() }

    return (
        <div className="vsp-overlay" onClick={onClose}>
            <div className="vsp-panel" onClick={e => e.stopPropagation()}>

                {/* ── Header ── */}
                <div className="vsp-header">
                    <div className="vsp-header-info">
                        <img className="vsp-thumb" src={video.thumbnail} alt="" />
                        <div className="vsp-title-block">
                            <span className="vsp-title">{video.title}</span>
                            <span className="vsp-subtitle">Индивидуальные настройки конвертации</span>
                        </div>
                    </div>
                    <button className="vsp-close" onClick={onClose}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>

                {/* ── Body: sidebar + content ── */}
                <div className="vsp-body">
                    <div className="vsp-sidebar">
                        {VSP_TABS.map(tab => (
                            <button
                                key={tab.id}
                                className={`vsp-tab${activeTab === tab.id ? ' active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <i className={`bi ${tab.icon}`}></i>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="vsp-content">

                        {/* ═══ VIDEO ═══ */}
                        {activeTab === 'video' && (
                            <div className="vsp-section">
                                <VspSectionHeader icon="bi-file-earmark-play" title="Контейнер" />
                                <VspRow label="Формат" hint="Контейнер для выходного файла">
                                    <PanelSelect
                                        value={draft.format}
                                        options={(() => {
                                            const disabledSet = ENCODER_DISABLED_FORMATS[draft.encoder] || new Set()
                                            return [
                                                { value: 'av_mp4',  label: 'MP4',  disabled: disabledSet.has('av_mp4') },
                                                { value: 'av_mkv',  label: 'MKV' },
                                                { value: 'av_webm', label: 'WebM', disabled: disabledSet.has('av_webm') },
                                                { value: 'av_mov',  label: 'MOV',  disabled: disabledSet.has('av_mov') },
                                            ]
                                        })()}
                                        onChange={handleFormatChange}
                                    />
                                </VspRow>

                                <VspSectionHeader icon="bi-cpu" title="Кодировщик" />
                                <VspRow label="Видеокодек" hint="Алгоритм сжатия видео">
                                    <PanelSelect
                                        value={draft.encoder}
                                        groups={encoderGroups.map(g => ({
                                            ...g,
                                            options: g.options.map(e => ({
                                                ...e,
                                                disabled: draft.format === 'av_webm' && !WEBM_COMPATIBLE_ENCODERS.has(e.value),
                                            }))
                                        }))}
                                        onChange={v => {
                                            const speeds = ENCODER_PRESETS[v] ?? []
                                            const mid = speeds[Math.floor(speeds.length / 2)]?.value ?? 'medium'
                                            setDraft(prev => ({ ...prev, encoder: v, encoderSpeed: mid }))
                                        }}
                                    />
                                </VspRow>
                                {speedPresets.length > 0 && (
                                    <VspRow label="Скорость / пресет" hint="Соотношение скорость↔эффективность кодека">
                                        <PanelSelect
                                            value={draft.encoderSpeed}
                                            options={speedPresets}
                                            onChange={v => update('encoderSpeed', v)}
                                        />
                                    </VspRow>
                                )}

                                <VspSectionHeader icon="bi-sliders2" title="Качество" />
                                <VspRow label="Режим качества" hint="Предустановка или точное значение RF/CRF">
                                    <PanelSelect
                                        value={draft.quality}
                                        options={[
                                            { value: 'lossless', label: `Lossless (RF ${rfTable.min})` },
                                            { value: 'high',     label: `Высокое (RF ${rfTable.high})` },
                                            { value: 'medium',   label: `Среднее (RF ${rfTable.medium})` },
                                            { value: 'low',      label: `Низкое (RF ${rfTable.low})` },
                                            { value: 'potato',   label: `Максимальное сжатие (RF ${rfTable.potato})` },
                                            { value: 'custom',   label: draft.quality === 'custom' ? `Своё (RF ${draft.customQuality})` : 'Своё значение...' },
                                        ]}
                                        onChange={v => update('quality', v)}
                                    />
                                </VspRow>
                                {draft.quality === 'custom' && (
                                    <VspRow
                                        label={`RF / CRF: ${draft.customQuality}`}
                                        hint={`${rfTable.min} (лучше качество) — ${rfTable.max} (хуже)`}
                                    >
                                        <div className="vsp-slider-wrap">
                                            <span className="vsp-slider-edge">{rfTable.min}</span>
                                            <input
                                                type="range"
                                                className="vsp-slider"
                                                min={rfTable.min}
                                                max={rfTable.max}
                                                step={1}
                                                value={draft.customQuality}
                                                onChange={e => update('customQuality', Number(e.target.value))}
                                            />
                                            <span className="vsp-slider-edge">{rfTable.max}</span>
                                        </div>
                                    </VspRow>
                                )}

                                <VspSectionHeader icon="bi-aspect-ratio" title="Разрешение и частота кадров" />
                                <VspRow label="Разрешение" hint="Максимальное разрешение (масштабирование вниз)">
                                    <PanelSelect
                                        value={draft.resolution}
                                        options={[
                                            { value: 'source', label: 'По исходному' },
                                            { value: '4k',     label: '4K (2160p)' },
                                            { value: '1440p',  label: '2K (1440p)' },
                                            { value: '1080p',  label: '1080p (Full HD)' },
                                            { value: '720p',   label: '720p (HD)' },
                                            { value: '480p',   label: '480p (SD)' },
                                        ]}
                                        onChange={v => update('resolution', v)}
                                    />
                                </VspRow>
                                <VspRow label="Частота кадров" hint="Целевой FPS выходного видео">
                                    <PanelSelect
                                        value={draft.fps}
                                        options={[
                                            { value: 'source', label: 'По исходному' },
                                            { value: '60',     label: '60 fps' },
                                            { value: '30',     label: '30 fps' },
                                            { value: '25',     label: '25 fps (PAL)' },
                                            { value: '24',     label: '24 fps (кино)' },
                                            { value: '23.976', label: '23.976 fps (NTSC)' },
                                        ]}
                                        onChange={v => update('fps', v)}
                                    />
                                </VspRow>
                                <VspRow label="Режим FPS" hint="VFR = переменный, CFR = постоянный, PFR = с ограничением">
                                    <PanelSelect
                                        value={draft.fpsMode || 'vfr'}
                                        options={[
                                            { value: 'vfr', label: 'VFR — переменный (рекомендован)' },
                                            { value: 'cfr', label: 'CFR — постоянный' },
                                            { value: 'pfr', label: 'PFR — с пиковым ограничением' },
                                        ]}
                                        onChange={v => update('fpsMode', v)}
                                    />
                                </VspRow>

                                <VspSectionHeader icon="bi-lightning-charge" title="Аппаратное ускорение" />
                                {!isHWEncoder && (
                                    <VspRow label="Аппаратное декодирование" hint="NVDEC / QSV разгружает CPU при чтении источника">
                                        <PanelSelect
                                            value={draft.hwDecoding || 'none'}
                                            options={[
                                                { value: 'none',  label: 'Отключено (программное)' },
                                                { value: 'nvdec', label: 'NVDEC (NVIDIA)' },
                                                { value: 'qsv',   label: 'Quick Sync (Intel)' },
                                            ]}
                                            onChange={v => update('hwDecoding', v)}
                                        />
                                    </VspRow>
                                )}
                                <VspRow label="Двухпроходное кодирование" hint="2-pass: лучше распределяет битрейт, кодирует в 2× дольше">
                                    <VspToggle value={!!draft.multiPass} onChange={v => update('multiPass', v)} />
                                </VspRow>
                            </div>
                        )}

                        {/* ═══ AUDIO ═══ */}
                        {activeTab === 'audio' && (
                            <div className="vsp-section">
                                <VspSectionHeader icon="bi-music-note-beamed" title="Кодек аудио" />
                                <VspRow label="Аудиокодек" hint="Кодек для аудиодорожки выходного файла">
                                    <PanelSelect
                                        value={draft.audioCodec || 'av_aac'}
                                        options={AUDIO_CODECS.map(c => ({
                                            ...c,
                                            disabled: draft.format === 'av_webm' && !WEBM_COMPATIBLE_AUDIO.has(c.value) && !c.value.startsWith('copy'),
                                        }))}
                                        onChange={v => update('audioCodec', v)}
                                    />
                                </VspRow>

                                {!isPassthru && (
                                    <>
                                        <VspSectionHeader icon="bi-speaker" title="Параметры аудио" />
                                        <VspRow label="Битрейт" hint="Битрейт аудиодорожки в кбит/с">
                                            <PanelSelect
                                                value={draft.audioBitrate || '160'}
                                                options={[
                                                    { value: '64',  label: '64 kbps' },
                                                    { value: '96',  label: '96 kbps' },
                                                    { value: '128', label: '128 kbps' },
                                                    { value: '160', label: '160 kbps (по умолчанию)' },
                                                    { value: '192', label: '192 kbps' },
                                                    { value: '256', label: '256 kbps' },
                                                    { value: '320', label: '320 kbps' },
                                                ]}
                                                onChange={v => update('audioBitrate', v)}
                                            />
                                        </VspRow>
                                        <VspRow label="Микшинг" hint="Количество каналов в выходной аудиодорожке">
                                            <PanelSelect
                                                value={draft.audioMixdown || 'stereo'}
                                                options={[
                                                    { value: 'mono',    label: 'Моно (1.0)' },
                                                    { value: 'stereo',  label: 'Стерео (2.0)' },
                                                    { value: 'dpl2',    label: 'Dolby Pro Logic II' },
                                                    { value: '5point1', label: 'Surround 5.1' },
                                                    { value: '6point1', label: 'Surround 6.1' },
                                                    { value: '7point1', label: 'Surround 7.1' },
                                                ]}
                                                onChange={v => update('audioMixdown', v)}
                                            />
                                        </VspRow>
                                        <VspRow label="Частота дискретизации" hint="Sample rate аудио">
                                            <PanelSelect
                                                value={draft.audioSampleRate || 'auto'}
                                                options={[
                                                    { value: 'auto',  label: 'Авто (по исходному)' },
                                                    { value: '22.05', label: '22.05 kHz' },
                                                    { value: '32',    label: '32 kHz' },
                                                    { value: '44.1',  label: '44.1 kHz' },
                                                    { value: '48',    label: '48 kHz' },
                                                    { value: '96',    label: '96 kHz' },
                                                ]}
                                                onChange={v => update('audioSampleRate', v)}
                                            />
                                        </VspRow>
                                    </>
                                )}

                                <VspSectionHeader icon="bi-collection-play" title="Метаданные файла" />
                                <VspRow label="Метки глав (Chapter markers)" hint="Добавлять chapter markers в контейнер">
                                    <VspToggle value={draft.chapterMarkers !== false} onChange={v => update('chapterMarkers', v)} />
                                </VspRow>
                                <VspRow label="Оптимизировать MP4 (fast start)" hint="Moov-атом в начале файла — для HTTP стриминга. Только MP4.">
                                    <VspToggle
                                        value={!!draft.optimizeMP4}
                                        onChange={v => update('optimizeMP4', v)}
                                        disabled={draft.format !== 'av_mp4'}
                                    />
                                </VspRow>
                            </div>
                        )}

                        {/* ═══ FILTERS ═══ */}
                        {activeTab === 'filters' && (
                            <div className="vsp-section">
                                <VspSectionHeader icon="bi-intersect" title="Деинтерлейс" />
                                <VspRow label="Деинтерлейс" hint="Устраняет гребёнку от чересстрочной развёртки">
                                    <PanelSelect
                                        value={draft.deinterlace || 'off'}
                                        options={[
                                            { value: 'off',           label: 'Отключён' },
                                            { value: 'yadif_default', label: 'Yadif — стандартный' },
                                            { value: 'yadif_bob',     label: 'Yadif Bob (двойной FPS)' },
                                            { value: 'bwdif_default', label: 'BWDif — стандартный' },
                                            { value: 'bwdif_bob',     label: 'BWDif Bob (двойной FPS)' },
                                        ]}
                                        onChange={v => update('deinterlace', v)}
                                    />
                                </VspRow>

                                <VspSectionHeader icon="bi-snow2" title="Шумоподавление" />
                                <VspRow label="Денойз" hint="Убирает видеошум. Требует дополнительного времени.">
                                    <PanelSelect
                                        value={draft.denoise || 'off'}
                                        options={[
                                            { value: 'off',                label: 'Отключено' },
                                            { value: 'nlmeans_ultralight', label: 'NL-Means — минимальный' },
                                            { value: 'nlmeans_light',      label: 'NL-Means — лёгкий' },
                                            { value: 'nlmeans_medium',     label: 'NL-Means — средний' },
                                            { value: 'nlmeans_strong',     label: 'NL-Means — сильный' },
                                            { value: 'hqdn3d_light',       label: 'HQ 3D — лёгкий' },
                                            { value: 'hqdn3d_medium',      label: 'HQ 3D — средний' },
                                            { value: 'hqdn3d_strong',      label: 'HQ 3D — сильный' },
                                        ]}
                                        onChange={v => update('denoise', v)}
                                    />
                                </VspRow>

                                <VspSectionHeader icon="bi-grid-3x3" title="Деблокинг" />
                                <VspRow label="Деблокинг" hint="Убирает блочные артефакты от кодека источника">
                                    <PanelSelect
                                        value={draft.deblock || 'off'}
                                        options={[
                                            { value: 'off',        label: 'Отключён' },
                                            { value: 'ultralight', label: 'Минимальный' },
                                            { value: 'light',      label: 'Лёгкий' },
                                            { value: 'medium',     label: 'Средний' },
                                            { value: 'strong',     label: 'Сильный' },
                                            { value: 'stronger',   label: 'Максимальный' },
                                        ]}
                                        onChange={v => update('deblock', v)}
                                    />
                                </VspRow>

                                <VspSectionHeader icon="bi-zoom-in" title="Резкость" />
                                <VspRow label="Повышение резкости" hint="Unsharp Mask или Laplacian Sharpen">
                                    <PanelSelect
                                        value={draft.sharpen || 'off'}
                                        options={[
                                            { value: 'off',                 label: 'Отключено' },
                                            { value: 'unsharp_ultralight',  label: 'Unsharp — минимальный' },
                                            { value: 'unsharp_light',       label: 'Unsharp — лёгкий' },
                                            { value: 'unsharp_medium',      label: 'Unsharp — средний' },
                                            { value: 'unsharp_strong',      label: 'Unsharp — сильный' },
                                            { value: 'lapsharp_ultralight', label: 'Lapsharp — минимальный' },
                                            { value: 'lapsharp_light',      label: 'Lapsharp — лёгкий' },
                                            { value: 'lapsharp_medium',     label: 'Lapsharp — средний' },
                                            { value: 'lapsharp_strong',     label: 'Lapsharp — сильный' },
                                        ]}
                                        onChange={v => update('sharpen', v)}
                                    />
                                </VspRow>

                                <VspSectionHeader icon="bi-camera" title="Трансформация кадра" />
                                <VspRow label="Чёрно-белый режим" hint="Удаляет цветовую информацию (grayscale)">
                                    <VspToggle value={!!draft.grayscale} onChange={v => update('grayscale', v)} />
                                </VspRow>
                                <VspRow label="Поворот / отражение" hint="Повернуть или отразить кадр">
                                    <PanelSelect
                                        value={draft.rotate || '0'}
                                        options={[
                                            { value: '0',     label: 'Без поворота' },
                                            { value: '90',    label: '90° по часовой' },
                                            { value: '180',   label: '180°' },
                                            { value: '270',   label: '270° (90° против часовой)' },
                                            { value: 'hflip', label: 'Горизонтальное отражение' },
                                        ]}
                                        onChange={v => update('rotate', v)}
                                    />
                                </VspRow>
                            </div>
                        )}

                        {/* ═══ HDR / META ═══ */}
                        {activeTab === 'hdr' && (
                            <div className="vsp-section">
                                <VspSectionHeader icon="bi-brightness-high" title="HDR" />
                                <VspRow label="Динамические метаданные HDR" hint="Передать HDR10+ или Dolby Vision metadata в выходной файл">
                                    <PanelSelect
                                        value={draft.hdrMetadata || 'off'}
                                        options={[
                                            { value: 'off',         label: 'Отключено' },
                                            { value: 'hdr10plus',   label: 'HDR10+' },
                                            { value: 'dolbyvision', label: 'Dolby Vision' },
                                            { value: 'all',         label: 'Все (HDR10+ и Dolby Vision)' },
                                        ]}
                                        onChange={v => update('hdrMetadata', v)}
                                    />
                                </VspRow>

                                <VspSectionHeader icon="bi-tag" title="Метаданные файла" />
                                <VspRow label="Сохранять метаданные" hint="Копировать теги, описание, обложку из источника">
                                    <VspToggle value={!!draft.keepMetadata} onChange={v => update('keepMetadata', v)} />
                                </VspRow>
                                <VspRow label="Inline Parameter Sets" hint="SPS/PPS inline в каждом кадре — требуется для HLS-стриминга">
                                    <VspToggle value={!!draft.inlineParamSets} onChange={v => update('inlineParamSets', v)} />
                                </VspRow>
                            </div>
                        )}

                    </div>
                </div>

                {/* ── Footer ── */}
                <div className="vsp-footer">
                    {video.customSettings && (
                        <button className="vsp-reset-btn" onClick={handleReset}>
                            <i className="bi bi-arrow-counterclockwise"></i>
                            Сбросить (глобальные)
                        </button>
                    )}
                    <div className="vsp-footer-right">
                        <button className="vsp-cancel-btn" onClick={onClose}>Отмена</button>
                        <button className="vsp-save-btn" onClick={handleSave}>
                            <i className="bi bi-check2"></i>
                            Применить
                        </button>
                    </div>
                </div>

            </div>
        </div>
    )
}

function ListPage({
    videos, settings, isEncoding, theme,
    onSettingsChange, onStartEncoding, onStop,
    outputMode, customOutputDir, defaultOutputDir, onOutputModeChange,
    onAddFiles, onRemoveVideo, onClearQueue, onRenameOutput, onVideoSettingsChange,
    isDraggingOnList, onListDragEnter, onListDragLeave, onListDragOver, onListDrop,
    gpuVendor, encodingStartTime
}) {
    const [editingId, setEditingId] = useState(null)
    const [editingValue, setEditingValue] = useState('')
    const [editingVideoId, setEditingVideoId] = useState(null)
    const [tickNow, setTickNow] = useState(Date.now())

    useEffect(() => {
        if (!isEncoding) return
        const timer = setInterval(() => setTickNow(Date.now()), 1000)
        return () => clearInterval(timer)
    }, [isEncoding])

    const startEdit = (v) => {
        setEditingId(v.id)
        setEditingValue(v.outputName || v.title)
    }

    const commitEdit = (id) => {
        const trimmed = editingValue.trim()
        if (trimmed) onRenameOutput(id, trimmed)
        setEditingId(null)
    }

    const handleEditKeyDown = (e, id) => {
        if (e.key === 'Enter') commitEdit(id)
        if (e.key === 'Escape') setEditingId(null)
    }

    const customCount = videos.filter(v => v.customSettings).length
    const globalCount = videos.length - customCount

    const editingVideo = editingVideoId !== null ? videos.find(v => v.id === editingVideoId) : null

    return (
        <div className="video-list-container">
            <div className="video-list-header">
                <div className="video-list-topbar">
                    <button
                        className="add-button"
                        onClick={onAddFiles}
                        disabled={isEncoding}
                    >
                        <i className="bi bi-plus-lg"></i>
                        ДОБАВИТЬ
                    </button>
                    <button
                        className="add-button clear-button"
                        onClick={onClearQueue}
                        disabled={isEncoding}
                    >
                        <i className="bi bi-trash3"></i>
                        ОЧИСТИТЬ
                    </button>
                </div>
            </div>

            <div
                className={`video-list-drop-zone ${isDraggingOnList ? 'dragging' : ''}`}
                onDragEnter={onListDragEnter}
                onDragLeave={onListDragLeave}
                onDragOver={onListDragOver}
                onDrop={onListDrop}
            >
                <div className={`video-list-scroll ${isDraggingOnList ? 'blurred' : ''}`}>
                    {videos.map(v => (
                        <div
                            key={v.id}
                            className={`video-item ${v.status} ${theme}${v.customSettings ? ' has-custom-settings' : ''}`}
                            onClick={() => !isEncoding && v.status !== 'encoding' && setEditingVideoId(v.id)}
                            style={(!isEncoding && v.status !== 'encoding') ? { cursor: 'pointer' } : {}}
                        >
                            <div className="video-thumbnail">
                                <img src={v.thumbnail} alt="Thumbnail" />
                                {v.status === 'encoding' && (
                                    <div className="encoding-overlay">
                                        <div className="spinner"></div>
                                    </div>
                                )}
                            </div>
                            <div className="video-info">
                                <div className="video-title-row">
                                    <div className="video-title">{v.title}</div>
                                    {v.customSettings && (
                                        <span className="vtag custom-tag">
                                            <i className="bi bi-sliders2"></i>
                                            Инд.
                                        </span>
                                    )}
                                    {!isEncoding && v.status !== 'encoding' && (
                                        editingId === v.id
                                            ? <input
                                                className="output-name-input"
                                                value={editingValue}
                                                autoFocus
                                                onChange={e => setEditingValue(e.target.value)}
                                                onBlur={() => commitEdit(v.id)}
                                                onKeyDown={e => handleEditKeyDown(e, v.id)}
                                                onClick={e => e.stopPropagation()}
                                            />
                                            : <button
                                                className="rename-btn"
                                                onClick={e => { e.stopPropagation(); startEdit(v) }}
                                                title="Переименовать выходной файл"
                                            >
                                                <i className="bi bi-pencil"></i>
                                                <span>{v.outputName || v.title}</span>
                                            </button>
                                    )}
                                </div>
                                <div className="video-tags">
                                    {v.container && <span className="vtag fmt"><i className="bi bi-file-earmark-play"></i>{v.container}</span>}
                                    {v.resolution && <span className="vtag"><i className="bi bi-aspect-ratio"></i>{v.resolution}</span>}
                                    {v.videoCodec && <span className="vtag"><i className="bi bi-cpu"></i>{v.videoCodec}</span>}
                                    {v.fps && <span className="vtag"><i className="bi bi-camera-video"></i>{v.fps} fps</span>}
                                    {v.audioCodec && <span className="vtag audio"><i className="bi bi-music-note"></i>{v.audioCodec}</span>}
                                    {v.channels && <span className="vtag audio"><i className="bi bi-speaker"></i>{v.channels}</span>}
                                    {v.bitrate && <span className="vtag bitrate"><i className="bi bi-speedometer2"></i>{v.bitrate}</span>}
                                    {v.duration && <span className="vtag duration"><i className="bi bi-clock"></i>{v.duration}</span>}
                                </div>
                                {(() => {
                                    const effectiveSettings = v.customSettings || settings
                                    const transformTags = getTransformTags(v, effectiveSettings)
                                    if (!transformTags.length) return null
                                    return (
                                        <div className="video-transform-tags">
                                            <span className="vtag-arrow"><i className="bi bi-arrow-down-short"></i></span>
                                            {transformTags.map(t => (
                                                <span key={t.key} className={`vtag transform-tag ${t.cls}`}>
                                                    <i className={`bi ${t.icon}`}></i>{t.label}
                                                </span>
                                            ))}
                                        </div>
                                    )
                                })()}
                                <div className="video-progress">
                                    <div className="progress-bar-bg">
                                        <div
                                            className="progress-bar-fill"
                                            style={{ width: `${v.progress}%` }}
                                        ></div>
                                    </div>
                                    <span className="progress-text">{v.progress.toFixed(1)}%</span>
                                </div>
                                {v.status === 'encoding' && v.startTime && (
                                    <div className="video-time-info">
                                        <span className="vtime elapsed">
                                            <i className="bi bi-clock-history"></i>
                                            {formatTime((tickNow - v.startTime) / 1000)}
                                        </span>
                                        {v.progress > 0.5 && (
                                            <span className="vtime remaining">
                                                <i className="bi bi-hourglass-split"></i>
                                                ~{formatTime((tickNow - v.startTime) / 1000 * (100 - v.progress) / v.progress)}
                                            </span>
                                        )}
                                    </div>
                                )}
                                {v.status === 'done' && v.startTime && v.endTime && (
                                    <div className="video-time-info done">
                                        <span className="vtime done">
                                            <i className="bi bi-check2-circle"></i>
                                            {formatTime((v.endTime - v.startTime) / 1000)}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="video-size">
                                {v.status === 'done'
                                    ? <i className="bi bi-check-circle-fill success"></i>
                                    : (() => {
                                        const effectiveSettings = v.customSettings || settings
                                        const estimated = v.status !== 'encoding'
                                            ? estimateOutputSize(v, effectiveSettings)
                                            : null
                                        const hasEst = !!estimated
                                        return (
                                            <div className={`size-display${hasEst ? ' has-estimate' : ''}`}>
                                                <span className="sv-source">{v.size}</span>
                                                <div className="sv-row">
                                                    <i className="bi bi-arrow-right sv-arrow"></i>
                                                    <span className="sv-estimated">{estimated || ''}</span>
                                                </div>
                                            </div>
                                        )
                                    })()
                                }
                                {v.status !== 'encoding' && !isEncoding && (
                                    <button
                                        className="delete-video-btn"
                                        onClick={e => { e.stopPropagation(); onRemoveVideo(v.id) }}
                                    >
                                        <i className="bi bi-trash3"></i>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                {isDraggingOnList && (
                    <div className="list-drop-overlay">
                        <div className="list-drop-inner">
                            <i className="bi bi-plus-circle"></i>
                            <span>ДОБАВИТЬ В ОЧЕРЕДЬ</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="list-bottom-panel">
                <div className="list-bottom-header">
                    <span className="list-bottom-title">Глобальные настройки конвертации</span>
                </div>

                <GlobalSettings
                    settings={settings}
                    onChange={onSettingsChange}
                    videos={videos}
                    disabled={isEncoding}
                    gpuVendor={gpuVendor}
                />

                <div className="list-bottom-actions">
                    <div className="list-output-section">
                        <div className="list-output-top">
                            <span className="list-output-label">Папка для сохранения</span>
                            <GsSelect
                                value={outputMode}
                                options={[
                                    { value: 'default', label: 'По умолчанию' },
                                    { value: 'custom',  label: 'Своя папка' },
                                    { value: 'source',  label: 'Исходный путь' },
                                ]}
                                onChange={onOutputModeChange}
                                disabled={isEncoding}
                                className="list-output-mode-dropdown"
                            />
                        </div>
                        <div className="list-output-path-row">
                            <div className="list-output-path-display">
                                {outputMode === 'custom'
                                    ? (customOutputDir || '—')
                                    : outputMode === 'source'
                                        ? 'Исходный путь файла'
                                        : (defaultOutputDir || 'По умолчанию')}
                            </div>
                            <button
                                className="list-folder-btn"
                                onClick={() => onOutputModeChange('custom')}
                                disabled={isEncoding}
                                title="Выбрать папку"
                            >
                                <i className="bi bi-folder2-open"></i>
                            </button>
                        </div>
                    </div>

                    <button
                        className="start-button"
                        onClick={onStartEncoding}
                        disabled={isEncoding}
                        style={isEncoding ? { display: 'none' } : {}}
                    >
                        КОНВЕРТИРОВАТЬ
                        <i className="bi bi-arrow-right"></i>
                    </button>
                    {isEncoding && (
                        <button
                            className="stop-button"
                            onClick={onStop}
                        >
                            СТОП
                            <i className="bi bi-stop-fill"></i>
                        </button>
                    )}
                </div>

                <div className="list-bottom-status">
                    <span>
                        {globalCount > 0 && (
                            <><i className="bi bi-globe2"></i>&nbsp;<b>{globalCount}</b>&nbsp;{globalCount === 1 ? 'файл' : globalCount < 5 ? 'файла' : 'файлов'} по глобальным</>
                        )}
                        {globalCount > 0 && customCount > 0 && <>&nbsp;&nbsp;·&nbsp;&nbsp;</>}
                        {customCount > 0 && (
                            <><i className="bi bi-sliders2"></i>&nbsp;<b>{customCount}</b>&nbsp;{customCount === 1 ? 'файл' : customCount < 5 ? 'файла' : 'файлов'} по индивидуальным</>
                        )}
                        {videos.some(v => v.status === 'done') && (
                            <>&nbsp;&nbsp;·&nbsp;&nbsp;{videos.filter(v => v.status === 'done').length} готово</>
                        )}
                        {isEncoding && encodingStartTime && (() => {
                            const elapsed = (tickNow - encodingStartTime) / 1000
                            const encVideos = videos.filter(v => v.status === 'encoding' && v.startTime && v.progress > 0.5)
                            const eta = encVideos.length
                                ? encVideos.reduce((max, v) => {
                                    const ve = (tickNow - v.startTime) / 1000
                                    return Math.max(max, ve * (100 - v.progress) / v.progress)
                                }, 0)
                                : null
                            return (
                                <span className="global-time-info">
                                    &nbsp;&nbsp;·&nbsp;&nbsp;
                                    <i className="bi bi-clock-history"></i>&nbsp;{formatTime(elapsed)}
                                    {eta !== null && <>&nbsp;&nbsp;<i className="bi bi-hourglass-split"></i>&nbsp;~{formatTime(eta)}</>}
                                </span>
                            )
                        })()}
                    </span>
                    <span>{videos.length} {videos.length === 1 ? 'файл' : videos.length < 5 ? 'файла' : 'файлов'} в очереди</span>
                </div>
            </div>

            {editingVideo && (
                <VideoSettingsPanel
                    video={editingVideo}
                    globalSettings={settings}
                    onClose={() => setEditingVideoId(null)}
                    onSave={onVideoSettingsChange}
                    onReset={(id) => onVideoSettingsChange(id, null)}
                />
            )}
        </div>
    )
}

export default ListPage
