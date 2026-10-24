import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Check,
  ShieldCheck,
  CreditCard,
  Lock,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Clock,
  Layers,
  HelpCircle,
  PhoneCall,
  Zap,
} from 'lucide-react';
import { UserSession } from '../types';
import { purchaseContactPackage, unlockCreatorContact } from '../firebase';

export interface ContactPackagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession | null;
  targetCreator?: { id: string; name: string; avatar?: string } | null;
  onUpdateUser: (user: UserSession) => void;
  onOpenProModal?: () => void;
  onContactUnlockedSuccess?: (creatorId: string) => void;
  onOpenRegisterModal?: () => void;
}

export interface ContactPackageItem {
  id: 'single' | 'mini' | 'standard';
  title: string;
  contactsCount: number;
  price: number;
  formattedPrice: string;
  perContactText: string;
  badge?: string;
  features: string[];
}

export const CONTACT_PACKAGES: ContactPackageItem[] = [
  {
    id: 'single',
    title: "Kontaktni ochish",
    contactsCount: 1,
    price: 19000,
    formattedPrice: "19 000 so'm",
    perContactText: "72 soatlik kirish · bir martalik to'lov",
    features: [
      "Kreatorning telefon va Telegram ma'lumotlari",
      "72 soatlik to'liq kirish",
      "Xavfsiz to'lov: Click, Payme, Uzcard",
    ],
  },
  // Qolgan paketlar keyinchalik yoqish uchun saqlangan:
  /*
  {
    id: 'mini',
    title: 'Mini',
    contactsCount: 5,
    price: 85000,
    formattedPrice: "85,000 so'm",
    perContactText: "1 kontakt uchun ~17,000 so'm (chegirma)",
    badge: 'Tejamkor',
    features: [
      "5 ta kontakt uchun 72 soatlik kirish",
      "Saqlanganlar ro'yxati (5 ta)",
      "Texnik yordam 24/7",
      "1 oy amal qiladi",
    ],
  },
  {
    id: 'standard',
    title: 'Standart',
    contactsCount: 12,
    price: 180000,
    formattedPrice: "180,000 so'm",
    perContactText: "1 kontakt uchun ~15,000 so'm (eng katta chegirma)",
    badge: 'Eng katta chegirma',
    features: [
      "12 ta kontakt uchun 72 soatlik kirish",
      "Saqlanganlar ro'yxati (12 ta)",
      "Ustuvor texnik yordam",
      "1 oy amal qiladi",
    ],
  },
  */
];

