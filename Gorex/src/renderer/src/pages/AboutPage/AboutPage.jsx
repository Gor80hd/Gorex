import { useState } from 'react'
import logoWhite from '../../assets/images/logo_white.svg'
import logoDark from '../../assets/images/logo.svg'
import tgQr from '../../assets/images/TG_QR.png'
import myPhoto from '../../assets/images/Photo.jpg'
import { LIBRARIES } from './data/libraries'
import './AboutPage.scss'

const TABS = [
    { id: 'me',        label: 'Обо мне',        icon: 'bi-person-circle' },
    { id: 'about',     label: 'О программе',    icon: 'bi-info-circle' },
    { id: 'thanks',    label: 'Благодарности',   icon: 'bi-heart' },
    { id: 'license',   label: 'Лицензия',        icon: 'bi-file-earmark-text' },
    { id: 'libraries', label: 'Библиотеки',      icon: 'bi-box-seam' },
]

const THANKS = [
    { name: 'Андрей Виноградов',  tg: 'resonaura', url: 'https://t.me/resonaura' },
    { name: 'Святослав Драгунов', tg: 'memsteel',  url: 'https://t.me/memsteel' },
    { name: 'Павел Яшкин',       tg: null,         url: null },
    { name: 'Барвашов Егор',      tg: null,         url: null },
]

