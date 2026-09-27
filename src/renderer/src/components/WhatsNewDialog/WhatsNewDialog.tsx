import { useLanguage } from '../../i18n'

const ITEMS = [
    { icon: 'bi-twitch', titleKey: 'whatsNewTwitchTitle', textKey: 'whatsNewTwitchText' },
    { icon: 'bi-chat-square-text-fill', titleKey: 'whatsNewChatPreviewTitle', textKey: 'whatsNewChatPreviewText' },
    { icon: 'bi-arrow-down-circle-fill', titleKey: 'whatsNewReliableDownloadsTitle', textKey: 'whatsNewReliableDownloadsText' },
    { icon: 'bi-sliders', titleKey: 'whatsNewQueueSettingsTitle', textKey: 'whatsNewQueueSettingsText' },
    { icon: 'bi-arrow-repeat', titleKey: 'whatsNewToolsTitle', textKey: 'whatsNewToolsText' },
]

interface WhatsNewDialogProps {
    theme: 'dark' | 'light'
    version: string
    onDismiss: () => void
}

export default function WhatsNewDialog({ theme, version, onDismiss }: WhatsNewDialogProps) {
    const { t } = useLanguage()

    return (
        <div className={`whats-new-overlay ${theme}`} role="dialog" aria-modal="true" aria-labelledby="whats-new-title" onClick={onDismiss}>
            <div className="whats-new-card" onClick={event => event.stopPropagation()}>
                <button className="whats-new-close" onClick={onDismiss} title={t('close')}>
                    <i className="bi bi-x-lg" />
                </button>
                <div className="whats-new-kicker">{t('whatsNewKicker').replace('{v}', version)}</div>
                <h2 id="whats-new-title" className="whats-new-title">{t('whatsNewTitle')}</h2>
                <p className="whats-new-subtitle">{t('whatsNewSubtitle')}</p>
                <div className="whats-new-list">
                    {ITEMS.map((item, index) => (
                        <div key={item.titleKey} className="whats-new-item" style={{ animationDelay: `${index * 45}ms` }}>
                            <span className="whats-new-item-icon"><i className={`bi ${item.icon}`} /></span>
                            <span className="whats-new-item-copy">
                                <span className="whats-new-item-title">{t(item.titleKey)}</span>
                                <span className="whats-new-item-text">{t(item.textKey)}</span>
                            </span>
                        </div>
                    ))}
                </div>
                <p className="whats-new-mac-note">
                    <i className="bi bi-apple" aria-hidden="true" />
                    {t('whatsNewMacNote')}
                </p>
                <div className="whats-new-footer">
                    <button className="whats-new-primary" onClick={onDismiss}>
                        {t('whatsNewDone')}
                        <i className="bi bi-check2" />
                    </button>
                </div>
            </div>
        </div>
    )
}
