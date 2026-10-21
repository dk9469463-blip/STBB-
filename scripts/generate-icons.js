import fs from 'node:fs';

const files = [
  'pwa-192x192.png',
  'pwa-512x512.png',
  'pwa-maskable-512x512.png',
  'apple-touch-icon.png',
  'favicon-32x32.png',
];

for (const file of files) {
  if (!fs.existsSync(`public/${file}`)) {
    throw new Error(`Missing icon: public/${file}`);
  }
}

console.log('SindhLearn custom icons verified.');
