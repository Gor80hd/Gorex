import { useState, useMemo } from 'react'
import logoWhite from '../../assets/images/logo_white.svg'
import logoDark from '../../assets/images/logo.svg'
import './SourcePage.scss'

// Supported services: hostname (without www.) → { name, icon (Bootstrap Icons class), color }
const SERVICE_MAP = {
    'youtube.com':     { name: 'YouTube',      icon: 'bi-youtube',        color: '#ff0000' },
    'youtu.be':        { name: 'YouTube',      icon: 'bi-youtube',        color: '#ff0000' },
    'twitter.com':     { name: 'Twitter / X',  icon: 'bi-twitter-x',      color: '#ffffff' },
    'x.com':           { name: 'Twitter / X',  icon: 'bi-twitter-x',      color: '#ffffff' },
    't.co':            { name: 'Twitter / X',  icon: 'bi-twitter-x',      color: '#ffffff' },
    'instagram.com':   { name: 'Instagram',    icon: 'bi-instagram',       color: '#e1306c' },
    'ddinstagram.com': { name: 'Instagram',    icon: 'bi-instagram',       color: '#e1306c' },
    'reddit.com':      { name: 'Reddit',       icon: 'bi-reddit',          color: '#ff4500' },
    'redd.it':         { name: 'Reddit',       icon: 'bi-reddit',          color: '#ff4500' },
    'vimeo.com':       { name: 'Vimeo',        icon: 'bi-vimeo',           color: '#1ab7ea' },
    'soundcloud.com':  { name: 'SoundCloud',   icon: 'bi-soundcloud',      color: '#ff5500' },
    'twitch.tv':       { name: 'Twitch',       icon: 'bi-twitch',          color: '#9146ff' },
    'facebook.com':    { name: 'Facebook',     icon: 'bi-facebook',        color: '#1877f2' },
    'fb.watch':        { name: 'Facebook',     icon: 'bi-facebook',        color: '#1877f2' },
    'pinterest.com':   { name: 'Pinterest',    icon: 'bi-pinterest',       color: '#e60023' },
    'pin.it':          { name: 'Pinterest',    icon: 'bi-pinterest',       color: '#e60023' },
    'tumblr.com':      { name: 'Tumblr',       icon: 'bi-tumblr',          color: '#35465c' },
    'snapchat.com':    { name: 'Snapchat',     icon: 'bi-snapchat',        color: '#fffc00' },
    'tiktok.com':      { name: 'TikTok',       icon: 'bi-tiktok',          color: '#ff0050' },
    'vt.tiktok.com':   { name: 'TikTok',       icon: 'bi-tiktok',          color: '#ff0050' },
    'bilibili.com':    { name: 'Bilibili',     icon: 'bi-play-circle-fill',color: '#00a1d6' },
    'b23.tv':          { name: 'Bilibili',     icon: 'bi-play-circle-fill',color: '#00a1d6' },
    'ok.ru':           { name: 'OK',           icon: 'bi-person-circle',   color: '#f7931e' },
    'vk.com':          { name: 'VKontakte',    icon: 'bi-person-circle',   color: '#4a76a8' },
    'vk.ru':           { name: 'VKontakte',    icon: 'bi-person-circle',   color: '#4a76a8' },
    'rutube.ru':       { name: 'Rutube',       icon: 'bi-play-circle-fill',color: '#ff5c00' },
    'dailymotion.com': { name: 'Dailymotion',  icon: 'bi-play-circle-fill',color: '#0066dc' },
    'bsky.app':        { name: 'Bluesky',      icon: 'bi-cloud-fill',      color: '#0085ff' },
    'xiaohongshu.com': { name: 'Xiaohongshu',  icon: 'bi-book-fill',       color: '#ff2442' },
    'xhslink.com':     { name: 'Xiaohongshu',  icon: 'bi-book-fill',       color: '#ff2442' },
    'loom.com':        { name: 'Loom',         icon: 'bi-camera-video-fill',color: '#625df5' },
    'newgrounds.com':  { name: 'Newgrounds',   icon: 'bi-joystick',        color: '#f6a623' },
    'streamable.com':  { name: 'Streamable',   icon: 'bi-play-circle-fill',color: '#41b883' },
}

