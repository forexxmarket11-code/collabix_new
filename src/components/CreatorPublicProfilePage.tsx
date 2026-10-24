import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Star,
  Users,
  Briefcase,
  TrendingUp,
  Lock,
  ExternalLink,
  MessageSquare,
  Send,
  Sparkles,
  DollarSign,
  Tag,
  ShieldCheck,
  Edit3,
  Instagram,
  Video,
  Youtube,
  Clock,
  AlertCircle,
  Share2,
  ChevronLeft,
  ChevronRight,
  Film,
  Play,
  Layers,
  Eye,
  Key,
  PhoneCall,
  Zap,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import { CatalogCreator, UserSession, BriefData, CreatorMediaItem } from '../types';
import {
  subscribeToCreatorDocument,
  incrementCreatorViews,
  isContactUnlockedForUser,
  unlockCreatorContact,
} from '../firebase';
import { checkProUserAndProceed } from '../utils/subscription';
import { ContactPackagesModal } from './ContactPackagesModal';

// Suggested aesthetic model portfolio items when creator hasn't uploaded custom gallery
const DEFAULT_MODEL_PORTFOLIO: CreatorMediaItem[] = [
  {
    id: 'dm_1',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1080&auto=format&fit=crop&q=80',
    type: 'image',
    title: 'Editorial portret',
  },
  {
    id: 'dm_2',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1080&auto=format&fit=crop&q=80',
    type: 'image',
    title: 'Studio lookbook',
  },
  {
    id: 'dm_3',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1080&auto=format&fit=crop&q=80',
    type: 'image',
    title: 'Moda koʻrgazmasi',
  },
  {
    id: 'dm_4',
    url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1080&auto=format&fit=crop&q=80',
    type: 'image',
    title: 'Katalog fotosessiyasi',
  },
  {
    id: 'dm_5',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=1080&auto=format&fit=crop&q=80',
    type: 'image',
    title: 'Brend reklamasi',
  },
  {
    id: 'dm_6',
    url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1080&auto=format&fit=crop&q=80',
    type: 'image',
    title: 'Podium backstage',
  },
  {
    id: 'dm_7',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1080&auto=format&fit=crop&q=80',
    type: 'image',
    title: 'Yuz va obraz',
  },
];

interface CreatorPublicProfilePageProps {
  creatorId: string;
  initialCreator?: CatalogCreator | null;
  currentUser: UserSession | null;
  onBack: () => void;
  onSendBrief: (creator: { id: string; name: string; avatar?: string; handle?: string }) => void;
  onOpenChat: (creator: { id: string; name: string; avatar?: string; handle?: string }) => void;
  onEditProfile: () => void;
  userBriefs?: BriefData[];
  onOpenProModal?: () => void;
  onUpdateUser?: (user: UserSession) => void;
  onOpenRegisterModal?: () => void;
}

// Helper function for user initials fallback (UI Avatars style)
const getInitials = (nameStr?: string): string => {
  if (!nameStr || !nameStr.trim()) return 'K';
  const clean = nameStr.trim().replace(/^@/, '');
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
};

// Deterministic gradient palette based on user name/id
const getInitialsGradient = (seed: string) => {
  const gradients = [
    { bg: 'from-indigo-600 to-indigo-800', text: 'text-white' },
    { bg: 'from-violet-600 to-purple-800', text: 'text-white' },
    { bg: 'from-blue-600 to-cyan-700', text: 'text-white' },
    { bg: 'from-emerald-600 to-teal-800', text: 'text-white' },
    { bg: 'from-rose-600 to-pink-700', text: 'text-white' },
    { bg: 'from-amber-600 to-orange-700', text: 'text-white' },
    { bg: 'from-fuchsia-600 to-pink-800', text: 'text-white' },
    { bg: 'from-sky-600 to-blue-800', text: 'text-white' },
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % gradients.length;
  return gradients[idx];
};

interface ContactUnlockSectionProps {
  isContactUnlocked: boolean;
  contactUnlockStatus: { isUnlocked: boolean; expiresAt?: string; remainingHours?: number };
  currentUser: UserSession | null;
  rawPhone: string;
  telegramHandle: string;
  telegramUrl: string;
  availableBalance: number;
  isUnlocking: boolean;
  unlockSuccessMsg: string | null;
  copiedField: 'phone' | 'telegram' | null;
  onUnlock: () => void;
  onOpenPackages: () => void;
  onOpenProModal?: () => void;
  onCopy: (text: string, field: 'phone' | 'telegram') => void;
}

const ContactUnlockSection: React.FC<ContactUnlockSectionProps> = ({
  isContactUnlocked,
  contactUnlockStatus,
  currentUser,
  rawPhone,
  telegramHandle,
  telegramUrl,
  availableBalance,
  isUnlocking,
  unlockSuccessMsg,
  copiedField,
  onUnlock,
  onOpenPackages,
  onOpenProModal,
  onCopy,
}) => {
  const isPro = currentUser?.subscriptionStatus === 'active' || currentUser?.subscriptionStatus === 'trial';

  return (
    <div
      id="creator-contact-unlock-section"
      className="bg-white dark:bg-[#1A1A24] rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800/90 p-5 sm:p-7 shadow-2xs space-y-4"
    >
      {unlockSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{unlockSuccessMsg}</span>
        </div>
      )}

      {/* 1. Sarlavha: "Kontaktlar", o'ng tomonda qulf belgisi va "Yashirin" yozuvi */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-heading font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white">
              Kontaktlar
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-body">
              {isContactUnlocked
                ? "Kreator bilan to'g'ridan-to'g'ri aloqa ma'lumotlari"
                : "Kreatorning bevosita telefon va Telegram ma'lumotlari"}
            </p>
          </div>
        </div>

        {!isContactUnlocked ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/25 text-xs font-heading font-bold shadow-2xs">
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            <span>Yashirin</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 text-xs font-heading font-bold shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {isPro
                ? 'Cheksiz (Pro)'
                : `Ochiq (${contactUnlockStatus.remainingHours || 72} soat)`}
            </span>
          </div>
        )}
      </div>

      {/* 2. Ikkita qator: "TELEFON" va "TELEGRAM" — qiymatlari xiralashtirilgan (blur) holatda */}
      <div className="space-y-3">
        {/* TELEFON */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#12121A] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="block text-[11px] font-heading font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
              TELEFON
            </span>
            {!isContactUnlocked ? (
              <div className="relative inline-block">
                <span className="font-mono font-bold text-sm sm:text-base text-slate-900 dark:text-white select-none blur-[6px] pointer-events-none block">
                  +998 90 ••• •• 78
                </span>
              </div>
            ) : (
              <a
                href={`tel:${rawPhone}`}
                className="font-mono font-bold text-sm sm:text-base text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-2"
              >
                <span>{rawPhone}</span>
              </a>
            )}
          </div>

          {!isContactUnlocked ? (
            <div className="p-2 rounded-xl bg-slate-200/60 dark:bg-slate-800 text-slate-400 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
          ) : (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onCopy(rawPhone, 'phone')}
                className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                title="Nusxa olish"
              >
                {copiedField === 'phone' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
              <a
                href={`tel:${rawPhone}`}
                className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-heading font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Qo'ng'iroq</span>
              </a>
            </div>
          )}
        </div>

        {/* TELEGRAM */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#12121A] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="block text-[11px] font-heading font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
              TELEGRAM
            </span>
            {!isContactUnlocked ? (
              <div className="relative inline-block">
                <span className="font-mono font-bold text-sm sm:text-base text-slate-900 dark:text-white select-none blur-[6px] pointer-events-none block">
                  @••••••••••••
                </span>
              </div>
            ) : (
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-heading font-bold text-sm sm:text-base text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1.5"
              >
                <span>{telegramHandle}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>
            )}
          </div>

          {!isContactUnlocked ? (
            <div className="p-2 rounded-xl bg-slate-200/60 dark:bg-slate-800 text-slate-400 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
          ) : (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onCopy(telegramHandle, 'telegram')}
                className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                title="Nusxa olish"
              >
                {copiedField === 'telegram' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-heading font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ochish</span>
              </a>
            </div>
          )}
        </div>
      </div>

      {!isContactUnlocked ? (
        <div className="space-y-3 pt-1">
          {/* 3. Pastda katta tugma: "Kontaktni ochish — 19 000 so'm" */}
          <button
            type="button"
            id="btn-unlock-contact-main"
            onClick={onUnlock}
            disabled={isUnlocking}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 active:scale-98 text-white font-heading font-black text-sm sm:text-base tracking-tight shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
          >
            {isUnlocking ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Ochilmoqda...</span>
              </>
            ) : (
              <>
                <Lock className="w-5 h-5 text-amber-100" />
                <span>
                  {availableBalance > 0
                    ? `Kontaktni ochish (${availableBalance} ta balansingiz bor)`
                    : "Kontaktni ochish — 19 000 so'm"}
                </span>
              </>
            )}
          </button>

          {/* 4. Tugma ostida kichik matn: "72 soatlik kirish · bir martalik to'lov" */}
          <div className="text-center text-xs text-slate-500 dark:text-slate-400 font-body">
            72 soatlik kirish · bir martalik to'lov
          </div>

          {/* 5. Pastroqda: "Har bir profil tekshirilgan. Xavfsiz to'lov: Payme, Click." degan ishonch matni */}
          <div className="pt-2 flex items-center justify-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-body">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Har bir profil tekshirilgan. Xavfsiz to'lov: Payme, Click.</span>
          </div>

          {/* 6. Shundan keyin: "Pro paket olish" qatori — "30 kontakt = 11,633 so'mdan" kabi */}
          <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onOpenProModal || onOpenPackages}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-heading font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer group"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
              <span>30 kontakt = 11,633 so'mdan · Pro paket olish →</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 font-body">
            <strong>Kontakt ochilgan.</strong> Siz kreator bilan bevosita qo'ng'iroq yoki Telegram orqali bog'lanishingiz mumkin.
          </div>
        </div>
      )}
    </div>
  );
};

