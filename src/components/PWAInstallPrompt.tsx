import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, PlusSquare, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallPromptProps {
  suppressOnMobile?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  suppressOnMobile = false,
  onVisibilityChange,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem('collabix_pwa_prompt_dismissed');
      if (dismissed === 'true') {
        setIsDismissed(true);
      }
    } catch {
      // ignore
    }
  }, []);

  // Show if browser fired beforeinstallprompt OR if user is on iOS and not standalone
  const shouldShow = !isInstalled && !isDismissed && (isInstallable || isIOS);

  useEffect(() => {
    onVisibilityChange?.(shouldShow && !suppressOnMobile);
  }, [shouldShow, suppressOnMobile, onVisibilityChange]);

  if (!shouldShow) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    const success = await install();
    if (success) {
      setJustInstalled(true);
      setTimeout(() => {
        setIsDismissed(true);
      }, 2500);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('collabix_pwa_prompt_dismissed', 'true');
    } catch {
      // ignore
    }
  };

  return (
    <>
      {/* Floating Bottom / Banner Prompt for Mobile & Desktop */}
      <aside
        id="pwa-install-banner"
        aria-label="Ilovani o'rnatish taklifi"
        className={`${
          suppressOnMobile ? 'hidden sm:block' : ''
        } fixed bottom-[max(84px,calc(env(safe-area-inset-bottom,0px)+80px))] sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-45 animate-in fade-in slide-in-from-bottom-5 duration-300 select-none`}
      >
        <div className="relative overflow-hidden p-3 sm:p-4 rounded-2xl text-white backdrop-blur-xl border border-white/15 shadow-[0_12px_36px_rgba(91,61,240,0.22),0_4px_16px_rgba(255,107,91,0.14)] flex items-center justify-between gap-2.5 transition-all duration-300">
          {/* Subtle violet (#5B3DF0) to coral (#FF6B5B) background gradient layer */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#5B3DF0]/20 via-[#8F4FF5]/14 to-[#FF6B5B]/20 pointer-events-none" />
          <div className="absolute inset-0 bg-[#120F1D]/90 pointer-events-none" />

          {/* Ambient glowing radial highlights */}
          <div className="absolute -top-10 -left-10 w-28 h-28 rounded-full bg-[#5B3DF0]/25 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-28 h-28 rounded-full bg-[#FF6B5B]/20 blur-2xl pointer-events-none" />

          {/* Thin top highlight border */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

          {/* App Icon Preview & Description */}
          <div className="relative z-10 flex items-center gap-2.5 min-w-0">
            {/* Logo frame with soft modern glow */}
            <div className="relative shrink-0">
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-[#5B3DF0] via-[#8F4FF5] to-[#FF6B5B] opacity-70 blur-xs" />
              <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-[14px] bg-[#141124] p-1 flex items-center justify-center border border-white/20 shadow-[0_4px_16px_rgba(91,61,240,0.35)]">
                <img
                  src="/icons/icon-96x96.png"
                  alt="Collabix Icon"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover rounded-[10px]"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                    const fallback = (e.target as HTMLElement).nextElementSibling;
                    if (fallback) (fallback as HTMLElement).style.display = 'flex';
                  }}
                />
                <div
                  style={{ display: 'none' }}
                  className="w-full h-full rounded-[10px] bg-gradient-to-br from-[#5B3DF0] to-[#FF6B5B] items-center justify-center font-heading font-black text-white text-base"
                >
                  C
                </div>
              </div>
            </div>

            <div className="min-w-0">
              <h4 className="font-heading font-bold text-sm text-white tracking-tight flex items-center gap-1.5 truncate">
                <span className="truncate">Collabix Ilovasi</span>
                <span className="hidden sm:inline text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[#5B3DF0]/30 to-[#FF6B5B]/30 text-white/90 border border-white/15">
                  PWA
                </span>
              </h4>
              <p className="text-xs text-slate-200/90 leading-snug truncate mt-0.5">
                {isIOS ? "Ekranga qo'shing" : "Tez va qulay ishlash"}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="relative z-10 flex items-center gap-2 shrink-0">
            <button
              type="button"
              id="btn-pwa-install"
              onClick={handleInstallClick}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-[#5B3DF0] via-[#8349F3] to-[#FF6B5B] hover:from-[#5032E6] hover:to-[#FF5A47] text-white font-heading font-bold text-xs shadow-[0_4px_14px_rgba(91,61,240,0.35)] hover:shadow-[0_6px_20px_rgba(255,107,91,0.4)] active:scale-95 transition-all duration-200 cursor-pointer select-none"
            >
              {justInstalled ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>O'rnatildi!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>O'rnatish</span>
                </>
              )}
            </button>

            <button
              type="button"
              id="btn-pwa-dismiss"
              onClick={handleDismiss}
              aria-label="Yopish"
              className="min-w-[44px] min-h-[44px] p-2 rounded-xl text-slate-300 hover:text-white bg-white/5 hover:bg-white/15 border border-white/10 active:scale-95 transition-all cursor-pointer flex items-center justify-center shrink-0"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* iOS Installation Instruction Modal */}
      {showIOSModal && (
        <div
          id="pwa-ios-guide-modal"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowIOSModal(false)}
        >
          <div
            className="relative overflow-y-auto overscroll-contain max-h-[90dvh] bg-[#141124] text-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-6 pb-[calc(24px+env(safe-area-inset-bottom,0px))] sm:pb-6 border-t sm:border border-white/15 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Subtle gradient highlights */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#5B3DF0]/15 via-transparent to-[#FF6B5B]/15 pointer-events-none" />

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              aria-label="Yopish"
              className="absolute top-3.5 right-3.5 min-w-[44px] min-h-[44px] p-2 text-slate-300 hover:text-white rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 transition-colors z-10 cursor-pointer flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#5B3DF0]/20 to-[#FF6B5B]/20 border border-white/15 flex items-center justify-center mx-auto mb-4 text-[#FF6B5B] shadow-[0_4px_16px_rgba(91,61,240,0.25)]">
              <Smartphone className="w-7 h-7 text-white" />
            </div>

            <h3 className="relative z-10 font-heading font-bold text-lg text-center mb-2 text-white">
              iOS (iPhone / iPad) ga o'rnatish
            </h3>
            <p className="relative z-10 text-sm text-slate-300 text-center mb-5 leading-relaxed">
              Safari brauzeri orqali Collabix ilovasini bosh ekranga qo'shish uchun 2 ta oddiy qadam:
            </p>

            <ol className="relative z-10 space-y-3.5 text-sm text-slate-200 mb-6">
              <li className="flex items-start gap-3 bg-white/5 p-3.5 rounded-xl border border-white/10">
                <span className="w-6 h-6 rounded-full bg-gradient-to-r from-[#5B3DF0] to-[#FF6B5B] flex items-center justify-center shrink-0 font-bold text-xs text-white mt-0.5">
                  1
                </span>
                <span className="leading-relaxed">
                  Safari pastki panelidagi <strong className="text-white inline-flex items-center gap-1"><Share className="w-4 h-4 text-[#FF6B5B] inline" /> "Ulashish" (Share)</strong> tugmasini bosing.
                </span>
              </li>
              <li className="flex items-start gap-3 bg-white/5 p-3.5 rounded-xl border border-white/10">
                <span className="w-6 h-6 rounded-full bg-gradient-to-r from-[#5B3DF0] to-[#FF6B5B] flex items-center justify-center shrink-0 font-bold text-xs text-white mt-0.5">
                  2
                </span>
                <span className="leading-relaxed">
                  Menyuni biroz pastga surib, <strong className="text-white inline-flex items-center gap-1"><PlusSquare className="w-4 h-4 text-[#8F4FF5] inline" /> "Bosh ekranga qo'shish" (Add to Home Screen)</strong> bandini tanlang.
                </span>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="relative z-10 w-full min-h-[48px] py-3 rounded-xl bg-gradient-to-r from-[#5B3DF0] to-[#FF6B5B] hover:from-[#5032E6] hover:to-[#FF5A47] text-white font-heading font-bold text-sm uppercase tracking-wider shadow-md shadow-[#5B3DF0]/25 transition cursor-pointer"
            >
              Tushunarli
            </button>
          </div>
        </div>
      )}
    </>
  );
};
