// Generates simple PNG app-icon PLACEHOLDERS (192 & 512) from a drawn diya
// motif, so the PWA is installable out of the box. Replace with real artwork
// later (see docs/CONTENT_GUIDE.md). Pure Node — no image libraries.

import { writeFile } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'assets',
  'icons'
);

// CRC32
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++)
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function hex(h) {
  return [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
}

function drawIcon(size) {
  const bg = hex('#7A2048'); // maroon field
  const bowl = hex('#C79A2E'); // gold bowl
  const flame = hex('#F7B155'); // marigold flame
  const px = new Uint8Array(size * size * 4);

  const cx = size / 2;
  const bowlCy = size * 0.66;
  const bowlRx = size * 0.3;
  const bowlRy = size * 0.12;
  const flameCx = cx;
  const flameCy = size * 0.42;
  const flameRx = size * 0.1;
  const flameRy = size * 0.17;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let color = bg;
      // flame (ellipse)
      if (
        ((x - flameCx) / flameRx) ** 2 + ((y - flameCy) / flameRy) ** 2 <=
        1
      ) {
        color = flame;
      } else if (((x - cx) / bowlRx) ** 2 + ((y - bowlCy) / bowlRy) ** 2 <= 1) {
        color = bowl;
      }
      const i = (y * size + x) * 4;
      px[i] = color[0];
      px[i + 1] = color[1];
      px[i + 2] = color[2];
      px[i + 3] = 255;
    }
  }

  // raw image with per-scanline filter byte 0
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    px.slice(y * size * 4, (y + 1) * size * 4).forEach((b, k) => {
      raw[y * (size * 4 + 1) + 1 + k] = b;
    });
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const idat = deflateSync(raw);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const size of [192, 512]) {
  await writeFile(resolve(dir, `icon-${size}.png`), drawIcon(size));
  console.log(`wrote icon-${size}.png`);
}
console.log('Done. These are placeholders — replace with real artwork later.');
