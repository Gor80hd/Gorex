import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import type { JobExitEvent, QueueSnapshot } from '../../desktopBridge'
import { errorMessage, type CliError, type CliLog, type EncodingSettings, type OutputMode, type Translate, type VideoTask } from '../../domain'
import { applyJobProgress, finishJob, hasActiveJobs, startConversion, type TaskId } from '../../queueState'
import { getEncoderErrorHint } from '../encoding/encoderErrorHint'
import { isDownloadItem } from './queueItem'
import { createJobRequests } from './jobRequests'

type Options = {
    videos: VideoTask[]; setVideos: Dispatch<SetStateAction<VideoTask[]>>
    settings: EncodingSettings; outputMode: OutputMode; outputDir: string; t: Translate; onRecovered: () => void
}

export function useJobQueue({ videos, setVideos, settings, outputMode, outputDir, t, onRecovered }: Options) {
    const nativeQueue = '__TAURI_INTERNALS__' in window
    const [isEncoding, setIsEncoding] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [encodingStartTime, setEncodingStartTime] = useState<number | null>(null)
    const [cliErrors, setCliErrors] = useState<CliError[]>([])
    const [cliLogs, setCliLogs] = useState<CliLog[]>([])
    const videosRef = useRef(videos)
    videosRef.current = videos
    const translationRef = useRef(t)
    translationRef.current = t
    const revision = useRef(-1)
    const stopped = useRef(new Set<TaskId>())
    const reportedErrors = useRef(new Set<TaskId>())
    const starting = useRef(false)
    const appendLog = (entry: CliLog) => setCliLogs(previous => [...previous.slice(-999), entry])

    const reportError = (id: TaskId | null, text: string, hint: string | null = '') => {
        const video = videosRef.current.find(video => video.id === id)
        setCliErrors(previous => [...previous, {
            title: video?.title || video?.outputName || translationRef.current('unknownFile'),
            stderr: text.trim() || translationRef.current('noOutput'), hint: hint || '',
        }])
    }

    const applySnapshot = (snapshot: QueueSnapshot) => {
        if (snapshot.revision <= revision.current) return
        revision.current = snapshot.revision
        setIsEncoding(snapshot.active)
        setIsPaused(snapshot.paused)
        setEncodingStartTime(snapshot.active ? snapshot.startedAt : null)
        const byId = new Map(snapshot.entries.map(entry => [entry.id, entry]))
        if (snapshot.entries.some(entry => entry.task && !videosRef.current.some(video => video.id === entry.id))) onRecovered()
        setVideos(previous => {
            const restored = snapshot.entries.filter(entry => entry.task && !previous.some(video => video.id === entry.id)).map(entry => entry.task!).filter(Boolean)
            return [...previous, ...restored].map(video => {
            const entry = byId.get(video.id)
            if (!entry) return video
            const idle = entry.status === 'ready' || entry.status === 'format_select'
            return { ...video, status: entry.status, progress: entry.progress,
                startTime: idle ? null : entry.startTime, endTime: entry.endTime, outputPath: entry.outputPath }
            })
        })
        for (const entry of snapshot.entries) {
            if (entry.status !== 'error' || reportedErrors.current.has(entry.id)) continue
            reportedErrors.current.add(entry.id)
            reportError(entry.id, entry.error || '', getEncoderErrorHint(entry.error || '', translationRef.current))
        }
    }
    const snapshotHandler = useRef(applySnapshot)
    snapshotHandler.current = applySnapshot

    useEffect(() => {
        let active = true
        const subscriptions = [
            window.api.onCliOutput(data => appendLog({ type: 'out', text: data })),
            window.api.onCliError(data => appendLog({ type: 'err', text: data })),
            window.api.onYtdlOutput(({ data }) => appendLog({ type: 'ytdl', text: data })),
            window.api.onTwitchOutput?.(({ data }) => appendLog({ type: 'twitch', text: data })),
        ]
        if (nativeQueue) {
            subscriptions.push(window.api.onQueueState(snapshot => snapshotHandler.current(snapshot)))
            void window.api.getQueueState().then(snapshot => { if (active) snapshotHandler.current(snapshot) }).catch(error => { if (active) reportError(null, errorMessage(error)) })
        } else {
            const exit = ({ id, code, converting, error, stderr, outputPath }: JobExitEvent) => {
                if (stopped.current.has(id)) { stopped.current.delete(id); return }
                if (converting) { setVideos(previous => startConversion(previous, id)); return }
                setVideos(previous => {
                    const updated = finishJob(previous, id, code, outputPath)
                    if (!hasActiveJobs(updated)) { setIsEncoding(false); setIsPaused(false); setEncodingStartTime(null) }
                    return updated
                })
                if (code !== 0) reportError(id, stderr || error || '', getEncoderErrorHint(stderr || error || '', translationRef.current))
            }
            subscriptions.push(
                window.api.onCliProgress(({ id, progress }) => { if (!stopped.current.has(id)) setVideos(previous => applyJobProgress(previous, id, progress, 'encoding')) }),
                window.api.onYtdlProgress(({ id, progress, subsPhase, sponsorBlockPhase, sponsorBlockProbePhase }) => {
                    if (!stopped.current.has(id)) setVideos(previous => applyJobProgress(previous, id, progress,
                        subsPhase ? 'downloading-subs' : sponsorBlockProbePhase ? 'probing-keyframes' : sponsorBlockPhase ? 'cutting-sponsors' : 'downloading'))
                }),
                window.api.onTwitchProgress(({ id, progress }) => { if (!stopped.current.has(id)) setVideos(previous => applyJobProgress(previous, id, progress, 'downloading')) }),
                window.api.onCliExit(exit), window.api.onYtdlExit(exit), window.api.onTwitchExit(exit),
            )
        }
        return () => { active = false; subscriptions.forEach(unsubscribe => unsubscribe?.()) }
    }, [nativeQueue, setVideos])

    const startBatch = async (tasks: VideoTask[]) => {
        if (!tasks.length || isEncoding || starting.current) return
        starting.current = true
        reportedErrors.current.clear()
        stopped.current.clear()
        try {
            const requests = createJobRequests(tasks, settings, outputMode, outputDir)
            if (nativeQueue) applySnapshot(await window.api.startQueue(requests))
            else {
                const now = Date.now()
                setIsEncoding(true); setIsPaused(false); setEncodingStartTime(now)
                setVideos(previous => previous.map(video => tasks.some(task => task.id === video.id) ? ({ ...video, progress: 0,
                    status: isDownloadItem(video) ? 'downloading' : 'encoding', startTime: now, endTime: null, outputPath: null }) : video))
                for (const entry of requests) {
                    if (entry.kind === 'ffmpeg') window.api.runCli(entry.request)
                    else if (entry.kind === 'ytdl') window.api.ytdlRun(entry.request)
                    else window.api.twitchRun(entry.request)
                }
            }
        } catch (error) { reportError(null, errorMessage(error, t('dlErrorDefault'))) }
        finally { starting.current = false }
    }

    const startEncoding = () => startBatch(videos)
    const startPendingBatch = () => startBatch(videos.filter(video => video.status === 'ready' || video.status === 'format_select' || video.status === 'error'))

    const handlePause = async () => {
        if (!isEncoding) return
        try {
            await (isPaused ? window.api.resumeAll() : window.api.pauseAll())
            if (!nativeQueue) setIsPaused(!isPaused)
        } catch (error) { reportError(null, errorMessage(error)) }
    }

    const handleStop = async () => {
        try {
            if (!nativeQueue) {
                for (const video of videosRef.current) if (hasActiveJobs([video])) stopped.current.add(video.id)
                setIsEncoding(false); setIsPaused(false); setEncodingStartTime(null)
                setVideos(previous => previous.map(video => hasActiveJobs([video])
                    ? { ...video, status: isDownloadItem(video) ? 'format_select' : 'ready', progress: 0, startTime: null, endTime: null, outputPath: null }
                    : video))
            }
            await window.api.stopAll()
        } catch (error) { reportError(null, errorMessage(error)) }
    }
    return { isEncoding, isPaused, encodingStartTime, cliErrors, cliLogs, setCliErrors, setCliLogs, appendLog, startEncoding, startPendingBatch, handlePause, handleStop }
}
