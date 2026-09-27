import { useEffect, useRef, useState } from 'react'
import './CliConsole.scss'

export interface CliLogEntry {
    type: 'out' | 'err' | 'ytdl' | 'twitch'
    text: string
}

interface Props {
    logs: CliLogEntry[]
    onClear: () => void
    onClose: () => void
    theme: string
}

export default function CliConsole({ logs, onClear, onClose, theme }: Props) {
    const bodyRef = useRef<HTMLDivElement>(null)
    const copyResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [autoScroll, setAutoScroll] = useState(true)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (autoScroll && bodyRef.current) {
            bodyRef.current.scrollTop = bodyRef.current.scrollHeight
        }
    }, [logs, autoScroll])

    const handleScroll = () => {
        const el = bodyRef.current
        if (!el) return
        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
        setAutoScroll(atBottom)
    }

    useEffect(() => () => {
        if (copyResetTimer.current) clearTimeout(copyResetTimer.current)
    }, [])

    const handleCopy = async () => {
        const text = logs.map(l => l.text).join('')
        await navigator.clipboard.writeText(text)
        setCopied(true)
        if (copyResetTimer.current) clearTimeout(copyResetTimer.current)
        copyResetTimer.current = setTimeout(() => setCopied(false), 1500)
    }

    return (
        <div className={`cli-console ${theme}`}>
            <div className="cli-console__header">
                <span className="cli-console__title">
                    <i className="bi bi-terminal"></i>
                    FFmpeg / yt-dlp
                </span>
                <div className="cli-console__actions">
                    <button
                        className={`cli-console__btn${autoScroll ? ' active' : ''}`}
                        title="Автопрокрутка"
                        onClick={() => setAutoScroll(v => !v)}
                    >
                        <i className="bi bi-arrow-down-circle"></i>
                    </button>
                    <button
                        className={`cli-console__btn${copied ? ' active' : ''}`}
                        title="Копировать всё"
                        onClick={handleCopy}
                    >
                        <i className={`bi ${copied ? 'bi-check-lg' : 'bi-clipboard'}`}></i>
                    </button>
                    <button className="cli-console__btn" title="Очистить" onClick={onClear}>
                        <i className="bi bi-trash"></i>
                    </button>
                    <button className="cli-console__btn cli-console__close" title="Закрыть" onClick={onClose}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>
            </div>
            <div
                className="cli-console__body"
                ref={bodyRef}
                onScroll={handleScroll}
            >
                {logs.length === 0 ? (
                    <div className="cli-console__empty">Ожидание вывода FFmpeg / yt-dlp...</div>
                ) : (
                    logs.map((line, i) => (
                        <span key={i} className={`cli-console__line cli-console__line--${line.type}`}>
                            {line.text}
                        </span>
                    ))
                )}
            </div>
        </div>
    )
}
