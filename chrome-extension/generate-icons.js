#!/usr/bin/env node
// Resizes resources/icon.png into the required Chrome/Firefox extension icon sizes.
// Run: node generate-icons.js
// No external dependencies — pure Node.js + bilinear scaling.

const fs   = require('fs')
const path = require('path')
const zlib = require('zlib')

const SIZES = [16, 32, 48, 128]
const SRC   = path.join(__dirname, '..', 'resources', 'icon.png')
const OUT   = path.join(__dirname, 'icons')
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT)

function decodePng(buf) {
    if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('Not a PNG')
    let ihdr, idatChunks = []
    let pos = 8
    while (pos < buf.length) {
        const len  = buf.readUInt32BE(pos); pos += 4
        const type = buf.toString('ascii', pos, pos + 4); pos += 4
        const data = buf.slice(pos, pos + len); pos += len + 4
        if (type === 'IHDR') ihdr = data
        if (type === 'IDAT') idatChunks.push(data)
    }
    const width = ihdr.readUInt32BE(0), height = ihdr.readUInt32BE(4)
    const bitDepth = ihdr[8], colorType = ihdr[9]
    if (bitDepth !== 8) throw new Error('Only 8-bit PNG: ' + bitDepth)
    const strides = { 0: 1, 2: 3, 6: 4 }
    const stride = strides[colorType]
    if (!stride) throw new Error('Unsupported PNG color type: ' + colorType)
    const raw = zlib.inflateSync(Buffer.concat(idatChunks))
    const bpr = width * stride + 1
    const rgba = Buffer.alloc(width * height * 4, 0)
    for (let y = 0; y < height; y++) {
        const filter = raw[y * bpr]
        const row = raw.slice(y * bpr + 1, y * bpr + 1 + width * stride)
        const prev = y > 0 ? raw.slice((y - 1) * bpr + 1, (y - 1) * bpr + 1 + width * stride) : null
        const out = Buffer.alloc(width * stride)
        for (let i = 0; i < row.length; i++) {
            const a = out[i - stride] ?? 0, b = prev ? prev[i] : 0, c = prev ? (prev[i - stride] ?? 0) : 0
            if      (filter === 0) out[i] = row[i]
            else if (filter === 1) out[i] = (row[i] + a) & 0xff
            else if (filter === 2) out[i] = (row[i] + b) & 0xff
            else if (filter === 3) out[i] = (row[i] + Math.floor((a + b) / 2)) & 0xff
            else if (filter === 4) {
                const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
                out[i] = (row[i] + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 0xff
            }
        }
        for (let x = 0; x < width; x++) {
            const di = (y * width + x) * 4
            if      (stride === 4) { out.copy(rgba, di, x * 4, x * 4 + 4) }
            else if (stride === 3) { out.copy(rgba, di, x * 3, x * 3 + 3); rgba[di + 3] = 255 }
            else                   { const v = out[x]; rgba[di]=v; rgba[di+1]=v; rgba[di+2]=v; rgba[di+3]=255 }
        }
    }
    return { width, height, rgba }
}

function resize(src, srcW, srcH, dstW, dstH) {
    const dst = Buffer.alloc(dstW * dstH * 4, 0)
    const xs = srcW / dstW, ys = srcH / dstH
    for (let dy = 0; dy < dstH; dy++) {
        for (let dx = 0; dx < dstW; dx++) {
            const sx = (dx + 0.5) * xs - 0.5, sy = (dy + 0.5) * ys - 0.5
            const x0 = Math.max(0, Math.floor(sx)), x1 = Math.min(srcW - 1, x0 + 1)
            const y0 = Math.max(0, Math.floor(sy)), y1 = Math.min(srcH - 1, y0 + 1)
            const fx = sx - x0, fy = sy - y0
            const di = (dy * dstW + dx) * 4
            for (let c = 0; c < 4; c++) {
                const tl = src[(y0 * srcW + x0) * 4 + c], tr = src[(y0 * srcW + x1) * 4 + c]
                const bl = src[(y1 * srcW + x0) * 4 + c], br = src[(y1 * srcW + x1) * 4 + c]
                dst[di + c] = Math.round(tl * (1-fx) * (1-fy) + tr * fx * (1-fy) + bl * (1-fx) * fy + br * fx * fy)
            }
        }
    }
    return dst
}

function encodePng(rgba, width, height) {
    function crc32(buf) {
        const table = crc32.t || (crc32.t = (() => {
            const t = new Uint32Array(256)
            for (let i = 0; i < 256; i++) { let c = i; for (let j = 0; j < 8; j++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[i] = c }
            return t
        })())
        let crc = 0xFFFFFFFF
        for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8)
        return (crc ^ 0xFFFFFFFF) >>> 0
    }
    function chunk(type, data) {
        const tb = Buffer.from(type, 'ascii')
        const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
        const cb = Buffer.alloc(4); cb.writeUInt32BE(crc32(Buffer.concat([tb, data])))
        return Buffer.concat([len, tb, data, cb])
    }
    const ihdr = Buffer.alloc(13)
    ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 6
    const rows = []
    for (let y = 0; y < height; y++) { rows.push(Buffer.from([0])); rows.push(rgba.slice(y * width * 4, (y + 1) * width * 4)) }
    return Buffer.concat([
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
        chunk('IHDR', ihdr),
        chunk('IDAT', zlib.deflateSync(Buffer.concat(rows), { level: 9 })),
        chunk('IEND', Buffer.alloc(0)),
    ])
}

const { width: srcW, height: srcH, rgba: srcRgba } = decodePng(fs.readFileSync(SRC))
console.log('Source: ' + SRC + ' (' + srcW + 'x' + srcH + ')')
for (const size of SIZES) {
    const png = encodePng(resize(srcRgba, srcW, srcH, size, size), size, size)
    const outFile = path.join(OUT, 'icon' + size + '.png')
    fs.writeFileSync(outFile, png)
    console.log('  icon' + size + '.png  (' + png.length + ' bytes)')
}
console.log('Done.')
