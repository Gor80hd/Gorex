import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../i18n'
import logoWhite from '../../assets/images/logo_white.svg'
import logoColor from '../../assets/images/logo.svg'

// ─── Settings labels ────────────────────────────────────────────────────────

const LABELS = {
    en: {
        next: 'Continue', back: 'Back', start: 'Get Started', skip: 'Skip',
        langTitle: 'Choose your language',
        langSub: 'You can change it later in Settings',
        appearTitle: 'Choose your look',
        appearSub: 'Pick a theme and accent color. You can change these later.',
        themeLabel: 'Theme', accentLabel: 'Accent color',
        themeDark: 'Dark', themeLight: 'Light', themeAuto: 'System',
        accentPurple: 'Purple', accentWhite: 'White / Black',
        gpuTitle: 'Your hardware',
        gpuFoundSub: '{name} — GPU encoding available',
        gpuNotFoundSub: 'No dedicated GPU detected',
        gpuDetectedLabel: 'Detected GPU',
        gpuNoneLabel: 'No dedicated GPU',
        gpuNoneHint: 'Software encoding will use your CPU',
        codecLabel: 'Default video codec',
        recommended: 'Recommended',
        storageTitle: 'Output & behavior',
        storageSub: 'Where to save converted files and how the app behaves when closed.',
        outputLabel: 'Output folder',
        outputDefault: '…',
        outputDefaultTag: 'default',
        browse: 'Browse',
        trayLabel: 'Background mode',
        trayHint: 'Stay in tray when the window is closed',
    },
    ru: {
        next: 'Продолжить', back: 'Назад', start: 'Начать работу', skip: 'Пропустить',
        langTitle: 'Выберите язык',
        langSub: 'Можно изменить позже в Настройках',
        appearTitle: 'Оформление',
        appearSub: 'Выберите тему и акцентный цвет. Можно изменить позже.',
        themeLabel: 'Тема', accentLabel: 'Акцентный цвет',
        themeDark: 'Тёмная', themeLight: 'Светлая', themeAuto: 'Системная',
        accentPurple: 'Фиолетовый', accentWhite: 'Белый / Чёрный',
        gpuTitle: 'Ваше железо',
        gpuFoundSub: '{name} — доступно GPU-кодирование',
        gpuNotFoundSub: 'Выделенная GPU не обнаружена',
        gpuDetectedLabel: 'Обнаружена GPU',
        gpuNoneLabel: 'GPU не найдена',
        gpuNoneHint: 'Кодирование будет выполняться на CPU',
        codecLabel: 'Видеокодек по умолчанию',
        recommended: 'Рекомендован',
        storageTitle: 'Вывод и поведение',
        storageSub: 'Куда сохранять файлы и что делать при закрытии окна.',
        outputLabel: 'Папка вывода',
        outputDefault: '…',
        outputDefaultTag: 'по умолчанию',
        browse: 'Обзор',
        trayLabel: 'Фоновый режим',
        trayHint: 'Сворачивать в трей при закрытии окна',
    },
}

const GPU_META = {
    nvidia: { label: 'NVIDIA', color: '#76b900' },
    amd:    { label: 'AMD',    color: '#ed1c24' },
    intel:  { label: 'Intel',  color: '#0071c5' },
}

