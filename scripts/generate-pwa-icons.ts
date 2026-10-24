import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const ICONS_DIR = path.resolve(process.cwd(), 'public/icons');
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');

if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// 1. High quality Standard SVG Icon (with squircle background, modern stylized C, and gradient collaboration orb)
const standardSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#181528" />
      <stop offset="50%" stop-color="#14121F" />
      <stop offset="100%" stop-color="#0D0B14" />
    </linearGradient>

    <!-- Vibrant Brand Stroke Gradient for 'C' -->
    <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="35%" stop-color="#2A4BFF" />
      <stop offset="70%" stop-color="#6366F1" />
      <stop offset="100%" stop-color="#8B5CF6" />
    </linearGradient>

    <!-- Accent Dot Gradient -->
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F43F5E" />
      <stop offset="100%" stop-color="#FB7185" />
    </linearGradient>

    <!-- Soft Glow Filter -->
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="16" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Base background squircle -->
  <rect width="512" height="512" rx="128" fill="url(#bgGrad)" />

  <!-- Subtle inner border for premium finish -->
  <rect x="2" y="2" width="508" height="508" rx="126" fill="none" stroke="rgba(255, 255, 255, 0.08)" stroke-width="3" />

  <!-- Glow effect behind letter C -->
  <path d="M 330 160 C 290 120 220 120 180 160 C 130 210 130 300 180 350 C 220 390 290 390 330 350"
        fill="none"
        stroke="#2A4BFF"
        stroke-width="56"
        stroke-linecap="round"
        opacity="0.25"
        filter="url(#glow)" />

  <!-- Stylized Geometric "C" for Collabix -->
  <path d="M 330 160 C 290 120 220 120 180 160 C 130 210 130 300 180 350 C 220 390 290 390 330 350"
        fill="none"
        stroke="url(#brandGrad)"
        stroke-width="54"
        stroke-linecap="round" />

  <!-- Collabix Brand Accent Sphere / Connection Node -->
  <circle cx="360" cy="180" r="30" fill="url(#accentGrad)" filter="url(#glow)" />
  <circle cx="360" cy="180" r="28" fill="url(#accentGrad)" />
  <!-- Gloss highlight on sphere -->
  <circle cx="352" cy="172" r="9" fill="rgba(255, 255, 255, 0.75)" />
</svg>`;

// 2. Android Maskable Icon SVG (Strictly safe within central 80% circle: radius 204px at 256,256)
// Full-bleed background with zero rounded corners (Android OS handles clipping)
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="mBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#181528" />
      <stop offset="50%" stop-color="#14121F" />
      <stop offset="100%" stop-color="#0D0B14" />
    </linearGradient>

    <linearGradient id="mBrandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="35%" stop-color="#2A4BFF" />
      <stop offset="70%" stop-color="#6366F1" />
      <stop offset="100%" stop-color="#8B5CF6" />
    </linearGradient>

    <linearGradient id="mAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F43F5E" />
      <stop offset="100%" stop-color="#FB7185" />
    </linearGradient>
  </defs>

  <!-- Full-bleed background for maskable target -->
  <rect width="512" height="512" fill="url(#mBgGrad)" />

  <!-- Safe Zone content: scaled down 20% to fit within radius 204px -->
  <g transform="translate(256, 256) scale(0.76) translate(-256, -256)">
    <!-- Stylized Geometric "C" for Collabix -->
    <path d="M 330 160 C 290 120 220 120 180 160 C 130 210 130 300 180 350 C 220 390 290 390 330 350"
          fill="none"
          stroke="url(#mBrandGrad)"
          stroke-width="56"
          stroke-linecap="round" />

    <!-- Collabix Brand Accent Node -->
    <circle cx="360" cy="180" r="30" fill="url(#mAccentGrad)" />
    <circle cx="352" cy="172" r="9" fill="rgba(255, 255, 255, 0.75)" />
  </g>
</svg>`;

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

  // Generate 512x512 Maskable Icon
  const maskablePath = path.join(ICONS_DIR, 'icon-maskable-512x512.png');
  await sharp(maskableBuffer)
    .resize(512, 512)
    .png({ quality: 100 })
    .toFile(maskablePath);
  console.log(`✓ Generated maskable 512x512 icon at ${maskablePath}`);

  // Generate root level shortcuts / compatibility files
  // 1. Apple Touch Icon 180x180 at public/apple-touch-icon.png
  await sharp(standardBuffer)
    .resize(180, 180)
    .png({ quality: 100 })
    .toFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'));
  console.log('✓ Generated public/apple-touch-icon.png');

  // 2. pwa-192x192.png and pwa-512x512.png at root public/
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
