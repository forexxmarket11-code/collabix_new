import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Settings,
  Bell,
  LogOut,
  Edit3,
  Camera,
  Check,
  Building2,
  Package,
  Sparkles,
  Tag,
  DollarSign,
  Instagram,
  Youtube,
  Send,
  Video,
  ExternalLink,
  Globe,
  Sun,
  Moon,
  CreditCard,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Ban,
  Loader2,
  Flame,
  Key,
} from 'lucide-react';
import { UserSession, BriefData } from '../types';
import { ThemeToggle } from './ThemeToggle';
import { TopPlacementModal } from './TopPlacementModal';
import {
  formatUzbekDate,
  getDaysRemainingInTrial,
  deleteMyAccount,
} from '../firebase';
import { isUserPro } from '../utils/subscription';

interface ProfilePageProps {
  user: UserSession | null;
  onLogout: () => void;
  onOpenRegister: () => void;
  onUpdateUser: (updated: UserSession) => void;
  onNavigateToEdit?: () => void;
  onOpenCancelModal?: () => void;
  onOpenProModal?: () => void;
  userBriefs?: BriefData[];
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  onLogout,
  onOpenRegister,
  onUpdateUser,
  onNavigateToEdit,
  onOpenCancelModal,
  onOpenProModal,
  userBriefs = [],
}) => {
  const [isReactivating, setIsReactivating] = useState(false);
  const [subActionFeedback, setSubActionFeedback] = useState<string | null>(null);
  const [isTopModalOpen, setIsTopModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    if (isDeleting) return;
    if (deleteConfirmText.trim().toUpperCase() !== 'OCHIRISH') {
      setDeleteError("Tasdiqlash uchun maydonga OCHIRISH deb yozing.");
      return;
    }
    if (!deletePassword) {
      setDeleteError('Parolingizni kiriting.');
      return;
    }
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteMyAccount(deletePassword);
      setIsDeleteOpen(false);
      onLogout();
    } catch (err: any) {
      setDeleteError(err?.message || "Hisobni oʻchirishda xatolik yuz berdi.");
    } finally {
      setIsDeleting(false);
    }
  };

  // If user is not logged in (fallback guard)
  if (!user) {
    return (
      <div className="min-h-screen pb-[calc(112px+env(safe-area-inset-bottom,0px))] pt-10 px-4 sm:px-6 max-w-lg mx-auto text-center">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-7 sm:p-10 shadow-sm transition-colors duration-300">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400 mb-4">
            <User className="w-8 h-8" />
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-slate-100 mb-2">
            Profilga kirish
          </h2>
          <p className="text-[15px] sm:text-sm text-slate-600 dark:text-slate-400 font-body mb-6 leading-relaxed">
            Shaxsiy profil, yuborilgan briflar va sozlamalarni koʻrish uchun tizimga kiring yoki yangi hisob oching.
          </p>
          <button
            type="button"
            id="btn-profile-login-prompt"
            onClick={onOpenRegister}
            className="w-full min-h-[48px] py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-heading font-bold text-sm shadow-md transition-all cursor-pointer"
          >
            Roʻyxatdan oʻtish / Kirish
          </button>
        </div>
      </div>
    );
  }

  const isBlogger = user.role === 'bloger';

  // Haqiqiy statistikalar (briflar ma'lumotlaridan)
  const myUid = user?.uid || '';
  const isAcceptedBrief = (b: BriefData) =>
    b.creatorStatus === 'qabul_qilindi' || Boolean((b as any).selectedApplicationId);
  const profileStats: { label: string; value: string; hint: string }[] = (() => {
    if (!user) return [];
    if (isBlogger) {
      const directToMe = userBriefs.filter((b) => b.recipientType === 'direct' && b.selectedCreatorId === myUid);
      const myApplications = userBriefs.filter((b) => (b.applications || []).some((a) => a.creatorId === myUid));
      const accepted =
        directToMe.filter((b) => b.creatorStatus === 'qabul_qilindi').length +
        myApplications.filter((b) =>
          (b.applications || []).some((a) => a.creatorId === myUid && (a.status === 'accepted' || a.creatorStatus === 'qabul_qilindi'))
        ).length;
      return [
        { label: 'Kelgan takliflar', value: `${directToMe.length} ta`, hint: 'Sizga yuborilgan shaxsiy briflar' },
        { label: 'Yuborilgan arizalar', value: `${myApplications.length} ta`, hint: 'Ochiq briflarga arizalaringiz' },
        { label: 'Profil koʻrishlari', value: `${typeof user.views === 'number' ? user.views : 0} marta`, hint: `Qabul qilingan hamkorliklar: ${accepted} ta` },
      ];
    }
    const mine = userBriefs.filter((b) => b.brandId === myUid);
    const applicationsCount = mine.reduce((sum, b) => sum + (b.applications?.length || 0), 0);
    return [
      { label: 'Yuborilgan briflar', value: `${mine.length} ta`, hint: 'Siz yaratgan barcha briflar' },
      { label: 'Kelgan arizalar', value: `${applicationsCount} ta`, hint: 'Ochiq briflaringizga' },
      { label: 'Kelishilgan hamkorliklar', value: `${mine.filter(isAcceptedBrief).length} ta`, hint: 'Qabul qilingan briflar' },
    ];
  })();

  const subscriptionStatus = user.subscriptionStatus || 'free';
  const isCancelled = subscriptionStatus === 'cancelled';
  const isPro = isUserPro(user);
  const isFree = !isPro && !isCancelled;

  const trialEndDate = user.trialEndDate;
  const formattedEndDate = formatUzbekDate(trialEndDate) || 'Aniqlanmagan';
  const daysRemaining = trialEndDate ? getDaysRemainingInTrial(trialEndDate) : 30;
  const planPrice = (user.subscriptionPlanPrice || 59000).toLocaleString('uz-UZ');

  const handleReactivateSubscription = async () => {
    if (!user.uid) return;
    if (onOpenProModal) {
      onOpenProModal();
      return;
    }
    setIsReactivating(false);
    setSubActionFeedback("Pro rejimni qayta faollashtirish uchun toʻlov chekini yuboring.");
  };

  return (
    <div className="min-h-screen pb-[calc(112px+env(safe-area-inset-bottom,0px))] pt-6 sm:pt-12 px-4 sm:px-6 max-w-4xl mx-auto transition-colors duration-300">
      {/* Header Banner */}
      <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-900 border border-slate-800/40 rounded-3xl p-5 sm:p-8 text-white mb-6 shadow-md overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          {/* Avatar with edit trigger */}
          <div className="relative group shrink-0">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user?.name || 'Foydalanuvchi'}
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
                width={96}
                height={96}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white/20 shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-4 border-white/20 flex items-center justify-center text-white font-heading font-extrabold text-2xl shadow-lg">
                {(user?.name ? user.name.charAt(0) : 'U').toUpperCase()}
              </div>
            )}
            <button
              type="button"
              id="btn-profile-avatar-camera"
              className="absolute -bottom-1 -right-1 min-w-[44px] min-h-[44px] bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-full shadow-md hover:scale-105 transition-transform cursor-pointer ring-2 ring-indigo-600 flex items-center justify-center"
              title="Rasmni yangilash"
              aria-label="Rasmni yangilash"
              onClick={onNavigateToEdit}
            >
              <Camera className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </button>
          </div>

          {/* User Basic Info */}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap mb-1">
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-white tracking-tight break-words">
                {user?.name || 'Foydalanuvchi'}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-heading font-bold bg-white/15 text-indigo-200 backdrop-blur-xs border border-white/20">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isBlogger ? 'Kreator' : 'Brend'}</span>
              </span>
            </div>

            {user.instagramHandle ? (
              <p className="text-xs sm:text-sm text-indigo-200 font-body mb-3 break-all">
                {user.instagramHandle.startsWith('@') ? user.instagramHandle : `@${user.instagramHandle}`}
              </p>
            ) : (
              <div className="mb-3" />
            )}

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 text-xs text-white/90 font-medium">
                <Building2 className="w-3.5 h-3.5 text-indigo-300" />
                <span>{user.city ? user.city.split(',')[0] : 'Shahar tanlanmagan'}</span>
              </div>
              {user.gender && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 text-xs text-white/90 font-medium capitalize">
                  <span>Jins: {user.gender}</span>
                </div>
              )}
            </div>
          </div>

          {/* Edit Profile Action Button */}
          <button
            type="button"
            id="btn-navigate-to-edit-profile"
            onClick={onNavigateToEdit}
            className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white text-xs sm:text-sm font-heading font-bold shadow-md transition-all cursor-pointer shrink-0"
          >
            <Edit3 className="w-4 h-4" />
            <span>Profilni tahrirlash</span>
          </button>
        </div>
      </div>

      {/* Creator Profile Details Card - Simplified */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-2xs mb-6 transition-colors duration-300 space-y-4">
        {/* Bio */}
        <div>
          <span className="block text-[11px] font-heading font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
            Oʻzi haqida
          </span>
          <p className="text-[15px] sm:text-sm text-slate-700 dark:text-slate-300 font-body leading-relaxed break-words bg-slate-50/70 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/60">
            {user.bio || 'Lifestyle, moda va kreativ videolar yaratuvchi kreator.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Categories & Direction */}
          <div>
            <span className="block text-[11px] font-heading font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
              Kategoriya & Yoʻnalish
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(user.categories && user.categories.length > 0 ? user.categories : ['Blogger']).map((cat) => (
                <span
                  key={cat}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-heading font-bold"
                >
                  {cat}
                </span>
              ))}
              {(user.contentTypes && user.contentTypes.length > 0 ? user.contentTypes : ['Reels', 'Story']).map((t) => (
                <span
                  key={t}
                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-heading font-medium"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Pricing Range */}
          <div>
            <span className="block text-[11px] font-heading font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
              Xizmat narxi
            </span>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 inline-flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-mono font-bold text-xs sm:text-sm text-emerald-900 dark:text-emerald-300">
                {user.priceRange?.min || '500 000'} — {user.priceRange?.max || '2 500 000'} soʻm
              </span>
            </div>
          </div>
        </div>

        {/* Social Links - Compact */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <span className="block text-[11px] font-heading font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Ijtimoiy tarmoqlar
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {user.socialLinks?.instagramEnabled !== false && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 text-xs font-heading font-semibold text-slate-700 dark:text-slate-300">
                <Instagram className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                <span>{user.socialLinks?.instagramFollowers || '45 000'}</span>
              </div>
            )}

            {user.socialLinks?.tiktokEnabled !== false && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 text-xs font-heading font-semibold text-slate-700 dark:text-slate-300">
                <Video className="w-3.5 h-3.5 text-slate-900 dark:text-slate-100 shrink-0" />
                <span>{user.socialLinks?.tiktokFollowers || 'Faol'}</span>
              </div>
            )}

            {user.socialLinks?.youtubeEnabled && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 text-xs font-heading font-semibold text-slate-700 dark:text-slate-300">
                <Youtube className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span>{user.socialLinks?.youtubeFollowers || 'Kanal'}</span>
              </div>
            )}

            {user.socialLinks?.telegramEnabled !== false && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 text-xs font-heading font-semibold text-slate-700 dark:text-slate-300">
                <Send className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span>{user.socialLinks?.telegramFollowers || 'Kanal'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Direct Contact Info (Bog'lanish ma'lumotlari) */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="block text-[11px] font-heading font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Bogʻlanish maʼlumotlari (Briflar uchun)
            </span>
            {(!user.phoneNumber || !user.telegramUsername) && (
              <button
                type="button"
                onClick={onNavigateToEdit}
                className="min-h-[44px] px-2.5 -my-2 inline-flex items-center text-xs text-amber-600 dark:text-amber-400 hover:underline font-semibold cursor-pointer shrink-0"
              >
                + Kiritish
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="max-w-full inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 text-xs font-heading font-semibold text-slate-700 dark:text-slate-300">
              <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="break-all">{user.phoneNumber || (user.contact && !user.contact.includes('@') ? user.contact : '') || 'Telefon kiritilmagan'}</span>
            </div>

            <div className="max-w-full inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 text-xs font-heading font-semibold text-slate-700 dark:text-slate-300">
              <Send className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              <span className="break-all">
                {user.telegramUsername
                  ? `@${user.telegramUsername.replace(/^@/, '')}`
                  : user.socialLinks?.telegram
                  ? `@${user.socialLinks.telegram.replace(/^https?:\/\/t\.me\//, '').replace(/^@/, '')}`
                  : 'Telegram kiritilmagan'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards — haqiqiy ma'lumotlar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6">
        {profileStats.map((st) => (
          <div
            key={st.label}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-2xs transition-colors duration-300"
          >
            <span className="text-xs text-slate-500 dark:text-slate-400 font-body">{st.label}</span>
            <div className="font-heading font-extrabold text-xl text-slate-900 dark:text-slate-100 mt-0.5">{st.value}</div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5 inline-block">{st.hint}</span>
          </div>
        ))}
      </div>

      {/* Obuna holati Card - Completely Simplified */}
      <div
        id="profile-subscription-card"
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-2xs mb-6 transition-colors duration-300"
      >
        {/* Header row: Status + date, and single action button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isCancelled
                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                : isPro
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900'
                : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900'
            }`}>
              {isFree ? (
                <Sparkles className="w-4 h-4 text-amber-500" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-slate-100">
                Obuna holati
              </h3>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className={`text-[11px] font-heading font-bold px-2 py-0.5 rounded-md ${
                  isCancelled
                    ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                    : isPro
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}>
                  {isCancelled && 'Bekor qilingan'}
                  {isPro && 'Faol'}
                  {isFree && 'Standart'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-body">
                  {!isFree ? `${formattedEndDate}gacha amal qiladi` : 'Pro faollashtirilmagan'}
                </span>
              </div>
            </div>
          </div>

          {/* Single Action Button */}
          <div>
            {isCancelled && (
              <button
                type="button"
                id="btn-profile-reactivate-subscription"
                onClick={handleReactivateSubscription}
                disabled={isReactivating}
                className="w-full sm:w-auto min-h-[44px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-heading font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {isReactivating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                <span>Pro rejimni qayta yoqish</span>
              </button>
            )}

            {isPro && (
              <button
                type="button"
                id="btn-profile-cancel-subscription"
                onClick={onOpenCancelModal}
                className="w-full sm:w-auto min-h-[44px] py-2.5 px-4 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-heading font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Ban className="w-4 h-4" />
                <span>Obunani bekor qilish</span>
              </button>
            )}

            {isFree && onOpenProModal && (
              <button
                type="button"
                id="btn-profile-upgrade-pro"
                onClick={onOpenProModal}
                className="w-full sm:w-auto min-h-[44px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-indigo-600 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white text-xs font-heading font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>Pro rejimga oʻtish</span>
              </button>
            )}
          </div>
        </div>

        {/* Feedback Alert if action occurred */}
        {subActionFeedback && (
          <div className="mt-3 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-800 dark:text-indigo-200 font-body flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
            <span>{subActionFeedback}</span>
          </div>
        )}

        {/* Single Compact Card with 3 rows instead of 3 big cards */}
        <div className="mt-4 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          <div className="flex items-center justify-between gap-2 py-2 first:pt-0">
            <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">Joriy tarif</span>
            <span className="font-heading font-bold text-slate-900 dark:text-slate-100 text-right">
              {isFree && 'Standart (Bepul)'}
              {isCancelled && 'Bekor qilingan'}
              {isPro && 'Pro rejim (59 000 soʻm/oy)'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 py-2">
            <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">Amal qilish muddati</span>
            <span className="font-heading font-bold text-slate-900 dark:text-slate-100 text-right">
              {isFree ? 'Mavjud emas' : `${formattedEndDate}gacha`}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 py-2 last:pb-0">
            <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">Keyingi toʻlov</span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-right">
              {isFree ? '59 000 soʻm' : isCancelled ? '0 soʻm' : `${planPrice} soʻm`}
            </span>
          </div>
        </div>

        {/* Concise reassurance text: 1-2 short sentences */}
        <div className="mt-3.5 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/80 text-xs font-body text-slate-600 dark:text-slate-400 space-y-1.5">
          <p>
            ℹ️ {isCancelled
              ? `Pro rejim ${formattedEndDate}gacha amal qiladi, keyingi toʻlov yechilmaydi.`
              : isPro
              ? `Pro rejim faol (${formattedEndDate}gacha), istalgan payt bekor qilishingiz mumkin.`
              : 'Pro rejim orqali toʻliq katalog va briflarga ruxsat oling.'}
          </p>
          <p className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1.5">
            <span>🛡️</span>
            <span>30 kun ichida birorta ham kreator javob bermasa, 59 000 soʻm toʻliq qaytariladi.</span>
          </p>
        </div>
      </div>

      {/* 2. TOP JOYLASHUV (Profilingizni yuqoriga chiqaring) - Vaqtincha yashirilgan (Kodni o'chirmasdan UI'dan olib tashlandi) */}
      {/*
      {isBlogger && (
        <div
          id="profile-top-placement-card"
          className="bg-white dark:bg-slate-900 rounded-3xl border border-amber-200/90 dark:border-amber-900/60 p-6 sm:p-7 shadow-xs mb-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-80 h-40 bg-gradient-to-bl from-amber-500/15 via-orange-500/10 to-transparent pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-500/25">
                <Flame className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-slate-100">
                    Profilingizni yuqoriga chiqaring
                  </h3>
                  {user.topPlacementUntil && new Date(user.topPlacementUntil).getTime() > Date.now() ? (
                    <span className="text-[11px] font-heading font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>TOP faol ({new Date(user.topPlacementUntil).toLocaleDateString('uz-UZ')}gacha)</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-heading font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                      Tavsiya etiladi
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-body mt-1 max-w-xl">
                  Katalog va Briflar boʻlimidagi kreatorlar roʻyxatida <strong>bosh oʻrinda</strong> turing va brendlardan 5x koʻproq taklif oling.
                </p>
              </div>
            </div>

            <button
              type="button"
              id="btn-profile-open-top-placement"
              onClick={() => setIsTopModalOpen(true)}
              className="py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white text-xs sm:text-sm font-heading font-extrabold shadow-md shadow-orange-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
            >
              <Flame className="w-4 h-4 fill-white" />
              <span>{user.topPlacementUntil && new Date(user.topPlacementUntil).getTime() > Date.now() ? "Muddatni uzaytirish" : "TOP ga chiqarish"}</span>
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-body text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span><strong>7 kun:</strong> 99,000 soʻm (14,143/kun)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
              <span><strong>15 kun:</strong> 189,000 soʻm (12,600/kun)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span><strong>30 kun:</strong> 299,000 soʻm (9,967/kun — eng foydali)</span>
            </div>
          </div>
        </div>
      )}
      */}

      {/* Pay-per-contact unlocks summary for brand — o'chirilgan: endi faqat Pro obuna orqali */}
      {false && !isBlogger && typeof user.unlockedContactsCount === 'number' && (
        <div
          id="profile-brand-contacts-card"
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Key className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="font-heading font-extrabold text-base text-slate-900 dark:text-white">
                Kontaktlarni ochish balansi
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-body">
                Sizda <strong>{user.unlockedContactsCount} ta</strong> ishlatilmagan kontakt ochish imkoniyati mavjud
              </div>
            </div>
          </div>

          <div className="text-xs font-heading font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 self-start sm:self-auto">
            72 soatlik kirish beriladi
          </div>
        </div>
      )}

      {/* Account Settings & Preferences */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-2xs overflow-hidden mb-6 transition-colors duration-300">
        {/* Theme Settings Row (Light / Dark Mode Toggle) */}
        <div className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-slate-100">
                Mavzu (Kunduzgi / Tungi rejim)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Qulay koʻrish uchun yorugʻ yoki qorongʻi rejimni tanlang</p>
            </div>
          </div>
          <ThemeToggle id="btn-profile-settings-theme-toggle" variant="pill" />
        </div>

        <div className="p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-slate-100">
                Xabarnomalar va bildirishnomalar
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Telegram va Email orqali yangi briflar haqida xabar olish</p>
            </div>
          </div>
          <label className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              defaultChecked
              className="w-5 h-5 text-indigo-600 rounded-md cursor-pointer accent-indigo-600"
            />
          </label>
        </div>

        <div className="p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-slate-100">
                Xavfsizlik va kirish paroli
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Parolni yangilash va ikki bosqichli himoya</p>
            </div>
          </div>
          <span
            className="text-xs font-heading font-medium text-slate-400 dark:text-slate-500 shrink-0"
          >
            Faol
          </span>
        </div>
      </div>

      {/* Logout Action */}
      <div className="text-center pt-2">
        <button
          type="button"
          id="btn-logout-profile"
          onClick={onLogout}
          className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs sm:text-sm font-heading font-bold transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Hisobdan chiqish</span>
        </button>
        <div className="mt-3">
          <button
            type="button"
            id="btn-open-delete-account"
            onClick={() => {
              setIsDeleteOpen(true);
              setDeleteError(null);
              setDeletePassword('');
              setDeleteConfirmText('');
            }}
            className="min-h-[44px] px-4 text-xs font-heading font-semibold text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 underline underline-offset-4 cursor-pointer"
          >
            Hisobni butunlay oʻchirish
          </button>
        </div>
      </div>

      {isDeleteOpen && (
        <div
          className="fixed inset-0 z-[80] bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-5"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) setIsDeleteOpen(false);
          }}
        >
          <div className="w-full sm:max-w-md max-h-[92dvh] overflow-y-auto bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-7 pb-[max(20px,calc(env(safe-area-inset-bottom,0px)+16px))]">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white">Hisobni oʻchirish</h3>
                <p className="mt-1 text-[14px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Profilingiz, kontakt maʼlumotlaringiz va katalogdagi kartangiz butunlay oʻchiriladi. Bu amalni qaytarib boʻlmaydi.
                  Faol Pro obuna yoki kontakt balansi ham yoʻqoladi.
                </p>
              </div>
            </div>

            <label className="block mt-5 text-xs font-heading font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Tasdiqlash uchun OCHIRISH deb yozing
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              autoCapitalize="characters"
              className="mt-1.5 w-full min-h-[48px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base text-slate-900 dark:text-white"
              placeholder="OCHIRISH"
            />

            <label className="block mt-4 text-xs font-heading font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Parolingiz
            </label>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              autoComplete="current-password"
              className="mt-1.5 w-full min-h-[48px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base text-slate-900 dark:text-white"
            />

            {deleteError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-sm text-rose-700 dark:text-rose-300">
                {deleteError}
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse sm:flex-row gap-2.5 sm:justify-end">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                disabled={isDeleting}
                className="min-h-[48px] px-5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-heading font-bold text-sm cursor-pointer disabled:opacity-50"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="min-h-[48px] px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-heading font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isDeleting ? 'Oʻchirilmoqda...' : 'Hisobni oʻchirish'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Placement Modal */}
      <TopPlacementModal
        isOpen={isTopModalOpen}
        onClose={() => setIsTopModalOpen(false)}
        currentUser={user}
        onUpdateUser={onUpdateUser}
      />
    </div>
  );
};
