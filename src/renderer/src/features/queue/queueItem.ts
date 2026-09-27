export function isDownloadItem(video: { isYtdlItem?: boolean; isTwitchItem?: boolean } | null | undefined): boolean {
    return Boolean(video?.isYtdlItem || video?.isTwitchItem)
}
