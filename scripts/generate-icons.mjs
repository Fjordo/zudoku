/**
 * Generates the PWA icons from code so no binary assets live in the repo.
 * Run with `npm run icons`.
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../packages/client/public/icons',
);

const BACKGROUND = [15, 20, 32];
const GRID = [44, 56, 82];
const ACCENT = [110, 168, 254];
const LIGHT = [232, 236, 246];

/** Draws the logo: a 3x3 grid with a few filled cells. */
function drawIcon(size, { padding }) {
  const pixels = Buffer.alloc(size * size * 4);
  const put = (x, y, [r, g, b]) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const offset = (y * size + x) * 4;
    pixels[offset] = r;
    pixels[offset + 1] = g;
    pixels[offset + 2] = b;
    pixels[offset + 3] = 255;
  };
  const rect = (x0, y0, width, height, color) => {
    for (let y = y0; y < y0 + height; y += 1) {
      for (let x = x0; x < x0 + width; x += 1) put(x, y, color);
    }
  };

  rect(0, 0, size, size, BACKGROUND);

  const board = size - padding * 2;
  const cell = Math.floor(board / 3);
  const line = Math.max(2, Math.round(size / 64));

  // Filled cells forming a diagonal, plus one accent block.
  const filled = [
    [0, 0, LIGHT],
    [1, 1, ACCENT],
    [2, 2, LIGHT],
    [2, 0, GRID],
    [0, 2, GRID],
  ];
  for (const [column, row, color] of filled) {
    rect(padding + column * cell + line, padding + row * cell + line, cell - line * 2, cell - line * 2, color);
  }

  for (let index = 0; index <= 3; index += 1) {
    rect(padding + index * cell - line / 2, padding, line, cell * 3, GRID);
    rect(padding, padding + index * cell - line / 2, cell * 3, line, GRID);
  }

  return pixels;
}

function encodePng(size, pixels) {
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0; // no filter
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const chunk = (type, data) => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body) >>> 0);
    return Buffer.concat([length, body, crc]);
  };

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return crc ^ 0xffffffff;
}

const ICONS = [
  { file: 'icon-192.png', size: 192, padding: 18 },
  { file: 'icon-512.png', size: 512, padding: 48 },
  // Maskable icons need a safe zone: keep the art inside the middle 80%.
  { file: 'icon-maskable-512.png', size: 512, padding: 96 },
  { file: 'apple-touch-icon.png', size: 180, padding: 16 },
];

mkdirSync(OUT_DIR, { recursive: true });
for (const { file, size, padding } of ICONS) {
  writeFileSync(path.join(OUT_DIR, file), encodePng(size, drawIcon(size, { padding })));
  console.log(`wrote ${file} (${size}x${size})`);
}
