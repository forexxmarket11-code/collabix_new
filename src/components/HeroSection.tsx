import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Check } from 'lucide-react';

interface HeroSectionProps {
  onStartClick: () => void;
  onCatalogClick?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onStartClick,
  onCatalogClick,
}) => {
  const heroRef = useRef<HTMLElement>(null);
  const heroTextBlockRef = useRef<HTMLDivElement>(null);

  // Progressive enhancement:
  // Starts with all content 100% visible (step = 4)
  // Only when JS is fully running on the client does it initiate smooth staggered reveal
  const [jsMounted, setJsMounted] = useState(false);
  const [animStep, setAnimStep] = useState(4); // 4 = fully visible by default

  useEffect(() => {
    setJsMounted(true);

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setAnimStep(4);
      return;
    }

    // Set initial animation state only after JS mounts
    setAnimStep(0);
    const t1 = setTimeout(() => setAnimStep(1), 50);  // Sarlavha
    const t2 = setTimeout(() => setAnimStep(2), 200); // Tavsif
    const t3 = setTimeout(() => setAnimStep(3), 380); // Ishonch belgilari
    const t4 = setTimeout(() => setAnimStep(4), 550); // Tugmalar va vizual

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  // Performance-optimized scroll-fade:
  // Strictly restricted to the hero text block (sarlavha, tavsif, tugmalar).
  // Zero React re-renders (direct DOM ref update), stops calculating once scrolled past hero.
  // Never affects GeometricVisualShowcase, cards, or subsequent sections.
  useEffect(() => {
    let ticking = false;
    let isPastHero = false;
    let rafId: number | null = null;

    const handleScroll = () => {
      const y = window.scrollY;
      // Fast bailout: if user has already scrolled past hero, skip scheduling rAF
      if (isPastHero && y > 700) {
        return;
      }

      if (!ticking) {
        rafId = window.requestAnimationFrame(() => {
          ticking = false;
          if (!heroTextBlockRef.current) return;
          const currentY = window.scrollY;

          if (currentY <= 0) {
            heroTextBlockRef.current.style.opacity = '1';
            heroTextBlockRef.current.style.transform = 'translate3d(0, 0, 0)';
            isPastHero = false;
          } else if (currentY <= 700) {
            // Smoothly fade only the hero text block as user scrolls through the hero area
            const opacity = Math.max(0.25, 1 - currentY / 600);
            heroTextBlockRef.current.style.opacity = `${opacity}`;
            heroTextBlockRef.current.style.transform = `translate3d(0, ${currentY * 0.12}px, 0)`;
            isPastHero = false;
          } else if (!isPastHero) {
            // Once scrolled past hero, set bounded final state and stop continuous calculations
            heroTextBlockRef.current.style.opacity = '0.25';
            heroTextBlockRef.current.style.transform = `translate3d(0, 84px, 0)`;
            isPastHero = true;
          }
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  // 3 Distinct colorful trust badges with checkmarks and colored backgrounds
  const trustBadges = [
    {
      label: 'Faqat tekshirilgan kreatorlar',
      badgeClass: 'bg-indigo-50/95 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 border-indigo-200/90 dark:border-indigo-900/60 hover:border-indigo-400',
      iconBg: 'bg-indigo-600 text-white',
    },
    {
      label: 'Maqsadli auditoriya',
      badgeClass: 'bg-cyan-50/95 dark:bg-cyan-950/50 text-cyan-950 dark:text-cyan-200 border-cyan-200/90 dark:border-cyan-900/60 hover:border-cyan-400',
      iconBg: 'bg-cyan-600 text-white',
    },
    {
      label: 'Ishonchli natija',
      badgeClass: 'bg-orange-50/95 dark:bg-orange-950/50 text-orange-950 dark:text-orange-200 border-orange-200/90 dark:border-orange-900/60 hover:border-orange-400',
      iconBg: 'bg-orange-600 text-white',
    },
  ];

  return (
    <section
      id="hero-section"
      ref={heroRef}
      className="relative w-full flex items-center justify-center py-10 sm:py-14 lg:py-16 overflow-hidden bg-[#F8FAFC] dark:bg-[#0B0F19] border-b border-indigo-100/60 dark:border-slate-800/80 select-none transition-colors duration-300"
    >
      {/* ========================================================================= */}
      {/* ORGANIC FLOATING GRADIENT BLOBS - Pure GPU CSS Compositing (Ultra smooth) */}
      {/* ========================================================================= */}
      
      {/* BLOB 1: Binafsha-Ko'k (Indigo / Royal Violet / Blue) */}
      <div
        id="organic-blob-1"
        className="absolute top-[-5%] right-[5%] sm:right-[15%] w-[320px] sm:w-[460px] h-[320px] sm:h-[460px] bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-500 rounded-full blur-[42px] opacity-40 pointer-events-none -z-10 animate-blob-1 will-change-transform"
      />

      {/* BLOB 2: To'q sariq / Korall (Coral / Sunset Orange / Amber) */}
      <div
        id="organic-blob-2"
        className="absolute bottom-[-8%] left-[2%] sm:left-[10%] w-[300px] sm:w-[420px] h-[300px] sm:h-[420px] bg-gradient-to-tr from-rose-500 via-orange-500 to-amber-400 rounded-full blur-[38px] opacity-35 pointer-events-none -z-10 animate-blob-2 will-change-transform"
      />

      {/* BLOB 3: Uyg'un Fushsiya-Tsian (Fuchsia / Cyan harmonious blend) */}
      <div
        id="organic-blob-3"
        className="absolute top-[35%] left-[32%] w-[240px] sm:w-[360px] h-[240px] sm:h-[360px] bg-gradient-to-r from-fuchsia-500/80 via-purple-400/80 to-cyan-400/80 rounded-full blur-[36px] opacity-30 pointer-events-none -z-10 animate-blob-3 will-change-transform"
      />

      {/* Subdued ambient canvas grid (micro-dots for modern tech elegance) */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none -z-10"
        style={{
          backgroundImage: `radial-gradient(#0F172A 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* ========================================================================= */}
      {/* HERO CONTAINER: Stable 100% visible layout, never faded as a whole */}
      {/* ========================================================================= */}
      <div
        id="hero-container"
        className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 opacity-100"
      >
        {/* Hero Text, Trust Badges & CTAs */}
        <div
          id="hero-text-block"
          ref={heroTextBlockRef}
          className="flex flex-col items-center text-center max-w-3xl mx-auto opacity-100 will-change-transform"
        >
          {/* Main Headline: Bold, Grammatically Natural Uzbek */}
          <h1
            id="hero-headline"
            className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.18] sm:leading-[1.16] lg:leading-[1.15] mb-5 pb-1 font-heading h-auto"
          >
            <span className="block">
              <span
                className={`block transition-all duration-500 ease-out ${
                  !jsMounted || animStep >= 1
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-6 opacity-0'
                }`}
              >
                Bloger va brendlarni
              </span>
            </span>
            <span className="block">
              <span
                className={`block transition-all duration-500 delay-75 ease-out ${
                  !jsMounted || animStep >= 1
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-6 opacity-0'
                }`}
              >
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                  tez va ishonchli
                </span>
              </span>
            </span>
            <span className="block pb-1">
              <span
                className={`block transition-all duration-500 delay-150 ease-out ${
                  !jsMounted || animStep >= 1
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-6 opacity-0'
                }`}
              >
                bog'laymiz.
              </span>
            </span>
          </h1>

          {/* Description (1 concise line, natural Uzbek grammar) */}
          <p
            id="hero-description"
            className={`text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mb-7 font-body transition-all duration-500 ease-out ${
              !jsMounted || animStep >= 2
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4'
            }`}
          >
            Auditoriyasi sinchiklab tekshirilgan kreatorlar bilan to'g'ridan-to'g'ri muloqot qiling, sodda brif yuboring va yuqori natijali integratsiyalarni yo'lga qo'ying.
          </p>

          {/* Three Colorful Trust Badges (Color backgrounds, checkmarks, clear borders) */}
          <div
            id="hero-trust-pills"
            className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 mb-8"
          >
            {trustBadges.map((badge, idx) => (
              <div
                key={badge.label}
                id={`trust-pill-${idx}`}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border shadow-xs text-xs sm:text-sm font-heading font-semibold transition-all duration-400 ease-out ${
                  badge.badgeClass
                } ${
                  !jsMounted || animStep >= 3
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-3 scale-95'
                }`}
                style={{
                  transitionDelay: `${idx * 60}ms`,
                }}
              >
                <span
                  className={`flex items-center justify-center w-4 h-4 rounded-full ${badge.iconBg} shadow-xs shrink-0`}
                >
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
                <span>{badge.label}</span>
              </div>
            ))}
          </div>

          {/* CTA Button: Vivid, colorful primary action button */}
          <div
            id="hero-cta-group"
            className={`flex items-center justify-center transition-all duration-500 ease-out ${
              !jsMounted || animStep >= 4
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4'
            }`}
          >
            <button
              id="btn-hero-start"
              onClick={onStartClick}
              className="group relative inline-flex items-center justify-center gap-3 w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-heading font-bold text-base sm:text-lg tracking-tight shadow-xl shadow-indigo-600/25 hover:shadow-indigo-600/35 active:scale-[0.98] transition-all duration-150 cursor-pointer"
            >
              <span>Boshlash</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5] group-hover:translate-x-1.5 transition-transform" />
            </button>
          </div>

          {/* Fast Quality Reassurance Indicators (Zero price words) */}
          <div
            id="hero-quality-strip"
            className={`mt-8 pt-5 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400 font-mono transition-all duration-500 ease-out ${
              !jsMounted || animStep >= 4 ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-medium text-slate-700 dark:text-slate-300">500+ faol kreatorlar</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="font-medium text-slate-700 dark:text-slate-300">O'rtacha 24 soatda kelishuv</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="font-medium text-slate-700 dark:text-slate-300">98% rejalashtirilgan qamrov</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
