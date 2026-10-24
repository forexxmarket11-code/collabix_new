import React, { useState, useEffect } from 'react';
import { Lock, User, AlertCircle, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';
import { loginAdmin, ADMIN_UID } from '../firebase';

interface AdminLoginPageProps {
  onLoginSuccess: () => void;
  onGoHome: () => void;
}

const LOCKOUT_STORAGE_KEY = 'collabix_admin_lockout';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

interface LockoutState {
  attempts: number;
  lockedUntil: number;
}

function readLockoutState(): LockoutState {
  try {
    const raw = localStorage.getItem(LOCKOUT_STORAGE_KEY);
    if (!raw) return { attempts: 0, lockedUntil: 0 };
    const parsed = JSON.parse(raw);
    return {
      attempts: typeof parsed.attempts === 'number' ? parsed.attempts : 0,
      lockedUntil: typeof parsed.lockedUntil === 'number' ? parsed.lockedUntil : 0,
    };
  } catch {
    return { attempts: 0, lockedUntil: 0 };
  }
}

function saveLockoutState(state: LockoutState) {
  try {
    localStorage.setItem(LOCKOUT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function clearLockoutState() {
  try {
    localStorage.removeItem(LOCKOUT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

function formatRemainingSeconds(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function AdminLoginPage({ onLoginSuccess, onGoHome }: AdminLoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [remainingLockSeconds, setRemainingLockSeconds] = useState<number>(() => {
    const state = readLockoutState();
    if (state.lockedUntil > Date.now()) {
      return Math.ceil((state.lockedUntil - Date.now()) / 1000);
    }
    return 0;
  });

  useEffect(() => {
    const updateCountdown = () => {
      const state = readLockoutState();
      if (state.lockedUntil > Date.now()) {
        setRemainingLockSeconds(Math.ceil((state.lockedUntil - Date.now()) / 1000));
      } else {
        if (state.lockedUntil > 0) {
          clearLockoutState();
        }
        setRemainingLockSeconds(0);
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  const isLocked = remainingLockSeconds > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const currentLock = readLockoutState();
    if (currentLock.lockedUntil > Date.now()) {
      const left = Math.ceil((currentLock.lockedUntil - Date.now()) / 1000);
      setRemainingLockSeconds(left);
      setError(`5 marta notoʻgʻri urinish sababli kirish vaqtincha bloklandi. ${formatRemainingSeconds(left)} dan keyin qayta urinib koʻring.`);
      return;
    }

    const trimmedUser = username.trim();
    const rawPass = password;

    if (!trimmedUser || !rawPass) {
      setError('Iltimos, login va parolni kiriting');
      return;
    }

    setIsLoading(true);

    try {
      const fbUser = await loginAdmin(trimmedUser, rawPass);
      if (fbUser.uid !== ADMIN_UID) {
        throw new Error('Unauthorized UID');
      }
      clearLockoutState();
      setRemainingLockSeconds(0);
      setPassword('');
      setIsLoading(false);
      onLoginSuccess();
    } catch (err: any) {
      setIsLoading(false);
      const prev = readLockoutState();
      const baseAttempts = prev.lockedUntil > 0 && prev.lockedUntil <= Date.now() ? 0 : prev.attempts;
      const nextAttempts = baseAttempts + 1;

      if (nextAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
        saveLockoutState({ attempts: nextAttempts, lockedUntil });
        const leftSecs = Math.ceil(LOCKOUT_DURATION_MS / 1000);
        setRemainingLockSeconds(leftSecs);
        setError(`5 marta notoʻgʻri urinish kiritildi. Xavfsizlik uchun kirish 5 daqiqaga bloklandi (${formatRemainingSeconds(leftSecs)}).`);
      } else {
        saveLockoutState({ attempts: nextAttempts, lockedUntil: 0 });
        const code = String(err?.code || '');
        if (code === 'auth/too-many-requests') {
          setError('Koʻp marotaba notoʻgʻri urinish boʻldi. Iltimos, biroz kutib qayta urinib koʻring.');
        } else if (code === 'auth/network-request-failed') {
          setError('Internet bilan aloqa uzildi. Internetingizni tekshirib koʻring.');
        } else if (code === 'auth/not-admin') {
          setError('Sizda administrator paneliga kirish huquqi yoʻq.');
        } else {
          const remainingTries = MAX_FAILED_ATTEMPTS - nextAttempts;
          setError(`Login yoki parol notoʻgʻri. Qolgan urinishlar soni: ${remainingTries}`);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFD] flex flex-col justify-center items-center px-4 py-12">
      {/* Back to Home Button */}
      <div className="w-full max-w-sm mb-4">
        <button
          type="button"
          onClick={onGoHome}
          id="btn-admin-back-home"
          className="inline-flex items-center gap-2 text-xs font-heading font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Saytga qaytish</span>
        </button>
      </div>

      {/* Admin Login Card */}
      <div className="w-full max-w-sm bg-white dark:bg-[#1A1A24] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center mx-auto mb-3 text-indigo-600 dark:text-indigo-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-heading font-bold text-slate-900 dark:text-white">
            Admin panelga kirish
          </h1>
          <p className="text-xs font-body text-slate-500 dark:text-slate-400 mt-1">
            Faqat vakolatli administratorlar uchun
          </p>
        </div>

        {/* Lockout or Error message */}
        {(isLocked || error) && (
          <div
            id="admin-login-error"
            className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-heading font-medium flex items-start gap-2 animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              {isLocked
                ? `Kirish vaqtincha bloklangan. Qayta urinishgacha: ${formatRemainingSeconds(remainingLockSeconds)}`
                : error}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="admin-username"
              className="block text-xs font-heading font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Foydalanuvchi nomi (Login)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="admin-username"
                type="text"
                autoComplete="username"
                disabled={isLocked || isLoading}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Login kiriting"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-body text-slate-900 dark:text-white bg-slate-50/50 dark:bg-[#12121A] focus:bg-white dark:focus:bg-[#161622] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 transition-colors disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block text-xs font-heading font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Parol
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                disabled={isLocked || isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-body text-slate-900 dark:text-white bg-slate-50/50 dark:bg-[#12121A] focus:bg-white dark:focus:bg-[#161622] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 transition-colors disabled:opacity-60"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || isLocked}
              id="btn-admin-submit-login"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-heading font-semibold shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isLocked ? `Bloklangan (${formatRemainingSeconds(remainingLockSeconds)})` : 'Kirish'}</span>
                  {!isLocked && <ArrowRight className="w-4 h-4" />}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
