import test from 'node:test'
import assert from 'node:assert/strict'
import {
    getDefaultEncoderSpeed,
    normalizeEncoderSettings,
    normalizeEncoderSpeed,
} from '../src/renderer/src/components/GlobalSettings/settingsNormalization.mjs'

const PRESETS = {
    nvenc_h265: [
        { value: 'p1' },
        { value: 'p2' },
        { value: 'p3' },
        { value: 'p4' },
        { value: 'p5', recommended: true },
        { value: 'p6' },
        { value: 'p7' },
    ],
    qsv_h265: [
        { value: 'balanced', recommended: true },
        { value: 'slow' },
    ],
    x265: [
        { value: 'medium' },
        { value: 'slow', recommended: true },
    ],
    theora: [],
}

test('normalizes invalid NVENC speed to the recommended p preset', () => {
    assert.equal(normalizeEncoderSpeed('nvenc_h265', 'slow', PRESETS), 'p5')
})

test('keeps speed values that are valid for the selected encoder', () => {
    assert.equal(normalizeEncoderSpeed('qsv_h265', 'slow', PRESETS), 'slow')
})

test('maps legacy NVENC aliases before validating presets', () => {
    assert.equal(normalizeEncoderSpeed('nvenc_h265', 'hq', PRESETS), 'p5')
    assert.equal(normalizeEncoderSpeed('nvenc_h265', 'default', PRESETS), 'p4')
})

test('uses recommended presets for default encoder speed', () => {
    assert.equal(getDefaultEncoderSpeed('nvenc_h265', PRESETS), 'p5')
    assert.equal(getDefaultEncoderSpeed('x265', PRESETS), 'slow')
})

test('normalizes whole settings objects without mutating the original', () => {
    const original = { encoder: 'nvenc_h265', encoderSpeed: 'slow', quality: 'high' }
    const normalized = normalizeEncoderSettings(original, PRESETS)

    assert.equal(normalized.encoderSpeed, 'p5')
    assert.equal(original.encoderSpeed, 'slow')
    assert.equal(normalized.quality, 'high')
})

test('clears stale speed when an encoder has no preset list', () => {
    assert.deepEqual(
        normalizeEncoderSettings({ encoder: 'theora', encoderSpeed: 'slow' }, PRESETS),
        { encoder: 'theora', encoderSpeed: undefined },
    )
})
