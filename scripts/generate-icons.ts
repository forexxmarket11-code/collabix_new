import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve('public');
const iconsDir = path.resolve('public/icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 1. Standard SVG Icon (512x512 canvas, safe padding, crisp vectors)
const standardSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#191627" />
      <stop offset="50%" stop-color="#14121F" />
      <stop offset="100%" stop-color="#0E0D17" />
    </linearGradient>

    <!-- Main "C" Gradient -->
    <linearGradient id="cGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="30%" stop-color="#6366F1" />
      <stop offset="70%" stop-color="#8B5CF6" />
      <stop offset="100%" stop-color="#EC4899" />
    </linearGradient>

    <!-- Dot / Sparkle Gradient -->
    <linearGradient id="dotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F43F5E" />
      <stop offset="100%" stop-color="#FB7185" />
    </linearGradient>

    <!-- Subtle Glow Filter -->
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Dark Background -->
  <rect width="512" height="512" rx="112" fill="url(#bgGradient)" />
  <rect width="508" height="508" x="2" y="2" rx="110" fill="none" stroke="#2D2845" stroke-width="2" />

  <!-- Modern Geometric "C" Shape -->
  <g transform="translate(256, 256)" filter="url(#glow)">
    <!-- Main Sweeping Arc of C -->
    <path
      d="M 64 -96
         A 120 120 0 1 0 64 96"
      fill="none"
      stroke="url(#cGradient)"
      stroke-width="56"
      stroke-linecap="round"
    />

    <!-- Gradient Accent Dot (Collabix dot) -->
    <circle
      cx="92"
      cy="-96"
      r="28"
      fill="url(#dotGradient)"
    />

    <!-- Inner Core Highlight for visual depth -->
    <path
      d="M 52 -78
         A 98 98 0 1 0 52 78"
      fill="none"
      stroke="#FFFFFF"
      stroke-width="4"
      stroke-opacity="0.3"
      stroke-linecap="round"
    />
  </g>
</svg>`;

// 2. Maskable SVG Icon (Android squircle-safe: keep logo strictly inside 60-70% inner circle)
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="mBgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1A172A" />
      <stop offset="50%" stop-color="#14121F" />
      <stop offset="100%" stop-color="#0E0D17" />
    </linearGradient>

    <linearGradient id="mCGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="30%" stop-color="#6366F1" />
      <stop offset="70%" stop-color="#8B5CF6" />
      <stop offset="100%" stop-color="#EC4899" />
    </linearGradient>

    <linearGradient id="mDotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F43F5E" />
      <stop offset="100%" stop-color="#FB7185" />
    </linearGradient>
  </defs>

  <!-- Full-bleed background without border radius for adaptive mask -->
  <rect width="512" height="512" fill="url(#mBgGradient)" />

  <!-- Centered Icon scaled to safe zone (80% / 0.72 scale) -->
  <g transform="translate(256, 256) scale(0.72)">
    <path
      d="M 64 -96
         A 120 120 0 1 0 64 96"
      fill="none"
      stroke="url(#mCGradient)"
      stroke-width="56"
      stroke-linecap="round"
    />
    <circle
      cx="92"
      cy="-96"
      r="28"
      fill="url(#mDotGradient)"
    />
  </g>
</svg>`;

async function generate() {
  const svgBuffer = Buffer.from(standardSvg);
  const maskableBuffer = Buffer.from(maskableSvg);

  // Save SVG
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), standardSvg);
  fs.writeFileSync(path.join(iconsDir, 'icon.svg'), standardSvg);

  const sizes = [72, 96, 128, 144, 152, 180, 192, 384, 512];

  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(path.join(iconsDir, `icon-${size}x${size}.png`));
    console.log(`Generated icons/icon-${size}x${size}.png`);
  }

  // Generate 512x512 maskable icon
  await sharp(maskableBuffer)
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(iconsDir, 'icon-maskable-512x512.png'));
  console.log('Generated icons/icon-maskable-512x512.png');

  // Copy standard 192 and 512 to root public/ as well for maximum fallback compatibility
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  await sharp(maskableBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  // Apple touch icon (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  console.log('All icons generated successfully!');
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
