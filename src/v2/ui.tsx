import React from 'react';
import { BriefData, UserSession } from '../types';
import { isUserPro } from '../utils/subscription';

/* Collabix v2 — umumiy yordamchilar va kichik UI bo'laklari */

export const C = {
  ink: '#14121C',
  muted: '#5E5A6B',
  ground: '#F6F5F1',
  line: '#E6E3DC',
  violet: '#5B3DF5',
  violetText: '#4329D9',
  violetSoft: '#EEEBFF',
  lime: '#C8F169',
};

const LOGO_BG = ['#FDE68A', '#FECACA', '#BFDBFE', '#C8F169', '#EEEBFF', '#FBCFE8', '#DDD6FE', '#A7F3D0'];

export function colorFor(key: string): string {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return LOGO_BG[h % LOGO_BG.length];
}

export function initialOf(name?: string): string {
  const n = (name || '').trim();
  return n ? n.charAt(0).toUpperCase() : '?';
}

export const Logo: React.FC<{ size?: number; withText?: boolean; light?: boolean }> = ({ size = 38, withText = true, light = false }) => (
  <span className="inline-flex items-center gap-2.5">
    <span
      className="flex items-center justify-center shrink-0"
      style={{ width: size, height: size, borderRadius: size * 0.29, background: C.violet }}
    >
      <svg width={size * 0.63} height={size * 0.63} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="9.5" cy="12" r="5.5" stroke="#fff" strokeWidth="2.4" />
        <circle cx="14.5" cy="12" r="5.5" stroke="#fff" strokeOpacity="0.55" strokeWidth="2.4" />
      </svg>
    </span>
    {withText && (
      <span className="v2-display font-extrabold tracking-tight" style={{ fontSize: size * 0.63, color: light ? '#fff' : C.ink }}>
        Collabix
      </span>
    )}
  </span>
);

/** Brend yoki foydalanuvchi avatari: rasm bo'lsa rasm, bo'lmasa rangli harf */
export const Avatar: React.FC<{ name?: string; src?: string; size?: number; round?: boolean; dark?: boolean }> = ({
  name,
  src,
  size = 44,
  round = false,
  dark = false,
}) => {
  const radius = round ? '50%' : size * 0.28;
  if (src && /^(https?:|data:image)/.test(src)) {
    return <img src={src} alt="" className="object-cover shrink-0" style={{ width: size, height: size, borderRadius: radius }} />;
  }
  return (
    <span
      className="v2-display font-extrabold flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        fontSize: size * 0.4,
        background: dark ? C.ink : colorFor(name || '?'),
        color: dark ? '#fff' : C.ink,
      }}
      aria-hidden="true"
    >
      {initialOf(name)}
    </span>
  );
};

export const Pill: React.FC<{ children: React.ReactNode; tone?: 'gray' | 'violet' | 'green' | 'amber' | 'red' | 'lime' | 'dark' }> = ({
  children,
  tone = 'gray',
}) => {
  const tones: Record<string, string> = {
    gray: 'bg-[#F1F0EC] text-[#3E3A4A]',
    violet: 'bg-[#EEEBFF] text-[#4329D9]',
    green: 'bg-[#DCFCE7] text-[#166534]',
    amber: 'bg-[#FEF3C7] text-[#854D0E]',
    red: 'bg-[#FEE2E2] text-[#991B1B]',
    lime: 'bg-[#C8F169] text-[#14121C]',
    dark: 'bg-[#14121C] text-[#C8F169]',
  };
  return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-semibold ${tones[tone]}`}>{children}</span>;
};

export const Icon = {
  arrow: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
  ),
  back: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
  ),
  check: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
  ),
  clock: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
  ),
  pin: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
  ),
  search: (s = 20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
  ),
  plus: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
  ),
  chat: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
  ),
  verified: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" role="img" aria-label="Tasdiqlangan"><circle cx="12" cy="12" r="10" fill="#5B3DF5" /><path d="M7.5 12.5l3 3 6-6.5" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
};

/* ----------------------------- Ma'lumot formatlash ----------------------------- */

export function fmtNum(raw?: string | number): string {
  const digits = String(raw ?? '').replace(/[^\d]/g, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function budgetText(b: BriefData): string {
  if (b.paymentType === 'barter') return 'Barter';
  const min = fmtNum(b.budgetMin);
  const max = fmtNum(b.budgetMax);
  if (min && max && min !== max) return `${min} – ${max} so'm`;
  if (min || max) return `${min || max} so'm`;
  return 'Kelishiladi';
}

