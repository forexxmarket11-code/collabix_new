import React, { useEffect, useMemo, useState } from 'react';
import { BriefData, UserSession } from '../types';
import { Avatar, Pill, Icon, budgetText, timeAgo, btn, go, isBriefOpen } from './ui';
import { fetchHomeShowcase } from '../firebase';
import type { ShowcaseCreator } from '../firebase';
import { Reveal, CountUp, PhoneMockup, CreatorMarquee } from './HomeExtras';

export const CATEGORY_LIST = ["Go'zallik", 'Kiyim', 'Kafe va restoran', 'Texnika', "Ta'lim", 'Sayohat', 'Sport', 'Lifestyle', 'Food'];

export const BriefCard: React.FC<{ brief: BriefData }> = ({ brief }) => {
  const apps = brief.applications?.length || 0;
  const fmt = (brief.formats || []).slice(0, 2).join(' + ');
  return (
    <article className="rounded-3xl bg-white border border-[#E6E3DC] p-5 sm:p-6 flex flex-col gap-3.5 hover:shadow-[0_20px_50px_-28px_rgba(20,18,28,0.45)] hover:-translate-y-0.5 transition-all">
      <div className="flex items-center gap-3">
        <Avatar name={brief.brandName} src={brief.brandAvatar} size={44} />
        <div className="flex-1 min-w-0">
          <a href={`#brend-${encodeURIComponent(brief.brandId || brief.ownerId || '')}`} className="font-bold text-[15px] truncate block hover:text-[#5B3DF5]">
            {brief.brandName || 'Brend'}
          </a>
          <div className="text-[13px] text-[#5E5A6B] truncate">
            {(brief.categories || [])[0] || 'Hamkorlik'} · {timeAgo(brief)}
          </div>
        </div>
        {fmt && <Pill>{fmt}</Pill>}
      </div>
      <h3 className="v2-display m-0 font-bold text-[21px] leading-[1.2] tracking-[-0.4px]">
        <a href={`#elon-${encodeURIComponent(brief.id)}`} className="hover:text-[#5B3DF5]">{brief.taskTitle}</a>
      </h3>
      <div className="flex flex-wrap gap-1.5 text-[13px] font-semibold text-[#3E3A4A]">
        {brief.deadline && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F6F5F1]">{Icon.clock(14)}{brief.deadline}</span>
        )}
        {(brief.categories || []).slice(1, 3).map((c) => (
          <span key={c} className="px-2.5 py-1 rounded-full bg-[#F6F5F1]">{c}</span>
        ))}
      </div>
      <div className="mt-auto pt-4 border-t border-[#EEECE6] flex items-center justify-between gap-3">
        <div>
          <div className="text-[12px] text-[#5E5A6B]">Byudjet</div>
          <div className="v2-display font-extrabold text-[19px]">{budgetText(brief)}</div>
        </div>
        <a href={`#elon-${encodeURIComponent(brief.id)}`} className={btn.dark}>
          Batafsil {Icon.arrow(15)}
        </a>
      </div>
      <div className="text-[13px] text-[#5E5A6B] flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${isBriefOpen(brief) ? 'bg-[#22C55E]' : 'bg-[#A8A29E]'}`} />
        {isBriefOpen(brief) ? `${apps} ta ariza` : 'Yopilgan'}
      </div>
    </article>
  );
};

export interface BrandSummary {
  id: string;
  name: string;
  avatar?: string;
  category: string;
  openCount: number;
}

export function brandsFromBriefs(briefs: BriefData[]): BrandSummary[] {
  const map = new Map<string, BrandSummary>();
  briefs.forEach((b) => {
    const id = b.brandId || b.ownerId;
    if (!id) return;
    const prev = map.get(id);
    const open = isBriefOpen(b) ? 1 : 0;
    if (prev) {
      prev.openCount += open;
    } else {
      map.set(id, { id, name: b.brandName || 'Brend', avatar: b.brandAvatar, category: (b.categories || [])[0] || 'Brend', openCount: open });
    }
  });
  return Array.from(map.values()).sort((a, b) => b.openCount - a.openCount);
}

interface Props {
  briefs: BriefData[];
  loading: boolean;
  currentUser: UserSession | null;
}

