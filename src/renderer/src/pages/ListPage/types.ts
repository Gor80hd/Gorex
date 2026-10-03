import type { DragEvent } from 'react'
import type { TaskId } from '../../queueState'
import type { VideoTask, EncodingSettings, Theme, OutputMode, DownloadService, YtdlOptions, SettingsTab, TwitchChannelPicker, TwitchVideo } from '../../domain'

export interface QueueItemActions {
    onYtdlFormatChange: (id: TaskId, format: string) => void
    onYtdlConvertToggle: (id: TaskId, convert: boolean) => void
    onYtdlClipChange: (id: TaskId, start: number | null, end: number | null) => void
    onYtdlOptionsChange: (id: TaskId, options: YtdlOptions) => void
    onLocalClipChange: (id: TaskId, start: number | null, end: number | null) => void
    onOpenSettings: (tab: SettingsTab) => void
}
export interface VideoSettingsPanelProps extends QueueItemActions {
    video: VideoTask; globalSettings: EncodingSettings; systemPlatform: string
    onClose: () => void; onSave: (id: TaskId, settings: EncodingSettings | null) => void; onReset: (id: TaskId) => void
}
export interface ListPageProps extends QueueItemActions {
    videos: VideoTask[]; settings: EncodingSettings; isEncoding: boolean; theme: Theme
    onSettingsChange: (settings: EncodingSettings) => void; onStartEncoding: () => void | Promise<void>; onStop: () => void | Promise<void>
    outputMode: OutputMode; customOutputDir: string; defaultOutputDir: string; onOutputModeChange: (mode: OutputMode) => void | Promise<void>
    onAddFiles: () => void | Promise<void>; onDownload: (url: string, service: DownloadService | null) => Promise<void>
    onRemoveVideo: (id: TaskId) => void; onClearQueue: () => void; onRenameOutput: (id: TaskId, name: string) => void
    onVideoSettingsChange: (id: TaskId, settings: EncodingSettings | null) => void
    onYtdlConversionSettings: (id: TaskId, settings: EncodingSettings | null) => void
    twitchChannelPicker: TwitchChannelPicker | null; onTwitchAddChannelVideos: (videos: TwitchVideo[]) => void
    onTwitchCloseChannelPicker: () => void; onTwitchOpenChat: (video: VideoTask) => void | Promise<void>
    onTwitchConvertToggle: (id: TaskId, convert: boolean) => void; onTwitchQualityChange: (id: TaskId, quality: string) => void
    isDraggingOnList: boolean; onListDragEnter: (event: DragEvent<HTMLDivElement>) => void
    onListDragLeave: (event: DragEvent<HTMLDivElement>) => void; onListDragOver: (event: DragEvent<HTMLDivElement>) => void; onListDrop: (event: DragEvent<HTMLDivElement>) => void
    gpuVendor: string; systemPlatform: string; encodingStartTime: number | null
    onOpenOutputLocation: (path: string) => void | Promise<void>
}
