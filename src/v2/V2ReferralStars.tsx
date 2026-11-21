import React, { useEffect, useState } from 'react';
import { UserSession } from '../types';
import { fetchReferralStarsPage, ReferralStar } from '../firebase';
import { Avatar, Icon, btn } from './ui';

const REWARD = 29000;
const fmt = (n: number) => Math.round(n).toLocaleString('ru-RU').replace(/,/g, ' ');

/** Instagram Reels / post havolasidan embed manzili */
function instaEmbed(url: string): string | null {
  const m = String(url || '').match(/instagram\.com\/(?:[^/]+\/)?(reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i);
  if (!m) return null;
  const kind = m[1].toLowerCase() === 'reels' ? 'reel' : m[1].toLowerCase();
  return `https://www.instagram.com/${kind}/${m[2]}/embed`;
}
function ytEmbed(url: string): string | null {
  const m = String(url || '').match(/(?:youtube\.com\/(?:shorts\/|watch\?v=)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}
const safeHref = (u: string) => (/^https?:\/\//i.test(u) ? u : `https://${u}`);
const GRADS = [
  'linear-gradient(160deg,#F9A8D4,#8B74FF 60%,#14121C)',
  'linear-gradient(160deg,#FDE68A,#F97316 60%,#14121C)',
  'linear-gradient(160deg,#BFDBFE,#5B3DF5 60%,#14121C)',
  'linear-gradient(160deg,#C8F169,#15803D 60%,#14121C)',
];

const VideoBox: React.FC<{ star: ReferralStar; i: number }> = ({ star, i }) => {
  const [play, setPlay] = useState(false);
  const embed = instaEmbed(star.video) || ytEmbed(star.video);
  if (play && embed) {
    return (
      <div className="relative aspect-[9/14] bg-black">
        <iframe src={embed} title={`${star.name} videosi`} className="absolute inset-0 w-full h-full border-0" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen loading="lazy" />
      </div>
    );
  }
  return (
    <div className="relative aspect-[9/14]" style={{ background: GRADS[i % GRADS.length] }}>
      {star.avatar && <img src={star.avatar} alt="" className="absolute inset-0 w-full h-full object-cover opacity-55" loading="lazy" />}
      {star.video ? (
        embed ? (
          <button type="button" onClick={() => setPlay(true)} aria-label={`${star.name} videosini o'ynatish`} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/95 flex items-center justify-center cursor-pointer shadow-lg">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#14121C" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
          </button>
        ) : (
          <a href={safeHref(star.video)} target="_blank" rel="noopener noreferrer" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 min-h-[48px] px-5 rounded-full bg-white/95 font-bold inline-flex items-center">Videoni ochish</a>
        )
      ) : null}
    </div>
  );
};

export const V2ReferralStars: React.FC<{ currentUser: UserSession | null }> = ({ currentUser }) => {
  const [data, setData] = useState<{ stars: ReferralStar[]; totalPaid: number; totalPros: number; referrers: number; totalInvited: number } | null>(null);
  const [friends, setFriends] = useState(20);

  useEffect(() => {
    let alive = true;
    fetchReferralStarsPage().then((d) => alive && setData(d)).catch(() => alive && setData({ stars: [], totalPaid: 0, totalPros: 0, referrers: 0, totalInvited: 0 }));
    return () => { alive = false; };
  }, []);

  const cta = currentUser ? '#referral' : '#royxat';
  const stars = data?.stars || [];

  return (
    <main className="max-w-[1180px] mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-20">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-[28px] sm:rounded-[36px] bg-[#14121C] text-white px-6 sm:px-12 py-10 sm:py-14">
        <div className="absolute -right-20 -top-24 w-72 sm:w-80 h-72 sm:h-80 rounded-full bg-[#5B3DF5] opacity-85" aria-hidden="true" />
        <div className="absolute right-40 -bottom-28 w-56 h-56 rounded-full bg-[#C8F169] hidden sm:block" aria-hidden="true" />
        <div className="relative max-w-[660px]">
          <span className="inline-flex px-3 py-1.5 rounded-full bg-white/10 text-[#C8F169] text-[12px] sm:text-[13px] font-bold tracking-[1px]">REFERAL DASTURI</span>
          <h1 className="v2-display mt-4 mb-0 font-extrabold text-[34px] sm:text-[58px] leading-[1.02] tracking-[-1.5px] sm:tracking-[-2px]">
            Collabix haqida video qiling — <span className="text-[#C8F169]">har bir do'st uchun 29 000 so'm</span>
          </h1>
          <p className="mt-4 mb-0 text-[16px] sm:text-[18px] text-[#BDB8CC] leading-[1.55]">Videongizga shaxsiy havolangizni qo'ying. Havola orqali kelgan bloger Pro olsa, pul balansingizga tushadi va kartangizga yechib olasiz.</p>
          <a href={cta} className={`${btn.lime} mt-6 min-h-[54px] px-6`}>Havolamni olish {Icon.arrow(16)}</a>
        </div>
      </section>

      {/* RAQAMLAR */}
      <section className="mt-4 rounded-[24px] sm:rounded-[28px] bg-[#C8F169] p-5 sm:p-7">
        <div className="text-[12px] sm:text-[13px] font-bold tracking-[1.5px]">BLOGERLAR TOPISHI MUMKIN BO'LGAN SUMMA</div>
        <div className="mt-1 v2-display font-extrabold text-[44px] sm:text-[72px] leading-none tracking-[-2px]">{data ? fmt(data.totalInvited * REWARD) : '…'} <span className="text-[20px] sm:text-[28px]">so'm</span></div>
        <div className="mt-2 text-[14px] sm:text-[15px] font-semibold text-[#2E3A12]">Referal havolalar orqali {data ? data.totalInvited : '…'} kishi ro'yxatdan o'tdi — hammasi Pro olsa, shuncha to'lanadi.</div>
        <div className="mt-4 pt-4 border-t border-[#14121C]/15 grid grid-cols-3 gap-2">
          <div><div className="text-[12px] font-semibold text-[#3E4A1F]">Allaqachon topilgan</div><div className="v2-display font-extrabold text-[20px] sm:text-[26px]">{data ? `${fmt(data.totalPaid)} so'm` : '…'}</div></div>
          <div><div className="text-[12px] font-semibold text-[#3E4A1F]">Pro olganlar</div><div className="v2-display font-extrabold text-[20px] sm:text-[26px]">{data ? `${data.totalPros} ta` : '…'}</div></div>
          <div><div className="text-[12px] font-semibold text-[#3E4A1F]">Topgan blogerlar</div><div className="v2-display font-extrabold text-[20px] sm:text-[26px]">{data ? `${data.referrers} ta` : '…'}</div></div>
        </div>
      </section>

      {/* KALKULYATOR */}
      <section className="mt-4 rounded-[24px] sm:rounded-[28px] bg-white border border-[#E6E3DC] p-5 sm:p-7">
        <div className="text-[12px] sm:text-[13px] font-bold tracking-[2px] text-[#5B3DF5]">QANCHA TOPISHINGIZ MUMKIN</div>
        <h2 className="v2-display mt-1.5 mb-0 font-extrabold text-[26px] sm:text-[34px] tracking-[-1px]">Nechta do'stingiz Pro oladi?</h2>
        <div className="mt-4 grid grid-cols-4 sm:flex gap-2" role="group" aria-label="Do'stlar soni">
          {[5, 20, 50, 100].map((n) => (
            <button key={n} type="button" aria-pressed={friends === n} onClick={() => setFriends(n)} className={`min-h-[48px] sm:px-6 rounded-2xl font-bold text-[16px] border-2 cursor-pointer ${friends === n ? 'bg-[#5B3DF5] text-white border-[#5B3DF5]' : 'bg-white border-[#E6E3DC] hover:border-[#14121C]'}`}>{n}</button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="v2-display font-extrabold text-[44px] sm:text-[64px] tracking-[-2px] text-[#5B3DF5] leading-none" aria-live="polite">{fmt(friends * REWARD)}</span>
          <span className="text-[18px] sm:text-[20px] font-bold">so'm</span>
          <span className="text-[#5E5A6B]">= {friends} do'st × 29 000 so'm</span>
        </div>
        <p className="mt-2 mb-0 text-[14px] text-[#5E5A6B]">Har bir Pro olgan do'st uchun bir marta to'lanadi. Cheklov yo'q.</p>
      </section>

      {/* VIDEOLAR */}
      <section className="mt-10">
        <div className="text-[12px] sm:text-[13px] font-bold tracking-[2px] text-[#5B3DF5]">ULAR ALLAQACHON TOPYAPTI</div>
        <h2 className="v2-display mt-1.5 mb-0 font-extrabold text-[28px] sm:text-[40px] tracking-[-1.4px] leading-[1.08]">Collabix'ni reklama qilgan blogerlar</h2>
        {!data ? (
          <div className="mt-5 grid gap-4 grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(250px,1fr))]">{[0, 1, 2].map((i) => <div key={i} className="h-[440px] rounded-[26px] bg-white border border-[#E6E3DC] animate-pulse" />)}</div>
        ) : stars.length === 0 ? (
          <div className="mt-5 rounded-[26px] border border-dashed border-[#D6D2C8] bg-white/60 py-12 px-6 text-center">
            <div className="v2-display font-extrabold text-[22px]">Birinchi bo'ling!</div>
            <p className="mt-2 mb-4 text-[#5E5A6B]">Collabix haqida video qiling — eng yaxshi videolar shu yerda chiqadi.</p>
            <a href={cta} className={btn.dark}>Havolamni olish</a>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(250px,1fr))]">
            {stars.map((s, i) => {
              const paid = Math.max(0, s.earned - s.balance);
              return (
                <article key={s.uid} className="rounded-[26px] bg-white border border-[#E6E3DC] overflow-hidden">
                  <VideoBox star={s} i={i} />
                  <div className="p-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={s.name} src={s.avatar} size={40} round />
                      <div className="min-w-0">
                        <div className="font-bold truncate">{s.name}</div>
                        <div className="text-[13px] text-[#5E5A6B] truncate">{[s.handle ? (s.handle.startsWith('@') || s.handle.startsWith('http') ? s.handle : `@${s.handle}`) : '', s.city].filter(Boolean).join(' · ')}</div>
                      </div>
                    </div>
                    <div className="mt-3.5 rounded-2xl bg-[#C8F169] p-3.5">
                      <div className="text-[12px] font-bold">Topishi mumkin</div>
                      <div className="v2-display font-extrabold text-[30px] leading-[1.05] tracking-[-1px]">{fmt(s.invited * REWARD)} <span className="text-[15px]">so'm</span></div>
                      <div className="text-[12px] font-semibold text-[#2E3A12]">{s.invited} kishi uning havolasi orqali keldi</div>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2 rounded-2xl bg-[#F6F5F1] px-3.5 py-2.5">
                      <span className="text-[13px] text-[#5E5A6B] font-semibold">Topgan ({s.pros} Pro)</span>
                      <span className="v2-display font-extrabold text-[18px]">{fmt(s.earned)} so'm</span>
                    </div>
                    {paid > 0 && <div className="mt-2.5 text-[13px] text-[#166534] font-bold">✓ {fmt(paid)} so'm kartaga to'langan</div>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* REYTING */}
      {stars.length > 1 && (
        <section className="mt-8 rounded-[24px] sm:rounded-[28px] bg-white border border-[#E6E3DC] overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-[#EEECE6]"><h2 className="v2-display m-0 font-extrabold text-[22px] sm:text-[24px]">Reyting</h2></div>
          <ol className="m-0 p-0 list-none">
            {stars.slice(0, 10).map((s, i) => (
              <li key={s.uid} className={`px-5 sm:px-6 py-3.5 border-b border-[#EEECE6] last:border-b-0 flex items-center gap-3 ${i === 0 ? 'bg-[#FFFBEB]' : ''}`}>
                <span className="w-9 shrink-0 font-extrabold text-[16px]">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</span>
                <span className="flex-1 min-w-0 font-bold truncate">{s.name}</span>
                <span className="text-right leading-tight">
                  <span className="block font-extrabold whitespace-nowrap">{fmt(s.invited * REWARD)} so'm</span>
                  <span className="block text-[12px] text-[#5E5A6B] whitespace-nowrap">topgan: {fmt(s.earned)}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* QANDAY */}
      <section className="mt-8 grid gap-3 sm:gap-3.5 grid-cols-1 sm:grid-cols-3">
        <div className="rounded-[24px] bg-white border border-[#E6E3DC] p-5"><div className="v2-display font-extrabold text-[36px] text-[#5B3DF5] leading-none">01</div><div className="mt-2 font-bold text-[18px]">Havolangizni oling</div><div className="text-[15px] text-[#5E5A6B]">Pro yoqilgach, "Do'stlarni taklif qilish" bo'limida shaxsiy havola tayyor turadi.</div></div>
        <div className="rounded-[24px] bg-white border border-[#E6E3DC] p-5"><div className="v2-display font-extrabold text-[36px] text-[#5B3DF5] leading-none">02</div><div className="mt-2 font-bold text-[18px]">Video qiling</div><div className="text-[15px] text-[#5E5A6B]">Collabix haqida Reels qiling, havolani bio yoki izohga qo'ying.</div></div>
        <div className="rounded-[24px] bg-[#5B3DF5] text-white p-5"><div className="v2-display font-extrabold text-[36px] text-[#C8F169] leading-none">03</div><div className="mt-2 font-bold text-[18px]">Pul oling</div><div className="text-[15px] text-[#E4DEFF]">Do'stingiz Pro olsa — 29 000 so'm balansga, keyin kartaga.</div></div>
      </section>

      <p className="mt-6 text-center text-[13px] text-[#5E5A6B]">Sahifada faqat roziligi bilan qo'shilgan blogerlar ko'rsatiladi. Raqamlar Collabix hisobidan olinadi.</p>
    </main>
  );
};
