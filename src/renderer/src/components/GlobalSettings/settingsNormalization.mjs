const NVENC_LEGACY_SPEED_MAP = {
    default: 'p4',
    hp: 'p2',
    hq: 'p5',
    bd: 'p4',
    ll: 'p2',
    llhq: 'p4',
    llhp: 'p1',
}

function getLegacySpeedAlias(encoder, speed) {
    if (!String(encoder || '').startsWith('nvenc_')) return null
    return NVENC_LEGACY_SPEED_MAP[String(speed || '').toLowerCase()] || null
}

function hasPresetValue(presets, speed) {
    return presets.some(preset => preset.value === speed)
}

export function getDefaultEncoderSpeed(encoder, presetsByEncoder, fallback = 'medium') {
    const presets = presetsByEncoder?.[encoder] ?? []
    if (!presets.length) return undefined

    return presets.find(preset => preset.recommended)?.value
        ?? presets[Math.floor(presets.length / 2)]?.value
        ?? fallback
}

export function normalizeEncoderSpeed(encoder, encoderSpeed, presetsByEncoder, fallback = 'medium') {
    const presets = presetsByEncoder?.[encoder] ?? []
    if (!presets.length) return undefined

    const current = encoderSpeed == null ? undefined : String(encoderSpeed)
    const candidate = getLegacySpeedAlias(encoder, current) || current

    if (candidate && hasPresetValue(presets, candidate)) {
        return candidate
    }

    return getDefaultEncoderSpeed(encoder, presetsByEncoder, fallback)
}

export function normalizeEncoderSettings(settings, presetsByEncoder, fallback = 'medium') {
    if (!settings) return settings

    const encoderSpeed = normalizeEncoderSpeed(settings.encoder, settings.encoderSpeed, presetsByEncoder, fallback)
    if (settings.encoderSpeed === encoderSpeed) return settings

    return { ...settings, encoderSpeed }
}
