import { useState } from 'react'
import logoWhite from '../../assets/images/logo_white.svg'
import logoDark from '../../assets/images/logo.svg'
import { AUTHORS } from './data/authors'
import { LIBRARIES } from './data/libraries'
import './AboutPage.scss'

const TABS = [
    { id: 'about',     label: 'О программе',  icon: 'bi-info-circle' },
    { id: 'authors',   label: 'Авторы',        icon: 'bi-people' },
    { id: 'license',   label: 'Лицензия',      icon: 'bi-file-earmark-text' },
    { id: 'libraries', label: 'Библиотеки',    icon: 'bi-box-seam' },
]

function AboutPage({ theme, onBack }) {
    const [activeTab, setActiveTab] = useState('about')

    return (
        <div className={`about-container ${theme}`}>
            <div className="about-header">
                <div className="about-logo">
                    <img src={theme === 'dark' ? logoWhite : logoDark} alt="Logo" />
                </div>
                <div className="about-title-block">
                    <h1>BPRESS</h1>
                    <p className="version-info">Version 1.0.0-alpha · Web Edition · GPLv2</p>
                </div>
                <button className="back-link" onClick={onBack}>
                    <i className="bi bi-arrow-left"></i> Назад
                </button>
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

                {activeTab === 'about' && (
                    <div className="about-section">
                        <p className="about-description">
                            BPRESS — современный Electron-интерфейс для легендарного транскодера с открытым
                            исходным кодом. Сохраняет всю мощь оригинального HandBrake CLI, предоставляя
                            удобный и эстетичный пользовательский опыт.
                        </p>
                        <div className="about-links">
                            <a href="https://handbrake.fr" target="_blank" rel="noreferrer">
                                <i className="bi bi-globe"></i> handbrake.fr
                            </a>
                            <a href="https://github.com/HandBrake/HandBrake" target="_blank" rel="noreferrer">
                                <i className="bi bi-github"></i> GitHub
                            </a>
                            <a href="https://handbrake.fr/docs" target="_blank" rel="noreferrer">
                                <i className="bi bi-book"></i> Документация
                            </a>
                            <a href="https://github.com/HandBrake/HandBrake/blob/master/NEWS.markdown" target="_blank" rel="noreferrer">
                                <i className="bi bi-newspaper"></i> Changelog
                            </a>
                        </div>
                        <div className="license-notice">
                            <i className="bi bi-shield-check"></i>
                            <span>
                                HandBrake распространяется под лицензией <strong>GNU GPL v2</strong>.
                                Graphic assets — <strong>CC BY-SA 4.0</strong>.
                                Web UI дополнительно использует MIT-библиотеки React, Vite и Electron.
                            </span>
                        </div>
                        <footer className="about-footer">
                            <p>© 2026 HandBrake Project. Distributed under GNU General Public License Version 2.</p>
                        </footer>
                    </div>
                )}

                {activeTab === 'authors' && (
                    <div className="about-section">
                        <div className="authors-grid">
                            {AUTHORS.map(author => (
                                <div key={author.handle} className="author-item">
                                    <div className="author-name">
                                        <strong>{author.name}</strong>
                                        <span className="author-handle">@{author.handle}</span>
                                    </div>
                                    <span className="author-role">{author.role}</span>
                                    <ul className="author-contributions">
                                        {author.contributions.map(c => (
                                            <li key={c}>{c}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                        <p className="more-info">
                            И многие другие участники сообщества — тестировщики, переводчики и контрибьюторы.
                            Полный список на{' '}
                            <a href="https://github.com/HandBrake/HandBrake/blob/master/AUTHORS.markdown" target="_blank" rel="noreferrer">
                                GitHub
                            </a>.
                        </p>
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
                        <p className="libraries-intro">
                            HandBrake использует следующие библиотеки с открытым исходным кодом.
                            Полный список с благодарностями —{' '}
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
