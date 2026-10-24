import React, { useState } from 'react';
import { Lock, User, AlertCircle, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';

interface AdminLoginPageProps {
  onLoginSuccess: () => void;
  onGoHome: () => void;
}

export function AdminLoginPage({ onLoginSuccess, onGoHome }: AdminLoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    if (!trimmedUser || !trimmedPass) {
      setError('Iltimos, login va parolni kiriting');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Valid credentials check: admin / admin123 (or admin / collabix2025)
      if (
        (trimmedUser.toLowerCase() === 'admin' && (trimmedPass === 'admin123' || trimmedPass === 'collabix2025')) ||
        (trimmedUser.toLowerCase() === 'collabix' && trimmedPass === 'collabix2025')
      ) {
        try {
          sessionStorage.setItem('collabix_admin_auth', 'true');
        } catch {
          // ignore
        }
        setIsLoading(false);
        onLoginSuccess();
      } else {
        setIsLoading(false);
        setError('Login yoki parol notoʻgʻri. Iltimos, maʼlumotlarni tekshirib qayta kiriting.');
      }
    }, 400);
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

        {/* Error message */}
        {error && (
          <div
            id="admin-login-error"
            className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-heading font-medium flex items-start gap-2 animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
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
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-body text-slate-900 dark:text-white bg-slate-50/50 dark:bg-[#12121A] focus:bg-white dark:focus:bg-[#161622] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 transition-colors"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-body text-slate-900 dark:text-white bg-slate-50/50 dark:bg-[#12121A] focus:bg-white dark:focus:bg-[#161622] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 transition-colors"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              id="btn-admin-submit-login"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-heading font-semibold shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Kirish</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Demo hints */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400 font-body">
            Kirish maʼlumotlari: <code className="text-slate-600 font-mono bg-slate-100 px-1 py-0.5 rounded">admin</code> / <code className="text-slate-600 font-mono bg-slate-100 px-1 py-0.5 rounded">admin123</code>
          </p>
        </div>
      </div>
    </div>
  );
}
