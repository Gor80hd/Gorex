export function getEncoderErrorHint(stderr: string, t: (key: string) => string): string | null {
    if (/videotoolbox|compression session.*-\d+/i.test(stderr)) return t('gpuErrHwUnavailable')
    if (/No capable devices found/i.test(stderr)) {
        if (/av1_nvenc/i.test(stderr)) return t('gpuErrNvencAv1')
        if (/h265_nvenc|hevc_nvenc/i.test(stderr)) return t('gpuErrNvencH265')
        if (/nvenc/i.test(stderr)) return t('gpuErrNvenc')
        if (/av1_amf|av1_vce/i.test(stderr)) return t('gpuErrVceAv1')
        if (/av1_qsv/i.test(stderr)) return t('gpuErrQsvAv1')
        return t('gpuErrHwUnavailable')
    }
    if (/avcodec_open failed|Failure to initialise thread/i.test(stderr)) {
        if (/nvenc/i.test(stderr)) return t('gpuErrNvencInit')
        if (/qsv/i.test(stderr)) return t('gpuErrQsvInit')
        if (/vce|amf/i.test(stderr)) return t('gpuErrVceInit')
    }
    return null
}
