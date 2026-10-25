import React, { useRef, useState } from 'react';
import { Check, Copy, Loader2, Upload, X, ShieldCheck, ArrowRight } from 'lucide-react';
import { UserSession, PaymentPurpose } from '../types';
import { submitPaymentRequest } from '../firebase';

const CARD_NUMBER = '9860090106998728';
const CARD_NUMBER_DISPLAY = '9860 0901 0699 8728';
const CARD_OWNER = 'Sobirov Aziz';

export interface ManualPaymentPanelProps {
  currentUser: UserSession | null;
  purpose: PaymentPurpose;
  amount: number;
  purposeLabel: string;
  contactsCount?: number;
  topDays?: number;
  onBack: () => void;
  onSubmitted: () => void;
}

function formatSom(n: number): string {
  return `${n.toLocaleString('ru-RU').replace(/,/g, ' ')} soʻm`;
}

/**
 * Karta orqali qo'lda to'lov: karta raqami → chek yuklash → admin tasdig'i.
 * Kontakt paketi va TOP joylashuv uchun umumiy bo'lim.
 */
export const ManualPaymentPanel: React.FC<ManualPaymentPanelProps> = ({
  currentUser,
  purpose,
  amount,
  purposeLabel,
  contactsCount,
  topDays,
  onBack,
  onSubmitted,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(CARD_NUMBER);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError('Iltimos, chekning skrinshotini (JPG yoki PNG) yuklang.');
      return;
    }
    if (f.size > 15 * 1024 * 1024) {
      setError('Fayl hajmi juda katta (15 MB dan kichik rasm tanlang).');
      return;
    }
    setError(null);
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === 'string') setPreview(result);
    };
    reader.readAsDataURL(f);
  };

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (isSending) return;
    if (!currentUser?.uid) {
      setError('Toʻlov chekini yuborish uchun avval tizimga kiring.');
      return;
    }
    if (!file && !preview) {
      setError('Iltimos, toʻlov chekining skrinshotini yuklang.');
      return;
    }
    setIsSending(true);
    setError(null);
    try {
      await submitPaymentRequest({
        userId: currentUser.uid,
        userName: currentUser.name || 'Foydalanuvchi',
        userPhone: currentUser.phoneNumber || currentUser.contact || '',
        userEmail: currentUser.email || '',
        userRole: currentUser.role || '',
        screenshotFile: file,
        screenshotDataUrl: preview || undefined,
        purpose,
        amount,
        contactsCount,
        topDays,
        purposeLabel,
      });
      onSubmitted();
    } catch (err: any) {
      const msg = String(err?.message || '');
      setError(
        msg && !msg.toLowerCase().includes('firebase')
          ? msg
          : "Soʻrovni yuborishda xatolik yuz berdi. Internetni tekshirib, qayta urinib koʻring."
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-4 sm:p-7 space-y-5">
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="text-xs text-slate-500 dark:text-slate-400">Xarid:</span>
          <div className="font-heading font-bold text-[15px] sm:text-base text-slate-900 dark:text-white">{purposeLabel}</div>
        </div>
        <div className="sm:text-right">
          <span className="text-xs text-slate-500 dark:text-slate-400">Jami toʻlov:</span>
          <div className="font-mono font-black text-lg text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{formatSom(amount)}</div>
        </div>
      </div>

      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 dark:bg-slate-950 border border-slate-700 text-white">
        <div className="text-xs uppercase tracking-wider text-slate-400 font-heading font-bold mb-2">Karta raqami</div>
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono font-extrabold text-[15px] xs:text-base sm:text-lg tracking-normal sm:tracking-wider whitespace-nowrap select-all">
            {CARD_NUMBER_DISPLAY}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 min-h-[44px] px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-heading font-bold flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Nusxalandi' : 'Nusxalash'}</span>
          </button>
        </div>
        <div className="mt-2 text-sm text-slate-300">
          Karta egasi: <span className="font-bold text-white">{CARD_OWNER}</span>
        </div>
      </div>

      <p className="text-[14px] sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        Yuqoridagi kartaga <strong>{formatSom(amount)}</strong> oʻtkazing, soʻngra chek skrinshotini yuklang va
        &quot;Toʻlov qildim&quot; tugmasini bosing. Admin tekshirgach, xarid hisobingizga avtomatik qoʻshiladi.
      </p>

      <div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        {preview ? (
          <div className="relative rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <img src={preview} alt="Toʻlov cheki" className="w-full max-h-64 object-contain bg-slate-50 dark:bg-slate-800" />
            <button
              type="button"
              onClick={handleRemove}
              aria-label="Chekni olib tashlash"
              className="absolute top-2 right-2 min-w-[44px] min-h-[44px] rounded-xl bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full min-h-[96px] rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 text-slate-600 dark:text-slate-300 flex flex-col items-center justify-center gap-2 cursor-pointer"
          >
            <Upload className="w-6 h-6" />
            <span className="text-sm font-heading font-bold">Chek skrinshotini yuklash</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-2.5 text-[14px] sm:text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
        <span>Odatda bir necha soat ichida tasdiqlanadi. Tasdiqlanganda sizga xabar keladi.</span>
      </div>

      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 pt-1">
        <button
          type="button"
          onClick={onBack}
          disabled={isSending}
          className="min-h-[48px] px-5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-heading font-bold text-sm cursor-pointer disabled:opacity-50"
        >
          Orqaga
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSending}
          className="min-h-[48px] px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-heading font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          <span>{isSending ? 'Yuborilmoqda...' : 'Toʻlov qildim'}</span>
        </button>
      </div>
    </div>
  );
};
