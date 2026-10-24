import React from 'react';
import {
  AlertCircle,
  LogOut,
  Edit3,
  Info,
} from 'lucide-react';
import { UserSession } from '../types';

interface PendingApprovalPageProps {
  user: UserSession;
  onEditProfile: () => void;
  onLogout: () => void;
  onStatusUpdated?: (updated: UserSession) => void;
}

export const PendingApprovalPage: React.FC<PendingApprovalPageProps> = ({
  user,
  onEditProfile,
  onLogout,
}) => {
  if (user.accountStatus !== 'rejected') {
    return null;
  }

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center py-10 px-4 sm:px-6">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-900/5 overflow-hidden transition-colors">
        <div className="p-6 sm:p-8 text-center bg-rose-50/70 dark:bg-rose-950/20 border-b border-rose-100 dark:border-rose-900/40 transition-colors">
          <div className="relative inline-flex items-center justify-center mb-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shadow-inner bg-rose-100 text-rose-600 dark:bg-rose-900/60 dark:text-rose-400">
              <AlertCircle className="w-9 h-9 sm:w-11 sm:h-11 stroke-[2.2]" />
            </div>
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 bg-rose-500" />
          </div>

          <div className="flex justify-center mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider font-mono bg-rose-100/90 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300">
              Hisob cheklangan
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-heading tracking-tight">
            Hisobingiz bloklangan
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-lg mx-auto font-body leading-relaxed">
            Administrator ushbu hisobdan foydalanishni vaqtincha chekladi. Quyida koʻrsatilgan sabab bilan tanishib chiqing.
          </p>

          <div className="mt-5 p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-rose-200 dark:border-rose-900/60 text-left shadow-sm">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-heading font-bold text-sm mb-1.5">
              <Info className="w-4 h-4" />
              <span>Sabab:</span>
            </div>
            <p className="text-sm text-slate-800 dark:text-slate-200 font-body leading-relaxed">
              {user.rejectionReason ||
                'Platforma qoidalariga muvofiqlik yuzasidan cheklov oʻrnatilgan.'}
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center gap-3.5">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.name || 'Foydalanuvchi'}
                  className="w-13 h-13 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
                />
              ) : (
                <div className="w-13 h-13 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 font-bold font-heading text-lg flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                  {(user?.name ? user.name.charAt(0) : 'U').toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="font-heading font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <span>{user?.name || 'Foydalanuvchi'}</span>
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {user.role === 'bloger' ? 'Bloger' : 'Brend'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {user.contact || user.email} {user.city ? `• ${user.city}` : ''}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              id="btn-pending-edit-profile"
              onClick={onEditProfile}
              className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-heading font-bold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Profilni tahrirlash</span>
            </button>

            <button
              type="button"
              id="btn-pending-logout"
              onClick={onLogout}
              className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-heading font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Chiqish</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
