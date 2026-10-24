import { UserSession } from '../types';

/**
 * Foydalanuvchining Pro rejimda ekanligini tekshiradi.
 * Pro status: 'trial' yoki 'active'.
 */
export function isUserPro(user: UserSession | null | undefined): boolean {
  if (!user) return false;
  return user.subscriptionStatus === 'trial' || user.subscriptionStatus === 'active';
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
