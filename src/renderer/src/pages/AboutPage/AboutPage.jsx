import { useState } from 'react'
import logoWhite from '../../assets/images/logo_white.svg'
import logoDark from '../../assets/images/logo.svg'
import tgQr from '../../assets/images/TG_QR.png'
import myPhoto from '../../assets/images/Photo.jpg'
import { LIBRARIES } from './data/libraries'
import { useLanguage } from '../../i18n'
import './AboutPage.scss'

const THANKS = [
    { nameKey: 'thanksName1', tg: 'resonaura', url: 'https://t.me/resonaura' },
    { nameKey: 'thanksName2', tg: 'memsteel',  url: 'https://t.me/memsteel' },
    { nameKey: 'thanksName3', tg: null,        url: null },
    { nameKey: 'thanksName4', tg: null,        url: null },
    { nameKey: 'thanksName5', tg: null,        url: null },
]

function AboutPage({ theme, onBack }) {
    const [activeTab, setActiveTab] = useState('me')
    const { t } = useLanguage()

    const TABS = [
        { id: 'me',        label: t('aboutTabMe'),        icon: 'bi-person-circle' },
        { id: 'about',     label: t('aboutTabProgram'),   icon: 'bi-info-circle' },
        { id: 'thanks',    label: t('aboutTabCredits'),   icon: 'bi-heart' },
        { id: 'libraries', label: t('aboutTabLibraries'), icon: 'bi-box-seam' },
    ]

    return (
        <div className={`about-container ${theme}`}>
            <div className="about-header">
                <button className="ap-back-btn" onClick={onBack}>
                    <i className="bi bi-arrow-left"></i> {t('back')}
                </button>
                <div className="about-logo">
                    <img src={theme === 'dark' ? logoWhite : logoDark} alt="Logo" />
                </div>
                <div className="about-title-block">
                    <h1>Gorex</h1>
                    <p className="version-info">Version 2.0.0 · Web Edition · GPLv2</p>
                </div>
            </div>

            <div className="about-tabs">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        className={`about-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <i className={`bi ${tab.icon}`}></i>
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="about-content-scroll">

                {activeTab === 'me' && (
                    <div className="about-section me-section">

                        <div className="me-hero">
                            <img src={myPhoto} alt={t('meAuthorName')} className="me-photo" />
                            <div className="me-hero-text">
                                <p className="me-eyebrow">{t('meEyebrow')}</p>
                                <h2 className="me-name">{t('meAuthorName')}</h2>
                                <p className="me-role">{t('meRole')}</p>
                            </div>
                            <div className="me-qr-wrap">
                                <img src={tgQr} alt="TG QR" className="me-qr" />
                                <p className="me-qr-label">Telegram QR</p>
                            </div>
                        </div>

                        <div className="me-story">
                            <p className="me-story-lead">{t('meStoryLead')}</p>
                            <p>{t('meStoryP2')}</p>
                            <p>
                                {t('meStoryP3a')}
                                <a href="https://claude.ai" target="_blank" rel="noreferrer" className="me-story-link">Claude</a>
                                {t('meStoryP3b')}
                            </p>
                        </div>

                        <div className="me-contacts">
                            <a href="https://t.me/akhmatyarov" target="_blank" rel="noreferrer" className="me-contact-tg">
                                <i className="bi bi-telegram"></i>
                                <span>@akhmatyarov</span>
                            </a>
                            <a href="https://github.com/Gor80hd/Gorex" target="_blank" rel="noreferrer" className="me-contact-gh">
                                <i className="bi bi-github"></i>
                                <span>Gorex on GitHub</span>
                            </a>
                            <a href="https://dalink.to/akhmatyarov" target="_blank" rel="noreferrer" className="me-contact-donate">
                                <i className="bi bi-heart-fill"></i>
                                <span>{t('donate')}</span>
                            </a>
                        </div>

                    </div>
                )}

                {activeTab === 'about' && (
                    <div className="about-section">
                        <p className="about-description">{t('aboutDescription')}</p>
                        <div className="about-links">
                            <a href="https://github.com/Gor80hd/Gorex" target="_blank" rel="noreferrer">
                                <i className="bi bi-github"></i> GitHub — Gorex
                            </a>
                            <a href="https://github.com/yt-dlp/yt-dlp" target="_blank" rel="noreferrer">
                                <i className="bi bi-github"></i> yt-dlp
                            </a>
                        </div>
                        <div className="license-notice">
                            <i className="bi bi-shield-check"></i>
                            <span>
                                {t('aboutLicenseNotice1')}<strong>GNU GPL v2</strong>.
                                {' '}Graphic assets — <strong>CC BY-SA 4.0</strong>.
                                {t('aboutLicenseNotice3')}
                            </span>
                        </div>
                        <div className="license-summary">
                            <p>
                                {t('licenseSummary1a')}<strong>GNU General Public License Version 2 (GPLv2)</strong>{t('licenseSummary1b')}
                            </p>
                            <p>
                                {t('licenseSummary2a')}<strong>CC BY-SA 4.0 International</strong>.
                            </p>
                        </div>
                        <div className="license-box">
                            <pre>{`                    GNU GENERAL PUBLIC LICENSE
                       Version 2, June 1991

 Copyright (C) 1989, 1991 Free Software Foundation, Inc.,
 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 Everyone is permitted to copy and distribute verbatim copies
 of this license document, but changing it is not allowed.

                            Preamble

  The licenses for most software are designed to take away your
freedom to share and change it.  By contrast, the GNU General Public
License is intended to guarantee your freedom to share and change free
software--to make sure the software is free for all its users.  This
General Public License applies to most of the Free Software
Foundation's software and to any other program whose authors commit
to using it.  You can apply it to your programs, too.

  When we speak of free software, we are referring to freedom, not
price.  Our General Public Licenses are designed to make sure that
you have the freedom to distribute copies of free software (and charge
for this service if you wish), that you receive source code or can get
it if you want it, that you can change the software or use pieces of
it in new free programs; and that you know you can do these things.

  To protect your rights, we need to make restrictions that forbid
anyone to deny you these rights or to ask you to surrender the rights.
These restrictions translate to certain responsibilities for you if you
distribute copies of the software, or if you modify it.

 Full license text: https://www.gnu.org/licenses/old-licenses/gpl-2.0.html`}</pre>
                        </div>
                        <div className="license-links">
                            <a href="https://www.gnu.org/licenses/old-licenses/gpl-2.0.html" target="_blank" rel="noreferrer">
                                <i className="bi bi-box-arrow-up-right"></i> GPL v2 Full Text
                            </a>
                        </div>
                        <footer className="about-footer">
                            <p>© 2026 Gorex. Distributed under GNU General Public License Version 2.</p>
                        </footer>
                    </div>
                )}

                {activeTab === 'thanks' && (
                    <div className="about-section">
                        <p className="thanks-intro">{t('aboutThanksIntro')}</p>
                        <div className="thanks-grid">
                            {THANKS.map(person => (
                                <div key={person.name} className="thanks-item">
                                    <div className="thanks-icon">
                                        <i className="bi bi-telegram"></i>
                                    </div>
                                    <div className="thanks-info">
                                        <strong className="thanks-name">{t(person.nameKey)}</strong>
                                        {person.url ? (
                                            <a href={person.url} target="_blank" rel="noreferrer" className="thanks-tg">
                                                @{person.tg}
                                            </a>
                                        ) : (
                                            <span className="thanks-tg thanks-tg--offline">{t('aboutNoLink')}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'libraries' && (
                    <div className="about-section">
                        <div className="libraries-grid">
                            {LIBRARIES.map(lib => (
                                <a
                                    key={lib.name}
                                    className="library-item"
                                    href={lib.url}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <span className="library-name">{lib.name}</span>
                                    <span className="library-license">{lib.license}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}

export default AboutPage
