import React, { useEffect, useMemo, useRef, useState } from 'react';
import { UserSession } from '../types';
import { saveUserProfile, compressImageFile, calculateProfileCompletion } from '../firebase';
import { Avatar, Icon, btn } from './ui';

type QType = 'text' | 'textarea' | 'chips' | 'multi' | 'photo';
interface Q {
  key: string;
  emoji: string;
  kicker: string;
  title: string;
  hint: string;
  type: QType;
  placeholder?: string;
  options?: string[];
  optional?: boolean;
  minLen?: number;
  inputMode?: 'text' | 'numeric' | 'tel';
  /** Profil kuchiga ta'sir qiladimi */
  core?: boolean;
}

const CITIES = ['Toshkent', 'Samarqand', 'Jizzax', 'Buxoro', 'Andijon', "Farg'ona", 'Namangan', 'Qarshi', 'Nukus', 'Termiz', 'Urganch', 'Navoiy', 'Guliston', 'Boshqa'];

const BLOGER_QS: Q[] = [
  { key: 'avatar', emoji: '📸', kicker: 'RASM', title: 'Profil rasmingiz', hint: "Brendlar birinchi bo'lib shu rasmni ko'radi. Yuzingiz aniq ko'rinsin.", type: 'photo', core: true },
  { key: 'name', emoji: '👋', kicker: 'TANISHAYLIK', title: 'Ismingiz qanday yozilsin?', hint: "Brendlar sizni shu ism bilan ko'radi.", type: 'text', placeholder: 'Masalan, Madina Karimova', minLen: 2 },
  { key: 'city', emoji: '📍', kicker: 'JOYLASHUV', title: 'Qaysi shahardasiz?', hint: "Mahalliy brendlar o'z shahridagi blogerlarni qidiradi.", type: 'chips', options: CITIES },
  { key: 'categories', emoji: '🎯', kicker: "YO'NALISH", title: 'Qaysi mavzuda kontent qilasiz?', hint: "Bir nechtasini tanlang — mos e'lonlar shunga qarab chiqadi.", type: 'multi', options: ["Go'zallik", 'Lifestyle', 'Food', 'Moda', 'Sport', 'Texnika', "Ta'lim", 'Sayohat', 'Oila', 'Yumor', 'Biznes', 'Avto'], core: true },
  { key: 'instagram', emoji: '📱', kicker: 'INSTAGRAM', title: 'Instagram sahifangiz?', hint: '@username yoki havola. Brend sahifangizni ochib ko\'radi.', type: 'text', placeholder: '@username', minLen: 2, core: true },
  { key: 'followers', emoji: '🔥', kicker: 'AUDITORIYA', title: 'Nechta obunachingiz bor?', hint: "Taxminiy bo'lsa ham bo'ladi. 1 000+ obunachili blogerlar bosh sahifada ko'rinadi.", type: 'chips', options: ['1 mingdan kam', '1–5 ming', '5–10 ming', '10–50 ming', '50–100 ming', '100 ming+'] },
  { key: 'price', emoji: '💰', kicker: 'NARX', title: "1 ta Reels narxingiz (so'm)?", hint: "Brend taklifni shu narxga qarab beradi. Keyin o'zgartirish mumkin.", type: 'text', placeholder: 'Masalan, 500 000', inputMode: 'numeric', minLen: 3, core: true },
  { key: 'bio', emoji: '✍️', kicker: "O'ZINGIZ HAQINGIZDA", title: "O'zingizni 1–2 gapda tanishtiring", hint: 'Kim uchun, qanday kontent qilasiz? Kamida 20 belgi.', type: 'textarea', placeholder: "Masalan: Jizzaxdagi oilaviy blog — retseptlar va uy hayoti, 70% auditoriya ayollar", minLen: 20, core: true },
  { key: 'telegram', emoji: '✈️', kicker: 'ALOQA', title: 'Telegram username', hint: "Ixtiyoriy. Qabul qilgan brend siz bilan tezroq bog'lanadi.", type: 'text', placeholder: '@username', optional: true },
  { key: 'gender', emoji: '🙂', kicker: 'IXTIYORIY', title: 'Jinsingiz', hint: "Ba'zi brendlar (masalan, kosmetika) shunga qarab tanlaydi.", type: 'chips', options: ['Ayol', 'Erkak'], optional: true },
];