function detectService(raw) {
    if (!raw) return null
    try {
        const u = new URL(raw)
        const host = u.hostname.replace(/^www\./, '')
        return SERVICE_MAP[host] ?? null
    } catch {
        return null
    }
}

function isValidUrl(raw) {
    try { new URL(raw); return true } catch { return false }
}

function SourcePage({ theme, isDragging, onSelectFiles, onDragOver, onDragLeave, onDrop, onDownload }) {
    const [url, setUrl] = useState('')
    const [isDownloading, setIsDownloading] = useState(false)
    const [dlError, setDlError] = useState('')
    const [dlHint, setDlHint] = useState('')

    const trimmed = url.trim()
    const hasUrl = trimmed.length > 0
    const isUrl = isValidUrl(trimmed)
    const service = useMemo(() => detectService(trimmed), [trimmed])
    const isUnsupported = hasUrl && isUrl && !service

    const handleDownload = async () => {
        if (!trimmed || isDownloading || isUnsupported) return
        setDlError('')
        setDlHint('')
        setIsDownloading(true)
        try {
            await onDownload(trimmed, service)
            setUrl('')
        } catch (err) {
            setDlError(err?.message || 'Ошибка запроса форматов')
        } finally {
            setIsDownloading(false)
        }
    }

    const handleChange = (e) => {
        setUrl(e.target.value)
        setDlError('')
        setDlHint('')
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleDownload()
    }

    let iconEl
    if (isDownloading) {
        iconEl = <span className="dl-spinner" />
    } else if (service) {
        iconEl = <i className={`bi ${service.icon}`} style={{ color: service.color }} title={service.name} />
    } else if (isUnsupported) {
        iconEl = <i className="bi bi-x-circle-fill dl-icon--unsupported" />
    } else {
        iconEl = <i className="bi bi-link-45deg dl-icon--placeholder" />
    }

    return (
        <div className="source-wrapper">
            <div
                className={`drop-area ${isDragging ? 'active' : ''} ${theme}`}
                onClick={onSelectFiles}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
            >
                <div className="drop-content">
                    <div className="drop-icon-large">
                        <img
                            className="drop-logo"
                            src={theme === 'dark' ? logoWhite : logoDark}
                            alt="Logo"
                        />
                    </div>
                    <div className="drop-text-large">Добавить файл / файлы</div>
                </div>
                <div className="drop-info-large">
                    Вы можете выбрать один или несколько файлов для конвертации, просто перенесите их в эту область
                </div>
            </div>

            <div className="dl-zone">
                <span className="dl-zone-label">Или скачайте из сети</span>
                <div className="dl-bar">
                    <div className={`dl-input-wrap${isUnsupported ? ' dl-input-wrap--error' : ''}${service ? ' dl-input-wrap--ok' : ''}`}>
                        <span className="dl-input-icon">{iconEl}</span>
                        <input
                            className="dl-input"
                            type="url"
                            placeholder="Вставьте ссылку (YouTube, TikTok, Twitter ...)"
                            value={url}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            disabled={isDownloading}
                            spellCheck={false}
                        />
                        {service && <span className="dl-service-label">{service.name}</span>}
                        <button
                            className="dl-btn"
                            onClick={handleDownload}
                            disabled={!trimmed || isDownloading || isUnsupported}
                        >
                            {isDownloading
                                ? <span className="dl-spinner" />
                                : <><i className="bi bi-cloud-arrow-down-fill" /><span>Скачать</span></>
                            }
                        </button>
                    </div>

                    {isUnsupported && !dlError && (
                        <span className="dl-hint">Сервис не поддерживается</span>
                    )}
                    {dlError && <span className="dl-hint dl-hint--error">{dlError}</span>}
                </div>
            </div>
        </div>
    )
}

export default SourcePage
