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

// Draw the STBB Books brand mark: a clean open book, rising sun and
// subtle Ajrak-inspired diamonds in the app's navy, blue and gold palette.
function drawBookIcon(x, y, w, h, isMaskable = false) {
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
    const nearX = x1 + t * dx, nearY = y1 + t * dy;
    return Math.hypot(px - nearX, py - nearY);
  };

  const onLine = (x1, y1, x2, y2, thickness) =>
    distanceToSegment(x1, y1, x2, y2) <= thickness / 2;

  const onPolygonEdge = (points, thickness) => points.some((point, index) => {
    const next = points[(index + 1) % points.length];
    return onLine(point[0], point[1], next[0], next[1], thickness);
  });

  const inCircle = (cx, cy, radius) => Math.hypot(px - cx, py - cy) <= radius;

  const diamond = (cx, cy, radius) => insidePolygon([
    [cx, cy - radius], [cx + radius, cy], [cx, cy + radius], [cx - radius, cy],
  ]);

  // Thin brand border around the app icon.
  if (!isMaskable && squircle > 0.94 && squircle <= 1) {
    return [246, 189, 66, 255];
  }
  if (!isMaskable && squircle > 0.91 && squircle <= 0.94) {
    return [65, 133, 225, 255];
  }

  // Ajrak-inspired diamond motif.
  if (diamond(256, 73, 19)) return [255, 220, 133, 255];
  if (diamond(218, 99, 10) || diamond(294, 99, 10)) return [246, 189, 66, 240];

  // Rising sun and fine rays.
  if (inCircle(256, 154, 42)) {
    const sunT = Math.max(0, Math.min(1, (py - 112) / 84));
    return [mix(255, 215, sunT), mix(231, 145, sunT), mix(164, 25, sunT), 255];
  }
  if (
    onLine(256, 101, 256, 108, 4) ||
    onLine(221, 111, 216, 106, 4) ||
    onLine(291, 111, 296, 106, 4) ||
    onLine(207, 146, 199, 146, 4) ||
    onLine(305, 146, 313, 146, 4)
  ) return [255, 220, 133, 255];

  // Open-book cover, pages and center spine.
  const cover = [
    [78, 214], [188, 193], [256, 226], [324, 193], [434, 214],
    [434, 360], [330, 343], [256, 378], [182, 343], [78, 360],
  ];
  const leftPage = [
    [95, 225], [185, 207], [247, 238], [247, 350], [202, 333], [95, 344],
  ];
  const rightPage = [
    [265, 238], [327, 207], [417, 225], [417, 344], [310, 333], [265, 350],
  ];

  if (insidePolygon(cover)) return [4, 15, 34, 255];
  if (onPolygonEdge(cover, 4)) return [246, 189, 66, 255];
  if (insidePolygon(leftPage) || insidePolygon(rightPage)) return [247, 250, 255, 255];

  // Printed page lines.
  const pageLines = [
    [119, 244, 220, 249], [119, 267, 220, 272], [119, 290, 216, 295],
    [292, 249, 393, 244], [292, 272, 393, 267], [296, 295, 393, 290],
  ];
  if (pageLines.some((line) => onLine(...line, 3))) return [117, 145, 181, 255];

  if (px >= 251 && px <= 261 && py >= 228 && py <= 363) return [246, 189, 66, 255];

  const bookmark = [[256, 232], [267, 266], [280, 326], [268, 334], [256, 322], [244, 334], [232, 326], [245, 266]];
  if (insidePolygon(bookmark)) return [246, 189, 66, 255];
  if (inCircle(256, 400, 5)) return [255, 220, 133, 255];
  if (onLine(185, 400, 327, 400, 4)) return [246, 189, 66, 255];

  return background;
}

const outDir = path.resolve('public');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Generate 192x192
console.log('Generating pwa-192x192.png...');
fs.writeFileSync(path.join(outDir, 'pwa-192x192.png'), createPNG(192, 192, (x, y, w, h) => drawBookIcon(x, y, w, h, false)));

// Generate 512x512
console.log('Generating pwa-512x512.png...');
fs.writeFileSync(path.join(outDir, 'pwa-512x512.png'), createPNG(512, 512, (x, y, w, h) => drawBookIcon(x, y, w, h, false)));

// Generate maskable 512x512
console.log('Generating pwa-maskable-512x512.png...');
fs.writeFileSync(path.join(outDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, (x, y, w, h) => drawBookIcon(x, y, w, h, true)));

// Generate apple-touch-icon 180x180
console.log('Generating apple-touch-icon.png...');
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), createPNG(180, 180, (x, y, w, h) => drawBookIcon(x, y, w, h, false)));

console.log('Done generating PWA PNG icons!');
