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

  // Draw an open-book symbol, matching public/logo.svg and public/icon.svg.
  // Small gold sparks make it recognisable at launcher/fav-icon sizes.
  if (diamond(355, 104, 25) || diamond(402, 170, 11)) return [250, 199, 87, 255];
  if (
    onLine(355, 75, 355, 91, 5) ||
    onLine(355, 117, 355, 135, 5) ||
    onLine(326, 104, 341, 104, 5) ||
    onLine(369, 104, 384, 104, 5)
  ) return [255, 233, 165, 255];

  const leftOuter = [
    [67, 197], [149, 187], [226, 211], [256, 235],
    [256, 390], [224, 358], [149, 343], [67, 365],
  ];
  const rightOuter = [
    [445, 197], [363, 187], [286, 211], [256, 235],
    [256, 390], [288, 358], [363, 343], [445, 365],
  ];
  const leftPage = [
    [84, 216], [150, 206], [220, 228], [246, 249],
    [246, 350], [218, 336], [150, 323], [84, 342],
  ];
  const rightPage = [
    [428, 216], [362, 206], [292, 228], [266, 249],
    [266, 350], [294, 336], [362, 323], [428, 342],
  ];

  // Fine gold outline around the book cover and its central binding.
  if (
    onLine(67, 197, 149, 187, 8) ||
    onLine(149, 187, 226, 211, 8) ||
    onLine(226, 211, 256, 235, 8) ||
    onLine(256, 235, 286, 211, 8) ||
    onLine(286, 211, 363, 187, 8) ||
    onLine(363, 187, 445, 197, 8) ||
    onLine(67, 197, 67, 365, 8) ||
    onLine(445, 197, 445, 365, 8) ||
    onLine(67, 365, 149, 343, 8) ||
    onLine(149, 343, 224, 358, 8) ||
    onLine(224, 358, 256, 390, 8) ||
    onLine(256, 390, 288, 358, 8) ||
    onLine(288, 358, 363, 343, 8) ||
    onLine(363, 343, 445, 365, 8)
  ) return [247, 190, 67, 255];

  // Bright left page and cool-blue right page.
  if (insidePolygon(leftPage)) return [244, 249, 255, 255];
  if (insidePolygon(rightPage)) return [191, 226, 255, 255];

  // Three short, gently sloped lines on each page suggest writing.
  if (
    onLine(106, 247, 214, 262, 5) ||
    onLine(106, 278, 214, 293, 5) ||
    onLine(106, 309, 214, 324, 5)
  ) return [93, 142, 196, 255];
  if (
    onLine(406, 247, 298, 262, 5) ||
    onLine(406, 278, 298, 293, 5) ||
    onLine(406, 309, 298, 324, 5)
  ) return [49, 111, 173, 255];

  if (insidePolygon(leftOuter) || insidePolygon(rightOuter)) return [247, 190, 67, 255];

  // Gold spine ties the two pages together.
  if (onLine(256, 239, 256, 387, 7)) return [247, 190, 67, 255];

  // Quiet baseline beneath the open book.
  if (onLine(146, 407, 366, 407, 3)) return [126, 183, 255, 180];

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