const BRAND_QS: Q[] = [
  { key: 'avatar', emoji: '🏷️', kicker: 'LOGO', title: 'Brend logotipi', hint: "Blogerlar e'lonlaringizda shu logoni ko'radi.", type: 'photo', core: true },
  { key: 'name', emoji: '👋', kicker: 'BREND', title: 'Brendingiz nomi?', hint: "Blogerlar e'londa shu nomni ko'radi.", type: 'text', placeholder: 'Masalan, Lumiere Beauty', minLen: 2, core: true },
  { key: 'field', emoji: '🎯', kicker: 'SOHA', title: 'Qaysi sohada ishlaysiz?', hint: 'Bittasini tanlang.', type: 'chips', options: ['Kiyim', 'Kosmetika', 'Kafe va restoran', "Onlayn do'kon", 'Texnika', "Ta'lim", 'Xizmatlar', 'Boshqa'], core: true },
  { key: 'city', emoji: '📍', kicker: 'JOYLASHUV', title: 'Qaysi shahardasiz?', hint: 'Bittasini tanlang.', type: 'chips', options: [...CITIES.slice(0, 13), "Butun O'zbekiston"] },
  { key: 'instagram', emoji: '📱', kicker: 'SAHIFA', title: 'Instagram yoki sayt havolasi', hint: 'Blogerlar brendingizni shu yerda ko\'radi.', type: 'text', placeholder: '@brend yoki https://', minLen: 2, core: true },
  { key: 'bio', emoji: '✍️', kicker: 'BREND HAQIDA', title: 'Brendingizni qisqacha tanishtiring', hint: 'Nima sotasiz, kimlar uchun? Kamida 20 belgi.', type: 'textarea', placeholder: "Masalan: Toshkentdagi kosmetika do'koni, tabiiy mahsulotlar", minLen: 20, core: true },
  { key: 'telegram', emoji: '✈️', kicker: 'ALOQA', title: 'Telegram username', hint: "Ixtiyoriy. Qabul qilingan bloger siz bilan tez bog'lanadi.", type: 'text', placeholder: '@username', optional: true },
];

const clean = (v: unknown) => String(v ?? '').trim();

function initialAnswers(u: UserSession): Record<string, any> {
  const sl: any = u.socialLinks || {};
  return {
    avatar: u.avatar || '',
    name: u.name || '',
    city: u.city || '',
    categories: Array.isArray(u.categories) ? u.categories : [],
    field: (u.categories || [])[0] || '',
    instagram: sl.instagram || u.instagramHandle || '',
    followers: sl.instagramFollowers || (u as any).followers || '',
    price: u.priceRange?.min || '',
    bio: u.bio || '',
    telegram: u.telegramUsername || sl.telegram || '',
    gender: u.gender === 'ayol' ? 'Ayol' : u.gender === 'erkak' ? 'Erkak' : '',
  };
}

