import React, { useState } from 'react';
import {
  Clock,
  AlertCircle,
  LogOut,
  Edit3,
  CheckCircle2,
  Lock,
  Sparkles,
  Send,
  MessageSquare,
  Users,
  ShieldCheck,
  RefreshCw,
  Info,
  ExternalLink,
} from 'lucide-react';
import { UserSession } from '../types';
import { resubmitForApproval } from '../firebase';

interface PendingApprovalPageProps {
  user: UserSession;
  onEditProfile: () => void;
  onLogout: () => void;
}

export const PendingApprovalPage: React.FC<PendingApprovalPageProps> = ({
  user,
  onEditProfile,
  onLogout,
}) => {
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [resubmitSuccess, setResubmitSuccess] = useState(false);

  const isRejected = user.accountStatus === 'rejected';

  const handleResubmit = async () => {
    if (!user.uid) return;
    setIsResubmitting(true);
    try {
      await resubmitForApproval(user.uid);
      setResubmitSuccess(true);
      setTimeout(() => setResubmitSuccess(false), 4000);
    } catch (err) {
      console.error('Qayta yuborishda xatolik:', err);
    } finally {
      setIsResubmitting(false);
    }
  };

  const completion = user.profileCompletion || 30;

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center py-10 px-4 sm:px-6">
      {/* Container */}
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-900/5 overflow-hidden transition-colors">
        
        {/* Top Status Header */}
        <div
          className={`p-6 sm:p-8 text-center transition-colors ${
            isRejected
              ? 'bg-rose-50/70 dark:bg-rose-950/20 border-b border-rose-100 dark:border-rose-900/40'
              : 'bg-amber-50/70 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900/40'
          }`}
        >
          {/* Animated Status Icon */}
          <div className="relative inline-flex items-center justify-center mb-4">
            <div
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shadow-inner ${
                isRejected
                  ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/60 dark:text-rose-400'
                  : 'bg-amber-100 text-amber-600 dark:bg-amber-900/60 dark:text-amber-400'
              }`}
            >
              {isRejected ? (
                <AlertCircle className="w-9 h-9 sm:w-11 sm:h-11 stroke-[2.2]" />
              ) : (
                <Clock className="w-9 h-9 sm:w-11 sm:h-11 stroke-[2.2] animate-pulse" />
              )}
            </div>
            
            {/* Status Pulse Dot */}
            <span
              className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${
                isRejected ? 'bg-rose-500' : 'bg-amber-500 animate-ping'
              }`}
            />
          </div>

          {/* Badge */}
          <div className="flex justify-center mb-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider font-mono ${
                isRejected
                  ? 'bg-rose-100/90 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300'
                  : 'bg-amber-100/90 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
              }`}
            >
              {isRejected ? 'Arizangiz tasdiqlanmadi' : 'Kutilmoqda • Moderator tekshiruvi'}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-heading tracking-tight">
            {isRejected ? 'Afsuski, arizangiz tasdiqlanmadi' : 'Arizangiz koʻrib chiqilmoqda'}
          </h1>

          {/* Subtitle / Description */}
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-lg mx-auto font-body leading-relaxed">
            {isRejected
              ? 'Administrator arizangizni koʻrib chiqdi va ayni damda uni tasdiqlay olmadi. Iltimos, quyidagi sababni oʻrganib, maʼlumotlarni toʻgʻrilang.'
              : 'Profilingiz admin tomonidan tasdiqlangach, platformadan toʻliq foydalana olasiz. Bu odatda 24 soat ichida amalga oshadi.'}
          </p>

          {/* Rejection Reason Card (if rejected) */}
          {isRejected && (
            <div className="mt-5 p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-rose-200 dark:border-rose-900/60 text-left shadow-sm">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-heading font-bold text-sm mb-1.5">
                <Info className="w-4 h-4" />
                <span>Rad etish sababi:</span>
              </div>
              <p className="text-sm text-slate-800 dark:text-slate-200 font-body leading-relaxed">
                {user.rejectionReason ||
                  'Profil toʻliq toʻldirilmagan yoki keltirilgan maʼlumotlar platforma qoidalariga toʻliq javob bermaydi.'}
              </p>
            </div>
          )}

          {resubmitSuccess && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Arizangiz qayta koʻrib chiqish uchun adminga muvaffaqiyatli yuborildi!</span>
            </div>
          )}
        </div>

        {/* User Card & Profile Completeness */}
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

            {/* Profile Completeness Pill */}
            <div className="sm:text-right">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Profil toʻldirilganligi: <span className="font-bold text-indigo-600 dark:text-indigo-400">{completion}%</span>
              </div>
              <div className="w-full sm:w-36 h-2 bg-slate-200 dark:bg-slate-700 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(completion, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Helpful Guidance Notice */}
          <div className="text-xs text-slate-600 dark:text-slate-400 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-100/80 dark:border-indigo-900/40 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {isRejected ? 'Qanday qilib tezda tasdiqlatish mumkin?' : 'Tasdiqlanishni tezlashtirish uchun maslahat:'}
              </span>
              <p className="mt-1 leading-relaxed">
                Profilingizga aniq bio, faol ijtimoiy tarmoq havolalari (Instagram, TikTok va h.k.), narxlar hamda sohalaringizni kiriting. Maʼlumotlar toʻliq boʻlsa, moderator arizangizni yanada tezroq maʼqullaydi.
              </p>
            </div>
          </div>

          {/* Locked Features Indicator */}
          <div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
              Tasdiqlangach ochiladigan funksiyalar
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center gap-2.5 text-slate-500 dark:text-slate-400 text-xs">
                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-medium">Kreatorlar katalogi</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center gap-2.5 text-slate-500 dark:text-slate-400 text-xs">
                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-medium">Briflar va buyurtmalar</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center gap-2.5 text-slate-500 dark:text-slate-400 text-xs">
                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-medium">Xabarlar va chat</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              id="btn-pending-edit-profile"
              onClick={onEditProfile}
              className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-heading font-bold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>{isRejected ? 'Profilni toʻgʻrilash' : 'Profilni tahrirlash'}</span>
            </button>

            {isRejected && (
              <button
                type="button"
                id="btn-pending-resubmit"
                onClick={handleResubmit}
                disabled={isResubmitting}
                className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-heading font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isResubmitting ? 'animate-spin' : ''}`} />
                <span>Qayta yuborish</span>
              </button>
            )}

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

        {/* Live sync footer note */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800/60 text-center text-xs text-slate-500 dark:text-slate-400">
          Admin arizangizni tasdiqlagach, ushbu sahifa avtomatik yangilanadi va barcha imkoniyatlar ochiladi.
        </div>
      </div>
    </div>
  );
};
