import test from 'node:test'
import assert from 'node:assert/strict'
import { applyJobProgress, finishJob, hasActiveJobs, startConversion } from '../src/renderer/src/queueState.ts'

test('queue progress preserves other tasks and cannot move backward', () => {
  const items = [{ id: 1, status: 'downloading', progress: 42, startTime: 10 }, { id: 2, status: 'ready', progress: 0 }]
  const updated = applyJobProgress(items, 1, 18, 'downloading', 20)
  assert.equal(updated[0].progress, 42)
  assert.equal(updated[0].startTime, 10)
  assert.equal(updated[1], items[1])
  assert.equal(items[0].progress, 42)
})

test('conversion resets progress and failed jobs retain their last useful progress', () => {
  const downloading = [{ id: 'abc', status: 'downloading', progress: 100, outputPath: '/tmp/file.mp4' }]
  const converting = startConversion(downloading, 'abc', 30)
  assert.deepEqual([converting[0].status, converting[0].progress, converting[0].outputPath], ['converting', 0, null])
  assert.equal(hasActiveJobs(converting), true)
  const failed = finishJob(applyJobProgress(converting, 'abc', 37, 'converting', 40), 'abc', 1, null, 50)
  assert.deepEqual([failed[0].status, failed[0].progress, failed[0].outputPath, failed[0].endTime], ['error', 37, null, 50])
  assert.equal(hasActiveJobs(failed), false)
})

test('successful jobs retain the final output path', () => {
  const done = finishJob([{ id: 9, status: 'encoding', progress: 88 }], 9, 0, '/movies/output.mp4', 100)
  assert.deepEqual([done[0].status, done[0].progress, done[0].outputPath], ['done', 100, '/movies/output.mp4'])
})