function buildPatch(u: UserSession, a: Record<string, any>, isBrand: boolean): Partial<UserSession> {
  const sl: any = { ...(u.socialLinks || {}) };
  const insta = clean(a.instagram);
  const tg = clean(a.telegram).replace(/^https?:\/\/t\.me\//, '').replace(/^@/, '');
  sl.instagram = insta;
  sl.instagramEnabled = Boolean(insta);
  if (!isBrand) sl.instagramFollowers = clean(a.followers);
  if (tg) sl.telegram = tg;
  const patch: Partial<UserSession> = {
    name: clean(a.name) || u.name,
    city: clean(a.city),
    bio: clean(a.bio),
    socialLinks: sl,
    instagramHandle: insta,
  };
  if (a.avatar) patch.avatar = a.avatar;
  if (tg) patch.telegramUsername = tg;
  if (isBrand) {
    patch.categories = a.field ? [a.field] : u.categories || [];
  } else {
    patch.categories = Array.isArray(a.categories) ? a.categories : [];
    patch.priceRange = { ...(u.priceRange || {}), min: clean(a.price).replace(/[^\d]/g, ''), max: u.priceRange?.max || '' } as any;
    if (a.gender) patch.gender = a.gender === 'Ayol' ? 'ayol' : 'erkak';
  }
  return patch;
}

const filled = (q: Q, v: any) => {
  if (q.type === 'multi') return Array.isArray(v) && v.length > 0;
  const s = clean(v);
  if (!s) return false;
  if (q.minLen && s.length < q.minLen) return false;
  return true;
};

const preview = (q: Q, v: any) => {
  if (q.type === 'photo') return null;
  if (q.type === 'multi') return Array.isArray(v) && v.length ? v.join(', ') : '';
  if (q.key === 'price' && clean(v)) return `${clean(v).replace(/[^\d]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} so'm`;
  return clean(v);
};

interface Props {
  user: UserSession | null;
  onSave: (u: UserSession) => void;
  onBack: () => void;
  onOpenFullEditor: () => void;
}

export const V2EditProfile: React.FC<Props> = ({ user, onSave, onBack, onOpenFullEditor }) => {
  const isBrand = user?.role === 'brend';
  const qs = isBrand ? BRAND_QS : BLOGER_QS;
  const [answers, setAnswers] = useState<Record<string, any>>(() => (user ? initialAnswers(user) : {}));
  const [mode, setMode] = useState<'overview' | 'ask'>('overview');
  const [queue, setQueue] = useState<number[]>([]);
  const [pos, setPos] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const merged = useMemo(() => (user ? ({ ...user, ...buildPatch(user, answers, isBrand) } as UserSession) : null), [user, answers, isBrand]);
  const strength = merged ? calculateProfileCompletion(merged) : 0;
  const coreQs = qs.filter((q) => q.core);
  const missing = qs.map((q, i) => ({ q, i })).filter(({ q }) => !q.optional && !filled(q, answers[q.key]));

  const q = mode === 'ask' ? qs[queue[pos]] : null;
  useEffect(() => {
    setError('');
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [mode, pos]);

  if (!user) {
    return <div className="max-w-[640px] mx-auto px-4 py-16 text-center"><p className="text-[#5E5A6B]">Profilni tahrirlash uchun kiring.</p></div>;
  }

  const set = (key: string, v: any) => { setAnswers((a) => ({ ...a, [key]: v })); setDirty(true); setSaved(false); };

  const save = async () => {
    if (!user.uid || !merged) return;
    setBusy(true);
    setError('');
    try {
      const completion = calculateProfileCompletion(merged);
      const updated = { ...merged, profileCompletion: completion } as UserSession;
      await saveUserProfile(user.uid, updated);
      onSave(updated);
      setDirty(false);
      setSaved(true);
      setMode('overview');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) {
      setError(e?.message || "Saqlab bo'lmadi. Qayta urinib ko'ring.");
    } finally {
      setBusy(false);
    }
  };

  const start = (indices: number[]) => {
    if (!indices.length) return;
    setQueue(indices);
    setPos(0);
    setMode('ask');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const validate = (): string => {
    if (!q || q.optional) return '';
    const v = answers[q.key];
    if (q.type === 'photo') return v ? '' : "Rasm tanlang — profil 100% bo'lishi uchun kerak";
    if (q.type === 'multi') return Array.isArray(v) && v.length ? '' : 'Kamida bittasini tanlang';
    if (q.type === 'chips') return v ? '' : 'Bittasini tanlang';
    const s = clean(v);
    if (q.minLen && s.length < q.minLen) return q.minLen >= 20 ? `Kamida ${q.minLen} ta belgi yozing (hozir ${s.length})` : 'Iltimos, javob yozing';
    return '';
  };

  const next = () => {
    const err = validate();
    if (err) { setError(err); return; }
    if (pos >= queue.length - 1) { save(); return; }
    setPos((p) => p + 1);
  };

  const onPhoto = async (file?: File | null) => {
    if (!file) return;
    try {
      const url = await compressImageFile(file, 600, 0.75);
      if (url) set('avatar', url);
    } catch {
      setError("Rasmni yuklab bo'lmadi, boshqasini tanlang");
    }
  };

  const ring = (
    <div className="relative w-[120px] h-[120px] shrink-0">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r="52" stroke="#2A2636" strokeWidth="12" fill="none" />
        <circle cx="60" cy="60" r="52" stroke={strength >= 100 ? '#C8F169' : '#8B74FF'} strokeWidth="12" fill="none" strokeLinecap="round" strokeDasharray={`${(strength / 100) * 326.7} 326.7`} style={{ transition: 'stroke-dasharray .6s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="v2-display font-extrabold text-[30px] leading-none">{strength}%</div>
        <div className="text-[11px] text-[#BDB8CC] mt-0.5">profil kuchi</div>
      </div>
    </div>
  );

  const leftPanel = (
    <aside className="lg:sticky lg:top-24 self-start rounded-[32px] bg-[#14121C] text-white p-6 sm:p-8 relative overflow-hidden">
      <div className="absolute -right-24 -bottom-24 w-64 h-64 rounded-full bg-[#5B3DF5] opacity-70" aria-hidden="true" />
      <div className="relative flex items-center gap-5">
        {ring}
        <div className="min-w-0">
          <Avatar name={answers.name || user.name} src={answers.avatar || user.avatar} size={52} round />
          <div className="mt-2 font-bold text-[18px] truncate">{answers.name || user.name}</div>
          <div className="text-[13px] text-[#BDB8CC]">{isBrand ? 'Brend' : 'Bloger'}{answers.city ? ` · ${answers.city}` : ''}</div>
        </div>
      </div>
      <div className="relative mt-6 text-[15px] font-bold">
        {strength >= 100 ? '🎉 Profilingiz to\'liq!' : `Yana ${missing.length} ta savol — va profil 100%`}
      </div>
      <p className="relative mt-1 mb-0 text-[14px] text-[#BDB8CC]">
        {isBrand ? "To'liq profil blogerlarda ko'proq ishonch uyg'otadi." : "To'liq profil bilan e'lonlarga ariza yubora olasiz va brendlar sizni tezroq tanlaydi."}
      </p>
      <ul className="relative mt-5 p-0 list-none flex flex-col gap-2">
        {coreQs.map((cq) => {
          const ok = filled(cq, answers[cq.key]);
          return (
            <li key={cq.key} className="flex items-center gap-2.5 text-[14px]">
              <span className={`w-6 h-6 shrink-0 rounded-full inline-flex items-center justify-center ${ok ? 'bg-[#C8F169] text-[#14121C]' : 'border-[1.5px] border-[#4A4558] text-[#4A4558]'}`}>{ok ? Icon.check(13) : ''}</span>
              <span className={ok ? '' : 'text-[#BDB8CC]'}>{cq.kicker.charAt(0) + cq.kicker.slice(1).toLowerCase()}</span>
            </li>
          );
        })}
      </ul>
    </aside>
  );

  /* ------------------------------ SAVOL ------------------------------ */
  if (mode === 'ask' && q) {
    const value = answers[q.key];
    const pct = Math.round(((pos + 1) / queue.length) * 100);
    return (
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-16 grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="hidden lg:block">{leftPanel}</div>
        <form onSubmit={(e) => { e.preventDefault(); next(); }} className="min-w-0 max-w-[640px]">
          <div className="flex items-center justify-between text-[14px] font-semibold text-[#5E5A6B]">
            <button type="button" onClick={() => (pos === 0 ? setMode('overview') : setPos((p) => p - 1))} className="min-h-[44px] pr-3 inline-flex items-center gap-1.5 cursor-pointer hover:text-[#14121C]">{Icon.back()} Orqaga</button>
            <span className="inline-flex items-center gap-2">{queue.length > 1 ? `${pos + 1} / ${queue.length}` : ''}<span className="px-2 py-0.5 rounded-full bg-[#14121C] text-white text-[12px]">{strength}%</span></span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-[#E6E3DC] overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-[#5B3DF5] transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>

          <div key={q.key} style={{ animation: 'v2-pop .35s ease both' }}>
            <div className="mt-9 text-[44px] leading-none" aria-hidden="true">{q.emoji}</div>
            <div className="mt-3 text-[13px] font-bold tracking-[2px] text-[#5B3DF5]">{q.kicker}{q.optional ? ' · IXTIYORIY' : ''}</div>
            <h1 className="v2-display mt-2 mb-0 font-extrabold text-[30px] sm:text-[40px] tracking-[-1.3px] leading-[1.08]">{q.title}</h1>
            <p className="mt-2 mb-0 text-[#5E5A6B]">{q.hint}</p>

            {q.type === 'text' && (
              <label className="block mt-6">
                <span className="v2-sr">{q.title}</span>
                <input ref={(el) => { inputRef.current = el; }} type="text" inputMode={q.inputMode || 'text'} value={value || ''} onChange={(e) => set(q.key, e.target.value)} placeholder={q.placeholder} className="w-full box-border min-h-[64px] px-5 rounded-[18px] border-2 border-[#E6E3DC] bg-white text-[20px] outline-none focus:border-[#5B3DF5]" />
              </label>
            )}
            {q.type === 'textarea' && (
              <label className="block mt-6">
                <span className="v2-sr">{q.title}</span>
                <textarea ref={(el) => { inputRef.current = el; }} rows={4} value={value || ''} onChange={(e) => set(q.key, e.target.value)} placeholder={q.placeholder} className="w-full box-border px-5 py-4 rounded-[18px] border-2 border-[#E6E3DC] bg-white text-[18px] outline-none focus:border-[#5B3DF5] resize-y" />
                <div className={`mt-1 text-right text-[13px] ${clean(value).length >= (q.minLen || 0) ? 'text-[#15803D] font-bold' : 'text-[#5E5A6B]'}`}>{clean(value).length} / {q.minLen || 0}+</div>
              </label>
            )}
            {(q.type === 'chips' || q.type === 'multi') && (
              <div className="mt-6 flex flex-wrap gap-2.5">
                {(q.options || []).map((o) => {
                  const on = q.type === 'multi' ? Array.isArray(value) && value.includes(o) : value === o;
                  return (
                    <button
                      key={o}
                      type="button"
                      aria-pressed={on}
                      onClick={() => {
                        if (q.type === 'chips') { set(q.key, o); return; }
                        const cur: string[] = Array.isArray(value) ? value : [];
                        set(q.key, on ? cur.filter((x) => x !== o) : [...cur, o]);
                      }}
                      className={`min-h-[52px] px-5 rounded-full font-semibold text-[16px] border-2 cursor-pointer transition-all ${on ? 'bg-[#5B3DF5] text-white border-[#5B3DF5] scale-[1.03]' : 'bg-white text-[#14121C] border-[#E6E3DC] hover:border-[#14121C]'}`}
                    >
                      {on && q.type === 'multi' ? '✓ ' : ''}{o}
                    </button>
                  );
                })}
                {q.type === 'chips' && value && !(q.options || []).includes(value) && (
                  <span className="min-h-[52px] px-5 rounded-full font-semibold text-[16px] border-2 border-[#5B3DF5] bg-[#F1EEFF] text-[#4329D9] inline-flex items-center">Hozirgi: {value}</span>
                )}
              </div>
            )}
            {q.type === 'photo' && (
              <div className="mt-6 flex flex-wrap items-center gap-5">
                {value ? (
                  <img src={value} alt="Tanlangan rasm" className={`w-32 h-32 object-cover border border-[#E6E3DC] ${isBrand ? 'rounded-3xl' : 'rounded-full'}`} />
                ) : (
                  <span className="w-32 h-32 rounded-full bg-white border-2 border-dashed border-[#D6D2C8] flex items-center justify-center text-[40px]">📷</span>
                )}
                <label className={`${btn.ghost} min-h-[52px]`}>
                  {value ? 'Boshqa rasm tanlash' : 'Rasm tanlash'}
                  <input type="file" accept="image/*" className="v2-sr" onChange={(e) => onPhoto(e.target.files?.[0])} />
                </label>
              </div>
            )}
          </div>

          {error && <div className="mt-3 text-[15px] font-semibold text-[#B91C1C]">{error}</div>}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button type="submit" disabled={busy} className={`${btn.dark} min-h-[58px] px-8 text-[17px]`}>
              {busy ? 'Saqlanmoqda...' : pos >= queue.length - 1 ? 'Saqlash' : 'Keyingisi'} {!busy && Icon.arrow(18)}
            </button>
            {q.optional && (
              <button type="button" onClick={() => (pos >= queue.length - 1 ? save() : setPos((p) => p + 1))} className="min-h-[44px] px-3 font-semibold text-[#5E5A6B] hover:text-[#14121C] cursor-pointer">O'tkazib yuborish</button>
            )}
          </div>
        </form>
      </div>
    );
  }

  /* ------------------------------ UMUMIY KO'RINISH ------------------------------ */
  return (
    <div className="max-w-[1180px] mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-28 grid gap-6 lg:grid-cols-[360px_1fr]">
      {leftPanel}
      <main className="min-w-0">
        <button type="button" onClick={onBack} className="min-h-[44px] pr-3 inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#5E5A6B] cursor-pointer hover:text-[#14121C]">{Icon.back()} Profilga qaytish</button>
        <h1 className="v2-display mt-1 mb-0 font-extrabold text-[32px] sm:text-[44px] tracking-[-1.5px] leading-[1.05]">Profilni yangilash</h1>
        <p className="mt-2 mb-0 text-[#5E5A6B]">Har bir savolni bosing va javobini o'zgartiring. Yoki hammasidan savol-javob tarzida o'ting.</p>

        {saved && (
          <div className="mt-5 rounded-2xl bg-[#DCFCE7] text-[#14532D] px-5 py-4 font-bold" role="status">
            {strength >= 100 ? "🎉 Saqlandi! Profilingiz 100% — endi brendlar sizni ko'radi." : '✓ Saqlandi.'}
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2.5">
          {missing.length > 0 ? (
            <button type="button" onClick={() => start(missing.map((m) => m.i))} className={`${btn.violet} min-h-[54px] px-6 text-[16px]`}>
              ✨ Yetishmayotgan {missing.length} ta savolga javob berish
            </button>
          ) : null}
          <button type="button" onClick={() => start(qs.map((_, i) => i))} className={`${missing.length ? btn.ghost : btn.violet} min-h-[54px] px-6 text-[16px]`}>
            Hammasini savol-javob bilan o'tish
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {qs.map((qq, i) => {
            const v = answers[qq.key];
            const ok = filled(qq, v);
            const pv = preview(qq, v);
            return (
              <button
                key={qq.key}
                type="button"
                onClick={() => start([i])}
                className={`text-left rounded-3xl p-5 border-2 cursor-pointer transition-colors ${!ok && !qq.optional ? 'border-[#FDE68A] bg-[#FFFBEB] hover:border-[#D97706]' : 'border-[#E6E3DC] bg-white hover:border-[#14121C]'}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-[26px] leading-none" aria-hidden="true">{qq.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-bold tracking-[1.5px] text-[#5B3DF5]">{qq.kicker}</div>
                    <div className="mt-0.5 font-bold text-[16px] leading-snug">{qq.title}</div>
                    {qq.type === 'photo' ? (
                      v ? <img src={v} alt="" className={`mt-2.5 w-14 h-14 object-cover ${isBrand ? 'rounded-xl' : 'rounded-full'}`} /> : null
                    ) : pv ? (
                      <div className="mt-1.5 text-[14px] text-[#3E3A4A] line-clamp-2 break-words">{pv}</div>
                    ) : null}
                    <div className={`mt-2 text-[13px] font-bold ${ok ? 'text-[#15803D]' : qq.optional ? 'text-[#5E5A6B]' : 'text-[#B45309]'}`}>
                      {ok ? "✓ To'ldirilgan · o'zgartirish" : qq.optional ? 'Ixtiyoriy · qo\'shish' : 'To\'ldirilmagan · javob berish'}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 text-[14px] text-[#5E5A6B]">
          Portfolio, TikTok, YouTube va boshqa maydonlar uchun{' '}
          <button type="button" onClick={onOpenFullEditor} className="font-bold text-[#4329D9] underline cursor-pointer">batafsil tahrirlash</button>.
        </div>
        {error && <div className="mt-3 text-[15px] font-semibold text-[#B91C1C]">{error}</div>}
      </main>

      {dirty && (
        <div className="fixed left-0 right-0 bottom-0 z-50 bg-white/95 backdrop-blur border-t border-[#E6E3DC] px-4 py-3" style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}>
          <div className="max-w-[1180px] mx-auto flex items-center justify-between gap-3">
            <div className="text-[14px] font-semibold">O'zgarishlar saqlanmagan</div>
            <button type="button" disabled={busy} onClick={save} className={`${btn.dark} min-h-[48px] px-6`}>{busy ? 'Saqlanmoqda...' : 'Saqlash'}</button>
          </div>
        </div>
      )}
    </div>
  );
};
