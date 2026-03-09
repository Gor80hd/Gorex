import { useState, useCallback, useRef, useEffect } from 'react'
import logoWhite from '../../assets/images/logo_white.svg'
import logoDark from '../../assets/images/logo.svg'
import { useLanguage } from '../../i18n'
import './TitleBar.scss'

function TitleBar({
    onOpen, theme, toggleTheme, onViewChange, currentView,
    isEncoding, isPaused, hasVideos,
    onStartEncoding, onPause, onStop, onClearQueue, onOpenCliConsole
}) {
    const [toggling, setToggling] = useState(false)
    const [fileMenuOpen, setFileMenuOpen] = useState(false)
    const fileMenuRef = useRef(null)
    const { t } = useLanguage()

    const handleToggle = useCallback(() => {
        setToggling(true)
        toggleTheme()
        setTimeout(() => setToggling(false), 450)
    }, [toggleTheme])

    useEffect(() => {
        if (!fileMenuOpen) return
        const handler = (e) => {
            if (fileMenuRef.current && !fileMenuRef.current.contains(e.target)) {
                setFileMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [fileMenuOpen])

    const menuAction = (fn) => {
        setFileMenuOpen(false)
        fn()
    }

    return (
        <div className="titlebar">
            <div className="titlebar-drag-region"></div>
            <div className="titlebar-content">
                <div className="titlebar-left">
                    <div className="titlebar-logo">
                        <img src={theme === 'dark' ? logoWhite : logoDark} alt="Logo" />
                    </div>
                    <nav className="titlebar-menu">
                        <div className="tb-file-menu" ref={fileMenuRef}>
                            <button
                                className={fileMenuOpen ? 'active' : ''}
                                onClick={() => setFileMenuOpen(v => !v)}
                            >
                                {t('menuFile')}
                            </button>
                            {fileMenuOpen && (
                                <div className="tb-dropdown">
                                    <button className="tb-dropdown-item" onClick={() => menuAction(() => { onViewChange('source'); onOpen() })}>
                                        <span className="tb-item-label">{t('menuOpenSource')}</span>
                                    </button>
                                    <button
                                        className="tb-dropdown-item tb-dropdown-item--danger"
                                        disabled={!hasVideos || isEncoding}
                                        onClick={() => menuAction(onClearQueue)}
                                    >
                                        <span className="tb-item-label">{t('menuClearQueue')}</span>
                                    </button>
                                    <div className="tb-dropdown-sep"></div>
                                    <button
                                        className="tb-dropdown-item"
                                        disabled={!hasVideos || isEncoding}
                                        onClick={() => menuAction(onStartEncoding)}
                                    >
                                        <span className="tb-item-label">{t('menuStartEncoding')}</span>
                                    </button>
                                    <button
                                        className="tb-dropdown-item"
                                        disabled={!isEncoding}
                                        onClick={() => menuAction(onPause)}
                                    >
                                        <span className="tb-item-label">{isPaused ? t('menuResume') : t('menuPause')}</span>
                                    </button>
                                    <button
                                        className="tb-dropdown-item tb-dropdown-item--danger"
                                        disabled={!isEncoding}
                                        onClick={() => menuAction(onStop)}
                                    >
                                        <span className="tb-item-label">{t('menuStop')}</span>
                                    </button>
                                    <div className="tb-dropdown-sep"></div>
                                    <button className="tb-dropdown-item" onClick={() => menuAction(() => window.api.close())}>
                                        <span className="tb-item-label">{t('menuExit')}</span>
                                    </button>
                                    <div className="tb-dropdown-sep"></div>
                                    <button className="tb-dropdown-item" onClick={() => menuAction(() => onOpenCliConsole())}>
                                        <span className="tb-item-label">{t('menuDebugConsole')}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                        <button
                            className={currentView === 'settings' ? 'active' : ''}
                            onClick={() => onViewChange('settings')}
                        >{t('navSettings')}</button>
                        <button
                            className={currentView === 'about' ? 'active' : ''}
                            onClick={() => onViewChange('about')}
                        >
                            {t('navAbout')}
                        </button>
                    </nav>
                </div>

                <div className="titlebar-right">
                    <a href="https://dalink.to/akhmatyarov" target="_blank" rel="noreferrer" className="tb-donate-btn" title={t('donate')}>
                        <i className="bi bi-heart-fill"></i>
                        <span>{t('donate')}</span>
                    </a>
                    <div className="theme-toggle" onClick={handleToggle}>
                        <div className={`toggle-switch ${theme}${toggling ? ' toggling' : ''}`}>
                            <i className="bi bi-brightness-high toggle-icon-sun"></i>
                            <div className="toggle-handle"></div>
                            <i className="bi bi-moon toggle-icon-moon"></i>
                        </div>
                    </div>
                    <div className="window-controls">
                        <button className="control-btn" onClick={() => window.api.minimize()}>
                            <i className="bi bi-dash-lg"></i>
                        </button>
                        <button className="control-btn" onClick={() => window.api.maximize()}>
                            <i className="bi bi-square"></i>
                        </button>
                        <button className="control-btn close" onClick={() => window.api.close()}>
                            <i className="bi bi-x-lg"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TitleBar
