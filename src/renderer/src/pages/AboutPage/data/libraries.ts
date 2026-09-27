export type LibraryRuntime = 'tauri' | 'electron'

export interface LibraryCredit {
    name: string
    url: string
    license: string
    runtime?: LibraryRuntime
}

export const LIBRARIES: LibraryCredit[] = [
    { name: 'FFmpeg',           url: 'https://ffmpeg.org/',                                         license: 'GPL v3', runtime: 'tauri' },
    { name: 'FFmpeg',           url: 'https://ffmpeg.org/',                                         license: 'See bundled build', runtime: 'electron' },
    { name: 'yt-dlp',           url: 'https://github.com/yt-dlp/yt-dlp',                            license: 'Unlicense' },
    { name: 'libx264',          url: 'https://www.videolan.org/developers/x264.html',               license: 'GPL v2' },
    { name: 'libx265',          url: 'http://x265.org/',                                            license: 'GPL v2' },
    { name: 'SVT-AV1',         url: 'https://gitlab.com/AOMediaCodec/SVT-AV1',                     license: 'BSD 3-Clause' },
    { name: 'libdav1d',         url: 'https://code.videolan.org/videolan/dav1d',                    license: 'Simplified BSD' },
    { name: 'libvpx',          url: 'https://github.com/webmproject/libvpx/',                       license: 'BSD 3-Clause' },
    { name: 'libvorbis',        url: 'https://xiph.org/vorbis/',                                    license: 'BSD 3-Clause' },
    { name: 'libopus',          url: 'https://www.opus-codec.org/',                                 license: 'BSD 3-Clause' },
    { name: 'libtheora',        url: 'https://theora.org/',                                         license: 'BSD 3-Clause' },
    { name: 'libogg',           url: 'https://xiph.org/ogg/',                                       license: 'BSD 3-Clause' },
    { name: 'libspeex',         url: 'https://www.speex.org/',                                      license: 'BSD 3-Clause' },
    { name: 'libass',           url: 'https://github.com/libass/libass',                            license: 'ISC' },
    { name: 'libbluray',        url: 'https://www.videolan.org/developers/libbluray.html',          license: 'L-GPL v2.1' },
    { name: 'libdvdnav',        url: 'https://www.videolan.org/developers/libdvdnav.html',          license: 'GPL v2' },
    { name: 'libdvdread',       url: 'https://www.videolan.org/developers/libdvdnav.html',          license: 'GPL v2' },
    { name: 'libdovi',          url: 'https://github.com/quietvoid/dovi_tool',                      license: 'MIT' },
    { name: 'libharfbuzz',      url: 'https://www.freedesktop.org/wiki/Software/HarfBuzz/',         license: 'MIT' },
    { name: 'libfreetype',      url: 'https://freetype.org/',                                       license: 'GPL v2' },
    { name: 'libfontconfig',    url: 'https://freedesktop.org/wiki/Software/fontconfig/',           license: 'MIT' },
    { name: 'libjpeg-turbo',    url: 'https://github.com/libjpeg-turbo/libjpeg-turbo',             license: 'BSD 3-Clause' },
    { name: 'libjansson',       url: 'https://github.com/akheron/jansson',                          license: 'MIT' },
    { name: 'libiconv',         url: 'https://www.gnu.org/software/libiconv/',                      license: 'L-GPL v2.1' },
    { name: 'libzlib',          url: 'https://zlib.net/',                                           license: 'zlib' },
    { name: 'liblzma (xz)',     url: 'https://tukaani.org/xz/',                                     license: 'BSD Zero Clause' },
    { name: 'libbzip2',         url: 'https://sourceforge.net/projects/bzip2/',                     license: 'BSD-like' },
    { name: 'AMD AMF',          url: 'https://github.com/GPUOpen-LibrariesAndSDKs/AMF',             license: 'MIT' },
    { name: 'NV-codec-headers', url: 'https://git.videolan.org/?p=ffmpeg/nv-codec-headers.git',    license: 'MIT' },
    { name: 'libmfx / libvpl',  url: 'https://github.com/intel/libvpl',                            license: 'MIT' },
    { name: 'zimg',             url: 'https://github.com/sekrit-twc/zimg',                          license: 'WTFPL' },
    // Web UI specific
    { name: 'React',            url: 'https://react.dev/',                                          license: 'MIT' },
    { name: 'Vite',             url: 'https://vitejs.dev/',                                         license: 'MIT' },
    { name: 'Tauri',            url: 'https://tauri.app/',                                          license: 'MIT / Apache-2.0', runtime: 'tauri' },
    { name: 'Deno',             url: 'https://deno.com/',                                           license: 'MIT', runtime: 'tauri' },
    { name: 'TwitchDownloader', url: 'https://github.com/lay295/TwitchDownloader',                 license: 'MIT', runtime: 'tauri' },
    { name: 'Electron',         url: 'https://www.electronjs.org/',                                 license: 'MIT', runtime: 'electron' },
    { name: 'fluent-ffmpeg',    url: 'https://github.com/fluent-ffmpeg/node-fluent-ffmpeg',         license: 'MIT', runtime: 'electron' },
    { name: 'Bootstrap Icons',  url: 'https://icons.getbootstrap.com/',                             license: 'MIT' },
]
