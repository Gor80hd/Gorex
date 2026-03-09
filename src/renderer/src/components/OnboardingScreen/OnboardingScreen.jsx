import { useState } from 'react'
import { useLanguage } from '../../i18n'
import logoWhite from '../../assets/images/logo_white.svg'
import logoColor from '../../assets/images/logo.svg'

const SLIDES = {
    en: [
        {
            icon: 'bi-palette2',
            accent: '#7c3aed',
            title: 'Design that respects you',
            sub: 'Most video tools look like they were made in 2005. Gorex is different.',
            points: [
                { icon: 'bi-moon-stars', text: 'Dark and light themes, clean and spacious layout' },
                { icon: 'bi-stars', text: 'Smooth animations and transitions — every interaction feels polished' },
                { icon: 'bi-grid-1x2', text: 'Every element has its place — nothing is in the way' },
            ],
        },
        {
            icon: 'bi-hand-index-thumb',
            accent: '#0ea5e9',
            title: 'Works the way you think',
            sub: 'No manuals, no guessing. Open, drop, run.',
            points: [
                { icon: 'bi-file-earmark-arrow-down', text: 'Drag & drop files — they\'re ready in seconds' },
                { icon: 'bi-sliders', text: 'Sensible defaults — tweak only what you need' },
                { icon: 'bi-check2-circle', text: 'Each file in the queue can have its own settings' },
            ],
        },
        {
            icon: 'bi-lightning-charge-fill',
            accent: '#f59e0b',
            title: 'Fast. Very fast.',
            sub: 'Gorex gets out of the way and lets your hardware do the work.',
            points: [
                { icon: 'bi-gpu-card', text: 'GPU encoding — NVENC, QSV, AMF detected automatically' },
                { icon: 'bi-stack', text: 'Full queue processing — all files, one click' },
                { icon: 'bi-bar-chart-line', text: 'Real-time progress per file, no surprises' },
            ],
        },
        {
            icon: 'bi-boxes',
            accent: '#10b981',
            title: 'One tool for everything',
            sub: 'Convert local files or grab video straight from the web.',
            points: [
                { icon: 'bi-cloud-arrow-down', text: 'YouTube, TikTok, Twitter — paste link, download done' },
                { icon: 'bi-film', text: 'MP4, MKV, WebM — all major formats and codecs' },
                { icon: 'bi-scissors', text: 'Time clipping, subtitles, filters, HDR metadata' },
            ],
        },
    ],
    ru: [
        {
            icon: 'bi-palette2',
            accent: '#7c3aed',
            title: 'Дизайн, который уважает тебя',
            sub: 'Большинство видеоинструментов выглядят как 2005 год. Gorex — нет.',
            points: [
                { icon: 'bi-moon-stars', text: 'Тёмная и светлая темы, чистый и просторный интерфейс' },
                { icon: 'bi-stars', text: 'Плавные анимации и переходы — каждое действие ощущается отточенным' },
                { icon: 'bi-grid-1x2', text: 'Каждый элемент на своём месте — ничто не мешает работе' },
            ],
        },
        {
            icon: 'bi-hand-index-thumb',
            accent: '#0ea5e9',
            title: 'Работает так, как ты думаешь',
            sub: 'Никаких мануалов, никаких догадок. Открыл, перетащил, запустил.',
            points: [
                { icon: 'bi-file-earmark-arrow-down', text: 'Drag & drop файлов — готово за секунды' },
                { icon: 'bi-sliders', text: 'Умные настройки по умолчанию — меняй только нужное' },
                { icon: 'bi-check2-circle', text: 'Каждый файл в очереди может иметь свои настройки' },
            ],
        },
        {
            icon: 'bi-lightning-charge-fill',
            accent: '#f59e0b',
            title: 'Быстро. Очень быстро.',
            sub: 'Gorex уходит в сторону и даёт железу делать своё дело.',
            points: [
                { icon: 'bi-gpu-card', text: 'GPU-кодирование — NVENC, QSV, AMF определяются автоматически' },
                { icon: 'bi-stack', text: 'Полная очередь — все файлы, один клик' },
                { icon: 'bi-bar-chart-line', text: 'Прогресс в реальном времени по каждому файлу' },
            ],
        },
        {
            icon: 'bi-boxes',
            accent: '#10b981',
            title: 'Один инструмент для всего',
            sub: 'Конвертируй локальные файлы или забирай видео прямо из сети.',
            points: [
                { icon: 'bi-cloud-arrow-down', text: 'YouTube, TikTok, Twitter — вставь ссылку, готово' },
                { icon: 'bi-film', text: 'MP4, MKV, WebM — все основные форматы и кодеки' },
                { icon: 'bi-scissors', text: 'Обрезка, субтитры, фильтры, HDR-метаданные' },
            ],
        },
    ],
}

