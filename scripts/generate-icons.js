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

// Icon generator logic: Royal Blue badge with golden book shape
function drawBookIcon(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const nx = (x - cx) / (w / 2);
  const ny = (y - cy) / (h / 2);
  const dist = Math.sqrt(nx * nx + ny * ny);

  // Background color: Royal Blue to Navy gradient
  const gradT = (y / h);
  let bgR = Math.round(30 * (1 - gradT) + 11 * gradT);
  let bgG = Math.round(58 * (1 - gradT) + 19 * gradT);
  let bgB = Math.round(138 * (1 - gradT) + 41 * gradT);

  // If not maskable, round corners with squircle
  if (!isMaskable) {
    const cornerRadius = 0.22;
    const ax = Math.abs(nx);
    const ay = Math.abs(ny);
    // Squircle test
    const squircle = Math.pow(ax, 3.6) + Math.pow(ay, 3.6);
    if (squircle > 1.0) {
      return [0, 0, 0, 0]; // transparent
    }
    // Gold border line
    if (squircle > 0.94 && squircle <= 1.0) {
      return [245, 158, 11, 255];
    }
  }

  // Draw inner open book in normalized coords (-1 to 1)
  // Book center around cy, scaled
  const bx = nx * 1.5;
  const by = ny * 1.5;

  // Book pages:
  // Left page: bx from -0.7 to -0.05, by from -0.3 to 0.4
  // Right page: bx from 0.05 to 0.7, by from -0.3 to 0.4
  const isLeftPage = bx >= -0.7 && bx <= -0.04 && by >= -0.35 && by <= 0.45;
  const isRightPage = bx >= 0.04 && bx <= 0.7 && by >= -0.35 && by <= 0.45;

  if (isLeftPage || isRightPage) {
    // Page curve effect
    const pageCurve = Math.sin((Math.abs(bx) - 0.05) * 4) * 0.05;
    if (by >= -0.35 + pageCurve && by <= 0.45 + pageCurve) {
      // White page with slight warm tint
      return [250, 250, 252, 255];
    }
  }

  // Gold spine in center
  if (Math.abs(bx) <= 0.04 && by >= -0.4 && by <= 0.48) {
    return [245, 158, 11, 255];
  }

  // Star / Torch above book
  const starDist = Math.sqrt(bx * bx + (by + 0.6) * (by + 0.6));
  if (starDist < 0.12) {
    return [253, 224, 71, 255];
  }

  // Gold text stripe banner below book
  if (Math.abs(bx) <= 0.65 && by >= 0.58 && by <= 0.72) {
    return [245, 158, 11, 255];
  }

  return [bgR, bgG, bgB, 255];
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