export const ContactPackagesModal: React.FC<ContactPackagesModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  targetCreator,
  onUpdateUser,
  onOpenProModal,
  onContactUnlockedSuccess,
  onOpenRegisterModal,
}) => {
  const [selectedPackageId, setSelectedPackageId] = useState<'single' | 'mini' | 'standard'>('single');
  const [step, setStep] = useState<'select' | 'payment' | 'success'>('select');
  const [selectedProvider, setSelectedProvider] = useState<'click' | 'payme' | 'uzcard'>('click');
  const [isProcessing, setIsProcessing] = useState(false);
  const [guestPhone, setGuestPhone] = useState('+998 ');

  if (!isOpen) return null;

  const currentBalance = currentUser?.unlockedContactsCount || 0;
  const selectedPackage = CONTACT_PACKAGES[0];

  // Agar foydalanuvchida allaqachon balansda ochilmagan kontakt bo'lsa va targetCreator berilgan bo'lsa
  const handleDirectUnlock = async () => {
    if (!currentUser?.uid || !targetCreator?.id) return;
    setIsProcessing(true);
    try {
      const res = await unlockCreatorContact(currentUser.uid, targetCreator.id);
      onUpdateUser(res.updatedUser);
      if (onContactUnlockedSuccess) {
        onContactUnlockedSuccess(targetCreator.id);
      }
      onClose();
    } catch (err: any) {
      alert(err.message || 'Xatolik yuz berdi');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProceedToPayment = () => {
    if (!currentUser && onOpenRegisterModal) {
      onClose();
      onOpenRegisterModal();
      return;
    }
    setStep('payment');
  };

  const handleConfirmPurchase = async () => {
    setIsProcessing(true);
    try {
      await new Promise((r) => setTimeout(r, 800)); // Simulyatsiya qilingan to'lov kechikishi

      if (currentUser?.uid) {
        const updated = await purchaseContactPackage(currentUser.uid, selectedPackage.id, selectedPackage.contactsCount);
        onUpdateUser(updated);

        // Agar ochmoqchi bo'lgan kreator bo'lsa, darhol 1 tasini ishlatib ochish
        if (targetCreator?.id) {
          try {
            const unlockRes = await unlockCreatorContact(currentUser.uid, targetCreator.id);
            onUpdateUser(unlockRes.updatedUser);
            if (onContactUnlockedSuccess) {
              onContactUnlockedSuccess(targetCreator.id);
            }
          } catch (e) {
            console.warn("Avtomatik ochishda xatolik:", e);
          }
        }
      }

      setStep('success');
    } catch (err) {
      console.error("To'lovda xatolik:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      id="contact-packages-modal-backdrop"
      className="fixed inset-0 z-[70] bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 pb-[calc(90px+env(safe-area-inset-bottom,0px))] sm:pb-5 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) {
          onClose();
        }
      }}
    >
      <div
        id="contact-packages-modal-card"
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto transition-all animate-in fade-in zoom-in-95 duration-200 max-h-[88vh] overflow-y-auto pb-[calc(24px+env(safe-area-inset-bottom,0px))] sm:pb-0"
      >
        {/* Header */}
        <div className="relative p-5 sm:p-7 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-indigo-50/70 via-purple-50/50 to-pink-50/60 dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-pink-950/30">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
              <PhoneCall className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-black text-xl sm:text-2xl text-slate-900 dark:text-white">
                  Kontaktni ochish paketlari
                </h2>
                <span className="text-2xs font-mono font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  Pay-per-contact
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-body mt-0.5">
                {targetCreator?.name
                  ? `${targetCreator.name} ning ijtimoiy tarmoq va aloqa ma'lumotlarini 72 soatga oching`
                  : "Kreatorlarning telefon va profillarini to'g'ridan-to'g'ri oching"}
              </p>
            </div>
          </div>

          {/* Current balance display if user has contacts */}
          {currentBalance > 0 && (
            <div className="mt-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-xs sm:text-sm font-heading font-bold text-emerald-900 dark:text-emerald-200">
                  Sizda {currentBalance} ta ishlatilmagan kontakt mavjud!
                </span>
              </div>
              {targetCreator?.id && (
                <button
                  type="button"
                  onClick={handleDirectUnlock}
                  disabled={isProcessing}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-heading font-bold transition-all cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
                >
                  {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  <span>1 tasini ishlatib ochish</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content Body */}
        {step === 'select' && (
          <div className="p-5 sm:p-7 space-y-6">
            {/* Alternative comparison banner with Pro */}
            {onOpenProModal && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border border-amber-200/80 dark:border-amber-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                  <div>
                    <div className="text-xs sm:text-sm font-heading font-bold text-slate-900 dark:text-white">
                      Cheksiz aloqa kerakmi?
                    </div>
                    <div className="text-2xs sm:text-xs text-slate-500 dark:text-slate-400 font-body">
                      Pro rejimga o'ting va barcha kreatorlar kontaktlarini cheklovlarsiz oching
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenProModal();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white text-xs font-heading font-bold cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
                >
                  <span>Pro rejimga o'tish</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Single Price Card: 19 000 so'm (Paketlar tanlovi olib tashlandi, faqat bitta narx) */}
            <div className="max-w-md mx-auto p-5 sm:p-6 rounded-3xl border-2 border-indigo-600 dark:border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="font-heading font-extrabold text-base text-slate-900 dark:text-white">
                  Kontaktni ochish
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-mono font-bold">
                  72 soatlik kirish
                </span>
              </div>

              <div className="text-3xl font-mono font-black text-slate-900 dark:text-white my-3">
                19 000 so'm
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 font-body mb-4">
                Bir martalik toʻlov. Kreatorning telefon raqami va Telegram profili 72 soatga darhol ochiladi.
              </p>

              <div className="space-y-2 pt-3 border-t border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 font-body">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Telefon raqami va Telegram profili</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>72 soat davomida toʻliq kirish</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Xavfsiz toʻlov: Click, Payme, Uzcard</span>
                </div>
              </div>

              <button
                type="button"
                id="btn-proceed-single-contact"
                onClick={handleProceedToPayment}
                className="w-full mt-6 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-heading font-extrabold text-sm shadow-md shadow-orange-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Kontaktni ochish — 19 000 so'm</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Payment Step */}
        {step === 'payment' && (
          <div className="p-5 sm:p-7 space-y-5">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-xs font-body text-slate-500 dark:text-slate-400">Tanlangan paket:</span>
                <div className="font-heading font-bold text-base text-slate-900 dark:text-white">
                  {selectedPackage.title} ({selectedPackage.contactsCount} ta kontakt)
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-body text-slate-500 dark:text-slate-400">Jami to'lov:</span>
                <div className="font-mono font-black text-lg text-indigo-600 dark:text-indigo-400">
                  {selectedPackage.formattedPrice}
                </div>
              </div>
            </div>

            {/* Provider selection */}
            <div>
              <label className="block text-xs font-heading font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                To'lov tizimini tanlang:
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'click', label: 'Click Up', desc: "Click orqali to'lash" },
                  { id: 'payme', label: 'Payme', desc: "Payme orqali to'lash" },
                  { id: 'uzcard', label: 'Uzcard/Humo', desc: "To'g'ridan-to'g'ri karta" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedProvider(item.id as any)}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                      selectedProvider === item.id
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                      {item.label}
                    </div>
                    <div className="text-2xs text-slate-500 dark:text-slate-400 font-body mt-0.5">
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300 font-body">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <span>
                Toʻlov xavfsiz amalga oshiriladi. Tasdiqlangach, kontakt ochish balansingizga darhol qoʻshiladi va 72 soatlik kirish beriladi.
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
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white font-heading font-extrabold text-sm shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>To'lov amalga oshirilmoqda...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>To'lovni tasdiqlash ({selectedPackage.formattedPrice})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="font-heading font-black text-2xl text-slate-900 dark:text-white">
              To'lov muvaffaqiyatli yakunlandi!
            </h3>

            <p className="text-sm text-slate-600 dark:text-slate-400 font-body max-w-md mx-auto leading-relaxed">
              Sizga <strong>{selectedPackage.contactsCount} ta kontakt</strong> ochish balansi berildi.
              {targetCreator?.name && (
                <>
                  <br />
                  <strong>{targetCreator.name}</strong> ning kontakt ma'lumotlari 72 soatga ochildi.
                </>
              )}
            </p>

            <div className="pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-heading font-extrabold text-sm shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <span>Davom etish</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
