import React, { useEffect, useState } from 'react';
import { UserSession, BriefData } from '../types';
import { fetchUserProfile } from '../firebase';
import { Avatar, Pill, Icon, btn, appStatus } from './ui';

interface Props {
  creatorId: string;
  currentUser: UserSession | null;
  briefs: BriefData[];
  onChat: (c: UserSession) => void;
}

const fmtPrice = (v?: string) => {
  const n = Number(String(v || '').replace(/[^\d]/g, ''));
  return n ? `${n.toLocaleString('ru-RU').replace(/,/g, ' ')} so'm` : '';
};

/** Brend uchun bloger profili (yangi dizayn, yengil) */
export const V2CreatorProfile: React.FC<Props> = ({ creatorId, currentUser, briefs, onChat }) => {
  const [c, setC] = useState<UserSession | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'none'>('loading');

  useEffect(() => {
    let alive = true;
    setState('loading');
    fetchUserProfile(creatorId)
      .then((u) => { if (!alive) return; setC(u); setState(u ? 'ok' : 'none'); })
      .catch(() => alive && setState('none'));
    return () => { alive = false; };
  }, [creatorId]);

  if (state === 'loading') {
    return (
      <main className="max-w-[980px] mx-auto px-4 sm:px-6 pt-8 pb-16">
        <div className="h-[220px] rounded-[32px] bg-white border border-[#E6E3DC] animate-pulse" />
        <div className="mt-4 h-[160px] rounded-[28px] bg-white border border-[#E6E3DC] animate-pulse" />
      </main>
    );
  }
  if (state === 'none' || !c) {
    return (
      <main className="max-w-[560px] mx-auto px-4 py-16 text-center">
        <h1 className="v2-display m-0 font-extrabold text-[28px]">Profil topilmadi</h1>
        <p className="mt-2 text-[#5E5A6B]">Bu bloger profili o'chirilgan yoki mavjud emas.</p>
        <button type="button" onClick={() => window.history.back()} className={`${btn.dark} mt-4`}>{Icon.back()} Orqaga</button>
      </main>
    );
  }

  const sl: any = c.socialLinks || {};
  const insta = String(sl.instagram || c.instagramHandle || '').trim();
  const instaUrl = !insta ? '' : /^https?:\/\//i.test(insta) ? insta : `https://instagram.com/${insta.replace(/^@/, '')}`;
  const instaLabel = !insta ? '' : /^https?:\/\//i.test(insta) ? `@${insta.replace(/\/$/, '').split('/').pop()}` : insta.startsWith('@') ? insta : `@${insta}`;
  const followers = String(sl.instagramFollowers || (c as any).followers || '').trim();
  const price = fmtPrice(c.priceRange?.min);
  const gallery = [...(c.gallery || []), ...((c as any).mediaGallery || [])].filter((g: any) => g && g.url && g.type !== 'video').slice(0, 6);
  const myBriefs = currentUser ? briefs.filter((b) => (b.brandId || b.ownerId) === currentUser.uid) : [];
  const theirApps = myBriefs
    .map((b) => ({ b, a: [...(b.applications || [])].reverse().find((x) => x.creatorId === c.uid || x.creatorId === creatorId) }))
    .filter((x) => x.a);

  return (
    <main className="max-w-[980px] mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-16">
      <button type="button" onClick={() => window.history.back()} className="min-h-[44px] pr-3 inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#5E5A6B] cursor-pointer hover:text-[#14121C]">{Icon.back()} Orqaga</button>

      <section className="mt-2 relative rounded-[32px] bg-[#14121C] text-white p-6 sm:p-9 overflow-hidden">
        <div className="absolute -right-20 -top-24 w-72 h-72 rounded-full bg-[#5B3DF5] opacity-80" aria-hidden="true" />
        <div className="relative flex flex-wrap items-center gap-5 sm:gap-7">
          <Avatar name={c.name} src={c.avatar} size={112} round />
          <div className="flex-[999_1_260px] min-w-0">
            <div className="flex flex-wrap gap-2">
              <Pill tone="lime">Bloger</Pill>
              {c.catalogApproved === true && <Pill tone="green">{Icon.check(13)} Tasdiqlangan</Pill>}
            </div>
            <h1 className="v2-display mt-3 mb-0 font-extrabold text-[32px] sm:text-[44px] tracking-[-1.5px] leading-[1.05] break-words">{c.name}</h1>
            <div className="mt-1.5 text-[15px] text-[#BDB8CC]">{[c.city, (c.categories || []).join(', ')].filter(Boolean).join(' · ')}</div>
          </div>
          {currentUser && currentUser.uid !== c.uid && (
            <button type="button" onClick={() => onChat(c)} className={`${btn.lime} min-h-[50px]`}>{Icon.chat(16)} Yozish</button>
          )}
        </div>
      </section>

      <section className="mt-4 grid gap-3 grid-cols-2 md:grid-cols-3">
        <div className="rounded-[22px] bg-white border border-[#E6E3DC] p-4 sm:p-5">
          <div className="text-[12px] sm:text-[13px] text-[#5E5A6B] font-semibold">Instagram obunachilar</div>
          <div className="v2-display font-extrabold text-[22px] sm:text-[28px] break-words">{followers || '—'}</div>
        </div>
        <div className="rounded-[22px] bg-[#C8F169] p-4 sm:p-5">
          <div className="text-[12px] sm:text-[13px] font-bold">1 Reels narxi</div>
          <div className="v2-display font-extrabold text-[22px] sm:text-[28px]">{price || 'Kelishiladi'}</div>
        </div>
        <div className="col-span-2 md:col-span-1 rounded-[22px] bg-white border border-[#E6E3DC] p-4 sm:p-5">
          <div className="text-[12px] sm:text-[13px] text-[#5E5A6B] font-semibold">Instagram</div>
          {instaUrl ? (
            <a href={instaUrl} target="_blank" rel="noopener noreferrer" className="v2-display block font-extrabold text-[20px] sm:text-[24px] text-[#4329D9] underline break-all">{instaLabel}</a>
          ) : <div className="v2-display font-extrabold text-[22px]">—</div>}
        </div>
      </section>

      <section className="mt-4 rounded-[28px] bg-white border border-[#E6E3DC] p-5 sm:p-7">
        <h2 className="v2-display m-0 font-extrabold text-[22px]">O'zi haqida</h2>
        <p className="mt-2 mb-0 text-[16px] leading-[1.6] text-[#3E3A4A] whitespace-pre-line break-words">{c.bio || "Ma'lumot kiritilmagan."}</p>
      </section>

      {gallery.length > 0 && (
        <section className="mt-4 rounded-[28px] bg-white border border-[#E6E3DC] p-5 sm:p-7">
          <h2 className="v2-display m-0 font-extrabold text-[22px]">Portfolio</h2>
          <div className="mt-4 grid gap-2.5 grid-cols-2 sm:grid-cols-3">
            {gallery.map((g: any, i: number) => (
              <a key={g.id || i} href={g.url} target="_blank" rel="noopener noreferrer" className="block aspect-square rounded-2xl overflow-hidden bg-[#F1F0EC]">
                <img src={g.thumbnailUrl || g.url} alt={g.title || `Portfolio ${i + 1}`} loading="lazy" className="w-full h-full object-cover" />
              </a>
            ))}
          </div>
        </section>
      )}

      {theirApps.length > 0 && (
        <section className="mt-4 rounded-[28px] bg-white border border-[#E6E3DC] overflow-hidden">
          <div className="px-5 sm:px-7 py-4 border-b border-[#EEECE6]"><h2 className="v2-display m-0 font-extrabold text-[22px]">E'lonlaringizga arizalari</h2></div>
          {theirApps.map(({ b, a }) => {
            const s = appStatus(a!);
            return (
              <div key={b.id} className="px-5 sm:px-7 py-4 border-b border-[#EEECE6] last:border-b-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <a href={`#elon-${encodeURIComponent(b.id)}`} className="font-bold hover:text-[#5B3DF5]">{b.taskTitle}</a>
                  {s === 'ok' ? <Pill tone="green">Qabul qilingan</Pill> : s === 'no' ? <Pill tone="red">Rad etilgan</Pill> : <Pill tone="amber">Yangi ariza</Pill>}
                </div>
                {a!.message && <p className="mt-1.5 mb-0 text-[14px] text-[#3E3A4A] break-words">"{a!.message}"</p>}
                {a!.proposedPrice && <div className="mt-1 text-[14px] text-[#5E5A6B]">Taklif: {fmtPrice(a!.proposedPrice) || a!.proposedPrice}</div>}
              </div>
            );
          })}
          <div className="px-5 sm:px-7 py-4"><a href="#kabinet" className={btn.dark}>Kabinetda javob berish {Icon.arrow(14)}</a></div>
        </section>
      )}
    </main>
  );
};
