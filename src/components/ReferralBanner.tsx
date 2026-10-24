import React from 'react';
import { Gift, ArrowRight, Sparkles, Coins, Users } from 'lucide-react';

interface ReferralBannerProps {
  onLearnMore: () => void;
}

export const ReferralBanner: React.FC<ReferralBannerProps> = ({ onLearnMore }) => {
  return (
    <section
      id="referral-homepage-banner"
      aria-label="Doʻstlarni taklif qilish va daromad olish banneri"
      className="w-full max-w-6xl mx-auto px-4 sm:px-6 my-8 sm:my-12"
    >
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 border border-indigo-500/20 shadow-xl shadow-indigo-950/20 p-6 sm:p-8 md:p-10 text-white">
        {/* Subtle geometric glowing background shapes */}
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-gradient-to-br from-indigo-500/25 to-pink-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/4 -bottom-16 w-56 h-56 bg-purple-600/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 sm:gap-8">
          {/* Left Content Area */}
          <div className="max-w-2xl">
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-heading font-bold text-pink-300 mb-3.5 shadow-2xs">
              <Gift className="w-3.5 h-3.5 text-pink-400" />
              <span>Collabix Hamkorlik Dasturi</span>
              <Sparkles className="w-3 h-3 text-amber-300" />
            </div>

            {/* Main Catchy Heading */}
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl text-white tracking-tight leading-snug sm:leading-tight">
              Doʻstingizni taklif qiling —{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-300">
                har bir aʼzodan pul ishlang
              </span>
            </h2>

            {/* Explanation paragraph */}
            <p className="mt-3 text-sm sm:text-base text-slate-300 font-body leading-relaxed">
              Platformamizda bloger ham, brend ham oʻz doʻstlarini taklif qilib qoʻshimcha daromad topishi mumkin.
              Taklifingiz orqali roʻyxatdan oʻtib, <strong>59 000 soʻm</strong>lik obunani faollashtirgan har bir
              foydalanuvchi uchun sizga darhol mukofot hisoblanadi.
            </p>

            {/* Micro badges for credibility */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-4 pt-3 border-t border-white/10 text-xs sm:text-sm text-slate-300 font-body">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Cheklovlarsiz takliflar</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Toʻgʻridan-toʻgʻri naqd mukofot</span>
              </div>
            </div>
          </div>

          {/* Right Highlight Box & CTA */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-4 shrink-0">
            {/* Big Numbers Card */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 sm:p-5 text-center lg:text-right shadow-lg">
              <span className="block text-xs uppercase tracking-wider font-heading font-semibold text-slate-300 mb-1">
                Sizning daromadingiz
              </span>
              <div className="font-mono font-extrabold text-2xl sm:text-3xl lg:text-4xl text-emerald-400 drop-shadow-sm">
                +29 000 soʻm
              </div>
              <span className="block text-xs text-indigo-200 mt-1 font-body">
                har bir doʻstingiz obunasidan (~50%)
              </span>
            </div>

            {/* Action button */}
            <button
              id="btn-referral-banner-details"
              type="button"
              onClick={onLearnMore}
              className="group inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white font-heading font-bold text-sm shadow-lg shadow-indigo-500/25 active:scale-98 transition-all cursor-pointer"
            >
              <span>Dastur haqida batafsil</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