const LABELS = {
    en: { step1Title: 'Choose your language', step1Sub: 'You can change it later in Settings', next: 'Continue', back: 'Back', start: 'Get Started', skip: 'Skip' },
    ru: { step1Title: 'Выберите язык', step1Sub: 'Вы сможете изменить его позже в Настройках', next: 'Продолжить', back: 'Назад', start: 'Начать работу', skip: 'Пропустить' },
}

const TOTAL = 5 // 1 lang + 4 slides

const ONBOARD = null // legacy, replaced by SLIDES + LABELS

export default function OnboardingScreen({ theme, onDone }) {
    const { setLang } = useLanguage()
    const [step, setStep] = useState(1)
    const [selectedLang, setSelectedLang] = useState('en')
    const [animKey, setAnimKey] = useState(0)
    const [dir, setDir] = useState(1)

    const L = LABELS[selectedLang]
    const slides = SLIDES[selectedLang]
    const slideIndex = step - 2 // 0..3

    const go = (nextStep) => {
        setDir(nextStep > step ? 1 : -1)
        setAnimKey(k => k + 1)
        setStep(nextStep)
    }

    const handleNext = () => {
        if (step === 1) setLang(selectedLang)
        if (step < TOTAL) go(step + 1)
        else onDone()
    }

    const handleBack = () => {
        if (step > 1) go(step - 1)
    }

    return (
        <div className={`onboarding-overlay ${theme}`}>
            <div className="onboarding-card">
                <div className="onboarding-logo">
                    <img src={theme === 'dark' ? logoWhite : logoColor} alt="Gorex" />
                </div>

                <div className="onboarding-steps">
                    {Array.from({ length: TOTAL }).map((_, i) => (
                        <span key={i} className={`onboarding-dot${step === i + 1 ? ' active' : step > i + 1 ? ' done' : ''}`} />
                    ))}
                </div>

                <div className={`onboarding-step ob-dir-${dir > 0 ? 'fwd' : 'bwd'}`} key={animKey}>
                    {step === 1 && (
                        <>
                            <h2 className="onboarding-title">{L.step1Title}</h2>
                            <p className="onboarding-sub">{L.step1Sub}</p>

                            <div className="onboarding-lang-grid">
                                <button
                                    className={`onboarding-lang-card${selectedLang === 'en' ? ' selected' : ''}`}
                                    onClick={() => setSelectedLang('en')}
                                >
                                    <span className="onboarding-lang-flag">EN</span>
                                    <span className="onboarding-lang-name">English</span>
                                    {selectedLang === 'en' && (
                                        <span className="onboarding-lang-check"><i className="bi bi-check2" /></span>
                                    )}
                                </button>
                                <button
                                    className={`onboarding-lang-card${selectedLang === 'ru' ? ' selected' : ''}`}
                                    onClick={() => setSelectedLang('ru')}
                                >
                                    <span className="onboarding-lang-flag">RU</span>
                                    <span className="onboarding-lang-name">Русский</span>
                                    {selectedLang === 'ru' && (
                                        <span className="onboarding-lang-check"><i className="bi bi-check2" /></span>
                                    )}
                                </button>
                            </div>
                        </>
                    )}

                    {step >= 2 && (
                        <>
                            <div className="ob-slide-icon" style={{ '--ob-accent': slides[slideIndex].accent }}>
                                <i className={`bi ${slides[slideIndex].icon}`} />
                            </div>
                            <h2 className="onboarding-title">{slides[slideIndex].title}</h2>
                            <p className="onboarding-sub">{slides[slideIndex].sub}</p>

                            <ul className="ob-points">
                                {slides[slideIndex].points.map((p, i) => (
                                    <li key={i} className="ob-point" style={{ animationDelay: `${i * 80}ms` }}>
                                        <span className="ob-point-icon" style={{ '--ob-accent': slides[slideIndex].accent }}>
                                            <i className={`bi ${p.icon}`} />
                                        </span>
                                        <span className="ob-point-text">{p.text}</span>
                                    </li>
                                ))}
                            </ul>
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
                        <button className="onboarding-btn-ghost" onClick={onDone}>
                            {L.skip}
                        </button>
                    )}
                    <button className="onboarding-btn-primary" onClick={handleNext}>
                        {step === TOTAL ? L.start : L.next}
                        <i className={`bi ${step === TOTAL ? 'bi-check2' : 'bi-arrow-right'}`} />
                    </button>
                </div>
            </div>
        </div>
    )
}