const CODEC_OPTIONS = {
    nvidia: [
        { value: 'nvenc_h265', label: 'H.265 NVENC', desc: { en: 'GPU-accelerated H.265. 10–20× faster than software encoding.', ru: 'H.265 на GPU NVIDIA. В 10–20× быстрее программного кодирования.' }, recommended: true },
        { value: 'nvenc_h264', label: 'H.264 NVENC', desc: { en: 'GPU-accelerated H.264. Maximum device compatibility.', ru: 'H.264 на GPU NVIDIA. Максимальная совместимость с устройствами.' } },
        { value: 'x265',       label: 'H.265 (x265)', desc: { en: 'Software H.265. Better compression quality, significantly slower.', ru: 'Программный H.265. Лучше сжатие, значительно медленнее.' } },
    ],
    amd: [
        { value: 'vce_h265', label: 'H.265 VCE', desc: { en: 'GPU-accelerated H.265 on AMD. Fast hardware encoding.', ru: 'H.265 на GPU AMD. Быстрое аппаратное кодирование.' }, recommended: true },
        { value: 'vce_h264', label: 'H.264 VCE', desc: { en: 'GPU-accelerated H.264 on AMD. Maximum device compatibility.', ru: 'H.264 на GPU AMD. Максимальная совместимость с устройствами.' } },
        { value: 'x265',     label: 'H.265 (x265)', desc: { en: 'Software H.265. Better compression quality, significantly slower.', ru: 'Программный H.265. Лучше сжатие, значительно медленнее.' } },
    ],
    intel: [
        { value: 'qsv_h265', label: 'H.265 QSV', desc: { en: 'GPU-accelerated H.265 on Intel. Fast and efficient.', ru: 'H.265 на GPU Intel. Быстро и эффективно.' }, recommended: true },
        { value: 'qsv_h264', label: 'H.264 QSV', desc: { en: 'GPU-accelerated H.264 on Intel. Maximum device compatibility.', ru: 'H.264 на GPU Intel. Максимальная совместимость с устройствами.' } },
        { value: 'x265',     label: 'H.265 (x265)', desc: { en: 'Software H.265. Better compression quality, significantly slower.', ru: 'Программный H.265. Лучше сжатие, значительно медленнее.' } },
    ],
    unknown: [
        { value: 'x265',    label: 'H.265 (x265)',   desc: { en: 'Best quality/size ratio. Recommended for archiving and 4K.', ru: 'Лучшее соотношение качества и размера. Идеален для архива и 4K.' }, recommended: true },
        { value: 'x264',    label: 'H.264 (x264)',   desc: { en: 'Universal codec. Plays on virtually any device.', ru: 'Универсальный кодек. Воспроизводится на любом устройстве.' } },
        { value: 'svt_av1', label: 'AV1 (SVT-AV1)', desc: { en: 'Modern open codec. More efficient than H.265 but much slower.', ru: 'Современный кодек. Эффективнее H.265, но значительно медленнее.' } },
    ],
}

// ─── Feature slides (steps 2–6) ─────────────────────────────────────────────

