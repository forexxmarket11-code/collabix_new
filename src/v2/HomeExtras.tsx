import React, { useEffect, useRef, useState } from 'react';
import type { ShowcaseCreator } from '../firebase';
import { Avatar, Icon } from './ui';
import type { BrandSummary } from './V2Home';

/* Sahifa aylantirilganda silliq paydo bo'lish */
export const Reveal: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({ children, className = '', delay = 0 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setOn(true); return; }
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { setOn(true); io.disconnect(); }
    }, { rootMargin: '0px 0px -60px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`v2-reveal ${on ? 'v2-in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
};

/* Raqam sanab o'sadi */
export const CountUp: React.FC<{ to: number; suffix?: string }> = ({ to, suffix = '' }) => {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!to) { setN(0); return; }
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setN(to); return; }
    let raf = 0; let started = false;
    const run = () => {
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / 1400);
        setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { run(); return () => cancelAnimationFrame(raf); }
    const io = new IntersectionObserver((es) => { if (!started && es.some((e) => e.isIntersecting)) { started = true; run(); io.disconnect(); } });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to]);
  return <span ref={ref}>{n.toLocaleString('ru-RU').replace(/,/g, ' ')}{suffix}</span>;
};

/* Hero: telefon ichida ishlayotgan kabinet (namuna) */
const FEED = [
  { t: 'Yangi ariza', d: "Bloger e'loningizga ariza yubordi", tone: 'lime' },
  { t: 'Ssenariy tasdiqlandi', d: '"Mahsulotni 15 soniyada ko\'rsataman..."', tone: 'violet' },
  { t: 'Draft tayyor', d: 'Video joylanishdan oldin sizda', tone: 'amber' },
  { t: 'Reels joylandi', d: "Ko'rishlar o'smoqda", tone: 'green' },
] as const;

