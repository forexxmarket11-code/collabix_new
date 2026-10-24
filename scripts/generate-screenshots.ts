import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const screenshotsDir = path.resolve('public/screenshots');
const iconsDir = path.resolve('public/icons');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Also ensure icon-maskable-192x192.png exists
async function generateMaskable192() {
  const maskableSvg = fs.readFileSync(path.resolve('public/icons/icon-maskable.svg'), 'utf-8');
  await sharp(Buffer.from(maskableSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, 'icon-maskable-192x192.png'));
  console.log('✓ Generated icon-maskable-192x192.png');
}

// Mobile screenshot (1080x1920)
function getMobileSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0F0D17"/>
      <stop offset="50%" stop-color="#14121F"/>
      <stop offset="100%" stop-color="#171524"/>
    </linearGradient>
    <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#2A4BFF"/>
      <stop offset="50%" stop-color="#4F46E5"/>
      <stop offset="100%" stop-color="#7C3AED"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="50%" stop-color="#6366F1"/>
      <stop offset="100%" stop-color="#EC4899"/>
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E1B2E"/>
      <stop offset="100%" stop-color="#181528"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000000" flood-opacity="0.4"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1080" height="1920" fill="url(#bgGrad)"/>

  <!-- Top Status Bar -->
  <g transform="translate(60, 48)">
    <text x="0" y="24" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-weight="700" font-size="28">09:41</text>
    <!-- Icons right -->
    <circle cx="920" cy="18" r="6" fill="#FFFFFF"/>
    <circle cx="936" cy="18" r="6" fill="#FFFFFF"/>
    <circle cx="952" cy="18" r="6" fill="#FFFFFF"/>
    <rect x="970" y="8" width="40" height="20" rx="6" fill="none" stroke="#FFFFFF" stroke-width="3"/>
    <rect x="974" y="12" width="28" height="12" rx="3" fill="#FFFFFF"/>
  </g>

  <!-- Header -->
  <g transform="translate(60, 120)">
    <!-- Logo -->
    <text x="0" y="52" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-weight="900" font-size="44" letter-spacing="-1">COLLABIX</text>
    <circle cx="218" cy="46" r="8" fill="url(#accentGrad)"/>
    
    <!-- Action Icons -->
    <rect x="850" y="8" width="56" height="56" rx="16" fill="#25213B"/>
    <circle cx="875" cy="33" r="10" fill="none" stroke="#A5B4FC" stroke-width="3"/>
    <line x1="883" y1="41" x2="894" y2="52" stroke="#A5B4FC" stroke-width="3" stroke-linecap="round"/>

    <rect x="924" y="8" width="56" height="56" rx="16" fill="#25213B"/>
    <line x1="938" y1="26" x2="966" y2="26" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
    <line x1="938" y1="36" x2="966" y2="36" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
    <line x1="938" y1="46" x2="956" y2="46" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
  </g>

  <!-- Hero Section -->
  <g transform="translate(60, 230)">
    <!-- Badge -->
    <rect x="0" y="0" width="310" height="48" rx="24" fill="#231F3D" stroke="#3730A3" stroke-width="2"/>
    <circle cx="24" cy="24" r="6" fill="#10B981"/>
    <text x="44" y="32" fill="#C7D2FE" font-family="-apple-system, system-ui, sans-serif" font-weight="600" font-size="20">O'zbekiston №1 Platformasi</text>

    <!-- Main Title -->
    <text x="0" y="120" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-weight="900" font-size="54" letter-spacing="-1">Bloger va Brendlarni</text>
    <text x="0" y="185" fill="url(#primaryGrad)" font-family="-apple-system, system-ui, sans-serif" font-weight="900" font-size="54" letter-spacing="-1">Bir Necha Soniyada</text>
    <text x="0" y="250" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-weight="900" font-size="54" letter-spacing="-1">Bog'laydigan Tizim</text>

    <text x="0" y="315" fill="#94A3B8" font-family="-apple-system, system-ui, sans-serif" font-weight="400" font-size="24">Faqat tekshirilgan blogerlar, shaffof narxlar va kafolatlangan natija.</text>

    <!-- CTA Buttons -->
    <rect x="0" y="360" width="460" height="80" rx="20" fill="url(#primaryGrad)" filter="url(#shadow)"/>
    <text x="230" y="410" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-weight="700" font-size="24" text-anchor="middle">Katalogni ko'rish →</text>

    <rect x="490" y="360" width="470" height="80" rx="20" fill="#201C35" stroke="#312B4E" stroke-width="2"/>
    <text x="725" y="410" fill="#E2E8F0" font-family="-apple-system, system-ui, sans-serif" font-weight="700" font-size="24" text-anchor="middle">+ Brif yaratish</text>
  </g>

  <!-- Metric Badges -->
  <g transform="translate(60, 730)">
    <rect x="0" y="0" width="960" height="110" rx="24" fill="#1A172A" stroke="#2D2845" stroke-width="2"/>
    
    <g transform="translate(48, 30)">
      <text x="0" y="32" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-weight="800" font-size="34">500+</text>
      <text x="0" y="62" fill="#64748B" font-family="-apple-system, system-ui, sans-serif" font-weight="600" font-size="18">Blogerlar</text>
    </g>

    <line x1="330" y1="20" x2="330" y2="90" stroke="#2D2845" stroke-width="2"/>

    <g transform="translate(370, 30)">
      <text x="0" y="32" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-weight="800" font-size="34">1,200+</text>
      <text x="0" y="62" fill="#64748B" font-family="-apple-system, system-ui, sans-serif" font-weight="600" font-size="18">Hamkorliklar</text>
    </g>

    <line x1="680" y1="20" x2="680" y2="90" stroke="#2D2845" stroke-width="2"/>

    <g transform="translate(720, 30)">
      <text x="0" y="32" fill="#10B981" font-family="-apple-system, system-ui, sans-serif" font-weight="800" font-size="34">98%</text>
      <text x="0" y="62" fill="#64748B" font-family="-apple-system, system-ui, sans-serif" font-weight="600" font-size="18">Qoniqish</text>
    </g>
  </g>

  <!-- Section Header -->
  <g transform="translate(60, 890)">
    <text x="0" y="32" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-weight="800" font-size="32">Tavsiya etilgan blogerlar</text>
    <text x="960" y="32" fill="#818CF8" font-family="-apple-system, system-ui, sans-serif" font-weight="600" font-size="22" text-anchor="end">Barchasi (48) →</text>
  </g>

  <!-- Creator Card 1 -->
  <g transform="translate(60, 950)">
    <rect x="0" y="0" width="960" height="230" rx="28" fill="url(#cardGrad)" stroke="#2B2644" stroke-width="2" filter="url(#shadow)"/>
    
    <!-- Avatar -->
    <rect x="24" y="24" width="96" height="96" rx="24" fill="#3B82F6"/>
    <text x="72" y="82" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-weight="800" font-size="40" text-anchor="middle">A</text>
    <circle cx="108" cy="108" r="14" fill="#10B981" stroke="#1A172A" stroke-width="3"/>
    
    <!-- Info -->
    <text x="144" y="64" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-weight="800" font-size="28">Azizbek Rahimov</text>
    <text x="144" y="98" fill="#818CF8" font-family="-apple-system, system-ui, sans-serif" font-weight="600" font-size="20">@azizbek_tech • IT &amp; Texnologiya</text>
    
    <!-- Stats Row -->
    <rect x="24" y="144" width="220" height="60" rx="16" fill="#25213B"/>
    <text x="44" y="182" fill="#E2E8F0" font-family="-apple-system, system-ui, sans-serif" font-weight="700" font-size="22">250K obunachi</text>
    
    <rect x="260" y="144" width="180" height="60" rx="16" fill="#25213B"/>
    <text x="280" y="182" fill="#FBBF24" font-family="-apple-system, system-ui, sans-serif" font-weight="700" font-size="22">★ 4.9 (124)</text>

    <!-- Price & Button -->
    <text x="936" y="70" fill="#10B981" font-family="-apple-system, system-ui, sans-serif" font-weight="800" font-size="26" text-anchor="end">1,500,000 UZS</text>
    <rect x="760" y="144" width="176" height="60" rx="16" fill="url(#primaryGrad)"/>
    <text x="848" y="182" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-weight="700" font-size="20" text-anchor="middle">Tanlash</text>
  </g>

  <!-- Creator Card 2 -->
  <g transform="translate(60, 1210)">
    <rect x="0" y="0" width="960" height="230" rx="28" fill="url(#cardGrad)" stroke="#2B2644" stroke-width="2" filter="url(#shadow)"/>
    
    <!-- Avatar -->
    <rect x="24" y="24" width="96" height="96" rx="24" fill="#EC4899"/>
    <text x="72" y="82" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-weight="800" font-size="40" text-anchor="middle">M</text>
    <circle cx="108" cy="108" r="14" fill="#10B981" stroke="#1A172A" stroke-width="3"/>

    <!-- Info -->
    <text x="144" y="64" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-weight="800" font-size="28">Madina Karimova</text>
    <text x="144" y="98" fill="#F472B6" font-family="-apple-system, system-ui, sans-serif" font-weight="600" font-size="20">@madina_style • Go'zallik &amp; Fashion</text>

    <!-- Stats Row -->
    <rect x="24" y="144" width="220" height="60" rx="16" fill="#25213B"/>
    <text x="44" y="182" fill="#E2E8F0" font-family="-apple-system, system-ui, sans-serif" font-weight="700" font-size="22">420K obunachi</text>

    <rect x="260" y="144" width="180" height="60" rx="16" fill="#25213B"/>
    <text x="280" y="182" fill="#FBBF24" font-family="-apple-system, system-ui, sans-serif" font-weight="700" font-size="22">★ 5.0 (210)</text>

    <!-- Price & Button -->
    <text x="936" y="70" fill="#10B981" font-family="-apple-system, system-ui, sans-serif" font-weight="800" font-size="26" text-anchor="end">2,800,000 UZS</text>
    <rect x="760" y="144" width="176" height="60" rx="16" fill="url(#primaryGrad)"/>
    <text x="848" y="182" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-weight="700" font-size="20" text-anchor="middle">Tanlash</text>
  </g>

  <!-- Creator Card 3 -->
  <g transform="translate(60, 1470)">
    <rect x="0" y="0" width="960" height="230" rx="28" fill="url(#cardGrad)" stroke="#2B2644" stroke-width="2" filter="url(#shadow)"/>
    
    <!-- Avatar -->
    <rect x="24" y="24" width="96" height="96" rx="24" fill="#8B5CF6"/>
    <text x="72" y="82" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-weight="800" font-size="40" text-anchor="middle">J</text>
    <circle cx="108" cy="108" r="14" fill="#10B981" stroke="#1A172A" stroke-width="3"/>

    <!-- Info -->
    <text x="144" y="64" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-weight="800" font-size="28">Jasur Mirzayev</text>
    <text x="144" y="98" fill="#A78BFA" font-family="-apple-system, system-ui, sans-serif" font-weight="600" font-size="20">@jasur_vlogs • Lifestyle &amp; Sayohat</text>

    <!-- Stats Row -->
    <rect x="24" y="144" width="220" height="60" rx="16" fill="#25213B"/>
    <text x="44" y="182" fill="#E2E8F0" font-family="-apple-system, system-ui, sans-serif" font-weight="700" font-size="22">680K obunachi</text>

    <rect x="260" y="144" width="180" height="60" rx="16" fill="#25213B"/>
    <text x="280" y="182" fill="#FBBF24" font-family="-apple-system, system-ui, sans-serif" font-weight="700" font-size="22">★ 4.95 (340)</text>

    <!-- Price & Button -->
    <text x="936" y="70" fill="#10B981" font-family="-apple-system, system-ui, sans-serif" font-weight="800" font-size="26" text-anchor="end">3,500,000 UZS</text>
    <rect x="760" y="144" width="176" height="60" rx="16" fill="url(#primaryGrad)"/>
    <text x="848" y="182" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-weight="700" font-size="20" text-anchor="middle">Tanlash</text>
  </g>

  <!-- Bottom Navigation Bar -->
  <g transform="translate(0, 1740)">
    <rect width="1080" height="180" fill="#13101E" stroke="#25203A" stroke-width="2"/>
    
    <!-- Item 1 (Active) -->
    <g transform="translate(135, 45)">
      <circle cx="0" cy="0" r="28" fill="#2A4BFF" fill-opacity="0.2"/>
      <rect x="-14" y="-14" width="28" height="28" rx="8" fill="#2A4BFF"/>
      <text x="0" y="44" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-weight="700" font-size="20" text-anchor="middle">Asosiy</text>
    </g>

    <!-- Item 2 -->
    <g transform="translate(405, 45)">
      <rect x="-14" y="-14" width="28" height="28" rx="8" fill="none" stroke="#64748B" stroke-width="3"/>
      <text x="0" y="44" fill="#64748B" font-family="-apple-system, system-ui, sans-serif" font-weight="600" font-size="20" text-anchor="middle">Katalog</text>
    </g>

    <!-- Item 3 -->
    <g transform="translate(675, 45)">
      <rect x="-14" y="-14" width="28" height="28" rx="8" fill="none" stroke="#64748B" stroke-width="3"/>
      <text x="0" y="44" fill="#64748B" font-family="-apple-system, system-ui, sans-serif" font-weight="600" font-size="20" text-anchor="middle">Briflar</text>
    </g>

    <!-- Item 4 -->
    <g transform="translate(945, 45)">
      <circle cx="0" cy="-2" r="14" fill="none" stroke="#64748B" stroke-width="3"/>
      <text x="0" y="44" fill="#64748B" font-family="-apple-system, system-ui, sans-serif" font-weight="600" font-size="20" text-anchor="middle">Profil</text>
    </g>
  </g>
