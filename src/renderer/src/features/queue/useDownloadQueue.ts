import { normalizeEncoderSettings } from '../../components/GlobalSettings/settingsModel'
import { useEffect, useRef, useState, type Dispatch, type SetStateAction, type MutableRefObject } from 'react'
import { errorMessage, type CliLog, type AppConfig, type DownloadService, type DownloadOptions, type EncodingSettings, type MediaFormat, type VideoTask, type TwitchVideo, type TwitchChannelPicker, type YtdlOptions, type Translate, type View } from '../../domain'
import type { TaskId } from '../../queueState'
import { getTwitchQualityLabel, isTwitchUrl, normalizeTwitchSelectedQuality } from '../twitch/twitchQueue'

type LoadingMessage = { type?: string; title?: string; subtitle?: string }
type Options = {
    onAutoStart: () => void
    selectedSettings: EncodingSettings; appSettings: AppConfig | null; t: Translate
    setView: Dispatch<SetStateAction<View>>; setVideos: Dispatch<SetStateAction<VideoTask[]>>
    nextIdRef: MutableRefObject<number>; setIsLoading: Dispatch<SetStateAction<boolean>>
    setLoadingMessage: Dispatch<SetStateAction<LoadingMessage | null>>
    appendLog: (entry: CliLog) => void
    setYtdlFetchError: Dispatch<SetStateAction<string | null>>
}
export function useDownloadQueue({ onAutoStart, selectedSettings, appSettings, t, setView, setVideos, nextIdRef, setIsLoading, setLoadingMessage, appendLog, setYtdlFetchError }: Options) {
    const [twitchChannelPicker, setTwitchChannelPicker] = useState<TwitchChannelPicker | null>(null)
    const metadataRequestRef = useRef(0)
    const ytdlFetchCancelledRef = useRef(false)
    useEffect(() => () => { metadataRequestRef.current += 1; ytdlFetchCancelledRef.current = true }, [])

    const handleTwitchDownload = async (url: string, service: DownloadService | null, extensionOpts: DownloadOptions | null = null) => {
        const requestId = ++metadataRequestRef.current
        const isCurrentRequest = () => metadataRequestRef.current === requestId
        setIsLoading(true)
        setLoadingMessage({ type: 'twitch', title: t('loadingFetchingFormats'), subtitle: t('twitchLoadingResolving') })
        try {
            const resolved = await window.api.twitchResolveUrl(url)
            if (!isCurrentRequest()) return
            if (resolved?.ok === false) throw new Error(resolved.error || t('dlErrorDefault'))

            if (resolved.type === 'channel') {
                setLoadingMessage({ type: 'twitch', title: t('twitchChannelVideosTitle'), subtitle: t('twitchLoadingChannel') })
                const result = await window.api.twitchGetChannelVideos(resolved.channel || '', { limit: 36 })
                if (!isCurrentRequest()) return
                if (result?.ok === false) throw new Error(result.error || t('dlErrorDefault'))
                setTwitchChannelPicker({
                    channel: result.channel,
                    displayName: result.displayName || result.channel,
                    avatar: result.avatar || '',
                    videos: result.videos || [],
                })
                setView('list')
                return
            }

            const info = resolved.info || {}
            const parsed = resolved.parsed || {}
            const safeOutputName = (info.title || (resolved.type === 'clip' ? 'Twitch Clip' : 'Twitch VOD'))
                .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
                .replace(/\.+$/, '')
                .trim() || 'Twitch Video'
            const twitchService = service || { name: 'Twitch', color: '#9146ff' }
            const quality = normalizeTwitchSelectedQuality(info)
            const newVideo: VideoTask = {
                id: nextIdRef.current++,
                isTwitchItem: true,
                twitchType: resolved.type,
                twitchId: info.id || parsed.id || '',
                twitchUrl: info.url || parsed.sourceUrl || url,
                title: info.title || safeOutputName,
                outputName: safeOutputName,
                thumbnail: info.thumbnail || '',
                duration: info.duration || '',
                durationSecs: info.durationSeconds || 0,
                channel: info.channel || parsed.channel || '',
                resolution: info.resolution || quality.label || '',
                videoResolution: info.videoResolution || '',
                twitchQuality: quality.selected,
                twitchQualityOptions: quality.options,
                status: 'format_select',
                progress: 0,
                downloadService: twitchService,
                convertAfterDownload: extensionOpts?.convertAfterDownload ?? false,
                conversionSettings: extensionOpts?.convertAfterDownload ? selectedSettings : null,
                customSettings: null,
                clipStart: extensionOpts?.clipStart ?? null,
                clipEnd: extensionOpts?.clipEnd ?? null,
            }
            if (extensionOpts?.autoStart) onAutoStart()
            setVideos(prev => [...prev, newVideo])
            setView('list')
        } catch (err) {
            if (!isCurrentRequest()) return
            console.error('Failed to fetch Twitch data:', err)
            const errText = `[Twitch] Ошибка получения данных:\n${errorMessage(err)}\n`
            appendLog({ type: 'err', text: errText })
            setYtdlFetchError(errorMessage(err) || t('dlErrorDefault'))
            throw err
        } finally {
            if (isCurrentRequest()) {
                setIsLoading(false)
                setLoadingMessage(null)
            }
        }
    }

    const handleTwitchCancel = () => {
        metadataRequestRef.current += 1
        setIsLoading(false)
        setLoadingMessage(null)
    }
    const handleDownload = async (url: string, service: DownloadService | null, extensionOpts: DownloadOptions | null = null) => {
        if (isTwitchUrl(url)) {
            await handleTwitchDownload(url, service, extensionOpts)
            return
        }
        const requestId = ++metadataRequestRef.current
        const isCurrentRequest = () => metadataRequestRef.current === requestId
        ytdlFetchCancelledRef.current = false
        setIsLoading(true)
        setLoadingMessage({ title: t('loadingFetchingFormats'), subtitle: t('loadingStageYtdlp') })

        const stageLabels: Record<string, () => string> = {
            ytdlp:       () => t('loadingStageYtdlp'),
            scraping:    () => t('loadingStageScraping'),
            queryparams: () => t('loadingStageQueryparams'),
            retry:       () => t('loadingStageRetry'),
        }
        const stopFetchProgress = window.api.onYtdlFetchProgress(({ stage, total }) => {
            if (!isCurrentRequest()) return
            if (stage === 'retry') {
                const subtitle = (total || 0) > 1
                    ? t('loadingStageRetryMany').replace('{n}', String(total))
                    : t('loadingStageRetry')
                setLoadingMessage({ title: t('loadingFetchingFormats'), subtitle })
            } else if (stageLabels[stage]) {
                setLoadingMessage({ title: t('loadingFetchingFormats'), subtitle: stageLabels[stage]() })
            }
        })

        try {
            const infos = await window.api.ytdlGetFormats(url)
            if (ytdlFetchCancelledRef.current || !isCurrentRequest()) return

            const newVideos: VideoTask[] = infos.map(info => {
                const safeOutputName = (info.title || 'video')
                    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
                    .replace(/\.+$/, '')
                    .trim() || 'video'

                let bestFormatId = ''
                if (info.formats && info.formats.length) {
                    const seen = new Map<string, MediaFormat>()
                    for (const f of info.formats) {
                        if (!f.vcodec || f.vcodec === 'none') continue
                        const base = (f.vcodec || '').split('.')[0].toLowerCase()
                        const key = `${f.height || 0}_${base}`
                        const prev = seen.get(key)
                        if (!prev || (f.tbr || 0) > (prev.tbr || 0)) seen.set(key, f)
                    }
                    const sorted = [...seen.values()].sort((a, b) => (b.height || 0) - (a.height || 0))
                    bestFormatId = sorted[0]?.format_id || ''
                }
                // If extension pre-selected a specific format, use it
                const selectedFmt = extensionOpts?.preselectedFormat || bestFormatId

                return {
                    id: nextIdRef.current++,
                    isYtdlItem: true,
                    ytdlUrl: info.resolvedUrl || url,
                    ytdlFormats: info.formats,
                    ytdlSelectedFormat: selectedFmt,
                    ytdlChapters: info.chapters || [],
                    ytdlDuration: info.duration || 0,
                    ytdlAvailableSubs: info.availableSubs || [],
                    ytdlAvailableAutoSubs: info.availableAutoSubs || [],
                    clipStart: extensionOpts?.clipStart ?? null,
                    clipEnd: extensionOpts?.clipEnd ?? null,
                    title: info.title,
                    outputName: safeOutputName,
                    thumbnail: info.thumbnailUrl,
                    status: 'format_select',
                    progress: 0,
                    downloadService: service,
                    convertAfterDownload: extensionOpts?.convertAfterDownload ?? false,
                    conversionSettings: extensionOpts?.convertAfterDownload ? selectedSettings : null,
                    customSettings: null,
                    ytdlNoAudio: extensionOpts?.audioOnly ?? false,
                    ytdlAudioFormat: appSettings?.defaultAudioFormat || 'wav',
                }
            })
            if (extensionOpts?.autoStart && newVideos.length) onAutoStart()
            setVideos(prev => [...prev, ...newVideos])
            setView('list')
        } catch (err) {
            if (ytdlFetchCancelledRef.current || !isCurrentRequest()) return
            console.error('Failed to fetch yt-dlp formats:', err)
            const errText = `[yt-dlp] Ошибка получения метаданных:\n${errorMessage(err)}\n`
            appendLog({ type: 'err', text: errText })
            setYtdlFetchError(errorMessage(err) || t('dlErrorDefault'))
            throw err
        } finally {
            stopFetchProgress?.()
            if (isCurrentRequest()) { setIsLoading(false); setLoadingMessage(null) }
        }
    }

    const handleDownloadCancel = () => {
        metadataRequestRef.current += 1
        ytdlFetchCancelledRef.current = true
        window.api.ytdlCancelFetch()
        setIsLoading(false)
        setLoadingMessage(null)
    }

    const handleYtdlFormatChange = (id: TaskId, formatId: string) => {
        setVideos(prev => prev.map(v => v.id === id ? { ...v, ytdlSelectedFormat: formatId } : v))
    }

    const handleYtdlConvertToggle = (id: TaskId, val: boolean) => {
        setVideos(prev => prev.map(v => v.id === id ? { ...v, convertAfterDownload: val } : v))
    }

    const handleYtdlConversionSettings = (id: TaskId, settings: EncodingSettings | null) => {
        setVideos(prev => prev.map(v => v.id === id ? { ...v, conversionSettings: settings ? normalizeEncoderSettings(settings) : null } : v))
    }

    const handleYtdlClipChange = (id: TaskId, clipStart: number | null, clipEnd: number | null) => {
        setVideos(prev => prev.map(v => v.id === id ? { ...v, clipStart, clipEnd } : v))
    }

    const handleLocalClipChange = (id: TaskId, clipStart: number | null, clipEnd: number | null) => {
        setVideos(prev => prev.map(v => v.id === id ? { ...v, clipStart, clipEnd } : v))
    }

    const handleYtdlOptionsChange = (id: TaskId, opts: YtdlOptions) => {
        setVideos(prev => prev.map(v =>
            v.id === id ? { ...v,
                ytdlNoAudio:          opts.noAudio,
                ytdlDownloadSubs:     opts.downloadSubs,
                ytdlAutoSubs:         opts.autoSubs,
                ytdlSubLangs:         opts.subLangs,
                ytdlSubFormat:        opts.subFormat,
                ytdlAudioFormat:      opts.audioFormat,
                ytdlSponsorBlock:     opts.sponsorBlock,
                ytdlSponsorBlockCats: opts.sponsorBlockCats,
            } : v
        ))
    }

    const handleTwitchAddChannelVideos = (items: TwitchVideo[]) => {
        const selected = Array.isArray(items) ? items : []
        if (!selected.length) return
        const twitchService = { name: 'Twitch', color: '#9146ff' }
        const newVideos: VideoTask[] = selected.map(info => {
            const safeOutputName = (info.title || 'Twitch VOD')
                .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
                .replace(/\.+$/, '')
                .trim() || 'Twitch VOD'
            const quality = normalizeTwitchSelectedQuality(info)
            return {
                id: nextIdRef.current++,
                isTwitchItem: true,
                twitchType: info.type || 'vod',
                twitchId: info.id || '',
                twitchUrl: info.url || `https://www.twitch.tv/videos/${info.id}`,
                title: info.title || safeOutputName,
                outputName: safeOutputName,
                thumbnail: info.thumbnail || '',
                duration: info.duration || '',
                durationSecs: info.durationSeconds || 0,
                channel: info.channel || twitchChannelPicker?.displayName || '',
                resolution: info.resolution || quality.label || '',
                videoResolution: info.videoResolution || '',
                twitchQuality: quality.selected,
                twitchQualityOptions: quality.options,
                status: 'format_select',
                progress: 0,
                downloadService: twitchService,
                convertAfterDownload: false,
                conversionSettings: null,
                customSettings: null,
                clipStart: null,
                clipEnd: null,
            }
        })
        setVideos(prev => [...prev, ...newVideos])
        setTwitchChannelPicker(null)
        setView('list')
    }

    const handleTwitchConvertToggle = (id: TaskId, val: boolean) => {
        setVideos(prev => prev.map(v => v.id === id ? { ...v, convertAfterDownload: val, conversionSettings: val ? (v.conversionSettings || selectedSettings) : null } : v))
    }

    const handleTwitchQualityChange = (id: TaskId, qualityValue: string) => {
        setVideos(prev => prev.map(v => {
            if (v.id !== id) return v
            const options = Array.isArray(v.twitchQualityOptions) ? v.twitchQualityOptions : []
            const selected = options.find(option => option?.value === qualityValue)
            const label = selected?.label || getTwitchQualityLabel(options, qualityValue)
            const selectedResolution = selected?.width && selected?.height
                ? `${selected.width}x${selected.height}`
                : v.videoResolution
            return { ...v, twitchQuality: qualityValue, resolution: label || v.resolution || '', videoResolution: selectedResolution || '' }
        }))
    }

    return { twitchChannelPicker, setTwitchChannelPicker, handleDownload, handleDownloadCancel, handleTwitchCancel,
        handleYtdlFormatChange, handleYtdlConvertToggle, handleYtdlConversionSettings, handleYtdlClipChange,
        handleLocalClipChange, handleYtdlOptionsChange, handleTwitchAddChannelVideos, handleTwitchConvertToggle, handleTwitchQualityChange }
}
