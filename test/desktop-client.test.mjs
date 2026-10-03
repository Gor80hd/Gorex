import test from 'node:test'
import assert from 'node:assert/strict'
import { createDesktopBridge } from '../src/renderer/src/desktopClient.ts'

test('native queue controls are awaited and command failures reach the caller', async () => {
    const calls = []
    const client = createDesktopBridge({
        invoke: async (command, args) => { calls.push([command, args]); if (command === 'pause_all') throw new Error('cannot pause'); return { revision: 1 } },
        listen: async () => () => {},
    }, 'darwin')
    const requests = [{ kind: 'ffmpeg', request: { id: 4, filePath: '/video.mp4' }, task: { id: 4 } }]
    assert.deepEqual(await client.startQueue(requests), { revision: 1 })
    assert.deepEqual(calls[0], ['start_queue', { requests }])
    await assert.rejects(client.pauseAll(), /cannot pause/)
    await client.stopAll()
    assert.equal(calls.at(-1)[0], 'stop_all')
})

test('unmounting before native listener registration completes still releases it', async () => {
    let deliver
    let finishRegistration
    let stopped = 0
    let delivered = 0
    const client = createDesktopBridge({
        invoke: async () => {},
        listen: (_event, callback) => { deliver = callback; return new Promise(resolve => { finishRegistration = resolve }) },
    }, 'win32')
    const unsubscribe = client.onQueueState(() => { delivered += 1 })
    unsubscribe()
    deliver({ payload: { revision: 1 } })
    finishRegistration(() => { stopped += 1 })
    await Promise.resolve()
    assert.equal(stopped, 1)
    assert.equal(delivered, 0)
})
