export const ACTIVE_STATUSES = [
  'encoding', 'downloading', 'downloading-subs', 'probing-keyframes',
  'cutting-sponsors', 'converting',
] as const

export type ActiveStatus = (typeof ACTIVE_STATUSES)[number]
export type TaskId = string | number
export type TaskStatus = 'ready' | 'format_select' | ActiveStatus | 'done' | 'error'

export interface QueueTask {
  id: TaskId
  status: TaskStatus
  progress: number
  startTime?: number
  endTime?: number
  outputPath?: string | null
}

export function hasActiveJobs(items: readonly QueueTask[]): boolean {
  return items.some(item => ACTIVE_STATUSES.some(status => status === item.status))
}

export function applyJobProgress<T extends QueueTask>(items: readonly T[], id: TaskId, progress: number, status: ActiveStatus, now = Date.now()): T[] {
  if (!Number.isFinite(progress)) return [...items]
  const clamped = Math.max(0, Math.min(100, progress))
  return items.map(item => item.id === id
    ? { ...item, progress: Math.max(item.progress || 0, clamped), status, startTime: item.startTime ?? now }
    : item)
}

export function startConversion<T extends QueueTask>(items: readonly T[], id: TaskId, now = Date.now()): T[] {
  return items.map(item => item.id === id
    ? { ...item, progress: 0, status: 'converting', startTime: now, outputPath: null }
    : item)
}

export function finishJob<T extends QueueTask>(items: readonly T[], id: TaskId, code: number, outputPath?: string | null, now = Date.now()): T[] {
  return items.map(item => item.id === id
    ? {
        ...item,
        progress: code === 0 ? 100 : item.progress,
        status: code === 0 ? 'done' : 'error',
        endTime: now,
        outputPath: code === 0 ? (outputPath || item.outputPath || null) : null,
      }
    : item)
}