export const PhoneMockup: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const [step, setStep] = useState(0);
  const [views, setViews] = useState(0);
  useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setStep(4); setViews(48250); return; }
    const id = setInterval(() => setStep((s) => (s >= 5 ? 0 : s + 1)), 1900);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (step < 4) { if (step === 0) setViews(0); return; }
    let raf = 0; const t0 = performance.now(); const target = 48250;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 1600);
      setViews(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [step >= 4]);
  const toneCls: Record<string, string> = {
    lime: 'bg-[#C8F169] text-[#14121C]',
    violet: 'bg-[#5B3DF5] text-white',
    amber: 'bg-[#FDE68A] text-[#78350F]',
    green: 'bg-[#22C55E] text-white',
  };
  const shown = Math.min(step, 4);
  return (
    <div className={`relative mx-auto ${compact ? 'w-[260px]' : 'w-[300px]'}`} aria-hidden="true">
      <div className="absolute -inset-6 rounded-[60px] bg-[radial-gradient(closest-side,rgba(91,61,245,0.35),transparent)] blur-xl" />
      <div className="relative rounded-[44px] bg-[#14121C] p-3 shadow-[0_40px_80px_-30px_rgba(20,18,28,0.6)]">
        <div className="rounded-[34px] bg-[#F6F5F1] overflow-hidden" style={{ height: compact ? 440 : 520 }}>
          <div className="h-7 flex items-center justify-center"><div className="w-20 h-5 rounded-full bg-[#14121C]" /></div>
          <div className="px-4 pt-2">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold tracking-[1.5px] text-[#5B3DF5]">BREND KABINETI</div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#E6E3DC] text-[#5E5A6B]">Namuna</span>
            </div>
            <div className="v2-display mt-1 font-extrabold text-[20px] leading-tight">Yangi mahsulot reklamasi</div>
            <div className="mt-3 grid grid-cols-4 gap-1">
              {['Kelishildi', 'Ssenariy', 'Draft', 'Reels'].map((l, i) => (
                <div key={l} className={`h-1.5 rounded-full transition-colors duration-500 ${i < shown ? 'bg-[#22C55E]' : i === shown ? 'bg-[#5B3DF5]' : 'bg-[#E6E3DC]'}`} />
              ))}
            </div>
            <div className="mt-1 grid grid-cols-4 gap-1 text-[9px] font-bold text-[#5E5A6B]">
              {['Kelishildi', 'Ssenariy', 'Draft', 'Reels'].map((l) => <div key={l} className="truncate">{l}</div>)}
            </div>
            <div className="mt-3 rounded-2xl bg-[#14121C] text-white p-3.5">
              <div className="text-[10px] text-[#BDB8CC] font-semibold">JAMI KO'RISHLAR</div>
              <div className="v2-display font-extrabold text-[28px] leading-none mt-1 tabular-nums">{views.toLocaleString('ru-RU').replace(/,/g, ' ')}</div>
              <div className="mt-2 h-1.5 rounded-full bg-[#2A2636] overflow-hidden"><div className="h-full bg-[#C8F169] transition-[width] duration-700" style={{ width: `${Math.min(100, (views / 48250) * 100)}%` }} /></div>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {FEED.slice(0, shown).reverse().map((f) => (
                <div key={f.t} className="rounded-2xl bg-white border border-[#E6E3DC] px-3 py-2.5 flex items-center gap-2.5 shadow-sm" style={{ animation: 'v2-pop .45s ease both' }}>
                  <span className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${toneCls[f.tone]}`}>{Icon.check(14)}</span>
                  <div className="min-w-0">
                    <div className="font-bold text-[13px] leading-tight">{f.t}</div>
                    <div className="text-[11px] text-[#5E5A6B] truncate">{f.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {!compact && (
        <div className="v2-float absolute -left-16 bottom-24 rounded-2xl bg-[#C8F169] px-4 py-3 shadow-[0_24px_50px_-20px_rgba(20,18,28,0.5)]">
          <div className="text-[11px] font-bold">TASDIQSIZ</div>
          <div className="text-[13px] font-extrabold leading-tight">hech narsa<br />joylanmaydi</div>
        </div>
      )}
    </div>
  );
};

/* Blogerlar vitrinasi — aylanib turadi */
export const CreatorMarquee: React.FC<{ creators: ShowcaseCreator[] }> = ({ creators }) => {
  if (creators.length < 4) return null;
  const row = [...creators, ...creators];
  return (
    <div className="relative overflow-hidden py-2 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div className="v2-marquee gap-3.5">
        {row.map((c, i) => (
          <div key={`${c.id}-${i}`} className="w-[200px] shrink-0 rounded-3xl bg-white border border-[#E6E3DC] p-3.5 mr-3.5">
            <div className="aspect-square rounded-2xl overflow-hidden bg-[#ECEAE4]">
              <img src={c.avatar} alt="" loading="lazy" className="w-full h-full object-cover" />
            </div>
            <div className="mt-2.5 font-bold truncate">{c.name}</div>
            <div className="text-[13px] text-[#5E5A6B] truncate">{[c.category, c.city].filter(Boolean).join(' · ')}</div>
            {c.followers && <div className="mt-1.5 inline-flex px-2 py-0.5 rounded-full bg-[#F1EEFF] text-[#4329D9] text-[12px] font-bold">{c.followers} obunachi</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

/* Brendlar qatori */
export const BrandMarquee: React.FC<{ brands: BrandSummary[] }> = ({ brands }) => {
  if (brands.length < 3) return null;
  const row = [...brands, ...brands, ...brands].slice(0, Math.max(12, brands.length * 2));
  const doubled = [...row, ...row];
  return (
    <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <div className="v2-marquee items-center" style={{ animationDuration: '30s' }}>
        {doubled.map((b, i) => (
          <a key={`${b.id}-${i}`} href={`#brend-${encodeURIComponent(b.id)}`} className="shrink-0 mr-8 flex items-center gap-2.5 opacity-80 hover:opacity-100">
            <Avatar name={b.name} src={b.avatar} size={36} />
            <span className="v2-display font-extrabold text-[18px] whitespace-nowrap">{b.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
};
