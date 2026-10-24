import React, { useState, useRef } from 'react';
import {
  X,
  Sparkles,
  Check,
  ShieldCheck,
  Search,
  Send,
  Eye,
  Award,
  MessageSquare,
  Clock,
  BarChart3,
  TrendingUp,
  CreditCard,
  Lock,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Copy,
  UploadCloud,
  FileImage,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { UserSession } from '../types';
import { submitPaymentRequest } from '../firebase';

interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession | null;
  onUpdateUser: (user: UserSession) => void;
  onOpenRegisterModal?: () => void;
}

export const ProUpgradeModal: React.FC<ProUpgradeModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onOpenRegisterModal,
}) => {
  const [step, setStep] = useState<'details' | 'payment' | 'submitted'>('details');
  const [selectedProvider, setSelectedProvider] = useState<'card' | 'click' | 'payme'>('card');
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);
  const [copiedCard, setCopiedCard] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [nonLoggedInName, setNonLoggedInName] = useState('');
  const [nonLoggedInPhone, setNonLoggedInPhone] = useState('+998 ');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleStartPayment = () => {
    if (!currentUser?.uid) {
      if (onOpenRegisterModal) {
        onOpenRegisterModal();
        return;
      }
    }
    setStep('payment');
  };

  const handleCopyCard = () => {
    navigator.clipboard.writeText('9860090106998728');
    setCopiedCard(true);
    setTimeout(() => setCopiedCard(false), 2500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';

    if (!isImage && !isPdf) {
      setFormError('Iltimos, faqat rasm (PNG, JPG, JPEG) yoki PDF fayl yuklang.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setFormError('Fayl hajmi juda katta (15 MB dan kichik chek tanlang).');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setReceiptFile(file);
    setFormError(null);

    if (isPdf) {
      setReceiptPreview('pdf_selected');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string' && result.length > 0) {
        setReceiptPreview(result);
      } else {
        setFormError('Rasmni oʻqishda xatolik yuz berdi. Boshqa skrinshot tanlab koʻring.');
      }
    };
    reader.onerror = () => {
      setFormError('Rasmni oʻqishda xatolik yuz berdi. Iltimos, boshqa rasm tanlang.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getReadablePaymentError = (err: any): string => {
    const code = String(err?.code || '').toLowerCase();
    const rawMsg = String(err?.message || '');

    if (code.includes('permission-denied') || rawMsg.toLowerCase().includes('missing or insufficient permissions')) {
      return "Ma'lumotlar bazasiga yozishga ruxsat berilmadi (Firestore ruxsatlari). Iltimos, akkauntingizga qayta kirib urinib ko'ring yoki adminga murojaat qiling.";
    }
    if (code.includes('unavailable') || rawMsg.toLowerCase().includes('offline') || rawMsg.toLowerCase().includes('network')) {
      return "Internet aloqasi uzildi yoki beqaror. Internetingizni tekshirib, qaytadan urinib ko'ring.";
    }
    if (code.includes('resource-exhausted') || rawMsg.toLowerCase().includes('quota')) {
      return "Server band yoki limitga yetdi. Iltimos, birozdan so'ng qayta urinib ko'ring.";
    }
    if (rawMsg && !rawMsg.toLowerCase().includes('firebase')) {
      return rawMsg;
    }
    return "So'rovni yuborishda xatolik yuz berdi. Internet aloqangizni tekshirib, qaytadan urinib ko'ring.";
  };

  const handleSubmitPayment = async () => {
    if (isProcessing) return;

    if (!currentUser?.uid) {
      setFormError('Toʻlov chekini yuborish uchun avval tizimga kiring yoki roʻyxatdan oʻting.');
      if (onOpenRegisterModal) {
        onOpenRegisterModal();
      }
      return;
    }

    if (!receiptFile && !receiptPreview) {
      setFormError('Iltimos, oʻtkazilgan toʻlov cheki yoki screenshotini yuklang.');
      return;
    }

    setIsProcessing(true);
    setFormError(null);
    console.log('[handleSubmitPayment] Soʻrov yuborish boshlandi...');

    let uiGuardTimer: ReturnType<typeof setTimeout> | null = null;
    try {
      const userId = currentUser.uid;
      const userName = currentUser.name || nonLoggedInName.trim() || 'Foydalanuvchi';
      const userPhone = currentUser.phoneNumber || currentUser.contact || (nonLoggedInPhone.trim() !== '+998' ? nonLoggedInPhone.trim() : '');
      const userEmail = currentUser.email || '';
      const userRole = currentUser.role || 'brend';

      const uiTimeoutPromise = new Promise<never>((_, reject) => {
        uiGuardTimer = setTimeout(() => {
          reject(new Error("Yuklash vaqti cho'zilib ketdi. Internetingizni tekshirib, qaytadan urinib ko'ring."));
        }, 16000);
      });

      await Promise.race([
        submitPaymentRequest({
          userId,
          userName,
          userPhone,
          userEmail,
          userRole,
          screenshotFile: receiptFile,
          screenshotDataUrl: receiptPreview && receiptPreview !== 'pdf_selected' ? receiptPreview : undefined,
        }),
        uiTimeoutPromise,
      ]);

      console.log('[handleSubmitPayment] Soʻrov muvaffaqiyatli saqlandi!');
      setIsProcessing(false);
      setStep('submitted');
    } catch (err: any) {
      console.error('[handleSubmitPayment] Toʻlov soʻrovini yuborishda xatolik:', err);
      setIsProcessing(false);
      setFormError(getReadablePaymentError(err));
    } finally {
      if (uiGuardTimer) clearTimeout(uiGuardTimer);
      setIsProcessing(false);
    }
  };

  const handleFinish = () => {
    setStep('details');
    setReceiptFile(null);
    setReceiptPreview(null);
    setLockedNotice(null);
    setFormError(null);
    onClose();
  };

  return (
    <div
      id="pro-upgrade-modal-backdrop"
      className="fixed inset-0 z-[70] bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 pb-[calc(90px+env(safe-area-inset-bottom,0px))] sm:pb-5 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) {
          onClose();
        }
      }}
    >
      <div
        id="pro-upgrade-modal-card"
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto transition-all animate-in fade-in zoom-in-95 duration-200 max-h-[88vh] overflow-y-auto pb-[calc(24px+env(safe-area-inset-bottom,0px))] sm:pb-0"
      >
        {/* Decorative subtle gradient ribbon */}
        <div className="h-2 w-full bg-gradient-to-r from-amber-400 via-indigo-600 to-purple-600" />

        {/* Close button */}
        <button
          type="button"
          id="btn-close-pro-modal"
          onClick={onClose}
          disabled={isProcessing}
          aria-label="Yopish"
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'details' && (
          <div className="p-6 sm:p-8">
            {/* Header with Sparkle pill */}
            <div className="text-center max-w-lg mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/10 to-indigo-500/10 border border-amber-300/60 dark:border-amber-700/60 text-amber-700 dark:text-amber-300 text-xs font-mono font-bold uppercase tracking-wider mb-2.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Collabix Pro imkoniyatlari</span>
              </div>
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
                Pro rejimga oʻtish
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-body mt-1.5 leading-relaxed">
                Platformadagi barcha qulayliklar va vositalardan cheklovlarsiz foydalaning.
              </p>
            </div>

            {/* 4 Clean Categorized Feature Blocks */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              {/* KATEGORIYA: KIRISH IMKONIYATI */}
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <Search className="w-3.5 h-3.5 stroke-[2.4]" />
                    </div>
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                      KIRISH IMKONIYATI
                    </span>
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 font-body">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]" />
                      <span>Toʻliq katalogga cheklovlarsiz kirish (barcha 100+ blogerlar)</span>
                    </li>
                    <li className="flex items-start gap-2 text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 font-body">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]" />
                      <span>Barcha toifalar: Blogger, Mini Blogger, Model, Brand Face</span>
                    </li>
                    <li className="flex items-start gap-2 text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 font-body">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]" />
                      <span>Cheksiz briflar yuborish</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* KATEGORIYA: KO'RINISH */}
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Eye className="w-3.5 h-3.5 stroke-[2.4]" />
                    </div>
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                      KOʻRINISH
                    </span>
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 font-body">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]" />
                      <span>Profilingiz katalogda "Pro" nishoni bilan ajralib turadi</span>
                    </li>
                    <li className="flex items-start gap-2 text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 font-body">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]" />
                      <span>Qidiruv natijalarida yuqoriroq oʻrinda chiqish</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* KATEGORIYA: MULOQOT */}
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-3.5 h-3.5 stroke-[2.4]" />
                    </div>
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                      MULOQOT
                    </span>
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 font-body">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]" />
                      <span>Blogerlar bilan toʻgʻridan-toʻgʻri bogʻlanish (Telegram, telefon)</span>
                    </li>
                    <li className="flex items-start gap-2 text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 font-body">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]" />
                      <span>24 soat ichida kafolatlangan javob</span>
                    </li>
                    <li className="flex items-start gap-2 text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 font-body">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]" />
                      <span>Maxsus yordam xizmati (Priority Support)</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* KATEGORIYA: STATISTIKA */}
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <BarChart3 className="w-3.5 h-3.5 stroke-[2.4]" />
                    </div>
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                      STATISTIKA
                    </span>
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 font-body">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]" />
                      <span>Blogerlarning haqiqiy auditoriya statistikasi (ER, demografiya)</span>
                    </li>
                    <li className="flex items-start gap-2 text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 font-body">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]" />
                      <span>Soxta (nakrutka) obunachilarni aniqlash tizimi</span>
                    </li>
                    <li className="flex items-start gap-2 text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 font-body">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]" />
                      <span>Hamkorlik natijalarini kuzatish</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Bottom Section: Primary CTA + Small informational notice + Payment Badges */}
            <div className="mt-7 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
              <button
                type="button"
                id="btn-pro-activate-cta"
                onClick={handleStartPayment}
                className="w-full sm:w-auto min-w-[320px] py-4 px-8 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-heading font-extrabold text-base sm:text-lg tracking-tight shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 active:scale-98 transition-all cursor-pointer inline-flex items-center justify-center gap-2.5"
              >
                <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300/30" />
                <span>Pro rejimga oʻtish — 59 000 soʻm/oy</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>

              {/* Informational reassurance notice */}
              <p className="text-[12px] sm:text-xs text-slate-500 dark:text-slate-400 font-body mt-2.5 max-w-md mx-auto leading-relaxed">
                30 kun ichida birorta ham kreator javob bermasa, 59 000 soʻm toʻliq qaytariladi. Istalgan vaqt bekor qilish mumkin.
              </p>

              {/* Supported Payment Badges */}
              <div className="mt-4 flex items-center justify-center gap-2 flex-wrap text-xs text-slate-400 dark:text-slate-500">
                <span className="text-[11px] font-mono">Qabul qilinadi:</span>
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-heading font-bold text-xs border border-blue-200/60 dark:border-blue-800/60">
                  CLICK
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 font-heading font-bold text-xs border border-cyan-200/60 dark:border-cyan-800/60">
                  Payme
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-heading font-bold text-xs border border-indigo-200/60 dark:border-indigo-800/60">
                  UzCard / Humo
                </span>
              </div>
            </div>
          </div>
        )}

        {step === 'payment' && (
          <div className="p-6 sm:p-8 max-h-[85vh] overflow-y-auto">
            <div className="text-center max-w-md mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center mx-auto mb-3 shadow-xs">
                <CreditCard className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-white">
                Pro rejim toʻlovi
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-body mt-1">
                30 kunlik toʻliq imkoniyatlar uchun oylik toʻlov
              </p>
            </div>

            {/* Price badge */}
            <div className="mt-4 p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-heading font-bold text-indigo-950 dark:text-indigo-200">
                  Pro rejim oylik obunasi
                </span>
                <p className="text-[11px] text-indigo-700 dark:text-indigo-400 font-body">
                  Barcha katalog va tahlillar ochiladi
                </p>
              </div>
              <div className="text-right">
                <span className="font-heading font-black text-xl text-indigo-950 dark:text-indigo-200">
                  59 000 soʻm
                </span>
                <span className="text-[11px] block text-indigo-600/80 dark:text-indigo-400 font-body">/ oy</span>
              </div>
            </div>

            {/* Payment provider options */}
            <div className="mt-5">
              <label className="block text-xs font-heading font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Toʻlov usulini tanlang:
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {/* CLICK - LOCKED */}
                <button
                  type="button"
                  id="btn-payment-click"
                  onClick={() => {
                    setLockedNotice('Click orqali toʻlov tez orada ishga tushadi. Hozircha bank kartasi orqali toʻlashingiz mumkin.');
                  }}
                  className="relative p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/40 text-center opacity-70 hover:opacity-90 transition-all cursor-pointer group"
                >
                  <div className="absolute top-2 right-2 p-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    <Lock className="w-3 h-3" />
                  </div>
                  <span className="block text-xs font-heading font-bold text-slate-700 dark:text-slate-300">
                    CLICK
                  </span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium block mt-0.5">
                    Tez orada
                  </span>
                </button>

                {/* PAYME - LOCKED */}
                <button
                  type="button"
                  id="btn-payment-payme"
                  onClick={() => {
                    setLockedNotice('Payme orqali toʻlov tez orada ishga tushadi. Hozircha bank kartasi orqali toʻlashingiz mumkin.');
                  }}
                  className="relative p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/40 text-center opacity-70 hover:opacity-90 transition-all cursor-pointer group"
                >
                  <div className="absolute top-2 right-2 p-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    <Lock className="w-3 h-3" />
                  </div>
                  <span className="block text-xs font-heading font-bold text-slate-700 dark:text-slate-300">
                    Payme
                  </span>
                  <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-medium block mt-0.5">
                    Tez orada
                  </span>
                </button>

                {/* BANK KARTASI - ACTIVE */}
                <button
                  type="button"
                  id="btn-payment-bank-card"
                  onClick={() => {
                    setSelectedProvider('card');
                    setLockedNotice(null);
                  }}
                  className="p-3 rounded-2xl border-2 border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 text-center shadow-xs transition-all cursor-pointer relative ring-2 ring-indigo-500/20"
                >
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="block text-xs font-heading font-extrabold text-indigo-700 dark:text-indigo-300">
                    Bank kartasi
                  </span>
                  <span className="text-[10px] text-indigo-600/90 dark:text-indigo-400 block mt-0.5 font-medium">
                    Ishlamoqda ✓
                  </span>
                </button>
              </div>

              {/* Locked Notice alert banner */}
              {lockedNotice && (
                <div className="mt-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200 animate-in fade-in duration-200">
                  <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-heading font-semibold">{lockedNotice}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLockedNotice(null)}
                    className="text-amber-600 hover:text-amber-800 text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* BANK KARTASI DETAILS CARD */}
            <div className="mt-4 p-4.5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono tracking-wider uppercase text-indigo-300/80">
                  Uzcard / Humo oʻtkazmasi
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono font-bold">
                  59 000 UZS
                </span>
              </div>

              {/* Card Number with Copy */}
              <div className="mt-1 flex items-center justify-between gap-2 bg-black/30 p-2.5 rounded-xl border border-white/10">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-slate-400 block font-body">Karta raqami:</span>
                  <span className="font-mono font-extrabold text-[14px] xs:text-[16px] sm:text-lg tracking-normal sm:tracking-wider text-white whitespace-nowrap block select-all">
                    9860 0901 0699 8728
                  </span>
                </div>
                <button
                  type="button"
                  id="btn-copy-card-number"
                  onClick={handleCopyCard}
                  className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] sm:text-xs font-heading font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                >
                  {copiedCard ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Nusxalandi!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Nusxa olish</span>
                    </>
                  )}
                </button>
              </div>

              {/* Card Holder & Amount Info */}
              <div className="mt-3 flex items-center justify-between text-xs text-slate-300">
                <div>
                  <span className="text-[10px] text-slate-400 block">Karta egasi:</span>
                  <span className="font-heading font-bold text-white text-xs sm:text-sm">Sobirov Aziz</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Toʻlov miqdori:</span>
                  <span className="font-heading font-bold text-amber-300 text-xs sm:text-sm">59 000 soʻm</span>
                </div>
              </div>
            </div>

            {/* Instruction banner */}
            <div className="mt-3.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/90 dark:border-slate-800 flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
              <span className="text-base shrink-0">💡</span>
              <p className="font-body leading-relaxed">
                <strong className="font-heading font-bold text-slate-900 dark:text-white">Koʻrsatma: </strong>
                Yuqoridagi kartaga 59,000 soʻm oʻtkazing, soʻngra screenshot/chek yuklang va &quot;Toʻlov qildim&quot; tugmasini bosing.
              </p>
            </div>

            {/* Guest form if not logged in */}
            {!currentUser && (
              <div className="mt-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <span className="text-[11px] font-heading font-bold text-slate-700 dark:text-slate-300 block">
                  Aloqa maʼlumotlaringiz (admin tasdiqlashi uchun):
                </span>
                <div>
                  <input
                    type="text"
                    value={nonLoggedInName}
                    onChange={(e) => setNonLoggedInName(e.target.value)}
                    placeholder="Ismingiz yoki brend nomi *"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-body text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    value={nonLoggedInPhone}
                    onChange={(e) => setNonLoggedInPhone(e.target.value)}
                    placeholder="Telefon raqamingiz (+998 ...)"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-body text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* CHEK YUKLASH (FILE UPLOAD) MAYDONI */}
            <div className="mt-4">
              <label className="block text-xs font-heading font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Toʻlov cheki (rasm yoki screenshot): <span className="text-rose-500">*</span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="hidden"
                id="receipt-file-input"
              />

              {!receiptPreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-2xl p-4 sm:p-5 text-center cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                    <UploadCloud className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <span className="text-xs font-heading font-bold text-slate-800 dark:text-slate-200 block">
                    Chek yoki screenshotni yuklash uchun bosing
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-body block mt-0.5">
                    PNG, JPG, JPEG yoki PDF (15 MB gacha) qabul qilinadi
                  </span>
                </div>
              ) : (
                <div className="relative p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 bg-black/5 flex items-center justify-center">
                    {receiptPreview === 'pdf_selected' ? (
                      <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">PDF</span>
                    ) : (
                      <img
                        src={receiptPreview}
                        alt="Toʻlov cheki"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-heading font-bold text-slate-900 dark:text-white truncate block">
                      {receiptFile?.name || 'Toʻlov cheki'}
                    </span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium block">
                      ✓ Fayl muvaffaqiyatli tanlandi
                    </span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] font-heading font-semibold text-indigo-600 dark:text-indigo-400 hover:underline mt-0.5"
                    >
                      Boshqa fayl tanlash
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveReceipt}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Oʻchirish"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Error Message banner */}
            {formError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="font-body">{formError}</p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => setStep('details')}
                disabled={isProcessing}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-heading font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Ortga
              </button>
              <button
                type="button"
                id="btn-confirm-pro-payment"
                onClick={handleSubmitPayment}
                disabled={isProcessing}
                className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-heading font-bold text-xs sm:text-sm tracking-tight shadow-md shadow-indigo-600/20 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Chek yuklanmoqda va soʻrov yuborilmoqda...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Toʻlov qildim</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 mt-3 font-body">
              Oylik obuna — 59 000 soʻm, istalgan vaqt bekor qilishingiz mumkin
            </p>
          </div>
        )}

        {step === 'submitted' && (
          <div className="p-8 sm:p-10 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto shadow-md mb-4">
              <CheckCircle2 className="w-9 h-9 stroke-[2.2]" />
            </div>

            <span className="inline-block text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-2">
              Soʻrov yuborildi ✓
            </span>

            <h3 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white">
              Soʻrov yuborildi
            </h3>

            <div className="mt-3 p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-body max-w-lg mx-auto leading-relaxed">
              <p className="font-heading font-bold text-indigo-950 dark:text-indigo-200 text-sm sm:text-base mb-1">
                So&apos;rovingiz yuborildi, admin tasdiqlagach Pro rejim faollashadi (odatda bir necha soat ichida)
              </p>
              <p className="text-slate-600 dark:text-slate-300 text-xs mt-1">
                Admin toʻlov chekingizni tekshirib chiqqandan soʻng profilingiz avtomatik ravishda Pro rejimga oʻtadi va barcha imkoniyatlar ochiladi.
              </p>
            </div>

            {/* Summary card */}
            <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-left max-w-md mx-auto space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Summa:</span>
                <span className="font-heading font-bold text-slate-900 dark:text-white">59 000 soʻm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Karta raqami:</span>
                <span className="font-mono text-slate-900 dark:text-white">9860 0901 0699 8728</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Karta egasi:</span>
                <span className="font-heading font-medium text-slate-900 dark:text-white">Sobirov Aziz</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Holati:</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">Kutilmoqda (pending)</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                id="btn-pro-submitted-finish"
                onClick={handleFinish}
                className="w-full sm:w-auto py-3 px-8 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-heading font-bold text-xs tracking-tight shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Tushundim (oynani yopish)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
