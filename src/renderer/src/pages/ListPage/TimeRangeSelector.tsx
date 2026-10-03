import { useState, useEffect, useRef, useCallback, type MouseEvent as ReactMouseEvent, type TouchEvent as ReactTouchEvent, type KeyboardEvent } from 'react'
import { useLanguage } from '../../i18n'
import type { Chapter } from '../../domain'
type PointerPositionEvent = MouseEvent | TouchEvent | ReactMouseEvent | ReactTouchEvent
interface TimeRangeProps {
    duration?: number; chapters?: Chapter[]; clipStart?: number | null; clipEnd?: number | null
    thumbnail?: string; videoUrl?: string; localPath?: string; localPreviewUrl?: string
    onChange: (start: number | null, end: number | null) => void
}

// ─── Time formatting helper ────────────────────────────────────────────────────
export function formatTime(sec: number) {
    const s = Math.max(0, Math.floor(sec))
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const ss = s % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
    return `${m}:${String(ss).padStart(2, '0')}`
}

// ─── Time input helpers ────────────────────────────────────────────────────────
function timeToInput(sec: number | null | undefined) {
    if (sec == null) return ''
    const s = Math.max(0, Math.floor(sec))
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const ss = s % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
    return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

function parseTimeInput(str: string) {
    const parts = str.trim().split(':').map(p => parseInt(p, 10))
    if (parts.some(isNaN)) return null
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
    if (parts.length === 2) return parts[0] * 60 + parts[1]
    if (parts.length === 1) return parts[0]
    return null
}

// ─── YouTube iframe postMessage helpers ─────────────────────────────────────
function ytSeek(iframeEl: HTMLIFrameElement | null, sec: number) {
    if (!iframeEl?.contentWindow) return
    if (iframeEl.src.startsWith('http://127.0.0.1:')) {
        iframeEl.contentWindow.postMessage({ type: 'gorex-seek', seconds: Math.max(0, sec) }, new URL(iframeEl.src).origin)
        return
    }
    iframeEl.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'seekTo', args: [Math.max(0, sec), true] }),
        'https://www.youtube-nocookie.com'
    )
}

// ─── TimeRangeSelector component ──────────────────────────────────────────────
function getYouTubeId(url: string) {
    try {
        const u = new URL(url)
        if (u.hostname === 'youtu.be') return u.pathname.slice(1)
        if (u.hostname.includes('youtube.com')) return u.searchParams.get('v')
    } catch {}
    return null
}

