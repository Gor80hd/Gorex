import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../../i18n'

export interface CliError {
    title: string
    stderr: string
    hint?: string
}

interface CliErrorDialogProps {
    errors: readonly CliError[]
    theme: 'dark' | 'light'
    onDismiss: () => void
}

export default function CliErrorDialog({ errors, theme, onDismiss }: CliErrorDialogProps) {
    const { t } = useLanguage()
    const [copied, setCopied] = useState<number | 'all' | null>(null)
    const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => () => {
        if (copyTimer.current) clearTimeout(copyTimer.current)
    }, [])

    const copy = (text: string, index: number | 'all') => {
        void navigator.clipboard.writeText(text).then(() => {
            setCopied(index)
            if (copyTimer.current) clearTimeout(copyTimer.current)
            copyTimer.current = setTimeout(() => setCopied(null), 1500)
        }).catch(error => console.error('Could not copy error output:', error))
    }

    return (
        <div className={`cli-error-overlay ${theme}`} onClick={onDismiss}>
            <div className="cli-error-popup" onClick={event => event.stopPropagation()}>
                <div className="cli-error-header">
                    <i className="bi bi-exclamation-triangle-fill cli-error-icon" />
                    <span className="cli-error-title">
                        {errors.length === 1 ? t('encodingError') : `${t('encodingErrors')} (${errors.length})`}
                    </span>
                    <button className="cli-error-close" onClick={onDismiss}>
                        <i className="bi bi-x-lg" />
                    </button>
                </div>
                <div className="cli-error-body">
                    {errors.map((error, index) => (
                        <div key={index} className="cli-error-item">
                            <div className="cli-error-item-header">
                                <div className="cli-error-item-title">{error.title}</div>
                                <button
                                    className={`cli-error-copy${copied === index ? ' copied' : ''}`}
                                    title={t('copyToClipboard')}
                                    onClick={() => copy(error.stderr, index)}
                                >
                                    <i className={`bi ${copied === index ? 'bi-check-lg' : 'bi-clipboard'}`} />
                                </button>
                            </div>
                            {error.hint && (
                                <div className="cli-error-hint">
                                    <i className="bi bi-lightbulb-fill" />
                                    {error.hint}
                                </div>
                            )}
                            <pre className="cli-error-log">{error.stderr}</pre>
                        </div>
                    ))}
                </div>
                <div className="cli-error-footer">
                    {errors.length > 1 && (
                        <button
                            className={`cli-error-copy-all${copied === 'all' ? ' copied' : ''}`}
                            onClick={() => copy(errors.map((error, index) => `[${index + 1}] ${error.title}\n${error.stderr}`).join('\n\n'), 'all')}
                        >
                            <i className={`bi ${copied === 'all' ? 'bi-check-lg' : 'bi-clipboard'}`} />
                            {copied === 'all' ? t('copied') : t('copyAll')}
                        </button>
                    )}
                    <button className="cli-error-dismiss" onClick={onDismiss}>{t('close')}</button>
                </div>
            </div>
        </div>
    )
}
