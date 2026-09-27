import { getAudioOnlyFormatConfig } from '../../main/ytdlHelpers.mjs'

export const FORMAT_EXT = {
    av_mp4: 'mp4', av_mkv: 'mkv', av_webm: 'webm', av_mov: 'mov',
    av_avi: 'avi', av_flv: 'flv', av_ts: 'ts', av_ogg: 'ogg', av_3gp: '3gp',
    audio_mp3: 'mp3', audio_m4a: 'm4a', audio_flac: 'flac',
    audio_wav: 'wav', audio_opus: 'opus', audio_ogg: 'ogg',
}

const CODEC_RF_TABLE = {
    x264:          { high: 18, medium: 23, low: 30, potato: 51, lossless: 0  },
    x264_10bit:    { high: 18, medium: 23, low: 30, potato: 51, lossless: 0  },
    x265:          { high: 20, medium: 26, low: 34, potato: 51, lossless: 0  },
    x265_10bit:    { high: 20, medium: 26, low: 34, potato: 51, lossless: 0  },
    x265_12bit:    { high: 20, medium: 26, low: 34, potato: 51, lossless: 0  },
    svt_av1:       { high: 28, medium: 38, low: 50, potato: 63, lossless: 1  },
    svt_av1_10bit: { high: 28, medium: 38, low: 50, potato: 63, lossless: 1  },
    vp8:           { high: 5,  medium: 15, low: 30, potato: 63, lossless: 0  },
    vp9:           { high: 24, medium: 34, low: 46, potato: 63, lossless: 0  },
    vp9_10bit:     { high: 24, medium: 34, low: 46, potato: 63, lossless: 0  },
    nvenc_h264:    { high: 18, medium: 24, low: 32, potato: 51, lossless: 0  },
    nvenc_h265:    { high: 20, medium: 28, low: 38, potato: 51, lossless: 0  },
    nvenc_av1:     { high: 20, medium: 28, low: 38, potato: 51, lossless: 0  },
    qsv_h264:      { high: 18, medium: 24, low: 32, potato: 51, lossless: 0  },
    qsv_h265:      { high: 20, medium: 28, low: 38, potato: 51, lossless: 0  },
    qsv_av1:       { high: 20, medium: 28, low: 38, potato: 51, lossless: 0  },
    vce_h264:      { high: 18, medium: 24, low: 32, potato: 51, lossless: 0  },
    vce_h265:      { high: 20, medium: 28, low: 38, potato: 51, lossless: 0  },
    vce_av1:       { high: 20, medium: 28, low: 38, potato: 51, lossless: 0  },
    mf_h264:       { high: 18, medium: 24, low: 32, potato: 51, lossless: 0  },
    mf_h265:       { high: 20, medium: 28, low: 38, potato: 51, lossless: 0  },
    vt_h264:       { high: 18, medium: 26, low: 42, potato: 70, lossless: 0  },
    vt_h265:       { high: 20, medium: 28, low: 44, potato: 70, lossless: 0  },
    theora:        { high: 8,  medium: 6,  low: 3,  potato: 0,  lossless: 10 },
    libaom_av1:    { high: 24, medium: 33, low: 45, potato: 63, lossless: 0  },
    mpeg4:         { high: 3,  medium: 8,  low: 18, potato: 31, lossless: 1  },
    mpeg2video:    { high: 2,  medium: 6,  low: 15, potato: 31, lossless: 1  },
    mpeg1video:    { high: 2,  medium: 6,  low: 15, potato: 31, lossless: 1  },
    prores_ks:     { high: 3,  medium: 2,  low: 1,  potato: 0,  lossless: 5  },
    dnxhd:         { high: 3,  medium: 2,  low: 1,  potato: 0,  lossless: 3  },
    ffv1:          { high: 0,  medium: 0,  low: 0,  potato: 0,  lossless: 0  },
    huffyuv:       { high: 0,  medium: 0,  low: 0,  potato: 0,  lossless: 0  },
    mjpeg:         { high: 2,  medium: 8,  low: 18, potato: 31, lossless: 2  },
    wmv2:          { high: 2,  medium: 8,  low: 18, potato: 31, lossless: 2  },
    wmv1:          { high: 2,  medium: 8,  low: 18, potato: 31, lossless: 2  },
    h263p:         { high: 3,  medium: 8,  low: 18, potato: 31, lossless: 1  },
    h263:          { high: 3,  medium: 8,  low: 18, potato: 31, lossless: 1  },
    flv1:          { high: 3,  medium: 8,  low: 18, potato: 31, lossless: 1  },
}