function AboutPage({ theme, onBack }) {
    const [activeTab, setActiveTab] = useState('me')

    return (
        <div className={`about-container ${theme}`}>
            <div className="about-header">
                <button className="ap-back-btn" onClick={onBack}>
                    <i className="bi bi-arrow-left"></i> Назад
                </button>
                <div className="about-logo">
                    <img src={theme === 'dark' ? logoWhite : logoDark} alt="Logo" />
                </div>
                <div className="about-title-block">
                    <h1>Gorex</h1>
                    <p className="version-info">Version 1.0.0 · Web Edition · GPLv2</p>
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
                            <img src={myPhoto} alt="Ахматьяров Егор" className="me-photo" />
                            <div className="me-hero-text">
                                <p className="me-eyebrow">Дизайнер · Видеограф</p>
                                <h2 className="me-name">Ахматьяров Егор</h2>
                                <p className="me-role">Автор идеи и создатель Gorex</p>
                            </div>
                            <div className="me-qr-wrap">
                                <img src={tgQr} alt="TG QR" className="me-qr" />
                                <p className="me-qr-label">Telegram QR</p>
                            </div>
                        </div>

                        <div className="me-story">
                            <p className="me-story-lead">
                                Я не программист. Я дизайнер и видеограф —
                                человек, который годами работает с видео и остро чувствует,
                                каким должен быть инструмент для таких же людей, как я.
                            </p>
                            <p>
                                Всё существующее либо выглядит так, будто застряло в 2005-м,
                                либо стоит денег за каждый чих, либо просто не работает как надо.
                                Я давно хотел сделать что-то по-настоящему красивое и удобное —
                                не для разработчиков, а для людей из сферы. Концепт жил у меня
                                в голове очень долго, но реализовать его самому было невозможно.
                            </p>
                            <p>
                                И вот благодаря технологиям ИИ —&nbsp;
                                <a href="https://claude.ai" target="_blank" rel="noreferrer" className="me-story-link">Claude</a>
                                &nbsp;— я наконец смог воплотить эту идею в жизнь.
                                Gorex — это не просто обёртка над HandBrake.
                                Это концепция: инструмент, который уважает твоё время,
                                выглядит как продукт, за который не стыдно, и работает
                                именно так, как ожидает профессионал в видео.
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
                        </div>

                    </div>
                )}

                {activeTab === 'about' && (
                    <div className="about-section">
                        <p className="about-description">
                            Gorex — современный Electron-интерфейс для легендарного транскодера HandBrake
                            и загрузчика yt-dlp. Сохраняет всю мощь оригинального HandBrake CLI, предоставляя
                            удобный и эстетичный пользовательский опыт с открытым исходным кодом.
                        </p>
                        <div className="about-links">
                            <a href="https://github.com/Gor80hd/Gorex" target="_blank" rel="noreferrer">
                                <i className="bi bi-github"></i> GitHub — Gorex
                            </a>
                            <a href="https://handbrake.fr" target="_blank" rel="noreferrer">
                                <i className="bi bi-globe"></i> handbrake.fr
                            </a>
                            <a href="https://github.com/yt-dlp/yt-dlp" target="_blank" rel="noreferrer">
                                <i className="bi bi-github"></i> yt-dlp
                            </a>
                        </div>
                        <div className="license-notice">
                            <i className="bi bi-shield-check"></i>
                            <span>
                                Gorex использует HandBrake и yt-dlp — программы с открытым исходным кодом.
                                HandBrake распространяется под лицензией <strong>GNU GPL v2</strong>.
                                Graphic assets — <strong>CC BY-SA 4.0</strong>.
                                Web UI дополнительно использует MIT-библиотеки React, Vite и Electron.
                            </span>
                        </div>
                        <footer className="about-footer">
                            <p>© 2026 Gorex. Distributed under GNU General Public License Version 2.</p>
                        </footer>
                    </div>
                )}

                {activeTab === 'thanks' && (
                    <div className="about-section">
                        <p className="thanks-intro">Огромная благодарность этим людям за поддержку и вдохновение.</p>
                        <div className="thanks-grid">
                            {THANKS.map(person => (
                                <div key={person.name} className="thanks-item">
                                    <div className="thanks-icon">
                                        <i className="bi bi-telegram"></i>
                                    </div>
                                    <div className="thanks-info">
                                        <strong className="thanks-name">{person.name}</strong>
                                        {person.url ? (
                                            <a href={person.url} target="_blank" rel="noreferrer" className="thanks-tg">
                                                @{person.tg}
                                            </a>
                                        ) : (
                                            <span className="thanks-tg thanks-tg--offline">нет ссылки</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'license' && (
                    <div className="about-section">
                        <div className="license-summary">
                            <p>
                                Большинство файлов HandBrake распространяется под лицензией{' '}
                                <strong>GNU General Public License Version 2 (GPLv2)</strong>.
                                Некоторые файлы — под GPLv2+, LGPLv2.1+ или BSD/MIT/X11.
                                Скомпилированная сборка HandBrake лицензирована под GPLv2.
                            </p>
                            <p>
                                Графические ресурсы распространяются под лицензией <strong>CC BY-SA 4.0 International</strong>.
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
                            <a href="https://github.com/HandBrake/HandBrake/blob/master/LICENSE" target="_blank" rel="noreferrer">
                                <i className="bi bi-box-arrow-up-right"></i> HandBrake LICENSE
                            </a>
                            <a href="https://github.com/HandBrake/HandBrake/blob/master/COPYING" target="_blank" rel="noreferrer">
                                <i className="bi bi-box-arrow-up-right"></i> COPYING
                            </a>
                        </div>
                    </div>
                )}

                {activeTab === 'libraries' && (
                    <div className="about-section">
                        <div className="lib-featured-grid">
                            <a className="lib-featured-item" href="https://github.com/HandBrake/HandBrake" target="_blank" rel="noreferrer">
                                <div className="lib-featured-icon">
                                    <i className="bi bi-camera-video-fill"></i>
                                </div>
                                <div className="lib-featured-body">
                                    <span className="lib-featured-name">HandBrake</span>
                                    <span className="lib-featured-devs">The HandBrake Team</span>
                                    <span className="lib-featured-license">GPL v2</span>
                                </div>
                                <span className="lib-featured-gh">
                                    <i className="bi bi-github"></i> HandBrake/HandBrake
                                </span>
                            </a>
                            <a className="lib-featured-item" href="https://github.com/yt-dlp/yt-dlp" target="_blank" rel="noreferrer">
                                <div className="lib-featured-icon">
                                    <i className="bi bi-cloud-arrow-down-fill"></i>
                                </div>
                                <div className="lib-featured-body">
                                    <span className="lib-featured-name">yt-dlp</span>
                                    <span className="lib-featured-devs">yt-dlp contributors</span>
                                    <span className="lib-featured-license">Unlicense</span>
                                </div>
                                <span className="lib-featured-gh">
                                    <i className="bi bi-github"></i> yt-dlp/yt-dlp
                                </span>
                            </a>
                        </div>
                        <p className="libraries-intro">
                            Дополнительные библиотеки с открытым исходным кодом, используемые в HandBrake.
                            Полный список —{' '}
                            <a href="https://github.com/HandBrake/HandBrake/blob/master/THANKS.markdown" target="_blank" rel="noreferrer">
                                THANKS.markdown
                            </a>.
                        </p>
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
