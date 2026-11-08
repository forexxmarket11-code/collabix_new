import React, { useMemo, useState } from 'react';
import { BriefData, BriefApplication, UserSession, NotificationItem } from '../types';
import type { WorkflowAction } from '../firebase';
import { markAllNotificationsAsReadInFirestore } from '../firebase';
import { isUserPro } from '../utils/subscription';
import { ReferralDashboard } from '../components/ReferralDashboard';
import { Avatar, Pill, Icon, btn, go, appStatus, isBriefOpen, reviewState, budgetText } from './ui';
import { BriefCard, brandsFromBriefs, CATEGORY_LIST } from './V2Home';
import { V2Applications, ReviewBanner } from './V2Applications';
import { wfStage, WF_STAGE_LABEL } from './Workflow';

export type DeskTab = 'home' | 'catalog' | 'applications' | 'wallet' | 'brands' | 'notif';
export const DESK_HASH: Record<DeskTab, string> = {
  home: 'kabinet',
  catalog: 'kabinet-elonlar',
  applications: 'arizalarim',
  wallet: 'hamyon',
  brands: 'kabinet-brendlar',
  notif: 'bildirishnomalar',
};

interface Props {
  tab: DeskTab;
  currentUser: UserSession;
  briefs: BriefData[];
  notifications: NotificationItem[];
  onOpenEditProfile: () => void;
  onOpenProfile: () => void;
  onOpenPro: () => void;
  onOpenRegister: () => void;
  onContactBrand: (brief: BriefData) => void;
  onResubmit: () => Promise<void>;
  onWorkflow: (brief: BriefData, app: BriefApplication, action: WorkflowAction) => Promise<void>;
}

const num = (v: unknown) => Number(String(v ?? '').replace(/[^\d]/g, '')) || 0;
const fmt = (n: number) => Math.round(n).toLocaleString('ru-RU').replace(/,/g, ' ');
const low = (s: unknown) => String(s ?? '').toLowerCase().trim();

const s = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
const ICONS: Record<DeskTab | 'profile', React.ReactNode> = {
  home: <svg {...s}><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>,
  catalog: <svg {...s}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M8 4v5" /></svg>,
  applications: <svg {...s}><path d="M9 11l3 3 8-8" /><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9" /></svg>,
  wallet: <svg {...s}><path d="M3 7a2 2 0 0 1 2-2h13v4" /><path d="M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2z" /><circle cx="16" cy="14.5" r="1.4" /></svg>,
  brands: <svg {...s}><path d="M4 21V8l8-5 8 5v13" /><path d="M9 21v-6h6v6" /></svg>,
  notif: <svg {...s}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>,
  profile: <svg {...s}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" /></svg>,
};

/** Bloger uchun e'lon qanchalik mos (0–100) */
function matchScore(b: BriefData, u: UserSession): number {
  let score = 30;
  const cats = (u.categories || []).map(low);
  const bcats = [b.category, ...((b as any).categories || [])].map(low).filter(Boolean);
  if (bcats.some((c) => cats.some((x) => x && (c.includes(x) || x.includes(c))))) score += 40;
  const city = low(u.city);
  const bcity = low((b as any).city || (b as any).location);
  if (!bcity || bcity.includes('butun') || (city && bcity.includes(city))) score += 18;
  const myPrice = num(u.priceRange?.min);
  const top = num(b.budgetMax || b.budgetMin);
  if (!myPrice || !top || top >= myPrice) score += 10;
  return Math.min(99, score);
}

