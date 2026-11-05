import React, { useEffect, useMemo, useState } from 'react';
import { BriefData, UserSession } from '../types';
import { fetchUserProfile } from '../firebase';
import { Avatar, Pill, Icon, budgetText, timeAgo, btn, canApply, appStatus, isBriefOpen } from './ui';
import { BriefCard } from './V2Home';

interface BriefProps {
  brief: BriefData | null;
  loading: boolean;
  currentUser: UserSession | null;
  onApply: (brief: BriefData, message: string, price: string) => Promise<void>;
  onOpenPro: () => void;
  onOpenEditProfile: () => void;
}

export const V2BriefPage: React.FC<BriefProps> = ({ brief, loading, currentUser, onApply, onOpenPro, onOpenEditProfile }) => {
  const [message, setMessage] = useState('');
  const [price, setPrice] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  if (loading && !brief) {
    return <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-16"><div className="h-[420px] rounded-[28px] bg-white border border-[#E6E3DC] animate-pulse" /></div>;
  }
  if (!brief) {
    return (
      <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="v2-display font-extrabold text-[32px]">E'lon topilmadi</div>
        <p className="text-[#5E5A6B]">E'lon o'chirilgan yoki yopilgan bo'lishi mumkin.</p>
        <a href="#" className={`${btn.dark} mt-4`}>Barcha e'lonlar</a>
      </div>
    );
  }

  const isOwner = !!currentUser?.uid && (brief.brandId === currentUser.uid || brief.ownerId === currentUser.uid);
  const myApp = currentUser?.uid ? (brief.applications || []).find((a) => a.creatorId === currentUser.uid) : undefined;
  const myState = myApp ? appStatus(myApp) : null;
  const gate = canApply(currentUser);
  const open = isBriefOpen(brief);
  const apps = brief.applications?.length || 0;

  const submit = async () => {
    setError('');
    setSending(true);
    try {
      await onApply(brief, message, price);
      setMessage('');
      setPrice('');
    } catch (e: any) {
      setError(e?.message === 'ALREADY_APPLIED' ? 'Siz bu e\'longa allaqachon ariza yuborgansiz.' : "Ariza yuborilmadi. Internetni tekshirib, qayta urinib ko'ring.");
    } finally {
      setSending(false);
    }
  };

  const gateBox = (title: string, text: string, action?: React.ReactNode) => (
    <div className="mt-5 rounded-2xl bg-[#1F1C29] p-4">
      <div className="font-bold">{title}</div>
      <div className="text-[14px] text-[#BDB8CC] mt-1">{text}</div>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );

  let applyArea: React.ReactNode;
  if (isOwner) {
    applyArea = gateBox("Bu sizning e'loningiz", `${apps} ta ariza kelgan.`, <a href="#kabinet" className={`${btn.lime} w-full`}>Arizalarni ko'rish</a>);
  } else if (myApp && myState !== 'no') {
    applyArea =
      myState === 'ok' ? (
        <div className="mt-5 rounded-2xl bg-[#DCFCE7] text-[#14532D] p-4 flex gap-3 items-center">
          <span className="text-[#15803D]">{Icon.check(22)}</span>
          <div><div className="font-bold">Arizangiz qabul qilindi!</div><div className="text-[14px]">Brend bilan "Mening arizalarim"dan bog'laning.</div></div>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl bg-[#FEF3C7] text-[#78350F] p-4 flex gap-3 items-center">
          <span className="text-[#A16207]">{Icon.clock(22)}</span>
          <div><div className="font-bold">Ariza yuborildi — kutilmoqda</div><div className="text-[14px]">Brend javob berishi bilan xabar olasiz.</div></div>
        </div>
      );
  } else if (!open) {
    applyArea = gateBox("E'lon yopilgan", 'Brend bu e\'lon uchun bloger tanlab bo\'ldi.');
  } else if (!gate.ok) {
    const r = gate.reason;
    applyArea =
      r === 'guest' ? gateBox('Ariza yuborish uchun kiring', "Ro'yxatdan o'tish 2 daqiqa davom etadi.", <a href="#royxat" className={`${btn.lime} w-full`}>Ro'yxatdan o'tish</a>)
      : r === 'brand' ? gateBox('Brend hisobidasiz', "E'lonlarga faqat blogerlar ariza yuboradi.")
      : r === 'review' ? gateBox('Profilingiz tekshiruvda ⏳', "Admin tasdiqlagach ariza yubora olasiz. Odatda bir necha soat.")
      : r === 'rejected' ? gateBox('Profil tasdiqlanmadi', currentUser?.catalogRejectReason ? `Sabab: ${currentUser.catalogRejectReason}` : "Profilingizni tuzatib, qayta yuboring.", <button type="button" onClick={onOpenEditProfile} className={`${btn.lime} w-full`}>Profilni tuzatish</button>)
      : r === 'pro' ? gateBox('Pro rejim kerak', "Ochiq e'lonlarga ariza yuborish Pro obunachilar uchun — 59 000 so'm/oy.", <button type="button" onClick={onOpenPro} className={`${btn.lime} w-full`}>Pro'ni yoqish</button>)
      : gateBox("Profilingiz to'liq emas", "Ariza uchun profil 100% to'ldirilgan bo'lishi kerak.", <button type="button" onClick={onOpenEditProfile} className={`${btn.lime} w-full`}>Profilni to'ldirish</button>);
  } else {
    applyArea = (
      <div className="mt-5">
        {myState === 'no' && <div className="mb-3 text-[14px] text-[#FCA5A5]">Oldingi arizangiz rad etilgan — qayta yuborishingiz mumkin.</div>}
        <label className="block text-[14px] font-semibold text-[#E4DEFF]">
          Brendga qisqa xabar
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Nega aynan siz mos ekansiz?"
            className="mt-2 w-full box-border rounded-[14px] border border-[#3A3647] bg-[#1F1C29] text-white px-3.5 py-3 text-[15px] resize-y outline-none focus:border-[#C8F169]"
          />
        </label>
        <label className="block mt-3 text-[14px] font-semibold text-[#E4DEFF]">
          Taklif narxingiz (ixtiyoriy)
          <input
            type="text"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Masalan, 500 000"
            className="mt-2 w-full box-border min-h-[48px] rounded-[14px] border border-[#3A3647] bg-[#1F1C29] text-white px-3.5 text-[15px] outline-none focus:border-[#C8F169]"
          />
        </label>
        {error && <div className="mt-3 text-[14px] text-[#FCA5A5]">{error}</div>}
        <button type="button" onClick={submit} disabled={sending || message.trim().length < 3} className={`${btn.lime} mt-4 w-full min-h-[56px] text-[17px]`}>
          {sending ? 'Yuborilmoqda...' : 'Ariza yuborish'}
        </button>
        {message.trim().length < 3 && <div className="mt-2 text-[12px] text-[#BDB8CC] text-center">Avval brendga qisqa xabar yozing</div>}
      </div>
    );
  }

  return (
    <main className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-6 pb-16">
      <a href="#" className="inline-flex items-center gap-2 min-h-[44px] font-semibold text-[#5E5A6B] hover:text-[#14121C]">{Icon.back()} Barcha e'lonlar</a>
      <div className="mt-3 flex flex-wrap gap-7 items-start">
        <div className="flex-[999_1_560px] min-w-0 flex flex-col gap-5">
          <section className="rounded-[28px] bg-white border border-[#E6E3DC] p-6 sm:p-9">
            <div className="flex flex-wrap items-center gap-3.5">
              <Avatar name={brief.brandName} src={brief.brandAvatar} size={64} />
              <div className="flex-1 min-w-0">
                <a href={`#brend-${encodeURIComponent(brief.brandId || brief.ownerId || '')}`} className="font-bold text-[18px] inline-flex items-center gap-1.5 hover:text-[#5B3DF5]">
                  {brief.brandName || 'Brend'} {Icon.verified(18)}
                </a>
                <div className="text-[14px] text-[#5E5A6B]">{(brief.categories || []).join(' · ') || 'Hamkorlik'} · {timeAgo(brief)}</div>
              </div>
              {open ? <Pill tone="green"><span className="w-2 h-2 rounded-full bg-[#22C55E]" />Ochiq</Pill> : <Pill>Yopilgan</Pill>}
            </div>
            <h1 className="v2-display mt-6 mb-0 font-extrabold text-[32px] sm:text-[46px] leading-[1.05] tracking-[-1.5px]">{brief.taskTitle}</h1>
            <div className="mt-4 flex flex-wrap gap-2">
              {(brief.formats || []).map((f) => <Pill key={f} tone="violet">{f}</Pill>)}
              {(brief.categories || []).map((c) => <Pill key={c}>{c}</Pill>)}
            </div>
          </section>
          <section className="rounded-[28px] bg-white border border-[#E6E3DC] p-6 sm:p-9">
            <h2 className="v2-display m-0 font-extrabold text-[24px] tracking-[-0.5px]">Vazifa</h2>
            <p className="mt-3 mb-0 text-[#3E3A4A] text-[17px] leading-[1.6] whitespace-pre-line break-words">{brief.description || '—'}</p>
            {brief.requirementsSummary && (
              <>
                <h2 className="v2-display mt-8 mb-0 font-extrabold text-[24px] tracking-[-0.5px]">Talablar</h2>
                <p className="mt-3 mb-0 text-[#3E3A4A] text-[17px] leading-[1.6] whitespace-pre-line break-words">{brief.requirementsSummary}</p>
              </>
            )}
            {brief.paymentType === 'barter' && brief.barterDescription && (
              <>
                <h2 className="v2-display mt-8 mb-0 font-extrabold text-[24px] tracking-[-0.5px]">Barter</h2>
                <p className="mt-3 mb-0 text-[#3E3A4A] text-[17px] leading-[1.6] whitespace-pre-line break-words">{brief.barterDescription}</p>
              </>
            )}
          </section>
        </div>

        <aside className="flex-[1_1_340px] min-w-0 flex flex-col gap-4 md:sticky md:top-24">
          <div className="rounded-[28px] bg-[#14121C] text-white p-6 sm:p-7">
            <div className="text-[13px] text-[#BDB8CC] font-semibold">Byudjet</div>
            <div className="v2-display font-extrabold text-[34px] sm:text-[40px] tracking-[-1.5px] leading-[1.1]">{budgetText(brief)}</div>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl bg-[#1F1C29] p-3.5"><div className="text-[12px] text-[#BDB8CC]">Muddat</div><div className="font-bold text-[16px]">{brief.deadline || 'Kelishiladi'}</div></div>
              <div className="rounded-2xl bg-[#1F1C29] p-3.5"><div className="text-[12px] text-[#BDB8CC]">Arizalar</div><div className="font-bold text-[16px]">{apps} ta</div></div>
              <div className="rounded-2xl bg-[#1F1C29] p-3.5 col-span-2"><div className="text-[12px] text-[#BDB8CC]">Format</div><div className="font-bold text-[16px]">{(brief.formats || []).join(', ') || '—'}</div></div>
            </div>
            {applyArea}
          </div>
          <div className="rounded-3xl bg-white border border-[#E6E3DC] p-5 flex gap-3.5 items-center">
            <span className="w-11 h-11 shrink-0 rounded-xl bg-[#EEEBFF] text-[#4329D9] flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z" /><path d="M9 12l2 2 4-4" /></svg>
            </span>
            <div className="text-[14px] text-[#3E3A4A]"><strong className="text-[#14121C]">Xavfsiz hamkorlik.</strong> Kontaktlar faqat ariza qabul qilingach ochiladi.</div>
          </div>
        </aside>
      </div>
    </main>
  );
};

/* ------------------------------- Brend sahifasi ------------------------------- */

export const V2BrandPage: React.FC<{ brandId: string; briefs: BriefData[] }> = ({ brandId, briefs }) => {
  const [profile, setProfile] = useState<UserSession | null>(null);
  useEffect(() => {
    let alive = true;
    fetchUserProfile(brandId).then((p) => alive && setProfile(p)).catch(() => {});
    return () => { alive = false; };
  }, [brandId]);
  const own = useMemo(() => briefs.filter((b) => (b.brandId || b.ownerId) === brandId), [briefs, brandId]);
  const open = own.filter(isBriefOpen);
  const first = own[0];
  const name = profile?.name || first?.brandName || 'Brend';
  const avatar = profile?.avatar || first?.brandAvatar;
  const insta = profile?.socialLinks?.instagram || profile?.instagramHandle;
  return (
    <main className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-6 pb-16">
      <a href="#brendlar" className="inline-flex items-center gap-2 min-h-[44px] font-semibold text-[#5E5A6B] hover:text-[#14121C]">{Icon.back()} Brendlar</a>
      <section className="mt-3 rounded-[32px] bg-[#14121C] text-white p-7 sm:p-10 relative overflow-hidden">
        <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full bg-[#5B3DF5] opacity-70" aria-hidden="true" />
        <div className="relative flex flex-wrap items-center gap-5">
          <Avatar name={name} src={avatar} size={88} />
          <div className="min-w-0">
            <h1 className="v2-display m-0 font-extrabold text-[34px] sm:text-[46px] tracking-[-1.5px] leading-[1.05] flex items-center gap-2">{name} {Icon.verified(26)}</h1>
            <div className="mt-1 text-[#BDB8CC]">{[(profile?.categories || [])[0], profile?.city].filter(Boolean).join(' · ') || 'Brend'}</div>
          </div>
        </div>
        {profile?.bio && <p className="relative mt-6 mb-0 max-w-[720px] text-[17px] text-[#E4DEFF] whitespace-pre-line">{profile.bio}</p>}
        <div className="relative mt-6 flex flex-wrap gap-2.5">
          <Pill tone="lime">{open.length} ta ochiq e'lon</Pill>
          {insta && <Pill tone="violet">Instagram: {String(insta).replace(/^https?:\/\/(www\.)?instagram\.com\//, '@').replace(/\/$/, '')}</Pill>}
        </div>
      </section>
      <h2 className="v2-display mt-10 mb-0 font-extrabold text-[28px] sm:text-[36px] tracking-[-1px]">E'lonlari</h2>
      {own.length === 0 ? (
        <p className="mt-3 text-[#5E5A6B]">Bu brendning hozircha ochiq e'loni yo'q.</p>
      ) : (
        <div className="mt-6 grid gap-5 grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
          {own.map((b) => <BriefCard key={b.id} brief={b} />)}
        </div>
      )}
    </main>
  );
};
