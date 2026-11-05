import React, { useEffect, useMemo, useRef, useState } from 'react';
import { UserSession } from '../types';
import {
  registerUser,
  loginUser,
  saveUserProfile,
  compressImageFile,
  getUzbekAuthErrorMessage,
  requestPasswordReset,
} from '../firebase';
import { Logo, Icon, btn, go } from './ui';

type QType = 'text' | 'textarea' | 'chips' | 'multi' | 'photo' | 'account';
interface Q {
  key: string;
  kicker: string;
  title: string;
  hint: string;
  type: QType;
  placeholder?: string;
  options?: string[];
  optional?: boolean;
  minLen?: number;
  inputMode?: 'text' | 'numeric' | 'tel';
}

const CITIES = ['Toshkent', 'Samarqand', 'Jizzax', 'Buxoro', 'Andijon', "Farg'ona", 'Namangan', 'Qarshi', 'Nukus', 'Boshqa'];

const BLOGER_QS: Q[] = [
  { key: 'name', kicker: 'TANISHAYLIK', title: 'Ismingiz nima?', hint: "Brendlar sizni shu ism bilan ko'radi.", type: 'text', placeholder: 'Masalan, Madina Karimova', minLen: 2 },
  { key: 'city', kicker: 'JOYLASHUV', title: 'Qaysi shahardasiz?', hint: 'Bittasini tanlang.', type: 'chips', options: CITIES },
  { key: 'categories', kicker: "YO'NALISH", title: 'Qaysi mavzuda kontent qilasiz?', hint: 'Bir nechtasini tanlashingiz mumkin.', type: 'multi', options: ["Go'zallik", 'Lifestyle', 'Food', 'Moda', 'Sport', 'Texnika', "Ta'lim", 'Sayohat', 'Oila', 'Yumor'] },
  { key: 'instagram', kicker: 'AUDITORIYA', title: 'Instagram sahifangiz?', hint: '@username yoki havola.', type: 'text', placeholder: '@username', minLen: 2 },
  { key: 'followers', kicker: 'AUDITORIYA', title: 'Nechta obunachingiz bor?', hint: "Taxminiy bo'lsa ham bo'ladi.", type: 'chips', options: ['1–5 ming', '5–10 ming', '10–50 ming', '50–100 ming', '100 ming+'] },
  { key: 'price', kicker: 'NARX', title: '1 ta Reels narxingiz (so\'m)?', hint: "Keyin o'zgartirish mumkin.", type: 'text', placeholder: 'Masalan, 500 000', inputMode: 'numeric', minLen: 3 },
  { key: 'bio', kicker: "O'ZINGIZ HAQINGIZDA", title: "O'zingizni 1–2 gapda tanishtiring", hint: 'Kamida 20 ta belgi. Bu matn profilingizda turadi.', type: 'textarea', placeholder: 'Kim uchun, qanday kontent qilasiz?', minLen: 20 },
  { key: 'avatar', kicker: 'RASM', title: 'Profil rasmingiz', hint: "Yuzingiz ko'rinadigan aniq rasm. Brendlar avval shuni ko'radi.", type: 'photo', optional: true },
  { key: 'account', kicker: 'OXIRGI QADAM', title: 'Telefon va parol', hint: 'Shu bilan saytga kirasiz.', type: 'account' },
];

