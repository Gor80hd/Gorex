import { useState, useMemo } from 'react'
import logoWhite from '../../assets/images/logo_white.svg'
import logoDark from '../../assets/images/logo.svg'
import { useLanguage } from '../../i18n'
import './SourcePage.scss'

// Supported services: hostname (without www.) → { name, color }
const SERVICE_MAP = {
    'youtube.com':     { name: 'YouTube',      color: '#ff0000' },
    'youtu.be':        { name: 'YouTube',      color: '#ff0000' },
    'twitter.com':     { name: 'Twitter / X',  color: '#ffffff' },
    'x.com':           { name: 'Twitter / X',  color: '#ffffff' },
    't.co':            { name: 'Twitter / X',  color: '#ffffff' },
    'instagram.com':   { name: 'Instagram',    color: '#e1306c' },
    'ddinstagram.com': { name: 'Instagram',    color: '#e1306c' },
    'reddit.com':      { name: 'Reddit',       color: '#ff4500' },
    'redd.it':         { name: 'Reddit',       color: '#ff4500' },
    'vimeo.com':       { name: 'Vimeo',        color: '#1ab7ea' },
    'soundcloud.com':  { name: 'SoundCloud',   color: '#ff5500' },
    'twitch.tv':       { name: 'Twitch',       color: '#9146ff' },
    'facebook.com':    { name: 'Facebook',     color: '#1877f2' },
    'fb.watch':        { name: 'Facebook',     color: '#1877f2' },
    'pinterest.com':   { name: 'Pinterest',    color: '#e60023' },
    'pin.it':          { name: 'Pinterest',    color: '#e60023' },
    'tumblr.com':      { name: 'Tumblr',       color: '#35465c' },
    'snapchat.com':    { name: 'Snapchat',     color: '#fffc00' },
    'tiktok.com':      { name: 'TikTok',       color: '#ff0050' },
    'vt.tiktok.com':   { name: 'TikTok',       color: '#ff0050' },
    'bilibili.com':    { name: 'Bilibili',     color: '#00a1d6' },
    'b23.tv':          { name: 'Bilibili',     color: '#00a1d6' },
    'ok.ru':           { name: 'OK',           color: '#f7931e' },
    'vk.com':          { name: 'VKontakte',    color: '#4a76a8' },
    'vk.ru':           { name: 'VKontakte',    color: '#4a76a8' },
    'vkvideo.ru':      { name: 'VK Видео',     color: '#4a76a8' },
    'rutube.ru':       { name: 'Rutube',       color: '#ff5c00' },
    'dailymotion.com': { name: 'Dailymotion',  color: '#0066dc' },
    'bsky.app':        { name: 'Bluesky',      color: '#0085ff' },
    'xiaohongshu.com': { name: 'Xiaohongshu',  color: '#ff2442' },
    'xhslink.com':     { name: 'Xiaohongshu',  color: '#ff2442' },
    'loom.com':        { name: 'Loom',         color: '#625df5' },
    'newgrounds.com':  { name: 'Newgrounds',   color: '#f6a623' },
    'streamable.com':  { name: 'Streamable',   color: '#41b883' },
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

function FaviconImg({ url, className }) {
    const [failed, setFailed] = useState(false)
    let hostname = ''
    try { hostname = new URL(url).hostname } catch { return <i className="bi bi-link-45deg dl-icon--placeholder" /> }
    if (failed) return <i className="bi bi-globe2 dl-icon--placeholder" />
    return (
        <img
            src={`https://icons.duckduckgo.com/ip3/${hostname}.ico`}
            onError={() => setFailed(true)}
            className={className || 'dl-favicon-img'}
            alt=""
        />
    )
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
    } else if (isUrl) {
        iconEl = <FaviconImg url={trimmed} />
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
