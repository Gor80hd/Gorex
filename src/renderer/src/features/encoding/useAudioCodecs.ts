import { useEffect, useState } from 'react'
import { useLanguage } from '../../i18n'
import { getAudioCodecOptions } from './encodingOptions'

let capabilities: Promise<Set<string> | null> | undefined

export function useAudioCodecs() {
    const { t } = useLanguage()
    const [encoders, setEncoders] = useState<Set<string> | null>(null)
    useEffect(() => {
        let subscribed = true
        capabilities ??= window.api.checkCli().then(info =>
            info.encoders ? new Set(info.encoders) : null,
        ).catch(() => null)
        void capabilities.then(value => { if (subscribed) setEncoders(value) })
        return () => { subscribed = false }
    }, [])

    return getAudioCodecOptions(encoders, t)
}
