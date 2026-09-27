export interface TwitchQualityOption {
    value: string
    label: string
    source?: boolean
    width?: number
    height?: number
}

export function isTwitchUrl(raw: string): boolean {
    try {
        const host = new URL(raw).hostname.replace(/^www\./, '').replace(/^m\./, '').toLowerCase()
        return host === 'twitch.tv' || host === 'clips.twitch.tv'
    } catch {
        return false
    }
}

export function getTwitchQualityLabel(options: TwitchQualityOption[] | null | undefined, value: string): string {
    return options?.find(option => option.value === value)?.label || value || ''
}

export function normalizeTwitchQualityOptions(options: unknown): TwitchQualityOption[] {
    const clean = Array.isArray(options)
        ? options.filter((option): option is TwitchQualityOption => Boolean(option?.value && option?.label))
        : []
    return clean.length ? clean : [{ value: 'Source', label: 'Source', source: true }]
}

export function normalizeTwitchSelectedQuality(info: { qualityOptions?: unknown; twitchQuality?: string } | null | undefined) {
    const options = normalizeTwitchQualityOptions(info?.qualityOptions)
    const selected = info?.twitchQuality || options[0].value
    return { options, selected, label: getTwitchQualityLabel(options, selected) }
}
