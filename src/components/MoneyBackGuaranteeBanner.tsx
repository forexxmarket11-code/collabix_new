import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

interface MoneyBackGuaranteeBannerProps {
  onLearnMore: () => void;
}

export const MoneyBackGuaranteeBanner: React.FC<MoneyBackGuaranteeBannerProps> = ({
  onLearnMore,
}) => {
  return (
    <motion.section
      id="money-back-guarantee-banner"
      aria-label="100% pul qaytarish kafolati banneri"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-5xl mx-auto px-4 sm:px-6 my-6 sm:my-8"
    >
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-50/90 via-teal-50/80 to-slate-50/90 dark:from-emerald-950/30 dark:via-teal-950/25 dark:to-[#121826] border border-emerald-200/80 dark:border-emerald-800/50 shadow-sm dark:shadow-md p-5 sm:p-7 md:p-8 transition-all">
        {/* Soft background glow accents for security atmosphere */}
        <div
          aria-hidden="true"
          className="absolute -right-12 -top-12 w-52 h-52 bg-emerald-400/15 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute left-1/3 -bottom-10 w-48 h-48 bg-teal-400/15 dark:bg-teal-500/10 rounded-full blur-2xl pointer-events-none"
        />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          {/* Shield Icon with gentle ambient glow */}
          <div className="relative shrink-0">
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-2xl bg-emerald-400/30 dark:bg-emerald-500/25 blur-md pointer-events-none"
            />
            <div className="relative w-12 h-12 sm:w-15 sm:h-15 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-400 dark:to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8 text-white stroke-[2.2]" />
            </div>
          </div>

          {/* Text and reassurance details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100/90 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-700/50 text-emerald-800 dark:text-emerald-300 text-[11px] sm:text-xs font-heading font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Xavfsiz sinab koʻring — risksiz</span>
              </span>
            </div>

            <h3 className="font-heading font-extrabold text-base sm:text-lg md:text-xl text-slate-900 dark:text-white tracking-tight">
              100% pul qaytarish kafolati
            </h3>

            <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-body leading-relaxed max-w-2xl">
              30 kun ichida birorta ham kreator javob bermasa, 59 000 soʻm toʻliq qaytariladi. Kreator koʻrib chiqib javob bersa (qabul qilsa yoki rad etsa), kafolat talabi qanoatlantirilgan hisoblanadi.
            </p>

            {/* Small 'Batafsil' link (not a sales button) */}
            <div className="mt-3 pt-2.5 border-t border-emerald-100/90 dark:border-emerald-900/40 flex items-center justify-between flex-wrap gap-2">
              <button
                type="button"
                id="link-money-back-guarantee-details"
                onClick={onLearnMore}
                className="inline-flex items-center gap-1 text-xs sm:text-sm font-heading font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 underline underline-offset-4 decoration-emerald-300 dark:decoration-emerald-700 hover:decoration-emerald-600 transition-colors cursor-pointer group"
              >
                <span>Batafsil</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>

              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-body">
                Collabix xavfsizlik va shaffoflik kafolati
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};
