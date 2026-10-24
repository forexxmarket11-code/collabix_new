import { UserSession } from '../types';

/**
 * Foydalanuvchining faol Pro rejimda ekanligini tekshiradi.
 * Pro status: 'trial' yoki 'active' hamda muddati (trialEndDate) tugamagan boʻlishi shart.
 */
export function isUserPro(user: Partial<UserSession> | null | undefined): boolean {
  if (!user) return false;
  const hasActiveStatus =
    user.subscriptionStatus === 'trial' || user.subscriptionStatus === 'active';
  if (!hasActiveStatus) return false;

  if (user.trialEndDate) {
    const endMs = new Date(user.trialEndDate).getTime();
    if (!isNaN(endMs) && endMs <= Date.now()) {
      return false;
    }
  }

  return true;
}

const BARE_SOCIAL_PREFIXES = new Set([
  '',
  '@',
  'http://',
  'https://',
  'instagram.com',
  'www.instagram.com',
  'http://instagram.com',
  'https://instagram.com',
  'https://www.instagram.com',
  'https://instagram.com/@',
  'tiktok.com',
  'tiktok.com/@',
  'www.tiktok.com',
  'www.tiktok.com/@',
  'http://tiktok.com',
  'https://tiktok.com',
  'https://tiktok.com/@',
  'https://www.tiktok.com',
  'https://www.tiktok.com/@',
  'youtube.com',
  'youtube.com/@',
  'www.youtube.com',
  'www.youtube.com/@',
  'http://youtube.com',
  'https://youtube.com',
  'https://youtube.com/@',
  'https://www.youtube.com',
  'https://www.youtube.com/@',
  'https://youtu.be',
  't.me',
  't.me/@',
  'http://t.me',
  'https://t.me',
  'https://t.me/@',
  'https://www.t.me',
  'https://telegram.me',
]);

/**
 * Ijtimoiy tarmoq havolasi yoki username boʻsh shablon emasligini tekshiradi
 */
export function isFilledSocialValue(raw?: string | null): boolean {
  if (!raw || typeof raw !== 'string') return false;
  const cleaned = raw.trim().replace(/\/+$/, '').toLowerCase();
  if (!cleaned || BARE_SOCIAL_PREFIXES.has(cleaned)) return false;
  const withoutAt = cleaned.replace(/^@+/, '');
  return withoutAt.length >= 2;
}

/**
 * Narx maydoni toʻldirilganligini tekshiradi ('0' yoki boʻsh emas)
 */
export function isFilledPriceValue(raw?: string | null): boolean {
  if (!raw || typeof raw !== 'string') return false;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '0') return false;
  return /[1-9]/.test(trimmed);
}

export type BloggerAdminCatalogStatus = 'in_catalog' | 'no_pro' | 'incomplete';

export interface BloggerCatalogReadiness {
  hasAvatar: boolean;
  hasBio: boolean;
  hasCategory: boolean;
  hasSocial: boolean;
  hasPrice: boolean;
  hasPro: boolean;
  isNotRejected: boolean;
  isProfileComplete: boolean;
  isVisibleInCatalog: boolean;
  adminStatus: BloggerAdminCatalogStatus;
}

/**
 * Blogerning katalogda koʻrinish shartlarini markazlashgan holda tekshiradi:
 * a) Profil toʻliq: avatar, bio (kamida 20 belgi), kategoriya, kamida bitta ijtimoiy tarmoq (Instagram/TikTok/YouTube/Telegram), narx.
 * b) Faol Pro rejim bor (agar catalogProOnly === true boʻlsa) va muddati tugamagan.
 * c) accountStatus !== 'rejected'.
 */
