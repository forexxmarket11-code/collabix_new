import React, { useMemo, useState } from 'react';
import { BriefData, UserSession } from '../types';
import { Avatar, Pill, Icon, budgetText, timeAgo, btn, go, isBriefOpen } from './ui';

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
  const latest = openBriefs[0];

  return (
    <div>
      {/* HERO */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-10 flex flex-wrap gap-12 items-center">
        <div className="flex-[999_1_520px] min-w-0">
          <div className="inline-flex items-center gap-2.5 pl-2 pr-3.5 py-2 rounded-full bg-white border border-[#E6E3DC] text-[14px] font-semibold">
            <span className="px-2.5 py-0.5 rounded-full bg-[#C8F169] text-[12px] font-bold">YANGI</span>
            150+ bloger allaqachon Collabix'da
          </div>
          <h1 className="v2-display mt-6 mb-0 font-extrabold text-[44px] sm:text-[64px] lg:text-[76px] leading-[0.98] tracking-[-2px] sm:tracking-[-3px]">
            Brendlar e'lon beradi.
            <br />
            <span className="text-[#5B3DF5]">Siz ariza yuborasiz.</span>
          </h1>
          <p className="mt-6 mb-0 max-w-[560px] text-[17px] sm:text-[19px] leading-[1.55] text-[#5E5A6B]">
            O'zbekistondagi brendlarning ochiq reklama e'lonlari bir joyda. Profil oching, mos e'longa ariza yuboring va javobni shu yerda kuzating.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              document.getElementById('elonlar')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="mt-8 max-w-[640px] flex flex-wrap gap-2 p-2 rounded-[20px] bg-white border border-[#E6E3DC] shadow-[0_20px_50px_-24px_rgba(20,18,28,0.25)]"
          >
            <label className="flex-[999_1_240px] min-w-0 flex items-center gap-2.5 px-3.5 min-h-[52px] text-[#5E5A6B]">
              {Icon.search(20)}
              <span className="v2-sr">E'lon yoki brend qidirish</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="E'lon yoki brend qidiring"
                className="flex-1 min-w-0 border-0 outline-none bg-transparent text-[16px] text-[#14121C]"
              />
            </label>
            <button type="submit" className="flex-[1_0_auto] min-h-[52px] px-7 rounded-[14px] bg-[#5B3DF5] hover:bg-[#4A2EE0] text-white font-bold text-[16px] cursor-pointer">
              Qidirish
            </button>
          </form>
          {!currentUser && (
            <div className="mt-5 flex flex-wrap gap-2.5">
              <a href="#royxat" className={btn.dark}>Bloger sifatida boshlash {Icon.arrow(15)}</a>
              <a href="#royxat" className={btn.ghost}>Men brendman</a>
            </div>
          )}
        </div>

        {/* hero visual */}
        <div className="hidden md:block flex-[1_1_400px] min-w-0 relative h-[500px]" aria-hidden="true">
          <div className="absolute inset-[30px_0_0_40px] rounded-[36px] bg-[#14121C] overflow-hidden">
            <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-[#5B3DF5] opacity-85" />
            <div className="absolute -left-16 -bottom-24 w-64 h-64 rounded-full bg-[#C8F169] opacity-90" />
          </div>
          {latest && (
            <div className="absolute left-0 top-[90px] w-[350px] rounded-3xl bg-white p-5 shadow-[0_30px_60px_-20px_rgba(20,18,28,0.45)]">
              <div className="flex items-center gap-3">
                <Avatar name={latest.brandName} src={latest.brandAvatar} size={44} />
                <div className="min-w-0">
                  <div className="font-bold truncate">{latest.brandName || 'Brend'}</div>
                  <div className="text-[13px] text-[#5E5A6B]">{timeAgo(latest)}</div>
                </div>
              </div>
              <div className="v2-display mt-4 font-bold text-[22px] leading-[1.15] line-clamp-2">{latest.taskTitle}</div>
              <div className="mt-4 pt-4 border-t border-[#EEECE6] flex items-end justify-between">
                <div>
                  <div className="text-[12px] text-[#5E5A6B]">Byudjet</div>
                  <div className="v2-display font-extrabold text-[22px]">{budgetText(latest)}</div>
                </div>
                <div className="text-[13px] text-[#5E5A6B] font-semibold">{latest.applications?.length || 0} ta ariza</div>
              </div>
            </div>
          )}
          <div className="absolute right-2 top-10 w-[270px] rounded-[18px] bg-white px-4 py-3.5 flex gap-3 items-center shadow-[0_24px_50px_-20px_rgba(20,18,28,0.5)]">
            <span className="w-10 h-10 shrink-0 rounded-full bg-[#DCFCE7] text-[#15803D] flex items-center justify-center">{Icon.check(20)}</span>
            <div>
              <div className="font-bold text-[15px]">Arizangiz qabul qilindi</div>
              <div className="text-[13px] text-[#5E5A6B]">Brenddan javob keldi</div>
            </div>
          </div>
          <div className="absolute right-8 bottom-12 w-[250px] rounded-[18px] bg-[#C8F169] px-4 py-4 shadow-[0_24px_50px_-20px_rgba(20,18,28,0.5)]">
            <div className="text-[12px] font-bold tracking-[1px]">OCHIQ E'LONLAR</div>
            <div className="v2-display mt-1 font-extrabold text-[30px] leading-none">{openBriefs.length}</div>
            <div className="mt-1 text-[13px] font-semibold">ta e'lon ariza kutmoqda</div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section aria-label="Kategoriyalar" className="max-w-[1240px] mx-auto px-4 sm:px-6">
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
      <section id="elonlar" className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-10 pb-6 scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[13px] font-bold tracking-[2px] text-[#5B3DF5]">OCHIQ E'LONLAR</div>
            <h2 className="v2-display mt-2 mb-0 font-extrabold text-[32px] sm:text-[44px] tracking-[-1.5px] leading-[1.05]">Brendlar hozir bloger qidirmoqda</h2>
          </div>
          <div className="flex gap-1.5 p-1.5 rounded-2xl bg-[#ECEAE4]">
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

      {/* BRANDS */}
      <section id="brendlar" className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-14 pb-6 scroll-mt-24">
        <div className="text-[13px] font-bold tracking-[2px] text-[#5B3DF5]">BRENDLAR</div>
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

      {/* HOW IT WORKS */}
      <section id="qanday" className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-16 pb-6">
        <div className="rounded-[36px] bg-[#14121C] text-white px-6 sm:px-12 py-12 sm:py-14">
          <div className="text-[13px] font-bold tracking-[2px] text-[#C8F169]">QANDAY ISHLAYDI</div>
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

      {/* PRICING */}
      <section id="narxlar" className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-16 pb-4 grid gap-5 grid-cols-[repeat(auto-fit,minmax(300px,1fr))] scroll-mt-24">
        <div className="rounded-[32px] bg-white border border-[#E6E3DC] p-8 sm:p-10">
          <div className="text-[13px] font-bold tracking-[2px] text-[#5E5A6B]">BLOGERLAR UCHUN</div>
          <div className="v2-display mt-3 font-extrabold text-[30px] sm:text-[34px] tracking-[-1px] leading-[1.1]">E'lonlarga ariza yuboring</div>
          <div className="v2-display mt-5 font-extrabold text-[44px] tracking-[-1.5px]">59 000 <span className="text-[20px] font-bold text-[#5E5A6B]">so'm / oy</span></div>
          <ul className="mt-5 p-0 list-none flex flex-col gap-2.5 text-[15px]">
            {['Barcha ochiq e\'lonlarga ariza', 'Ariza holatini kuzatish', "Do'st taklif qilib 29 000 so'm ishlang"].map((t) => (
              <li key={t} className="flex gap-2.5 items-center"><span className="text-[#15803D]">{Icon.check(18)}</span>{t}</li>
            ))}
          </ul>
          <a href={currentUser ? '#arizalarim' : '#royxat'} className={`${btn.dark} mt-7 w-full min-h-[52px]`}>Bloger sifatida boshlash</a>
        </div>
        <div className="rounded-[32px] bg-[#5B3DF5] text-white p-8 sm:p-10">
          <div className="text-[13px] font-bold tracking-[2px] text-[#E4DEFF]">BRENDLAR UCHUN</div>
          <div className="v2-display mt-3 font-extrabold text-[30px] sm:text-[34px] tracking-[-1px] leading-[1.1]">E'lon joylang — blogerlar o'zi keladi</div>
          <div className="v2-display mt-5 font-extrabold text-[44px] tracking-[-1.5px]">99 000 <span className="text-[20px] font-bold text-[#E4DEFF]">so'm / oy</span></div>
          <ul className="mt-5 p-0 list-none flex flex-col gap-2.5 text-[15px]">
            {["Ochiq e'lonlar joylash", 'Arizalarni qabul qilish yoki rad etish', 'Faqat admin tekshirgan blogerlar'].map((t) => (
              <li key={t} className="flex gap-2.5 items-center"><span className="text-[#C8F169]">{Icon.check(18)}</span>{t}</li>
            ))}
          </ul>
          <button type="button" onClick={() => go(currentUser ? (currentUser.role === 'brend' ? 'yangi-elon' : '') : 'royxat')} className="mt-7 w-full min-h-[52px] rounded-xl bg-white text-[#14121C] font-bold cursor-pointer hover:bg-[#F6F5F1]">
            Brend sifatida boshlash
          </button>
        </div>
      </section>
    </div>
  );
};
