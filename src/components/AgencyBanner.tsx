import React from 'react';
import { Building2, ArrowRight, Sparkles, ShieldCheck, Percent, Zap } from 'lucide-react';

interface AgencyBannerProps {
  onLearnMore: () => void;
}

export const AgencyBanner: React.FC<AgencyBannerProps> = ({ onLearnMore }) => {
  return (
    <section
      id="agency-homepage-banner"
      aria-label="Marketing agentliklari uchun hamkorlik dasturi banneri"
      className="w-full max-w-6xl mx-auto px-4 sm:px-6 my-8 sm:my-12"
    >
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#090D1A] border border-indigo-500/30 shadow-xl shadow-indigo-950/25 p-6 sm:p-8 md:p-10 text-white">
        {/* Ambient lighting glows */}
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -bottom-14 w-60 h-60 bg-blue-600/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 sm:gap-8">
          {/* Left Content Area */}
          <div className="max-w-2xl">
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-heading font-bold text-indigo-300 mb-3.5 shadow-2xs">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Agentliklar uchun hamkorlik dasturi</span>
              <Sparkles className="w-3 h-3 text-amber-300" />
            </div>

            {/* Main Catchy Heading */}
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl text-white tracking-tight leading-snug sm:leading-tight">
              Marketing agentligisiz?{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">
                Hamkor boʻling.
              </span>
            </h2>

            {/* Description paragraph as requested */}
            <p className="mt-3 text-sm sm:text-base text-slate-300 font-body leading-relaxed">
              Mijozlaringizga kreator topib berish endi osonroq. Collabix orqali mijoz yuboring — oʻzingiz bepul Pro hisob va har oylik komissiya olasiz.
            </p>

            {/* Micro badges for credibility */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-4 pt-3 border-t border-white/10 text-xs sm:text-sm text-slate-300 font-body">
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Cheksiz bepul Pro hisob</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Har oylik doimiy komissiya</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Nol xarajat va 100% xavfsiz</span>
              </div>
            </div>
          </div>

          {/* Right CTA Box */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-4 shrink-0">
            {/* Quick Benefits Highlight Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 text-center sm:text-right min-w-[240px]">
              <span className="block text-[11px] font-heading font-semibold uppercase tracking-wider text-indigo-300">
                Agentliklar uchun bonus
              </span>
              <div className="mt-1 flex items-baseline justify-center sm:justify-end gap-1.5 font-heading font-extrabold text-2xl text-white">
                <span>0 soʻm</span>
                <span className="text-xs font-normal text-slate-400">/ qoʻshilish</span>
              </div>
              <p className="mt-1 text-xs text-slate-300 font-body">
                Maxsus agentlik shartlari va doimiy menejer
              </p>
            </div>

            {/* "Batafsil" Button */}
            <button
              type="button"
              id="btn-agency-banner-learn-more"
              onClick={onLearnMore}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400 text-white font-heading font-bold text-sm sm:text-base shadow-lg shadow-purple-600/30 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] group"
            >
              <span>Batafsil maʼlumot</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