const SLIDES = {
    en: [
        {
            icon: 'bi-palette2',
            accent: '#7c3aed',
            title: 'Made for people',
            sub: 'Gorex adapts to you — not the other way around.',
            points: [
                { icon: 'bi-sliders2',     text: 'Fully customizable — theme, accent color, language, behavior' },
                { icon: 'bi-people',       text: 'Intuitive for everyone — no manual, works as you expect' },
                { icon: 'bi-speedometer2', text: 'Fast and responsive — every action feels instant' },
                { icon: 'bi-heart',        text: 'Built with care — every detail is thought through' },
            ],
        },
        {
            icon: 'bi-lightning-charge-fill',
            accent: '#f59e0b',
            title: 'Fast. Very fast.',
            sub: 'Gorex gets out of the way and lets your hardware do the work.',
            points: [
                { icon: 'bi-cpu',            text: 'Low-level libraries under the hood — the fastest encoding tools that exist' },
                { icon: 'bi-gpu-card',       text: 'Direct hardware access — GPU encoding via NVENC, QSV and AMF' },
                { icon: 'bi-sliders',        text: 'You choose the speed — pick a preset from fastest to best quality' },
            ],
        },
        {
            icon: 'bi-boxes',
            accent: '#10b981',
            title: 'One tool for everything',
            sub: 'Convert local files or grab video straight from the web.',
            points: [
                { icon: 'bi-cloud-arrow-down', text: 'Download from almost any site — paste a link and it just works' },
                { icon: 'bi-arrow-left-right',  text: 'Convert to any format and codec right after download — in one step' },
                { icon: 'bi-sliders2',          text: 'Want to go deeper — all the pro settings are right here' },
            ],
        },
        {
            icon: 'bi-skip-forward-fill',
            accent: '#8b5cf6',
            title: 'Smart download features',
            sub: 'More than just saving a file — Gorex does the post-processing for you.',
            points: [
                { icon: 'bi-skip-forward-fill', text: 'SponsorBlock — sponsor segments skipped automatically' },
                { icon: 'bi-lightning-charge',  text: 'Re-encode right after download — one queue, no extra steps' },
                { icon: 'bi-scissors',          text: 'Cut chapters and timecodes — keep only the parts you need' },
                { icon: 'bi-music-note-beamed', text: 'Extract audio to MP3, AAC, FLAC or WAV in one click' },
            ],
        },
        {
            icon: 'bi-stars',
            accent: '#06b6d4',
            title: 'Why people love it',
            sub: 'Fast, free, and genuinely easy to use.',
            points: [
                { icon: 'bi-hand-thumbs-up', text: 'Clean interface — open a file and you\'re already there' },
                { icon: 'bi-emoji-smile',    text: 'Free forever — no subscriptions, no limits, no ads' },
                { icon: 'bi-toggles',        text: 'Sensible defaults — works great out of the box' },
                { icon: 'bi-shield-lock',    text: '100% offline — nothing ever leaves your machine' },
            ],
        },
    ],
    ru: [
        {
            icon: 'bi-palette2',
            accent: '#7c3aed',
            title: 'Создан для людей',
            sub: 'Gorex подстраивается под тебя, а не наоборот.',
            points: [
                { icon: 'bi-sliders2',     text: 'Полная кастомизация — тема, акцент, язык, поведение' },
                { icon: 'bi-people',       text: 'Понятный для всех — без мануала, работает как ожидаешь' },
                { icon: 'bi-speedometer2', text: 'Быстрый и отзывчивый — каждое действие моментально' },
                { icon: 'bi-heart',        text: 'Сделан с душой — каждая деталь продумана' },
            ],
        },
        {
            icon: 'bi-lightning-charge-fill',
            accent: '#f59e0b',
            title: 'Быстро. Очень быстро.',
            sub: 'Gorex уходит в сторону и даёт железу делать своё дело.',
            points: [
                { icon: 'bi-cpu',       text: 'Низкоуровневые библиотеки под капотом — самые быстрые инструменты кодирования из существующих' },
                { icon: 'bi-gpu-card',  text: 'Прямая работа с железом — GPU-кодирование через NVENC, QSV и AMF' },
                { icon: 'bi-sliders',   text: 'Скорость выбираешь ты — от максимальной скорости до лучшего качества' },
            ],
        },
        {
            icon: 'bi-boxes',
            accent: '#10b981',
            title: 'Один инструмент для всего',
            sub: 'Конвертируй локальные файлы или забирай видео прямо из сети.',
            points: [
                { icon: 'bi-cloud-arrow-down', text: 'Скачать можно почти с любого сайта — вставь ссылку и всё' },
                { icon: 'bi-arrow-left-right',  text: 'Сразу же конвертируй в нужный формат и кодек — одним шагом' },
                { icon: 'bi-sliders2',          text: 'Хочешь глубже — все настройки для профи тут' },
            ],
        },
        {
            icon: 'bi-skip-forward-fill',
            accent: '#8b5cf6',
            title: 'Умная загрузка видео',
            sub: 'Не просто скачать — Gorex сам сделает всё остальное.',
            points: [
                { icon: 'bi-skip-forward-fill', text: 'SponsorBlock — рекламные вставки пропускаются сами' },
                { icon: 'bi-lightning-charge',  text: 'Перекодирование сразу после загрузки — всё в одной очереди' },
                { icon: 'bi-scissors',          text: 'Вырезка глав и таймкодов — оставляй только нужное' },
                { icon: 'bi-music-note-beamed', text: 'Извлечение аудио в MP3, AAC, FLAC или WAV за один клик' },
            ],
        },
        {
            icon: 'bi-stars',
            accent: '#06b6d4',
            title: 'Почему его выбирают',
            sub: 'Быстро, бесплатно и по-настоящему просто.',
            points: [
                { icon: 'bi-hand-thumbs-up', text: 'Удобный интерфейс — открыл файл и сразу в деле' },
                { icon: 'bi-emoji-smile',    text: 'Бесплатно навсегда — без подписок, ограничений и рекламы' },
                { icon: 'bi-toggles',        text: 'Простота из коробки — умные настройки по умолчанию' },
                { icon: 'bi-shield-lock',    text: '100% офлайн — данные никуда не отправляются' },
            ],
        },
    ],
}

const SLIDE_STEPS = 5     // steps 2–6
const APPEAR_STEP = 7
const GPU_STEP = 8
const STORAGE_STEP = 9
const TOTAL = 9
const AUTO_MS = 15000
const TITLE_SPEED = 32   // ms per character

// ─── Animated text helpers ───────────────────────────────────────────────────

