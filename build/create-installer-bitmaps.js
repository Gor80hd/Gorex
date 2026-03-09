/**
 * Gorex — Installer bitmap generator
 * Runs before `npm run dist` (via `predist` hook).
 *
 * Generates two branded BMP files used by the NSIS MUI2 installer:
 *   installer-sidebar.bmp  164 × 314  dark purple sidebar (Welcome / Finish pages)
 *   installer-header.bmp   150 × 57   dark header strip (wizard pages)
 *
 * Pure Node.js — no external dependencies.
 */

'use strict'

const fs   = require('fs')
const path = require('path')

// ─── Palette (from globals.scss) ────────────────────────────────────────────

const C = {
  bg:       hex('#121118'),   // app background
  card:     hex('#1a1726'),   // onboarding card
  deep:     hex('#1e1b2e'),   // deep card shadow
  purple:   hex('#2d1f5e'),   // dark purple tint
  accent:   hex('#7c3aed'),   // primary violet accent
  accent2:  hex('#6d28d9'),   // hover accent
  accentLo: hex('#4c1d95'),   // low accent
  accentDm: hex('#3b1870'),   // very dim accent
}

function hex(h) {
  h = h.replace('#', '')
  return { r: parseInt(h.slice(0,2), 16), g: parseInt(h.slice(2,4), 16), b: parseInt(h.slice(4,6), 16) }
}

function lerp(a, b, t) { return a + (b - a) * Math.max(0, Math.min(1, t)) }
function clamp(v)        { return Math.max(0, Math.min(255, Math.round(v))) }
function colLerp(a, b, t) {
  return { r: lerp(a.r, b.r, t), g: lerp(a.g, b.g, t), b: lerp(a.b, b.b, t) }
}


// ─── BMP writer (24-bit, top-down via negative height) ───────────────────────

function writeBMP(width, height, getPixel) {
  const rowStride  = Math.ceil(width * 3 / 4) * 4          // pad rows to 4 bytes
  const pixelBytes = rowStride * height
  const buf        = Buffer.alloc(14 + 40 + pixelBytes, 0)

  // ── File header (14 bytes) ─────────────────────────
  buf[0] = 0x42; buf[1] = 0x4D                              // 'BM'
  buf.writeUInt32LE(14 + 40 + pixelBytes, 2)                // file size
  buf.writeUInt32LE(54, 10)                                  // pixel data offset

  // ── BITMAPINFOHEADER (40 bytes) ────────────────────
  buf.writeUInt32LE(40,     14)                              // header size
  buf.writeInt32LE(width,   18)                              // width
  buf.writeInt32LE(-height, 22)                              // negative → top-down
  buf.writeUInt16LE(1,      26)                              // colour planes
  buf.writeUInt16LE(24,     28)                              // bits-per-pixel
  buf.writeUInt32LE(0,      30)                              // BI_RGB (no compression)
  buf.writeUInt32LE(pixelBytes, 34)
  buf.writeInt32LE(3780,    38)                              // ~96 dpi
  buf.writeInt32LE(3780,    42)

  // ── Pixel data (BGR order) ─────────────────────────
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p   = getPixel(x, y, width, height)
      const off = 54 + y * rowStride + x * 3
      buf[off  ] = clamp(p.b)
      buf[off+1] = clamp(p.g)
      buf[off+2] = clamp(p.r)
    }
  }
  return buf
}


// ─── Sidebar bitmap  164 × 314 ───────────────────────────────────────────────
//
//  Visual design:
//    • Vertical gradient — deep purple at top → near-black at bottom
//    • Radial accent glow centred in the upper portion
//    • Second smaller glow in the lower quarter (depth effect)
//    • One-pixel accent stripe on the right edge
//

const SIDEBAR = writeBMP(164, 314, (x, y, w, h) => {
  const ty = y / (h - 1)

  // Base vertical gradient
  const base = colLerp(C.purple, C.bg, Math.pow(ty, 0.7))

  // Primary glow — upper area
  const glowX1 = 40, glowY1 = 70, glowR1 = 95
  const d1 = Math.sqrt((x - glowX1) ** 2 + (y - glowY1) ** 2)
  const g1 = Math.max(0, 1 - d1 / glowR1)
  const glow1 = g1 * g1 * 0.32                              // quadratic falloff

  // Secondary glow — lower area (subtler)
  const glowX2 = 20, glowY2 = 220, glowR2 = 60
  const d2 = Math.sqrt((x - glowX2) ** 2 + (y - glowY2) ** 2)
  const g2 = Math.max(0, 1 - d2 / glowR2)
  const glow2 = g2 * g2 * 0.14

  // Combine glows
  let px = colLerp(base, C.accent, glow1)
  px = colLerp(px, C.accentLo, glow2)

  // Right-edge accent separator
  if (x >= w - 2) {
    const edgeBlend = (x - (w - 2)) / 1           // 0 or 1
    return colLerp(px, C.accent2, 0.55 + edgeBlend * 0.45)
  }

  return px
})


// ─── Header bitmap  150 × 57 ─────────────────────────────────────────────────
//
//  Visual design:
//    • Flat dark card background with subtle left-to-right fade toward bg
//    • Thin accent gradient stripe across the bottom edge (2 px)
//    • Small accent glow in the bottom-left corner
//

const HEADER = writeBMP(150, 57, (x, y, w, h) => {
  const tx = x / (w - 1)

  // Base: card colour → bg
  const base = colLerp(C.deep, C.bg, tx * 0.6)

  // Bottom accent stripe
  if (y >= h - 2) {
    const stripT = (y - (h - 2)) / 1              // 0 or 1
    const blend  = 0.55 + stripT * 0.45
    return colLerp(base, C.accent, blend)
  }

  // Corner glow bottom-left
  const glowX = 0, glowY = h, glowR = 50
  const d = Math.sqrt((x - glowX) ** 2 + (y - glowY) ** 2)
  const gFactor = Math.max(0, 1 - d / glowR) * 0.18

  return colLerp(base, C.accentDm, gFactor)
})


// ─── Write files ─────────────────────────────────────────────────────────────

const outDir = __dirname
const files = [
  { name: 'installer-sidebar.bmp', data: SIDEBAR, dims: '164×314' },
  { name: 'installer-header.bmp',  data: HEADER,  dims: '150×57'  },
]

for (const { name, data, dims } of files) {
  const dest = path.join(outDir, name)
  fs.writeFileSync(dest, data)
  console.log(`  ✓  ${name}  (${dims}, ${(data.length / 1024).toFixed(1)} KB)`)
}

console.log('\n  Installer bitmaps ready.\n')
