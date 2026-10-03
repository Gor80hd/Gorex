import type { DownloadService } from '../../domain'
import { detectService, isValidUrl } from '../../features/queue/downloadServices'
import { useState, useMemo, useRef, useEffect, useCallback, type DragEvent, type MouseEvent, type KeyboardEvent, type ChangeEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import logoWhite from '../../assets/images/logo_white.svg'
import logoDark from '../../assets/images/logo.svg'
import { useLanguage } from '../../i18n'
import './SourcePage.scss'

// Supported services: hostname (without www.) → { name, color }
interface SourcePageProps {
    theme: 'dark' | 'light'
    isDragging: boolean
    onSelectFiles: () => void | Promise<void>
    onDragOver: (event: DragEvent<HTMLDivElement>) => void
    onDragLeave: (event: DragEvent<HTMLDivElement>) => void
    onDrop: (event: DragEvent<HTMLDivElement>) => void
    onDownload: (url: string, service: DownloadService | null) => Promise<void>
    isLoading: boolean
}

function FaviconImg({ url, className }: { url: string; className?: string }) {
    const [failed, setFailed] = useState(false)
    useEffect(() => setFailed(false), [url])
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

function SourcePage({ theme, isDragging, onSelectFiles, onDragOver, onDragLeave, onDrop, onDownload, isLoading }: SourcePageProps) {
    const [url, setUrl] = useState('')
    const [isDownloading, setIsDownloading] = useState(false)
    const [dlError, setDlError] = useState('')
    const { t } = useLanguage()
    const inputRef = useRef<HTMLInputElement>(null)
    const downloadIdRef = useRef(0)
    const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null)

    const trimmed = url.trim()
    const isUrl = isValidUrl(trimmed)
    const service = useMemo(() => detectService(trimmed), [trimmed])

    // Close context menu on outside click or scroll
    useEffect(() => {
        if (!ctxMenu) return
        const close = () => setCtxMenu(null)
        window.addEventListener('mousedown', close)
        window.addEventListener('scroll', close)
        return () => {
            window.removeEventListener('mousedown', close)
            window.removeEventListener('scroll', close)
        }
    }, [ctxMenu])

    const handleContextMenu = useCallback((e: MouseEvent<HTMLInputElement>) => {
        e.preventDefault()
        setCtxMenu({ x: e.clientX, y: e.clientY })
    }, [])

    const handleCtxCut = useCallback(() => {
        const el = inputRef.current
        if (!el) return
        const s = el.selectionStart ?? 0
        const e = el.selectionEnd ?? s
        const text = el.value.substring(s, e)
        if (text) {
            navigator.clipboard.writeText(text)
            const next = el.value.slice(0, s) + el.value.slice(e)
            setUrl(next)
            setDlError('')
            requestAnimationFrame(() => { el.setSelectionRange(s, s) })
        }
        setCtxMenu(null)
    }, [])

    const handleCtxCopy = useCallback(() => {
        const el = inputRef.current
        if (!el) return
        const s = el.selectionStart ?? 0
        const e = el.selectionEnd ?? s
        const text = el.value.substring(s, e)
        if (text) navigator.clipboard.writeText(text)
        setCtxMenu(null)
    }, [])

    const handleCtxPaste = useCallback(async () => {
        setCtxMenu(null)
        try {
            const text = await navigator.clipboard.readText()
            const el = inputRef.current
            if (!el || !text) return
            const s = el.selectionStart ?? 0
            const e = el.selectionEnd ?? s
            const next = el.value.slice(0, s) + text + el.value.slice(e)
            setUrl(next)
            setDlError('')
            requestAnimationFrame(() => { el.setSelectionRange(s + text.length, s + text.length) })
        } catch { /* permission denied */ }
    }, [])

    const handleCtxSelectAll = useCallback(() => {
        const el = inputRef.current
        if (el) { el.select() }
        setCtxMenu(null)
    }, [])

    const handlePasteBtn = useCallback(async () => {
        try {
            const text = await navigator.clipboard.readText()
            if (text) {
                setUrl(text)
                setDlError('')
            }
        } catch { /* permission denied */ }
    }, [])

    const handleDownload = async () => {
        if (!trimmed || (isDownloading && isLoading)) return
        const myId = ++downloadIdRef.current
        setDlError('')
        setIsDownloading(true)
        try {
            await onDownload(trimmed, service)
            if (downloadIdRef.current === myId) setUrl('')
        } catch (err) {
            setDlError(err instanceof Error ? err.message : t('dlErrorDefault'))
        } finally {
            setIsDownloading(false)
        }
    }

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setUrl(e.target.value)
        setDlError('')
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleDownload()
    }

    let iconEl: ReactNode
    if (isDownloading && isLoading) {
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
                            ref={inputRef}
                            className="dl-input"
                            type="url"
                            placeholder={t('dlPlaceholder')}
                            value={url}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            onContextMenu={handleContextMenu}
                            disabled={isDownloading && isLoading}
                            spellCheck={false}
                        />
                        {service && <span className="dl-service-label">{service.name}</span>}
                        <button
                            className="dl-paste-btn"
                            onClick={handlePasteBtn}
                            title={t('dlPasteTip')}
                            tabIndex={-1}
                            disabled={isDownloading && isLoading}
                            type="button"
                        >
                            <i className="bi bi-clipboard" />
                        </button>
                        <button
                            className="dl-btn"
                            onClick={() => handleDownload()}
                            disabled={!trimmed || (isDownloading && isLoading) || !isUrl}
                        >
                            {isDownloading && isLoading
                                ? <span className="dl-spinner" />
                                : <><i className="bi bi-cloud-arrow-down-fill" /><span>{t('dlDownload')}</span></>
                            }
                        </button>
                    </div>

                    {dlError && <span className="dl-hint dl-hint--error">{dlError}</span>}
                </div>
            </div>

            {ctxMenu && createPortal(
                <ul
                    className="dl-ctx-menu"
                    style={{ top: ctxMenu.y, left: ctxMenu.x }}
                    onMouseDown={e => e.stopPropagation()}
                >
                    <li onClick={handleCtxCut}><i className="bi bi-scissors" />{t('ctxCut')}</li>
                    <li onClick={handleCtxCopy}><i className="bi bi-copy" />{t('ctxCopy')}</li>
                    <li onClick={handleCtxPaste}><i className="bi bi-clipboard" />{t('ctxPaste')}</li>
                    <li className="dl-ctx-divider" />
                    <li onClick={handleCtxSelectAll}><i className="bi bi-text-paragraph" />{t('ctxSelectAll')}</li>
                </ul>,
                document.body
            )}

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