function TypewriterTitle({ text }) {
    const [shown, setShown] = useState('')
    const [done, setDone] = useState(false)
    useEffect(() => {
        setShown('')
        setDone(false)
        let i = 0
        const id = setInterval(() => {
            i++
            setShown(text.slice(0, i))
            if (i >= text.length) { setDone(true); clearInterval(id) }
        }, TITLE_SPEED)
        return () => clearInterval(id)
    }, [text])
    return (
        <h2 className="onboarding-title">
            {shown}{!done && <span className="ob-caret" aria-hidden="true" />}
        </h2>
    )
}

function AnimatedSub({ text, delay }) {
    return (
        <p className="onboarding-sub">
            {text.split(' ').map((word, i) => (
                <span key={i} className="ob-word" style={{ animationDelay: `${delay + i * 65}ms` }}>
                    {word}{' '}
                </span>
            ))}
        </p>
    )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function OnboardingScreen({ theme, themeMode, accentTheme, onThemeModeChange, onAccentThemeChange, onDone }) {
    const { setLang } = useLanguage()
    const [step, setStep] = useState(1)
    const [selectedLang, setSelectedLang] = useState('en')
    const [animKey, setAnimKey] = useState(0)
    const [dir, setDir] = useState(1)

    const [gpuInfo, setGpuInfo] = useState(null)
    const [gpuLoading, setGpuLoading] = useState(true)
    const [selectedEncoder, setSelectedEncoder] = useState(null)

    const [outputDir, setOutputDir] = useState('')
    const [defaultDirPath, setDefaultDirPath] = useState('')
    const [backgroundMode, setBackgroundMode] = useState(true)

    const handleNextRef = useRef(null)

    useEffect(() => {
        window.api.getGpuInfo().then(info => {
            setGpuInfo(info)
            const vendor = info?.vendor || 'unknown'
            const opts = CODEC_OPTIONS[vendor] || CODEC_OPTIONS.unknown
            const rec = opts.find(o => o.recommended) || opts[0]
            setSelectedEncoder(rec?.value || null)
        }).catch(() => {
            setGpuInfo({ vendor: 'unknown', gpus: [] })
            setSelectedEncoder(CODEC_OPTIONS.unknown[0].value)
        }).finally(() => setGpuLoading(false))

        window.api.getDefaultOutputDir().then(dir => setDefaultDirPath(dir || '')).catch(() => {})
    }, [])

    const L = LABELS[selectedLang]
    const slides = SLIDES[selectedLang]
    const isSlide = step >= 2 && step <= 1 + SLIDE_STEPS
    const slideIndex = isSlide ? step - 2 : 0
    const vendor = gpuInfo?.vendor || 'unknown'
    const codecOpts = CODEC_OPTIONS[vendor] || CODEC_OPTIONS.unknown
    const gpuName = gpuInfo?.gpus?.[0]?.name || GPU_META[vendor]?.label || null
    const slide = isSlide ? slides[slideIndex] : null

    const go = (nextStep) => {
        setDir(nextStep > step ? 1 : -1)
        setAnimKey(k => k + 1)
        setStep(nextStep)
    }

    const handleNext = () => {
        if (step === 1) setLang(selectedLang)
        if (step < TOTAL) go(step + 1)
        else onDone({ outputDir, backgroundMode, encoder: selectedEncoder })
    }

    handleNextRef.current = handleNext

    const handleBack = () => { if (step > 1) go(step - 1) }

    useEffect(() => {
        if (!isSlide) return
        const id = setTimeout(() => handleNextRef.current(), AUTO_MS)
        return () => clearTimeout(id)
    }, [step])

    const handleBrowse = async () => {
        const dir = await window.api.selectFolder()
        if (dir) setOutputDir(dir)
    }

    const gpuFoundSub = gpuName
        ? L.gpuFoundSub.replace('{name}', gpuName)
        : L.gpuNotFoundSub

    // subtitle delay starts after title finishes typing
    const subDelay = slide ? slide.title.length * TITLE_SPEED + 100 : 0

    return (
        <div className={`onboarding-overlay ${theme}`}>
            <div className="onboarding-card">
                <div className="onboarding-logo">
                    <img src={theme === 'dark' ? logoWhite : logoColor} alt="Gorex" />
                </div>

                <div
                    className={`onboarding-step ob-dir-${dir > 0 ? 'fwd' : 'bwd'}`}
                    key={animKey}
                >
                    {/* Step 1 — Language */}
                    {step === 1 && (
                        <>
                            <h2 className="onboarding-title">{L.langTitle}</h2>
                            <p className="onboarding-sub">{L.langSub}</p>
                            <div className="onboarding-lang-grid">
                                <button
                                    className={`onboarding-lang-card${selectedLang === 'en' ? ' selected' : ''}`}
                                    onClick={() => setSelectedLang('en')}
                                >
                                    <span className="onboarding-lang-flag">EN</span>
                                    <span className="onboarding-lang-name">English</span>
                                    {selectedLang === 'en' && <span className="onboarding-lang-check"><i className="bi bi-check2" /></span>}
                                </button>
                                <button
                                    className={`onboarding-lang-card${selectedLang === 'ru' ? ' selected' : ''}`}
                                    onClick={() => setSelectedLang('ru')}
                                >
                                    <span className="onboarding-lang-flag">RU</span>
                                    <span className="onboarding-lang-name">Русский</span>
                                    {selectedLang === 'ru' && <span className="onboarding-lang-check"><i className="bi bi-check2" /></span>}
                                </button>
                            </div>
                        </>
                    )}

                    {/* Steps 2–6 — Feature slides */}
                    {isSlide && slide && (
                        <>
                            <div className="ob-slide-icon" style={{ '--ob-accent': slide.accent }}>
                                <i className={`bi ${slide.icon}`} />
                            </div>
                            <TypewriterTitle key={animKey} text={slide.title} />
                            <AnimatedSub key={`sub-${animKey}`} text={slide.sub} delay={subDelay} />
                            <ul className="ob-points">
                                {slide.points.map((p, i) => (
                                    <li key={i} className="ob-point" style={{ animationDelay: `${subDelay + 200 + i * 90}ms` }}>
                                        <span className="ob-point-icon" style={{ '--ob-accent': slide.accent }}>
                                            <i className={`bi ${p.icon}`} />
                                        </span>
                                        <span className="ob-point-text">{p.text}</span>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}

                    {/* Step 7 — Appearance */}
                    {step === APPEAR_STEP && (
                        <>
                            <h2 className="onboarding-title">{L.appearTitle}</h2>
                            <p className="onboarding-sub">{L.appearSub}</p>
                            <div className="ob-setup-section">
                                <span className="ob-setup-label">{L.themeLabel}</span>
                                <div className="ob-theme-grid">
                                    {[
                                        { v: 'dark',  icon: 'bi-moon-fill',   label: L.themeDark },
                                        { v: 'light', icon: 'bi-sun-fill',    label: L.themeLight },
                                        { v: 'auto',  icon: 'bi-circle-half', label: L.themeAuto },
                                    ].map(({ v, icon, label }) => (
                                        <button key={v} className={`ob-theme-card${themeMode === v ? ' selected' : ''}`} onClick={() => onThemeModeChange(v)}>
                                            <i className={`bi ${icon}`} />
                                            <span>{label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="ob-setup-section">
                                <span className="ob-setup-label">{L.accentLabel}</span>
                                <div className="ob-accent-grid">
                                    <button className={`ob-accent-card${accentTheme === 'purple' ? ' selected' : ''}`} onClick={() => onAccentThemeChange('purple')}>
                                        <span className="ob-accent-dot" style={{ background: '#7c3aed' }} />
                                        <span>{L.accentPurple}</span>
                                        {accentTheme === 'purple' && <span className="onboarding-lang-check"><i className="bi bi-check2" /></span>}
                                    </button>
                                    <button className={`ob-accent-card${accentTheme === 'white' ? ' selected' : ''}`} onClick={() => onAccentThemeChange('white')}>
                                        <span className="ob-accent-dot ob-accent-dot-bw" />
                                        <span>{L.accentWhite}</span>
                                        {accentTheme === 'white' && <span className="onboarding-lang-check"><i className="bi bi-check2" /></span>}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Step 8 — GPU & Codec */}
                    {step === GPU_STEP && (
                        <>
                            <h2 className="onboarding-title">{L.gpuTitle}</h2>
                            {gpuLoading
                                ? <p className="onboarding-sub ob-loading-dots">...</p>
                                : <p className="onboarding-sub">{vendor !== 'unknown' ? gpuFoundSub : L.gpuNotFoundSub}</p>
                            }
                            {!gpuLoading && (
                                <>
                                    {vendor !== 'unknown' ? (
                                        <div className="ob-gpu-card">
                                            <span className="ob-gpu-vendor-dot" style={{ background: GPU_META[vendor]?.color }} />
                                            <div className="ob-gpu-info">
                                                <span className="ob-gpu-detected-label">{L.gpuDetectedLabel}</span>
                                                <span className="ob-gpu-name">{gpuName}</span>
                                            </div>
                                            <i className="bi bi-check-circle-fill ob-gpu-check" />
                                        </div>
                                    ) : (
                                        <div className="ob-gpu-card ob-gpu-none">
                                            <i className="bi bi-cpu ob-gpu-none-icon" />
                                            <div className="ob-gpu-info">
                                                <span className="ob-gpu-detected-label">{L.gpuNoneLabel}</span>
                                                <span className="ob-gpu-name ob-gpu-name-hint">{L.gpuNoneHint}</span>
                                            </div>
                                        </div>
                                    )}
                                    <div className="ob-setup-section">
                                        <span className="ob-setup-label">{L.codecLabel}</span>
                                        <div className="ob-codec-list">
                                            {codecOpts.map((opt, i) => (
                                                <button
                                                    key={opt.value}
                                                    className={`ob-codec-item${selectedEncoder === opt.value ? ' selected' : ''}`}
                                                    style={{ animationDelay: `${i * 60}ms` }}
                                                    onClick={() => setSelectedEncoder(opt.value)}
                                                >
                                                    <div className="ob-codec-top">
                                                        <span className="ob-codec-name">{opt.label}</span>
                                                        {opt.recommended && <span className="ob-codec-badge">{L.recommended}</span>}
                                                    </div>
                                                    <span className="ob-codec-desc">{opt.desc[selectedLang] || opt.desc.en}</span>
                                                    {selectedEncoder === opt.value && <span className="ob-codec-check"><i className="bi bi-check2" /></span>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {/* Step 9 — Storage & Behavior */}
                    {step === STORAGE_STEP && (
                        <>
                            <h2 className="onboarding-title">{L.storageTitle}</h2>
                            <p className="onboarding-sub">{L.storageSub}</p>
                            <div className="ob-setup-section">
                                <span className="ob-setup-label">{L.outputLabel}</span>
                                <div className="ob-dir-row">
                                    <i className="bi bi-folder2 ob-dir-icon" />
                                    <span className="ob-dir-path">{outputDir || defaultDirPath || L.outputDefault}</span>
                                    {!outputDir && <span className="ob-dir-default-tag">{L.outputDefaultTag}</span>}
                                    <button className="ob-dir-btn" onClick={handleBrowse}>
                                        <i className="bi bi-folder2-open" />
                                        {L.browse}
                                    </button>
                                    {outputDir && (
                                        <button className="ob-dir-clear" onClick={() => setOutputDir('')} title="Reset">
                                            <i className="bi bi-x" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="ob-setup-section">
                                <span className="ob-setup-label">{L.trayLabel}</span>
                                <div className="ob-toggle-row" onClick={() => setBackgroundMode(v => !v)}>
                                    <span className="ob-toggle-hint">{L.trayHint}</span>
                                    <button
                                        className={`ob-toggle${backgroundMode ? ' on' : ''}`}
                                        onClick={e => { e.stopPropagation(); setBackgroundMode(v => !v) }}
                                    >
                                        <span className="ob-toggle-knob" />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="onboarding-footer">
                    {step > 1 ? (
                        <button className="onboarding-btn-ghost" onClick={handleBack}>
                            <i className="bi bi-arrow-left" />
                            {L.back}
                        </button>
                    ) : (
                        <button className="onboarding-btn-ghost" onClick={() => onDone(null)}>
                            {L.skip}
                        </button>
                    )}

                    <div className="ob-footer-center">
                        <div className="onboarding-steps">
                            {Array.from({ length: TOTAL }).map((_, i) => {
                                const isActive = step === i + 1
                                const isDone = step > i + 1
                                return (
                                    <span key={i} className={`onboarding-dot${isActive ? ' active' : isDone ? ' done' : ''}`}>
                                        {isActive && isSlide && (
                                            <span key={animKey} className="ob-dot-fill" />
                                        )}
                                    </span>
                                )
                            })}
                        </div>
                    </div>

                    <button className="onboarding-btn-primary" onClick={handleNext}>
                        {step === TOTAL ? L.start : L.next}
                        <i className={`bi ${step === TOTAL ? 'bi-check2' : 'bi-arrow-right'}`} />
                    </button>
                </div>
            </div>
        </div>
    )
}
