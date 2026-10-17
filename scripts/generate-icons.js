import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function createPNG(width, height, drawFn) {
  // RGBA buffer
  const buffer = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      buffer[idx] = r;
      buffer[idx + 1] = g;
      buffer[idx + 2] = b;
      buffer[idx + 3] = a;
    }
  }

  // PNG structure
  const rawData = Buffer.alloc(height * (width * 4 + 1));
  let p = 0;
  for (let y = 0; y < height; y++) {
    rawData[p++] = 0; // Filter type 0: None
    const rowOffset = y * width * 4;
    buffer.copy(rawData, p, rowOffset, rowOffset + width * 4);
    p += width * 4;
  }

  const deflated = zlib.deflateSync(rawData);

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      let byte = buf[i];
      for (let j = 0; j < 8; j++) {
        if ((crc ^ byte) & 1) {
          crc = (crc >>> 1) ^ 0xedb88320;
        } else {
          crc = crc >>> 1;
        }
        byte = byte >>> 1;
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const toCrc = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(toCrc), 0);
    return Buffer.concat([len, toCrc, crcBuf]);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Draw a brand mark inspired by Ajrak geometry, a rising sun and the Indus River.
// It deliberately uses no book or government seal, so app icons match public/logo.svg.
function drawBrandIcon(x, y, w, h, isMaskable = false) {
  const px = ((x + 0.5) / w) * 512;
  const py = ((y + 0.5) / h) * 512;
  const nx = (px - 256) / 256;
  const ny = (py - 256) / 256;
  const gradientT = Math.max(0, Math.min(1, py / 512));
  const squircle = Math.pow(Math.abs(nx), 3.6) + Math.pow(Math.abs(ny), 3.6);

  if (!isMaskable && squircle > 1) return [0, 0, 0, 0];

  const mix = (a, b, t) => Math.round(a * (1 - t) + b * t);
  const background = [
    mix(18, 6, gradientT),
    mix(59, 21, gradientT),
    mix(120, 46, gradientT),
    255,
  ];

  const insidePolygon = (points) => {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i][0], yi = points[i][1];
      const xj = points[j][0], yj = points[j][1];
      const crosses = ((yi > py) !== (yj > py)) &&
        (px < ((xj - xi) * (py - yi)) / ((yj - yi) || 1e-9) + xi);
      if (crosses) inside = !inside;
    }
    return inside;
  };

  const distanceToSegment = (x1, y1, x2, y2) => {
    const dx = x2 - x1, dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy;
    const t = lengthSquared
      ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared))
      : 0;
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  };
  const onLine = (x1, y1, x2, y2, thickness) =>
    distanceToSegment(x1, y1, x2, y2) <= thickness / 2;
  const inCircle = (cx, cy, radius) => Math.hypot(px - cx, py - cy) <= radius;
  const diamond = (cx, cy, radius) => insidePolygon([
    [cx, cy - radius], [cx + radius, cy], [cx, cy + radius], [cx - radius, cy],
  ]);

  if (!isMaskable && squircle > 0.94 && squircle <= 1) return [246, 189, 66, 255];
  if (!isMaskable && squircle > 0.91 && squircle <= 0.94) return [65, 133, 225, 255];

  // Small Ajrak-inspired diamonds at the crown.
  if (diamond(256, 87, 22)) return [255, 230, 157, 255];
  if (diamond(211, 111, 13) || diamond(301, 111, 13)) return [246, 189, 66, 240];
  if (diamond(177, 152, 9) || diamond(335, 152, 9)) return [246, 189, 66, 170];

  // Soft golden rising sun with delicate rays.
  if (inCircle(256, 183, 51)) {
    const sunT = Math.max(0, Math.min(1, (py - 132) / 102));
    return [mix(255, 219, sunT), mix(239, 146, sunT), mix(185, 25, sunT), 255];
  }
  if (
    onLine(256, 119, 256, 108, 5) ||
    onLine(218, 133, 210, 125, 5) ||
    onLine(294, 133, 302, 125, 5) ||
    onLine(199, 168, 188, 166, 5) ||
    onLine(313, 168, 324, 166, 5)
  ) return [255, 225, 154, 255];

  // Flowing river ribbons. The icon uses curves instead of a book to make
  // the app identity feel distinct and recognisably connected to Sindh.
  const waveOne = 266 - 28 * Math.sin((px - 92) * Math.PI / 88);
  const waveTwo = 307 - 23 * Math.sin((px - 108) * Math.PI / 75);
  const waveThree = 348 - 18 * Math.sin((px - 132) * Math.PI / 62);

  if (px >= 88 && px <= 424 && Math.abs(py - waveOne) <= 6) return [112, 211, 237, 255];
  if (px >= 103 && px <= 414 && Math.abs(py - waveTwo) <= 5) return [138, 220, 242, 255];
  if (px >= 128 && px <= 393 && Math.abs(py - waveThree) <= 4) return [246, 189, 66, 255];
  if (
    (px >= 83 && px <= 429 && Math.abs(py - waveOne) <= 12) ||
    (px >= 98 && px <= 419 && Math.abs(py - waveTwo) <= 10) ||
    (px >= 123 && px <= 398 && Math.abs(py - waveThree) <= 9)
  ) return [4, 19, 42, 255];

  // Quiet footline and jewel-like anchor below the river motif.
  const baselineDistance = distanceToSegment(148, 393, 364, 393);
  if (baselineDistance <= 1.5) return [126, 183, 255, 125];
  if (inCircle(256, 393, 4)) return [255, 224, 143, 255];

  return background;
}

const outDir = path.resolve('public');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Generate 192x192
console.log('Generating pwa-192x192.png...');
fs.writeFileSync(path.join(outDir, 'pwa-192x192.png'), createPNG(192, 192, (x, y, w, h) => drawBrandIcon(x, y, w, h, false)));

// Generate 512x512
console.log('Generating pwa-512x512.png...');
fs.writeFileSync(path.join(outDir, 'pwa-512x512.png'), createPNG(512, 512, (x, y, w, h) => drawBrandIcon(x, y, w, h, false)));

// Generate maskable 512x512
console.log('Generating pwa-maskable-512x512.png...');
fs.writeFileSync(path.join(outDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, (x, y, w, h) => drawBrandIcon(x, y, w, h, true)));

// Generate apple-touch-icon 180x180
console.log('Generating apple-touch-icon.png...');
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), createPNG(180, 180, (x, y, w, h) => drawBrandIcon(x, y, w, h, false)));

console.log('Done generating PWA PNG icons!');
