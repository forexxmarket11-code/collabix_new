import React from 'react';
import {
  Gift,
  ArrowLeft,
  Users,
  CheckCircle2,
  Sparkles,
  CreditCard,
  Coins,
  ShieldCheck,
  TrendingUp,
  HelpCircle,
  Share2,
  ArrowRight,
} from 'lucide-react';

interface ReferralPageProps {
  onBackToHome: () => void;
  onOpenRegister: () => void;
}

export const ReferralPage: React.FC<ReferralPageProps> = ({
  onBackToHome,
  onOpenRegister,
}) => {
  const steps = [
    {
      num: '01',
      title: 'Doʻstingizni taklif qiling',
      desc: 'Tanish bloger, ekspert yoki biznes egalariga Collabix platformasi haqida soʻzlab bering yoki xabar yuboring.',
      icon: Share2,
      badge: '1-qadam',
      color: 'from-indigo-500 to-indigo-600',
    },
    {
      num: '02',
      title: 'U roʻyxatdan oʻtib, obuna boʻladi',
      desc: 'Doʻstingiz platformada oʻz hisobini ochadi va 59 000 soʻmlik oylik obunani muvaffaqiyatli faollashtiradi.',
      icon: CheckCircle2,
      badge: '2-qadam',
      color: 'from-purple-500 to-purple-600',
    },
    {
      num: '03',
      title: 'Siz 29 000 soʻm mukofot olasiz',
      desc: 'Doʻstingiz toʻlagan summaning deyarli yarmi — 29 000 soʻm toʻgʻridan-toʻgʻri sizning mukofot balansizga oʻtkaziladi.',
      icon: Coins,
      badge: '3-qadam',
      color: 'from-pink-500 to-rose-500',
    },
  ];

  const benefits = [
    {
      title: 'Kimlar uchun moʻljallangan?',
      desc: 'Har qanday roʻyxatdan oʻtgan foydalanuvchi: blogerlar, brend vakillari, marketologlar va hatto oddiy tashrif buyuruvchilar ham qatnashishi mumkin.',
    },
    {
      title: 'Takliflar sonida cheklov bormi?',
      desc: 'Yoʻq, mutlaqo cheklovsiz! 10 nafar doʻstingiz obuna boʻlsa — 290 000 soʻm, 50 nafar boʻlsa — 1 450 000 soʻm daromad olasiz.',
    },
    {
      title: 'Mukofot qachon va qanday toʻlanadi?',
      desc: 'Taklif qilingan doʻstingiz obuna toʻlovini amalga oshirishi bilan mukofotingiz tasdiqlanadi va shaxsiy hisobingizga biriktiriladi.',
    },
  ];

  return (
    <div className="min-h-screen pb-32 pt-6 sm:pt-10 px-4 sm:px-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Back to Home Breadcrumb */}
      <div className="mb-6">
        <button
          type="button"
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-heading font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Bosh sahifaga qaytish</span>
        </button>
      </div>

      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white p-7 sm:p-10 md:p-12 border border-indigo-500/20 shadow-xl mb-10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-60 h-60 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-heading font-bold text-pink-300 mb-4 shadow-2xs">
            <Gift className="w-4 h-4 text-pink-400" />
            <span>Tavsiya (Referral) Dasturi</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          </div>

          <h1 className="font-heading font-extrabold text-2xl sm:text-4xl md:text-5xl text-white tracking-tight leading-tight">
            Doʻstlaringizni taklif qiling —{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-300">
              har bir obunadan 29 000 soʻm
            </span>{' '}
            mukofot oling
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-300 font-body leading-relaxed">
            Collabix platformasini kengaytirishga hissa qoʻshing va har bir yangi faol obunachidan daromad oling.
            Dastur blogerlar, brendlar va barcha ijodkorlar uchun birdek ochiq!
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              id="btn-referral-hero-start"
              onClick={onOpenRegister}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white font-heading font-bold text-sm shadow-lg shadow-indigo-500/25 active:scale-98 transition-all cursor-pointer"
            >
              <span>Dasturda ishtirok etish</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-heading font-semibold text-sm border border-white/15 backdrop-blur-xs transition-colors cursor-pointer"
            >
              <span>Katalogni koʻrish</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3-Step Walkthrough */}
      <div className="mb-12">
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="text-xs font-heading font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Oddiy va shaffof mexanizm
          </span>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white mt-1">
            Dastur qanday ishlaydi?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-body mt-2">
            Murakkab shartlar yoʻq — 3 ta qadam orqali daromad olishni boshlang:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.num}
                className="bg-white dark:bg-[#1A1A24] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} text-white flex items-center justify-center shadow-md`}
                    >
                      <Icon className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <span className="font-mono font-extrabold text-2xl text-slate-200 dark:text-slate-700 group-hover:text-indigo-200 dark:group-hover:text-indigo-800 transition-colors">
                      {s.num}
                    </span>
                  </div>

                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-heading font-bold mb-2">
                    {s.badge}
                  </span>

                  <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900 dark:text-white mb-2 leading-snug">
                    {s.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-body leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comparison & Revenue Highlight Card */}
      <div className="bg-gradient-to-br from-indigo-50 via-white to-pink-50 dark:from-[#1A1A28] dark:via-[#161622] dark:to-[#1A1A28] rounded-3xl border border-indigo-100 dark:border-slate-800 p-6 sm:p-8 md:p-10 mb-12 shadow-sm">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100/80 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-heading font-bold mb-3">
            <Coins className="w-3.5 h-3.5" />
            <span>Mukofot va obuna nisbati</span>
          </div>

          <h3 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
            Har bir obuna summasining qariyb 50% qismi — sizniki!
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-body mt-2 mb-8">
            Collabix oylik obunasi doʻstingiz uchun hamyonbop va qulay, siz uchun esa sezilarli naqd ragʻbat.
          </p>

          {/* Visual Comparison Boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-xl mx-auto">
            {/* Subscription price */}
            <div className="bg-white dark:bg-[#12121A] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
              <span className="text-xs font-heading font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Doʻstingiz uchun obuna narxi
              </span>
              <div className="font-mono font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white mt-1">
                59 000 soʻm
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">1 oylik toʻliq platforma kirishi</p>
            </div>

            {/* Referrer payout */}
            <div className="bg-slate-950 text-white rounded-2xl border border-slate-800 p-5 shadow-md">
              <span className="text-xs font-heading font-semibold text-indigo-300 uppercase tracking-wider">
                Siz oladigan naqd mukofot
              </span>
              <div className="font-mono font-extrabold text-2xl sm:text-3xl text-emerald-400 mt-1">
                +29 000 soʻm
              </div>
              <p className="text-xs text-indigo-200 mt-1">Har bir faollashgan obunachidan</p>
            </div>
          </div>

          {/* Calculator preview text */}
          <div className="mt-8 p-4 rounded-2xl bg-white/80 dark:bg-[#12121A]/80 border border-indigo-100/80 dark:border-slate-800 max-w-xl mx-auto text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-body flex items-center justify-around gap-2 text-center">
            <div>
              <span className="block font-mono font-bold text-base text-slate-900 dark:text-white">5 kishi</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">145 000 soʻm</span>
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
            <div>
              <span className="block font-mono font-bold text-base text-slate-900 dark:text-white">10 kishi</span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">290 000 soʻm</span>
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
            <div>
              <span className="block font-mono font-bold text-base text-slate-900 dark:text-white">30 kishi</span>
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">870 000 soʻm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Program Details FAQ */}
      <div className="space-y-4 max-w-3xl mx-auto">
        <h3 className="font-heading font-bold text-xl text-slate-900 dark:text-white mb-4 text-center sm:text-left">
          Koʻp soʻraladigan savollar
        </h3>
        {benefits.map((b, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs"
          >
            <h4 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>{b.title}</span>
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-body leading-relaxed pl-6">
              {b.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Bottom Final CTA */}
      <div className="mt-12 text-center bg-slate-900 text-white rounded-3xl p-8 sm:p-10 max-w-3xl mx-auto shadow-md">
        <h3 className="font-heading font-extrabold text-xl sm:text-2xl mb-2">
          Hozirdan boshlab doʻstlaringizga Collabix haqida soʻzlab bering!
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 mb-6 max-w-lg mx-auto">
          Hisobingizni roʻyxatdan oʻtkazing yoki mavjud profilingiz orqali platformaga kiring.
        </p>
        <button
          type="button"
          onClick={onOpenRegister}
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-heading font-bold text-sm shadow-md cursor-pointer hover:opacity-95 transition-opacity"
        >
          <span>Roʻyxatdan oʻtish / Kirish</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