export function getBloggerCatalogReadiness(
  user: Partial<UserSession> | null | undefined,
  catalogProOnly: boolean = true
): BloggerCatalogReadiness {
  const hasAvatar = Boolean(
    user?.avatar && typeof user.avatar === 'string' && user.avatar.trim().length > 0
  );

  const hasBio = Boolean(
    user?.bio && typeof user.bio === 'string' && user.bio.trim().length >= 20
  );

  const hasCategory = Boolean(
    Array.isArray(user?.categories) &&
      user.categories.some((c) => typeof c === 'string' && c.trim().length > 0)
  );

  const links = user?.socialLinks;
  const hasInstagram =
    (links?.instagramEnabled !== false && isFilledSocialValue(links?.instagram)) ||
    isFilledSocialValue(user?.instagramHandle);
  const hasTiktok =
    links?.tiktokEnabled !== false && isFilledSocialValue(links?.tiktok);
  const hasYoutube =
    links?.youtubeEnabled !== false && isFilledSocialValue(links?.youtube);
  const hasTelegram =
    (links?.telegramEnabled !== false && isFilledSocialValue(links?.telegram)) ||
    isFilledSocialValue(user?.telegramUsername);

  const hasSocial = Boolean(hasInstagram || hasTiktok || hasYoutube || hasTelegram);

  const hasPrice = Boolean(
    isFilledPriceValue(user?.priceRange?.min) || isFilledPriceValue(user?.priceRange?.max)
  );

  const isProfileComplete = Boolean(
    hasAvatar && hasBio && hasCategory && hasSocial && hasPrice
  );

  const hasPro = isUserPro(user);
  const isNotRejected = user?.accountStatus !== 'rejected';
  const proRequirementMet = !catalogProOnly || hasPro;

  const isVisibleInCatalog = Boolean(
    isNotRejected && isProfileComplete && proRequirementMet
  );

  let adminStatus: BloggerAdminCatalogStatus = 'incomplete';
  if (!isProfileComplete) {
    adminStatus = 'incomplete';
  } else if (catalogProOnly && !hasPro) {
    adminStatus = 'no_pro';
  } else if (isNotRejected) {
    adminStatus = 'in_catalog';
  } else {
    adminStatus = 'incomplete';
  }

  return {
    hasAvatar,
    hasBio,
    hasCategory,
    hasSocial,
    hasPrice,
    hasPro,
    isNotRejected,
    isProfileComplete,
    isVisibleInCatalog,
    adminStatus,
  };
}

/**
 * Markaziy Pro rejim tekshiruvi:
 * 1. Faqat brendlar (biznes hisoblari) va tizimga kirmaganlar uchun Pro rejim talab qilinadi.
 *    Bloger hisoblari brif YUBORMAYDI, faqat QABUL qiladi — shuning uchun ularga bu cheklov tegishli emas.
 * 2. Agar foydalanuvchi brend bo'lsa (yoki tizimga kirmagan bo'lsa) va Pro rejimda bo'lmasa (trial yoki active emas):
 *    Brif yuborish oynasi ochilmaydi — o'rniga onProRequired (Pro modal / ta'rif) chaqiriladi.
 * 3. Agar Pro rejimda bo'lsa (yoki bloger bo'lsa), onProceed to'g'ridan-to'g'ri chaqiriladi.
 */
export function checkProUserAndProceed({
  currentUser,
  onProceed,
  onProRequired,
}: {
  currentUser: UserSession | null | undefined;
  onProceed: () => void;
  onProRequired: () => void;
}): boolean {
  // 3-qoida: Faqat brendlar (biznes hisoblari) uchun bu qoida amal qilsin.
  // Bloger hisoblari brif YUBORMAYDI, faqat QABUL qiladi, shuning uchun ularga bu cheklov tegishli emas.
  if (currentUser && currentUser.role === 'bloger') {
    onProceed();
    return true;
  }

  // Brend hisobi yoki tizimga kirmagan foydalanuvchi:
  if (isUserPro(currentUser)) {
    onProceed();
    return true;
  }

  // Pro rejimda bo'lmasa:
  onProRequired();
  return false;
}
