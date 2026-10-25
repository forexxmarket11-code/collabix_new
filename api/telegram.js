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
    return `👤 Yangi foydalanuvchi ro'yxatdan o'tdi!\nIsm: ${name}\nTuri: ${role}`;
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
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const cleanData = sanitizeData(data);
  const text = buildTelegramMessage(type, cleanData);

  try {
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

    if (!tgResponse.ok) {
      return res.status(500).json({ error: 'Failed to send notification' });
    }

    const tgPayload = await tgResponse.json().catch(() => null);
    if (tgPayload && tgPayload.ok === false) {
      return res.status(500).json({ error: 'Failed to send notification' });
    }

    return res.status(200).json({ ok: true });
  } catch {
    // Never log or return error details that could include the request URL or bot token
    return res.status(500).json({ error: 'Failed to send notification' });
  }
}
