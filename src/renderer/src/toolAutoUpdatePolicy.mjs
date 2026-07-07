export function shouldAutoDownloadMissingTool(info, { autoUpdate = false, isEncoding = false } = {}) {
    return !!autoUpdate && !isEncoding && !info?.found
}

export function shouldAutoUpdateExistingTool(info, updateAvailable, { autoUpdate = false, isEncoding = false } = {}) {
    return !!autoUpdate && !isEncoding && !!info?.found && !!updateAvailable
}

export function getMissingToolStatus(info) {
    if (info?.found) return null
    return 'update-available'
}
export function isToolUpdateAlreadyRunningError(message) {
    const text = String(message || '').toLowerCase()
    return text.includes('уже выполняется')
        || text.includes('already running')
        || text.includes('already in progress')
        || text.includes('already being updated')
}