export const CreatorPublicProfilePage: React.FC<CreatorPublicProfilePageProps> = ({
  creatorId,
  initialCreator,
  currentUser,
  onBack,
  onSendBrief,
  onOpenChat,
  onEditProfile,
  userBriefs = [],
  onOpenProModal,
  onUpdateUser,
  onOpenRegisterModal,
}) => {
  // Extract effective creator ID strictly from prop or URL hash
  const effectiveId = (
    creatorId && creatorId !== 'creator-profile' && creatorId !== 'profil'
      ? creatorId
      : window.location.hash.replace(/^#(kreator|creator)-/, '').trim()
  );

  // Real-time creator profile loaded strictly from Firestore 'users/{effectiveId}'
  const [creatorProfile, setCreatorProfile] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [isContactModalOpen, setIsContactModalOpen] = useState<boolean>(false);
  const [isUnlocking, setIsUnlocking] = useState<boolean>(false);
  const [unlockSuccessMsg, setUnlockSuccessMsg] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<'phone' | 'telegram' | null>(null);

  // Increment creator profile views in Firestore once per visit
  const hasIncrementedRef = useRef<boolean>(false);
  useEffect(() => {
    if (effectiveId && effectiveId !== 'creator-profile' && effectiveId !== 'profil' && !hasIncrementedRef.current) {
      hasIncrementedRef.current = true;
      incrementCreatorViews(effectiveId).catch((err) => {
        console.warn("Ko'rishlar sonini oshirishda xatolik:", err);
      });
    }
  }, [effectiveId]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });

    if (!effectiveId || effectiveId === 'creator-profile' || effectiveId === 'profil') {
      setIsLoading(false);
      setIsNotFound(true);
      setCreatorProfile(null);
      return;
    }

    setIsLoading(true);
    setIsNotFound(false);
    setImageError(false);

    // Subscribe directly to Firestore document in real-time
    const unsubscribe = subscribeToCreatorDocument(effectiveId, (profile, notFound) => {
      if (profile) {
        setCreatorProfile(profile);
        setIsNotFound(false);
      } else if (notFound) {
        setCreatorProfile(null);
        setIsNotFound(true);
      }
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [effectiveId]);

  // Check pay-per-contact unlock status (72 hours validity)
  const contactUnlockStatus = useMemo(() => {
    return isContactUnlockedForUser(currentUser, effectiveId);
  }, [currentUser, effectiveId]);

  // Determine if viewing user is the creator themself
  const isOwnProfile = Boolean(
    currentUser &&
      (currentUser.uid === effectiveId ||
        (creatorProfile &&
          currentUser.name &&
          creatorProfile.name &&
          currentUser.name.trim().toLowerCase() === creatorProfile.name.trim().toLowerCase()))
  );

  // Check if contact is unlocked via: own profile, Pro subscription, 72-hour paid contact unlock, or accepted direct brief
  const isContactUnlocked = Boolean(
    isOwnProfile ||
      contactUnlockStatus.isUnlocked ||
      userBriefs.some(
        (b) =>
          (b.selectedCreatorId === effectiveId ||
            (creatorProfile?.name && b.selectedCreatorName === creatorProfile.name)) &&
          b.recipientType === 'direct'
      )
  );

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleHandleName = (link?: string, fallbackHandle?: string) => {
    if (fallbackHandle) return fallbackHandle.startsWith('@') ? fallbackHandle : `@${fallbackHandle}`;
    if (!link) return '@kreator';
    try {
      const parts = link.replace(/\/$/, '').split('/');
      const last = parts[parts.length - 1];
      return last ? (last.startsWith('@') ? last : `@${last}`) : '@kreator';
    } catch {
      return '@kreator';
    }
  };

  const rawAvatarUrl = (
    creatorProfile?.avatar ||
    (creatorProfile as any)?.photoURL ||
    (creatorProfile as any)?.avatarUrl ||
    ''
  ).trim();

  const hasValidAvatar = Boolean(rawAvatarUrl && !imageError);

  // Hook called unconditionally on every render before any early returns
  const portfolioItems: CreatorMediaItem[] = useMemo(() => {
    const rawGallery = creatorProfile?.gallery || creatorProfile?.mediaGallery || initialCreator?.gallery || [];
    if (Array.isArray(rawGallery) && rawGallery.length > 0) {
      return rawGallery.map((item, idx) => {
        if (typeof item === 'string') {
          return { id: `m_${idx}`, url: item, type: 'image' as const, title: `Portfolio ${idx + 1}` };
        }
        return item;
      });
    }
    const defaults = [...DEFAULT_MODEL_PORTFOLIO];
    if (hasValidAvatar) {
      defaults[0] = {
        id: 'avatar_first',
        url: rawAvatarUrl,
        type: 'image',
        title: 'Asosiy portret',
      };
    }
    return defaults;
  }, [creatorProfile?.gallery, creatorProfile?.mediaGallery, initialCreator?.gallery, hasValidAvatar, rawAvatarUrl]);

  // 1. SKELETON LOADING STATE (Never show demo data while loading)
  if (isLoading) {
    return (
      <div id="creator-profile-loading" className="min-h-screen bg-slate-50/50 dark:bg-[#0E0E15] pb-32">
        {/* Top Header Skeleton */}
        <div className="border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-4 sm:px-6 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="h-5 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
            <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
          {/* Hero Card Skeleton */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#1A1A24] border border-slate-200/90 dark:border-slate-800/90 shadow-2xs">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0" />
              <div className="flex-1 space-y-3 w-full text-center sm:text-left">
                <div className="h-8 w-56 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse mx-auto sm:mx-0" />
                <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
                  <div className="h-7 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                  <div className="h-7 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                  <div className="h-7 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* Stats Row Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-5 rounded-3xl bg-white dark:bg-[#1A1A24] border border-slate-200/90 dark:border-slate-800/90 space-y-2">
                <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
                <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                <div className="h-3 w-36 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
              </div>
            ))}
          </div>

          {/* Bio Skeleton */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#1A1A24] border border-slate-200/90 dark:border-slate-800/90 space-y-3">
            <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
            <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
            <div className="h-4 w-4/5 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
          </div>

          <div className="text-center py-4 text-xs font-mono text-slate-400 dark:text-slate-500">
            Kreator profili yuklanmoqda...
          </div>
        </div>
      </div>
    );
  }

  // 2. NOT FOUND STATE (If creator does not exist in Firestore, never show demo data)
  if (isNotFound || !creatorProfile) {
    return (
      <div id="creator-profile-not-found" className="min-h-screen bg-slate-50/50 dark:bg-[#0E0E15] pb-32 flex flex-col">
        <div className="border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-4 sm:px-6 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-heading font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Katalogga qaytish</span>
            </button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-md w-full text-center p-8 rounded-3xl bg-white dark:bg-[#1A1A24] border border-slate-200/90 dark:border-slate-800/90 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-white mb-2">
              Bu profil topilmadi
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-body mb-6">
              Kechirasiz, siz qidirayotgan kreator profili tizimda mavjud emas yoki oʻchirilgan boʻlishi mumkin.
            </p>
            <button
              type="button"
              onClick={onBack}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-heading font-bold text-sm shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
            >
              Boshqa kreatorlarni koʻrish
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. REAL FIRESTORE DATA MAPPING (Strictly from creatorProfile document)
  const name = creatorProfile.name || 'Kreator';

  const initials = getInitials(name);
  const avatarColor = getInitialsGradient(effectiveId || name);
  const effectiveAvatarForChat = hasValidAvatar
    ? rawAvatarUrl
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&bold=true`;

  const isVerified = creatorProfile.verified ?? (creatorProfile.accountStatus === 'approved');
  const category = creatorProfile.categories?.[0] || 'Blogger';
  const city = creatorProfile.city || 'Toshkent';
  const rating = typeof creatorProfile.rating === 'number' ? creatorProfile.rating : 5.0;
  const reviewsCount = creatorProfile.completedOrdersCount ?? creatorProfile.reviewsCount ?? 0;
  const totalFollowers =
    creatorProfile.totalFollowers ||
    (creatorProfile as any).followers ||
    creatorProfile.socialLinks?.instagramFollowers ||
    '0';
  const engagementRate = creatorProfile.engagementRate || '0%';
  const bio = creatorProfile.bio || 'Maʼlumot kiritilmagan';
  const contentTypes =
    creatorProfile.contentTypes && creatorProfile.contentTypes.length > 0
      ? creatorProfile.contentTypes
      : ['Reels', 'Story', 'Post'];

  const priceMin = creatorProfile.priceRange?.min || '0';
  const priceMax = creatorProfile.priceRange?.max || '0';

  const socialLinks = creatorProfile.socialLinks || {
    instagram: creatorProfile.instagramHandle ? `https://instagram.com/${creatorProfile.instagramHandle.replace('@', '')}` : '',
    instagramFollowers: totalFollowers,
    instagramEnabled: Boolean(creatorProfile.instagramHandle),
    tiktok: '',
    tiktokFollowers: '',
    tiktokEnabled: false,
    telegram: '',
    telegramFollowers: '',
    telegramEnabled: false,
    youtube: '',
    youtubeFollowers: '',
    youtubeEnabled: false,
  };

  // Check if this creator is Model or Brand Face
  const creatorCategories = creatorProfile.categories || (initialCreator?.category ? [initialCreator.category] : []);
  const isModelOrBrandFace =
    creatorCategories.some((c) => c === 'Model' || c === 'Brand Face') ||
    initialCreator?.category === 'Model' ||
    initialCreator?.category === 'Brand Face';

  const videoCount = portfolioItems.filter((it) => it.type === 'video').length;
  const activeMedia: CreatorMediaItem = portfolioItems[currentSlideIndex] || portfolioItems[0] || {
    id: 'fallback',
    url: rawAvatarUrl,
    type: 'image',
    title: name,
  };

  const handleNextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % portfolioItems.length);
  };
  const handlePrevSlide = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + portfolioItems.length) % portfolioItems.length);
  };

  const heightDisplay = creatorProfile.height ? `${creatorProfile.height} sm` : (initialCreator?.height ? `${initialCreator.height} sm` : '176 sm');
  const weightDisplay = creatorProfile.weight ? `${creatorProfile.weight} kg` : (initialCreator?.weight ? `${initialCreator.weight} kg` : '54 kg');
  const ageDisplay = creatorProfile.age ? `${creatorProfile.age} yosh` : (initialCreator?.age ? `${initialCreator.age} yosh` : '22 yosh');
  const experienceDisplay = creatorProfile.experienceYears ? `${creatorProfile.experienceYears} yil` : (initialCreator?.experienceYears ? `${initialCreator.experienceYears} yil` : '3 yil');
  const viewsDisplay = (typeof creatorProfile.views === 'number' ? creatorProfile.views : (typeof initialCreator?.views === 'number' ? initialCreator.views : 1)).toLocaleString('uz-UZ');

  // Check if creator is strictly "Mini Blogger"
  const isMiniBlogger =
    category === 'Mini Blogger' ||
    Boolean(creatorCategories.some((c) => c.toLowerCase() === 'mini blogger')) ||
    initialCreator?.category === 'Mini Blogger';

  // Contact details for unlock section
  const rawPhone = (
    creatorProfile.contact ||
    (creatorProfile as any).phone ||
    '+998 90 123 45 67'
  ).trim();

  const rawTelegram = (
    creatorProfile.socialLinks?.telegram ||
    creatorProfile.instagramHandle ||
    (creatorProfile as any).telegram ||
    '@kreator'
  ).trim();

  const telegramHandle = rawTelegram.startsWith('@')
    ? rawTelegram
    : rawTelegram.startsWith('http')
    ? `@${rawTelegram.split('/').filter(Boolean).pop() || 'kreator'}`
    : `@${rawTelegram}`;

  const telegramUrl = rawTelegram.startsWith('http')
    ? rawTelegram
    : `https://t.me/${rawTelegram.replace(/^@/, '')}`;

  const availableBalance = currentUser?.unlockedContactsCount || 0;

  const handleUnlockContactAction = async () => {
    if (!currentUser) {
      if (onOpenRegisterModal) {
        onOpenRegisterModal();
      } else if (onOpenProModal) {
        onOpenProModal();
      }
      return;
    }

    if (isContactUnlocked) {
      return;
    }

    // Agar foydalanuvchida bo'sh (ishlatilmagan) kontakt mavjud bo'lsa
    if (availableBalance > 0) {
      setIsUnlocking(true);
      try {
        const res = await unlockCreatorContact(currentUser.uid, effectiveId);
        if (onUpdateUser) {
          onUpdateUser(res.updatedUser);
        }
        setUnlockSuccessMsg("Kontakt 72 soatga muvaffaqiyatli ochildi! To'liq ma'lumotlar ko'rinmoqda.");
        setTimeout(() => setUnlockSuccessMsg(null), 5000);
      } catch (err: any) {
        console.error("Kontaktni ochishda xatolik:", err);
        setIsContactModalOpen(true);
      } finally {
        setIsUnlocking(false);
      }
    } else {
      // Agar bo'sh kontakt bo'lmasa, to'g'ridan-to'g'ri to'lov/paket tanlash oynasi ochilsin
      setIsContactModalOpen(true);
    }
  };

  const handleCopyContact = (text: string, field: 'phone' | 'telegram') => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2500);
    }
  };

  // =========================================================================
  // MODEL & BRAND FACE PORTFOLIO PROFILE VIEW
  // =========================================================================
  if (isModelOrBrandFace) {
    return (
      <div
        id="model-public-profile-page"
        className="min-h-screen bg-slate-50/50 dark:bg-[#0E0E15] pb-32 sm:pb-36 transition-colors duration-200"
      >
        {/* Top Header / Breadcrumb Bar */}
        <div className="border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-16 z-30 px-4 sm:px-6 lg:px-8 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
            <button
              type="button"
              id="btn-model-back-to-catalog"
              onClick={onBack}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-heading font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer group"
            >
              <span className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/60 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </span>
              <span>Katalogga qaytish</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShare}
                id="btn-model-share-profile"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-heading font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer shadow-2xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copiedLink ? 'Nusxalandi!' : 'Ulashish'}</span>
              </button>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200/70 dark:border-purple-800 text-[11px] font-mono font-bold text-purple-700 dark:text-purple-300">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                {category === 'Brand Face' ? 'Brand Face portfoliosi' : 'Model portfoliosi'}
              </span>
            </div>
          </div>
        </div>

        {/* Main Canvas */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
          {/* 1. SURAT/VIDEO GALEREYASI (yuqori qism) */}
          <div id="model-gallery-section" className="space-y-3">
            {/* Katta, asosiy rasm ko'rinishi (portret format) */}
            <div className="relative max-w-2xl mx-auto rounded-3xl overflow-hidden shadow-2xl bg-black border border-slate-200/40 dark:border-slate-800">
              <div className="relative w-full aspect-[3/4] sm:aspect-[4/5] bg-slate-950 flex items-center justify-center overflow-hidden">
                {activeMedia.type === 'video' ? (
                  <video
                    key={activeMedia.url}
                    src={activeMedia.url}
                    controls
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    key={activeMedia.url}
                    src={activeMedia.url}
                    alt={activeMedia.title || name}
                    className="w-full h-full object-cover select-none transition-all duration-300"
                  />
                )}

                {/* Subtle gradient overlay at bottom for controls readability */}
                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none z-10" />

                {/* Tagida / ichida: "oldingi/keyingi" strelkalar (‹ ›) bilan slayd almashtirish */}
                {portfolioItems.length > 1 && (
                  <>
                    <button
                      type="button"
                      id="btn-model-gallery-prev"
                      onClick={handlePrevSlide}
                      aria-label="Oldingi slayd"
                      className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/45 hover:bg-black/75 text-white backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-lg border border-white/20 active:scale-95 z-20"
                    >
                      <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
                    </button>

                    <button
                      type="button"
                      id="btn-model-gallery-next"
                      onClick={handleNextSlide}
                      aria-label="Keyingi slayd"
                      className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/45 hover:bg-black/75 text-white backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-lg border border-white/20 active:scale-95 z-20"
                    >
                      <ChevronRight className="w-6 h-6 stroke-[2.5]" />
                    </button>
                  </>
                )}

                {/* Rasm ustida, pastki chap burchakda "X ta video" degan belgi (agar video bo'lsa) */}
                {videoCount > 0 && (
                  <div className="absolute bottom-3.5 left-3.5 sm:bottom-4 sm:left-4 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-mono font-bold flex items-center gap-1.5 border border-white/15 z-20 shadow-md">
                    <Film className="w-3.5 h-3.5 text-purple-400" />
                    <span>{videoCount} ta video</span>
                  </div>
                )}

                {/* Rasm ustida, pastki o'ng burchakda "2/7" kabi joriy raqam/jami son */}
                <div className="absolute bottom-3.5 right-3.5 sm:bottom-4 sm:right-4 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-mono font-bold border border-white/15 z-20 shadow-md">
                  {currentSlideIndex + 1} / {portfolioItems.length}
                </div>
              </div>
            </div>

            {/* Asosiy rasm ostida, kichik eskizlar (thumbnail) qatori — barcha yuklangan rasm va videolar */}
            <div className="max-w-2xl mx-auto flex items-center gap-2.5 sm:gap-3 overflow-x-auto py-2 px-1 no-scrollbar scroll-smooth">
              {portfolioItems.map((item, idx) => {
                const isSelected = idx === currentSlideIndex;
                return (
                  <button
                    key={item.id || idx}
                    type="button"
                    onClick={() => setCurrentSlideIndex(idx)}
                    className={`relative w-16 h-20 sm:w-20 sm:h-24 rounded-2xl overflow-hidden shrink-0 transition-all cursor-pointer bg-slate-900 ${
                      isSelected
                        ? 'ring-3 ring-indigo-600 dark:ring-indigo-400 ring-offset-2 ring-offset-slate-50 dark:ring-offset-[#0E0E15] scale-105 shadow-md'
                        : 'opacity-70 hover:opacity-100 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {item.type === 'video' ? (
                      <div className="w-full h-full relative">
                        <video src={item.url} className="w-full h-full object-cover" muted preload="metadata" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
                          <Play className="w-4 h-4 fill-white" />
                        </div>
                      </div>
                    ) : (
                      <img src={item.url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                    )}

                    {/* Small number badge */}
                    <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded-md bg-black/70 text-white font-mono text-[9px] font-bold">
                      {idx + 1}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. STATISTIKA JADVALI (galereyadan keyin, 2 qatorli grid) */}
          <div id="model-stats-grid" className="max-w-2xl mx-auto grid grid-cols-3 gap-2.5 sm:gap-4">
            {/* Qator 1, Katakcha 1: Bo'y (sm) */}
            <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#1A1A24] border border-slate-200/90 dark:border-slate-800/90 text-center sm:text-left shadow-2xs">
              <div className="text-[10px] sm:text-[11px] font-heading font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                BOʻY (SM)
              </div>
              <div className="text-lg sm:text-2xl font-heading font-black text-slate-900 dark:text-white mt-1">
                {heightDisplay}
              </div>
            </div>

            {/* Qator 1, Katakcha 2: Vazn (kg) */}
            <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#1A1A24] border border-slate-200/90 dark:border-slate-800/90 text-center sm:text-left shadow-2xs">
              <div className="text-[10px] sm:text-[11px] font-heading font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                VAZN (KG)
              </div>
              <div className="text-lg sm:text-2xl font-heading font-black text-slate-900 dark:text-white mt-1">
                {weightDisplay}
              </div>
            </div>

            {/* Qator 1, Katakcha 3: Yosh */}
            <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#1A1A24] border border-slate-200/90 dark:border-slate-800/90 text-center sm:text-left shadow-2xs">
              <div className="text-[10px] sm:text-[11px] font-heading font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                YOSH
              </div>
              <div className="text-lg sm:text-2xl font-heading font-black text-slate-900 dark:text-white mt-1">
                {ageDisplay}
              </div>
            </div>

            {/* Qator 2, Katakcha 1: Tajriba (necha yil) */}
            <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#1A1A24] border border-slate-200/90 dark:border-slate-800/90 text-center sm:text-left shadow-2xs">
              <div className="text-[10px] sm:text-[11px] font-heading font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                TAJRIBA
              </div>
              <div className="text-lg sm:text-2xl font-heading font-black text-slate-900 dark:text-white mt-1">
                {experienceDisplay}
              </div>
            </div>

            {/* Qator 2, Katakcha 2: Joriy hudud/shahar */}
            <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#1A1A24] border border-slate-200/90 dark:border-slate-800/90 text-center sm:text-left shadow-2xs">
              <div className="text-[10px] sm:text-[11px] font-heading font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                HUDUD / SHAHAR
              </div>
              <div className="text-lg sm:text-2xl font-heading font-black text-slate-900 dark:text-white mt-1 truncate">
                {city}
              </div>
            </div>

            {/* Qator 2, Katakcha 3: Ko'rishlar soni (views) */}
            <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#1A1A24] border border-slate-200/90 dark:border-slate-800/90 text-center sm:text-left shadow-2xs">
              <div className="text-[10px] sm:text-[11px] font-heading font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-center sm:justify-start gap-1">
                <Eye className="w-3 h-3 text-indigo-500" />
                <span>KOʻRISHLAR</span>
              </div>
              <div className="text-lg sm:text-2xl font-heading font-black text-indigo-600 dark:text-indigo-400 mt-1">
                {viewsDisplay}
              </div>
            </div>
          </div>

          {/* 3. BOSHQA MA'LUMOTLAR: Ism, Kategoriya, Reyting, Joylashuv */}
          <div
            id="model-main-info-card"
            className="bg-white dark:bg-[#1A1A24] rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800/90 p-5 sm:p-7 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
                  {name}
                </h1>
                {isVerified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-heading font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Tekshirilgan
                  </span>
                )}
              </div>

              {/* Subtitle row */}
              <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap text-xs sm:text-sm font-body">
                <span className="px-3 py-1 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/70 dark:to-pink-950/70 border border-purple-200/80 dark:border-purple-800/80 text-purple-700 dark:text-purple-300 font-heading font-bold">
                  {category}
                </span>

                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                  <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span>{city}</span>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/70 text-amber-900 dark:text-amber-300 font-heading font-bold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                  <span>★ {rating.toFixed(1)}</span>
                  <span className="text-[11px] opacity-70 font-normal">({reviewsCount} ta baho)</span>
                </div>
              </div>
            </div>

            {isOwnProfile && (
              <button
                type="button"
                onClick={onEditProfile}
                id="btn-model-edit-profile"
                className="shrink-0 py-2.5 px-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-heading font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Profilni tahrirlash</span>
              </button>
            )}
          </div>

          {/* O'zi haqida (Bio) */}
          <div
            id="model-bio-section"
            className="bg-white dark:bg-[#1A1A24] rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800/90 p-5 sm:p-7 shadow-2xs"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="font-heading font-bold text-lg sm:text-xl text-slate-900 dark:text-white">
                Oʻzi haqida
              </h2>
            </div>
            <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 font-body leading-relaxed whitespace-pre-line">
              {bio}
            </p>
          </div>

          {/* KONTAKTNI OCHISH BO'LIMI (Model va Brand Face uchun) */}
          <ContactUnlockSection
            isContactUnlocked={isContactUnlocked}
            contactUnlockStatus={contactUnlockStatus}
            currentUser={currentUser}
            rawPhone={rawPhone}
            telegramHandle={telegramHandle}
            telegramUrl={telegramUrl}
            availableBalance={availableBalance}
            isUnlocking={isUnlocking}
            unlockSuccessMsg={unlockSuccessMsg}
            copiedField={copiedField}
            onUnlock={handleUnlockContactAction}
            onOpenPackages={() => setIsContactModalOpen(true)}
            onOpenProModal={onOpenProModal}
            onCopy={handleCopyContact}
          />

          {/* Kontent turlari & Narx oralig'i */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white dark:bg-[#1A1A24] rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800/90 p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                    Formatlar va fotosessiya turlari
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {contentTypes.map((type) => (
                    <span
                      key={type}
                      className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-900/80 text-purple-700 dark:text-purple-300 font-heading font-semibold text-xs"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1A1A24] rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800/90 p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                    Hamkorlik narxi oraligʻi
                  </h3>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60">
                  <div className="font-mono font-extrabold text-lg sm:text-xl text-emerald-900 dark:text-emerald-200">
                    {priceMin} — {priceMax} soʻm
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-body mt-1">
                    Fotosessiya yoki brend shartnomasiga qarab kelishiladi
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PASTKI QISM (sticky panel) */}
        <div
          id="model-profile-sticky-footer"
          className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#12121A]/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 px-4 sm:px-6 py-3.5 shadow-2xl transition-all"
        >
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
            <div className="hidden sm:flex items-center gap-3">
              {hasValidAvatar ? (
                <img
                  src={rawAvatarUrl}
                  alt={name}
                  referrerPolicy="no-referrer"
                  onError={() => setImageError(true)}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                />
              ) : (
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColor.bg} ${avatarColor.text} flex items-center justify-center font-heading font-bold text-sm border border-slate-200 dark:border-slate-700 shrink-0 select-none`}
                  title={name}
                >
                  {initials}
                </div>
              )}
              <div>
                <div className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                  {name}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-body">
                  {category} • {city}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
              {isOwnProfile ? (
                <button
                  type="button"
                  id="btn-model-footer-edit-profile"
                  onClick={onEditProfile}
                  className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-heading font-extrabold text-sm shadow-md shadow-indigo-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Profilni tahrirlash</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    id="btn-model-write-message"
                    onClick={() =>
                      onOpenChat({
                        id: effectiveId,
                        name,
                        avatar: effectiveAvatarForChat,
                        handle: creatorProfile.instagramHandle || creatorProfile.contact,
                      })
                    }
                    className="py-3.5 px-4 sm:px-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-heading font-bold text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 shrink-0"
                  >
                    <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="hidden sm:inline">Xabar yozish</span>
                    <span className="sm:hidden">Xabar</span>
                  </button>

                  {isContactUnlocked ? (
                    <a
                      href={`tel:${rawPhone}`}
                      id="btn-model-call-contact"
                      className="flex-1 sm:flex-initial py-3.5 px-6 sm:px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-black text-sm sm:text-base tracking-tight shadow-lg shadow-emerald-600/30 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <PhoneCall className="w-4 h-4 text-white" />
                      <span>Qo'ng'iroq qilish</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      id="btn-model-unlock-contact-sticky"
                      onClick={handleUnlockContactAction}
                      disabled={isUnlocking}
                      className="flex-1 sm:flex-initial py-3.5 px-6 sm:px-8 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-heading font-black text-sm sm:text-base tracking-tight shadow-lg shadow-orange-500/30 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isUnlocking ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Ochilmoqda...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 text-amber-100" />
                          <span>
                            {availableBalance > 0
                              ? `Kontaktni ochish (${availableBalance} ta bor)`
                              : "Kontaktni ochish — 19 000 so'm"}
                          </span>
                        </>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Contact Packages Pay-Per-Contact Modal */}
        <ContactPackagesModal
          isOpen={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
          currentUser={currentUser}
          targetCreator={{
            id: effectiveId,
            name,
            avatar: effectiveAvatarForChat,
          }}
          onUpdateUser={(updated) => {
            if (onUpdateUser) {
              onUpdateUser(updated);
            }
          }}
          onOpenProModal={onOpenProModal}
          onOpenRegisterModal={onOpenRegisterModal}
        />
      </div>
    );
  }

  // =========================================================================
  // STANDARD BLOGGER / MINI BLOGGER PROFILE VIEW (Unchanged)
  // =========================================================================

  return (
    <div
      id="creator-public-profile-page"
      className="min-h-screen bg-slate-50/50 dark:bg-[#0E0E15] pb-32 sm:pb-36 transition-colors duration-200"
    >
      {/* Top Header / Breadcrumb Bar */}
      <div className="border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-16 z-30 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            id="btn-back-to-catalog"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-heading font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer group"
          >
            <span className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/60 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </span>
            <span>Katalogga qaytish</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              id="btn-share-creator-profile"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-heading font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer shadow-2xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedLink ? 'Nusxalandi!' : 'Ulashish'}</span>
            </button>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800 text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Ochiq profil
            </span>
          </div>
        </div>
      </div>

      {/* Main Profile Canvas */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        {/* 1. YUQORI QISM (Hero Header Card) */}
        <div
          id="creator-hero-card"
          className="relative bg-white dark:bg-[#1A1A24] rounded-3xl border border-slate-200/90 dark:border-slate-800/90 p-6 sm:p-8 shadow-xs overflow-hidden"
        >
          {/* Subtle brand gradient background banner */}
          <div className="absolute top-0 left-0 right-0 h-28 sm:h-32 bg-gradient-to-r from-indigo-600/15 via-purple-600/15 to-pink-500/15 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-pink-950/40 border-b border-slate-100 dark:border-slate-800/60" />

          <div className="relative pt-10 sm:pt-12 flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
            {/* Katta doira avatar (profilni tahrirlash sahifasidan olingan rasm yoki ism bosh harflari bilan UI Avatars) */}
            <div className="relative shrink-0">
              {hasValidAvatar ? (
                <img
                  src={rawAvatarUrl}
                  alt={name}
                  referrerPolicy="no-referrer"
                  onError={() => setImageError(true)}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white dark:border-slate-900 shadow-xl"
                />
              ) : (
                <div
                  className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br ${avatarColor.bg} ${avatarColor.text} flex items-center justify-center font-heading font-extrabold text-3xl sm:text-4xl shadow-xl border-4 border-white dark:border-slate-900 select-none`}
                  title={name}
                >
                  {initials}
                </div>
              )}
              {isVerified && (
                <div
                  title="Tekshirilgan kreator"
                  className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm"
                >
                  <CheckCircle2 className="w-5 h-5 fill-indigo-600 text-white stroke-[2.4]" />
                </div>
              )}
            </div>

            {/* Ism, Kategoriya, Shahar, Reyting */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
                  {name}
                </h1>
                {isVerified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-heading font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Tekshirilgan
                  </span>
                )}
              </div>

              {/* Subtitle row: Kategoriya pill, Shahar joylashuv pin, Reyting yulduzcha */}
              <div className="flex items-center justify-center sm:justify-start gap-2.5 sm:gap-3 flex-wrap text-xs sm:text-sm font-body">
                {/* Kategoriya kichik pastilja sifatida */}
                <span className="px-3 py-1 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/70 dark:to-purple-950/70 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 font-heading font-bold">
                  {category}
                </span>

                {/* Shahar joylashuv ikonkasi bilan */}
                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                  <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span>{city}</span>
                </div>

                {/* Reyting (yulduzcha + son, masalan ★ 4.8) */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/70 text-amber-900 dark:text-amber-300 font-heading font-bold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                  <span>★ {rating.toFixed(1)}</span>
                  <span className="text-[11px] opacity-70 font-normal">({reviewsCount} ta baho)</span>
                </div>
              </div>
            </div>

            {/* Top Right Pro or Status Indicator */}
            {isOwnProfile && (
              <button
                type="button"
                onClick={onEditProfile}
                id="btn-creator-hero-edit"
                className="shrink-0 py-2.5 px-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-heading font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Profilni tahrirlash</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. STATISTIKA QATORI (3 ta kichik blok yonma-yon) */}
        <div
          id="creator-stats-row"
          className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4"
        >
          {/* Blok 1: Obunachilar soni (jami, barcha platformalar) */}
          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#1A1A24] border border-slate-200/90 dark:border-slate-800/90 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1.5">
              <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-heading font-semibold uppercase tracking-wider">
                Jami obunachilar
              </span>
            </div>
            <div className="font-heading font-black text-2xl sm:text-3xl text-slate-900 dark:text-white">
              {totalFollowers}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-body mt-1">
              Barcha ijtimoiy tarmoqlar boʻyicha
            </p>
          </div>

          {/* Blok 2: Bajarilgan ishlar/buyurtmalar soni */}
          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#1A1A24] border border-slate-200/90 dark:border-slate-800/90 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1.5">
              <Briefcase className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-heading font-semibold uppercase tracking-wider">
                Bajarilgan ishlar
              </span>
            </div>
            <div className="font-heading font-black text-2xl sm:text-3xl text-slate-900 dark:text-white">
              {reviewsCount} ta
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-body mt-1">
              Muvaffaqiyatli integratsiyalar
            </p>
          </div>

          {/* Blok 3: Faollik ko'rsatkichi (ER %) */}
          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#1A1A24] border border-slate-200/90 dark:border-slate-800/90 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-heading font-semibold uppercase tracking-wider">
                Faollik (ER %)
              </span>
            </div>
            <div className="font-heading font-black text-2xl sm:text-3xl text-emerald-600 dark:text-emerald-400">
              {engagementRate}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-body mt-1">
              Haqiqiy auditoriya reaksiyasi
            </p>
          </div>
        </div>

        {/* 3. "O'ZI HAQIDA" (Bio text block) */}
        <div
          id="creator-bio-section"
          className="bg-white dark:bg-[#1A1A24] rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800/90 p-5 sm:p-7 shadow-2xs"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="font-heading font-bold text-lg sm:text-xl text-slate-900 dark:text-white">
              Oʻzi haqida
            </h2>
          </div>
          <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 font-body leading-relaxed whitespace-pre-line">
            {bio}
          </p>
        </div>

        {/* 4. IJTIMOIY TARMOQLAR (Mini Blogger uchun) / KONTAKTNI OCHISH (Blogger uchun) */}
        {isMiniBlogger ? (
          <div
            id="creator-social-channels"
            className="bg-white dark:bg-[#1A1A24] rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800/90 p-5 sm:p-7 shadow-2xs space-y-4"
          >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-bold text-lg sm:text-xl text-slate-900 dark:text-white">
                Ijtimoiy tarmoqlar va kontaktlar
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-body">
                Kreatorning faol platformalari va bevosita bog'lanish ma'lumotlari
              </p>
            </div>

            {/* Lock Status / Unlock Actions */}
            {!isContactUnlocked ? (
              <div className="flex flex-wrap items-center gap-2">
                {onOpenProModal && (
                  <button
                    type="button"
                    id="btn-blogger-unlock-pro"
                    onClick={onOpenProModal}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white text-xs font-heading font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                    <span>Pro rejimga o'ting</span>
                  </button>
                )}
                <button
                  type="button"
                  id="btn-blogger-unlock-contact-pay"
                  onClick={() => setIsContactModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-heading font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Shu kontaktni ochish (72 soat)</span>
                </button>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/70 text-emerald-800 dark:text-emerald-300 text-xs font-body font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  {contactUnlockStatus.remainingHours
                    ? `Kontakt ochilgan (${contactUnlockStatus.remainingHours} soat qoldi)`
                    : 'Kontaktlar toʻliq ochilgan'}
                </span>
              </div>
            )}
          </div>

          {/* Locked notice banner with direct unlock buttons */}
          {!isContactUnlocked && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#12121A] border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-body">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  Kreatorning rasmiy profillari qulflangan. <strong>19,000 so'm</strong> evaziga 72 soatlik kirish oling yoki Pro obuna bilan cheksiz foydalaning.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsContactModalOpen(true)}
                className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-heading font-bold shrink-0 cursor-pointer"
              >
                Ochish variantlari
              </button>
            </div>
          )}

          {/* Social Platform Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Instagram */}
            {socialLinks.instagramEnabled !== false && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Instagram className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-heading font-semibold text-slate-500 dark:text-slate-400">
                      Instagram
                    </span>
                    <span className="font-heading font-bold text-sm text-slate-900 dark:text-white truncate block">
                      {isContactUnlocked
                        ? handleHandleName(socialLinks.instagram, creatorProfile?.instagramHandle || initialCreator?.handle)
                        : '@••••••••'}
                    </span>
                    <span className="text-xs font-mono font-medium text-pink-600 dark:text-pink-400">
                      {socialLinks.instagramFollowers || totalFollowers} obunachi
                    </span>
                  </div>
                </div>

                {/* Direct Link or Locked State */}
                {isContactUnlocked && socialLinks.instagram ? (
                  <a
                    href={socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs shrink-0"
                    title="Profilni ochish"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsContactModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-heading font-bold shrink-0 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Ochish</span>
                  </button>
                )}
              </div>
            )}

            {/* TikTok */}
            {socialLinks.tiktokEnabled !== false && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Video className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-heading font-semibold text-slate-500 dark:text-slate-400">
                      TikTok
                    </span>
                    <span className="font-heading font-bold text-sm text-slate-900 dark:text-white truncate block">
                      {isContactUnlocked
                        ? handleHandleName(socialLinks.tiktok, creatorProfile?.instagramHandle || initialCreator?.handle)
                        : '@••••••••'}
                    </span>
                    <span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
                      {socialLinks.tiktokFollowers || totalFollowers} obunachi
                    </span>
                  </div>
                </div>

                {isContactUnlocked && socialLinks.tiktok ? (
                  <a
                    href={socialLinks.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs shrink-0"
                    title="TikTok profilini ochish"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsContactModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-heading font-bold shrink-0 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Ochish</span>
                  </button>
                )}
              </div>
            )}

            {/* Telegram */}
            {socialLinks.telegramEnabled !== false && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Send className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-heading font-semibold text-slate-500 dark:text-slate-400">
                      Telegram
                    </span>
                    <span className="font-heading font-bold text-sm text-slate-900 dark:text-white truncate block">
                      {isContactUnlocked
                        ? handleHandleName(socialLinks.telegram, creatorProfile.instagramHandle || creatorProfile.contact)
                        : '@••••••••'}
                    </span>
                    <span className="text-xs font-mono font-medium text-sky-600 dark:text-sky-400">
                      {socialLinks.telegramFollowers || totalFollowers} aʼzo
                    </span>
                  </div>
                </div>

                {isContactUnlocked && socialLinks.telegram ? (
                  <a
                    href={socialLinks.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs shrink-0"
                    title="Telegram kanalini ochish"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsContactModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-heading font-bold shrink-0 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Ochish</span>
                  </button>
                )}
              </div>
            )}

            {/* YouTube (if enabled) */}
            {socialLinks.youtubeEnabled && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Youtube className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-heading font-semibold text-slate-500 dark:text-slate-400">
                      YouTube
                    </span>
                    <span className="font-heading font-bold text-sm text-slate-900 dark:text-white truncate block">
                      {isContactUnlocked ? handleHandleName(socialLinks.youtube, name) : '••••••••'}
                    </span>
                    <span className="text-xs font-mono font-medium text-red-600 dark:text-red-400">
                      {socialLinks.youtubeFollowers || 'Kanal'} obunachi
                    </span>
                  </div>
                </div>

                {isContactUnlocked && socialLinks.youtube ? (
                  <a
                    href={socialLinks.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs shrink-0"
                    title="YouTube kanalini ochish"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsContactModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-heading font-bold shrink-0 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Ochish</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
          <ContactUnlockSection
            isContactUnlocked={isContactUnlocked}
            contactUnlockStatus={contactUnlockStatus}
            currentUser={currentUser}
            rawPhone={rawPhone}
            telegramHandle={telegramHandle}
            telegramUrl={telegramUrl}
            availableBalance={availableBalance}
            isUnlocking={isUnlocking}
            unlockSuccessMsg={unlockSuccessMsg}
            copiedField={copiedField}
            onUnlock={handleUnlockContactAction}
            onOpenPackages={() => setIsContactModalOpen(true)}
            onOpenProModal={onOpenProModal}
            onCopy={handleCopyContact}
          />
        )}

        {/* 5. KONTENT TURLARI VA YO'NALISH & 6. NARX ORALIG'I */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* 5. Kontent turlari tegler sifatida */}
          <div
            id="creator-content-types-card"
            className="bg-white dark:bg-[#1A1A24] rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800/90 p-5 sm:p-6 shadow-2xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                  Kontent turlari va yoʻnalish
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-body mb-3.5">
                Kreator tayyorlaydigan reklama va ijodiy formatlar
              </p>
              <div className="flex flex-wrap gap-2">
                {contentTypes.map((type) => (
                  <span
                    key={type}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/80 text-indigo-700 dark:text-indigo-300 font-heading font-semibold text-xs"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 6. Narx oralig'i */}
          <div
            id="creator-price-range-card"
            className="bg-white dark:bg-[#1A1A24] rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800/90 p-5 sm:p-6 shadow-2xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                  Xizmat narxi oraligʻi
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-body mb-3.5">
                Bir integratsiya yoki kampaniya uchun taxminiy byudjet
              </p>
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60">
                <div className="font-mono font-extrabold text-lg sm:text-xl text-emerald-900 dark:text-emerald-200">
                  {priceMin} — {priceMax} soʻm
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-body mt-1">
                  Loyiha murakkabligi va formatlar soniga qarab kelishiladi
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7. PASTKI QISM (sticky, doim ko'rinadigan harakatlar paneli) */}
      <div
        id="creator-profile-sticky-footer"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#12121A]/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 px-4 sm:px-6 py-3.5 shadow-2xl transition-all"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
          {/* Left info summary */}
          <div className="hidden sm:flex items-center gap-3">
            {hasValidAvatar ? (
              <img
                src={rawAvatarUrl}
                alt={name}
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div
                className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColor.bg} ${avatarColor.text} flex items-center justify-center font-heading font-bold text-sm border border-slate-200 dark:border-slate-700 shrink-0 select-none`}
                title={name}
              >
                {initials}
              </div>
            )}
            <div>
              <div className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                {name}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-body">
                {category} • {city}
              </div>
            </div>
          </div>

          {/* Action buttons on the right */}
          <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            {isOwnProfile ? (
              <button
                type="button"
                id="btn-creator-footer-edit-profile"
                onClick={onEditProfile}
                className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-heading font-extrabold text-sm shadow-md shadow-indigo-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                <span>Profilni tahrirlash</span>
              </button>
            ) : (
              <>
                {/* Yonida kichikroq tugma: "Xabar yozish" */}
                <button
                  type="button"
                  id="btn-creator-write-message"
                  onClick={() =>
                    onOpenChat({
                      id: effectiveId,
                      name,
                      avatar: effectiveAvatarForChat,
                      handle: creatorProfile.instagramHandle || creatorProfile.contact,
                    })
                  }
                  className="py-3.5 px-4 sm:px-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-heading font-bold text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 shrink-0"
                >
                  <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="hidden sm:inline">Xabar yozish</span>
                  <span className="sm:hidden">Xabar</span>
                </button>

                {/* Mini Blogger uchun "Brif yuborish", boshqa barcha kategoriyalar uchun "Kontaktni ochish" */}
                {isMiniBlogger ? (
                  <button
                    type="button"
                    id="btn-creator-send-brief"
                    onClick={() =>
                      checkProUserAndProceed({
                        currentUser,
                        onProceed: () =>
                          onSendBrief({
                            id: effectiveId,
                            name,
                            avatar: effectiveAvatarForChat,
                            handle: creatorProfile.instagramHandle || creatorProfile.contact,
                          }),
                        onProRequired: () => {
                          if (onOpenProModal) {
                            onOpenProModal();
                          }
                        },
                      })
                    }
                    className="flex-1 sm:flex-initial py-3.5 px-6 sm:px-8 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-heading font-black text-sm sm:text-base tracking-tight shadow-lg shadow-indigo-600/30 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4 text-amber-300" />
                    <span>Brif yuborish</span>
                  </button>
                ) : isContactUnlocked ? (
                  <a
                    href={`tel:${rawPhone}`}
                    id="btn-creator-call-contact"
                    className="flex-1 sm:flex-initial py-3.5 px-6 sm:px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-black text-sm sm:text-base tracking-tight shadow-lg shadow-emerald-600/30 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <PhoneCall className="w-4 h-4 text-white" />
                    <span>Qo'ng'iroq qilish</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    id="btn-creator-unlock-contact-sticky"
                    onClick={handleUnlockContactAction}
                    disabled={isUnlocking}
                    className="flex-1 sm:flex-initial py-3.5 px-6 sm:px-8 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-heading font-black text-sm sm:text-base tracking-tight shadow-lg shadow-orange-500/30 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isUnlocking ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Ochilmoqda...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-amber-100" />
                        <span>
                          {availableBalance > 0
                            ? `Kontaktni ochish (${availableBalance} ta bor)`
                            : "Kontaktni ochish — 19 000 so'm"}
                        </span>
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Contact Packages Pay-Per-Contact Modal */}
      <ContactPackagesModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        currentUser={currentUser}
        targetCreator={{
          id: effectiveId,
          name,
          avatar: effectiveAvatarForChat,
        }}
        onUpdateUser={(updated) => {
          if (onUpdateUser) {
            onUpdateUser(updated);
          }
        }}
        onOpenProModal={onOpenProModal}
        onOpenRegisterModal={onOpenRegisterModal}
      />
    </div>
  );
};
