import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const ICONS_DIR = path.resolve(process.cwd(), 'public/icons');
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');

if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// 1. Standard SVG Icon (with rx="112" rounded rect)
const standardSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4F46E5"/><stop offset="1" stop-color="#9333EA"/></linearGradient></defs><rect width="512" height="512" rx="112" fill="url(#bg)"/><circle cx="206" cy="256" r="92" fill="none" stroke="#fff" stroke-width="40"/><circle cx="306" cy="256" r="92" fill="none" stroke="#fff" stroke-opacity="0.55" stroke-width="40"/><path d="M 206 164 A 92 92 0 0 0 206 348" fill="none" stroke="#fff" stroke-width="40" stroke-linecap="round"/></svg>`;

// 2. Maskable SVG Icon (full-bleed square corners rect)
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4F46E5"/><stop offset="1" stop-color="#9333EA"/></linearGradient></defs><rect width="512" height="512" fill="url(#bg)"/><circle cx="206" cy="256" r="92" fill="none" stroke="#fff" stroke-width="40"/><circle cx="306" cy="256" r="92" fill="none" stroke="#fff" stroke-opacity="0.55" stroke-width="40"/><path d="M 206 164 A 92 92 0 0 0 206 348" fill="none" stroke="#fff" stroke-width="40" stroke-linecap="round"/></svg>`;

async function generateAll() {
  console.log('Generating PWA Icons...');

  // Save SVG files
  fs.writeFileSync(path.join(ICONS_DIR, 'icon.svg'), standardSvg, 'utf-8');
  fs.writeFileSync(path.join(PUBLIC_DIR, 'icon.svg'), standardSvg, 'utf-8');
  fs.writeFileSync(path.join(ICONS_DIR, 'icon-maskable.svg'), maskableSvg, 'utf-8');

  const standardBuffer = Buffer.from(standardSvg);
  const maskableBuffer = Buffer.from(maskableSvg);

  const sizes = [72, 96, 128, 144, 152, 180, 192, 384, 512];

  for (const size of sizes) {
    const outPath = path.join(ICONS_DIR, `icon-${size}x${size}.png`);
    await sharp(standardBuffer)
      .resize(size, size)
      .png({ quality: 100 })
      .toFile(outPath);
    console.log(`✓ Generated ${size}x${size} icon at ${outPath}`);
  }

  // Generate 192x192 & 512x512 Maskable Icons in public/icons/
  const maskable192Path = path.join(ICONS_DIR, 'icon-maskable-192x192.png');
  await sharp(maskableBuffer)
    .resize(192, 192)
    .png({ quality: 100 })
    .toFile(maskable192Path);
  console.log(`✓ Generated maskable 192x192 icon at ${maskable192Path}`);

  const maskable512Path = path.join(ICONS_DIR, 'icon-maskable-512x512.png');
  await sharp(maskableBuffer)
    .resize(512, 512)
    .png({ quality: 100 })
    .toFile(maskable512Path);
  console.log(`✓ Generated maskable 512x512 icon at ${maskable512Path}`);

  // Generate root level files in public/
  // 1. Apple Touch Icon 180x180 at public/apple-touch-icon.png
  await sharp(standardBuffer)
    .resize(180, 180)
    .png({ quality: 100 })
    .toFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'));
  console.log('✓ Generated public/apple-touch-icon.png');

  // 2. pwa-192x192.png, pwa-512x512.png, pwa-maskable-512x512.png at root public/
  await sharp(standardBuffer)
    .resize(192, 192)
    .png({ quality: 100 })
    .toFile(path.join(PUBLIC_DIR, 'pwa-192x192.png'));

  await sharp(standardBuffer)
    .resize(512, 512)
    .png({ quality: 100 })
    .toFile(path.join(PUBLIC_DIR, 'pwa-512x512.png'));

  await sharp(maskableBuffer)
    .resize(512, 512)
    .png({ quality: 100 })
    .toFile(path.join(PUBLIC_DIR, 'pwa-maskable-512x512.png'));

  // 3. favicon.png (32x32) at public/favicon.png
  await sharp(standardBuffer)
    .resize(32, 32)
    .png({ quality: 100 })
    .toFile(path.join(PUBLIC_DIR, 'favicon.png'));

  console.log('🎉 All PWA icon assets generated successfully!');
}

generateAll().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
