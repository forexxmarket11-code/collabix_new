import React from 'react';
import { Clock, AlertCircle, X, ChevronRight, Ban } from 'lucide-react';
import { UserSession } from '../types';
import { formatUzbekDate, getDaysRemainingInTrial } from '../firebase';

interface TrialReminderBannerProps {
  user: UserSession | null;
  onDismiss: () => void;
  onOpenCancelModal: () => void;
}

export function shouldShowTrialReminderBanner(
  user: UserSession | null | undefined,
  dismissedLocally = false
): boolean {
  if (dismissedLocally || !user) return false;
  const isProUser = user.subscriptionStatus === 'trial' || user.subscriptionStatus === 'active';
  if (!isProUser || !user.trialEndDate || user.reminderSent) return false;
  const daysRemaining = getDaysRemainingInTrial(user.trialEndDate);
  return daysRemaining <= 3 && daysRemaining >= 0;
}

export const TrialReminderBanner: React.FC<TrialReminderBannerProps> = ({
  user,
  onDismiss,
  onOpenCancelModal,
}) => {
  // CRITICAL REQUIREMENT: This banner MUST ONLY appear for users who have upgraded to Pro mode ('trial' or 'active')
  // Users on free/standard mode or unauthenticated visitors will NEVER see this banner.
  if (!user || !shouldShowTrialReminderBanner(user, false)) {
    return null;
  }

  const daysRemaining = getDaysRemainingInTrial(user.trialEndDate!);
  const formattedEndDate = formatUzbekDate(user.trialEndDate!);
  const mainPrice = (user.subscriptionPlanPrice || 59000).toLocaleString('uz-UZ');

  return (
    <div
      id="trial-reminder-banner"
      role="alert"
      className="relative z-40 bg-gradient-to-r from-amber-500/10 via-amber-400/15 to-indigo-500/15 dark:from-amber-950/40 dark:via-amber-900/30 dark:to-indigo-950/40 border-b border-amber-300/70 dark:border-amber-700/60 backdrop-blur-md px-4 sm:px-6 py-3.5 transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Leading Message with gentle amber warning tone */}
        <div className="flex items-start gap-3 min-w-0 flex-1 pr-9 md:pr-0">
          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5 shadow-xs border border-amber-200 dark:border-amber-800">
            <Clock className="w-4.5 h-4.5 stroke-[2.4]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-heading font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700/80">
                Pro rejim obuna eslatmasi
              </span>
              <span className="text-xs font-heading font-bold text-amber-900 dark:text-amber-200">
                {daysRemaining === 0
                  ? 'Bugun tugaydi'
                  : daysRemaining === 1
                  ? 'Ertaga tugaydi (1 kun qoldi)'
                  : `${daysRemaining} kun qoldi`}
              </span>
            </div>
            <p className="text-[15px] sm:text-sm text-slate-800 dark:text-slate-200 font-body leading-relaxed break-words">
              Sizning Pro rejim oylik obuna davringiz{' '}
              <strong className="font-semibold text-slate-900 dark:text-white">
                {formattedEndDate}
              </strong>
              da tugaydi. Shundan keyin{' '}
              <strong className="font-semibold text-slate-900 dark:text-white">
                {mainPrice} soʻm
              </strong>{' '}
              Pro rejim oylik toʻlovi avtomatik yangilanadi. Bekor qilishni xohlasangiz, shu yerdan amalga oshirishingiz mumkin.
            </p>
          </div>
        </div>

        {/* Action Buttons: "Davom etish" (closes banner & marks reminder sent) and "Bekor qilish" */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end shrink-0 pt-1 md:pt-0">
          <button
            type="button"
            id="btn-trial-reminder-cancel"
            onClick={onOpenCancelModal}
            className="flex-1 md:flex-none min-h-[44px] py-2 px-3.5 rounded-xl bg-white/80 dark:bg-slate-800/80 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 text-xs sm:text-xs font-heading font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <Ban className="w-3.5 h-3.5 shrink-0" />
            <span>Bekor qilish</span>
          </button>

          <button
            type="button"
            id="btn-trial-reminder-continue"
            onClick={onDismiss}
            className="flex-1 md:flex-none min-h-[44px] py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-heading font-bold transition-all cursor-pointer shadow-xs shadow-indigo-600/20 flex items-center justify-center gap-1"
          >
            <span>Davom etish</span>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          </button>

          <button
            type="button"
            id="btn-trial-reminder-close-x"
            onClick={onDismiss}
            className="absolute top-2.5 right-2.5 md:static min-w-[44px] min-h-[44px] p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center"
            aria-label="Yopish"
            title="Eslatmani yopish"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
