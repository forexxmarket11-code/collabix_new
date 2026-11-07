import React, { useState } from 'react';
import { UserSession, BriefData } from '../types';
import { formatUzbekDate, getDaysRemainingInTrial, deleteMyAccount, calculateProfileCompletion } from '../firebase';
import { isUserPro } from '../utils/subscription';
import { Avatar, Pill, Icon, btn, reviewState, appStatus } from './ui';

interface Props {
  user: UserSession | null;
  briefs: BriefData[];
  onEdit: () => void;
  onLogout: () => void;
  onOpenPro: () => void;
  onOpenCancelModal: () => void;
  onOpenRegister: () => void;
}

export const V2Profile: React.FC<Props> = ({ user, briefs, onEdit, onLogout, onOpenPro, onOpenCancelModal, onOpenRegister }) => {
  const [delOpen, setDelOpen] = useState(false);
  const [delPass, setDelPass] = useState('');
  const [delText, setDelText] = useState('');
  const [delBusy, setDelBusy] = useState(false);
  const [delErr, setDelErr] = useState('');

  if (!user) {
    return (
      <main className="max-w-[520px] mx-auto px-4 py-16 text-center">
        <h1 className="v2-display m-0 font-extrabold text-[32px]">Profilga kirish</h1>
        <p className="mt-2 text-[#5E5A6B]">Profilingizni ko'rish uchun kiring yoki ro'yxatdan o'ting.</p>
        <button type="button" onClick={onOpenRegister} className={`${btn.dark} mt-4 min-h-[52px]`}>Ro'yxatdan o'tish / Kirish</button>
      </main>
    );
  }

  const isBrand = user.role === 'brend';
  const uid = user.uid || '';
  const st = reviewState(user);
  const strength = typeof user.profileCompletion === 'number' ? user.profileCompletion : calculateProfileCompletion(user);
  const pro = isUserPro(user);
  const cancelled = user.subscriptionStatus === 'cancelled';
  const endDate = user.trialEndDate ? formatUzbekDate(user.trialEndDate) : '';
  const daysLeft = user.trialEndDate ? getDaysRemainingInTrial(user.trialEndDate) : 0;
  const insta = (user.socialLinks as any)?.instagram || user.instagramHandle || '';

  const stats: [string, number, string][] = isBrand
    ? (() => {
        const mine = briefs.filter((b) => b.brandId === uid || b.ownerId === uid);
        const apps = mine.flatMap((b) => b.applications || []);
        return [
          ["E'lonlar", mine.length, 'bg-white border border-[#E6E3DC]'],
          ['Kelgan arizalar', apps.length, 'bg-[#C8F169]'],
          ['Ishdagi blogerlar', apps.filter((a) => appStatus(a) === 'ok').length, 'bg-[#14121C] text-white'],
        ];
      })()
    : (() => {
        const mine = briefs.map((b) => [...(b.applications || [])].reverse().find((a) => a.creatorId === uid)).filter(Boolean) as any[];
        return [
          ['Arizalar', mine.length, 'bg-white border border-[#E6E3DC]'],
          ['Qabul qilingan', mine.filter((a) => appStatus(a) === 'ok').length, 'bg-[#C8F169]'],
          ["Profil ko'rishlari", typeof user.views === 'number' ? user.views : 0, 'bg-[#14121C] text-white'],
        ];
      })();

  const doDelete = async () => {
    if (delText.trim().toUpperCase() !== 'OCHIRISH') { setDelErr('Tasdiqlash uchun OCHIRISH deb yozing.'); return; }
    if (!delPass) { setDelErr('Parolingizni kiriting.'); return; }
    setDelBusy(true); setDelErr('');
    try {
      await deleteMyAccount(delPass);
      setDelOpen(false);
      onLogout();
    } catch (e: any) {
      setDelErr(e?.message || "Hisobni o'chirib bo'lmadi.");
    } finally {
      setDelBusy(false);
    }
  };

  return (
    <main className="max-w-[1100px] mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-16">
      {/* SARLAVHA */}
      <section className="relative rounded-[32px] bg-[#14121C] text-white p-6 sm:p-9 overflow-hidden">
        <div className="absolute -right-20 -top-24 w-72 h-72 rounded-full bg-[#5B3DF5] opacity-80" aria-hidden="true" />
        <div className="absolute right-40 -bottom-24 w-44 h-44 rounded-full bg-[#C8F169] opacity-90" aria-hidden="true" />
        <div className="relative flex flex-wrap items-center gap-5 sm:gap-7">
          <div className="relative">
            <Avatar name={user.name} src={user.avatar} size={104} round={!isBrand} />
            <button type="button" onClick={onEdit} aria-label="Rasmni yangilash" className="absolute -bottom-1 -right-1 w-11 h-11 rounded-full bg-white text-[#14121C] flex items-center justify-center shadow-lg cursor-pointer text-[18px]">📷</button>
          </div>
          <div className="flex-[999_1_260px] min-w-0">
            <div className="flex flex-wrap gap-2">
              <Pill tone="lime">{isBrand ? 'Brend' : 'Bloger'}</Pill>
              {st === 'approved' ? <Pill tone="green">{Icon.check(13)} Tasdiqlangan</Pill> : st === 'pending' ? <Pill tone="amber">Tekshiruvda</Pill> : <Pill tone="red">Tasdiqlanmagan</Pill>}
              {!isBrand && pro && <Pill tone="violet">PRO</Pill>}
            </div>
            <h1 className="v2-display mt-3 mb-0 font-extrabold text-[32px] sm:text-[44px] tracking-[-1.5px] leading-[1.05] break-words">{user.name}</h1>
            <div className="mt-1.5 text-[15px] text-[#BDB8CC]">
              {[insta ? (insta.startsWith('@') || insta.startsWith('http') ? insta : `@${insta}`) : '', user.city, (user.categories || []).slice(0, 2).join(', ')].filter(Boolean).join(' · ')}
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button type="button" onClick={onEdit} className={`${btn.lime} min-h-[50px]`}>✏️ Profilni yangilash</button>
            <a href={isBrand ? '#kabinet' : '#arizalarim'} className="min-h-[50px] px-5 rounded-xl border border-white/25 text-white font-bold inline-flex items-center gap-2 hover:bg-white/10">{isBrand ? 'Kabinet' : 'Arizalarim'} {Icon.arrow(14)}</a>
          </div>
        </div>

        {/* Profil kuchi */}
        <div className="relative mt-7 rounded-2xl bg-white/8 border border-white/10 p-4 sm:p-5 flex flex-wrap items-center gap-4" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="flex-[999_1_240px]">
            <div className="flex justify-between text-[14px] font-bold"><span>Profil kuchi</span><span className={strength >= 100 ? 'text-[#C8F169]' : ''}>{strength}%</span></div>
            <div className="mt-2 h-2.5 rounded-full bg-[#2A2636] overflow-hidden"><div className={`h-full rounded-full ${strength >= 100 ? 'bg-[#C8F169]' : 'bg-[#8B74FF]'}`} style={{ width: `${strength}%` }} /></div>
            <div className="mt-2 text-[13px] text-[#BDB8CC]">{strength >= 100 ? "🎉 Profilingiz to'liq." : isBrand ? "To'liq profil blogerlarda ko'proq ishonch uyg'otadi." : "100% bo'lsa e'lonlarga ariza yubora olasiz."}</div>
          </div>
          {strength < 100 && <button type="button" onClick={onEdit} className={`${btn.lime} min-h-[44px]`}>To'ldirish</button>}
        </div>
      </section>

      {/* RAQAMLAR */}
      <section className="mt-5 grid gap-3 grid-cols-3">
        {stats.map(([l, n, cls]) => (
          <div key={l} className={`rounded-[22px] p-4 sm:p-5 ${cls}`}>
            <div className="v2-display font-extrabold text-[28px] sm:text-[38px] leading-none">{n}</div>
            <div className={`mt-1.5 text-[12px] sm:text-[14px] font-semibold ${cls.includes('text-white') ? 'text-[#BDB8CC]' : 'text-[#3E3A4A]'}`}>{l}</div>
          </div>
        ))}
      </section>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {/* OBUNA */}
        {isBrand ? (
          <section className="rounded-[28px] bg-[#5B3DF5] text-white p-6 sm:p-7">
            <div className="text-[28px]" aria-hidden="true">🎁</div>
            <h2 className="v2-display mt-2 mb-0 font-extrabold text-[24px]">Brendlar uchun bepul</h2>
            <p className="mt-1.5 mb-0 text-[#E4DEFF]">E'lon joylash, arizalarni ko'rish va blogerlar bilan ishlash — obunasiz.</p>
            <a href="#yangi-elon" className={`${btn.lime} mt-5 min-h-[48px]`}>{Icon.plus()} Yangi e'lon</a>
          </section>
        ) : (
          <section className={`rounded-[28px] p-6 sm:p-7 ${pro ? 'bg-[#14121C] text-white' : 'bg-white border border-[#E6E3DC]'}`}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="v2-display m-0 font-extrabold text-[24px]">{pro ? 'Pro faol' : cancelled ? 'Pro bekor qilingan' : 'Pro rejim'}</h2>
              <Pill tone={pro ? 'lime' : 'gray'}>{pro ? 'Faol' : 'Yoqilmagan'}</Pill>
            </div>
            {pro ? (
              <>
                <p className="mt-2 mb-0 text-[#BDB8CC]">{endDate ? `${endDate} gacha` : ''}{daysLeft > 0 ? ` · ${daysLeft} kun qoldi` : ''}</p>
                <div className="mt-4 h-2.5 rounded-full bg-[#2A2636] overflow-hidden"><div className="h-full rounded-full bg-[#C8F169]" style={{ width: `${Math.max(4, Math.min(100, (daysLeft / 30) * 100))}%` }} /></div>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  <a href="#referral" className={`${btn.lime} min-h-[46px]`}>Do'st taklif qilib 29 000 ishlash</a>
                  {!cancelled && <button type="button" onClick={onOpenCancelModal} className="min-h-[46px] px-4 rounded-xl border border-white/25 text-white font-semibold cursor-pointer hover:bg-white/10">Obunani bekor qilish</button>}
                </div>
              </>
            ) : (
              <>
                <div className="mt-2 v2-display font-extrabold text-[34px]">59 000 <span className="text-[16px] font-bold text-[#5E5A6B]">so'm / oy</span></div>
                <ul className="mt-3 mb-0 p-0 list-none flex flex-col gap-2 text-[15px]">
                  {["Barcha ochiq e'lonlarga ariza", 'Ariza holatini kuzatish', "Do'st taklif qilib 29 000 so'm ishlash"].map((t) => (
                    <li key={t} className="flex gap-2 items-center"><span className="text-[#15803D]">{Icon.check(16)}</span>{t}</li>
                  ))}
                </ul>
                <button type="button" onClick={onOpenPro} className={`${btn.violet} mt-5 min-h-[48px]`}>{cancelled ? 'Pro\'ni qayta yoqish' : "Pro'ni yoqish"}</button>
              </>
            )}
          </section>
        )}

        {/* SOZLAMALAR */}
        <section className="rounded-[28px] bg-white border border-[#E6E3DC] p-6 sm:p-7">
          <h2 className="v2-display m-0 font-extrabold text-[24px]">Hisob</h2>
          <div className="mt-4 flex flex-col">
            {[
              ['✏️', 'Profilni yangilash', onEdit],
              ['💬', 'Xabarlar', () => { window.location.hash = '#chat'; }],
              ...(!isBrand ? [['🎁', "Do'stlarni taklif qilish", () => { window.location.hash = '#referral'; }] as const] : []),
              ['🚪', 'Chiqish', onLogout],
            ].map(([e, l, fn]) => (
              <button key={String(l)} type="button" onClick={fn as () => void} className="min-h-[54px] flex items-center gap-3 border-b border-[#EEECE6] last:border-b-0 text-left font-semibold cursor-pointer hover:text-[#5B3DF5]">
                <span className="text-[20px]" aria-hidden="true">{e}</span>{l}<span className="ml-auto text-[#8A8597]">{Icon.arrow(14)}</span>
              </button>
            ))}
          </div>
          <button type="button" onClick={() => { setDelOpen(true); setDelErr(''); }} className="mt-4 min-h-[44px] text-[14px] font-semibold text-[#B91C1C] cursor-pointer">Hisobni o'chirish</button>
        </section>
      </div>

      {delOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="del-title" onClick={() => !delBusy && setDelOpen(false)}>
          <div className="w-full max-w-[440px] rounded-[28px] bg-white p-6 sm:p-7" onClick={(e) => e.stopPropagation()}>
            <h2 id="del-title" className="v2-display m-0 font-extrabold text-[24px] text-[#991B1B]">Hisobni o'chirish</h2>
            <p className="mt-2 mb-0 text-[14px] text-[#5E5A6B]">Bu amalni qaytarib bo'lmaydi. Profil, arizalar va xabarlar o'chadi.</p>
            <label className="block mt-4 text-[14px] font-semibold">Parolingiz
              <input type="password" value={delPass} onChange={(e) => setDelPass(e.target.value)} autoComplete="current-password" className="mt-1.5 w-full box-border min-h-[48px] px-4 rounded-xl border-2 border-[#E6E3DC] outline-none focus:border-[#B91C1C]" />
            </label>
            <label className="block mt-3 text-[14px] font-semibold">Tasdiqlash uchun <b>OCHIRISH</b> deb yozing
              <input value={delText} onChange={(e) => setDelText(e.target.value)} className="mt-1.5 w-full box-border min-h-[48px] px-4 rounded-xl border-2 border-[#E6E3DC] outline-none focus:border-[#B91C1C]" />
            </label>
            {delErr && <div className="mt-2 text-[14px] text-[#B91C1C]">{delErr}</div>}
            <div className="mt-5 flex flex-wrap gap-2.5 justify-end">
              <button type="button" disabled={delBusy} onClick={() => setDelOpen(false)} className={btn.ghost}>Bekor qilish</button>
              <button type="button" disabled={delBusy} onClick={doDelete} className="min-h-[44px] px-5 rounded-xl bg-[#B91C1C] text-white font-bold cursor-pointer disabled:opacity-60">{delBusy ? "O'chirilmoqda..." : "O'chirish"}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