function TimeRangeSelector({ duration, chapters, clipStart, clipEnd, thumbnail, videoUrl, localPath, localPreviewUrl, onChange }: TimeRangeProps) {
    const { t } = useLanguage()
    const trackRef = useRef<HTMLDivElement>(null)
    const draggingRef = useRef<'start' | 'end' | null>(null) // 'start' | 'end'
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const localVideoRef = useRef<HTMLVideoElement>(null)
    const timeRef = useRef(0)       // local time counter for playhead
    const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

    const dur = duration || 1
    const effectiveStart = clipStart ?? 0
    const effectiveEnd = clipEnd ?? dur

    const [startInput, setStartInput] = useState(timeToInput(effectiveStart))
    const [endInput, setEndInput] = useState(timeToInput(effectiveEnd))
    const [startInputError, setStartInputError] = useState(false)
    const [endInputError, setEndInputError] = useState(false)
    const [hoverTime, setHoverTime] = useState<number | null>(null)
    const [hoverPct, setHoverPct] = useState(0)
    const [embedSec, setEmbedSec] = useState<number | null>(null) // null = player hidden
    const [playerSrc, setPlayerSrc] = useState<string | null>(null)
    const [playerError, setPlayerError] = useState(false)
    const [localPlayerSec, setLocalPlayerSec] = useState<number | null>(null) // null = local player hidden
    const [currentTime, setCurrentTime] = useState<number | null>(null) // playhead position

    const localFileUrl = localPreviewUrl || (localPath ? 'gorex-media:///' + localPath.replace(/\\/g, '/') : null)
    const ytId = videoUrl ? getYouTubeId(videoUrl) : null

    useEffect(() => {
        if (embedSec === null || !ytId) {
            setPlayerSrc(null)
            setPlayerError(false)
            return
        }
        let active = true
        const directUrl = `https://www.youtube-nocookie.com/embed/${ytId}?start=${Math.floor(embedSec)}&autoplay=1&enablejsapi=1&controls=1&rel=0&origin=${encodeURIComponent(window.location.origin)}`
        if (!window.api.getYoutubePlayerUrl) {
            setPlayerSrc(directUrl)
            return
        }
        window.api.getYoutubePlayerUrl(ytId, embedSec).then(url => {
            if (active) { setPlayerSrc(url); setPlayerError(false) }
        }).catch(() => {
            if (active) { setPlayerSrc(null); setPlayerError(true) }
        })
        return () => { active = false }
    }, [embedSec, ytId])

    // Sync inputs when external values change
    useEffect(() => { setStartInput(timeToInput(clipStart ?? 0)) }, [clipStart])
    useEffect(() => { setEndInput(timeToInput(clipEnd ?? dur)) }, [clipEnd, dur])

    // Playhead tracking via YouTube postMessage events
    useEffect(() => {
        if (embedSec === null) {
            clearInterval(pollRef.current)
            pollRef.current = undefined
            setCurrentTime(null)
            return
        }
        timeRef.current = embedSec
        setCurrentTime(embedSec)

        const onMessage = (e: MessageEvent) => {
            const localOrigin = playerSrc?.startsWith('http://127.0.0.1:') ? new URL(playerSrc).origin : null
            if (e.origin !== 'https://www.youtube.com' && e.origin !== 'https://www.youtube-nocookie.com' && e.origin !== localOrigin) return
            let data
            try { data = JSON.parse(e.data) } catch { return }
            if (data.event === 'onStateChange') {
                if (data.info === 1) { // playing
                    clearInterval(pollRef.current)
                    pollRef.current = setInterval(() => {
                        timeRef.current = Math.min(timeRef.current + 0.2, dur)
                        setCurrentTime(timeRef.current)
                    }, 200)
                } else { // paused / buffering / ended
                    clearInterval(pollRef.current)
                }
            }
        }
        window.addEventListener('message', onMessage)
        return () => {
            window.removeEventListener('message', onMessage)
            clearInterval(pollRef.current)
        }
    }, [embedSec, dur, playerSrc])

    // Cleanup on unmount
    useEffect(() => () => { clearInterval(pollRef.current) }, [])

    // Seek local video when player is opened or localPlayerSec changes
    useEffect(() => {
        if (!localVideoRef.current || localPlayerSec === null) return
        const video = localVideoRef.current
        const doSeek = () => {
            video.currentTime = localPlayerSec
            video.play().catch(() => {})
        }
        if (video.readyState >= 1) {
            doSeek()
        } else {
            video.addEventListener('loadedmetadata', doSeek, { once: true })
        }
        return () => video.removeEventListener('loadedmetadata', doSeek)
    }, [localPlayerSec])

    const seekPlayer = (sec: number) => {
        ytSeek(iframeRef.current, sec)
        timeRef.current = sec
        setCurrentTime(sec)
        if (localVideoRef.current) {
            localVideoRef.current.currentTime = sec
        }
    }

    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

    const posFromEvent = useCallback((e: PointerPositionEvent) => {
        const rect = trackRef.current?.getBoundingClientRect()
        if (!rect) return 0
        const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left
        return clamp(x / rect.width, 0, 1)
    }, [])

    const handleTrackMouseDown = useCallback((e: ReactMouseEvent | ReactTouchEvent, handle: 'start' | 'end') => {
        e.preventDefault()
        draggingRef.current = handle

        const onMove = (ev: MouseEvent | TouchEvent) => {
            const pos = posFromEvent(ev)
            const sec = Math.round(pos * dur)
            if (draggingRef.current === 'start') {
                const newStart = clamp(sec, 0, (clipEnd ?? dur) - 1)
                onChange(newStart, clipEnd ?? dur)
                seekPlayer(newStart)
            } else {
                const newEnd = clamp(sec, (clipStart ?? 0) + 1, dur)
                onChange(clipStart ?? 0, newEnd)
                seekPlayer(newEnd)
            }
        }

        const onUp = () => {
            draggingRef.current = null
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
            window.removeEventListener('touchmove', onMove)
            window.removeEventListener('touchend', onUp)
        }

        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
        window.addEventListener('touchmove', onMove, { passive: false })
        window.addEventListener('touchend', onUp)
    }, [dur, clipStart, clipEnd, onChange, posFromEvent])

    const handleTrackMouseMove = useCallback((e: ReactMouseEvent) => {
        const pos = posFromEvent(e)
        setHoverTime(Math.round(pos * dur))
        setHoverPct(pos * 100)
    }, [dur, posFromEvent])

    const handleStartInputBlur = () => {
        const s = parseTimeInput(startInput)
        if (s === null || s < 0 || s >= (clipEnd ?? dur)) {
            setStartInputError(true)
            setStartInput(timeToInput(clipStart ?? 0))
            return
        }
        setStartInputError(false)
        onChange(s, clipEnd ?? dur)
    }

    const handleEndInputBlur = () => {
        const s = parseTimeInput(endInput)
        if (s === null || s <= (clipStart ?? 0) || s > dur) {
            setEndInputError(true)
            setEndInput(timeToInput(clipEnd ?? dur))
            return
        }
        setEndInputError(false)
        onChange(clipStart ?? 0, s)
    }

    const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>, handler: () => void) => {
        if (e.key === 'Enter') { e.currentTarget.blur(); handler() }
        if (e.key === 'Escape') e.currentTarget.blur()
    }

    const selectChapter = (ch: Chapter) => {
        onChange(Math.round(ch.start_time), Math.round(ch.end_time))
    }

    const isFullRange = effectiveStart === 0 && effectiveEnd >= dur - 1
    const selectedSec = Math.max(0, effectiveEnd - effectiveStart)

    const startPct = (effectiveStart / dur) * 100
    const endPct   = (effectiveEnd   / dur) * 100

    const openAtTime = (sec: number) => {
        if (!videoUrl) return
        let url = videoUrl
        if (ytId) url = `https://www.youtube.com/watch?v=${ytId}&t=${Math.floor(sec)}s`
        window.open(url, '_blank')
    }

    return (
        <div className="trs-root">
            {/* ─ Preview / embed ─ */}
            {(thumbnail || ytId || localFileUrl) && (
                <div className="trs-preview-area">
                    {/* YouTube iframe embed – shown when a preview button is clicked */}
                    {ytId && embedSec !== null ? (
                        <div className="trs-embed-wrap">
                            {playerSrc ? (
                                <iframe
                                    ref={iframeRef}
                                    className="trs-embed"
                                    src={playerSrc}
                                    allow="autoplay; encrypted-media; picture-in-picture"
                                    allowFullScreen
                                    title="Preview"
                                />
                            ) : playerError ? (
                                <a href={videoUrl} target="_blank" rel="noopener noreferrer">{t('trsOpenOnYouTube')}</a>
                            ) : null}
                            <button
                                className="trs-embed-close"
                                onClick={() => setEmbedSec(null)}
                                title={t('trsClosePlayer')}
                                type="button"
                            >
                                <i className="bi bi-x-lg" />
                            </button>
                        </div>
                    ) : localFileUrl && localPlayerSec !== null ? (
                        /* Local file video player */
                        <div className="trs-embed-wrap">
                            <video
                                ref={localVideoRef}
                                className="trs-embed trs-local-video"
                                src={localFileUrl}
                                preload="auto"
                                controls
                            />
                            <button
                                className="trs-embed-close"
                                onClick={() => setLocalPlayerSec(null)}
                                title={t('trsClosePlayer')}
                                type="button"
                            >
                                <i className="bi bi-x-lg" />
                            </button>
                        </div>
                    ) : (
                        /* Static thumbnail with two preview buttons */
                        <div className="trs-thumb-area">
                            {thumbnail && (
                                <div className="trs-thumb-wrap">
                                    <img src={thumbnail} alt="" className="trs-thumb-img" />
                                    <div className="trs-thumb-overlay">
                                        <span className="trs-thumb-range">
                                            <i className="bi bi-scissors" />
                                            {isFullRange ? t('trsFullVideo') : `${timeToInput(effectiveStart)} — ${timeToInput(effectiveEnd)} (${timeToInput(selectedSec)})`}
                                        </span>
                                    </div>
                                </div>
                            )}
                            {ytId && (
                                <div className="trs-thumb-btns">
                                    <button
                                        className="trs-thumb-play-btn trs-thumb-play-btn--start"
                                        onClick={() => setEmbedSec(effectiveStart)}
                                        type="button"
                                    >
                                        <i className="bi bi-play-fill" />
                                        {t('trsFrom')} {timeToInput(effectiveStart)}
                                    </button>
                                    <button
                                        className="trs-thumb-play-btn trs-thumb-play-btn--end"
                                        onClick={() => setEmbedSec(effectiveEnd)}
                                        type="button"
                                    >
                                        <i className="bi bi-play-fill" />
                                        {t('trsTo')} {timeToInput(effectiveEnd)}
                                    </button>
                                </div>
                            )}
                            {localFileUrl && !ytId && (
                                <div className="trs-thumb-btns">
                                    <button
                                        className="trs-thumb-play-btn trs-thumb-play-btn--start"
                                        onClick={() => setLocalPlayerSec(effectiveStart)}
                                        type="button"
                                    >
                                        <i className="bi bi-play-fill" />
                                        {t('trsFrom')} {timeToInput(effectiveStart)}
                                    </button>
                                    <button
                                        className="trs-thumb-play-btn trs-thumb-play-btn--end"
                                        onClick={() => setLocalPlayerSec(Math.max(0, effectiveEnd - 3))}
                                        type="button"
                                    >
                                        <i className="bi bi-play-fill" />
                                        {t('trsTo')} {timeToInput(effectiveEnd)}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ─ Track ─ */}
            <div className="trs-track-wrap">
                <div
                    className="trs-track"
                    ref={trackRef}
                    onMouseMove={handleTrackMouseMove}
                    onMouseLeave={() => setHoverTime(null)}
                    onClick={(e) => {
                        if (embedSec === null && localPlayerSec === null) return
                        seekPlayer(Math.round(posFromEvent(e) * dur))
                    }}
                >
                    {/* Shaded outside region (left) */}
                    <div className="trs-outside trs-outside--left" style={{ width: `${startPct}%` }} />
                    {/* Shaded outside region (right) */}
                    <div className="trs-outside trs-outside--right" style={{ left: `${endPct}%`, width: `${100 - endPct}%` }} />
                    {/* Selected region */}
                    <div
                        className="trs-region"
                        style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }}
                    />
                    {/* Chapter markers */}
                    {(chapters || []).map((ch, i) => (
                        <div
                            key={i}
                            className="trs-chapter-mark"
                            style={{ left: `${(ch.start_time / dur) * 100}%` }}
                            title={ch.title}
                        />
                    ))}
                    {/* Start handle */}
                    <div
                        className="trs-handle trs-handle--start"
                        style={{ left: `${startPct}%` }}
                        onMouseDown={e => handleTrackMouseDown(e, 'start')}
                        onTouchStart={e => handleTrackMouseDown(e, 'start')}
                    >
                        <div className="trs-handle-inner" />
                    </div>
                    {/* End handle */}
                    <div
                        className="trs-handle trs-handle--end"
                        style={{ left: `${endPct}%` }}
                        onMouseDown={e => handleTrackMouseDown(e, 'end')}
                        onTouchStart={e => handleTrackMouseDown(e, 'end')}
                    >
                        <div className="trs-handle-inner" />
                    </div>
                    {/* Playhead */}
                    {currentTime !== null && (
                        <div
                            className="trs-playhead"
                            style={{ left: `${(currentTime / dur) * 100}%` }}
                        />
                    )}
                    {/* Hover time tooltip */}
                    {hoverTime !== null && (
                        <div
                            className="trs-hover-tip"
                            style={{ left: `${hoverPct}%` }}
                        >
                            {timeToInput(hoverTime)}
                        </div>
                    )}
                </div>
                {/* Duration ticks */}
                <div className="trs-ticks">
                    <span>0:00</span>
                    <span>{timeToInput(Math.round(dur / 4))}</span>
                    <span>{timeToInput(Math.round(dur / 2))}</span>
                    <span>{timeToInput(Math.round(dur * 3 / 4))}</span>
                    <span>{timeToInput(dur)}</span>
                </div>
            </div>

            {/* ─ Inputs ─ */}
            <div className="trs-inputs">
                <div className="trs-input-group">
                    <label className="trs-input-label">
                        <i className="bi bi-skip-start-fill" /> {t('trsFrom')}
                    </label>
                    <input
                        className={`trs-input${startInputError ? ' trs-input--error' : ''}`}
                        type="text"
                        value={startInput}
                        placeholder="0:00"
                        onChange={e => { setStartInput(e.target.value); setStartInputError(false) }}
                        onBlur={handleStartInputBlur}
                        onKeyDown={e => handleInputKeyDown(e, handleStartInputBlur)}
                        spellCheck={false}
                    />
                </div>

                <div className="trs-duration-badge">
                    <i className="bi bi-scissors" />
                    {isFullRange ? t('trsFullVideo') : timeToInput(selectedSec)}
                </div>

                <div className="trs-input-group">
                    <label className="trs-input-label">
                        <i className="bi bi-skip-end-fill" /> {t('trsTo')}
                    </label>
                    <input
                        className={`trs-input${endInputError ? ' trs-input--error' : ''}`}
                        type="text"
                        value={endInput}
                        placeholder={timeToInput(dur)}
                        onChange={e => { setEndInput(e.target.value); setEndInputError(false) }}
                        onBlur={handleEndInputBlur}
                        onKeyDown={e => handleInputKeyDown(e, handleEndInputBlur)}
                        spellCheck={false}
                    />
                </div>

                {!isFullRange && (
                    <button
                        className="trs-reset-btn"
                        onClick={() => onChange(0, dur)}
                        title={t('trsRemoveClip')}
                    >
                        <i className="bi bi-x-lg" />
                    </button>
                )}
            </div>

            {/* ─ Chapter tags ─ */}
            {chapters && chapters.length > 0 && (
                <div className="trs-chapters">
                    <span className="trs-chapters-label"><i className="bi bi-bookmark-fill" /> {t('trsChapters')}</span>
                    <div className="trs-chapter-tags">
                        {chapters.map((ch, i) => {
                            const isActive = Math.abs(effectiveStart - ch.start_time) < 2 && Math.abs(effectiveEnd - ch.end_time) < 2
                            return (
                                <button
                                    key={i}
                                    className={`trs-chapter-tag${isActive ? ' active' : ''}`}
                                    onClick={() => selectChapter(ch)}
                                    title={`${timeToInput(ch.start_time)} – ${timeToInput(ch.end_time)}`}
                                >
                                    <span className="trs-chapter-time">{timeToInput(ch.start_time)}</span>
                                    <span className="trs-chapter-title">{ch.title}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Panel-scoped select (always opens downward) ───────────────────────────

export default TimeRangeSelector
