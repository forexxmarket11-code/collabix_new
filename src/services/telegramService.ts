/**
 * Telegram Bot Notification Service for Collabix Admin
 * Bot: @Collabix_tolov_bot
 * Bot token: 8766687220:AAEnASe4ekqnyo13ZIpeW5KujNOK6mC3Kn0
 * Chat ID: 8788020177
 */

const TELEGRAM_BOT_TOKEN = '8766687220:AAEnASe4ekqnyo13ZIpeW5KujNOK6mC3Kn0';
const TELEGRAM_ADMIN_CHAT_ID = '8788020177';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

/**
 * Sends a message to the Admin Telegram chat with full logging and error isolation
 */
export async function sendTelegramAdminNotification(text: string): Promise<boolean> {
  try {
    console.log('[Telegram Notification] Soʻrov yuborilmoqda...', text);
    const response = await fetch(TELEGRAM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_ADMIN_CHAT_ID,
        text: text,
      }),
      keepalive: true,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.warn('[Telegram Notification] Xabar yuborishda xatolik:', response.status, data);
      return false;
    }

    console.log('[Telegram Notification] Xabar muvaffaqiyatli yetkazildi! Message ID:', data?.result?.message_id);
    return true;
  } catch (error) {
    console.warn('[Telegram Notification] Tarmoq yoki API xatoligi:', error);
    return false;
  }
}

/**
 * 1. Yangi to'lov so'rovi kelganda yuboriladigan bildirishnoma
 */
export async function notifyAdminNewPaymentRequest(userName: string): Promise<boolean> {
  try {
    const cleanName = (userName || '').trim() || "Noma'lum foydalanuvchi";
    const message = `💳 Yangi to'lov so'rovi!\nFoydalanuvchi: ${cleanName}\nSumma: 59 000 so'm`;
    console.log('[Telegram Notification] To\'lov so\'rovi tayyorlandi, yuborilmoqda: Foydalanuvchi =', cleanName);
    return await sendTelegramAdminNotification(message);
  } catch (err) {
    console.warn('[Telegram Notification] notifyAdminNewPaymentRequest xatosi:', err);
    return false;
  }
}

/**
 * 2. Yangi ro'yxatdan o'tgan foydalanuvchi uchun yuboriladigan bildirishnoma
 */
export async function notifyAdminNewUserRegistered(name: string, role: 'bloger' | 'brend' | string): Promise<boolean> {
  try {
    const cleanName = (name || '').trim() || "Noma'lum";
    const roleText = role === 'brend' ? 'brend' : 'bloger';
    const message = `👤 Yangi foydalanuvchi ro'yxatdan o'tdi!\nIsm: ${cleanName}\nTuri: ${roleText}`;
    console.log('[Telegram Notification] Yangi foydalanuvchi tayyorlandi, yuborilmoqda: Ism =', cleanName, 'Turi =', roleText);
    return await sendTelegramAdminNotification(message);
  } catch (err) {
    console.warn('[Telegram Notification] notifyAdminNewUserRegistered xatosi:', err);
    return false;
  }
}
