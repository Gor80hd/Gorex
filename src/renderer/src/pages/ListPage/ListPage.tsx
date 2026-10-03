import { useState, useEffect, useRef, useCallback, type MouseEvent, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import type { TaskId } from '../../queueState'
import type { VideoTask, TwitchVideo } from '../../domain'
import { errorMessage } from '../../domain'
import type { ListPageProps } from './types'
import { detectService, isValidUrl } from '../../features/queue/downloadServices'
import { isDownloadVideo, getTwitchVideoKey, formatTwitchPublishedAt, hostnameToColor, getTransformTags, buildFormatTags, buildYtdlFormatGroups, resolveYtdlFormat, buildTwitchQualityGroups, resolveTwitchQuality, getTwitchQualityLabel } from './listModel'
import { formatTime } from './TimeRangeSelector'
import VideoSettingsPanel, { VspToggle } from './VideoSettingsPanel'
import './ListPage.scss'
import GlobalSettings, { GsSelect, estimateOutputSize, CODEC_RF, ENCODER_PRESETS, WEBM_COMPATIBLE_ENCODERS, WEBM_COMPATIBLE_AUDIO, ENCODER_DISABLED_FORMATS, NO_CRF_ENCODERS, ALPHA_CAPABLE_ENCODERS, MULTI_PASS_ENCODERS, getEncoderGroupsForPlatform, getAudioFormatDefaults, getFormatOptionGroups, isAudioOnlyOutputFormat, isAudioCodecCompatibleWithFormat, normalizeEncoderSettings } from '../../components/GlobalSettings/GlobalSettings'
import { useLanguage } from '../../i18n'

function FaviconImg({ url, className }: { url?: string; className?: string }) {
    const [failed, setFailed] = useState(false)
    let hostname = ''
    try { hostname = new URL(url || '').hostname } catch { return <i className="bi bi-globe2" style={{ opacity: 0.5 }} /> }
    if (failed) return <i className="bi bi-globe2" style={{ opacity: 0.5 }} />
    return (
        <img
            src={`https://icons.duckduckgo.com/ip3/${hostname}.ico`}
            onError={() => setFailed(true)}
            className={className || 'dl-favicon-img'}
            alt=""
        />
    )
}

function ListPage({
    videos, settings, isEncoding, theme,
    onSettingsChange, onStartEncoding, onStop,
    outputMode, customOutputDir, defaultOutputDir, onOutputModeChange,
    onAddFiles, onDownload, onRemoveVideo, onClearQueue, onRenameOutput, onVideoSettingsChange,
    onYtdlFormatChange, onYtdlConvertToggle, onYtdlConversionSettings, onYtdlClipChange, onYtdlOptionsChange,
    twitchChannelPicker, onTwitchAddChannelVideos, onTwitchCloseChannelPicker, onTwitchOpenChat, onTwitchConvertToggle, onTwitchQualityChange,
    onLocalClipChange,
    isDraggingOnList, onListDragEnter, onListDragLeave, onListDragOver, onListDrop,
    gpuVendor, systemPlatform, encodingStartTime, onOpenSettings, onOpenOutputLocation
}: ListPageProps) {
    const [editingId, setEditingId] = useState<TaskId | null>(null)
    const [editingValue, setEditingValue] = useState('')
    const [editingVideoId, setEditingVideoId] = useState<TaskId | null>(null)
    const [tickNow, setTickNow] = useState(Date.now())
    const [addUrl, setAddUrl] = useState('')
    const [isAddingUrl, setIsAddingUrl] = useState(false)
    const [addUrlError, setAddUrlError] = useState('')
    const { t } = useLanguage()
    const urlInputRef = useRef<HTMLInputElement>(null)
    const [urlCtxMenu, setUrlCtxMenu] = useState<{ x: number; y: number } | null>(null)
    const [selectedTwitchVideos, setSelectedTwitchVideos] = useState<Set<string>>(() => new Set())

    useEffect(() => {
        setSelectedTwitchVideos(new Set())
    }, [twitchChannelPicker])

    // Close context menu on outside click / scroll
    useEffect(() => {
        if (!urlCtxMenu) return
        const close = () => setUrlCtxMenu(null)
        window.addEventListener('mousedown', close)
        window.addEventListener('scroll', close)
        return () => {
            window.removeEventListener('mousedown', close)
            window.removeEventListener('scroll', close)
        }
    }, [urlCtxMenu])

    const handleUrlContextMenu = useCallback((e: MouseEvent<HTMLInputElement>) => {
        e.preventDefault()
        setUrlCtxMenu({ x: e.clientX, y: e.clientY })
    }, [])

    const handleUrlCtxCut = useCallback(() => {
        const el = urlInputRef.current
        if (!el) return
        const s = el.selectionStart ?? 0
        const e = el.selectionEnd ?? s
        const text = el.value.substring(s, e)
        if (text) {
            navigator.clipboard.writeText(text)
            const next = el.value.slice(0, s) + el.value.slice(e)
            setAddUrl(next)
            setAddUrlError('')
            requestAnimationFrame(() => el.setSelectionRange(s, s))
        }
        setUrlCtxMenu(null)
    }, [])

    const handleUrlCtxCopy = useCallback(() => {
        const el = urlInputRef.current
        if (!el) return
        const s = el.selectionStart ?? 0
        const e = el.selectionEnd ?? s
        const text = el.value.substring(s, e)
        if (text) navigator.clipboard.writeText(text)
        setUrlCtxMenu(null)
    }, [])

    const handleUrlCtxPaste = useCallback(async () => {
        setUrlCtxMenu(null)
        try {
            const text = await navigator.clipboard.readText()
            const el = urlInputRef.current
            if (!el || !text) return
            const s = el.selectionStart ?? 0
        const e = el.selectionEnd ?? s
            const next = el.value.slice(0, s) + text + el.value.slice(e)
            setAddUrl(next)
            setAddUrlError('')
            requestAnimationFrame(() => el.setSelectionRange(s + text.length, s + text.length))
        } catch { /* permission denied */ }
    }, [])

    const handleUrlCtxSelectAll = useCallback(() => {
        if (urlInputRef.current) urlInputRef.current.select()
        setUrlCtxMenu(null)
    }, [])

    const handleUrlPasteBtn = useCallback(async () => {
        try {
            const text = await navigator.clipboard.readText()
            if (text) { setAddUrl(text); setAddUrlError('') }
        } catch { /* permission denied */ }
    }, [])

    useEffect(() => {
        if (!isEncoding) return
        const timer = setInterval(() => setTickNow(Date.now()), 1000)
        return () => clearInterval(timer)
    }, [isEncoding])

    const startEdit = (v: VideoTask) => {
        setEditingId(v.id)
        setEditingValue(v.outputName || v.title)
    }

    const commitEdit = (id: TaskId) => {
        const trimmed = editingValue.trim()
        if (trimmed) onRenameOutput(id, trimmed)
        setEditingId(null)
    }

    const handleEditKeyDown = (e: KeyboardEvent<HTMLInputElement>, id: TaskId) => {
        if (e.key === 'Enter') commitEdit(id)
        if (e.key === 'Escape') setEditingId(null)
    }

    const addUrlTrimmed = addUrl.trim()
    const addUrlService = detectService(addUrlTrimmed)
    const addUrlHasValue = addUrlTrimmed.length > 0
    const addUrlValid = addUrlHasValue && isValidUrl(addUrlTrimmed)

    const handleAddUrl = async () => {
        if (!addUrlTrimmed || isAddingUrl || !addUrlValid || !onDownload) return
        setAddUrlError('')
        setIsAddingUrl(true)
        try {
            await onDownload(addUrlTrimmed, addUrlService)
            setAddUrl('')
        } catch (err) {
            setAddUrlError(errorMessage(err) || t('error'))
        } finally {
            setIsAddingUrl(false)
        }
    }

    const handleTopAddAction = () => {
        if (isEncoding || isAddingUrl) return
        if (!addUrlHasValue) {
            onAddFiles?.()
            return
        }
        if (!addUrlValid) {
            setAddUrlError(t('invalidUrl'))
            return
        }
        handleAddUrl()
    }

    const twitchChannelItems = twitchChannelPicker?.videos || []
    const selectedTwitchItems = twitchChannelItems.filter(item => selectedTwitchVideos.has(getTwitchVideoKey(item)))
    const toggleTwitchVideoSelection = useCallback((item: TwitchVideo) => {
        const key = getTwitchVideoKey(item)
        if (!key || isEncoding) return
        setSelectedTwitchVideos(prev => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }, [isEncoding])
    const handleSelectAllTwitch = useCallback(() => {
        if (isEncoding) return
        setSelectedTwitchVideos(new Set(twitchChannelItems.map(getTwitchVideoKey).filter(Boolean)))
    }, [isEncoding, twitchChannelItems])
    const handleClearTwitchSelection = useCallback(() => setSelectedTwitchVideos(new Set()), [])
    const handleAddSelectedTwitch = useCallback(() => {
        if (!selectedTwitchItems.length || isEncoding) return
        onTwitchAddChannelVideos?.(selectedTwitchItems)
        setSelectedTwitchVideos(new Set())
    }, [isEncoding, onTwitchAddChannelVideos, selectedTwitchItems])

    const customCount = videos.filter(v => !isDownloadVideo(v) && v.customSettings).length
    const regularCount = videos.filter(v => !isDownloadVideo(v)).length
    const globalCount = regularCount - customCount
    const downloadCount = videos.filter(isDownloadVideo).length

    const hasOnlyDownloads = videos.length > 0 && videos.every(isDownloadVideo)
    const hasRegular = videos.some(v => !isDownloadVideo(v))
    const hasDownloads = videos.some(isDownloadVideo)
    const globalSettingsActive =
        videos.some(v => !isDownloadVideo(v) && !v.customSettings) ||
        videos.some(v => isDownloadVideo(v) && v.convertAfterDownload && !v.conversionSettings)
    const allReady = videos.every(v =>
        isDownloadVideo(v) ? ['format_select', 'error'].includes(v.status) : ['ready', 'done', 'error'].includes(v.status)
    )

    const startBtnLabel = hasOnlyDownloads ? t('btnDownload') : hasDownloads ? t('btnStart') : t('btnConvert')

    const editingVideo = editingVideoId !== null ? videos.find(v => v.id === editingVideoId) : null

    return (
        <>
        <div className="video-list-container">
            <div className="video-list-header">
                <div className="video-list-topbar">
                    <div className={`list-url-bar${addUrlValid ? ' list-url-bar--favicon' : ''}`}>
                        <span className="list-url-icon">
                            {isAddingUrl
                                ? <span className="list-url-spinner" />
                                : addUrlValid
                                    ? <FaviconImg url={addUrlTrimmed} />
                                    : <i className="bi bi-link-45deg" style={{ opacity: 0.35 }} />
                            }
                        </span>
                        <input
                            ref={urlInputRef}
                            className="list-url-input"
                            type="url"
                            placeholder={t('urlPlaceholder')}
                            value={addUrl}
                            onChange={e => { setAddUrl(e.target.value); setAddUrlError('') }}
                            onKeyDown={e => e.key === 'Enter' && handleAddUrl()}
                            onContextMenu={handleUrlContextMenu}
                            disabled={isAddingUrl || isEncoding}
                            spellCheck={false}
                        />
                        {addUrlService && <span className="list-url-svc">{addUrlService.name}</span>}
                        <button
                            className="list-url-paste-btn"
                            onClick={handleUrlPasteBtn}
                            title={t('dlPasteTip')}
                            tabIndex={-1}
                            disabled={isAddingUrl || isEncoding}
                            type="button"
                        >
                            <i className="bi bi-clipboard" />
                        </button>
                    </div>
                    <button
                        className={`add-button${addUrlHasValue ? ' add-button--url' : ''}${addUrlHasValue && !addUrlValid ? ' add-button--invalid' : ''}`}
                        onClick={handleTopAddAction}
                        disabled={isEncoding || isAddingUrl}
                        title={addUrlHasValue ? t('addUrlTitle') : t('addFilesTitle')}
                    >
                        {isAddingUrl
                            ? <span className="list-url-spinner" />
                            : <i className={`bi ${addUrlHasValue ? 'bi-arrow-right' : 'bi-plus-lg'}`}></i>
                        }
                    </button>                    <button
                        className="add-button clear-button"
                        onClick={onClearQueue}
                        disabled={isEncoding}
                        title={t('clearQueueTitle')}
                    >
                        <i className="bi bi-trash3"></i>
                    </button>
                </div>
                {addUrlError && <div className="list-url-error">{addUrlError}</div>}
            </div>

            <div
                className={`video-list-drop-zone ${isDraggingOnList ? 'dragging' : ''}`}
                onDragEnter={onListDragEnter}
                onDragLeave={onListDragLeave}
                onDragOver={onListDragOver}
                onDrop={onListDrop}
            >
                <div className={`video-list-scroll ${isDraggingOnList ? 'blurred' : ''}`}>
                    {twitchChannelPicker && (
                        <section className={`twitch-channel-picker ${theme}`}>
                            <div className="twitch-channel-picker__head">
                                <div>
                                    <div className="twitch-channel-picker__title">
                                        <i className="bi bi-twitch"></i>
                                        {t('twitchChannelVideosTitle')}: {twitchChannelPicker.displayName || twitchChannelPicker.channel}
                                    </div>
                                    <div className="twitch-channel-picker__meta">
                                        {twitchChannelItems.length
                                            ? t('twitchChannelVideosFound').replace('{count}', String(twitchChannelItems.length))
                                            : t('twitchChannelVideosEmpty')}
                                    </div>
                                </div>
                                <div className="twitch-channel-picker__actions">
                                    <button type="button" onClick={handleSelectAllTwitch} disabled={!twitchChannelItems.length || isEncoding}>
                                        {t('twitchChannelSelectAll')}
                                    </button>
                                    <button type="button" onClick={handleClearTwitchSelection} disabled={!selectedTwitchVideos.size || isEncoding}>
                                        {t('twitchChannelClearSelection')}
                                    </button>
                                    <button type="button" onClick={onTwitchCloseChannelPicker} disabled={isEncoding} title={t('twitchChannelClose')}>
                                        <i className="bi bi-x-lg"></i>
                                    </button>
                                </div>
                            </div>
                            {twitchChannelItems.length > 0 ? (
                                <div className="twitch-channel-grid">
                                    {twitchChannelItems.map(item => {
                                        const key = getTwitchVideoKey(item)
                                        const checked = selectedTwitchVideos.has(key)
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                className={`twitch-channel-card${checked ? ' selected' : ''}`}
                                                onClick={() => toggleTwitchVideoSelection(item)}
                                                disabled={isEncoding}
                                                title={item.title}
                                            >
                                                <span className="twitch-channel-card__check">
                                                    <i className={`bi ${checked ? 'bi-check-lg' : 'bi-plus-lg'}`}></i>
                                                </span>
                                                <span className="twitch-channel-card__thumb">
                                                    {item.thumbnail
                                                        ? <img src={item.thumbnail} alt="" />
                                                        : <i className="bi bi-film"></i>
                                                    }
                                                </span>
                                                <span className="twitch-channel-card__body">
                                                    <span className="twitch-channel-card__title">{item.title}</span>
                                                    <span className="twitch-channel-card__tags">
                                                        {item.duration && <span><i className="bi bi-clock"></i>{item.duration}</span>}
                                                        {formatTwitchPublishedAt(item.publishedAt) && <span><i className="bi bi-calendar3"></i>{formatTwitchPublishedAt(item.publishedAt)}</span>}
                                                        {item.viewCount ? <span><i className="bi bi-eye"></i>{item.viewCount}</span> : null}
                                                    </span>
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="twitch-channel-empty">{t('twitchChannelVideosEmpty')}</div>
                            )}
                            <div className="twitch-channel-picker__footer">
                                <span>{t('twitchChannelSelected').replace('{count}', String(selectedTwitchItems.length))}</span>
                                <button
                                    type="button"
                                    className="twitch-channel-add"
                                    onClick={handleAddSelectedTwitch}
                                    disabled={!selectedTwitchItems.length || isEncoding}
                                >
                                    <i className="bi bi-plus-circle"></i>
                                    {t('twitchChannelAddSelected')}
                                </button>
                            </div>
                        </section>
                    )}
                    {videos.map(v => {
                        const isActive = ['encoding', 'downloading', 'downloading-subs', 'probing-keyframes', 'cutting-sponsors', 'converting'].includes(v.status)
                        const downloadUrl = v.ytdlUrl || v.twitchUrl || ''
                        const isDownload = isDownloadVideo(v)
                        const unknownHost = (!v.downloadService && isDownload && downloadUrl)
                            ? (() => { try { return new URL(downloadUrl).hostname } catch { return null } })()
                            : null
                        const unknownColor = unknownHost ? hostnameToColor(unknownHost) : null
                        const accentColor = v.downloadService?.color ?? unknownColor
                        const hasCustomSettings = v.customSettings || (isDownload && v.conversionSettings)
                        return (
                        <div
                            key={v.id}
                            className={`video-item ${v.status} ${theme}${hasCustomSettings ? ' has-custom-settings' : ''}`}
                            style={{
                                ...(accentColor ? {
                                    borderColor: `color-mix(in srgb, ${accentColor} 40%, transparent)`,
                                    background: `color-mix(in srgb, ${accentColor} 8%, transparent)`
                                } : {}),
                                ...(!isEncoding && !isActive ? { cursor: 'pointer' } : {})
                            }}
                            onClick={() => !isEncoding && !isActive && setEditingVideoId(v.id)}
                        >
                            <div className="video-thumbnail">
                                {v.thumbnail
                                    ? <img src={v.thumbnail} alt="Thumbnail" />
                                    : <div className="video-thumb-placeholder"><i className="bi bi-film"></i></div>
                                }
                                {isActive && (
                                    <div className="encoding-overlay">
                                        <div className="spinner"></div>
                                    </div>
                                )}
                            </div>
                            <div className="video-info">
                                <div className="video-title-row">
                                    {isDownload && downloadUrl && (
                                        <span className="svc-icon-tag svc-icon-tag--favicon" title={v.downloadService?.name ?? unknownHost ?? undefined}>
                                            <FaviconImg url={downloadUrl} className="dl-favicon-img" />
                                        </span>
                                    )}
                                    <div className="video-title">{v.title}</div>
                                    {hasCustomSettings && (
                                        <span className="vtag custom-tag">
                                            <i className="bi bi-sliders2"></i>
                                            {t('indCustomTag')}
                                        </span>
                                    )}
                                    {!isEncoding && !isActive && (
                                        editingId === v.id
                                            ? <input
                                                className="output-name-input"
                                                value={editingValue}
                                                autoFocus
                                                onChange={e => setEditingValue(e.target.value)}
                                                onBlur={() => commitEdit(v.id)}
                                                onKeyDown={e => handleEditKeyDown(e, v.id)}
                                                onClick={e => e.stopPropagation()}
                                            />
                                            : <button
                                                className="rename-btn rename-btn--icon"
                                                onClick={e => { e.stopPropagation(); startEdit(v) }}
                                                title={t('renameFileTitle')}
                                                aria-label={t('renameFileTitle')}
                                            >
                                                <i className="bi bi-pencil"></i>
                                            </button>
                                    )}
                                </div>
                                <div className="video-tags">
                                    {v.isTwitchItem && <span className="vtag fmt twitch-tag"><i className="bi bi-twitch"></i>{v.twitchType === 'clip' ? 'Twitch Clip' : 'Twitch VOD'}</span>}
                                    {v.channel && <span className="vtag"><i className="bi bi-person-video2"></i>{v.channel}</span>}
                                    {v.container && <span className="vtag fmt"><i className="bi bi-file-earmark-play"></i>{v.container}</span>}
                                    {v.resolution && <span className="vtag"><i className="bi bi-aspect-ratio"></i>{v.resolution}</span>}
                                    {v.videoCodec && <span className="vtag"><i className="bi bi-cpu"></i>{v.videoCodec}</span>}
                                    {v.fps && <span className="vtag"><i className="bi bi-camera-video"></i>{v.fps} fps</span>}
                                    {v.audioCodec && <span className="vtag audio"><i className="bi bi-music-note"></i>{v.audioCodec}</span>}
                                    {v.channels && <span className="vtag audio"><i className="bi bi-speaker"></i>{v.channels}</span>}
                                    {v.bitrate && <span className="vtag bitrate"><i className="bi bi-speedometer2"></i>{v.bitrate}</span>}
                                    {v.duration && <span className="vtag duration"><i className="bi bi-clock"></i>{v.duration}</span>}
                                </div>

                                {/* ── yt-dlp inline controls ── */}
                                {v.isYtdlItem && v.status !== 'done' && ((
                                    () => {
                                        const inlineGroups = buildYtdlFormatGroups(v.ytdlFormats, t)
                                        const resolvedFmt = resolveYtdlFormat(v.ytdlSelectedFormat, inlineGroups)
                                        const selFmt = (v.ytdlFormats || []).find(f => f.format_id === resolvedFmt)
                                        const fmtTags = selFmt ? buildFormatTags(selFmt) : []
                                        const convTags = v.convertAfterDownload
                                            ? getTransformTags(v, v.conversionSettings || settings, t)
                                            : []
                                        return (
                                            <div className="ytdl-controls">
                                                <div className="ytdl-format-row">
                                                    <i className="bi bi-cloud-arrow-down ytdl-icon"></i>
                                                    <span className="ytdl-label">{t('ytdlFormatLabel')}</span>
                                                    <span onClick={e => e.stopPropagation()}>
                                                        <GsSelect
                                                            className="ytdl-format-gs"
                                                            groups={inlineGroups}
                                                            value={resolvedFmt}
                                                            onChange={val => onYtdlFormatChange(v.id, val)}
                                                            disabled={isEncoding}
                                                            direction="down"
                                                        />
                                                    </span>
                                                    <span onClick={e => e.stopPropagation()}>
                                                        <VspToggle
                                                            value={!!v.convertAfterDownload}
                                                            onChange={val => onYtdlConvertToggle(v.id, val)}
                                                            disabled={isEncoding}
                                                        />
                                                    </span>
                                                    <span className="ytdl-label">{t('ytdlConvertLabel')}</span>
                                                </div>
                                                {(fmtTags.length > 0 || convTags.length > 0) && (
                                                    <span className="ytdl-fmt-tags">
                                                        {fmtTags.map(tag => (
                                                            <span key={tag.key} className={`vtag transform-tag ${tag.cls}`}>
                                                                <i className={`bi ${tag.icon}`}></i>{tag.label}
                                                            </span>
                                                        ))}
                                                        {convTags.length > 0 && (
                                                            <>
                                                                <span className="vtag-arrow"><i className="bi bi-arrow-right-short"></i></span>
                                                                {convTags.map(tag => (
                                                                    <span key={tag.key} className={`vtag transform-tag ${tag.cls}`}>
                                                                        <i className={`bi ${tag.icon}`}></i>{tag.label}
                                                                    </span>
                                                                ))}
                                                            </>
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        )
                                    }
                                )())}

                                {/* ── Twitch inline controls ── */}
                                {v.isTwitchItem && v.status !== 'done' && (() => {
                                    const qualityGroups = buildTwitchQualityGroups(v, t)
                                    const resolvedQuality = resolveTwitchQuality(v.twitchQuality, qualityGroups)
                                    const qualityLabel = getTwitchQualityLabel(resolvedQuality, qualityGroups)
                                    const convTags = v.convertAfterDownload
                                        ? getTransformTags(v, v.conversionSettings || settings, t)
                                        : []
                                    return (
                                        <div className="ytdl-controls twitch-controls" onClick={e => e.stopPropagation()}>
                                            <div className="ytdl-format-row">
                                                <i className="bi bi-twitch ytdl-icon"></i>
                                                <span className="ytdl-label">{t('twitchQualityLabel')}</span>
                                                <span onClick={e => e.stopPropagation()}>
                                                    <GsSelect
                                                        className="ytdl-format-gs twitch-quality-gs"
                                                        groups={qualityGroups}
                                                        value={resolvedQuality}
                                                        onChange={val => onTwitchQualityChange?.(v.id, val)}
                                                        disabled={isEncoding}
                                                        direction="down"
                                                    />
                                                </span>
                                                <span onClick={e => e.stopPropagation()}>
                                                    <VspToggle
                                                        value={!!v.convertAfterDownload}
                                                        onChange={val => (onTwitchConvertToggle || onYtdlConvertToggle)?.(v.id, val)}
                                                        disabled={isEncoding}
                                                    />
                                                </span>
                                                <span className="ytdl-label">{t('twitchConvertLabel')}</span>
                                                {v.twitchType !== 'clip' && (
                                                    <button
                                                        type="button"
                                                        className="twitch-chat-btn"
                                                        onClick={e => { e.stopPropagation(); onTwitchOpenChat?.(v) }}
                                                        disabled={isEncoding}
                                                    >
                                                        <i className="bi bi-chat-left-text"></i>
                                                        {t('twitchChatButton')}
                                                    </button>
                                                )}
                                            </div>
                                            {(qualityLabel || convTags.length > 0) && (
                                                <span className="ytdl-fmt-tags">
                                                    {qualityLabel && (
                                                        <span className="vtag transform-tag tr-res">
                                                            <i className="bi bi-aspect-ratio"></i>{qualityLabel}
                                                        </span>
                                                    )}
                                                    {convTags.length > 0 && (
                                                        <>
                                                            <span className="vtag-arrow"><i className="bi bi-arrow-right-short"></i></span>
                                                            {convTags.map(tag => (
                                                                <span key={tag.key} className={`vtag transform-tag ${tag.cls}`}>
                                                                    <i className={`bi ${tag.icon}`}></i>{tag.label}
                                                                </span>
                                                            ))}
                                                        </>
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    )
                                })()}
                                {/* ── conversion transform tags (non-download only; download conversion is handled inline) ── */}
                                {(!isDownload || (isDownload && v.convertAfterDownload && v.status === 'done')) && (() => {
                                    const effectiveSettings = isDownload
                                        ? (v.conversionSettings || settings)
                                        : (v.customSettings || settings)
                                    const transformTags = getTransformTags(v, effectiveSettings, t)
                                    if (!transformTags.length) return null
                                    return (
                                        <div className="video-transform-tags">
                                            <span className="vtag-arrow"><i className="bi bi-arrow-right-short"></i></span>
                                            {transformTags.map(t => (
                                                <span key={t.key} className={`vtag transform-tag ${t.cls}`}>
                                                    <i className={`bi ${t.icon}`}></i>{t.label}
                                                </span>
                                            ))}
                                        </div>
                                    )
                                })()}
                                <div className="video-progress">
                                    <div className="progress-bar-bg">
                                        <div
                                            className={`progress-bar-fill${v.status === 'downloading' || v.status === 'downloading-subs' || v.status === 'probing-keyframes' || v.status === 'cutting-sponsors' ? ' progress-bar-fill--download' : v.status === 'converting' ? ' progress-bar-fill--convert' : ''}`}
                                            style={{ width: `${v.progress}%` }}
                                        ></div>
                                    </div>
                                    <span className="progress-text">
                                        {v.status === 'downloading' ? `↓ ${v.progress.toFixed(1)}%` :
                                         v.status === 'downloading-subs' ? `↓ CC ${v.progress.toFixed(1)}%` :
                                         v.status === 'probing-keyframes' ? `◎ KF` :
                                         v.status === 'cutting-sponsors' ? `✂ SB ${v.progress.toFixed(1)}%` :
                                         v.status === 'converting' ? `⚙ ${v.progress.toFixed(1)}%` :
                                         `${v.progress.toFixed(1)}%`}
                                    </span>
                                </div>
                                {(v.status === 'encoding' || v.status === 'downloading' || v.status === 'downloading-subs' || v.status === 'probing-keyframes' || v.status === 'cutting-sponsors' || v.status === 'converting') && v.startTime && (
                                    <div className="video-time-info">
                                        <span className="vtime elapsed">
                                            <i className="bi bi-clock-history"></i>
                                            {formatTime((tickNow - (v.startTime || tickNow)) / 1000)}
                                        </span>
                                        {v.progress > 0.5 && (
                                            <span className="vtime remaining">
                                                <i className="bi bi-hourglass-split"></i>
                                                ~{formatTime((tickNow - (v.startTime || tickNow)) / 1000 * (100 - v.progress) / v.progress)}
                                            </span>
                                        )}
                                    </div>
                                )}
                                {v.status === 'done' && v.startTime && v.endTime && (
                                    <div className="video-time-info done">
                                        <span className="vtime done">
                                            <i className="bi bi-check2-circle"></i>
                                            {formatTime((v.endTime - v.startTime) / 1000)}
                                        </span>
                                    </div>
                                )}
                                {v.status === 'error' && v.startTime && v.endTime && (
                                    <div className="video-time-info error">
                                        <span className="vtime error">
                                            <i className="bi bi-exclamation-circle"></i>
                                            {formatTime((v.endTime - v.startTime) / 1000)}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="video-size">
                                {v.status === 'done'
                                    ? <i className="bi bi-check-circle-fill success"></i>
                                    : v.status === 'error'
                                        ? <i className="bi bi-x-circle-fill error-icon"></i>
                                        : (() => {
                                        if (isDownload) return null
                                        const effectiveSettings = v.customSettings || settings
                                        const estimated = v.status !== 'encoding'
                                            ? estimateOutputSize(v, effectiveSettings)
                                            : null
                                        const hasEst = !!estimated
                                        return (
                                            <div className={`size-display${hasEst ? ' has-estimate' : ''}`}>
                                                <span className="sv-source">{v.size}</span>
                                                <div className="sv-row">
                                                    <i className="bi bi-arrow-right sv-arrow"></i>
                                                    <span className="sv-estimated">{estimated || ''}</span>
                                                </div>
                                            </div>
                                        )
                                    })()
                                }
                                {v.status === 'done' && v.outputPath && (
                                    <button
                                        className="open-output-btn"
                                        onClick={e => { e.stopPropagation(); onOpenOutputLocation?.(v.outputPath || '') }}
                                        title={t('openOutputFolderTitle')}
                                    >
                                        <i className="bi bi-folder2-open"></i>
                                    </button>
                                )}
                                {v.status !== 'encoding' && v.status !== 'downloading' && v.status !== 'downloading-subs' && v.status !== 'probing-keyframes' && v.status !== 'cutting-sponsors' && v.status !== 'converting' && !isEncoding && (
                                    <button
                                        className="delete-video-btn"
                                        onClick={e => { e.stopPropagation(); onRemoveVideo(v.id) }}
                                    >
                                        <i className="bi bi-trash3"></i>
                                    </button>
                                )}
                            </div>
                        </div>
                        )
                    })}
                </div>
                {isDraggingOnList && (
                    <div className="list-drop-overlay">
                        <div className="list-drop-inner">
                            <i className="bi bi-plus-circle"></i>
                            <span>{t('addToQueueLabel')}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="list-bottom-panel">
                {/* Header adapts to content type */}
                <div className="list-bottom-header">
                    <span className="list-bottom-title">
                        {hasOnlyDownloads
                            ? t('downloadSettings')
                            : hasDownloads
                                ? t('globalConvSettings')
                                : t('globalConvSettings')}
                    </span>
                </div>

                {/* Global conversion settings — always visible; dimmed when no video is set for conversion or when encoding */}
                <div className={`gs-section${(!globalSettingsActive || isEncoding) ? ' gs-section--dimmed' : ''}`}>
                    <GlobalSettings
                        settings={settings}
                        onChange={onSettingsChange}
                        videos={videos.filter(v => !isDownloadVideo(v))}
                        disabled={isEncoding || !globalSettingsActive}
                        gpuVendor={gpuVendor}
                        systemPlatform={systemPlatform}
                    />
                </div>

                {/* Notice when mixed queue */}
                {hasRegular && hasDownloads && (
                    <div className="ytdl-global-notice">
                        <i className="bi bi-info-circle-fill"></i>
                        {downloadCount} {t('mixedQueueNotice')}
                    </div>
                )}

                <div className="list-bottom-actions">
                    <div className="list-output-section">
                        <div className="list-output-top">
                            <span className="list-output-label">
                                {hasOnlyDownloads ? t('downloadFolder') : t('saveFolder')}
                            </span>
                            {!hasOnlyDownloads && (
                                <GsSelect
                                    value={outputMode}
                                    options={[
                                        { value: 'default', label: t('outputDefault') },
                                        { value: 'custom',  label: t('outputCustom') },
                                        { value: 'source',  label: t('outputSource') },
                                    ]}
                                    onChange={mode => { if (mode === 'default' || mode === 'source' || mode === 'custom') void onOutputModeChange(mode) }}
                                    disabled={isEncoding}
                                    className="list-output-mode-dropdown"
                                />
                            )}
                        </div>
                        <div className="list-output-path-row">
                            <div className="list-output-path-display">
                                {outputMode === 'custom'
                                    ? (customOutputDir || t('downloadsFolderDefault'))
                                    : outputMode === 'source'
                                        ? t('outputSourcePath')
                                        : (defaultOutputDir || t('downloadsFolderDefault'))}
                            </div>
                            <button
                                className="list-folder-btn"
                                onClick={() => onOutputModeChange('custom')}
                                disabled={isEncoding}
                                title="Выбрать папку"
                            >
                                <i className="bi bi-folder2-open"></i>
                            </button>
                        </div>
                    </div>

                    <button
                        className="start-button"
                        onClick={onStartEncoding}
                        disabled={isEncoding}
                        style={isEncoding ? { display: 'none' } : {}}
                    >
                        {startBtnLabel}
                        <i className="bi bi-arrow-right"></i>
                    </button>
                    {isEncoding && (
                        <button
                            className="stop-button"
                            onClick={onStop}
                        >
                            СТОП
                            <i className="bi bi-stop-fill"></i>
                        </button>
                    )}
                </div>

                <div className="list-bottom-status">
                    <span>
                        {hasDownloads && (
                            <><i className="bi bi-cloud-arrow-down"></i>&nbsp;<b>{downloadCount}</b>&nbsp;{t('countDownloads')}</>
                        )}
                        {hasDownloads && hasRegular && <>&nbsp;&nbsp;·&nbsp;&nbsp;</>}
                        {hasRegular && globalCount > 0 && (
                            <><i className="bi bi-globe2"></i>&nbsp;<b>{globalCount}</b>&nbsp;{globalCount === 1 ? t('countInQueue1') : globalCount < 5 ? t('countInQueue234') : t('countInQueueMany')} {t('countByGlobal')}</>
                        )}
                        {hasRegular && globalCount > 0 && customCount > 0 && <>&nbsp;&nbsp;·&nbsp;&nbsp;</>}
                        {hasRegular && customCount > 0 && (
                            <><i className="bi bi-sliders2"></i>&nbsp;<b>{customCount}</b>&nbsp;{customCount === 1 ? t('countInQueue1') : customCount < 5 ? t('countInQueue234') : t('countInQueueMany')} {t('countByCustom')}</>
                        )}
                        {videos.some(v => v.status === 'done') && (
                            <>&nbsp;&nbsp;·&nbsp;&nbsp;{videos.filter(v => v.status === 'done').length} {t('countDone')}</>
                        )}
                        {isEncoding && encodingStartTime && (() => {
                            const elapsed = (tickNow - encodingStartTime) / 1000
                            const encVideos = videos.filter(v => v.status === 'encoding' && v.startTime && v.progress > 0.5)
                            const eta = encVideos.length
                                ? encVideos.reduce((max, v) => {
                                    const ve = (tickNow - (v.startTime || tickNow)) / 1000
                                    return Math.max(max, ve * (100 - v.progress) / v.progress)
                                }, 0)
                                : null
                            return (
                                <span className="global-time-info">
                                    &nbsp;&nbsp;·&nbsp;&nbsp;
                                    <i className="bi bi-clock-history"></i>&nbsp;{formatTime(elapsed)}
                                    {eta !== null && <>&nbsp;&nbsp;<i className="bi bi-hourglass-split"></i>&nbsp;~{formatTime(eta)}</>}
                                </span>
                            )
                        })()}
                    </span>
                    <span>{videos.length} {videos.length === 1 ? t('countInQueue1') : videos.length < 5 ? t('countInQueue234') : t('countInQueueMany')}</span>
                </div>
            </div>

            {editingVideo && (
                <VideoSettingsPanel
                    video={editingVideo}
                    globalSettings={settings}
                    systemPlatform={systemPlatform}
                    onClose={() => setEditingVideoId(null)}
                    onSave={isDownloadVideo(editingVideo) ? onYtdlConversionSettings : onVideoSettingsChange}
                    onReset={(id) => isDownloadVideo(editingVideo) ? onYtdlConversionSettings(id, null) : onVideoSettingsChange(id, null)}
                    onYtdlFormatChange={onYtdlFormatChange}
                    onYtdlConvertToggle={onYtdlConvertToggle}
                    onYtdlClipChange={onYtdlClipChange}
                    onYtdlOptionsChange={onYtdlOptionsChange}
                    onLocalClipChange={onLocalClipChange}
                    onOpenSettings={onOpenSettings}
                />
            )}
        </div>
        {urlCtxMenu && createPortal(
            <ul
                className="dl-ctx-menu"
                style={{ top: urlCtxMenu.y, left: urlCtxMenu.x }}
                onMouseDown={e => e.stopPropagation()}
            >
                <li onClick={handleUrlCtxCut}><i className="bi bi-scissors" />{t('ctxCut')}</li>
                <li onClick={handleUrlCtxCopy}><i className="bi bi-copy" />{t('ctxCopy')}</li>
                <li onClick={handleUrlCtxPaste}><i className="bi bi-clipboard" />{t('ctxPaste')}</li>
                <li className="dl-ctx-divider" />
                <li onClick={handleUrlCtxSelectAll}><i className="bi bi-text-paragraph" />{t('ctxSelectAll')}</li>
            </ul>,
            document.body
        )}
        </>
    )
}

export default ListPage
