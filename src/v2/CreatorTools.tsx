import React, { useEffect, useMemo, useState } from 'react';
import { UserSession } from '../types';
import { fetchMyProfileViews, ProfileView } from '../firebase';
import { isUserPro } from '../utils/subscription';
import { Pill, btn } from './ui';

const DAY = 86400000;
const ago = (ms: number) => {
  const d = Date.now() - ms;
  if (d < 3600000) return `${Math.max(1, Math.round(d / 60000))} daqiqa oldin`;
  if (d < DAY) return `${Math.round(d / 3600000)} soat oldin`;
  if (d < 2 * DAY) return 'kecha';
  return `${Math.round(d / DAY)} kun oldin`;
};

/* =========================================================================
 * Profilingizni kim ko'rdi
 * ========================================================================= */
export const ProfileViewsCard: React.FC<{ user: UserSession; onOpenPro: () => void; onOpenPitch: () => void }> = ({ user, onOpenPro, onOpenPitch }) => {
  const [views, setViews] = useState<ProfileView[] | null>(null);
  const pro = isUserPro(user);

  useEffect(() => {
    let alive = true;
    if (!user.uid) return;
    fetchMyProfileViews(user.uid)
      .then((v) => alive && setViews(v))
      .catch(() => alive && setViews([]));
    return () => { alive = false; };
  }, [user.uid]);

  const week = (views || []).filter((v) => Date.now() - Number(v.lastAtMillis || 0) < 7 * DAY);
  const month = (views || []).filter((v) => Date.now() - Number(v.lastAtMillis || 0) < 30 * DAY);
  const total = month.reduce((s, v) => s + (Number(v.count) || 1), 0);

  return (
    <section className="rounded-[24px] sm:rounded-[28px] bg-white border border-[#E6E3DC] overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-[#EEECE6] flex items-center justify-between gap-3">
        <h2 className="v2-display m-0 font-extrabold text-[19px] sm:text-[22px] tracking-[-0.5px]">Profilingizni kim ko'rdi</h2>
        {pro ? <Pill tone="dark">★ PRO</Pill> : null}
      </div>

      <div className="px-4 sm:px-6 pt-4 grid grid-cols-3 gap-2.5">
        <div className="rounded-2xl bg-[#14121C] text-white p-3"><div className="text-[11px] sm:text-[12px] text-[#BDB8CC] font-semibold">Bu hafta brendlar</div><div className="v2-display font-extrabold text-[26px] sm:text-[30px] text-[#C8F169] leading-tight">{views ? week.length : '…'}</div></div>
        <div className="rounded-2xl bg-[#F6F5F1] p-3"><div className="text-[11px] sm:text-[12px] text-[#5E5A6B] font-semibold">30 kunda brendlar</div><div className="v2-display font-extrabold text-[26px] sm:text-[30px] leading-tight">{views ? month.length : '…'}</div></div>
        <div className="rounded-2xl bg-[#F6F5F1] p-3"><div className="text-[11px] sm:text-[12px] text-[#5E5A6B] font-semibold">Ko'rishlar</div><div className="v2-display font-extrabold text-[26px] sm:text-[30px] leading-tight">{views ? total : '…'}</div></div>
      </div>

      <div className="px-4 sm:px-6 py-4">
        {views === null ? (
          <div className="h-[120px] rounded-2xl bg-[#F6F5F1] animate-pulse" />
        ) : views.length === 0 ? (
          <p className="m-0 text-[14px] text-[#5E5A6B]">Hali hech bir brend profilingizni ochmagan. Profilingizni to'ldiring va e'lonlarga ariza yuboring — brend arizangizni ko'rganda shu yerda chiqadi.</p>
        ) : pro ? (
          <ul className="m-0 p-0 list-none flex flex-col">
            {views.slice(0, 6).map((v) => (
              <li key={v.brandId} className="py-2.5 border-b border-[#EEECE6] last:border-b-0 flex items-center gap-3">
                <span className="w-10 h-10 shrink-0 rounded-xl bg-[#EDE9FE] text-[#3B1FB8] flex items-center justify-center font-extrabold">{(v.brandName || 'B').slice(0, 1).toUpperCase()}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-bold truncate">{v.brandName || 'Brend'}</div>
                  <div className="text-[13px] text-[#5E5A6B] truncate">{[v.brandCategory, v.brandCity, ago(Number(v.lastAtMillis) || Date.now())].filter(Boolean).join(' · ')}</div>
                </div>
                {Number(v.count) > 1 && <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-[#EDE9FE] text-[#3B1FB8] text-[12px] font-bold">{v.count} marta</span>}
              </li>
            ))}
            <li className="pt-3">
              <button type="button" onClick={onOpenPitch} className="text-[14px] font-bold text-[#4329D9] cursor-pointer min-h-[40px]">Maslahat: ko'rgan brendga o'zingiz yozing — tayyor taklif xati →</button>
            </li>
          </ul>
        ) : (
          <div className="relative">
            <div className="flex flex-col gap-2.5 blur-[5px] opacity-70 select-none" aria-hidden="true">
              {views.slice(0, 3).map((v, i) => <div key={i} className="h-11 rounded-xl bg-[#F1F0EC]" />)}
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3">
              <div className="v2-display font-extrabold text-[18px] sm:text-[20px]">{views.length} ta brend profilingizni ko'rdi</div>
              <div className="mt-0.5 text-[14px] text-[#5E5A6B]">Qaysilar ekanini Pro bilan ko'ring</div>
              <button type="button" onClick={onOpenPro} className={`${btn.violet} mt-3 min-h-[46px]`}>Pro'ni yoqish — 59 000 so'm</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

/* =========================================================================
 * Brendga taklif xati generatori
 * ========================================================================= */
type Offer = 'reels' | 'stories' | 'both' | 'barter';
type Style = 'formal' | 'friendly' | 'short';
const OFFERS: [Offer, string][] = [['reels', '1 ta Reels'], ['stories', 'Stories'], ['both', 'Reels + Stories'], ['barter', 'Barter']];
const STYLES: [Style, string][] = [['formal', 'Rasmiy'], ['friendly', "Do'stona"], ['short', 'Qisqa']];
const FREE_LIMIT = 3;

const fmtMoney = (v?: string) => {
  const n = Number(String(v || '').replace(/[^\d]/g, ''));
  return n ? `${n.toLocaleString('ru-RU').replace(/,/g, ' ')} so'm` : '';
};

function buildPitch(u: UserSession, brand: string, offer: Offer, style: Style, variant: number): string {
  const name = (u.name || '').trim().split(' ')[0];
  const city = (u.city || '').trim();
  const cat = ((u.categories || [])[0] || '').trim().toLowerCase();
  const sl: any = u.socialLinks || {};
  const followers = String(sl.instagramFollowers || (u as any).followers || '').trim();
  const insta = String(sl.instagram || u.instagramHandle || '').trim();
  const instaTxt = insta ? (/^https?:\/\//i.test(insta) ? insta : `@${insta.replace(/^@/, '')}`) : '';
  const price = fmtMoney(u.priceRange?.min);
  const link = u.uid ? `https://collabix.uz/#kreator-${u.uid}` : 'https://collabix.uz';
  const b = brand.trim() || '[brend nomi]';
  const offerTxt = offer === 'reels' ? '1 ta Reels' : offer === 'stories' ? 'Stories seriyasi' : offer === 'both' ? '1 ta Reels va Stories' : 'barter asosida (mahsulot evaziga) kontent';
  // "Toshkentdagi go'zallik blogeriman"
  const iam = `${city ? `${city}dagi ` : ''}${cat ? `${cat} ` : ''}blogeriman`;
  const intro = name ? `${style === 'formal' ? 'Mening ismim' : 'Men'} ${name}, ${iam}.` : `Men ${iam}.`;
  const aud = followers ? `Instagram'da ${followers} obunachim bor` : "Instagram'da faol auditoriyam bor";
  const audLine = `${aud}${instaTxt ? ` (${instaTxt})` : ''}.`;
  const priceLine = offer === 'barter' ? '' : price ? `Narxi: ${price}.` : 'Narxini kelishib olamiz.';
  const hooks = [
    "mahsulotingizni o'zim ishlatib, auditoriyamga halol fikrimni aytaman",
    "mahsulotingizni hayotiy vaziyatda, tabiiy ko'rinishda ko'rsataman",
    "mahsulotingizni qiziqarli ssenariy bilan, oxirida aniq chaqiriq bilan ko'rsataman",
  ];
  const hook = hooks[variant % hooks.length];
  const para = (...lines: string[]) => lines.filter(Boolean).join('\n\n');

  if (style === 'short') {
    return [
      `Assalomu alaykum, ${b}!`,
      `${intro} ${audLine}`,
      `Sizga ${offerTxt} taklif qilaman.${priceLine ? ` ${priceLine}` : ''}`,
      `Profilim: ${link}`,
    ].join('\n');
  }
  if (style === 'friendly') {
    return para(
      `Salom, ${b} jamoasi! 👋`,
      `${intro} ${audLine}`,
      `Mahsulotlaringiz menga juda yoqadi va auditoriyamga mos deb o'ylayman. Sizga ${offerTxt} qilib bermoqchiman: ${hook}.`,
      priceLine,
      `Ishlarim va statistikam: ${link}`,
      "Birga ishlasak xursand bo'lardim! 🙌"
    );
  }
  return para(
    `Assalomu alaykum, hurmatli ${b} jamoasi!`,
    `${intro} ${audLine}`,
    `Mahsulotlaringiz auditoriyamga mos keladi deb hisoblayman. Sizga ${offerTxt} taklif qilaman: ${hook}.`,
    [priceLine, `Profilim va oldingi ishlarim: ${link}`].filter(Boolean).join(' '),
    "Hamkorlik bo'yicha javobingizni kutaman. Rahmat!"
  );
}

export const PitchGenerator: React.FC<{ user: UserSession; onOpenPro: () => void }> = ({ user, onOpenPro }) => {
  const pro = isUserPro(user);
  const [brand, setBrand] = useState('');
  const [offer, setOffer] = useState<Offer>('reels');
  const [style, setStyle] = useState<Style>('formal');
  const [variant, setVariant] = useState(0);
  const [copied, setCopied] = useState(false);
  const monthKey = `cbx_pitch_${user.uid || 'x'}_${new Date().toISOString().slice(0, 7)}`;
  const [used, setUsed] = useState<number>(() => {
    try { return Number(localStorage.getItem(monthKey) || 0) || 0; } catch { return 0; }
  });
  const left = pro ? Infinity : Math.max(0, FREE_LIMIT - used);
  const text = useMemo(() => buildPitch(user, brand, offer, style, variant), [user, brand, offer, style, variant]);

  const copy = async () => {
    if (!pro && left <= 0) { onOpenPro(); return; }
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch {}
    if (!ok) {
      try {
        const ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select(); ok = document.execCommand('copy'); document.body.removeChild(ta);
      } catch {}
    }
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (!pro) {
        const n = used + 1;
        setUsed(n);
        try { localStorage.setItem(monthKey, String(n)); } catch {}
      }
    }
  };

  const chip = (on: boolean) => `min-h-[44px] px-4 rounded-full font-semibold text-[15px] border-2 cursor-pointer ${on ? 'bg-[#5B3DF5] text-white border-[#5B3DF5]' : 'bg-white border-[#E6E3DC] hover:border-[#14121C]'}`;
  const chipDark = (on: boolean) => `min-h-[44px] px-4 rounded-full font-semibold text-[15px] border-2 cursor-pointer ${on ? 'bg-[#14121C] text-white border-[#14121C]' : 'bg-white border-[#E6E3DC] hover:border-[#14121C]'}`;

  return (
    <div className="flex flex-wrap gap-4 items-start">
      <section className="flex-[1_1_340px] min-w-0 rounded-[24px] sm:rounded-[28px] bg-white border border-[#E6E3DC] p-5 sm:p-6 flex flex-col gap-5">
        <p className="m-0 text-[15px] text-[#5E5A6B]">3 ta savolga javob bering — tayyor xabarni nusxalab, brendga Instagram yoki Telegram'da yuboring.</p>
        <label className="block font-bold">Brend nomi
          <input value={brand} onChange={(e) => setBrand(e.target.value)} maxLength={80} placeholder="Masalan: Glow Lab" className="mt-1.5 w-full box-border min-h-[50px] px-4 rounded-2xl border-2 border-[#E6E3DC] bg-white text-[16px] font-medium outline-none focus:border-[#5B3DF5]" />
        </label>
        <div>
          <div className="font-bold">Nima taklif qilasiz?</div>
          <div className="mt-2 flex flex-wrap gap-2">{OFFERS.map(([id, l]) => <button key={id} type="button" aria-pressed={offer === id} onClick={() => setOffer(id)} className={chip(offer === id)}>{l}</button>)}</div>
        </div>
        <div>
          <div className="font-bold">Uslub</div>
          <div className="mt-2 flex flex-wrap gap-2">{STYLES.map(([id, l]) => <button key={id} type="button" aria-pressed={style === id} onClick={() => setStyle(id)} className={chipDark(style === id)}>{l}</button>)}</div>
        </div>
        <p className="m-0 text-[13px] text-[#5E5A6B]">Ismingiz, shahringiz, obunachilar soni va narxingiz profilingizdan olinadi. Noto'g'ri bo'lsa, profilni yangilang.</p>
      </section>

      <section className="flex-[1.3_1_420px] min-w-0 rounded-[24px] sm:rounded-[28px] bg-[#14121C] text-white p-5 sm:p-6 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-44 h-44 rounded-full bg-[#5B3DF5] opacity-60" aria-hidden="true" />
        <div className="relative">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[12px] font-bold tracking-[1.5px] text-[#C8F169]">TAYYOR XABAR</div>
            <div className="text-[12px] text-[#BDB8CC]">{pro ? 'Pro: cheksiz' : `Bu oy qoldi: ${left} / ${FREE_LIMIT}`}</div>
          </div>
          <label className="block mt-3">
            <span className="v2-sr">Taklif xati matni</span>
            <textarea readOnly value={text} rows={12} className="w-full box-border rounded-2xl bg-white text-[#14121C] p-4 text-[15px] leading-[1.6] resize-y border-0 outline-none" />
          </label>
          <div className="mt-3 flex flex-wrap gap-2.5">
            <button type="button" onClick={copy} className={`${btn.lime} min-h-[50px] px-6`} aria-live="polite">
              {copied ? 'Nusxalandi ✓' : !pro && left <= 0 ? "Pro bilan cheksiz" : 'Nusxalash'}
            </button>
            <button type="button" onClick={() => setVariant((v) => v + 1)} className="min-h-[50px] px-5 rounded-xl border-[1.5px] border-white/30 text-white font-bold cursor-pointer hover:bg-white/10">Boshqa variant</button>
          </div>
          {!pro && <div className="mt-3 text-[13px] text-[#BDB8CC]">Bepul: oyiga {FREE_LIMIT} ta xat · <button type="button" onClick={onOpenPro} className="underline font-bold text-[#C8F169] cursor-pointer">Pro: cheksiz</button></div>}
        </div>
      </section>
    </div>
  );
};
