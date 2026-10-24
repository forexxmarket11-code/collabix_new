import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve('public');
const iconsDir = path.resolve('public/icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 1. Standard SVG Icon (with rx="112" rounded rect)
const standardSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4F46E5"/><stop offset="1" stop-color="#9333EA"/></linearGradient></defs><rect width="512" height="512" rx="112" fill="url(#bg)"/><circle cx="206" cy="256" r="92" fill="none" stroke="#fff" stroke-width="40"/><circle cx="306" cy="256" r="92" fill="none" stroke="#fff" stroke-opacity="0.55" stroke-width="40"/><path d="M 206 164 A 92 92 0 0 0 206 348" fill="none" stroke="#fff" stroke-width="40" stroke-linecap="round"/></svg>`;

// 2. Maskable SVG Icon (full-bleed square corners rect)
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4F46E5"/><stop offset="1" stop-color="#9333EA"/></linearGradient></defs><rect width="512" height="512" fill="url(#bg)"/><circle cx="206" cy="256" r="92" fill="none" stroke="#fff" stroke-width="40"/><circle cx="306" cy="256" r="92" fill="none" stroke="#fff" stroke-opacity="0.55" stroke-width="40"/><path d="M 206 164 A 92 92 0 0 0 206 348" fill="none" stroke="#fff" stroke-width="40" stroke-linecap="round"/></svg>`;

async function generate() {
  const svgBuffer = Buffer.from(standardSvg);
  const maskableBuffer = Buffer.from(maskableSvg);

  // Save SVGs
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), standardSvg, 'utf-8');
  fs.writeFileSync(path.join(iconsDir, 'icon.svg'), standardSvg, 'utf-8');
  fs.writeFileSync(path.join(iconsDir, 'icon-maskable.svg'), maskableSvg, 'utf-8');

  const sizes = [72, 96, 128, 144, 152, 180, 192, 384, 512];

  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(path.join(iconsDir, `icon-${size}x${size}.png`));
    console.log(`Generated icons/icon-${size}x${size}.png`);
  }

  // Generate 192x192 & 512x512 maskable icons
  await sharp(maskableBuffer)
    .resize(192, 192)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(iconsDir, 'icon-maskable-192x192.png'));
  console.log('Generated icons/icon-maskable-192x192.png');

  await sharp(maskableBuffer)
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(iconsDir, 'icon-maskable-512x512.png'));
  console.log('Generated icons/icon-maskable-512x512.png');

  // Copy standard 192, 512, maskable 512, apple-touch-icon, and favicon to root public/
  await sharp(svgBuffer)
    .resize(192, 192)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  await sharp(svgBuffer)
    .resize(512, 512)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  await sharp(maskableBuffer)
    .resize(512, 512)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  await sharp(svgBuffer)
    .resize(180, 180)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  await sharp(svgBuffer)
    .resize(32, 32)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'favicon.png'));

  console.log('All icons generated successfully!');
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
