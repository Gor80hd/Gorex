import { useState, useMemo } from 'react'
import logoWhite from '../../assets/images/logo_white.svg'
import logoDark from '../../assets/images/logo.svg'
import { useLanguage } from '../../i18n'
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
    'tiktok.com':      { name: 'TikTok',       icon: 'bi-tiktok',          svgPath: 'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.27 8.27 0 0 0 4.84 1.55V6.79a4.85 4.85 0 0 1-1.07-.1z', color: '#ff0050' },
    'vt.tiktok.com':   { name: 'TikTok',       icon: 'bi-tiktok',          svgPath: 'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.27 8.27 0 0 0 4.84 1.55V6.79a4.85 4.85 0 0 1-1.07-.1z', color: '#ff0050' },
    'bilibili.com':    { name: 'Bilibili',     icon: 'bi-play-circle-fill',color: '#00a1d6' },
    'b23.tv':          { name: 'Bilibili',     icon: 'bi-play-circle-fill',color: '#00a1d6' },
    'ok.ru':           { name: 'OK',           icon: 'bi-person-circle',   color: '#f7931e' },
    'vk.com':          { name: 'VKontakte',    icon: 'bi-person-circle',   svgPath: 'M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.523-2.049-1.713-1.033-1.01-1.49-.9-1.49-.9 0 0-.127.1-.127.6v1.556c0 .4-.127.64-1.184.64-1.743 0-3.68-1.06-5.039-3.01C6.094 11.96 5.82 10 5.82 10H7.522s.107.488.32.96c.59 1.32 1.38 1.56 1.38 1.56.21 0 .21-1 .21-1V8.44c0-.5-.19-.66-.19-.66h-.3c-.16 0-.16-.1-.16-.1 0 0 .06-1.26 2.63-1.26 1.48 0 1.48.55 1.48 1.02v2.5c0 .085 0 .65.29.65.194 0 .5-.194 1.06-.82 1.04-1.34 1.55-2.74 1.55-2.74.194-.36.29-.42.29-.42.1-.03.19-.1.57-.1h1.77c.527 0 .527.27.39.53-.16.26-1.25 2.03-1.25 2.03-.67 1.24-.73 1.38.057 2.18.68.68 1.38 1.23 1.38 1.23.6.58.67 1.22.67 1.22z', color: '#4a76a8' },
    'vk.ru':           { name: 'VKontakte',    icon: 'bi-person-circle',   svgPath: 'M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.523-2.049-1.713-1.033-1.01-1.49-.9-1.49-.9 0 0-.127.1-.127.6v1.556c0 .4-.127.64-1.184.64-1.743 0-3.68-1.06-5.039-3.01C6.094 11.96 5.82 10 5.82 10H7.522s.107.488.32.96c.59 1.32 1.38 1.56 1.38 1.56.21 0 .21-1 .21-1V8.44c0-.5-.19-.66-.19-.66h-.3c-.16 0-.16-.1-.16-.1 0 0 .06-1.26 2.63-1.26 1.48 0 1.48.55 1.48 1.02v2.5c0 .085 0 .65.29.65.194 0 .5-.194 1.06-.82 1.04-1.34 1.55-2.74 1.55-2.74.194-.36.29-.42.29-.42.1-.03.19-.1.57-.1h1.77c.527 0 .527.27.39.53-.16.26-1.25 2.03-1.25 2.03-.67 1.24-.73 1.38.057 2.18.68.68 1.38 1.23 1.38 1.23.6.58.67 1.22.67 1.22z', color: '#4a76a8' },
    'vkvideo.ru':      { name: 'VK Видео',     icon: 'bi-person-circle',   svgPath: 'M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.523-2.049-1.713-1.033-1.01-1.49-.9-1.49-.9 0 0-.127.1-.127.6v1.556c0 .4-.127.64-1.184.64-1.743 0-3.68-1.06-5.039-3.01C6.094 11.96 5.82 10 5.82 10H7.522s.107.488.32.96c.59 1.32 1.38 1.56 1.38 1.56.21 0 .21-1 .21-1V8.44c0-.5-.19-.66-.19-.66h-.3c-.16 0-.16-.1-.16-.1 0 0 .06-1.26 2.63-1.26 1.48 0 1.48.55 1.48 1.02v2.5c0 .085 0 .65.29.65.194 0 .5-.194 1.06-.82 1.04-1.34 1.55-2.74 1.55-2.74.194-.36.29-.42.29-.42.1-.03.19-.1.57-.1h1.77c.527 0 .527.27.39.53-.16.26-1.25 2.03-1.25 2.03-.67 1.24-.73 1.38.057 2.18.68.68 1.38 1.23 1.38 1.23.6.58.67 1.22.67 1.22z', color: '#4a76a8' },
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
    const { t } = useLanguage()

    const trimmed = url.trim()
    const isUrl = isValidUrl(trimmed)
    const service = useMemo(() => detectService(trimmed), [trimmed])

    const handleDownload = async () => {
        if (!trimmed || isDownloading) return
        setDlError('')
        setDlHint('')
        setIsDownloading(true)
        try {
            await onDownload(trimmed, service)
            setUrl('')
        } catch (err) {
            setDlError(err?.message || t('dlErrorDefault'))
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
        iconEl = service.svgPath
            ? <svg viewBox="0 0 24 24" fill="currentColor" className="svc-svg-icon" style={{ color: service.color }} title={service.name}><path d={service.svgPath} /></svg>
            : <i className={`bi ${service.icon}`} style={{ color: service.color }} title={service.name} />
    } else {
        iconEl = <i className="bi bi-link-45deg dl-icon--placeholder" />
    }

    return (
        <div className="source-wrapper">
            <div className="dl-zone">
                <span className="dl-zone-label">{t('dlFromWeb')}</span>
                <div className="dl-bar">
                    <div className={`dl-input-wrap${service ? ' dl-input-wrap--ok' : ''}`}>
                        <span className="dl-input-icon">{iconEl}</span>
                        <input
                            className="dl-input"
                            type="url"
                            placeholder={t('dlPlaceholder')}
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
                            disabled={!trimmed || isDownloading || !isUrl}
                        >
                            {isDownloading
                                ? <span className="dl-spinner" />
                                : <><i className="bi bi-cloud-arrow-down-fill" /><span>{t('dlDownload')}</span></>
                            }
                        </button>
                    </div>

                    {dlError && <span className="dl-hint dl-hint--error">{dlError}</span>}
                </div>
            </div>

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
                    <div className="drop-text-large">{t('dropZoneTitle')}</div>
                </div>
                <div className="drop-info-large">
                    {t('dropZoneHint')}
                </div>
            </div>
        </div>
    )
}

export default SourcePage