const BRAND_QS: Q[] = [
  { key: 'name', kicker: 'TANISHAYLIK', title: 'Brendingiz nomi?', hint: "Blogerlar e'londa shu nomni ko'radi.", type: 'text', placeholder: 'Masalan, Lumiere Beauty', minLen: 2 },
  { key: 'field', kicker: 'SOHA', title: 'Qaysi sohada ishlaysiz?', hint: 'Bittasini tanlang.', type: 'chips', options: ['Kiyim', 'Kosmetika', 'Kafe va restoran', "Onlayn do'kon", 'Texnika', "Ta'lim", 'Xizmatlar', 'Boshqa'] },
  { key: 'city', kicker: 'JOYLASHUV', title: 'Qaysi shahardasiz?', hint: 'Bittasini tanlang.', type: 'chips', options: [...CITIES.slice(0, 7), "Butun O'zbekiston"] },
  { key: 'instagram', kicker: 'SAHIFA', title: 'Instagram yoki sayt havolasi', hint: 'Admin brendingizni tekshirishi uchun kerak.', type: 'text', placeholder: '@brend yoki https://', minLen: 2 },
  { key: 'bio', kicker: 'BREND HAQIDA', title: 'Brendingizni qisqacha tanishtiring', hint: 'Nima sotasiz, kimlar uchun? Kamida 20 belgi.', type: 'textarea', placeholder: "Masalan: Toshkentdagi kosmetika do'koni, tabiiy mahsulotlar", minLen: 20 },
  { key: 'avatar', kicker: 'LOGO', title: 'Brend logotipi', hint: "Blogerlar e'lonlaringizda shu logoni ko'radi.", type: 'photo', optional: true },
  { key: 'account', kicker: 'OXIRGI QADAM', title: 'Telefon va parol', hint: 'Shu bilan saytga kirasiz.', type: 'account' },
];

interface Props {
  mode: 'signup' | 'login';
  onDone: (user: UserSession) => void;
}

