import test from 'node:test'
import assert from 'node:assert/strict'
import {
    getMissingToolStatus,
    isToolUpdateAlreadyRunningError,
    shouldAutoDownloadMissingTool,
    shouldAutoUpdateExistingTool,
} from '../src/renderer/src/toolAutoUpdatePolicy.mjs'

test('auto-downloads a missing tool only when auto update is enabled and idle', () => {
    assert.equal(shouldAutoDownloadMissingTool({ found: false }, { autoUpdate: true, isEncoding: false }), true)
    assert.equal(shouldAutoDownloadMissingTool({ found: false }, { autoUpdate: false, isEncoding: false }), false)
    assert.equal(shouldAutoDownloadMissingTool({ found: false }, { autoUpdate: true, isEncoding: true }), false)
    assert.equal(shouldAutoDownloadMissingTool({ found: true }, { autoUpdate: true, isEncoding: false }), false)
})

test('auto-updates an existing tool only when a newer version is available and idle', () => {
    assert.equal(shouldAutoUpdateExistingTool({ found: true }, true, { autoUpdate: true, isEncoding: false }), true)
    assert.equal(shouldAutoUpdateExistingTool({ found: true }, false, { autoUpdate: true, isEncoding: false }), false)
    assert.equal(shouldAutoUpdateExistingTool({ found: true }, true, { autoUpdate: false, isEncoding: false }), false)
    assert.equal(shouldAutoUpdateExistingTool({ found: true }, true, { autoUpdate: true, isEncoding: true }), false)
    assert.equal(shouldAutoUpdateExistingTool({ found: false }, true, { autoUpdate: true, isEncoding: false }), false)
})

test('missing tools stay actionable in the UI', () => {
    assert.equal(getMissingToolStatus({ found: false }, { autoUpdate: false }), 'update-available')
    assert.equal(getMissingToolStatus({ found: true }, { autoUpdate: true }), null)
})

test('already-running update messages are not treated as failed updates', () => {
    assert.equal(isToolUpdateAlreadyRunningError('Обновление TwitchDownloaderCLI уже выполняется'), true)
    assert.equal(isToolUpdateAlreadyRunningError('TwitchDownloaderCLI update is already running'), true)
    assert.equal(isToolUpdateAlreadyRunningError('GitHub вернул HTTP 500'), false)
})