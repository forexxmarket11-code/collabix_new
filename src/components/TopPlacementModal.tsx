import React, { useState } from 'react';
import {
  X,
  TrendingUp,
  Check,
  Sparkles,
  CreditCard,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { UserSession } from '../types';
import { activateTopPlacement } from '../firebase';

export interface TopPlacementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession | null;
  onUpdateUser: (user: UserSession) => void;
}

export interface TopPlacementOption {
  days: 7 | 15 | 30;
  label: string;
  price: number;
  formattedPrice: string;
  perDayText: string;
  isBestValue?: boolean;
}

export const TOP_PLACEMENT_OPTIONS: TopPlacementOption[] = [
  {
    days: 7,
    label: '7 kun',
    price: 99000,
    formattedPrice: "99,000 so'm",
    perDayText: "kuniga 14,143 so'm",
  },
  {
    days: 15,
    label: '15 kun',
    price: 189000,
    formattedPrice: "189,000 so'm",
    perDayText: "kuniga 12,600 so'm",
  },
  {
    days: 30,
    label: '30 kun',
    price: 299000,
    formattedPrice: "299,000 so'm",
    perDayText: "kuniga 9,967 so'm",
    isBestValue: true,
  },
];

export const TopPlacementModal: React.FC<TopPlacementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
}) => {
  const [selectedDays, setSelectedDays] = useState<7 | 15 | 30>(30);
  const [step, setStep] = useState<'select' | 'payment' | 'success'>('select');
  const [selectedProvider, setSelectedProvider] = useState<'click' | 'payme' | 'uzcard'>('click');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const selectedOption = TOP_PLACEMENT_OPTIONS.find((o) => o.days === selectedDays) || TOP_PLACEMENT_OPTIONS[2];

  // Active status check
  const isCurrentlyTop = Boolean(
    currentUser?.topPlacementUntil && new Date(currentUser.topPlacementUntil).getTime() > Date.now()
  );

  const handleConfirmPurchase = async () => {
    if (!currentUser?.uid) return;
    setIsProcessing(true);
    try {
      await new Promise((r) => setTimeout(r, 800)); // Simulyatsiya qilingan to'lov kechikishi
      const res = await activateTopPlacement(currentUser.uid, selectedOption.days);

      const updated: UserSession = {
        ...currentUser,
        topPlacementUntil: res.updatedUntil,
      };
      onUpdateUser(updated);

      setStep('success');
    } catch (err) {
      console.error("TOP joylashuvni faollashtirishda xatolik:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      id="top-placement-modal-backdrop"
      className="fixed inset-0 z-[70] bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 pb-[calc(90px+env(safe-area-inset-bottom,0px))] sm:pb-5 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) {
          onClose();
        }
      }}
    >
      <div
        id="top-placement-modal-card"
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto transition-all animate-in fade-in zoom-in-95 duration-200 max-h-[88vh] overflow-y-auto pb-[calc(24px+env(safe-area-inset-bottom,0px))] sm:pb-0"
      >
        {/* Header */}
        <div className="relative p-5 sm:p-7 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-amber-50/70 via-orange-50/50 to-pink-50/60 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-pink-950/30">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 text-white flex items-center justify-center shadow-md shadow-orange-500/30">
              <Flame className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-black text-xl sm:text-2xl text-slate-900 dark:text-white">
                  Profilingizni yuqoriga chiqaring
                </h2>
                <span className="text-2xs font-mono font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  TOP Joylashuv
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-body mt-0.5">
                Katalog va Briflar ro'yxatining eng boshida ko'rining va 5x ko'proq buyurtmalar oling
              </p>
            </div>
          </div>

          {isCurrentlyTop && (
            <div className="mt-3.5 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center gap-2 text-xs font-heading font-bold text-amber-900 dark:text-amber-200">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                Hozirda TOP maqomiga egasiz! Yangi muddat qo'shimcha tarzda uzaytiriladi ({new Date(currentUser?.topPlacementUntil || '').toLocaleDateString('uz-UZ')} gacha faol).
              </span>
            </div>
          )}
        </div>

        {/* Step 1: Select Option */}
        {step === 'select' && (
          <div className="p-5 sm:p-7 space-y-6">
            <div className="space-y-3">
              {TOP_PLACEMENT_OPTIONS.map((opt) => {
                const isSelected = selectedDays === opt.days;
                return (
                  <div
                    key={opt.days}
                    onClick={() => setSelectedDays(opt.days)}
                    className={`relative p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-amber-500 dark:border-amber-400 bg-amber-50/30 dark:bg-amber-950/20 shadow-md'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {opt.isBestValue && (
                      <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[10px] font-heading font-extrabold uppercase tracking-wider shadow-xs">
                        Eng foydali (Best value)
                      </span>
                    )}

                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500 text-white'
                            : 'border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <div>
                        <div className="font-heading font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{opt.label}</span>
                          <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500">
                            ({opt.perDayText})
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-body mt-0.5">
                          Katalog boshida tavsiya etilgan "TOP" belgisi bilan
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-black text-lg sm:text-xl text-slate-900 dark:text-white">
                        {opt.formattedPrice}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Advantages Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="text-xs font-heading font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                TOP joylashuv imtiyozlari:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-body text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Katalogda ro'yxat boshida turish</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Yorqin "TOP" va "Tavsiya" belgisi</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Brendlar e'tiboriga birinchi tushish</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Muddat tugagach avtomatik holatga qaytish</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-heading font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Bekor qilish
              </button>

              <button
                type="button"
                onClick={() => setStep('payment')}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-heading font-extrabold text-sm shadow-md shadow-orange-500/25 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>Davom etish ({selectedOption.formattedPrice})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Payment */}
        {step === 'payment' && (
          <div className="p-5 sm:p-7 space-y-5">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-xs font-body text-slate-500 dark:text-slate-400">Tanlangan muddat:</span>
                <div className="font-heading font-bold text-base text-slate-900 dark:text-white">
                  TOP joylashuv — {selectedOption.label}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-body text-slate-500 dark:text-slate-400">Jami narx:</span>
                <div className="font-mono font-black text-lg text-amber-600 dark:text-amber-400">
                  {selectedOption.formattedPrice}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-heading font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                To'lov usulini tanlang:
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'click', label: 'Click Up' },
                  { id: 'payme', label: 'Payme' },
                  { id: 'uzcard', label: 'Uzcard/Humo' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedProvider(item.id as any)}
                    className={`p-3 rounded-2xl border text-center cursor-pointer transition-all ${
                      selectedProvider === item.id
                        ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/40 shadow-xs font-bold text-amber-900 dark:text-amber-200'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="text-sm font-heading font-bold">{item.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300 font-body">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <span>
                To'lov tasdiqlangach, profilingiz darhol katalogning eng yuqori qismiga ko'tariladi va {selectedOption.days} kun davomida ustuvor ko'rsatiladi.
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3">
              <button
                type="button"
                onClick={() => setStep('select')}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-heading font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Ortga
              </button>

              <button
                type="button"
                onClick={handleConfirmPurchase}
                disabled={isProcessing}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-heading font-extrabold text-sm shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>To'lov amalga oshirilmoqda...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>To'lovni tasdiqlash ({selectedOption.formattedPrice})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 'success' && (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center shadow-lg">
              <Flame className="w-10 h-10" />
            </div>

            <h3 className="font-heading font-black text-2xl text-slate-900 dark:text-white">
              Tabriklaymiz! Profilingiz TOP ga chiqarildi!
            </h3>

            <p className="text-sm text-slate-600 dark:text-slate-400 font-body max-w-md mx-auto leading-relaxed">
              Profilingiz endi <strong>{selectedOption.days} kun</strong> davomida katalog va barcha qidiruvlar boshida "TOP" belgisi bilan ko'rsatiladi.
            </p>

            <div className="pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-heading font-extrabold text-sm shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <span>Tushunarli</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