export const V2Register: React.FC<Props> = ({ mode, onDone }) => {
  const [role, setRole] = useState<'bloger' | 'brend' | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [contact, setContact] = useState('+998 ');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [info, setInfo] = useState('');
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const qs = role === 'brend' ? BRAND_QS : BLOGER_QS;
  const q = role ? qs[step] : null;

  useEffect(() => {
    setError('');
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [step, role]);

  const value = q ? answers[q.key] : undefined;

  const validate = (): string => {
    if (!q) return '';
    if (q.type === 'account') {
      const digits = contact.replace(/[^\d]/g, '');
      if (!contact.includes('@') && digits.length < 12) return "Telefon raqamni to'liq yozing: +998 90 123 45 67";
      if (password.length < 6) return "Parol kamida 6 ta belgidan iborat bo'lsin";
      return '';
    }
    if (q.optional) return '';
    if (q.type === 'multi') return Array.isArray(value) && value.length > 0 ? '' : 'Kamida bittasini tanlang';
    if (q.type === 'chips') return value ? '' : 'Bittasini tanlang';
    const s = String(value || '').trim();
    if (q.minLen && s.length < q.minLen) return q.minLen >= 20 ? `Kamida ${q.minLen} ta belgi yozing (hozir ${s.length})` : 'Iltimos, javob yozing';
    return '';
  };

  const finish = async () => {
    if (!role) return;
    setBusy(true);
    setError('');
    try {
      const name = String(answers.name || '').trim();
      const user = await registerUser(contact.trim(), password, name, role);
      const uid = user.uid || '';
      const insta = String(answers.instagram || '').trim();
      const extra: Partial<UserSession> =
        role === 'bloger'
          ? {
              city: answers.city || '',
              categories: Array.isArray(answers.categories) ? answers.categories : [],
              bio: String(answers.bio || '').trim(),
              priceRange: { min: String(answers.price || '').replace(/[^\d]/g, ''), max: '' },
              socialLinks: { instagram: insta, instagramFollowers: answers.followers || '', instagramEnabled: true },
              instagramHandle: insta,
            }
          : {
              city: answers.city || '',
              categories: answers.field ? [answers.field] : [],
              bio: String(answers.bio || '').trim(),
              socialLinks: { instagram: insta, instagramEnabled: true },
            };
      if (answers.avatar) extra.avatar = answers.avatar;
      const full: UserSession = { ...user, ...extra, name, role };
      if (uid) {
        try {
          await saveUserProfile(uid, { ...extra, name, role });
        } catch (e) {
          console.warn('Profil javoblarini saqlashda xato:', e);
        }
      }
      setDone(true);
      onDone(full);
    } catch (e: any) {
      setError(getUzbekAuthErrorMessage(e?.code || '') || e?.message || "Ro'yxatdan o'tib bo'lmadi");
    } finally {
      setBusy(false);
    }
  };

  const next = () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    if (step >= qs.length - 1) {
      finish();
      return;
    }
    setStep((s) => s + 1);
  };

  const back = () => {
    if (step === 0) {
      setRole(null);
      return;
    }
    setStep((s) => s - 1);
  };

  const pct = role ? Math.round(((step + 1) / qs.length) * 100) : 0;

  const onPhoto = async (file?: File | null) => {
    if (!file) return;
    try {
      const url = await compressImageFile(file, 600, 0.75);
      if (url) setAnswers((a) => ({ ...a, avatar: url }));
    } catch {
      setError("Rasmni yuklab bo'lmadi, boshqasini tanlang");
    }
  };

  /* ------------------------------ LOGIN ------------------------------ */
  const [loginContact, setLoginContact] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const doLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    setInfo('');
    if (!loginContact.trim() || !loginPass) {
      setError('Telefon (yoki email) va parolni yozing');
      return;
    }
    setBusy(true);
    try {
      const user = await loginUser(loginContact.trim(), loginPass);
      onDone(user);
      go(user.role === 'brend' ? 'kabinet' : '');
    } catch (err: any) {
      setError(getUzbekAuthErrorMessage(err?.code || '') || "Kirib bo'lmadi. Ma'lumotlarni tekshiring.");
    } finally {
      setBusy(false);
    }
  };
  const doReset = async () => {
    setError('');
    setInfo('');
    try {
      await requestPasswordReset(loginContact);
      setInfo("Parolni tiklash havolasi emailingizga yuborildi.");
    } catch (err: any) {
      setError(err?.message || "Bo'lmadi");
    }
  };

  const leftPanel = (
    <aside className="flex-[1_1_380px] min-w-0 bg-[#14121C] text-white px-6 sm:px-11 py-9 sm:py-11 relative overflow-hidden min-h-[260px]">
      <div className="absolute -right-28 -bottom-28 w-[340px] h-[340px] rounded-full bg-[#5B3DF5] opacity-80" aria-hidden="true" />
      <a href="#" className="relative inline-flex"><Logo size={36} light /></a>
      <h1 className="v2-display relative mt-10 sm:mt-14 mb-0 font-extrabold text-[34px] sm:text-[46px] leading-[1.02] tracking-[-1.6px]">
        {mode === 'login' ? (<>Qaytganingizdan<br /><span className="text-[#C8F169]">xursandmiz.</span></>) : (<>2 daqiqa.<br />Bir nechta savol.<br /><span className="text-[#C8F169]">Profilingiz tayyor.</span></>)}
      </h1>
      <p className="relative mt-5 mb-0 max-w-[340px] text-[#BDB8CC]">
        {mode === 'login' ? "Telefon raqamingiz va parolingiz bilan kiring." : 'Javoblaringiz asosida profil avtomatik to\'ladi. Keyin admin uni tekshirib tasdiqlaydi.'}
      </p>
      {mode !== 'login' && (
        <div className="relative mt-9 hidden sm:flex flex-col gap-3 text-[15px]">
          {['Savollarga javob bering', 'Admin tekshiradi', "E'lonlarga ariza yuboring"].map((t, i) => (
            <div key={t} className={`flex items-center gap-3 ${i === 0 || done ? '' : 'text-[#BDB8CC]'}`}>
              <span className={`w-[30px] h-[30px] rounded-full flex items-center justify-center font-extrabold text-[14px] ${i === 0 || (done && i === 1) ? 'bg-[#C8F169] text-[#14121C]' : 'border-[1.5px] border-[#4A4558]'}`}>{i + 1}</span>
              {t}
            </div>
          ))}
        </div>
      )}
    </aside>
  );

  if (mode === 'login') {
    return (
      <div className="min-h-[calc(100vh-70px)] flex flex-wrap">
        {leftPanel}
        <main className="flex-[999_1_520px] min-w-0 px-4 sm:px-6 py-10 flex items-center justify-center">
          <form onSubmit={doLogin} className="w-full max-w-[460px]">
            <h2 className="v2-display m-0 font-extrabold text-[38px] tracking-[-1.3px]">Kirish</h2>
            <label className="block mt-7 font-semibold text-[14px]">Telefon yoki email
              <input value={loginContact} onChange={(e) => setLoginContact(e.target.value)} type="text" autoComplete="username" placeholder="+998 90 123 45 67" className="mt-2 w-full box-border min-h-[56px] px-4 rounded-2xl border-2 border-[#E6E3DC] bg-white text-[17px] outline-none focus:border-[#5B3DF5]" />
            </label>
            <label className="block mt-4 font-semibold text-[14px]">Parol
              <input value={loginPass} onChange={(e) => setLoginPass(e.target.value)} type="password" autoComplete="current-password" className="mt-2 w-full box-border min-h-[56px] px-4 rounded-2xl border-2 border-[#E6E3DC] bg-white text-[17px] outline-none focus:border-[#5B3DF5]" />
            </label>
            {error && <div className="mt-3 text-[14px] text-[#B91C1C]">{error}</div>}
            {info && <div className="mt-3 text-[14px] text-[#15803D]">{info}</div>}
            <button type="submit" disabled={busy} className={`${btn.dark} mt-6 w-full min-h-[56px] text-[17px]`}>{busy ? 'Kirilmoqda...' : 'Kirish'}</button>
            <div className="mt-4 flex flex-wrap justify-between gap-2 text-[15px]">
              <button type="button" onClick={doReset} className="min-h-[44px] font-semibold text-[#5E5A6B] hover:text-[#14121C] cursor-pointer">Parolni unutdingizmi?</button>
              <a href="#royxat" className="min-h-[44px] inline-flex items-center font-bold text-[#4329D9]">Ro'yxatdan o'tish</a>
            </div>
          </form>
        </main>
      </div>
    );
  }

  /* ------------------------------ SIGNUP ------------------------------ */
  return (
    <div className="min-h-[calc(100vh-70px)] flex flex-wrap">
      {leftPanel}
      <main className="flex-[999_1_560px] min-w-0 px-4 sm:px-6 py-10 flex items-center justify-center">
        <div className="w-full max-w-[620px]">
          {done ? (
            <div className="rounded-[32px] bg-white border border-[#E6E3DC] p-8 sm:p-11 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-[#FEF3C7] text-[#A16207] flex items-center justify-center">{Icon.clock(38)}</div>
              <h2 className="v2-display mt-5 mb-0 font-extrabold text-[32px] sm:text-[38px] tracking-[-1.2px] leading-[1.1]">Profilingiz tekshiruvda</h2>
              <p className="mt-3 mx-auto mb-0 max-w-[420px] text-[#5E5A6B]">
                Admin javoblaringizni ko'rib chiqadi. Tasdiqlangach sizga bildirishnoma keladi va {role === 'brend' ? "e'lon joylay olasiz." : "e'lonlarga ariza yubora olasiz."}
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5 justify-center">
                <a href="#" className={`${btn.dark} min-h-[52px]`}>E'lonlarni ko'rish</a>
              </div>
            </div>
          ) : !role ? (
            <div>
              <div className="text-[13px] font-bold tracking-[2px] text-[#5B3DF5]">BOSHLAYMIZ</div>
              <h2 className="v2-display mt-2.5 mb-0 font-extrabold text-[38px] sm:text-[44px] tracking-[-1.5px] leading-[1.05]">Siz kimsiz?</h2>
              <div className="mt-7 grid gap-3.5 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
                <button type="button" onClick={() => { setRole('bloger'); setStep(0); }} className="text-left rounded-3xl border-2 border-[#E6E3DC] bg-white p-6 cursor-pointer hover:border-[#5B3DF5] transition-colors">
                  <span className="w-[52px] h-[52px] rounded-2xl bg-[#EEEBFF] text-[#4329D9] flex items-center justify-center">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="6" width="13" height="12" rx="2" /><path d="M16 10l5-3v10l-5-3" /></svg>
                  </span>
                  <span className="v2-display block mt-4 font-extrabold text-[24px]">Bloger</span>
                  <span className="block mt-1 text-[#5E5A6B] text-[15px]">Brendlarning e'lonlariga ariza yuboraman</span>
                </button>
                <button type="button" onClick={() => { setRole('brend'); setStep(0); }} className="text-left rounded-3xl border-2 border-[#E6E3DC] bg-white p-6 cursor-pointer hover:border-[#5B3DF5] transition-colors">
                  <span className="w-[52px] h-[52px] rounded-2xl bg-[#ECFCCB] text-[#3F6212] flex items-center justify-center">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 21V8l8-5 8 5v13" /><path d="M9 21v-6h6v6" /></svg>
                  </span>
                  <span className="v2-display block mt-4 font-extrabold text-[24px]">Brend</span>
                  <span className="block mt-1 text-[#5E5A6B] text-[15px]">E'lon joylab, bloger topaman</span>
                </button>
              </div>
              <p className="mt-6 mb-0 text-[15px] text-[#5E5A6B]">Hisobingiz bormi? <a href="#kirish" className="font-bold text-[#4329D9]">Kirish</a></p>
            </div>
          ) : q ? (
            <form onSubmit={(e) => { e.preventDefault(); next(); }}>
              <div className="flex items-center justify-between text-[14px] font-semibold text-[#5E5A6B]">
                <button type="button" onClick={back} className="min-h-[44px] pr-3 inline-flex items-center gap-1.5 cursor-pointer hover:text-[#14121C]">{Icon.back()} Orqaga</button>
                <span>{step + 1} / {qs.length}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-[#E6E3DC] overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full rounded-full bg-[#5B3DF5] transition-all duration-300" style={{ width: `${pct}%` }} />
              </div>

              <div className="mt-9 text-[13px] font-bold tracking-[2px] text-[#5B3DF5]">{q.kicker}</div>
              <h2 className="v2-display mt-2.5 mb-0 font-extrabold text-[32px] sm:text-[40px] tracking-[-1.3px] leading-[1.08]">{q.title}</h2>
              <p className="mt-2 mb-0 text-[#5E5A6B]">{q.hint}</p>

              {q.type === 'text' && (
                <label className="block mt-6">
                  <span className="v2-sr">{q.title}</span>
                  <input
                    ref={(el) => { inputRef.current = el; }}
                    type="text"
                    inputMode={q.inputMode || 'text'}
                    value={value || ''}
                    onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))}
                    placeholder={q.placeholder}
                    className="w-full box-border min-h-[64px] px-5 rounded-[18px] border-2 border-[#E6E3DC] bg-white text-[20px] outline-none focus:border-[#5B3DF5]"
                  />
                </label>
              )}
              {q.type === 'textarea' && (
                <label className="block mt-6">
                  <span className="v2-sr">{q.title}</span>
                  <textarea
                    ref={(el) => { inputRef.current = el; }}
                    rows={4}
                    value={value || ''}
                    onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))}
                    placeholder={q.placeholder}
                    className="w-full box-border px-5 py-4 rounded-[18px] border-2 border-[#E6E3DC] bg-white text-[18px] outline-none focus:border-[#5B3DF5] resize-y"
                  />
                  <div className="mt-1 text-right text-[13px] text-[#5E5A6B]">{String(value || '').trim().length} / {q.minLen || 0}+</div>
                </label>
              )}
              {(q.type === 'chips' || q.type === 'multi') && (
                <div className="mt-6 flex flex-wrap gap-2.5">
                  {(q.options || []).map((o) => {
                    const on = q.type === 'multi' ? (Array.isArray(value) && value.includes(o)) : value === o;
                    return (
                      <button
                        key={o}
                        type="button"
                        aria-pressed={on}
                        onClick={() =>
                          setAnswers((a) => {
                            if (q.type === 'chips') return { ...a, [q.key]: o };
                            const cur: string[] = Array.isArray(a[q.key]) ? a[q.key] : [];
                            return { ...a, [q.key]: on ? cur.filter((x) => x !== o) : [...cur, o] };
                          })
                        }
                        className={`min-h-[52px] px-5 rounded-full font-semibold text-[16px] border-2 cursor-pointer transition-colors ${on ? 'bg-[#5B3DF5] text-white border-[#5B3DF5]' : 'bg-white text-[#14121C] border-[#E6E3DC] hover:border-[#14121C]'}`}
                      >
                        {o}
                      </button>
                    );
                  })}
                </div>
              )}
              {q.type === 'photo' && (
                <div className="mt-6 flex flex-wrap items-center gap-5">
                  {value ? (
                    <img src={value} alt="Tanlangan rasm" className="w-28 h-28 rounded-3xl object-cover border border-[#E6E3DC]" />
                  ) : (
                    <span className="w-28 h-28 rounded-3xl bg-white border-2 border-dashed border-[#D6D2C8] flex items-center justify-center text-[#5E5A6B]">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="15" rx="3" /><circle cx="12" cy="12.5" r="3.5" /><path d="M8 5l1.5-2h5L16 5" /></svg>
                    </span>
                  )}
                  <label className={`${btn.ghost} min-h-[52px]`}>
                    {value ? 'Boshqa rasm tanlash' : 'Rasm tanlash'}
                    <input type="file" accept="image/*" className="v2-sr" onChange={(e) => onPhoto(e.target.files?.[0])} />
                  </label>
                </div>
              )}
              {q.type === 'account' && (
                <div className="mt-6 flex flex-col gap-3.5">
                  <label className="block font-semibold text-[14px]">Telefon raqam
                    <input
                      ref={(el) => { inputRef.current = el; }}
                      type="tel"
                      autoComplete="tel"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      className="mt-2 w-full box-border min-h-[60px] px-5 rounded-[18px] border-2 border-[#E6E3DC] bg-white text-[20px] outline-none focus:border-[#5B3DF5]"
                    />
                  </label>
                  <label className="block font-semibold text-[14px]">Parol (kamida 6 belgi)
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-2 w-full box-border min-h-[60px] px-5 rounded-[18px] border-2 border-[#E6E3DC] bg-white text-[20px] outline-none focus:border-[#5B3DF5]"
                    />
                  </label>
                </div>
              )}

              {error && <div className="mt-3 text-[15px] font-semibold text-[#B91C1C]">{error}</div>}

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button type="submit" disabled={busy} className={`${btn.dark} min-h-[58px] px-8 text-[17px]`}>
                  {busy ? 'Saqlanmoqda...' : step === qs.length - 1 ? "Ro'yxatdan o'tish" : 'Keyingisi'} {!busy && Icon.arrow(18)}
                </button>
                {q.optional && !value && (
                  <button type="button" onClick={() => setStep((s) => s + 1)} className="min-h-[44px] px-3 font-semibold text-[#5E5A6B] hover:text-[#14121C] cursor-pointer">Keyinroq</button>
                )}
                {(q.type === 'text' || q.type === 'account') && <span className="hidden sm:inline text-[14px] text-[#5E5A6B]">yoki <strong>Enter</strong> bosing</span>}
              </div>
              {step === qs.length - 1 && (
                <p className="mt-4 text-[13px] text-[#5E5A6B]">Ro'yxatdan o'tib, <a href="/privacy.html" className="underline">maxfiylik siyosati</a>ga rozilik bildirasiz.</p>
              )}
            </form>
          ) : null}
        </div>
      </main>
    </div>
  );
};
