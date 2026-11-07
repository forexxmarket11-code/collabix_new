import React from 'react';
import { UserSession } from '../types';
import { ReferralDashboard } from './ReferralDashboard';
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
  currentUser: UserSession | null;
  onOpenProModal: () => void;
}

export const ReferralPage: React.FC<ReferralPageProps> = ({
  onBackToHome,
  onOpenRegister,
  currentUser,
  onOpenProModal,
}) => {
  const scrollToDashboard = () => {
    try {
      document.getElementById('referral-dashboard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch {}
  };

  const steps = [
    {
      num: '01',
      title: 'Doʻstingizni taklif qiling',
      desc: 'Pro rejimingiz faol boʻlsa, shaxsiy havolangizni tanish bloger va biznes egalariga yuboring.',
      icon: Share2,
      badge: '1-qadam',
      color: 'from-indigo-500 to-indigo-600',
    },
    {
      num: '02',
      title: 'U roʻyxatdan oʻtib, obuna boʻladi',
      desc: 'Doʻstingiz havolangiz orqali hisob ochadi va Pro rejimni birinchi marta faollashtiradi.',
      icon: CheckCircle2,
      badge: '2-qadam',
      color: 'from-purple-500 to-purple-600',
    },
    {
      num: '03',
      title: 'Siz 29 000 soʻm mukofot olasiz',
      desc: 'Pro olgan har bir bloger uchun 29 000 soʻm balansingizga tushadi va uni kartangizga yechib olasiz.',
      icon: Coins,
      badge: '3-qadam',
      color: 'from-pink-500 to-rose-500',
    },
  ];

  const benefits = [
    {
      title: 'Kimlar uchun moʻljallangan?',
      desc: 'Pro rejimi faol boʻlgan blogerlar uchun. Shaxsiy havola Pro yoqilganda ochiladi.',
    },
    {
      title: 'Takliflar sonida cheklov bormi?',
      desc: 'Yoʻq, mutlaqo cheklovsiz! Masalan, 10 ta bloger olib kelsangiz — 290 000 soʻm daromad olasiz.',
    },
    {
      title: 'Mukofot qachon va qanday toʻlanadi?',
      desc: 'Doʻstingizning birinchi Pro toʻlovi tasdiqlangach, 29 000 soʻm balansingizga qoʻshiladi (har biri uchun bir marta). Balansni kartangizga yechib olish soʻrovini yuborasiz — pul 1–3 ish kuni ichida oʻtkaziladi.',
    },
  ];

  return (
    <div className="min-h-screen pb-28 sm:pb-32 pt-4 sm:pt-10 px-4 sm:px-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Back to Home Breadcrumb */}
      <div className="mb-5 sm:mb-6">
        <button
          type="button"
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 min-h-[44px] py-2 text-xs sm:text-sm font-heading font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Bosh sahifaga qaytish</span>
        </button>
      </div>

      {/* Hero Header Card (yangi dizayn) */}
      <div className="relative overflow-hidden rounded-[32px] bg-[#14121C] text-white px-6 py-10 sm:px-12 sm:py-14 mb-10">
        <div className="absolute -right-20 -top-24 w-80 h-80 rounded-full bg-[#5B3DF5] opacity-80 pointer-events-none" aria-hidden="true" />
        <div className="absolute right-32 -bottom-24 w-52 h-52 rounded-full bg-[#C8F169] opacity-90 pointer-events-none" aria-hidden="true" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-[13px] font-bold tracking-[1px] text-[#C8F169]">🎁 DO'STLARNI TAKLIF QILISH</div>
          <h1 className="v2-display mt-5 mb-0 font-extrabold text-[36px] sm:text-[54px] leading-[1.02] tracking-[-1.8px]">
            Har bir do'stingiz uchun <span className="text-[#C8F169]">29 000 so'm</span>
          </h1>
          <p className="mt-4 mb-0 text-[16px] sm:text-[18px] leading-[1.55] text-[#BDB8CC]">
            Shaxsiy havolangizni blogerlarga yuboring. Do'stingiz Pro olsa, 29 000 so'm balansingizga tushadi va uni kartangizga yechib olasiz. Cheklov yo'q.
          </p>
          <div className="mt-7 flex flex-wrap gap-2.5">
            <button type="button" id="btn-referral-hero-start" onClick={scrollToDashboard} className="min-h-[52px] px-6 rounded-xl bg-[#C8F169] text-[#14121C] font-bold inline-flex items-center gap-2 cursor-pointer">
              Havolamni olish <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-3 max-w-[480px]">
            {[['10 do\'st', '290 000'], ['25 do\'st', '725 000'], ['50 do\'st', '1 450 000']].map(([a, b]) => (
              <div key={a}>
                <div className="v2-display font-extrabold text-[20px] sm:text-[26px] leading-none">{b}</div>
                <div className="mt-1 text-[12px] text-[#BDB8CC]">{a} = so'm</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ReferralDashboard
        currentUser={currentUser}
        onOpenRegister={onOpenRegister}
        onOpenProModal={onOpenProModal}
      />

      {/* 3-Step Walkthrough */}
      <div className="mb-12">
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="text-xs font-heading font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Oddiy va shaffof mexanizm
          </span>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white mt-1">
            Dastur qanday ishlaydi?
          </h2>
          <p className="text-[15px] sm:text-sm text-slate-600 dark:text-slate-400 font-body mt-2">
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

                  <p className="text-[15px] sm:text-sm text-slate-600 dark:text-slate-400 font-body leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comparison & Revenue Highlight Card */}
      <div className="bg-gradient-to-br from-indigo-50 via-white to-pink-50 dark:from-[#1A1A28] dark:via-[#161622] dark:to-[#1A1A28] rounded-3xl border border-indigo-100 dark:border-slate-800 p-5 sm:p-8 md:p-10 mb-12 shadow-sm">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100/80 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-heading font-bold mb-3">
            <Coins className="w-3.5 h-3.5" />
            <span>Mukofot va obuna nisbati</span>
          </div>

          <h3 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
            Har bir obuna summasining qariyb 50% qismi — sizniki!
          </h3>

          <p className="text-[15px] sm:text-sm text-slate-600 dark:text-slate-400 font-body mt-2 mb-8">
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
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">bloger Pro, 1 oy</p>
            </div>

            {/* Referrer payout */}
            <div className="bg-slate-950 text-white rounded-2xl border border-slate-800 p-5 shadow-md">
              <span className="text-xs font-heading font-semibold text-indigo-300 uppercase tracking-wider">
                Siz oladigan naqd mukofot
              </span>
              <div className="font-mono font-extrabold text-2xl sm:text-3xl text-emerald-400 mt-1">
                +29 000
              </div>
              <p className="text-xs text-indigo-200 mt-1">Har bir bloger uchun, bir marta</p>
            </div>
          </div>

          {/* Calculator preview text */}
          <div className="mt-8 px-2.5 py-3.5 sm:p-4 rounded-2xl bg-white/80 dark:bg-[#12121A]/80 border border-indigo-100/80 dark:border-slate-800 max-w-xl mx-auto text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-body flex items-center justify-around gap-1.5 sm:gap-2 text-center">
            <div className="min-w-0">
              <span className="block font-mono font-bold text-sm sm:text-base text-slate-900 dark:text-white">5 kishi</span>
              <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">145 000 soʻm</span>
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 shrink-0" />
            <div className="min-w-0">
              <span className="block font-mono font-bold text-sm sm:text-base text-slate-900 dark:text-white">10 kishi</span>
              <span className="text-[11px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-bold">290 000 soʻm</span>
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 shrink-0" />
            <div className="min-w-0">
              <span className="block font-mono font-bold text-sm sm:text-base text-slate-900 dark:text-white">30 kishi</span>
              <span className="text-[11px] sm:text-xs text-indigo-600 dark:text-indigo-400 font-bold">870 000 soʻm</span>
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
            <h4 className="font-heading font-bold text-base text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>{b.title}</span>
            </h4>
            <p className="text-[15px] sm:text-sm text-slate-600 dark:text-slate-400 font-body leading-relaxed pl-6">
              {b.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Bottom Final CTA */}
      <div className="mt-12 text-center bg-slate-900 text-white rounded-3xl p-6 sm:p-10 max-w-3xl mx-auto shadow-md">
        <h3 className="font-heading font-extrabold text-xl sm:text-2xl mb-2">
          Hozirdan boshlab doʻstlaringizga Collabix haqida soʻzlab bering!
        </h3>
        <p className="text-[15px] sm:text-sm text-slate-300 mb-6 max-w-lg mx-auto">
          Shaxsiy havolangizni nusxalab, doʻstlaringizga yuboring.
        </p>
        <button
          type="button"
          onClick={scrollToDashboard}
          className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-heading font-bold text-sm shadow-md cursor-pointer hover:opacity-95 transition-opacity"
        >
          <span>Havolamni olish</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
