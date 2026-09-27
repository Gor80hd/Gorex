type ChatMessage = { id: string | number; timeLabel: string; username?: string; body: string }
type ChatViewer = {
    video?: { title?: string }
    messages?: ChatMessage[]
    loading?: boolean
    loadingFull?: boolean
    error?: string
    isComplete?: boolean
    previewMinutes?: number
}
type Props = {
    theme: string
    viewer: ChatViewer | null
    query: string
    onQueryChange: (value: string) => void
    onClose: () => void
    onExport: (format: 'json' | 'txt') => void
    onLoadFull: () => void
    onRetry: () => void
    exporting: string
    t: (key: string) => string
}

export default function TwitchChatViewer({ theme, viewer, query, onQueryChange, onClose, onExport, onLoadFull, onRetry, exporting, t }: Props) {
    if (!viewer) return null
    const allMessages = Array.isArray(viewer.messages) ? viewer.messages : []
    const q = query.trim().toLowerCase()
    const messages = q
        ? allMessages.filter(message => (`${message.timeLabel} ${message.username} ${message.body}`).toLowerCase().includes(q))
        : allMessages
    const controlsDisabled = viewer.loading || viewer.loadingFull || !!viewer.error
    return (
        <div className={`twitch-chat-overlay ${theme}`} onClick={onClose} role="presentation">
            <div
                className="twitch-chat-panel"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="twitch-chat-dialog-title"
            >
                <div className="twitch-chat-header">
                    <div className="twitch-chat-title">
                        <i className="bi bi-twitch"></i>
                        <span id="twitch-chat-dialog-title" title={viewer.video?.title || t('twitchChatTitle')}>
                            {viewer.video?.title || t('twitchChatTitle')}
                        </span>
                    </div>
                    <button className="twitch-chat-close" onClick={onClose} title={t('close')} aria-label={t('close')}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>
                <div className="twitch-chat-tools">
                    <div className="twitch-chat-search">
                        <i className="bi bi-search"></i>
                        <input
                            value={query}
                            onChange={e => onQueryChange(e.target.value)}
                            placeholder={t('twitchChatSearch')}
                            spellCheck={false}
                            disabled={controlsDisabled}
                        />
                    </div>
                    <button className="twitch-chat-action" onClick={() => onExport('json')} disabled={controlsDisabled || !!exporting}>
                        <i className="bi bi-braces"></i>
                        {exporting === 'json' ? t('loading') : 'JSON'}
                    </button>
                    <button className="twitch-chat-action" onClick={() => onExport('txt')} disabled={controlsDisabled || !!exporting}>
                        <i className="bi bi-filetype-txt"></i>
                        {exporting === 'txt' ? t('loading') : 'TXT'}
                    </button>
                </div>
                <div className="twitch-chat-meta">
                    <span className="twitch-chat-count">
                        {viewer.loading ? t('twitchChatPreparing') : `${messages.length} / ${allMessages.length}`}
                    </span>
                    {!viewer.loading && !viewer.error && (
                        viewer.isComplete
                            ? <span className="twitch-chat-complete"><i className="bi bi-check-circle"></i>{t('twitchChatComplete')}</span>
                            : (
                                <div className="twitch-chat-preview-note">
                                    <span>{t('twitchChatPreviewNote').replace('{minutes}', String(viewer.previewMinutes || 15))}</span>
                                    <button type="button" onClick={onLoadFull} disabled={viewer.loadingFull}>
                                        {viewer.loadingFull ? t('twitchChatLoadingFull') : t('twitchChatLoadFull')}
                                    </button>
                                </div>
                            )
                    )}
                </div>
                <div className="twitch-chat-list">
                    {viewer.loading && (
                        <div className="twitch-chat-state">
                            <span className="twitch-chat-spinner"></span>
                            <strong>{t('twitchChatPreparing')}</strong>
                            <span>{t('twitchChatCacheSession')}</span>
                        </div>
                    )}
                    {viewer.error && (
                        <div className="twitch-chat-state twitch-chat-state--error">
                            <i className="bi bi-exclamation-triangle"></i>
                            <strong>{t('twitchChatLoadFailed')}</strong>
                            <span>{viewer.error}</span>
                            <button type="button" onClick={onRetry}>{t('twitchChatRetry')}</button>
                        </div>
                    )}
                    {!viewer.loading && !viewer.error && messages.map(message => (
                        <div key={message.id} className="twitch-chat-message">
                            <span className="twitch-chat-time">{message.timeLabel}</span>
                            <span className="twitch-chat-user">{message.username || 'unknown'}</span>
                            <span className="twitch-chat-body">{message.body}</span>
                        </div>
                    ))}
                    {!viewer.loading && !viewer.error && messages.length === 0 && (
                        <div className="twitch-chat-empty">{t('twitchChatNoMatches')}</div>
                    )}
                </div>
            </div>
        </div>
    )
}