// Video encoder name → FFmpeg codec name
const ENCODER_CODEC_MAP = {
    x264:          'libx264',
    x264_10bit:    'libx264',
    x265:          'libx265',
    x265_10bit:    'libx265',
    x265_12bit:    'libx265',
    svt_av1:       'libsvtav1',
    svt_av1_10bit: 'libsvtav1',
    vp8:           'libvpx',
    vp9:           'libvpx-vp9',
    vp9_10bit:     'libvpx-vp9',
    nvenc_h264:    'h264_nvenc',
    nvenc_h265:    'hevc_nvenc',
    nvenc_av1:     'av1_nvenc',
    qsv_h264:      'h264_qsv',
    qsv_h265:      'hevc_qsv',
    qsv_av1:       'av1_qsv',
    vce_h264:      'h264_amf',
    vce_h265:      'hevc_amf',
    vce_av1:       'av1_amf',
    mf_h264:       'h264_mf',
    mf_h265:       'hevc_mf',
    vt_h264:       'h264_videotoolbox',
    vt_h265:       'hevc_videotoolbox',
    theora:        'libtheora',
    // ── Additional / Legacy / Professional ─────────────────────────────────────────────────
    libaom_av1:    'libaom-av1',
    mpeg4:         'mpeg4',
    mpeg2video:    'mpeg2video',
    mpeg1video:    'mpeg1video',
    prores_ks:     'prores_ks',
    dnxhd:         'dnxhd',
    ffv1:          'ffv1',
    huffyuv:       'huffyuv',
    mjpeg:         'mjpeg',
    wmv2:          'wmv2',
    wmv1:          'wmv1',
    h263p:         'h263p',
    h263:          'h263',
    flv1:          'flv',
}

// Audio codec name → FFmpeg codec name
const AUDIO_CODEC_MAP = {
    av_aac:   'aac',
    fdk_aac:  'libfdk_aac',
    fdk_haac: 'libfdk_aac',
    mp3:      'libmp3lame',
    ac3:      'ac3',
    eac3:     'eac3',
    vorbis:   'libvorbis',
    flac16:   'flac',
    flac24:   'flac',
    opus:     'libopus',
    alac:     'alac',
    pcm_s16le: 'pcm_s16le',
    pcm_s24le: 'pcm_s24le',
    pcm_f32le: 'pcm_f32le',
    mp2:      'mp2',
    wmav2:    'wmav2',
}

// Mixdown name → channel count
const MIXDOWN_CHANNELS = {
    mono:      '1',
    stereo:    '2',
    dpl1:      '2',
    dpl2:      '2',
    '5point1': '6',
    '6point1': '7',
    '7point1': '8',
}

// Container format → FFmpeg -f value
const CONTAINER_FORMAT = {
    av_mp4:  'mp4',
    av_mkv:  'matroska',
    av_webm: 'webm',
    av_mov:  'mov',
    av_avi:  'avi',
    av_flv:  'flv',
    av_ts:   'mpegts',
    av_ogg:  'ogg',
    av_3gp:  '3gp',
    audio_mp3:  'mp3',
    audio_m4a:  'ipod',
    audio_flac: 'flac',
    audio_wav:  'wav',
    audio_opus: 'opus',
    audio_ogg:  'ogg',
}

