import React, { useState } from 'react';
import { Download, Smartphone, X, Share2, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../pwa';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'navbar' | 'banner' | 'button';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'button',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  // If already running as an installed PWA or dismissed, hide
  if (isInstalled) {
    return null;
  }

  // Handle click on button
  const handleAction = async () => {
    if (isInstallable) {
      await install();
    } else {
      // Show installation guide modal for iOS or browsers needing manual home screen add
      setShowIOSModal(true);
    }
  };

  if (variant === 'banner') {
    if (isBannerDismissed) return null;

    return (
      <>
        <div
          id="pwa-install-banner"
          className={`relative z-40 bg-gradient-to-r from-indigo-900 via-[#18162b] to-purple-950 text-white px-4 py-2.5 border-b border-indigo-800/40 shadow-sm ${className}`}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center shrink-0 shadow-xs">
                <Smartphone className="w-4 h-4 text-white" />
              </div>
              <div className="truncate">
                <span className="font-heading font-bold text-white">Collabix ilovasi:</span>{' '}
                <span className="text-slate-300 hidden sm:inline">Tezkor kirish va qulay ishlash uchun telefoningizga o'rnating</span>
                <span className="text-slate-300 sm:hidden">Ilovani o'rnating</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                id="btn-pwa-install-banner"
                onClick={handleAction}
                className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-heading font-bold text-xs uppercase tracking-wider shadow-sm transition active:scale-95 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>O'rnatish</span>
              </button>
              <button
                type="button"
                onClick={() => setIsBannerDismissed(true)}
                className="min-w-[44px] min-h-[44px] p-2 rounded-xl text-slate-400 hover:text-white transition flex items-center justify-center"
                title="Yopish"
                aria-label="Yopish"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </div>

        {/* iOS Install Guide Modal */}
        {showIOSModal && (
          <div
            className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowIOSModal(false)}
          >
            <div
              className="relative w-full sm:max-w-sm max-h-[90dvh] overflow-y-auto overscroll-contain bg-white dark:bg-[#1A1A24] rounded-t-3xl sm:rounded-3xl p-6 pb-[calc(24px+env(safe-area-inset-bottom,0px))] sm:pb-6 border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl text-slate-900 dark:text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                aria-label="Yopish"
                className="absolute top-3.5 right-3.5 min-w-[44px] min-h-[44px] p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400 mb-4">
                <Smartphone className="w-6 h-6" />
              </div>

              <h3 className="font-heading font-extrabold text-lg text-center mb-2">
                Collabix ilovasini o'rnatish
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 text-center mb-5">
                iOS Safari brauzerida ilovani asosiy ekranga qo'shish uchun:
              </p>

              <ol className="space-y-3 text-sm text-slate-700 dark:text-slate-200 font-medium">
                <li className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">1</span>
                  <span>Safari pastki panelidagi <Share2 className="w-4 h-4 inline mx-1 text-indigo-500" /> <b>Ulashish (Share)</b> tugmasini bosing</span>
                </li>
                <li className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">2</span>
                  <span>Ro'yxatdan <PlusSquare className="w-4 h-4 inline mx-1 text-indigo-500" /> <b>"Bosh ekranga qo'shish"</b> bandini tanlang</span>
                </li>
                <li className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">3</span>
                  <span>Yuqori o'ng burchakdagi <b>"Qo'shish"</b> tugmasini bosing</span>
                </li>
              </ol>

              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="w-full mt-6 min-h-[48px] py-3 rounded-xl bg-indigo-600 text-white font-heading font-bold text-sm uppercase tracking-wider hover:bg-indigo-500 transition cursor-pointer"
              >
                Tushundim
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        id="btn-pwa-install"
        onClick={handleAction}
        className={`inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition active:scale-95 text-sm sm:text-xs font-heading font-bold cursor-pointer ${className}`}
        title="Collabix ilovasini o'rnatish"
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>Ilovani o'rnatish</span>
      </button>

      {/* iOS Modal */}
      {showIOSModal && (
        <div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowIOSModal(false)}
        >
          <div
            className="relative w-full sm:max-w-sm max-h-[90dvh] overflow-y-auto overscroll-contain bg-white dark:bg-[#1A1A24] rounded-t-3xl sm:rounded-3xl p-6 pb-[calc(24px+env(safe-area-inset-bottom,0px))] sm:pb-6 border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl text-slate-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              aria-label="Yopish"
              className="absolute top-3.5 right-3.5 min-w-[44px] min-h-[44px] p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400 mb-4">
              <Smartphone className="w-6 h-6" />
            </div>

            <h3 className="font-heading font-extrabold text-lg text-center mb-2">
              Collabix ilovasini o'rnatish
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 text-center mb-5">
              iOS Safari brauzerida ilovani asosiy ekranga qo'shish uchun:
            </p>

            <ol className="space-y-3 text-sm text-slate-700 dark:text-slate-200 font-medium">
              <li className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">1</span>
                <span>Safari pastki panelidagi <Share2 className="w-4 h-4 inline mx-1 text-indigo-500" /> <b>Ulashish (Share)</b> tugmasini bosing</span>
              </li>
              <li className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">2</span>
                <span>Ro'yxatdan <PlusSquare className="w-4 h-4 inline mx-1 text-indigo-500" /> <b>"Bosh ekranga qo'shish"</b> bandini tanlang</span>
              </li>
              <li className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">3</span>
                <span>Yuqori o'ng burchakdagi <b>"Qo'shish"</b> tugmasini bosing</span>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full mt-6 min-h-[48px] py-3 rounded-xl bg-indigo-600 text-white font-heading font-bold text-sm uppercase tracking-wider hover:bg-indigo-500 transition cursor-pointer"
            >
              Tushundim
            </button>
          </div>
        </div>
      )}
    </>
  );
};
