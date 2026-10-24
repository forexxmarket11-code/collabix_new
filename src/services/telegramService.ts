/**
 * Telegram Notification Client Service for Collabix Admin
 * Routes all notifications through the secure /api/telegram serverless endpoint.
 */

export type TelegramNotificationType = 'new_user' | 'payment_request' | 'test';

async function postTelegramNotification(
  type: TelegramNotificationType,
  data: Record<string, string>
): Promise<boolean> {
  try {
    const response = await fetch('/api/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data }),
      keepalive: true,
    });

    return response.ok;
  } catch {
    // Xato bo'lsa jim o'tkazib yuboriladi (sayt ishlashi to'xtamaydi)
    return false;
  }
}

/**
 * Sends a test/custom message via the server-side Telegram endpoint
 */
export async function sendTelegramAdminNotification(text: string): Promise<boolean> {
  const cleanText = (text || '').trim().slice(0, 200);
  return postTelegramNotification('test', { text: cleanText });
}

/**
 * 1. Yangi to'lov so'rovi kelganda yuboriladigan bildirishnoma
 */
export async function notifyAdminNewPaymentRequest(userName: string): Promise<boolean> {
  try {
    const cleanName = (userName || '').trim() || "Noma'lum foydalanuvchi";
    return await postTelegramNotification('payment_request', {
      userName: cleanName,
      amount: "59 000 so'm",
    });
  } catch {
    return false;
  }
}

/**
 * 2. Yangi ro'yxatdan o'tgan foydalanuvchi uchun yuboriladigan bildirishnoma
 */
export async function notifyAdminNewUserRegistered(
  name: string,
  role: 'bloger' | 'brend' | string
): Promise<boolean> {
  try {
    const cleanName = (name || '').trim() || "Noma'lum foydalanuvchi";
    const roleText = role === 'brend' ? 'brend' : 'bloger';
    return await postTelegramNotification('new_user', {
      name: cleanName,
      role: roleText,
    });
  } catch {
    return false;
  }
}
