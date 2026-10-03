import { useEffect, useRef, useState } from 'react'
import { errorMessage, type ChatViewer, type CliError, type Translate, type VideoTask } from '../../domain'
export function useTwitchChat(t: Translate, outputDir: string, reportError: (error: CliError) => void) {
    const [twitchChatViewer, setTwitchChatViewer] = useState<ChatViewer | null>(null)
    const [twitchChatQuery, setTwitchChatQuery] = useState('')
    const [twitchChatExporting, setTwitchChatExporting] = useState('')
    const twitchChatRequestRef = useRef(0)
    useEffect(() => () => { ++twitchChatRequestRef.current }, [])
    const handleOpenOutputLocation = (path: string) => window.api.openOutputLocation(path)
    const handleTwitchOpenChat = async (video: VideoTask) => {
        if (!video?.twitchUrl) return
        const requestId = ++twitchChatRequestRef.current
        setTwitchChatQuery('')
        setTwitchChatViewer({
            video,
            messages: [],
            loading: true,
            loadingFull: false,
            error: '',
            isComplete: false,
            previewMinutes: 15,
        })
        try {
            const result = await window.api.twitchDownloadChat({
                url: video.twitchUrl,
                id: video.twitchId,
                full: false,
            })
            if (twitchChatRequestRef.current !== requestId) return
            if (result?.ok === false) throw new Error(result.error || t('dlErrorDefault'))
            setTwitchChatViewer({
                video,
                messages: result.messages || [],
                loading: false,
                loadingFull: false,
                error: '',
                isComplete: !!result.isComplete,
                previewMinutes: result.previewMinutes || 15,
            })
        } catch (err) {
            if (twitchChatRequestRef.current !== requestId) return
            const text = (errorMessage(err) || t('dlErrorDefault')).trim()
            setTwitchChatViewer(prev => prev ? { ...prev, loading: false, error: text } : prev)
        }
    }

    const handleTwitchLoadFullChat = async () => {
        const video = twitchChatViewer?.video
        if (!video || twitchChatViewer.loadingFull) return
        const requestId = ++twitchChatRequestRef.current
        setTwitchChatViewer(prev => prev ? { ...prev, loadingFull: true } : prev)
        try {
            const result = await window.api.twitchDownloadChat({
                url: video.twitchUrl,
                id: video.twitchId,
                full: true,
            })
            if (twitchChatRequestRef.current !== requestId) return
            if (result?.ok === false) throw new Error(result.error || t('dlErrorDefault'))
            setTwitchChatViewer(prev => prev ? {
                ...prev,
                messages: result.messages || [],
                loadingFull: false,
                isComplete: true,
            } : prev)
        } catch (err) {
            if (twitchChatRequestRef.current !== requestId) return
            const text = (errorMessage(err) || t('dlErrorDefault')).trim()
            setTwitchChatViewer(prev => prev ? { ...prev, loadingFull: false } : prev)
            reportError({ title: video.title || 'Twitch chat', stderr: text, hint: '' })
        }
    }

    const handleTwitchCloseChat = () => {
        twitchChatRequestRef.current += 1
        setTwitchChatViewer(null)
        setTwitchChatQuery('')
    }

    const handleTwitchRetryChat = () => {
        const video = twitchChatViewer?.video
        if (video) handleTwitchOpenChat(video)
    }

    const handleTwitchExportChat = async (format: 'json' | 'txt') => {
        if (!twitchChatViewer?.video) return
        const resolvedOutputDir = outputDir
        setTwitchChatExporting(format)
        try {
            const result = await window.api.twitchExportChat({
                url: twitchChatViewer.video.twitchUrl,
                id: twitchChatViewer.video.twitchId,
                format,
                outputDir: resolvedOutputDir,
            })
            if (result?.ok === false) throw new Error(result.error || t('dlErrorDefault'))
            if (result?.outputPath) await handleOpenOutputLocation(result.outputPath)
        } catch (err) {
            const text = (errorMessage(err) || t('dlErrorDefault')).trim()
            reportError({ title: twitchChatViewer.video.title || 'Twitch chat', stderr: text, hint: '' })
        } finally {
            setTwitchChatExporting('')
        }
    }
    return { twitchChatViewer, twitchChatQuery, setTwitchChatQuery, twitchChatExporting, handleTwitchOpenChat,
        handleTwitchLoadFullChat, handleTwitchCloseChat, handleTwitchRetryChat, handleTwitchExportChat }
}