// Subtitle codec appropriate for the output container
function subCodecForContainer(fmt) {
    if (fmt === 'av_mp4' || fmt === 'av_mov' || fmt === 'av_3gp') return 'mov_text'
    if (fmt === 'av_webm' || fmt === 'av_ogg') return 'webvtt'
    return 'srt'
}

// Build FFmpeg arguments for encoding.
// clipStart / clipEnd are in seconds (numbers or null).
export function buildFfmpegArgs(filePath, outputPath, settings, videoResolution, clipStart = null, clipEnd = null, passMode = null, platform = typeof process === "undefined" ? "win32" : process.platform) {
    const args = []
    const audioOnlyConfig = getAudioOnlyFormatConfig(settings.format)

    // ── Hardware decoding (before -i) ──────────────────────────────────────────
    if (!audioOnlyConfig && settings.hwDecoding === 'nvdec') {
        args.push('-hwaccel', 'nvdec')
    } else if (!audioOnlyConfig && settings.hwDecoding === 'qsv') {
        args.push('-hwaccel', 'qsv')
    } else if (!audioOnlyConfig && settings.hwDecoding === 'videotoolbox') {
        args.push('-hwaccel', 'videotoolbox')
    }

    // ── Input-side time seeking (fast, keyframe-accurate) ───────────────────────
    if (clipStart != null && clipStart > 0) {
        args.push('-ss', String(Math.max(0, clipStart)))
    }

    // ── External subtitle as second input (soft subs, no burn-in) ──────────────
    const extSubFile = settings.subtitleExternalFile || ''
    const subBurn = settings.subtitleBurn
    const subMode = settings.subtitleMode || 'none'
    const useExtSubAsInput = !!(extSubFile && !subBurn && !audioOnlyConfig)

    args.push('-i', filePath)

    if (useExtSubAsInput) {
        args.push('-i', extSubFile)
    }

    // ── Clip duration limit ─────────────────────────────────────────────────────
    if (clipEnd != null) {
        const dur = Math.max(1, clipEnd - (clipStart ?? 0))
        args.push('-t', String(dur))
    }

    const WEBM_AUDIO = new Set(['vorbis', 'opus'])
    if (audioOnlyConfig) {
        args.push('-vn')
        let audioCodec = settings.audioCodec || audioOnlyConfig.audioCodec
        if (audioCodec.startsWith('copy')) {
            args.push('-c:a', 'copy')
        } else {
            const ffAudio = AUDIO_CODEC_MAP[audioCodec] || AUDIO_CODEC_MAP[audioOnlyConfig.audioCodec] || 'aac'
            args.push('-c:a', ffAudio)
            if (audioCodec === 'fdk_haac') args.push('-profile:a', 'aac_he')
            if (audioCodec === 'flac24')   args.push('-sample_fmt', 's32')
            if (audioCodec === 'pcm_s24le') args.push('-sample_fmt', 's32')
            const noBitrateCodecs = ['flac16', 'flac24', 'pcm_s16le', 'pcm_s24le', 'pcm_f32le', 'alac']
            if (!noBitrateCodecs.includes(audioCodec)) {
                args.push('-b:a', `${settings.audioBitrate || 160}k`)
            }
            const channels = MIXDOWN_CHANNELS[settings.audioMixdown] || '2'
            args.push('-ac', channels)
            if (settings.audioSampleRate && settings.audioSampleRate !== 'auto') {
                args.push('-ar', settings.audioSampleRate)
            }
        }
        args.push('-sn')
        args.push('-map_metadata', settings.keepMetadata ? '0' : '-1')
        args.push('-map_chapters', settings.chapterMarkers !== false ? '0' : '-1')
        args.push('-f', audioOnlyConfig.container)
        args.push(outputPath)
        return args
    }
    // ── Video codec ─────────────────────────────────────────────────────────────
    const WEBM_VIDEO = new Set(['vp8', 'vp9', 'vp9_10bit', 'svt_av1', 'svt_av1_10bit', 'nvenc_av1', 'qsv_av1', 'vce_av1', 'libaom_av1'])
    const OGG_VIDEO  = new Set(['theora', 'vp8', 'vp9', 'vp9_10bit'])
    const FLV_VIDEO  = new Set(['flv1', 'x264', 'x264_10bit', 'nvenc_h264', 'qsv_h264', 'vce_h264', 'mf_h264', 'vt_h264'])
    const GP3_VIDEO  = new Set(['h263', 'h263p', 'x264', 'x264_10bit', 'nvenc_h264', 'qsv_h264', 'vce_h264', 'mf_h264', 'vt_h264', 'mpeg4'])
    let encoder = settings.encoder || 'x265'
    if (settings.format === 'av_webm' && !WEBM_VIDEO.has(encoder)) encoder = 'vp9'
    if (settings.format === 'av_ogg'  && !OGG_VIDEO.has(encoder))  encoder = 'theora'
    if (settings.format === 'av_flv'  && !FLV_VIDEO.has(encoder))  encoder = 'flv1'
    if (settings.format === 'av_3gp'  && !GP3_VIDEO.has(encoder))  encoder = 'h263p'

    const ffCodec = ENCODER_CODEC_MAP[encoder] || 'libx265'
    args.push('-c:v', ffCodec)

    // Pixel format for 10/12-bit variants
    if (encoder.endsWith('_10bit')) {
        args.push('-pix_fmt', 'yuv420p10le')
    } else if (encoder.endsWith('_12bit')) {
        args.push('-pix_fmt', 'yuv420p12le')
    } else {
        // Encoders that only support 8-bit YUV: force yuv420p so that 10-bit HDR
        // sources (e.g. VP9 Profile 2 / H.265 Main10) don't cause "10 bit encode
        // not supported" failures at runtime.
        const EIGHT_BIT_ONLY_CODECS = new Set([
            'libx264', 'h264_nvenc', 'h264_qsv', 'h264_amf', 'h264_mf', 'h264_videotoolbox',
            'libvpx', 'libtheora',
            'mpeg4', 'mpeg2video', 'mpeg1video', 'mjpeg', 'wmv2', 'wmv1', 'h263', 'h263p', 'flv',
        ])
        if (EIGHT_BIT_ONLY_CODECS.has(ffCodec)) {
            args.push('-pix_fmt', 'yuv420p')
        }
    }

    // ── Encoder speed preset ────────────────────────────────────────────────────
    if (settings.encoderSpeed) {
        if (['libx264', 'libx265', 'libsvtav1'].includes(ffCodec)) {
            args.push('-preset', settings.encoderSpeed)
        } else if (['h264_nvenc', 'hevc_nvenc', 'av1_nvenc'].includes(ffCodec)) {
            args.push('-preset', settings.encoderSpeed)
        } else if (['h264_qsv', 'hevc_qsv', 'av1_qsv'].includes(ffCodec)) {
            args.push('-preset', settings.encoderSpeed)
        } else if (['h264_amf', 'hevc_amf', 'av1_amf'].includes(ffCodec)) {
            args.push('-quality', settings.encoderSpeed)
        } else if (['h264_videotoolbox', 'hevc_videotoolbox'].includes(ffCodec)) {
            if (settings.encoderSpeed === 'quality') {
                args.push('-prio_speed', '0')
            } else if (settings.encoderSpeed === 'speed') {
                args.push('-realtime', '1', '-prio_speed', '1')
            }
        } else if (['libvpx', 'libvpx-vp9'].includes(ffCodec)) {
            args.push('-deadline', settings.encoderSpeed)
        } else if (ffCodec === 'libaom-av1') {
            args.push('-cpu-used', settings.encoderSpeed)
        } else if (ffCodec === 'prores_ks') {
            args.push('-profile:v', settings.encoderSpeed)
        } else if (ffCodec === 'dnxhd') {
            args.push('-profile:v', settings.encoderSpeed)
        }
    }

    // ── Quality (CRF / CQ / global_quality / q:v) ──────────────────────────────
    const rfTable = CODEC_RF_TABLE[encoder] || CODEC_RF_TABLE.x265
    const rfValue = settings.quality === 'lossless'
        ? rfTable.lossless
        : settings.quality === 'custom'
            ? (settings.customQuality ?? rfTable.medium)
            : (rfTable[settings.quality] ?? rfTable.medium)

    if (['libx264', 'libx265', 'libsvtav1'].includes(ffCodec)) {
        args.push('-crf', String(rfValue))
    } else if (['libvpx', 'libvpx-vp9'].includes(ffCodec)) {
        args.push('-crf', String(rfValue), '-b:v', '0')
    } else if (ffCodec === 'libaom-av1') {
        args.push('-crf', String(rfValue), '-b:v', '0')
    } else if (['h264_nvenc', 'hevc_nvenc', 'av1_nvenc'].includes(ffCodec)) {
        if (settings.quality === 'lossless' && ffCodec !== 'av1_nvenc') {
            // NVENC H264/H265 lossless: constant-QP mode (Maxwell GPU+, no -preset needed)
            args.push('-rc', 'constqp', '-qp', '0')
        } else {
            // For NVENC, CQ=0 means "disabled/auto", not maximum quality like CRF=0.
            // Must set -rc vbr to activate CQ mode and clamp to minimum CQ=1.
            const cqVal = Math.max(1, rfValue)
            args.push('-rc', 'vbr', '-cq', String(cqVal))
        }
    } else if (['h264_qsv', 'hevc_qsv', 'av1_qsv'].includes(ffCodec)) {
        args.push('-global_quality', String(rfValue))
    } else if (['h264_amf', 'hevc_amf', 'av1_amf'].includes(ffCodec)) {
        args.push('-rc', 'qvbr', '-qvbr_quality_level', String(rfValue))
    } else if (['h264_mf', 'hevc_mf'].includes(ffCodec)) {
        args.push('-q', String(rfValue))
    } else if (['h264_videotoolbox', 'hevc_videotoolbox'].includes(ffCodec)) {
        // VideoToolbox uses a 1–100 quality scale where higher is better.
        // Gorex stores RF-like values where lower is better, so invert it.
        args.push('-q:v', String(Math.max(1, 100 - rfValue)), '-allow_sw', '1')
    } else if (ffCodec === 'libtheora') {
        args.push('-q:v', String(rfValue))
    } else if (['mpeg4', 'mpeg2video', 'mpeg1video', 'mjpeg', 'wmv2', 'wmv1', 'h263', 'h263p', 'flv'].includes(ffCodec)) {
        args.push('-q:v', String(rfValue))
    }
    // ffv1 and huffyuv are lossless — no quality argument needed

    // ── Hardware encoder two-pass / lookahead ───────────────────────────────────────────
    // Software codec two-pass is handled separately via passMode (-pass 1/2 -passlogfile).
    // Hardware encoders require vendor-specific flags instead of the log-file approach.
    if (settings.multiPass && !passMode) {
        if (['h264_nvenc', 'hevc_nvenc', 'av1_nvenc'].includes(ffCodec) && settings.quality !== 'lossless') {
            args.push('-multipass', 'fullres')
        } else if (['h264_qsv', 'hevc_qsv', 'av1_qsv'].includes(ffCodec)) {
            args.push('-look_ahead', '1')
        } else if (['h264_amf', 'hevc_amf', 'av1_amf'].includes(ffCodec)) {
            args.push('-preanalysis', '1')
        }
    }

    // ── Alpha channel: override pix_fmt when supported ──────────────────────────────────
    if (settings.alphaChannel) {
        const ALPHA_PIX_FMT = {
            'libvpx-vp9': 'yuva420p',
            'ffv1':       'yuva420p',
            'libaom-av1': 'yuva420p',
            'prores_ks':  'yuva444p10le',
        }
        const alphaFmt = ALPHA_PIX_FMT[ffCodec]
        if (alphaFmt) {
            const pfIdx = args.lastIndexOf('-pix_fmt')
            if (pfIdx >= 0) {
                args[pfIdx + 1] = alphaFmt
            } else {
                args.push('-pix_fmt', alphaFmt)
            }
        }
    }

    // ── HDR applicability ────────────────────────────────────────────────────────
    // Dynamic HDR metadata (HDR10+, Dolby Vision) is only meaningful for codecs
    // that can output at least 10-bit colour depth.
    const HDR_CAPABLE_CODECS = new Set([
        'libx265',   'hevc_nvenc', 'hevc_qsv',  'hevc_amf', 'hevc_videotoolbox',
        'libsvtav1', 'av1_nvenc',  'av1_qsv',   'av1_amf', 'libaom-av1',
        'libvpx-vp9', 'ffv1', 'prores_ks', 'dnxhd',
    ])
    const hdrApplicable = !!(settings.hdrMetadata && settings.hdrMetadata !== 'off'
        && HDR_CAPABLE_CODECS.has(ffCodec))

    // ── Video filter chain ──────────────────────────────────────────────────────
    const vfFilters = []

    // Resolution scaling
    if (settings.resolution && settings.resolution !== 'source') {
        const heightMap = { '4k': 2160, '1440p': 1440, '1080p': 1080, '720p': 720, '480p': 480 }
        const targetH = heightMap[settings.resolution]
        if (targetH) {
            if (videoResolution) {
                const [srcW, srcH] = videoResolution.split('x').map(Number)
                if (srcW > 0 && srcH > 0) {
                    if (srcH > srcW) {
                        let outH = Math.round(srcH * (targetH / srcW))
                        if (outH % 2 !== 0) outH++
                        vfFilters.push(`scale=${targetH}:${outH}`)
                    } else {
                        let outW = Math.round(srcW * (targetH / srcH))
                        if (outW % 2 !== 0) outW++
                        vfFilters.push(`scale=${outW}:${targetH}`)
                    }
                } else {
                    vfFilters.push(`scale=-2:${targetH}`)
                }
            } else {
                vfFilters.push(`scale=-2:${targetH}`)
            }
        }
    }

    // FPS
    if (settings.fps && settings.fps !== 'source') {
        vfFilters.push(`fps=${settings.fps}`)
    }

    // Deinterlace
    if (settings.deinterlace && settings.deinterlace !== 'off') {
        const bob = settings.deinterlace.includes('bob') ? 1 : 0
        if (settings.deinterlace.startsWith('bwdif')) {
            vfFilters.push(`bwdif=mode=${bob}:parity=-1:deint=0`)
        } else {
            vfFilters.push(`yadif=mode=${bob}:parity=-1:deint=0`)
        }
    }

    // Denoise
    if (settings.denoise && settings.denoise !== 'off') {
        const DENOISE_MAP = {
            'nlmeans_ultralight': 'hqdn3d=1:0.7:1:1.5',
            'nlmeans_light':      'hqdn3d=2:1.5:2:2.5',
            'nlmeans_medium':     'hqdn3d=3:2:3:3',
            'nlmeans_strong':     'hqdn3d=7:5:7:5',
            'hqdn3d_light':       'hqdn3d=2:1:2:3',
            'hqdn3d_medium':      'hqdn3d=3:2:2:3',
            'hqdn3d_strong':      'hqdn3d=7:7:7:5',
        }
        const f = DENOISE_MAP[settings.denoise]
        if (f) vfFilters.push(f)
    }

    // Deblock
    if (settings.deblock && settings.deblock !== 'off') {
        const DEBLOCK_MAP = {
            ultralight: 'deblock=filter=weak:block=4',
            light:      'deblock=filter=weak:block=4',
            medium:     'deblock=filter=strong:block=4',
            strong:     'deblock=filter=strong:block=8',
            stronger:   'deblock=filter=strong:block=8',
        }
        const f = DEBLOCK_MAP[settings.deblock] || 'deblock=filter=weak:block=4'
        vfFilters.push(f)
    }

    // Sharpen
    if (settings.sharpen && settings.sharpen !== 'off') {
        const SHARPEN_MAP = {
            'unsharp_ultralight':  'unsharp=5:5:0.5:5:5:0',
            'unsharp_light':       'unsharp=5:5:0.75:5:5:0',
            'unsharp_medium':      'unsharp=5:5:1.0:5:5:0',
            'unsharp_strong':      'unsharp=5:5:1.5:5:5:0',
            'lapsharp_ultralight': 'unsharp=5:5:0.5:5:5:0',
            'lapsharp_light':      'unsharp=5:5:0.75:5:5:0',
            'lapsharp_medium':     'unsharp=5:5:1.0:5:5:0',
            'lapsharp_strong':     'unsharp=5:5:1.5:5:5:0',
        }
        const f = SHARPEN_MAP[settings.sharpen]
        if (f) vfFilters.push(f)
    }

    // Grayscale
    if (settings.grayscale) vfFilters.push('hue=s=0')

    // Rotate / flip
    if (settings.rotate && settings.rotate !== '0') {
        const ROT_MAP = {
            '90':    'transpose=1',
            '180':   'vflip,hflip',
            '270':   'transpose=2',
            'hflip': 'hflip',
        }
        const r = ROT_MAP[settings.rotate]
        if (r) vfFilters.push(r)
    }

    // Subtitle burn-in via filter
    if (extSubFile && subBurn) {
        const escaped = extSubFile.replace(/\\/g, '/').replace(/:/g, '\\:')
        vfFilters.push(`subtitles='${escaped}'`)
    }

    // HDR metadata: tag colour-space info in the filter graph so scalers/
    // converters downstream preserve BT.2020 primaries and PQ transfer.
    if (hdrApplicable) {
        vfFilters.push('setparams=color_primaries=bt2020:color_trc=smpte2084:colorspace=bt2020nc:range=tv')
    }

    if (vfFilters.length > 0) {
        args.push('-vf', vfFilters.join(','))
    }

    // HDR metadata: stream-level colour tags (effective even without a filter chain)
    if (hdrApplicable) {
        args.push('-color_primaries', 'bt2020')
        args.push('-color_trc',       'smpte2084')
        args.push('-colorspace',      'bt2020nc')
        args.push('-color_range',     'tv')
    }

    // CFR mode
    if (settings.fps && settings.fps !== 'source' && (settings.fpsMode || 'vfr') === 'cfr') {
        args.push('-vsync', 'cfr')
    }

    // ── Audio ────────────────────────────────────────────────────────────────────
    if (settings.noAudio || passMode?.pass === 1) {
        args.push('-an')
    } else {
        let audioCodec = settings.audioCodec || 'av_aac'
        if (settings.format === 'av_webm' && !WEBM_AUDIO.has(audioCodec) && !audioCodec.startsWith('copy')) {
            audioCodec = 'opus'
        }
        if (settings.format === 'av_ogg' && !WEBM_AUDIO.has(audioCodec) && !audioCodec.startsWith('copy')) {
            audioCodec = 'vorbis'
        }
        if (audioCodec.startsWith('copy')) {
            args.push('-c:a', 'copy')
        } else {
            const ffAudio = AUDIO_CODEC_MAP[audioCodec] || 'aac'
            args.push('-c:a', ffAudio)
            if (audioCodec === 'fdk_haac') args.push('-profile:a', 'aac_he')
            if (audioCodec === 'flac24')   args.push('-sample_fmt', 's32')
            if (audioCodec === 'pcm_s24le') args.push('-sample_fmt', 's32')
            const noBitrateCodecs = ['flac16', 'flac24', 'pcm_s16le', 'pcm_s24le', 'pcm_f32le', 'alac']
            if (!noBitrateCodecs.includes(audioCodec)) {
                args.push('-b:a', `${settings.audioBitrate || 160}k`)
            }
            const channels = MIXDOWN_CHANNELS[settings.audioMixdown] || '2'
            args.push('-ac', channels)
            if (settings.audioSampleRate && settings.audioSampleRate !== 'auto') {
                args.push('-ar', settings.audioSampleRate)
            }
        }
    }

    // ── Subtitle stream mapping, metadata, chapters (pass 2 / single-pass only) ──
    if (!passMode || passMode.pass !== 1) {
        if (extSubFile && subBurn) {
            // Burned into video — drop any existing subtitle streams
            args.push('-sn')
        } else if (useExtSubAsInput) {
            args.push('-map', '0:v:0', '-map', '0:a?', '-map', '1:0')
            args.push('-c:s', subCodecForContainer(settings.format))
        } else if (subMode === 'first' || subMode === 'scan_forced') {
            args.push('-map', '0:v:0', '-map', '0:a?', '-map', '0:s:0?')
            args.push('-c:s', subCodecForContainer(settings.format))
        } else if (subMode === 'all') {
            args.push('-map', '0:v:0', '-map', '0:a?', '-map', '0:s?')
            args.push('-c:s', subCodecForContainer(settings.format))
        } else {
            args.push('-sn')
        }

        // ── Metadata ──────────────────────────────────────────────────────────────
        args.push('-sn')
        args.push('-map_metadata', settings.keepMetadata ? '0' : '-1')

        // ── Chapter markers ───────────────────────────────────────────────────────
        args.push('-map_chapters', settings.chapterMarkers !== false ? '0' : '-1')
    }

    // ── x265-params: HDR metadata + inline parameter sets (merged) ─────────────
    // Both options may contribute x265-params; FFmpeg only honours the last
    // occurrence, so we accumulate all parts and emit a single flag.
    {
        const x265Parts = []
        if (hdrApplicable && ffCodec === 'libx265') {
            // hdr-opt=1  : copy mastering-display / MaxCLL SEI from source
            // repeat-headers : embed VPS/SPS/PPS at every keyframe (required for
            //                  HDR10+ streams in HLS/DASH and for some players)
            x265Parts.push('hdr-opt=1', 'repeat-headers=1')
        }
        if (settings.inlineParamSets) {
            if (ffCodec === 'libx264') {
                args.push('-x264-params', 'repeat_headers=1')
            } else if (ffCodec === 'libx265' && !x265Parts.includes('repeat-headers=1')) {
                x265Parts.push('repeat-headers=1')
            }
        }
        if (x265Parts.length > 0) {
            args.push('-x265-params', x265Parts.join(':'))
        }
    }

    // ── Two-pass encoding ────────────────────────────────────────────────────────
    const TWO_PASS_CODECS = new Set(['libx264', 'libx265', 'libsvtav1', 'libvpx', 'libvpx-vp9', 'libaom-av1'])
    if (passMode && TWO_PASS_CODECS.has(ffCodec)) {
        args.push('-pass', String(passMode.pass), '-passlogfile', passMode.passlogfile)
    }

    // ── MP4 fast-start (pass 2 / single-pass only) ──────────────────────────────
    if ((!passMode || passMode.pass !== 1) && settings.optimizeMP4 && settings.format === 'av_mp4') {
        args.push('-movflags', '+faststart')
    }

    // ── Container format + output ───────────────────────────────────────────────
    if (passMode?.pass === 1 && TWO_PASS_CODECS.has(ffCodec)) {
        args.push('-f', 'null', platform === 'win32' ? 'NUL' : '/dev/null')
    } else {
        args.push('-f', CONTAINER_FORMAT[settings.format] || 'mp4')
        args.push(outputPath)
    }

    return args
}
