import { useState } from 'react'
import { useLanguage } from '../../i18n'
import logoWhite from '../../assets/images/logo_white.svg'
import logoColor from '../../assets/images/logo.svg'

const ONBOARD = {
    en: {
        step1Title: 'Choose your language',
        step1Sub: 'You can change it later in Settings',
        next: 'Continue',
        back: 'Back',
        step2Title: 'Welcome to Gorex',
        step2Sub: 'A video tool built on the power of HandBrake and yt-dlp — designed for people.',
        feat1Icon: 'bi-film',
        feat1Title: 'Convert video files',
        feat1Desc: 'Drag & drop your files and transcode them with GPU acceleration, codec fine-tuning, audio and subtitle control — powered under the hood by HandBrake.',
        feat2Icon: 'bi-cloud-arrow-down',
        feat2Title: 'Download from the web',
        feat2Desc: 'Paste a YouTube, TikTok or Twitter link and grab it in the best quality — with optional conversion right after, all in one place.',
        feat3Icon: 'bi-lightning-charge',
        feat3Title: 'A tool worth using',
        feat3Desc: 'Gorex is not a wrapper. It is a concept: a product that respects your time and works exactly the way a video professional expects.',
        start: 'Get Started',
    },
    ru: {
        step1Title: 'Выберите язык',
        step1Sub: 'Вы сможете изменить его позже в Настройках',
        next: 'Продолжить',
        back: 'Назад',
        step2Title: 'Добро пожаловать в Gorex',
        step2Sub: 'Видеоинструмент, построенный на мощи HandBrake и yt-dlp — созданный для людей.',
        feat1Icon: 'bi-film',
        feat1Title: 'Конвертация видео',
        feat1Desc: 'Перетащи файлы и перекодируй с GPU-ускорением, тонкой настройкой кодеков, аудио и субтитрами — под капотом работает HandBrake.',
        feat2Icon: 'bi-cloud-arrow-down',
        feat2Title: 'Загрузка из сети',
        feat2Desc: 'Вставь ссылку YouTube, TikTok или Twitter и скачай в лучшем качестве — с конвертацией сразу после, всё в одном месте.',
        feat3Icon: 'bi-lightning-charge',
        feat3Title: 'Инструмент, которым приятно работать',
        feat3Desc: 'Gorex — это не обёртка. Это концепция: продукт, который уважает твоё время и работает именно так, как ожидает профессионал в видео.',
        start: 'Начать работу',
    },
}

export default function OnboardingScreen({ theme, onDone }) {
    const { setLang } = useLanguage()
    const [step, setStep] = useState(1)
    const [selectedLang, setSelectedLang] = useState('en')

    const T = ONBOARD[selectedLang]

    const handleNext = () => {
        setLang(selectedLang)
        setStep(2)
    }

    const handleBack = () => {
        setStep(1)
    }

    return (
        <div className={`onboarding-overlay ${theme}`}>
            <div className="onboarding-card">
                <div className="onboarding-logo">
                    <img src={theme === 'dark' ? logoWhite : logoColor} alt="Gorex" />
                </div>

                <div className="onboarding-steps">
                    <span className={`onboarding-dot${step === 1 ? ' active' : ''}`} />
                    <span className={`onboarding-dot${step === 2 ? ' active' : ''}`} />
                </div>

                {step === 1 && (
                    <div className="onboarding-step" key="step1">
                        <h2 className="onboarding-title">{T.step1Title}</h2>
                        <p className="onboarding-sub">{T.step1Sub}</p>

                        <div className="onboarding-lang-grid">
                            <button
                                className={`onboarding-lang-card${selectedLang === 'en' ? ' selected' : ''}`}
                                onClick={() => setSelectedLang('en')}
                            >
                                <span className="onboarding-lang-flag">EN</span>
                                <span className="onboarding-lang-name">English</span>
                                {selectedLang === 'en' && (
                                    <span className="onboarding-lang-check">
                                        <i className="bi bi-check2" />
                                    </span>
                                )}
                            </button>
                            <button
                                className={`onboarding-lang-card${selectedLang === 'ru' ? ' selected' : ''}`}
                                onClick={() => setSelectedLang('ru')}
                            >
                                <span className="onboarding-lang-flag">RU</span>
                                <span className="onboarding-lang-name">Русский</span>
                                {selectedLang === 'ru' && (
                                    <span className="onboarding-lang-check">
                                        <i className="bi bi-check2" />
                                    </span>
                                )}
                            </button>
                        </div>

                        <button className="onboarding-btn-primary" onClick={handleNext}>
                            {T.next}
                            <i className="bi bi-arrow-right" />
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="onboarding-step" key="step2">
                        <h2 className="onboarding-title">{T.step2Title}</h2>
                        <p className="onboarding-sub">{T.step2Sub}</p>

                        <div className="onboarding-features">
                            {[
                                { icon: T.feat1Icon, title: T.feat1Title, desc: T.feat1Desc },
                                { icon: T.feat2Icon, title: T.feat2Title, desc: T.feat2Desc },
                                { icon: T.feat3Icon, title: T.feat3Title, desc: T.feat3Desc },
                            ].map((f, i) => (
                                <div key={i} className="onboarding-feature-card">
                                    <i className={`bi ${f.icon} onboarding-feature-icon`} />
                                    <div className="onboarding-feature-title">{f.title}</div>
                                    <div className="onboarding-feature-desc">{f.desc}</div>
                                </div>
                            ))}
                        </div>

                        <div className="onboarding-footer">
                            <button className="onboarding-btn-ghost" onClick={handleBack}>
                                <i className="bi bi-arrow-left" />
                                {T.back}
                            </button>
                            <button className="onboarding-btn-primary" onClick={onDone}>
                                {T.start}
                                <i className="bi bi-arrow-right" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
