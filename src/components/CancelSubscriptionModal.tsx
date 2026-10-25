import React, { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  X,
  Loader2,
  CheckCircle2,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';
import { formatUzbekDate } from '../firebase';
import { CANCELLATION_REASONS, UserSession } from '../types';

interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmCancel: (reason: string, reasonDetails?: string) => Promise<void>;
  trialEndDate?: string;
  user?: UserSession | null;
}

export const CancelSubscriptionModal: React.FC<CancelSubscriptionModalProps> = ({
  isOpen,
  onClose,
  onConfirmCancel,
  trialEndDate,
  user,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [otherDetails, setOtherDetails] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const formattedDate = formatUzbekDate(trialEndDate) || 'toʻlov davri tugaguncha';

  const handleClose = () => {
    if (isProcessing) return;
    setValidationError(null);
    setErrorMessage(null);
    setSelectedReason('');
    setOtherDetails('');
    onClose();
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) {
      setValidationError("Iltimos, obunani bekor qilish sababini tanlang.");
      return;
    }

    if (selectedReason === "Boshqa sabab" && !otherDetails.trim()) {
      setValidationError("Iltimos, oʻz sababingizni qisqacha izohlab yozing.");
      return;
    }

    setValidationError(null);
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      await onConfirmCancel(selectedReason, otherDetails.trim() || undefined);
      handleClose();
    } catch (err: any) {
      console.error('Obunani bekor qilishda xatolik:', err);
      setErrorMessage("Obunani bekor qilishda xatolik yuz berdi. Iltimos, qaytadan urinib koʻring.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputFocusCapture = (e: React.FocusEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target && target.tagName === 'TEXTAREA') {
      setTimeout(() => {
        target.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 260);
    }
  };

  return (
    <div
      id="cancel-subscription-modal-backdrop"
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-5 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        id="cancel-subscription-modal-content"
        className="relative w-full sm:max-w-lg max-h-[92dvh] sm:max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-slate-900/25 transform transition-all text-left overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onFocusCapture={handleInputFocusCapture}
      >
        <div className="shrink-0 px-5 sm:px-7 pt-4 sm:pt-5 pb-3.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <h3 className="font-heading font-extrabold text-lg sm:text-xl text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                Obunani bekor qilish
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-body truncate">
                Pro rejimni bekor qilish sababini belgilang
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-cancel-sub-modal"
            onClick={handleClose}
            disabled={isProcessing}
            className="min-w-[44px] min-h-[44px] p-2.5 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center shrink-0"
            aria-label="Yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-7 pt-4 pb-[max(24px,calc(env(safe-area-inset-bottom,0px)+16px))] sm:pb-7">
        {/* Question Title */}
        <div className="mb-4">
          <label className="block text-[15px] sm:text-sm font-heading font-bold text-slate-800 dark:text-slate-200 mb-1">
            Nega Pro rejimdan voz kechmoqchisiz?
          </label>
          <p className="text-sm sm:text-xs text-slate-500 dark:text-slate-400 font-body leading-relaxed">
            Fikringiz platformamizni rivojlantirish va xizmat sifatini oshirish uchun juda muhim.
          </p>
        </div>

        <form onSubmit={handleConfirm} className="space-y-4">
          {/* Reasons Radio List */}
          <div className="space-y-2" role="radiogroup" aria-label="Bekor qilish sabablari">
            {CANCELLATION_REASONS.map((reason, idx) => {
              const isSelected = selectedReason === reason;
              const inputId = `cancel-reason-${idx}`;

              return (
                <label
                  key={reason}
                  htmlFor={inputId}
                  className={`min-h-[48px] flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700/80 shadow-xs'
                      : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3 pr-2">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all shrink-0 ${
                        isSelected
                          ? 'border-amber-600 dark:border-amber-400 bg-amber-600 dark:bg-amber-400'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-slate-950" />}
                    </div>
                    <span
                      className={`text-[15px] sm:text-sm font-body ${
                        isSelected
                          ? 'font-bold text-slate-900 dark:text-slate-100'
                          : 'font-medium text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {reason}
                    </span>
                  </div>

                  <input
                    type="radio"
                    id={inputId}
                    name="cancellation-reason"
                    value={reason}
                    checked={isSelected}
                    onChange={() => {
                      setSelectedReason(reason);
                      setValidationError(null);
                    }}
                    className="sr-only"
                  />
                </label>
              );
            })}
          </div>

          {/* Conditional Textarea for "Boshqa sabab" */}
          {selectedReason === 'Boshqa sabab' && (
            <div className="pt-1 animate-in fade-in slide-in-from-top-2 duration-200">
              <label
                htmlFor="cancel-other-reason-input"
                className="flex items-center gap-1.5 text-xs font-heading font-bold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                <span>Oʻz soʻzingiz bilan izoh qoldiring:</span>
              </label>
              <textarea
                id="cancel-other-reason-input"
                value={otherDetails}
                onChange={(e) => {
                  setOtherDetails(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                rows={3}
                maxLength={500}
                placeholder="Qanday qulaylik yoki xizmat yetishmadi? Bizga batafsil yozib bering..."
                className="w-full px-3.5 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all resize-none"
              />
              <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span>Platformani yaxshilashimiz uchun foydali</span>
                <span>{otherDetails.length}/500</span>
              </div>
            </div>
          )}

          {/* Assurance info box */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5 text-sm sm:text-xs font-body text-slate-600 dark:text-slate-300">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              Obunani bekor qilsangiz ham, <strong>{formattedDate}</strong>gacha Pro imkoniyatlaridan toʻliq foydalana olasiz. Toʻlov davri tugagach, hisobingizdan mablagʻ yechilmaydi.
            </div>
          </div>

          {/* Validation & Error Messages */}
          {validationError && (
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs font-medium flex items-center gap-2">
              <HelpCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{validationError}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {/* Action Buttons: "Bekor qilish" (confirm) and "Bekor qilmayman" */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row items-center gap-2.5">
            <button
              type="button"
              id="btn-keep-subscription"
              onClick={handleClose}
              disabled={isProcessing}
              className="w-full sm:flex-1 min-h-[48px] py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-heading font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Bekor qilmayman</span>
            </button>

            <button
              type="submit"
              id="btn-confirm-cancel-subscription"
              disabled={isProcessing}
              className="w-full sm:flex-1 min-h-[48px] py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-sm font-heading font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saqlanmoqda...</span>
                </>
              ) : (
                <span>Bekor qilish</span>
              )}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};
