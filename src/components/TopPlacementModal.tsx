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
import { ManualPaymentPanel } from './ManualPaymentPanel';

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

  return (
    <div
      id="top-placement-modal-backdrop"
      className="fixed inset-0 z-[70] bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) {
          onClose();
        }
      }}
    >
      <div
        id="top-placement-modal-card"
        className="relative w-full sm:max-w-xl max-h-[94dvh] sm:max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Sticky Header */}
        <div className="relative shrink-0 p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-amber-50/70 via-orange-50/50 to-pink-50/60 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-pink-950/30">
          <button
            type="button"
            onClick={onClose}
            aria-label="Yopish"
            className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 min-w-[44px] min-h-[44px] p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start sm:items-center gap-3 pr-12">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 text-white flex items-center justify-center shadow-md shadow-orange-500/30 shrink-0">
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-heading font-black text-lg sm:text-2xl text-slate-900 dark:text-white leading-tight">
                  Profilingizni yuqoriga chiqaring
                </h2>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  TOP Joylashuv
                </span>
              </div>
              <p className="text-[14px] sm:text-sm text-slate-600 dark:text-slate-300 font-body mt-0.5 leading-snug">
                Katalog va Briflar ro'yxatining eng boshida ko'rining va 5x ko'proq buyurtmalar oling
              </p>
            </div>
          </div>

          {isCurrentlyTop && (
            <div className="mt-3 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-start sm:items-center gap-2 text-xs sm:text-sm font-heading font-bold text-amber-900 dark:text-amber-200 leading-snug">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
              <span>
                Hozirda TOP maqomiga egasiz! Yangi muddat qo'shimcha tarzda uzaytiriladi ({new Date(currentUser?.topPlacementUntil || '').toLocaleDateString('uz-UZ')} gacha faol).
              </span>
            </div>
          )}
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain pb-[max(24px,calc(env(safe-area-inset-bottom,0px)+16px))] sm:pb-0">
          {/* Step 1: Select Option */}
          {step === 'select' && (
            <div className="p-4 sm:p-7 space-y-5 sm:space-y-6">
              <div className="space-y-3">
                {TOP_PLACEMENT_OPTIONS.map((opt) => {
                  const isSelected = selectedDays === opt.days;
                  return (
                    <div
                      key={opt.days}
                      onClick={() => setSelectedDays(opt.days)}
                      className={`relative p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 ${
                        isSelected
                          ? 'border-amber-500 dark:border-amber-400 bg-amber-50/30 dark:bg-amber-950/20 shadow-md'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {opt.isBestValue && (
                        <span className="absolute -top-2.5 right-3 sm:right-4 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[10.5px] font-heading font-extrabold uppercase tracking-wider shadow-xs">
                          Eng foydali (Best value)
                        </span>
                      )}

                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        <div
                          className={`w-5 h-5 mt-0.5 sm:mt-0 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'border-amber-500 bg-amber-500 text-white'
                              : 'border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>

                        <div className="min-w-0">
                          <div className="font-heading font-extrabold text-base text-slate-900 dark:text-white flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span>{opt.label}</span>
                            <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                              ({opt.perDayText})
                            </span>
                          </div>
                          <div className="text-[13.5px] sm:text-xs text-slate-600 dark:text-slate-300 font-body mt-0.5 leading-snug">
                            Katalog boshida tavsiya etilgan "TOP" belgisi bilan
                          </div>
                        </div>
                      </div>

                      <div className="pl-8 sm:pl-0 sm:text-right shrink-0">
                        <div className="font-mono font-black text-lg sm:text-xl text-slate-900 dark:text-white">
                          {opt.formattedPrice}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Advantages Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="text-xs font-heading font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  TOP joylashuv imtiyozlari:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[14px] sm:text-xs font-body text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Katalogda ro'yxat boshida turish</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Yorqin "TOP" va "Tavsiya" belgisi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Brendlar e'tiboriga birinchi tushish</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Muddat tugagach avtomatik holatga qaytish</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-heading font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-center"
                >
                  Bekor qilish
                </button>

                <button
                  type="button"
                  onClick={() => setStep('payment')}
                  className="w-full sm:w-auto min-h-[50px] px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-heading font-extrabold text-[15px] sm:text-sm shadow-md shadow-orange-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Davom etish ({selectedOption.formattedPrice})</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 'payment' && (
            <ManualPaymentPanel
              currentUser={currentUser}
              purpose="top"
              amount={selectedOption.price}
              purposeLabel={`TOP joylashuv — ${selectedOption.label}`}
              topDays={selectedOption.days}
              onBack={() => setStep('select')}
              onSubmitted={() => setStep('success')}
            />
          )}

          {step === 'success' && (
            <div className="p-6 sm:p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center shadow-lg">
                <Flame className="w-10 h-10" />
              </div>

              <h3 className="font-heading font-black text-xl sm:text-2xl text-slate-900 dark:text-white">
                Chek yuborildi!
              </h3>

              <p className="text-[15px] sm:text-sm text-slate-600 dark:text-slate-300 font-body max-w-md mx-auto leading-relaxed">
                Admin toʻlovni tasdiqlagach, profilingiz <strong>{selectedOption.days} kun</strong> davomida katalog boshida &quot;TOP&quot; belgisi bilan koʻrsatiladi.
              </p>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-heading font-extrabold text-[15px] sm:text-sm shadow-md transition-all cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  <span>Tushunarli</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