export const V2CreatorDesk: React.FC<Props> = (p) => {
  const { tab, currentUser: u, briefs, notifications } = p;
  const uid = u.uid || '';
  const pro = isUserPro(u);
  const st = reviewState(u);
  const daysLeft = u.trialEndDate ? Math.max(0, Math.ceil((Date.parse(u.trialEndDate) - Date.now()) / 86400000)) : 0;

  const mine = useMemo(() => {
    const rows: { brief: BriefData; app: BriefApplication }[] = [];
    briefs.forEach((b) => {
      const a = [...(b.applications || [])].reverse().find((x) => x.creatorId === uid);
      if (a) rows.push({ brief: b, app: a });
    });
    return rows;
  }, [briefs, uid]);
  const accepted = mine.filter((r) => appStatus(r.app) === 'ok');
  const working = accepted.filter((r) => wfStage(r.app) !== 'done');
  const done = accepted.filter((r) => wfStage(r.app) === 'done');
  const totalViews = done.reduce((sum, r) => sum + (r.app.workflow?.reels?.views || 0), 0);
  const tasks = accepted
    .map((r) => ({ ...r, st: wfStage(r.app) }))
    .filter((r) => r.st === 'script' || r.st === 'draft' || r.st === 'reels' || r.st === 'script_wait' || r.st === 'draft_wait');
  const myTasks = tasks.filter((t) => t.st === 'script' || t.st === 'draft' || t.st === 'reels');
  const appliedIds = new Set(mine.map((r) => r.brief.id));
  const openBriefs = briefs.filter(isBriefOpen);
  const matched = openBriefs
    .filter((b) => !appliedIds.has(b.id) && (b.brandId || b.ownerId) !== uid)
    .map((b) => ({ b, score: matchScore(b, u) }))
    .sort((a, b) => b.score - a.score || Number(b.b.createdAtMillis || 0) - Number(a.b.createdAtMillis || 0));
  const priceOf = (r: { brief: BriefData; app: BriefApplication }) => num(r.app.proposedPrice) || num(r.brief.budgetMin || r.brief.budgetMax);
  const earnDone = done.reduce((sum, r) => sum + priceOf(r), 0);
  const earnWork = working.reduce((sum, r) => sum + priceOf(r), 0);
  const unread = notifications.filter((n) => !n.read).length;
  const referralBalance = Number((u as any).referralBalance || 0);

  const NAV: [DeskTab | 'profile', string, number?][] = [
    ['home', 'Asosiy'],
    ['catalog', "E'lonlar katalogi", matched.length || undefined],
    ['applications', 'Arizalarim', myTasks.length || undefined],
    ['wallet', 'Hamyon'],
    ['brands', 'Brendlar katalogi'],
    ['notif', 'Bildirishnomalar', unread || undefined],
    ['profile', 'Profil'],
  ];
  const nav = (id: DeskTab | 'profile') => (id === 'profile' ? p.onOpenProfile() : go(DESK_HASH[id]));
  const TITLES: Record<DeskTab, string> = { home: '', catalog: "E'lonlar katalogi", applications: 'Arizalarim', wallet: 'Hamyon', brands: 'Brendlar katalogi', notif: 'Bildirishnomalar' };

  /* ------------------------------ ASOSIY ------------------------------ */
  const statCards = (
    <div className="grid gap-2.5 sm:gap-3 grid-cols-2 lg:grid-cols-4">
      <div className="rounded-[20px] bg-white border border-[#E6E3DC] p-4"><div className="text-[12px] sm:text-[13px] text-[#5E5A6B] font-semibold">Yuborilgan arizalar</div><div className="v2-display font-extrabold text-[28px] sm:text-[34px]">{mine.length}</div></div>
      <div className="rounded-[20px] bg-[#C8F169] p-4"><div className="text-[12px] sm:text-[13px] font-bold">Qabul qilingan</div><div className="v2-display font-extrabold text-[28px] sm:text-[34px]">{accepted.length}</div></div>
      <div className="rounded-[20px] bg-white border border-[#E6E3DC] p-4"><div className="text-[12px] sm:text-[13px] text-[#5E5A6B] font-semibold">Ishdagi loyihalar</div><div className="v2-display font-extrabold text-[28px] sm:text-[34px]">{working.length}</div></div>
      <div className="rounded-[20px] bg-[#14121C] text-white p-4"><div className="text-[12px] sm:text-[13px] text-[#BDB8CC] font-semibold">Jami ko'rishlar</div><div className="v2-display font-extrabold text-[28px] sm:text-[34px]">{fmt(totalViews)}</div></div>
    </div>
  );

  const taskBox = (
    <section className="flex-[999_1_440px] min-w-0 rounded-[24px] sm:rounded-[28px] bg-white border border-[#E6E3DC] overflow-hidden">
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-[#EEECE6] flex items-center justify-between gap-3">
        <h2 className="v2-display m-0 font-extrabold text-[19px] sm:text-[22px] tracking-[-0.5px]">Bugungi vazifalar</h2>
        <Pill tone={myTasks.length ? 'amber' : 'gray'}>{myTasks.length} ta</Pill>
      </div>
      {tasks.length === 0 ? (
        <div className="px-6 py-9 text-center text-[#5E5A6B] text-[15px]">
          Hozircha vazifa yo'q. Brend arizangizni qabul qilsa, ssenariy, video va Reels bosqichlari shu yerda chiqadi.
        </div>
      ) : (
        tasks.slice(0, 5).map(({ brief, app, st: ws }) => {
          const idx = ws === 'script' || ws === 'script_wait' ? 1 : ws === 'draft' || ws === 'draft_wait' ? 2 : 3;
          const mineTurn = ws === 'script' || ws === 'draft' || ws === 'reels';
          const label = ws === 'script' ? 'Ssenariy yozing — brend kutmoqda' : ws === 'draft' ? 'Videoni tayyorlab, draft yuboring' : ws === 'reels' ? "Video tasdiqlandi — Reels'ni joylang" : WF_STAGE_LABEL[ws];
          const action = ws === 'script' ? 'Ssenariy yozish' : ws === 'draft' ? 'Draft yuborish' : ws === 'reels' ? 'Reels havolasi' : "Ko'rish";
          return (
            <div key={`${brief.id}-${app.id}`} className="px-4 sm:px-6 py-4 border-b border-[#EEECE6] last:border-b-0 flex flex-wrap gap-3 sm:gap-3.5 items-center">
              <Avatar name={brief.brandName} src={brief.brandAvatar} size={44} />
              <div className="flex-[999_1_200px] min-w-0">
                <div className="text-[12px] sm:text-[13px] text-[#5E5A6B] font-semibold truncate">{brief.brandName || 'Brend'} · {brief.taskTitle}</div>
                <div className="font-bold text-[15px] sm:text-[16px]">{label}</div>
                <div className="mt-2 grid grid-cols-4 gap-1 max-w-[260px]">
                  {[0, 1, 2, 3].map((i) => <div key={i} className={`h-1.5 rounded-full ${i < idx ? 'bg-[#22C55E]' : i === idx ? (mineTurn ? 'bg-[#5B3DF5]' : 'bg-[#D97706]') : 'bg-[#E6E3DC]'}`} />)}
                </div>
              </div>
              <button type="button" onClick={() => go('arizalarim')} className={`${mineTurn ? btn.violet : btn.ghost} w-full sm:w-auto`}>{action}</button>
            </div>
          );
        })
      )}
    </section>
  );

  const walletMini = (
    <section className="flex-[1_1_280px] min-w-0 rounded-[24px] sm:rounded-[28px] bg-[#14121C] text-white p-5 sm:p-6 relative overflow-hidden">
      <div className="absolute -right-14 -bottom-16 w-44 h-44 rounded-full bg-[#5B3DF5] opacity-80" aria-hidden="true" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <h2 className="v2-display m-0 font-extrabold text-[20px] sm:text-[22px]">Hamyon</h2>
          <button type="button" onClick={() => go('hamyon')} className="text-[#C8F169] font-bold text-[14px] cursor-pointer min-h-[40px]">Batafsil</button>
        </div>
        <div className="mt-3 text-[12px] sm:text-[13px] text-[#BDB8CC] font-semibold">Referal balansi</div>
        <div className="v2-display font-extrabold text-[30px] sm:text-[36px] leading-[1.1]">{fmt(referralBalance)} <span className="text-[15px] text-[#BDB8CC]">so'm</span></div>
        <div className="mt-3 pt-3 border-t border-white/10 flex justify-between gap-3 text-[14px]"><span className="text-[#BDB8CC]">Kelishilgan daromad</span><span className="font-bold">{fmt(earnDone + earnWork)} so'm</span></div>
        <button type="button" onClick={() => go('hamyon')} className={`${btn.lime} mt-4 w-full min-h-[48px]`}>Kartaga yechib olish</button>
      </div>
    </section>
  );

  const matchedGrid = (list: { b: BriefData; score: number }[]) => (
    <div className="grid gap-3 sm:gap-3.5 grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(270px,1fr))]">
      {list.map(({ b, score }) => (
        <div key={b.id} className="relative">
          {score >= 70 && <span className={`absolute z-10 top-3 right-3 px-2 py-0.5 rounded-full text-[11px] font-extrabold ${score >= 85 ? 'bg-[#C8F169] text-[#14121C]' : 'bg-[#EDE9FE] text-[#3B1FB8]'}`}>{score}% mos</span>}
          <BriefCard brief={b} />
        </div>
      ))}
    </div>
  );

  const homeView = (
    <>
      {statCards}
      <div className="mt-4 sm:mt-5 flex flex-wrap gap-3 sm:gap-4 items-start">
        {taskBox}
        {walletMini}
      </div>
      <section className="mt-7">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            {(u.categories || []).length > 0 && <div className="text-[12px] font-bold tracking-[2px] text-[#5B3DF5] uppercase">{[(u.categories || [])[0], u.city].filter(Boolean).join(' · ')}</div>}
            <h2 className="v2-display mt-1 mb-0 font-extrabold text-[24px] sm:text-[30px] tracking-[-1px]">Sizga mos e'lonlar</h2>
          </div>
          <button type="button" onClick={() => go(DESK_HASH.catalog)} className="font-bold text-[#4329D9] min-h-[40px] cursor-pointer">Katalogni ochish</button>
        </div>
        <div className="mt-4">
          {matched.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#D6D2C8] bg-white/60 py-10 px-6 text-center text-[#5E5A6B]">Hozircha yangi e'lon yo'q — yangilari chiqishi bilan shu yerda ko'rinadi.</div>
          ) : matchedGrid(matched.slice(0, 3))}
        </div>
      </section>
      {mine.length > 0 && (
        <section className="mt-7 rounded-[24px] sm:rounded-[28px] bg-white border border-[#E6E3DC] overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-[#EEECE6] flex items-center justify-between">
            <h2 className="v2-display m-0 font-extrabold text-[19px] sm:text-[22px]">So'nggi arizalar</h2>
            <button type="button" onClick={() => go('arizalarim')} className="font-bold text-[#4329D9] text-[14px] min-h-[40px] cursor-pointer">Hammasi</button>
          </div>
          {mine.slice(0, 4).map(({ brief, app }) => {
            const a = appStatus(app);
            return (
              <a key={brief.id} href={`#elon-${encodeURIComponent(brief.id)}`} className="px-4 sm:px-6 py-3.5 border-b border-[#EEECE6] last:border-b-0 flex flex-wrap items-center gap-3 hover:bg-[#FAFAF7]">
                <span className="flex-[999_1_200px] min-w-0 font-semibold truncate">{brief.taskTitle} <span className="text-[#5E5A6B] font-normal">· {brief.brandName}</span></span>
                {a === 'ok' ? <Pill tone="green">Qabul qilindi</Pill> : a === 'no' ? <Pill tone="red">Rad etildi</Pill> : <Pill tone="amber">Kutilmoqda</Pill>}
              </a>
            );
          })}
        </section>
      )}
    </>
  );

  /* ------------------------------ KATALOG ------------------------------ */
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [onlyMatch, setOnlyMatch] = useState(false);
  const [sort, setSort] = useState<'match' | 'new' | 'budget'>('match');
  const catalogList = useMemo(() => {
    let list = openBriefs.filter((b) => (b.brandId || b.ownerId) !== uid).map((b) => ({ b, score: matchScore(b, u) }));
    const qq = low(q);
    if (qq) list = list.filter(({ b }) => [b.taskTitle, b.brandName, b.description, b.category].some((x) => low(x).includes(qq)));
    if (cat) list = list.filter(({ b }) => low(b.category).includes(low(cat)) || (b.formats || []).some((f) => low(f).includes(low(cat))));
    if (onlyMatch) list = list.filter(({ score }) => score >= 70);
    list.sort((a, b) => sort === 'match' ? b.score - a.score : sort === 'budget' ? num(b.b.budgetMax || b.b.budgetMin) - num(a.b.budgetMax || a.b.budgetMin) : Number(b.b.createdAtMillis || 0) - Number(a.b.createdAtMillis || 0));
    return list;
  }, [openBriefs, q, cat, onlyMatch, sort, uid, u]);
  const catalogView = (
    <>
      <div className="flex flex-wrap gap-2.5 items-center">
        <label className="flex-[999_1_240px]">
          <span className="v2-sr">E'lon qidirish</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="E'lon yoki brend qidirish" className="w-full box-border min-h-[48px] px-4 rounded-2xl border-[1.5px] border-[#E6E3DC] bg-white text-[15px] outline-none focus:border-[#5B3DF5]" />
        </label>
        <label className="flex-[1_1_160px]">
          <span className="v2-sr">Saralash</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="w-full min-h-[48px] px-3 rounded-2xl border-[1.5px] border-[#E6E3DC] bg-white text-[15px] font-semibold">
            <option value="match">Eng mos</option>
            <option value="new">Eng yangi</option>
            <option value="budget">Byudjet bo'yicha</option>
          </select>
        </label>
      </div>
      <div className="mt-3 -mx-4 px-4 sm:mx-0 sm:px-0 flex gap-2 overflow-x-auto pb-1">
        <button type="button" aria-pressed={onlyMatch} onClick={() => setOnlyMatch(!onlyMatch)} className={`shrink-0 min-h-[40px] px-3.5 rounded-full text-[14px] font-bold border cursor-pointer ${onlyMatch ? 'bg-[#C8F169] border-[#C8F169]' : 'bg-white border-[#E6E3DC]'}`}>Menga mos</button>
        {['', ...CATEGORY_LIST].map((c) => (
          <button key={c || 'all'} type="button" aria-pressed={cat === c} onClick={() => setCat(c)} className={`shrink-0 min-h-[40px] px-3.5 rounded-full text-[14px] font-semibold border cursor-pointer ${cat === c ? 'bg-[#14121C] text-white border-[#14121C]' : 'bg-white border-[#E6E3DC]'}`}>{c || 'Hammasi'}</button>
        ))}
      </div>
      <div className="mt-2 text-[14px] text-[#5E5A6B]">{catalogList.length} ta ochiq e'lon</div>
      <div className="mt-3">
        {catalogList.length === 0 ? <div className="rounded-3xl border border-dashed border-[#D6D2C8] bg-white/60 py-12 px-6 text-center text-[#5E5A6B]">Bu filtr bo'yicha e'lon topilmadi.</div> : matchedGrid(catalogList)}
      </div>
    </>
  );

  /* ------------------------------ HAMYON ------------------------------ */
  const walletView = (
    <>
      <div className="grid gap-3 sm:gap-3.5 grid-cols-1 md:grid-cols-2">
        <section className="rounded-[24px] sm:rounded-[28px] bg-white border border-[#E6E3DC] p-5 sm:p-6">
          <div className="text-[12px] font-bold tracking-[1.5px] text-[#5E5A6B]">KELISHILGAN DAROMAD</div>
          <div className="mt-1.5 v2-display font-extrabold text-[34px] sm:text-[42px] leading-none">{fmt(earnDone + earnWork)} <span className="text-[16px] text-[#5E5A6B]">so'm</span></div>
          <div className="mt-2 text-[14px] text-[#5E5A6B]">Qabul qilingan {accepted.length} ta ish bo'yicha</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Pill tone="green">Bajarildi: {fmt(earnDone)}</Pill>
            <Pill tone="amber">Jarayonda: {fmt(earnWork)}</Pill>
          </div>
          {accepted.length > 0 && (
            <div className="mt-4 border-t border-[#EEECE6]">
              {accepted.map((r) => (
                <div key={r.brief.id} className="py-2.5 border-b border-[#EEECE6] last:border-b-0 flex items-center justify-between gap-3 text-[14px]">
                  <span className="min-w-0 truncate font-semibold">{r.brief.brandName} · <span className="font-normal text-[#5E5A6B]">{r.brief.taskTitle}</span></span>
                  <span className="shrink-0 font-extrabold">{priceOf(r) ? fmt(priceOf(r)) : budgetText(r.brief)}</span>
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 mb-0 text-[12px] text-[#5E5A6B]">Bu hisob uchun: pulni brend sizga to'g'ridan-to'g'ri to'laydi.</p>
        </section>
        <section className={`rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 ${pro ? 'bg-[#14121C] text-white' : 'bg-[#C8F169]'}`}>
          <div className={`text-[12px] font-bold tracking-[1.5px] ${pro ? 'text-[#BDB8CC]' : ''}`}>PRO OBUNA</div>
          <div className="mt-1.5 v2-display font-extrabold text-[28px] sm:text-[34px] leading-tight">{pro ? `Faol · ${daysLeft} kun qoldi` : "Pro yoqilmagan"}</div>
          <div className={`mt-2 text-[14px] ${pro ? 'text-[#BDB8CC]' : 'text-[#3E3A4A]'}`}>{pro ? (u.trialEndDate ? `${new Date(u.trialEndDate).toLocaleDateString('ru-RU')} gacha · 59 000 so'm/oy` : '') : "59 000 so'm/oy — barcha e'lonlarga ariza va referal daromadi"}</div>
          {!pro && <button type="button" onClick={p.onOpenPro} className={`${btn.dark} mt-4 min-h-[48px]`}>Pro'ni yoqish</button>}
          {pro && <div className="mt-4 h-2.5 rounded-full bg-[#2A2636] overflow-hidden"><div className="h-full bg-[#C8F169] rounded-full" style={{ width: `${Math.max(4, Math.min(100, (daysLeft / 30) * 100))}%` }} /></div>}
        </section>
      </div>
      <div className="mt-6">
        <ReferralDashboard currentUser={u} onOpenRegister={p.onOpenRegister} onOpenProModal={p.onOpenPro} />
      </div>
    </>
  );

  /* ------------------------------ BRENDLAR ------------------------------ */
  const brands = useMemo(() => brandsFromBriefs(briefs), [briefs]);
  const brandsView = brands.length === 0 ? (
    <div className="rounded-3xl border border-dashed border-[#D6D2C8] bg-white/60 py-12 px-6 text-center text-[#5E5A6B]">Hozircha brendlar yo'q.</div>
  ) : (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
      {brands.map((b) => (
        <a key={b.id} href={`#brend-${encodeURIComponent(b.id)}`} className="rounded-3xl bg-white border border-[#E6E3DC] p-5 flex items-center gap-3.5 hover:border-[#14121C] transition-colors">
          <Avatar name={b.name} src={b.avatar} size={52} />
          <div className="min-w-0">
            <div className="font-bold truncate">{b.name}</div>
            <div className="text-[13px] text-[#5E5A6B]">{b.openCount} ta ochiq e'lon{b.category ? ` · ${b.category}` : ''}</div>
          </div>
          <span className="ml-auto text-[#8A8597]">{Icon.arrow(14)}</span>
        </a>
      ))}
    </div>
  );

  /* ------------------------------ BILDIRISHNOMALAR ------------------------------ */
  const notifView = (
    <section className="rounded-[24px] sm:rounded-[28px] bg-white border border-[#E6E3DC] overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-[#EEECE6] flex items-center justify-between gap-3">
        <div className="font-bold">{unread ? `${unread} ta o'qilmagan` : "Hammasi o'qilgan"}</div>
        {unread > 0 && <button type="button" onClick={() => { markAllNotificationsAsReadInFirestore(uid).catch(() => {}); }} className={btn.ghost}>Hammasini o'qilgan qilish</button>}
      </div>
      {notifications.length === 0 ? (
        <div className="px-6 py-10 text-center text-[#5E5A6B]">Bildirishnomalar yo'q.</div>
      ) : (
        [...notifications]
          .sort((a, b) => (Number(b.createdAtMillis) || Date.parse(b.createdAt) || 0) - (Number(a.createdAtMillis) || Date.parse(a.createdAt) || 0))
          .slice(0, 60)
          .map((n) => (
            <button key={n.id} type="button" onClick={() => go(n.briefId ? 'arizalarim' : DESK_HASH.home)} className={`w-full text-left px-4 sm:px-6 py-4 border-b border-[#EEECE6] last:border-b-0 flex gap-3 items-start cursor-pointer hover:bg-[#FAFAF7] ${n.read ? '' : 'bg-[#F5F3FF]'}`}>
              <span className={`mt-1.5 w-2.5 h-2.5 shrink-0 rounded-full ${n.read ? 'bg-[#D6D2C8]' : 'bg-[#5B3DF5]'}`} />
              <span className="min-w-0">
                <span className="block font-bold">{n.title}</span>
                <span className="block text-[14px] text-[#3E3A4A] break-words">{n.message}</span>
                <span className="block mt-0.5 text-[12px] text-[#8A8597]">{new Date(Number(n.createdAtMillis) || Date.parse(n.createdAt) || Date.now()).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
              </span>
            </button>
          ))
      )}
    </section>
  );

  const body =
    tab === 'catalog' ? catalogView
    : tab === 'applications' ? (
      <V2Applications embedded currentUser={u} briefs={briefs} onOpenEditProfile={p.onOpenEditProfile} onOpenPro={p.onOpenPro} onContactBrand={p.onContactBrand} onResubmit={p.onResubmit} onWorkflow={p.onWorkflow} />
    )
    : tab === 'wallet' ? walletView
    : tab === 'brands' ? brandsView
    : tab === 'notif' ? notifView
    : homeView;

  return (
    <div className="flex min-h-[calc(100vh-70px)]">
      {/* Kompyuter: chap menyu */}
      <aside className="hidden md:flex w-[250px] shrink-0 bg-[#14121C] text-white px-4 py-7 flex-col gap-1">
        {NAV.map(([id, label, badge]) => (
          <button key={id} type="button" onClick={() => nav(id)} className={`w-full min-h-[46px] px-3.5 rounded-xl font-semibold flex items-center gap-3 cursor-pointer text-left ${tab === id ? 'bg-[#2A2636] text-white' : 'text-[#BDB8CC] hover:text-white'}`}>
            {ICONS[id]}
            {label}
            {badge ? <span className={`ml-auto min-w-[24px] h-6 px-1.5 rounded-full text-[12px] font-extrabold inline-flex items-center justify-center ${id === 'applications' ? 'bg-[#C8F169] text-[#14121C]' : 'bg-[#5B3DF5] text-white'}`}>{badge}</span> : null}
          </button>
        ))}
        <div className="mt-5 rounded-2xl bg-[#5B3DF5] p-4">
          <div className="flex items-center justify-between"><span className="font-extrabold text-[15px]">{pro ? 'Pro faol' : 'Pro yoqilmagan'}</span>{pro && <span className="px-2 py-0.5 rounded-full bg-[#C8F169] text-[#14121C] text-[11px] font-extrabold">PRO</span>}</div>
          <div className="mt-0.5 text-[13px] text-[#E4DEFF]">{pro ? `${daysLeft} kun qoldi` : "59 000 so'm/oy"}</div>
          {pro ? (
            <div className="mt-2.5 h-1.5 rounded-full bg-white/25 overflow-hidden"><div className="h-full bg-[#C8F169]" style={{ width: `${Math.max(4, Math.min(100, (daysLeft / 30) * 100))}%` }} /></div>
          ) : (
            <button type="button" onClick={p.onOpenPro} className={`${btn.lime} mt-3 w-full min-h-[40px] text-[14px]`}>Yoqish</button>
          )}
        </div>
      </aside>

      <main className="flex-1 min-w-0 px-4 sm:px-8 pt-5 md:pt-8 pb-28 md:pb-16">
        {/* Sarlavha */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {tab === 'home' ? (
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <Avatar name={u.name} src={u.avatar} size={52} round />
              <div className="min-w-0">
                <div className="text-[13px] sm:text-[14px] text-[#5E5A6B] font-semibold">Xayrli kun,</div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="v2-display m-0 font-extrabold text-[28px] sm:text-[38px] tracking-[-1.2px] leading-[1.05] truncate">{(u.name || '').split(' ')[0] || u.name}</h1>
                  {st === 'approved' ? <Pill tone="green">{Icon.check(12)} Tasdiqlangan</Pill> : st === 'pending' ? <Pill tone="amber">Tekshiruvda</Pill> : <Pill tone="red">Tasdiqlanmagan</Pill>}
                  {pro && <span className="md:hidden px-2 py-0.5 rounded-full bg-[#14121C] text-[#C8F169] text-[11px] font-extrabold">PRO · {daysLeft} kun</span>}
                </div>
              </div>
            </div>
          ) : (
            <h1 className="v2-display m-0 font-extrabold text-[28px] sm:text-[40px] tracking-[-1.4px] leading-[1.05]">{TITLES[tab]}</h1>
          )}
          {tab === 'home' && (
            <button type="button" onClick={() => go(DESK_HASH.catalog)} className={`${btn.dark} hidden sm:inline-flex min-h-[48px]`}>{Icon.search(16)} E'lon qidirish</button>
          )}
        </div>

        {/* Telefon: bo'limlar */}
        <div className="md:hidden -mx-4 px-4 mt-4 flex gap-2 overflow-x-auto pb-1">
          {NAV.filter(([id]) => id !== 'profile').map(([id, label, badge]) => (
            <button key={id} type="button" onClick={() => nav(id)} className={`shrink-0 min-h-[40px] px-3.5 rounded-full text-[14px] font-semibold border inline-flex items-center gap-1.5 cursor-pointer ${tab === id ? 'bg-[#14121C] text-white border-[#14121C]' : 'bg-white border-[#E6E3DC]'}`}>
              {id === 'catalog' ? "E'lonlar" : id === 'brands' ? 'Brendlar' : label}
              {badge ? <span className="min-w-[20px] h-5 px-1 rounded-full bg-[#C8F169] text-[#14121C] text-[11px] font-extrabold inline-flex items-center justify-center">{badge}</span> : null}
            </button>
          ))}
        </div>

        {st !== 'approved' && (tab === 'home' || tab === 'applications') && (
          <div className="mt-4"><ReviewBanner user={u} onEdit={p.onOpenEditProfile} onResubmit={p.onResubmit} /></div>
        )}

        <div className="mt-4 sm:mt-6">{body}</div>
      </main>
    </div>
  );
};