</svg>`;
}

// Desktop screenshot (1920x1080)
function getDesktopSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
  <defs>
    <linearGradient id="bgDesk" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0E0D17"/>
      <stop offset="50%" stop-color="#14121F"/>
      <stop offset="100%" stop-color="#171424"/>
    </linearGradient>
    <linearGradient id="primDesk" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#2A4BFF"/>
      <stop offset="50%" stop-color="#4F46E5"/>
      <stop offset="100%" stop-color="#7C3AED"/>
    </linearGradient>
    <linearGradient id="cDeskGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="50%" stop-color="#6366F1"/>
      <stop offset="100%" stop-color="#EC4899"/>
    </linearGradient>
    <linearGradient id="cardDesk" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E1B2E"/>
      <stop offset="100%" stop-color="#181527"/>
    </linearGradient>
    <filter id="deskShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="20" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1920" height="1080" fill="url(#bgDesk)"/>

  <!-- Desktop Navbar -->
  <rect width="1920" height="88" fill="#13101E" stroke="#25203A" stroke-width="1"/>
  <g transform="translate(120, 24)">
    <!-- Logo -->
    <text x="0" y="32" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-weight="900" font-size="30" letter-spacing="-0.5">COLLABIX</text>
    <circle cx="152" cy="28" r="6" fill="url(#cDeskGrad)"/>

    <!-- Nav Links -->
    <text x="280" y="30" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-weight="700" font-size="16">Katalog</text>
    <text x="390" y="30" fill="#94A3B8" font-family="-apple-system, system-ui, sans-serif" font-weight="600" font-size="16">Ochiq Briflar</text>
    <text x="530" y="30" fill="#94A3B8" font-family="-apple-system, system-ui, sans-serif" font-weight="600" font-size="16">Qanday ishlaydi?</text>
    <text x="700" y="30" fill="#94A3B8" font-family="-apple-system, system-ui, sans-serif" font-weight="600" font-size="16">Biz haqimizda</text>

    <!-- Right Actions -->
    <rect x="1380" y="-4" width="140" height="46" rx="12" fill="#201C35" stroke="#312B4E" stroke-width="1.5"/>
    <text x="1450" y="25" fill="#E2E8F0" font-family="-apple-system, system-ui, sans-serif" font-weight="700" font-size="15" text-anchor="middle">Kirish</text>

    <rect x="1540" y="-4" width="160" height="46" rx="12" fill="url(#primDesk)"/>
    <text x="1620" y="25" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-weight="700" font-size="15" text-anchor="middle">+ Brif yaratish</text>
  </g>

  <!-- Hero Header -->
  <g transform="translate(120, 140)">
    <rect x="0" y="0" width="280" height="36" rx="18" fill="#231F3D" stroke="#3730A3" stroke-width="1.5"/>
    <circle cx="20" cy="18" r="5" fill="#10B981"/>
    <text x="38" y="24" fill="#C7D2FE" font-family="-apple-system, system-ui, sans-serif" font-weight="600" font-size="15">O'zbekiston Blogerlar Katalogi</text>

    <text x="0" y="90" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-weight="900" font-size="46" letter-spacing="-1">Eng Yaxshi Blogerlar bilan Samarali Hamkorlik</text>
    <text x="0" y="130" fill="#94A3B8" font-family="-apple-system, system-ui, sans-serif" font-weight="400" font-size="18">Auditoriya, qamrov va narxlar tekshirilgan. Bir klik bilan brif jo'nating.</text>
  </g>

  <!-- Filter / Search Bar -->
  <g transform="translate(120, 310)">
    <rect width="1680" height="76" rx="20" fill="#1A172A" stroke="#2D2845" stroke-width="1.5" filter="url(#deskShadow)"/>
    
    <!-- Search Input Mock -->
    <rect x="20" y="14" width="440" height="48" rx="12" fill="#231F3B"/>
    <text x="60" y="44" fill="#64748B" font-family="-apple-system, system-ui, sans-serif" font-size="15">Bloger ismi yoki mavzu bo'yicha qidiruv...</text>
    
    <!-- Category Pills -->
    <rect x="480" y="14" width="130" height="48" rx="12" fill="url(#primDesk)"/>
    <text x="545" y="44" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-weight="700" font-size="15" text-anchor="middle">Barchasi (48)</text>

    <rect x="625" y="14" width="130" height="48" rx="12" fill="#201C35"/>
    <text x="690" y="44" fill="#94A3B8" font-family="-apple-system, system-ui, sans-serif" font-weight="600" font-size="15" text-anchor="middle">IT &amp; Texno</text>

    <rect x="770" y="14" width="140" height="48" rx="12" fill="#201C35"/>
    <text x="840" y="44" fill="#94A3B8" font-family="-apple-system, system-ui, sans-serif" font-weight="600" font-size="15" text-anchor="middle">Go'zallik</text>

    <rect x="925" y="14" width="140" height="48" rx="12" fill="#201C35"/>
    <text x="995" y="44" fill="#94A3B8" font-family="-apple-system, system-ui, sans-serif" font-weight="600" font-size="15" text-anchor="middle">Biznes</text>

    <!-- Sort selector -->
    <text x="1560" y="45" fill="#818CF8" font-family="-apple-system, system-ui, sans-serif" font-weight="700" font-size="15">Saralash: Reyting bo'yicha ↓</text>
  </g>

  <!-- 3-Column Grid Cards -->
  <!-- Card 1 -->
  <g transform="translate(120, 420)">
    <rect width="536" height="580" rx="24" fill="url(#cardDesk)" stroke="#2B2644" stroke-width="1.5" filter="url(#deskShadow)"/>
    
    <!-- Top banner in card -->
    <rect width="536" height="120" rx="24" fill="#221E38"/>
    <rect x="0" y="96" width="536" height="24" fill="#221E38"/>
    
    <!-- Avatar -->
    <rect x="36" y="70" width="96" height="96" rx="24" fill="#3B82F6" stroke="#181527" stroke-width="4"/>
    <text x="84" y="128" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-weight="800" font-size="40" text-anchor="middle">A</text>
    <circle cx="120" cy="154" r="12" fill="#10B981" stroke="#181527" stroke-width="3"/>

    <!-- Category tag -->
    <rect x="380" y="140" width="120" height="32" rx="10" fill="#25213B"/>
    <text x="440" y="162" fill="#818CF8" font-family="-apple-system, system-ui, sans-serif" font-weight="700" font-size="13" text-anchor="middle">IT &amp; Texno</text>

    <!-- Name & Handle -->
    <text x="36" y="210" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-weight="800" font-size="24">Azizbek Rahimov</text>
    <text x="36" y="240" fill="#64748B" font-family="-apple-system, system-ui, sans-serif" font-weight="500" font-size="16">@azizbek_tech</text>

    <!-- Bio -->
    <text x="36" y="280" fill="#94A3B8" font-family="-apple-system, system-ui, sans-serif" font-size="15">Sun'iy intellekt, gadjetlar va dasturlash haqida eng yirik o'zbek blogi.</text>

    <!-- Metrics box -->
    <rect x="36" y="320" width="464" height="90" rx="16" fill="#211D36"/>
    <g transform="translate(60, 350)">
      <text x="0" y="22" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-weight="800" font-size="22">250K</text>
      <text x="0" y="44" fill="#64748B" font-family="-apple-system, system-ui, sans-serif" font-size="13">Obunachilar</text>

      <text x="150" y="22" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-weight="800" font-size="22">8.4%</text>
      <text x="150" y="44" fill="#64748B" font-family="-apple-system, system-ui, sans-serif" font-size="13">ER (Aktivlik)</text>

      <text x="300" y="22" fill="#FBBF24" font-family="-apple-system, system-ui, sans-serif" font-weight="800" font-size="22">★ 4.98</text>
      <text x="300" y="44" fill="#64748B" font-family="-apple-system, system-ui, sans-serif" font-size="13">124 ta sharh</text>
    </g>

    <!-- Footer of card -->
    <line x1="36" y1="440" x2="500" y2="440" stroke="#2B2644" stroke-width="1.5"/>
    <text x="36" y="485" fill="#64748B" font-family="-apple-system, system-ui, sans-serif" font-size="14">Boshlang'ich narx:</text>
    <text x="36" y="520" fill="#10B981" font-family="-apple-system, system-ui, sans-serif" font-weight="800" font-size="24">1,500,000 UZS</text>

    <rect x="330" y="475" width="170" height="54" rx="14" fill="url(#primDesk)"/>
    <text x="415" y="508" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-weight="700" font-size="15" text-anchor="middle">Brif jo'natish →</text>
  </g>

  <!-- Card 2 -->
  <g transform="translate(692, 420)">
    <rect width="536" height="580" rx="24" fill="url(#cardDesk)" stroke="#2B2644" stroke-width="1.5" filter="url(#deskShadow)"/>
    
    <!-- Top banner in card -->
    <rect width="536" height="120" rx="24" fill="#2E1C32"/>
    <rect x="0" y="96" width="536" height="24" fill="#2E1C32"/>
    
    <!-- Avatar -->
    <rect x="36" y="70" width="96" height="96" rx="24" fill="#EC4899" stroke="#181527" stroke-width="4"/>
    <text x="84" y="128" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-weight="800" font-size="40" text-anchor="middle">M</text>
    <circle cx="120" cy="154" r="12" fill="#10B981" stroke="#181527" stroke-width="3"/>

    <!-- Category tag -->
    <rect x="380" y="140" width="120" height="32" rx="10" fill="#25213B"/>
    <text x="440" y="162" fill="#F472B6" font-family="-apple-system, system-ui, sans-serif" font-weight="700" font-size="13" text-anchor="middle">Go'zallik</text>

    <!-- Name & Handle -->
    <text x="36" y="210" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-weight="800" font-size="24">Madina Karimova</text>
    <text x="36" y="240" fill="#64748B" font-family="-apple-system, system-ui, sans-serif" font-weight="500" font-size="16">@madina_style</text>

    <!-- Bio -->
    <text x="36" y="280" fill="#94A3B8" font-family="-apple-system, system-ui, sans-serif" font-size="15">Moda, go'zallik parvarishi va zamonaviy obrazlar bo'yicha ekspert.</text>

    <!-- Metrics box -->
    <rect x="36" y="320" width="464" height="90" rx="16" fill="#211D36"/>
    <g transform="translate(60, 350)">
      <text x="0" y="22" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-weight="800" font-size="22">420K</text>
      <text x="0" y="44" fill="#64748B" font-family="-apple-system, system-ui, sans-serif" font-size="13">Obunachilar</text>

      <text x="150" y="22" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-weight="800" font-size="22">12.1%</text>
      <text x="150" y="44" fill="#64748B" font-family="-apple-system, system-ui, sans-serif" font-size="13">ER (Aktivlik)</text>

      <text x="300" y="22" fill="#FBBF24" font-family="-apple-system, system-ui, sans-serif" font-weight="800" font-size="22">★ 5.00</text>
      <text x="300" y="44" fill="#64748B" font-family="-apple-system, system-ui, sans-serif" font-size="13">210 ta sharh</text>
    </g>

    <!-- Footer of card -->
    <line x1="36" y1="440" x2="500" y2="440" stroke="#2B2644" stroke-width="1.5"/>
    <text x="36" y="485" fill="#64748B" font-family="-apple-system, system-ui, sans-serif" font-size="14">Boshlang'ich narx:</text>
    <text x="36" y="520" fill="#10B981" font-family="-apple-system, system-ui, sans-serif" font-weight="800" font-size="24">2,800,000 UZS</text>

    <rect x="330" y="475" width="170" height="54" rx="14" fill="url(#primDesk)"/>
    <text x="415" y="508" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-weight="700" font-size="15" text-anchor="middle">Brif jo'natish →</text>
  </g>

  <!-- Card 3 -->
  <g transform="translate(1264, 420)">
    <rect width="536" height="580" rx="24" fill="url(#cardDesk)" stroke="#2B2644" stroke-width="1.5" filter="url(#deskShadow)"/>
    
    <!-- Top banner in card -->
    <rect width="536" height="120" rx="24" fill="#201C38"/>
    <rect x="0" y="96" width="536" height="24" fill="#201C38"/>
    
    <!-- Avatar -->
    <rect x="36" y="70" width="96" height="96" rx="24" fill="#8B5CF6" stroke="#181527" stroke-width="4"/>
    <text x="84" y="128" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-weight="800" font-size="40" text-anchor="middle">J</text>
    <circle cx="120" cy="154" r="12" fill="#10B981" stroke="#181527" stroke-width="3"/>

    <!-- Category tag -->
    <rect x="380" y="140" width="120" height="32" rx="10" fill="#25213B"/>
    <text x="440" y="162" fill="#A78BFA" font-family="-apple-system, system-ui, sans-serif" font-weight="700" font-size="13" text-anchor="middle">Lifestyle</text>

    <!-- Name & Handle -->
    <text x="36" y="210" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-weight="800" font-size="24">Jasur Mirzayev</text>
    <text x="36" y="240" fill="#64748B" font-family="-apple-system, system-ui, sans-serif" font-weight="500" font-size="16">@jasur_vlogs</text>

    <!-- Bio -->
    <text x="36" y="280" fill="#94A3B8" font-family="-apple-system, system-ui, sans-serif" font-size="15">Sayohatlar, shaxsiy tajribalar va kundalik motivatsiya vloggingi.</text>

    <!-- Metrics box -->
    <rect x="36" y="320" width="464" height="90" rx="16" fill="#211D36"/>
    <g transform="translate(60, 350)">
      <text x="0" y="22" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-weight="800" font-size="22">680K</text>
      <text x="0" y="44" fill="#64748B" font-family="-apple-system, system-ui, sans-serif" font-size="13">Obunachilar</text>

      <text x="150" y="22" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-weight="800" font-size="22">9.8%</text>
      <text x="150" y="44" fill="#64748B" font-family="-apple-system, system-ui, sans-serif" font-size="13">ER (Aktivlik)</text>

      <text x="300" y="22" fill="#FBBF24" font-family="-apple-system, system-ui, sans-serif" font-weight="800" font-size="22">★ 4.95</text>
      <text x="300" y="44" fill="#64748B" font-family="-apple-system, system-ui, sans-serif" font-size="13">340 ta sharh</text>
    </g>

    <!-- Footer of card -->
    <line x1="36" y1="440" x2="500" y2="440" stroke="#2B2644" stroke-width="1.5"/>
    <text x="36" y="485" fill="#64748B" font-family="-apple-system, system-ui, sans-serif" font-size="14">Boshlang'ich narx:</text>
    <text x="36" y="520" fill="#10B981" font-family="-apple-system, system-ui, sans-serif" font-weight="800" font-size="24">3,500,000 UZS</text>

    <rect x="330" y="475" width="170" height="54" rx="14" fill="url(#primDesk)"/>
    <text x="415" y="508" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-weight="700" font-size="15" text-anchor="middle">Brif jo'natish →</text>
  </g>
</svg>`;
}

async function run() {
  console.log('Generating PWA screenshots and icons...');
  await generateMaskable192();

  const mobileSvg = getMobileSvg();
  await sharp(Buffer.from(mobileSvg))
    .resize(1080, 1920)
    .png({ quality: 95 })
    .toFile(path.join(screenshotsDir, 'screenshot-mobile.png'));
  console.log('✓ Generated screenshot-mobile.png (1080x1920)');

  const desktopSvg = getDesktopSvg();
  await sharp(Buffer.from(desktopSvg))
    .resize(1920, 1080)
    .png({ quality: 95 })
    .toFile(path.join(screenshotsDir, 'screenshot-desktop.png'));
  console.log('✓ Generated screenshot-desktop.png (1920x1080)');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
