export const AUDIO_CODECS = [
    { value: 'av_aac',      label: 'AAC (libavcodec)' },
    { value: 'fdk_aac',     label: 'AAC (FDK)' },
    { value: 'fdk_haac',    label: 'HE-AAC (FDK)' },
    { value: 'mp3',         label: 'MP3' },
    { value: 'mp2',         label: 'MP2' },
    { value: 'ac3',         label: 'AC-3 (Dolby Digital)' },
    { value: 'eac3',        label: 'E-AC-3 (Dolby Plus)' },
    { value: 'vorbis',      label: 'Vorbis' },
    { value: 'opus',        label: 'Opus' },
    { value: 'flac16',      label: 'FLAC 16-bit' },
    { value: 'flac24',      label: 'FLAC 24-bit' },
    { value: 'alac',        label: 'ALAC (Apple Lossless)' },
    { value: 'pcm_s16le',   label: 'PCM 16-bit (uncompressed)' },
    { value: 'pcm_s24le',   label: 'PCM 24-bit (uncompressed)' },
    { value: 'pcm_f32le',   label: 'PCM 32-bit Float' },
    { value: 'wmav2',       label: 'WMA v2' },
    { value: 'copy',        label: 'Passthru (auto)' },
    { value: 'copy:aac',    label: 'AAC Passthru' },
    { value: 'copy:ac3',    label: 'AC3 Passthru' },
    { value: 'copy:eac3',   label: 'E-AC3 Passthru' },
    { value: 'copy:dts',    label: 'DTS Passthru' },
    { value: 'copy:dtshd',  label: 'DTS-HD Passthru' },
    { value: 'copy:mp3',    label: 'MP3 Passthru' },
    { value: 'copy:truehd', label: 'TrueHD Passthru' },
]


export const EIGHT_BIT_ONLY_ENCODERS = new Set([
    'x264', 'x264_10bit',
    'nvenc_h264', 'qsv_h264', 'vce_h264', 'mf_h264', 'vt_h264',
    'vp8', 'theora',
    'mpeg4', 'mpeg2video', 'mpeg1video', 'mjpeg', 'wmv2', 'wmv1', 'h263p', 'h263', 'flv1',
])
