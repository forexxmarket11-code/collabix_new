import React, { useState, useEffect } from 'react';
import {
  User,
  Building2,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  X,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserSession } from '../types';
import {
  registerUser,
  loginUser,
  getUzbekAuthErrorMessage,
  normalizeContactToAuthEmail,
} from '../firebase';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCatalog: () => void;
  onSuccess?: (user: UserSession) => void;
  onGoToProfile?: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  // Wizard Step: 1 (Ism va familiya) | 2 (Login va parol)
  const [step, setStep] = useState<1 | 2>(1);
  const [direction, setDirection] = useState<1 | -1>(1);

  // Role selector: 'bloger' or 'brend'
  const [role, setRole] = useState<'bloger' | 'brend'>('bloger');

  // Mode: 'register' or 'login'
  const [isLoginMode, setIsLoginMode] = useState<boolean>(false);

  // Step 1 fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Step 2 fields
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Validation
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Lock background scroll when modal is open & reset transient status on reopen
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Reset modal state when switching modes
  const handleToggleMode = (loginMode: boolean) => {
    setIsLoginMode(loginMode);
    setStep(1);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  if (!isOpen) return null;

  // Handler for Step 1 -> Step 2 validation
  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const fName = firstName.trim();
    const lName = lastName.trim();

    if (role === 'bloger') {
      if (!fName) {
        setErrorMessage('Ismingizni kiriting.');
        return;
      }
      if (!lName) {
        setErrorMessage('Familiyangizni kiriting.');
        return;
      }
    } else {
      if (!fName) {
        setErrorMessage('Brendingiz nomini kiriting.');
        return;
      }
      if (!lName) {
        setErrorMessage('Ism va familiyangizni kiriting.');
        return;
      }
    }

    setDirection(1);
    setStep(2);
  };

  // Handler for Step 2 "Orqaga" button
  const handleBackToStep1 = () => {
    setErrorMessage(null);
    setDirection(-1);
    setStep(1);
  };

  // Handler for Step 2 Registration Submit or Login Submit
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const contactTrimmed = contact.trim();

    if (!contactTrimmed) {
      setErrorMessage('Email yoki telefon raqamingizni kiriting.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const { isPhone } = normalizeContactToAuthEmail(contactTrimmed);

    if (contactTrimmed.includes('@')) {
      if (!emailRegex.test(contactTrimmed)) {
        setErrorMessage('Email manzili notoʻgʻri kiritilgan (masalan: azizbek@gmail.com).');
        return;
      }
    } else if (!isPhone) {
      setErrorMessage('Email yoki telefon raqamingizni toʻgʻri kiriting.');
      return;
    }

    if (!password) {
      setErrorMessage('Parolni kiriting.');
      return;
    }

    if (!isLoginMode) {
      // Step 2 Registration validations
      if (password.length < 6) {
        setErrorMessage('Parol juda qisqa — kamida 6 ta belgi kiriting.');
        return;
      }

      if (password !== confirmPassword) {
        setErrorMessage('Parollar bir xil emas. Qaytadan tekshirib koʻring.');
        return;
      }

      // Compute full name
      const fName = firstName.trim();
      const lName = lastName.trim();
      const fullName =
        role === 'bloger'
          ? `${fName} ${lName}`.trim()
          : lName
          ? `${fName} (${lName})`
          : fName;

      setIsLoading(true);
      try {
        const newUser = await registerUser(contactTrimmed, password, fullName, role);
        setSuccessMessage('Tabriklaymiz! Profilingiz tayyor 🎉');
        if (onSuccess) {
          onSuccess(newUser);
        }
        setTimeout(() => {
          setSuccessMessage(null);
          setStep(1);
          setPassword('');
          setConfirmPassword('');
          onClose();
        }, 1400);
      } catch (err: any) {
        setErrorMessage(getUzbekAuthErrorMessage(err, isPhone));
      } finally {
        setIsLoading(false);
      }
    } else {
      // Login flow
      setIsLoading(true);
      try {
        const loggedInUser = await loginUser(contactTrimmed, password);
        onClose();
        if (onSuccess) {
          onSuccess(loggedInUser);
        }
      } catch (err: any) {
        setErrorMessage(getUzbekAuthErrorMessage(err, isPhone));
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div
      id="register-modal-backdrop"
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6 pb-[calc(90px+env(safe-area-inset-bottom,0px))] sm:pb-6 bg-slate-900/60 dark:bg-slate-950/75 backdrop-blur-md overflow-y-auto transition-opacity duration-200"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        id="register-modal-content"
        className="relative w-full max-w-lg bg-white/98 dark:bg-slate-900/98 backdrop-blur-md border-2 border-slate-100 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-900/20 my-auto transform transition-all duration-200 select-none overflow-hidden max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button "X" */}
        <button
          type="button"
          id="btn-close-register-modal"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer z-10"
          aria-label="Yopish"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress Indicator for Multi-Step Registration */}
        {!isLoginMode && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{step === 1 ? '1/2 — Tanishuv' : '2/2 — Kirish maʼlumotlari'}</span>
              </span>
              <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500">
                Qadam {step} / 2
              </span>
            </div>

            {/* Stepped Progress Track */}
            <div className="grid grid-cols-2 gap-2">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === 1
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-xs shadow-indigo-500/30'
                    : 'bg-emerald-500'
                }`}
              />
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === 2
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-xs shadow-indigo-500/30'
                    : 'bg-slate-100 dark:bg-slate-800'
                }`}
              />
            </div>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div
            id="modal-register-success-alert"
            className="mb-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-heading font-bold flex items-center gap-2.5 animate-in fade-in duration-200"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="flex-1">{successMessage}</span>
          </div>
        )}

        {/* Validation Error Alert */}
        {errorMessage && (
          <div
            id="modal-register-error-alert"
            className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-body flex items-start gap-2.5 animate-in fade-in duration-200"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {/* REGISTRATION: MULTI-STEP WIZARD */}
        {!isLoginMode ? (
          <AnimatePresence mode="wait" custom={direction}>
            {step === 1 ? (
              <motion.div
                key="register-step-1"
                custom={direction}
                initial={{ opacity: 0, x: direction > 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction > 0 ? 20 : -20 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                {/* Step 1 Header */}
                <div className="text-center mb-5 pr-4">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-heading leading-snug">
                    Collabix&apos;ga xush kelibsiz 👋
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-body mt-1.5 max-w-sm mx-auto leading-relaxed">
                    Bir daqiqada roʻyxatdan oʻting va hamkorlikni boshlang
                  </p>
                </div>

                {/* Role Selection Tabs (Bloger vs Brend) */}
                <div className="mb-5">
                  <span className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Kim sifatida qoʻshilasiz?
                  </span>

                  <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100/90 dark:bg-slate-800/80 rounded-2xl border border-slate-200/70 dark:border-slate-700/60">
                    <button
                      type="button"
                      id="modal-btn-role-bloger"
                      onClick={() => {
                        setRole('bloger');
                        setErrorMessage(null);
                      }}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-heading font-bold transition-all duration-200 cursor-pointer ${
                        role === 'bloger'
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/20'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60'
                      }`}
                    >
                      <User className="w-4 h-4 stroke-[2.5]" />
                      <span>Blogerman</span>
                    </button>

                    <button
                      type="button"
                      id="modal-btn-role-brend"
                      onClick={() => {
                        setRole('brend');
                        setErrorMessage(null);
                      }}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-heading font-bold transition-all duration-200 cursor-pointer ${
                        role === 'brend'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-600/20'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60'
                      }`}
                    >
                      <Building2 className="w-4 h-4 stroke-[2.5]" />
                      <span>Brendman</span>
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 font-body text-center">
                    {role === 'bloger'
                      ? 'Men blogerman — brendlardan takliflar olaman'
                      : 'Men brendman — mos blogerlarni topaman'}
                  </p>
                </div>

                {/* Step 1 Form Fields */}
                <form onSubmit={handleProceedToStep2} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* First Name / Brand Name */}
                    <div>
                      <label
                        htmlFor="modal-reg-firstname-input"
                        className="block text-xs font-heading font-semibold text-slate-700 dark:text-slate-300 mb-1"
                      >
                        {role === 'bloger' ? 'Ismingiz' : 'Brendingiz nomi'}
                        <span className="text-rose-500 ml-0.5">*</span>
                      </label>
                      <input
                        id="modal-reg-firstname-input"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder={role === 'bloger' ? 'Azizbek' : 'TechStart'}
                        autoFocus
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-body text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-600 dark:focus:border-indigo-400 focus:outline-hidden transition-colors bg-slate-50/50 dark:bg-slate-800/50"
                      />
                    </div>

                    {/* Last Name / Contact Person */}
                    <div>
                      <label
                        htmlFor="modal-reg-lastname-input"
                        className="block text-xs font-heading font-semibold text-slate-700 dark:text-slate-300 mb-1"
                      >
                        {role === 'bloger' ? 'Familiyangiz' : 'Ism va familiyangiz'}
                        <span className="text-rose-500 ml-0.5">*</span>
                      </label>
                      <input
                        id="modal-reg-lastname-input"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder={role === 'bloger' ? 'Rahimov' : 'Jasur Alimov'}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-body text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-600 dark:focus:border-indigo-400 focus:outline-hidden transition-colors bg-slate-50/50 dark:bg-slate-800/50"
                      />
                    </div>
                  </div>

                  {/* Trust Info */}
                  <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-2 text-indigo-800 dark:text-indigo-300 text-xs">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                    <span>
                      {role === 'bloger'
                        ? 'Roʻyxatdan oʻtiboq katalogda koʻrinasiz va takliflar qabul qila olasiz.'
                        : 'Roʻyxatdan oʻtiboq mos blogerlarni topib, brif yuborishingiz mumkin.'}
                    </span>
                  </div>

                  {/* Proceed to Step 2 Button */}
                  <div className="pt-2">
                    <button
                      id="modal-btn-step1-continue"
                      type="submit"
                      className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-heading font-bold text-sm sm:text-base tracking-tight shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Davom etish</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </form>

                {/* Toggle to Login Mode */}
                <div className="pt-3 text-center">
                  <button
                    type="button"
                    id="modal-link-toggle-login"
                    onClick={() => handleToggleMode(true)}
                    className="text-xs sm:text-sm font-heading font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    Profilingiz bormi? Tizimga kiring
                  </button>
                </div>
              </motion.div>
            ) : (
              /* STEP 2: LOGIN VA PAROL */
              <motion.div
                key="register-step-2"
                custom={direction}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                {/* Step 2 Header */}
                <div className="text-center mb-5 pr-4">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-heading leading-snug">
                    Kirish maʼlumotlari
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-body mt-1.5 max-w-sm mx-auto leading-relaxed">
                    Profilingizga kirish uchun kontakt va parol yarating
                  </p>
                </div>

                {/* Step 2 Form Fields */}
                <form onSubmit={handleFinalSubmit} className="space-y-3.5">
                  {/* Email or Phone */}
                  <div>
                    <label
                      htmlFor="modal-reg-contact-input"
                      className="block text-xs font-heading font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Email yoki telefon
                      <span className="text-rose-500 ml-0.5">*</span>
                    </label>
                    <input
                      id="modal-reg-contact-input"
                      type="text"
                      inputMode="email"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="azizbek@gmail.com yoki +998 90 123 45 67"
                      autoFocus
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-body text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-600 dark:focus:border-indigo-400 focus:outline-hidden transition-colors bg-slate-50/50 dark:bg-slate-800/50"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label
                      htmlFor="modal-reg-password-input"
                      className="block text-xs font-heading font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Parol (kamida 6 belgi)
                      <span className="text-rose-500 ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="modal-reg-password-input"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Kamida 6 ta belgi kiriting"
                        required
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-body text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-600 dark:focus:border-indigo-400 focus:outline-hidden transition-colors bg-slate-50/50 dark:bg-slate-800/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        aria-label="Parolni koʻrsatish"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label
                      htmlFor="modal-reg-confirm-password-input"
                      className="block text-xs font-heading font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Parolni tasdiqlang
                      <span className="text-rose-500 ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="modal-reg-confirm-password-input"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Parolni qayta kiriting"
                        required
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-body text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-600 dark:focus:border-indigo-400 focus:outline-hidden transition-colors bg-slate-50/50 dark:bg-slate-800/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        aria-label="Parol tasdigʻini koʻrsatish"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons: "Orqaga" and "Roʻyxatdan oʻtish" */}
                  <div className="pt-3 flex items-center gap-2.5">
                    <button
                      type="button"
                      id="modal-btn-step2-back"
                      onClick={handleBackToStep1}
                      disabled={isLoading || Boolean(successMessage)}
                      className="py-3.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-heading font-semibold text-sm transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Orqaga</span>
                    </button>

                    <button
                      id="modal-btn-submit-register"
                      type="submit"
                      disabled={isLoading || Boolean(successMessage)}
                      className={`flex-1 py-3.5 px-5 rounded-xl text-white font-heading font-bold text-sm sm:text-base tracking-tight shadow-lg active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-90 disabled:cursor-not-allowed ${
                        successMessage
                          ? 'bg-emerald-600 shadow-emerald-600/25'
                          : 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-600/25 hover:shadow-indigo-600/35'
                      }`}
                    >
                      {successMessage ? (
                        <span>Tabriklaymiz! Profilingiz tayyor 🎉</span>
                      ) : isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Tayyorlanmoqda...</span>
                        </>
                      ) : (
                        <>
                          <span>Roʻyxatdan oʻtish</span>
                          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Hint about instant access */}
                <div className="pt-3 text-center">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-body leading-relaxed">
                    ✨ Roʻyxatdan oʻtishingiz bilan barcha imkoniyatlar darhol ochiladi.
                  </p>
                </div>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => handleToggleMode(true)}
                    className="text-xs sm:text-sm font-heading font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    Profilingiz bormi? Tizimga kiring
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          /* LOGIN MODE (Single Screen) */
          <motion.div
            key="login-mode"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-center mb-6 pr-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 mb-2.5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                  Tizimga kirish
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-heading leading-snug">
                Xush kelibsiz 👋
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-body mt-2 max-w-md mx-auto leading-relaxed">
                Profilingizga kiring va hamkorlikni davom ettiring
              </p>
            </div>

            <form onSubmit={handleFinalSubmit} className="space-y-3.5">
              <div>
                <label
                  htmlFor="modal-login-email-input"
                  className="block text-xs font-heading font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Email yoki telefon
                </label>
                <input
                  id="modal-login-email-input"
                  type="text"
                  inputMode="email"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="azizbek@gmail.com yoki +998 90 123 45 67"
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-body text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-600 dark:focus:border-indigo-400 focus:outline-hidden transition-colors bg-slate-50/50 dark:bg-slate-800/50"
                />
              </div>

              <div>
                <label
                  htmlFor="modal-login-password-input"
                  className="block text-xs font-heading font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Parolingiz
                </label>
                <div className="relative">
                  <input
                    id="modal-login-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Parolingizni kiriting"
                    required
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-body text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-600 dark:focus:border-indigo-400 focus:outline-hidden transition-colors bg-slate-50/50 dark:bg-slate-800/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    aria-label="Parolni koʻrsatish"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  id="modal-btn-submit-login"
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-heading font-bold text-sm sm:text-base tracking-tight shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Kirilmoqda...</span>
                    </>
                  ) : (
                    <>
                      <span>Kirish</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  id="modal-link-toggle-register"
                  onClick={() => handleToggleMode(false)}
                  className="text-xs sm:text-sm font-heading font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  Profilingiz yoʻqmi? Roʻyxatdan oʻting
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
};
