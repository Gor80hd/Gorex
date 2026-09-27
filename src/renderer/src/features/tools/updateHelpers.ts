function compareVersionParts(a: string, b: string): number {
    const pa = a.split(/[.-]/).map(part => Number.parseInt(part, 10) || 0)
    const pb = b.split(/[.-]/).map(part => Number.parseInt(part, 10) || 0)
    for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
        const diff = (pa[i] || 0) - (pb[i] || 0)
        if (diff !== 0) return diff > 0 ? 1 : -1
    }
    return 0
}

export function normalizeTwitchToolVersion(version: unknown): string {
    const value = String(version || '').trim().replace(/^TwitchDownloader(?:CLI)?\s*/i, '').replace(/^v/i, '')
    const match = value.match(/\d+(?:\.\d+)+(?:[-+][0-9A-Za-z.-]+)?/)
    return match ? match[0].split('+')[0] : ''
}

export function isTwitchToolUpdateAvailable(currentVersion: unknown, latestVersion: unknown): boolean {
    if (!currentVersion || !latestVersion) return false
    return compareVersionParts(normalizeTwitchToolVersion(latestVersion), normalizeTwitchToolVersion(currentVersion)) > 0
}

export function normalizeYtdlVersion(version: unknown): string {
    return String(version || '').trim().replace(/^yt-dlp\s+/i, '').replace(/^v/i, '')
}

export function isYtdlUpdateAvailable(currentVersion: unknown, latestVersion: unknown): boolean {
    if (!currentVersion || !latestVersion) return false
    return compareVersionParts(normalizeYtdlVersion(latestVersion), normalizeYtdlVersion(currentVersion)) > 0
}

export function cleanYtdlToolError(message: unknown): string {
    const value = String(message || '')
        .replace(/^Error invoking remote method '[-a-z]+':\s*/i, '')
        .replace(/^Error:\s*/i, '')
        .trim()

    if (/net::ERR_CONNECTION_RESET/i.test(value)) return 'Соединение с GitHub было сброшено. Проверьте сеть или попробуйте позже.'
    if (/net::ERR_INTERNET_DISCONNECTED|ENOTFOUND|EAI_AGAIN/i.test(value)) return 'Нет соединения с GitHub. Проверьте интернет и попробуйте позже.'
    if (/net::ERR_TIMED_OUT|timeout/i.test(value)) return 'GitHub не ответил вовремя. Попробуйте обновить yt-dlp позже.'
    return value
}
