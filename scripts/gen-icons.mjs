import { deflateSync } from 'zlib';
import { writeFileSync } from 'fs';

// ── CRC32 ──────────────────────────────────────────────────────────────────
const CRC = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  CRC[n] = c;
}
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (const b of buf) c = CRC[(c ^ b) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  const l = Buffer.allocUnsafe(4); l.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const cc = Buffer.allocUnsafe(4); cc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([l, t, data, cc]);
}

// ── ₨ symbol in normalised (−1 … 1) space ─────────────────────────────────
// S = stroke width, drawn as simple rectangles + a rounded right cap on the P
function rupee(lx, ly) {
  const S = 0.21;
  const vx1 = -0.54, vx2 = vx1 + S;          // left vertical bar

  // Vertical bar (full height)
  if (lx >= vx1 && lx <= vx2 && ly >= -0.90 && ly <= 0.90) return true;

  // ── P bump (3 sides of a rectangle with a rounded right cap) ──
  const px1 = vx2, px2 = 0.50;               // P box x range
  const py1 = -0.88, py2 = -0.14;            // P box y range
  const pmy = (py1 + py2) / 2;               // centre y of P

  // Top horizontal stroke of P
  if (ly >= py1 && ly <= py1 + S && lx >= px1 && lx <= px2) return true;
  // Bottom horizontal stroke of P
  if (ly >= py2 && ly <= py2 + S && lx >= px1 && lx <= px2) return true;

  // Right cap: semicircle so the P looks rounded
  const capCx = px2, capCy = pmy + S * 0.5;
  const capR  = (py2 - py1) / 2;
  const capT  = S;
  const dx = lx - capCx, dy = ly - capCy;
  const d  = Math.sqrt(dx * dx + dy * dy);
  if (d >= capR - capT && d <= capR && lx >= capCx) return true;

  // ── Two horizontal lines below the P ──────────────────────────
  // Line 1
  if (ly >= 0.17 && ly <= 0.17 + S && lx >= vx1 && lx <= 0.72) return true;
  // Line 2
  if (ly >= 0.55 && ly <= 0.55 + S && lx >= vx1 && lx <= 0.72) return true;

  return false;
}

// ── PNG generator ──────────────────────────────────────────────────────────
function genPNG(size) {
  const GR = 27, GG = 67, GB = 50;   // #1B4332
  const cx = size / 2, cy = size / 2;
  // 0.30 keeps the symbol inside the maskable safe zone (centre 80% circle)
  const scale = size * 0.30;

  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.allocUnsafe(1 + size * 3);
    row[0] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const isW = rupee((x - cx) / scale, (y - cy) / scale);
      row[1 + x * 3]     = isW ? 255 : GR;
      row[2 + x * 3] = isW ? 255 : GG;
      row[3 + x * 3] = isW ? 255 : GB;
    }
    rows.push(row);
  }

  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB
  ihdr[10] = ihdr[11] = ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.concat(rows), { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

writeFileSync('public/icon-192.png', genPNG(192));
writeFileSync('public/icon-512.png', genPNG(512));
writeFileSync('public/apple-touch-icon.png', genPNG(180));
console.log('✓ icon-192.png  icon-512.png  apple-touch-icon.png  generated');