export const V2Home: React.FC<Props> = ({ briefs, loading, currentUser }) => {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('Hammasi');
  const [sort, setSort] = useState<'new' | 'budget' | 'apps'>('new');
  const [showAll, setShowAll] = useState(false);
  const [aud, setAud] = useState<'bloger' | 'brend'>(currentUser?.role === 'brend' ? 'brend' : 'bloger');
  const [showcase, setShowcase] = useState<{ count: number; creators: ShowcaseCreator[] }>({ count: 0, creators: [] });
  useEffect(() => {
    let alive = true;
    fetchHomeShowcase().then((r) => alive && setShowcase(r)).catch(() => {});
    return () => { alive = false; };
  }, []);

  const openBriefs = useMemo(() => briefs.filter(isBriefOpen), [briefs]);
  const brands = useMemo(() => brandsFromBriefs(briefs), [briefs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = openBriefs.filter((b) => {
      if (cat !== 'Hammasi' && !(b.categories || []).some((c) => c.toLowerCase() === cat.toLowerCase())) return false;
      if (!q) return true;
      return [b.taskTitle, b.brandName, b.description, ...(b.categories || [])].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
    });
    if (sort === 'budget') {
      const num = (b: BriefData) => Number(String(b.budgetMax || b.budgetMin || '0').replace(/[^\d]/g, '')) || 0;
      list = [...list].sort((a, b) => num(b) - num(a));
    } else if (sort === 'apps') {
      list = [...list].sort((a, b) => (a.applications?.length || 0) - (b.applications?.length || 0));
    }
    return list;
  }, [openBriefs, query, cat, sort]);

  const visible = showAll ? filtered : filtered.slice(0, 9);

  return (
    <div>
      {/* HERO */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-8 sm:pt-14 pb-8 flex flex-wrap gap-10 lg:gap-14 items-center">
        <div className="flex-[999_1_520px] min-w-0">
          <div role="tablist" aria-label="Kim uchun" className="inline-flex p-1.5 rounded-2xl bg-white border border-[#E6E3DC] shadow-sm">
            {([['bloger', 'Men blogerman'], ['brend', 'Men brendman']] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={aud === id}
                onClick={() => setAud(id)}
                className={`min-h-[42px] px-4 rounded-xl text-[15px] font-bold cursor-pointer transition-colors ${aud === id ? 'bg-[#14121C] text-white' : 'text-[#5E5A6B] hover:text-[#14121C]'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <h1 className="v2-display mt-6 mb-0 font-extrabold text-[42px] sm:text-[64px] lg:text-[74px] leading-[0.98] tracking-[-2px] sm:tracking-[-3px]">
            {aud === 'brend' ? (
              <>Mahsulotingizni <span className="relative inline-block text-[#5B3DF5]">blogerlar<svg className="absolute left-0 -bottom-2 w-full" height="12" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true"><path d="M2 9 Q 100 -2 198 8" stroke="#C8F169" strokeWidth="6" fill="none" strokeLinecap="round" /></svg></span> tanitsin.</>
            ) : (
              <>Brendlar e'lon beradi.<br /><span className="relative inline-block text-[#5B3DF5]">Siz pul ishlaysiz.<svg className="absolute left-0 -bottom-2 w-full" height="12" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true"><path d="M2 9 Q 100 -2 198 8" stroke="#C8F169" strokeWidth="6" fill="none" strokeLinecap="round" /></svg></span></>
            )}
          </h1>
          <p className="mt-6 mb-0 max-w-[560px] text-[17px] sm:text-[19px] leading-[1.55] text-[#5E5A6B]">
            {aud === 'brend'
              ? "Bitta e'lon joylang — tekshirilgan blogerlar o'zi ariza yuboradi. Ssenariy, video va Reels'ni tasdiqlaysiz, natijani kabinetda ko'rasiz. Brendlar uchun tekin."
              : "O'zbekistondagi brendlarning ochiq reklama e'lonlari bir joyda. Profil oching, mos e'longa ariza yuboring va javobni shu yerda kuzating."}
          </p>
          <div className="mt-7 flex flex-wrap gap-2.5">
            {aud === 'brend' ? (
              <>
                <a href={currentUser?.role === 'brend' ? '#yangi-elon' : '#royxat'} className={`${btn.violet} min-h-[54px] px-6 text-[16px]`}>Tekin e'lon joylash {Icon.arrow(16)}</a>
                <a href="#brendlar-uchun" className={`${btn.ghost} min-h-[54px] px-6 text-[16px]`}>Qanday ishlaydi</a>
              </>
            ) : (
              <>
                <a href={currentUser ? '#elonlar' : '#royxat'} className={`${btn.dark} min-h-[54px] px-6 text-[16px]`}>{currentUser ? "E'lonlarni ko'rish" : "Bloger sifatida boshlash"} {Icon.arrow(16)}</a>
                <a href="#elonlar" className={`${btn.ghost} min-h-[54px] px-6 text-[16px]`}>Ochiq e'lonlar ({openBriefs.length})</a>
              </>
            )}
          </div>
          <div className="mt-7 flex items-center gap-3">
            <div className="flex -space-x-2.5">
              {showcase.creators.slice(0, 5).map((c) => (
                <img key={c.id} src={c.avatar} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-[#F6F5F1]" />
              ))}
            </div>
            <div className="text-[14px] leading-tight">
              <div className="font-extrabold">{showcase.count ? `${showcase.count}+ bloger` : '150+ bloger'}</div>
              <div className="text-[#5E5A6B]">allaqachon Collabix'da</div>
            </div>
          </div>
        </div>

        <div className="hidden md:flex flex-[1_1_340px] min-w-0 justify-center">
          <div className="hidden md:block"><PhoneMockup /></div>
        </div>
      </section>

      {/* RAQAMLAR */}
      <Reveal className="max-w-[1240px] mx-auto px-4 sm:px-6 pb-4">
        <div className="rounded-[28px] bg-[#14121C] text-white grid grid-cols-2 md:grid-cols-4 overflow-hidden">
          {[
            [showcase.count || 0, '+', "ro'yxatdan o'tgan bloger"],
            [openBriefs.length, '', "ochiq e'lon"],
            [brands.length, '', 'brend'],
            [0, '', "so'm — brend uchun narx"],
          ].map(([n, suf, l], i) => (
            <div key={String(l)} className={`p-5 sm:p-7 ${i % 2 === 1 ? 'border-l border-white/10' : ''} ${i > 1 ? 'border-t md:border-t-0 border-white/10' : ''} ${i === 2 ? 'md:border-l' : ''}`}>
              <div className="v2-display font-extrabold text-[34px] sm:text-[46px] leading-none text-[#C8F169]">{Number(n) > 0 ? <CountUp to={Number(n)} suffix={String(suf)} /> : '0'}</div>
              <div className="mt-2 text-[13px] sm:text-[15px] text-[#BDB8CC]">{String(l)}</div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* CATEGORIES */}
      <section aria-label="Kategoriyalar" className="hidden md:block max-w-[1240px] mx-auto px-4 sm:px-6">
        <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1">
          {['Hammasi', ...CATEGORY_LIST].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={`shrink-0 min-h-[44px] px-4 rounded-full font-semibold text-[15px] border cursor-pointer transition-colors ${
                cat === c ? 'bg-[#14121C] text-white border-[#14121C]' : 'bg-white text-[#14121C] border-[#E6E3DC] hover:border-[#14121C]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      {/* OPEN BRIEFS */}
      <section id="elonlar" className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-2 md:pt-10 pb-6 scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[10px] md:text-[13px] font-bold tracking-[1px] md:tracking-[2px] text-[#5B3DF5]">OCHIQ E'LONLAR</div>
            <h2 className="v2-display mt-2 mb-0 font-extrabold text-[32px] sm:text-[44px] tracking-[-1.5px] leading-[1.05]">Brendlar hozir bloger qidirmoqda</h2>
          </div>
          <div className="hidden md:flex gap-1.5 p-1.5 rounded-2xl bg-[#ECEAE4]">
            {([['new', 'Yangi'], ['budget', "Byudjet bo'yicha"], ['apps', 'Kam arizali']] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setSort(id)}
                className={`min-h-[40px] px-3.5 rounded-xl text-[14px] cursor-pointer ${sort === id ? 'bg-white font-bold shadow-sm' : 'font-semibold text-[#5E5A6B]'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="mt-7 grid gap-5 grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[280px] rounded-3xl bg-white border border-[#E6E3DC] animate-pulse" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="mt-7 rounded-3xl border border-dashed border-[#D6D2C8] bg-white/60 py-14 px-6 text-center">
            <div className="v2-display font-bold text-[22px]">Hozircha mos e'lon yo'q</div>
            <p className="mt-2 mb-0 text-[#5E5A6B]">Boshqa kategoriyani tanlang yoki keyinroq qayting — yangi e'lonlar har kuni qo'shiladi.</p>
          </div>
        ) : (
          <div className="mt-7 grid gap-5 grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
            {visible.map((b) => (
              <BriefCard key={b.id} brief={b} />
            ))}
          </div>
        )}
        {!showAll && filtered.length > visible.length && (
          <div className="mt-7 text-center">
            <button type="button" onClick={() => setShowAll(true)} className="min-h-[48px] px-6 rounded-[14px] border-[1.5px] border-[#14121C] font-bold cursor-pointer hover:bg-[#14121C] hover:text-white transition-colors">
              Barcha e'lonlar ({filtered.length})
            </button>
          </div>
        )}
      </section>

      {/* BLOGERLAR VITRINASI */}
      {showcase.creators.length >= 4 && (
        <Reveal className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-10 pb-2">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-[13px] font-bold tracking-[2px] text-[#5B3DF5]">BLOGERLAR</div>
              <h2 className="v2-display mt-2 mb-0 font-extrabold text-[26px] sm:text-[44px] tracking-[-1.5px] leading-[1.05]">Ular allaqachon biz bilan. Siz-chi?</h2>
            </div>
            <a href="#brendlar-uchun" className="font-bold text-[#4329D9] inline-flex items-center gap-1.5">Bloger bazasi statistikasi {Icon.arrow(14)}</a>
          </div>
          <div className="mt-6 -mx-4 sm:mx-0"><CreatorMarquee creators={showcase.creators} /></div>
        </Reveal>
      )}

      {/* BRANDS */}
      <Reveal>
      <section id="brendlar" className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-14 pb-6 scroll-mt-24">
        <div className="text-[10px] md:text-[13px] font-bold tracking-[1px] md:tracking-[2px] text-[#5B3DF5]">BRENDLAR</div>
        <h2 className="v2-display mt-2 mb-0 font-extrabold text-[32px] sm:text-[44px] tracking-[-1.5px] leading-[1.05]">Collabix'dagi brendlar</h2>
        {brands.length === 0 ? (
          <p className="mt-4 text-[#5E5A6B]">Brendlar e'lon joylagach shu yerda ko'rinadi.</p>
        ) : (
          <div className="mt-7 grid gap-3.5 grid-cols-[repeat(auto-fill,minmax(170px,1fr))]">
            {brands.slice(0, 12).map((r) => (
              <a key={r.id} href={`#brend-${encodeURIComponent(r.id)}`} className="rounded-[22px] bg-white border border-[#E6E3DC] p-5 flex flex-col gap-3 hover:border-[#14121C] transition-colors">
                <Avatar name={r.name} src={r.avatar} size={56} />
                <div className="min-w-0">
                  <div className="font-bold truncate">{r.name}</div>
                  <div className="text-[13px] text-[#5E5A6B] truncate">{r.category}</div>
                </div>
                <div className="text-[13px] font-bold text-[#4329D9]">{r.openCount > 0 ? `${r.openCount} ta ochiq e'lon` : "Hozir e'lon yo'q"}</div>
              </a>
            ))}
          </div>
        )}
      </section>

      </Reveal>

      {/* HOW IT WORKS */}
      <Reveal>
      <section id="qanday" className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-16 pb-6">
        <div className="rounded-[36px] bg-[#14121C] text-white px-6 sm:px-12 py-12 sm:py-14">
          <div className="text-[10px] md:text-[13px] font-bold tracking-[1px] md:tracking-[2px] text-[#C8F169]">QANDAY ISHLAYDI</div>
          <h2 className="v2-display mt-2 mb-0 max-w-[720px] font-extrabold text-[32px] sm:text-[44px] tracking-[-1.5px] leading-[1.05]">3 qadam — va brendlar bilan ishlay boshlaysiz</h2>
          <div className="mt-10 grid gap-4 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
            {[
              ['01', 'Savollarga javob bering', "Ro'yxatdan o'tish — bir nechta oddiy savol. 2 daqiqada profilingiz tayyor.", '#1F1C29', '#C8F169', '#BDB8CC'],
              ['02', 'Admin profilingizni tasdiqlaydi', "Har bir profil tekshiriladi — brendlar faqat haqiqiy blogerlarni ko'radi.", '#1F1C29', '#C8F169', '#BDB8CC'],
              ['03', 'Ariza yuboring, javobni kuzating', '"Mening arizalarim"da holatni ko\'rasiz: kutilmoqda, qabul qilindi yoki rad etildi.', '#5B3DF5', '#FFFFFF', '#E4DEFF'],
            ].map(([n, t, d, bg, nc, dc]) => (
              <div key={n} className="rounded-3xl p-7" style={{ background: bg }}>
                <div className="v2-display font-extrabold text-[56px] leading-none" style={{ color: nc }}>{n}</div>
                <div className="mt-4 font-bold text-[20px]">{t}</div>
                <p className="mt-2 mb-0 text-[15px]" style={{ color: dc }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      </Reveal>

      {/* PRICING */}
      <section id="narxlar" className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-10 md:pt-16 pb-4 grid gap-3 md:gap-5 grid-cols-2 scroll-mt-24">
        <div className="min-w-0 flex flex-col rounded-[22px] md:rounded-[32px] bg-white border border-[#E6E3DC] p-4 md:p-10">
          <div className="text-[10px] md:text-[13px] font-bold tracking-[1px] md:tracking-[2px] text-[#5E5A6B]">BLOGERLAR UCHUN</div>
          <div className="v2-display mt-2 md:mt-3 font-extrabold text-[16px] md:text-[34px] tracking-[-0.3px] md:tracking-[-1px] leading-[1.15]">E'lonlarga ariza yuboring</div>
          <div className="v2-display mt-3 md:mt-5 font-extrabold text-[26px] md:text-[44px] tracking-[-1px] md:tracking-[-1.5px] leading-none">59 000 <span className="block md:inline text-[12px] md:text-[20px] font-bold text-[#5E5A6B]">so'm / oy</span></div>
          <ul className="mt-3 md:mt-5 mb-0 p-0 list-none flex flex-col gap-1.5 md:gap-2.5 text-[12px] md:text-[15px] leading-snug">
            {['Barcha ochiq e\'lonlarga ariza', 'Ariza holatini kuzatish', "Do'st taklif qilib 29 000 so'm ishlang"].map((t) => (
              <li key={t} className="flex gap-1.5 md:gap-2.5 items-start md:items-center"><span className="text-[#15803D]">{Icon.check(14)}</span>{t}</li>
            ))}
          </ul>
          <div className="h-4 md:h-7 shrink-0" />
          <a href={currentUser ? '#arizalarim' : '#royxat'} className={`${btn.dark} mt-auto w-full min-h-[44px] md:min-h-[52px] !text-[13px] md:!text-[15px] !px-2`}>Bloger sifatida boshlash</a>
        </div>
        <div className="min-w-0 flex flex-col rounded-[22px] md:rounded-[32px] bg-[#5B3DF5] text-white p-4 md:p-10">
          <div className="text-[10px] md:text-[13px] font-bold tracking-[1px] md:tracking-[2px] text-[#E4DEFF]">BRENDLAR UCHUN</div>
          <div className="v2-display mt-2 md:mt-3 font-extrabold text-[16px] md:text-[34px] tracking-[-0.3px] md:tracking-[-1px] leading-[1.15]">E'lon joylang — blogerlar o'zi keladi</div>
          <div className="v2-display mt-3 md:mt-5 font-extrabold text-[26px] md:text-[44px] tracking-[-1px] md:tracking-[-1.5px] leading-none">Bepul <span className="block md:inline text-[12px] md:text-[20px] font-bold text-[#E4DEFF]">obunasiz</span></div>
          <ul className="mt-3 md:mt-5 mb-0 p-0 list-none flex flex-col gap-1.5 md:gap-2.5 text-[12px] md:text-[15px] leading-snug">
            {["Ochiq e'lonlar joylash", 'Arizalarni qabul qilish yoki rad etish', 'Faqat admin tekshirgan blogerlar'].map((t) => (
              <li key={t} className="flex gap-1.5 md:gap-2.5 items-start md:items-center"><span className="text-[#C8F169]">{Icon.check(14)}</span>{t}</li>
            ))}
          </ul>
          <div className="h-4 md:h-7 shrink-0" />
          <button type="button" onClick={() => go(currentUser ? (currentUser.role === 'brend' ? 'yangi-elon' : '') : 'royxat')} className="mt-auto w-full min-h-[44px] md:min-h-[52px] rounded-xl bg-white text-[#14121C] text-[13px] md:text-[15px] px-2 font-bold cursor-pointer hover:bg-[#F6F5F1]">
            Brend sifatida boshlash
          </button>
        </div>
      </section>
    </div>
  );
};
