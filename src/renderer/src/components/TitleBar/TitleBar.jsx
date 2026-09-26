import { useState, useCallback, useRef, useEffect } from 'react'
import logoWhite from '../../assets/images/logo_white.svg'
import logoDark from '../../assets/images/logo.svg'
import { useLanguage } from '../../i18n'
import './TitleBar.scss'

function formatToolDate(value) {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleDateString()
}

function getToolStatusText(tool, status, t, readyKey) {
    if (tool?.message) return tool.message
    if (tool?.stageMessage) return tool.stageMessage
    if (status === 'update-available') return t('toolUpdateAvailable')
    if (status === 'updating' || status === 'checking') return t('ytdlUpdateChecking')
    if (status === 'error' || status === 'check-failed') return t('toolCheckFailed')
    return t(readyKey)
}
function TitleBar({
    onOpen, theme, toggleTheme, onViewChange, currentView,
    isEncoding, isPaused, hasVideos,
    onStartEncoding, onPause, onStop, onClearQueue, onOpenCliConsole, ytdlTool, twitchTool, onOpenYtdlSettings
}) {
    const [toggling, setToggling] = useState(false)
    const [fileMenuOpen, setFileMenuOpen] = useState(false)
    const fileMenuRef = useRef(null)
    const { t } = useLanguage()
    const isMac = window.api?.platform === 'darwin'

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

    const ytdlStatus = ytdlTool?.status || 'checking'
    const ytdlVersion = ytdlTool?.info?.version || ytdlTool?.latest?.latestVersion || '...'
    const ytdlProgress = Number.isFinite(ytdlTool?.progress)
        ? Math.max(0, Math.min(100, ytdlTool.progress))
        : (ytdlStatus === 'updating' ? 35 : 100)
    const ytdlBadgeClass = `tb-ytdl-badge tb-ytdl-badge--${ytdlStatus}`
    const ytdlBadgeTitle = ytdlTool?.message || ytdlTool?.stageMessage || t('ytdlBadgeTitle')
    const ytdlBadgeIcon = ytdlStatus === 'up-to-date' ? 'bi-check-lg' : 'bi-cloud-arrow-down'
    const twitchStatus = twitchTool?.status || 'checking'
    const toolRows = [
        {
            key: 'ytdl',
            icon: 'bi-cloud-arrow-down',
            name: 'yt-dlp',
            installed: ytdlTool?.info?.version || t('toolVersionUnknown'),
            latest: ytdlTool?.latest?.latestVersion || t('toolVersionUnknown'),
            date: formatToolDate(ytdlTool?.latest?.publishedAt),
            status: getToolStatusText(ytdlTool, ytdlStatus, t, 'ytdlBadgeReady'),
            statusClass: ytdlStatus,
        },
        {
            key: 'twitch',
            icon: 'bi-twitch',
            name: 'TwitchDownloaderCLI',
            installed: twitchTool?.info?.version || t('toolVersionUnknown'),
            latest: twitchTool?.latest?.latestVersion || t('toolVersionUnknown'),
            date: formatToolDate(twitchTool?.latest?.publishedAt),
            status: getToolStatusText(twitchTool, twitchStatus, t, 'twitchBadgeReady'),
            statusClass: twitchStatus,
        },
    ]
    return (
        <div className={`titlebar${isMac ? ' titlebar--mac' : ''}`}>
            <div className="titlebar-drag-region"></div>
            <div className="titlebar-content">
                {!isMac && (
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
                                    <button className="tb-dropdown-item" onClick={() => menuAction(() => onOpenCliConsole())}>
                                        <span className="tb-item-label">{t('menuDebugConsole')}</span>
                                    </button>
                                    <div className="tb-dropdown-sep"></div>
                                    <button className="tb-dropdown-item" onClick={() => menuAction(() => window.api.quit())}>
                                        <span className="tb-item-label">{t('menuExit')}</span>
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
                )}

                <div className="titlebar-right">
                    <div className="tb-tools-wrap">
                        <button
                            type="button"
                            className={ytdlBadgeClass}
                            style={{ '--ytdl-progress': `${ytdlProgress}%` }}
                            title={ytdlBadgeTitle}
                            aria-label={ytdlBadgeTitle}
                            onClick={onOpenYtdlSettings}
                        >
                            <span className="tb-ytdl-badge__inner">
                                <i className={`bi ${ytdlBadgeIcon}`}></i>
                                <span>yt-dlp {ytdlVersion}</span>
                            </span>
                        </button>
                        <div className="tb-tools-popover" role="status">
                            <div className="tb-tools-popover__title">{t('toolsBadgeTitle')}</div>
                            {toolRows.map(row => (
                                <div key={row.key} className="tb-tool-row">
                                    <div className="tb-tool-row__head">
                                        <span><i className={`bi ${row.icon}`}></i>{row.name}</span>
                                        <strong className={`tb-tool-status tb-tool-status--${row.statusClass}`}>{row.status}</strong>
                                    </div>
                                    <div className="tb-tool-row__meta">
                                        <span>{t('toolInstalledLabel')}: {row.installed}</span>
                                        <span>{t('toolLatestLabel')}: {row.latest}</span>
                                        {row.date && <span>{t('toolReleaseLabel')}: {row.date}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
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
                    {!isMac && (
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
                    )}
                </div>
            </div>
        </div>
    )
}

export default TitleBar
