const ALLOWED_TYPES = new Set(['new_user', 'payment_request', 'referral_withdrawal', 'test']);
const MAX_FIELD_LENGTH = 200;

function sanitizeData(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'string') {
      sanitized[key] = value.trim().slice(0, MAX_FIELD_LENGTH);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = String(value).slice(0, MAX_FIELD_LENGTH);
    }
  }
  return sanitized;
}

function buildTelegramMessage(type, data) {
  if (type === 'new_user') {
    const name = data.name || data.userName || "Noma'lum foydalanuvchi";
    const role = data.role === 'brend' ? 'brend' : 'bloger';
    const base = `👤 Yangi foydalanuvchi ro'yxatdan o'tdi!\nIsm: ${name}\nTuri: ${role}`;
    // Referal: kim taklif qilgani (faqat ro'yxatdan o'tish formasidan keladi)
    if (typeof data.referrer === 'string') {
      return `${base}\n🎁 Taklif qilgan: ${data.referrer || "yo'q"}`;
    }
    return base;
  }

  if (type === 'payment_request') {
    const userName = data.userName || data.name || "Noma'lum foydalanuvchi";
    const amount = data.amount || "59 000 so'm";
    return `💳 Yangi to'lov so'rovi!\nFoydalanuvchi: ${userName}\nSumma: ${amount}`;
  }

  if (type === 'referral_withdrawal') {
    const userName = data.userName || data.name || "Noma'lum foydalanuvchi";
    const amount = data.amount || "29 000 so'm";
    return `🎁 Referal mukofotini yechib olish so'rovi!\nFoydalanuvchi: ${userName}\nSumma: ${amount}\nAdmin panel → Referal to'lovlar`;
  }

  const text = data.text || data.message || 'Collabix Telegram integratsiyasi ishlayapti.';
  return `✅ Test xabari!\n${text}`;
}

export default async function handler(req, res) {
  // Faqat o'z saytimizdan kelgan so'rovlar (begona saytlar botga spam yubora olmasin)
  const origin = String((req.headers && (req.headers.origin || req.headers.referer)) || '');
  const okOrigin = /^https:\/\/(www\.)?collabix\.uz(\/|$)/i.test(origin) || /^https:\/\/collabix-uzbbbb[a-z0-9-]*\.vercel\.app(\/|$)/i.test(origin);
  if (!okOrigin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method !== 'POST') {
    if (typeof res.setHeader === 'function') {
      res.setHeader('Allow', 'POST');
    }
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = body ? JSON.parse(body) : {};
    } catch {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const { type, data } = body;
  if (typeof type !== 'string' || !ALLOWED_TYPES.has(type)) {
    return res.status(400).json({ error: 'Unsupported notification type' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  // Bir nechta qabul qiluvchi: TELEGRAM_CHAT_ID="111111,222222" (vergul yoki bo'sh joy bilan)
  const chatIds = String(process.env.TELEGRAM_CHAT_ID || '')
    .split(/[\s,;]+/)
    .map((v) => v.trim())
    .filter((v) => v.length > 0);

  if (!token || chatIds.length === 0) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const cleanData = sanitizeData(data);
  const text = buildTelegramMessage(type, cleanData);

  try {
    const results = await Promise.allSettled(
      chatIds.map(async (chatId) => {
        const tgResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text,
          }),
        });
        if (!tgResponse.ok) throw new Error('send failed');
        const tgPayload = await tgResponse.json().catch(() => null);
        if (tgPayload && tgPayload.ok === false) throw new Error('send failed');
        return true;
      })
    );

    // Kamida bittasiga yetib borsa — muvaffaqiyatli
    if (!results.some((r) => r.status === 'fulfilled')) {
      return res.status(500).json({ error: 'Failed to send notification' });
    }

    return res.status(200).json({ ok: true });
  } catch {
    // Never log or return error details that could include the request URL or bot token
    return res.status(500).json({ error: 'Failed to send notification' });
  }
}