export function timeAgo(b: BriefData): string {
  const ms = Number(b.createdAtMillis) || Date.parse(b.createdAt || '') || 0;
  if (!ms) return b.createdAt || '';
  const diff = Math.max(0, Date.now() - ms);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'hozirgina';
  if (m < 60) return `${m} daqiqa oldin`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} soat oldin`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'kecha';
  if (d < 30) return `${d} kun oldin`;
  return new Date(ms).toLocaleDateString('ru-RU');
}

export function appStatus(a: { status?: string; creatorStatus?: string }): 'ok' | 'no' | 'wait' {
  if (a.status === 'accepted' || a.creatorStatus === 'qabul_qilindi' || a.status === 'qabul_qilindi') return 'ok';
  if (a.status === 'rejected' || a.creatorStatus === 'rad_etildi' || a.status === 'rad_etildi') return 'no';
  return 'wait';
}

export function isBriefOpen(b: BriefData): boolean {
  return !b.status || b.status === 'open' || b.status === 'yangi';
}

/* ----------------------------- Profil holati (admin tekshiruvi) ----------------------------- */

export type ReviewState = 'approved' | 'pending' | 'rejected';

export function reviewState(u?: UserSession | null): ReviewState {
  if (!u) return 'pending';
  if (u.catalogApproved === true) return 'approved';
  const reviewed = Number(u.catalogReviewedAtMillis || 0);
  const resub = Number(u.catalogResubmittedAtMillis || 0);
  if (u.catalogApproved === false && !(resub > reviewed)) return 'rejected';
  return 'pending';
}

export function canApply(u?: UserSession | null): { ok: boolean; reason: 'guest' | 'brand' | 'review' | 'rejected' | 'pro' | 'incomplete' | null } {
  if (!u) return { ok: false, reason: 'guest' };
  if (u.role === 'brend') return { ok: false, reason: 'brand' };
  const r = reviewState(u);
  if (r === 'rejected') return { ok: false, reason: 'rejected' };
  if (r !== 'approved') return { ok: false, reason: 'review' };
  if (!isUserPro(u)) return { ok: false, reason: 'pro' };
  if (typeof u.profileCompletion === 'number' && u.profileCompletion < 100) return { ok: false, reason: 'incomplete' };
  return { ok: true, reason: null };
}

/* ----------------------------- Navigatsiya ----------------------------- */

export type V2Route =
  | { name: 'home' }
  | { name: 'brief'; id: string }
  | { name: 'brand'; id: string }
  | { name: 'register'; mode: 'signup' | 'login' }
  | { name: 'applications' }
  | { name: 'cabinet' }
  | { name: 'new-brief' };

export function parseV2Hash(hash: string): V2Route | null {
  const h = (hash || '').replace(/^#\/?/, '');
  if (h.startsWith('elon-')) return { name: 'brief', id: decodeURIComponent(h.slice(5)) };
  if (h.startsWith('brend-')) return { name: 'brand', id: decodeURIComponent(h.slice(6)) };
  if (h === 'royxat' || h === 'register') return { name: 'register', mode: 'signup' };
  if (h === 'kirish' || h === 'login') return { name: 'register', mode: 'login' };
  if (h === 'arizalarim') return { name: 'applications' };
  if (h === 'kabinet') return { name: 'cabinet' };
  if (h === 'yangi-elon') return { name: 'new-brief' };
  return null;
}

export function go(hash: string) {
  window.location.hash = hash;
  window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
}

/* Tugma klasslari */
export const btn = {
  dark: 'inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-xl bg-[#14121C] text-white font-semibold text-[15px] hover:bg-[#2A2636] transition-colors cursor-pointer disabled:opacity-60',
  violet: 'inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-xl bg-[#5B3DF5] text-white font-bold text-[15px] hover:bg-[#4A2EE0] transition-colors cursor-pointer disabled:opacity-60',
  lime: 'inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-xl bg-[#C8F169] text-[#14121C] font-extrabold text-[15px] hover:bg-[#B8E651] transition-colors cursor-pointer disabled:opacity-60',
  ghost: 'inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-xl border border-[#E6E3DC] bg-white text-[#14121C] font-semibold text-[15px] hover:border-[#14121C] transition-colors cursor-pointer disabled:opacity-60',
};
