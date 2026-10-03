import { useEffect, useRef, useState } from 'react'
import { errorMessage, type ToolState, type Translate } from '../../domain'
import { cleanYtdlToolError, isTwitchToolUpdateAvailable, isYtdlUpdateAvailable } from './updateHelpers'
import { getMissingToolStatus, isToolUpdateAlreadyRunningError, shouldAutoDownloadMissingTool, shouldAutoUpdateExistingTool } from '../../toolAutoUpdatePolicy.mjs'

const stageKeys: Record<string, string> = {
    preparing: 'ytdlUpdateStagePreparing', connecting: 'ytdlUpdateStageConnecting', downloading: 'ytdlUpdateStageDownloading',
    downloaded: 'ytdlUpdateStageDownloaded', verifying: 'ytdlUpdateStageVerifying', installing: 'ytdlUpdateStageInstalling',
    done: 'ytdlUpdateStageDone', error: 'ytdlUpdateStageError',
}
export function createToolState(overrides: Partial<ToolState> = {}): ToolState {
    return { status: 'checking', info: null, latest: null, progress: null, receivedBytes: 0, totalBytes: 0,
        stageMessage: '', message: '', ...overrides }
}

export function useToolUpdates(kind: 'ytdl' | 'twitch', isEncoding: boolean, t: Translate) {
    const [tool, setTool] = useState(createToolState)
    const inFlight = useRef(false)
    const busy = useRef(isEncoding)
    busy.current = isEncoding
    const translate = useRef(t)
    translate.current = t
    const requestId = useRef(0)
    const adapters = {
        ytdl: { info: window.api.getYtdlInfo, latest: window.api.getYtdlLatestInfo, install: window.api.updateYtdl,
            subscribe: window.api.onYtdlUpdateProgress, newer: isYtdlUpdateAvailable },
        twitch: { info: window.api.getTwitchInfo, latest: window.api.getTwitchLatestInfo, install: window.api.updateTwitch,
            subscribe: window.api.onTwitchUpdateProgress, newer: isTwitchToolUpdateAvailable },
    }
    const adapter = adapters[kind]

    const update = async () => {
        if (inFlight.current) return null
        inFlight.current = true
        ++requestId.current
        const text = translate.current
        setTool(previous => ({ ...previous, status: 'updating', progress: 0, stageMessage: text('ytdlUpdateStagePreparing'), message: '' }))
        try {
            const result = await adapter.install()
            if (!result.ok) throw new Error(result.error || text('dlErrorDefault'))
            const info = result.info ?? await adapter.info()
            setTool(previous => ({ ...previous, status: 'up-to-date', info, progress: 100,
                stageMessage: text('ytdlUpdateStageDone'), message: text(`${kind}UpdateSuccess`) }))
            return info
        } catch (error) {
            const message = errorMessage(error, text('dlErrorDefault'))
            const alreadyRunning = isToolUpdateAlreadyRunningError(message)
            setTool(previous => ({ ...previous, status: alreadyRunning ? 'updating' : 'error',
                message: alreadyRunning ? text('toolUpdateAlreadyRunning') : `${text(`${kind}UpdateFailed`)}: ${cleanYtdlToolError(message)}`,
                stageMessage: previous.stageMessage || text('ytdlUpdateStageError') }))
            return null
        } finally { inFlight.current = false }
    }

    const refresh = async ({ autoUpdate = false } = {}) => {
        if (inFlight.current) return
        const request = ++requestId.current
        const text = translate.current
        setTool(previous => ({ ...previous, status: 'checking', message: '' }))
        try {
            const info = await adapter.info()
            if (request !== requestId.current) return
            if (!info.found) {
                const shouldDownload = shouldAutoDownloadMissingTool(info, { autoUpdate, isEncoding: busy.current })
                setTool(previous => ({ ...previous, status: getMissingToolStatus(info) || 'update-available', info, latest: null, progress: null,
                    stageMessage: text(`${kind}UpdateNotFound`), message: shouldDownload ? '' : text(`${kind}UpdateNotFound`) }))
                if (shouldDownload) await update()
                return
            }
            let latest
            try { latest = await adapter.latest() }
            catch (error) {
                if (request !== requestId.current) return
                setTool(previous => ({ ...previous, status: 'check-failed', info, latest: null, progress: null,
                    stageMessage: text(`${kind}UpdateCheckFailed`),
                    message: `${text(`${kind}UpdateCheckFailed`)}: ${cleanYtdlToolError(errorMessage(error))}` }))
                return
            }
            if (request !== requestId.current) return
            const available = Boolean(latest.latestVersion && adapter.newer(info.version, latest.latestVersion))
            setTool(previous => ({ ...previous, status: available ? 'update-available' : 'up-to-date', info, latest,
                stageMessage: text(available ? `${kind}BadgeUpdateAvailable` : `${kind}BadgeReady`), message: '', progress: available ? null : 100 }))
            if (shouldAutoUpdateExistingTool(info, available, { autoUpdate, isEncoding: busy.current })) await update()
        } catch (error) {
            if (request !== requestId.current) return
            setTool(previous => ({ ...previous, status: 'error', message: errorMessage(error, text('dlErrorDefault')),
                stageMessage: text('ytdlUpdateStageError') }))
        }
    }
    const refreshRef = useRef(refresh)
    refreshRef.current = refresh
    useEffect(() => {
        const unsubscribe = adapter.subscribe(payload => setTool(previous => ({ ...previous,
            status: payload.stage === 'error' ? 'error' : payload.stage === 'done' ? 'up-to-date' : 'updating',
            stageMessage: payload.stage === 'error' ? previous.stageMessage : translate.current(stageKeys[payload.stage] || 'ytdlUpdateChecking'),
            progress: payload.stage === 'error' ? previous.progress : typeof payload.percent !== 'number' || !Number.isFinite(payload.percent) ? previous.progress : Math.max(0, Math.min(100, payload.percent)),
            receivedBytes: payload.receivedBytes ?? previous.receivedBytes, totalBytes: payload.totalBytes ?? previous.totalBytes,
        })))
        void refreshRef.current({ autoUpdate: true })
        return () => { ++requestId.current; unsubscribe?.() }
    }, [kind])
    return { tool, update, refresh }
}
