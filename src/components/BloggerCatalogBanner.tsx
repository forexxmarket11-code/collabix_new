import React, { useState, useEffect } from 'react';
import { AlertCircle, Sparkles, ArrowRight, X, CheckCircle2 } from 'lucide-react';
import { PageType, UserSession } from '../types';
import { getBloggerCatalogReadiness } from '../utils/subscription';

interface BloggerCatalogBannerProps {
  user: UserSession | null;
  catalogProOnly: boolean;
  currentPage: PageType;
  onFillProfile: () => void;
  onOpenProModal: () => void;
  suppressOnMobile?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
}

export const BloggerCatalogBanner: React.FC<BloggerCatalogBannerProps> = ({
  user,
  catalogProOnly,
  currentPage,
  onFillProfile,
  onOpenProModal,
  suppressOnMobile = false,
  onVisibilityChange,
}) => {
  const [dismissedIncomplete, setDismissedIncomplete] = useState(false);
  const [dismissedNeedPro, setDismissedNeedPro] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const isBlogger = Boolean(
    user && user.role === 'bloger' && user.accountStatus !== 'rejected'
  );

  const readiness = getBloggerCatalogReadiness(user, catalogProOnly);

  // Reset dismissals when user switches accounts
  useEffect(() => {
    setDismissedIncomplete(false);
    setDismissedNeedPro(false);
    setShowCelebration(false);
  }, [user?.uid]);

  // Handle one-time "🎉 Profilingiz katalogda!" message when everything is ready
  useEffect(() => {
    if (!isBlogger || !user?.uid) {
      setShowCelebration(false);
      return;
    }

    const storageKey = `collabix_catalog_live_celebrated_${user.uid}`;

    if (readiness.isVisibleInCatalog) {
      try {
        const alreadyShown = localStorage.getItem(storageKey);
        if (alreadyShown !== '1') {
          localStorage.setItem(storageKey, '1');
          setShowCelebration(true);
        }
      } catch {
        // Fallback if localStorage unavailable
      }
    } else {
      setShowCelebration(false);
      try {
        // If user later loses Pro or becomes incomplete, allow celebrating again once restored
        if (localStorage.getItem(storageKey) === '1') {
          localStorage.removeItem(storageKey);
        }
      } catch {
        // ignore
      }
    }
  }, [isBlogger, user?.uid, readiness.isVisibleInCatalog]);

  const isVisible = Boolean(
    isBlogger &&
      user &&
      (readiness.isVisibleInCatalog
        ? showCelebration
        : !readiness.isProfileComplete
        ? !dismissedIncomplete
        : catalogProOnly && !readiness.hasPro && !dismissedNeedPro)
  );

  useEffect(() => {
    onVisibilityChange?.(isVisible);
  }, [isVisible, onVisibilityChange]);

  if (!isBlogger || !user || !isVisible) {
    return null;
  }

  const wrapperClass = `${suppressOnMobile ? 'hidden sm:block' : ''} max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4`;

  // State 3: Everything ready -> reminder disappears, show one-time celebration banner
  if (readiness.isVisibleInCatalog) {
    return (
      <div className={wrapperClass}>
        <div
          id="blogger-catalog-ready-banner"
          className="relative rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/90 to-indigo-50/80 dark:from-emerald-950/60 dark:via-teal-950/50 dark:to-indigo-950/50 border border-emerald-200/90 dark:border-emerald-800/80 px-4 py-2.5 sm:px-5 shadow-xs flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="text-[15px] sm:text-sm font-heading font-bold text-emerald-950 dark:text-emerald-100">
              🎉 Profilingiz katalogda!
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCelebration(false)}
            aria-label="Yopish"
            className="min-w-[44px] min-h-[44px] p-2 rounded-xl text-emerald-700/70 dark:text-emerald-300/70 hover:text-emerald-950 dark:hover:text-white hover:bg-emerald-100/70 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer shrink-0 flex items-center justify-center"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    );
  }

  // State 1: Profile incomplete
  if (!readiness.isProfileComplete) {
    const handleFillAction = () => {
      if (currentPage === 'edit-profile') {
        const formSection = document.getElementById('blogger-onboarding-checklist');
        if (formSection) {
          formSection.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        onFillProfile();
      }
    };

    return (
      <div className={wrapperClass}>
        <div
          id="blogger-incomplete-profile-banner"
          className="relative rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50/80 to-indigo-50/60 dark:from-amber-950/50 dark:via-slate-900 dark:to-indigo-950/40 border border-amber-200/90 dark:border-amber-800/70 px-4 py-3.5 sm:px-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start sm:items-center gap-2.5 pr-10 sm:pr-0 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4.5 h-4.5" />
            </div>
            <p className="text-[15px] sm:text-sm font-heading font-bold text-slate-900 dark:text-slate-100 leading-snug break-words">
              Profilingiz hali katalogda koʻrinmayapti — 2 daqiqada toʻldiring
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              id="btn-banner-fill-profile"
              onClick={handleFillAction}
              className="w-full sm:w-auto min-h-[44px] py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm sm:text-xs font-heading font-bold shadow-xs transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
            >
              <span>Toʻldirish</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => setDismissedIncomplete(true)}
              aria-label="Yopish"
              className="absolute top-2 right-2 sm:static min-w-[44px] min-h-[44px] p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State 2: Profile complete, but Pro is required & missing
  if (catalogProOnly && !readiness.hasPro) {
    return (
      <div className={wrapperClass}>
        <div
          id="blogger-need-pro-banner"
          className="relative rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50/90 to-amber-50/70 dark:from-indigo-950/60 dark:via-purple-950/50 dark:to-slate-900 border border-indigo-200/90 dark:border-indigo-800/80 px-4 py-3.5 sm:px-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start sm:items-center gap-2.5 pr-10 sm:pr-0 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/70 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <p className="text-[15px] sm:text-sm font-heading font-bold text-slate-900 dark:text-slate-100 leading-snug break-words">
              Profilingiz tayyor! Katalogda koʻrinish va brendlardan buyurtma olish uchun Pro rejimni yoqing
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              id="btn-banner-open-pro"
              onClick={onOpenProModal}
              className="w-full sm:w-auto min-h-[44px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm sm:text-xs font-heading font-bold shadow-xs transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <span>Pro rejimga oʻtish</span>
            </button>

            <button
              type="button"
              onClick={() => setDismissedNeedPro(true)}
              aria-label="Yopish"
              className="absolute top-2 right-2 sm:static min-w-[44px] min-h-[44px] p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
