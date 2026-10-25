import React, { useState, useMemo, useEffect } from 'react';
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  ArrowRight,
  Plus,
  Globe,
  UserCheck,
  Send,
  X,
  Sparkles,
  Users,
  Eye,
  FileText,
  Check,
  MessageSquare,
  ShieldCheck,
  HelpCircle,
  RotateCcw,
  ExternalLink,
  Phone,
  PhoneCall,
  Copy,
} from 'lucide-react';
import { BriefData, BriefApplication, BriefCreatorStatus, UserSession } from '../types';
import {
  db,
  respondToBriefInFirestore,
  respondToBriefApplicationInFirestore,
  checkBriefGuaranteeStatus,
  getOrCreateConversation,
  fetchUserProfile,
} from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

interface OrdersPageProps {
  onOpenCatalog: () => void;
  onOpenRegister: () => void;
  isLoggedIn: boolean;
  currentUser?: UserSession | null;
  onOpenCreateBrief?: () => void;
  customBriefs?: BriefData[];
  onApplyToBrief?: (briefId: string, application: BriefApplication) => void | Promise<boolean | void>;
  onOpenChat?: (targetUser?: { uid: string; name: string; avatar?: string; handle?: string; role?: string }) => void;
  initialBriefId?: string | null;
  onClearInitialBriefId?: () => void;
}

const CATEGORIES_LIST = [
  'Barchasi',
  'Fitness',
  'Moda',
  'Texnologiya',
  "Goʻzallik",
  'Ovqat / Fud',
  'Boshqa',
];

const REJECTION_REASONS = [
  'Band vaqtim yoʻq (jadvalim toʻlgan)',
  'Yoʻnalishim va auditoriyamga mos kelmaydi',
  'Taklif etilgan byudjet toʻgʻri kelmadi',
  'Topshirish muddati juda oz',
  'Boshqa sabab',
];

interface AcceptedContactBlockProps {
  partnerName: string;
  partnerRole: 'Brend' | 'Kreator' | string;
  phoneNumber?: string;
  telegramUsername?: string;
  onOpenChat?: () => void;
  className?: string;
}

export const AcceptedContactBlock: React.FC<AcceptedContactBlockProps> = ({
  partnerName,
  partnerRole,
  phoneNumber,
  telegramUsername,
  onOpenChat,
  className = '',
}) => {
  const [copiedType, setCopiedType] = useState<'phone' | 'telegram' | null>(null);

  const cleanPhone = (phoneNumber || '').trim();
  const rawTg = (telegramUsername || '').trim();
  const cleanTg = rawTg.replace(/^https?:\/\/t\.me\//, '').replace(/^@/, '');
  const tgDisplay = cleanTg ? `@${cleanTg}` : '';
  const tgUrl = cleanTg ? `https://t.me/${cleanTg}` : '';

  const hasAnyContact = Boolean(cleanPhone || cleanTg);

  const handleCopy = (text: string, type: 'phone' | 'telegram') => {
    if (!text) return;
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
        setCopiedType(type);
        setTimeout(() => setCopiedType(null), 2500);
      }
    } catch (err) {
      console.warn("Nusxa olishda xatolik:", err);
    }
  };

  return (
    <div
      className={`rounded-2xl border p-3.5 sm:p-4 transition-all ${
        hasAnyContact
          ? 'bg-gradient-to-br from-emerald-50/90 via-emerald-50/40 to-teal-50/40 dark:from-emerald-950/40 dark:via-[#15231F] dark:to-[#11201B] border-emerald-200/90 dark:border-emerald-800/80 shadow-2xs'
          : 'bg-slate-50/90 dark:bg-[#151520] border-slate-200/90 dark:border-slate-800'
      } ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-emerald-200/60 dark:border-emerald-800/50">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <PhoneCall className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h5 className="font-heading font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
              <span>Bogʻlanish maʼlumotlari</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 shrink-0">
                {partnerRole}
              </span>
            </h5>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-body truncate block">
              {partnerName} bilan toʻgʻridan-toʻgʻri aloqa
            </span>
          </div>
        </div>

        {hasAnyContact && (
          <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-heading font-bold text-emerald-700 dark:text-emerald-300 bg-white/80 dark:bg-emerald-950/80 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 shrink-0">
            <Check className="w-3 h-3 stroke-[3]" />
            <span>Qabul qilingan</span>
          </span>
        )}
      </div>

      {/* Body: If contact info exists */}
      {hasAnyContact ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Telefon raqami */}
          {cleanPhone ? (
            <div className="bg-white/90 dark:bg-[#1A1A24]/90 p-2.5 sm:p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-heading block uppercase tracking-wider">
                    Telefon raqami
                  </span>
                  <a
                    href={`tel:${cleanPhone.replace(/[\s-]/g, '')}`}
                    className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors truncate block"
                    title="Qoʻngʻiroq qilish"
                  >
                    {cleanPhone}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(cleanPhone, 'phone')}
                  className="min-w-[44px] min-h-[44px] rounded-xl text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-colors cursor-pointer flex items-center justify-center"
                  title="Raqamdan nusxa olish"
                >
                  {copiedType === 'phone' ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <a
                  href={`tel:${cleanPhone.replace(/[\s-]/g, '')}`}
                  className="min-h-[44px] px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-heading font-bold shadow-2xs transition-colors flex items-center justify-center gap-1 shrink-0"
                >
                  <span>Qoʻngʻiroq</span>
                </a>
              </div>
            </div>
          ) : null}

          {/* Telegram username */}
          {cleanTg ? (
            <div className="bg-white/90 dark:bg-[#1A1A24]/90 p-2.5 sm:p-3 rounded-xl border border-sky-100 dark:border-sky-900/60 flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-500 flex items-center justify-center shrink-0 border border-sky-100 dark:border-sky-900">
                  <Send className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-heading block uppercase tracking-wider">
                    Telegram
                  </span>
                  <a
                    href={tgUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-heading font-bold text-xs sm:text-sm text-sky-600 dark:text-sky-400 hover:underline truncate block"
                    title="Telegram profilini ochish"
                  >
                    {tgDisplay}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(tgDisplay, 'telegram')}
                  className="min-w-[44px] min-h-[44px] rounded-xl text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/60 transition-colors cursor-pointer flex items-center justify-center"
                  title="Telegramdan nusxa olish"
                >
                  {copiedType === 'telegram' ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <a
                  href={tgUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] px-3 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-heading font-bold shadow-2xs transition-colors flex items-center justify-center gap-1 shrink-0"
                >
                  <span>Yozish</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        /* Fallback when neither phone nor telegram is provided */
        <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-300 font-body">
              Bogʻlanish maʼlumotlari hali kiritilmagan, Xabarlar boʻlimi orqali yozing
            </p>
          </div>

          {onOpenChat && (
            <button
              type="button"
              onClick={onOpenChat}
              className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-heading font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Xabar yozish</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export const OrdersPage: React.FC<OrdersPageProps> = ({
  onOpenCatalog,
  onOpenRegister,
  isLoggedIn,
  currentUser,
  onOpenCreateBrief,
  customBriefs = [],
  onApplyToBrief,
  onOpenChat,
  initialBriefId,
  onClearInitialBriefId,
}) => {
  const roleRaw = String(currentUser?.role || '').toLowerCase().trim();
  const isCreator = roleRaw === 'bloger' || roleRaw === 'kreator' || roleRaw === 'creator';
  const isBrand = roleRaw === 'brend' || roleRaw === 'brand' || roleRaw === 'biznes' || roleRaw === 'business' || (!isCreator && Boolean(currentUser) && roleRaw !== 'admin');
  const showCreateBriefButton = Boolean(onOpenCreateBrief) && !isCreator;

  // Main Tab: 'open' ("Ochiq e'lonlar") vs 'direct' ("Menga yuborilgan" / "Shaxsiy briflar")
  const [activeMainTab, setActiveMainTab] = useState<'open' | 'direct'>('open');

  // Direct orders status filter: 'all' | 'yangi' | 'qabul_qilindi' | 'rad_etildi'
  const [directFilter, setDirectFilter] = useState<'all' | 'yangi' | 'qabul_qilindi' | 'rad_etildi'>('all');

  // Open briefs category & search filters
  const [selectedCategory, setSelectedCategory] = useState<string>('Barchasi');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [applyingBrief, setApplyingBrief] = useState<BriefData | null>(null);
  const [viewingDetailsBrief, setViewingDetailsBrief] = useState<BriefData | null>(null);
  const [viewingApplicationsBrief, setViewingApplicationsBrief] = useState<BriefData | null>(null);
  const [rejectingBrief, setRejectingBrief] = useState<BriefData | null>(null);
  const [selectedRejectionTemplate, setSelectedRejectionTemplate] = useState<string>(REJECTION_REASONS[0]);
  const [customRejectionReason, setCustomRejectionReason] = useState<string>('');
  const [guaranteeInfoModal, setGuaranteeInfoModal] = useState<BriefData | null>(null);
  const [refundRequestedSuccess, setRefundRequestedSuccess] = useState(false);

  // Application form fields
  const [applicationMessage, setApplicationMessage] = useState('');
  const [proposedPrice, setProposedPrice] = useState('');
  const [applicationError, setApplicationError] = useState('');
  const [applicationSuccess, setApplicationSuccess] = useState(false);

  // Action status / feedback
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [responseSuccessMessage, setResponseSuccessMessage] = useState<string | null>(null);
  const [responseErrorMessage, setResponseErrorMessage] = useState<string | null>(null);

  const handleModalInputFocus = (e: React.FocusEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    if (
      target &&
      (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')
    ) {
      setTimeout(() => {
        target.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 260);
    }
  };

  // Open target brief directly when navigated from notification
  useEffect(() => {
    if (!initialBriefId) return;

    const target = customBriefs.find((b) => b.id === initialBriefId);
    if (target) {
      if (target.recipientType === 'direct') {
        setActiveMainTab('direct');
      } else {
        setActiveMainTab('open');
      }
      setViewingDetailsBrief(target);
      if (onClearInitialBriefId) {
        onClearInitialBriefId();
      }
    } else {
      // Fallback: Fetch document directly from Firestore
      getDoc(doc(db, 'briefs', initialBriefId))
        .then((snap) => {
          if (snap.exists()) {
            const data = { id: snap.id, ...snap.data() } as BriefData;
            if (data.recipientType === 'direct') {
              setActiveMainTab('direct');
            } else {
              setActiveMainTab('open');
            }
            setViewingDetailsBrief(data);
            if (onClearInitialBriefId) {
              onClearInitialBriefId();
            }
          }
        })
        .catch((err) => {
          console.error("Brif tafsilotlarini yuklashda xatolik:", err);
        });
    }
  }, [initialBriefId, customBriefs, onClearInitialBriefId]);

  // Keep viewingDetailsBrief synced if customBriefs updates
  useEffect(() => {
    if (viewingDetailsBrief) {
      const updated = customBriefs.find((b) => b.id === viewingDetailsBrief.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(viewingDetailsBrief)) {
        setViewingDetailsBrief(updated);
      }
    }
  }, [customBriefs, viewingDetailsBrief]);

  // Filter direct briefs from customBriefs (Firestore) - strictly restricted to currentUser UID
  const directCustomBriefs = useMemo(() => {
    if (!currentUser?.uid) return [];
    const uid = currentUser.uid;
    return customBriefs.filter((b) => {
      if (b.recipientType !== 'direct') return false;
      if (isCreator) {
        return b.selectedCreatorId === uid;
      }
      if (isBrand) {
        return b.brandId === uid;
      }
      return b.selectedCreatorId === uid || b.brandId === uid;
    });
  }, [customBriefs, currentUser?.uid, isCreator, isBrand]);

  // Helper to get effective creator status
  const getBriefStatus = (b: BriefData): BriefCreatorStatus => {
    if (b.creatorStatus) return b.creatorStatus;
    if (b.status === 'in_progress') return 'qabul_qilindi';
    if (b.status === 'cancelled') return 'rad_etildi';
    return 'yangi';
  };

  // Filter direct briefs by status tab
  const filteredDirectBriefs = useMemo(() => {
    return directCustomBriefs.filter((brief) => {
      const st = getBriefStatus(brief);
      if (directFilter === 'all') {
        return true;
      }
      if (directFilter === 'yangi') {
        return st === 'yangi';
      }
      if (directFilter === 'qabul_qilindi') {
        return st === 'qabul_qilindi';
      }
      if (directFilter === 'rad_etildi') {
        return st === 'rad_etildi';
      }
      return true;
    });
  }, [directCustomBriefs, directFilter]);

  // Counts for direct brief tabs
  const countAllDirect = directCustomBriefs.length;
  const countYangiDirect = directCustomBriefs.filter((b) => getBriefStatus(b) === 'yangi').length;
  const countAcceptedDirect = directCustomBriefs.filter((b) => getBriefStatus(b) === 'qabul_qilindi').length;
  const countRejectedDirect = directCustomBriefs.filter((b) => getBriefStatus(b) === 'rad_etildi').length;

  // Open briefs from customBriefs (Firestore)
  const openCustomBriefs = useMemo(() => {
    return customBriefs.filter((b) => b.recipientType === 'open');
  }, [customBriefs]);

  // User contacts cache for partner phone and telegram
  const [userContactsCache, setUserContactsCache] = useState<
    Record<string, { phoneNumber?: string; telegramUsername?: string }>
  >({});

  const resolvePartnerContact = (
    partnerUid?: string,
    directPhone?: string,
    directTelegram?: string
  ) => {
    const cached = partnerUid ? userContactsCache[partnerUid] : undefined;
    const phone = directPhone || cached?.phoneNumber;
    const telegram = directTelegram || cached?.telegramUsername;
    return { phoneNumber: phone, telegramUsername: telegram };
  };

  // Background fetch partner contact info if not directly stored on brief or application
  useEffect(() => {
    const neededUids = new Set<string>();

    customBriefs.forEach((b) => {
      const isAccepted = getBriefStatus(b) === 'qabul_qilindi';
      if (isAccepted) {
        if (isCreator && b.brandId && (!b.brandPhoneNumber && !b.brandTelegramUsername)) {
          neededUids.add(b.brandId);
        } else if (!isCreator && b.selectedCreatorId && (!b.creatorPhoneNumber && !b.creatorTelegramUsername)) {
          neededUids.add(b.selectedCreatorId);
        }
      }
      (b.applications || []).forEach((app) => {
        const isAppAccepted = app.creatorStatus === 'qabul_qilindi' || app.status === 'accepted';
        if (isAppAccepted) {
          if (!isCreator && app.creatorId && (!app.creatorPhoneNumber && !app.creatorTelegramUsername)) {
            neededUids.add(app.creatorId);
          }
          if (isCreator && b.brandId && (!app.brandPhoneNumber && !app.brandTelegramUsername)) {
            neededUids.add(b.brandId);
          }
        }
      });
    });

    neededUids.forEach((uid) => {
      if (!userContactsCache[uid]) {
        fetchUserProfile(uid)
          .then((prof) => {
            if (prof) {
              const phone =
                prof.phoneNumber ||
                (prof as any).phone ||
                (prof.contact && !prof.contact.includes('@') ? prof.contact : undefined);
              const rawTg = prof.telegramUsername || prof.socialLinks?.telegram;
              const tg = rawTg
                ? rawTg.replace(/^https?:\/\/t\.me\//, '').replace(/^@/, '')
                : undefined;
              setUserContactsCache((prev) => ({
                ...prev,
                [uid]: { phoneNumber: phone, telegramUsername: tg },
              }));
            }
          })
          .catch((err) => console.warn("Fetch partner profile error:", err));
      }
    });
  }, [customBriefs, isCreator]);

  // Filter and sort open briefs
  const creatorUserCategory = currentUser?.specialty || currentUser?.category || '';

  const filteredOpenBriefs = useMemo(() => {
    let list = [...openCustomBriefs];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (b) =>
          b.taskTitle.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q) ||
          (b.brandName && b.brandName.toLowerCase().includes(q)) ||
          b.categories.some((c) => c.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== 'Barchasi') {
      if (selectedCategory === 'Boshqa') {
        const standardCats = ['fitness', 'moda', 'texnologiya', 'goʻzallik', 'go\'zallik', 'ovqat / fud', 'ovqat', 'fud'];
        list = list.filter((b) =>
          b.categories.some((c) => !standardCats.some((sc) => c.toLowerCase().includes(sc)))
        );
      } else {
        list = list.filter((b) =>
          b.categories.some((c) => c.toLowerCase().includes(selectedCategory.toLowerCase()))
        );
      }
    }

    // Sort: briefs matching creator's category come first
    if (creatorUserCategory) {
      list.sort((a, b) => {
        const aMatches = a.categories.some((c) =>
          c.toLowerCase().includes(creatorUserCategory.toLowerCase())
        );
        const bMatches = b.categories.some((c) =>
          c.toLowerCase().includes(creatorUserCategory.toLowerCase())
        );
        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;
        return 0;
      });
    }

    return list;
  }, [openCustomBriefs, searchQuery, selectedCategory, creatorUserCategory]);

  // Check if current user already applied to an open brief
  const hasUserApplied = (brief: BriefData) => {
    if (!brief.applications || brief.applications.length === 0) return false;
    if (currentUser?.uid) {
      return brief.applications.some((app) => app.creatorId === currentUser.uid);
    }
    return false;
  };

  // Submit Application Handler for open brief
  const handleOpenApplyModal = (brief: BriefData) => {
    if (!isLoggedIn) {
      onOpenRegister();
      return;
    }
    setApplyingBrief(brief);
    setApplicationMessage('');
    setProposedPrice('');
    setApplicationError('');
    setApplicationSuccess(false);
  };

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationMessage.trim()) {
      setApplicationError('Iltimos, brend uchun qisqa taklif xabaringizni yozing');
      return;
    }

    if (!applyingBrief) return;

    const cPhone =
      currentUser?.phoneNumber ||
      (currentUser as any)?.phone ||
      (currentUser?.contact && !currentUser.contact.includes('@') ? currentUser.contact : undefined);
    const cTg =
      currentUser?.telegramUsername ||
      (currentUser?.socialLinks?.telegram
        ? currentUser.socialLinks.telegram.replace(/^https?:\/\/t\.me\//, '').replace(/^@/, '')
        : undefined);

    const newApplication: BriefApplication = {
      id: `app-${Date.now()}`,
      briefId: applyingBrief.id,
      creatorId: currentUser?.uid || 'temp-creator',
      creatorName: currentUser?.name || 'Ijodkor',
      creatorHandle: currentUser?.handle || currentUser?.instagramHandle || '@kreator',
      creatorAvatar: currentUser?.avatar || (currentUser as any)?.photoURL || (currentUser as any)?.avatarUrl || undefined,
      // Kontaktlar arizaga yozilmaydi: ochiq briflar hammaga ko'rinadi.
      // Brend kontaktni yopiq joydan "ruxsat" (contactGrants) orqali oladi.
      message: applicationMessage.trim(),
      proposedPrice: proposedPrice.trim() || undefined,
      createdAt: 'Hozirgina',
      status: 'pending',
      creatorStatus: 'yangi',
    };

    const targetBrief = applyingBrief;
    setApplicationError('');
    Promise.resolve(onApplyToBrief ? onApplyToBrief(targetBrief.id, newApplication) : true)
      .then((ok) => {
        if (ok === false) {
          setApplicationError("Arizani yuborib boʻlmadi. Internetni tekshirib, qayta urinib koʻring.");
          return;
        }
        // Also update locally in case parent state updates synchronously
        targetBrief.applications = [newApplication, ...(targetBrief.applications || [])];
        setApplicationSuccess(true);
        setTimeout(() => {
          setApplyingBrief(null);
          setApplicationSuccess(false);
        }, 1500);
      })
      .catch(() => {
        setApplicationError("Arizani yuborib boʻlmadi. Internetni tekshirib, qayta urinib koʻring.");
      });
  };

  // =========================================================================
  // CREATOR ACTIONS: ACCEPT AND REJECT DIRECT BRIEFS
  // =========================================================================

  // 1. Accept brief ("Qabul qilish")
  const handleAcceptBrief = async (brief: BriefData) => {
    if (!currentUser?.uid) {
      onOpenRegister();
      return;
    }

    setIsSubmittingResponse(true);
    try {
      const cPhone =
        currentUser.phoneNumber ||
        (currentUser as any)?.phone ||
        (currentUser.contact && !currentUser.contact.includes('@') ? currentUser.contact : undefined);
      const cTg =
        currentUser.telegramUsername ||
        (currentUser.socialLinks?.telegram
          ? currentUser.socialLinks.telegram.replace(/^https?:\/\/t\.me\//, '').replace(/^@/, '')
          : undefined);

      await respondToBriefInFirestore(
        brief.id,
        'qabul_qilindi',
        {
          uid: currentUser.uid,
          name: currentUser.name || 'Kreator',
          avatar: currentUser.avatar,
          handle: currentUser.handle || currentUser.instagramHandle,
          phoneNumber: cPhone,
          telegramUsername: cTg,
        }
      );

      // Local optimistic update
      brief.creatorStatus = 'qabul_qilindi';
      brief.status = 'in_progress';
      if (cPhone) brief.creatorPhoneNumber = cPhone;
      if (cTg) brief.creatorTelegramUsername = cTg;
      if (viewingDetailsBrief && viewingDetailsBrief.id === brief.id) {
        setViewingDetailsBrief({
          ...viewingDetailsBrief,
          creatorStatus: 'qabul_qilindi',
          status: 'in_progress',
        });
      }

      setResponseSuccessMessage("Brif muvaffaqiyatli qabul qilindi! Brendga xabar yuborildi.");
      setTimeout(() => setResponseSuccessMessage(null), 3500);
    } catch (err) {
      console.error("Brifni qabul qilishda xatolik:", err);
      setResponseErrorMessage("Xatolik yuz berdi. Iltimos, qayta urinib koʻring.");
      setTimeout(() => setResponseErrorMessage(null), 4000);
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  // 2. Open Reject brief modal ("Rad etish")
  const handleOpenRejectModal = (brief: BriefData) => {
    if (!currentUser?.uid) {
      onOpenRegister();
      return;
    }
    setRejectingBrief(brief);
    setSelectedRejectionTemplate(REJECTION_REASONS[0]);
    setCustomRejectionReason('');
  };

  // 3. Confirm Rejection ("Rad etishni tasdiqlash")
  const handleConfirmRejectBrief = async () => {
    if (!rejectingBrief || !currentUser?.uid) return;

    const finalReason =
      selectedRejectionTemplate === 'Boshqa sabab'
        ? customRejectionReason.trim() || 'Boshqa sabab'
        : customRejectionReason.trim()
        ? `${selectedRejectionTemplate} (${customRejectionReason.trim()})`
        : selectedRejectionTemplate;

    setIsSubmittingResponse(true);
    try {
      await respondToBriefInFirestore(
        rejectingBrief.id,
        'rad_etildi',
        {
          uid: currentUser.uid,
          name: currentUser.name || 'Kreator',
          avatar: currentUser.avatar,
          handle: currentUser.handle || currentUser.instagramHandle,
        },
        finalReason
      );

      // Optimistic update
      rejectingBrief.creatorStatus = 'rad_etildi';
      rejectingBrief.status = 'cancelled';
      rejectingBrief.rejectionReason = finalReason;

      if (viewingDetailsBrief && viewingDetailsBrief.id === rejectingBrief.id) {
        setViewingDetailsBrief({
          ...viewingDetailsBrief,
          creatorStatus: 'rad_etildi',
          status: 'cancelled',
          rejectionReason: finalReason,
        });
      }

      setRejectingBrief(null);
      setResponseSuccessMessage("Brif rad etildi va 'Rad etilgan' boʻlimiga koʻchirildi.");
      setTimeout(() => setResponseSuccessMessage(null), 3500);
    } catch (err) {
      console.error("Brifni rad etishda xatolik:", err);
      setResponseErrorMessage("Xatolik yuz berdi. Iltimos, qayta urinib koʻring.");
      setTimeout(() => setResponseErrorMessage(null), 4000);
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  // 4. Chat with partner directly
  const handleStartChatWithPartner = async (brief: BriefData) => {
    if (!currentUser?.uid) {
      onOpenRegister();
      return;
    }

    if (isCreator) {
      // Creator chats with brand
      const target = {
        uid: brief.brandId || '',
        name: brief.brandName || 'Brend',
        avatar: brief.brandAvatar,
        role: 'Brend',
      };
      if (target.uid) {
        try {
          await getOrCreateConversation(currentUser, target);
        } catch (e) {
          console.error("Suhbat yaratishda xatolik:", e);
        }
      }
      if (onOpenChat) onOpenChat(target);
    } else {
      // Brand chats with creator
      const target = {
        uid: brief.selectedCreatorId || '',
        name: brief.selectedCreatorName || 'Kreator',
        avatar: brief.selectedCreatorAvatar,
        role: 'Bloger',
      };
      if (target.uid) {
        try {
          await getOrCreateConversation(currentUser, target);
        } catch (e) {
          console.error("Suhbat yaratishda xatolik:", e);
        }
      }
      if (onOpenChat) onOpenChat(target);
    }
  };

  // 5. Brand responds to applicant in open brief
  const handleBrandRespondToApplication = async (
    briefId: string,
    appId: string,
    status: 'qabul_qilindi' | 'rad_etildi',
    reason?: string
  ) => {
    if (!currentUser?.uid) return;
    try {
      const bPhone =
        currentUser.phoneNumber ||
        (currentUser as any)?.phone ||
        (currentUser.contact && !currentUser.contact.includes('@') ? currentUser.contact : undefined);
      const bTg =
        currentUser.telegramUsername ||
        (currentUser.socialLinks?.telegram
          ? currentUser.socialLinks.telegram.replace(/^https?:\/\/t\.me\//, '').replace(/^@/, '')
          : undefined);

      await respondToBriefApplicationInFirestore(
        briefId,
        appId,
        status,
        {
          uid: currentUser.uid,
          name: currentUser.name || 'Brend',
          avatar: currentUser.avatar,
          phoneNumber: bPhone,
          telegramUsername: bTg,
        },
        reason
      );

      // Local optimistic update
      if (viewingApplicationsBrief && viewingApplicationsBrief.id === briefId) {
        const updated = (viewingApplicationsBrief.applications || []).map((app) => {
          if (app.id === appId) {
            return {
              ...app,
              status: (status === 'qabul_qilindi' ? 'accepted' : 'rejected') as any,
              creatorStatus: status,
              rejectionReason: reason,
              brandPhoneNumber: bPhone,
              brandTelegramUsername: bTg,
            };
          }
          return app;
        });
        setViewingApplicationsBrief({
          ...viewingApplicationsBrief,
          applications: updated,
        });
      }
    } catch (e) {
      console.error("Arizaga javob berishda xatolik:", e);
    }
  };

  return (
    <div className="min-h-screen pb-28 pt-6 sm:pt-12 px-4 sm:px-6 max-w-5xl mx-auto">
      {/* Toast / Notification Alert */}
      {responseSuccessMessage && (
        <div className="fixed top-20 inset-x-4 sm:left-auto sm:right-4 z-[80] bg-emerald-600 text-white px-4 sm:px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs sm:text-sm font-heading font-bold animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="break-words">{responseSuccessMessage}</span>
        </div>
      )}

      {responseErrorMessage && (
        <div className="fixed top-20 inset-x-4 sm:left-auto sm:right-4 z-[80] bg-rose-600 text-white px-4 sm:px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs sm:text-sm font-heading font-bold animate-in slide-in-from-top-4 duration-200">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="break-words">{responseErrorMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100/80 dark:border-indigo-900/60 text-xs font-heading font-bold text-indigo-700 dark:text-indigo-300 mb-2">
            <Package className="w-3.5 h-3.5" />
            <span>Hamkorliklar boshqaruvi</span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
            Brif va Buyurtmalar
          </h1>
          <p className="text-[15px] sm:text-base text-slate-600 dark:text-[#D0D0D8] font-body mt-1 leading-relaxed">
            {isCreator
              ? "Sizga yoʻllangan shaxsiy takliflar va barcha ochiq eʼlonlar platformasi."
              : "Kreatorlarga yoʻllangan shaxsiy briflar va barcha ochiq eʼlonlar platformasi."}
          </p>
        </div>

        {/* "+ Brif yaratish" tugmasi — Faqat brend hisoblari uchun (kreatorlar uchun ko'rinmaydi) */}
        {showCreateBriefButton && (
          <div className="flex items-center pt-1 sm:pt-0 shrink-0">
            <button
              type="button"
              id="btn-orders-new-brief"
              onClick={onOpenCreateBrief}
              className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-heading font-bold text-sm sm:text-base shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 transition-all cursor-pointer shrink-0 active:scale-95"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              <span>Brif yaratish</span>
            </button>
          </div>
        )}
      </div>

      {/* PRIMARY SECTION TABS: "Ochiq e'lonlar" (chapda) vs "Menga yuborilgan" / "Shaxsiy briflar" (o'ngda) */}
      <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-[#15151F] rounded-2xl mb-6 max-w-md border border-slate-200/80 dark:border-slate-800">
        <button
          type="button"
          id="tab-briefs-open"
          onClick={() => setActiveMainTab('open')}
          className={`min-h-[44px] px-2 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-heading font-bold transition-all cursor-pointer min-w-0 ${
            activeMainTab === 'open'
              ? 'bg-white dark:bg-[#1E1E2D] text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4 shrink-0" />
          <span className="truncate">Ochiq eʼlonlar</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-mono font-bold shrink-0">
            {openCustomBriefs.length}
          </span>
        </button>

        <button
          type="button"
          id="tab-briefs-direct"
          onClick={() => setActiveMainTab('direct')}
          className={`min-h-[44px] px-2 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-heading font-bold transition-all cursor-pointer min-w-0 ${
            activeMainTab === 'direct'
              ? 'bg-white dark:bg-[#1E1E2D] text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <UserCheck className="w-4 h-4 shrink-0" />
          <span className="truncate">{isCreator ? 'Menga yuborilgan' : 'Shaxsiy briflar'}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200/80 dark:bg-slate-800 font-mono shrink-0">
            {countAllDirect}
          </span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: SHAXSIY BRIFLAR ("Menga yuborilgan" / "Shaxsiy briflar") */}
      {/* ========================================================= */}
      {activeMainTab === 'direct' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar -mx-1 px-1">
            {[
              { key: 'all', label: `Barchasi (${countAllDirect})` },
              { key: 'yangi', label: `Yangi / Kutilmoqda (${countYangiDirect})` },
              { key: 'qabul_qilindi', label: `Qabul qilingan (${countAcceptedDirect})` },
              { key: 'rad_etildi', label: `Rad etilgan (${countRejectedDirect})` },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setDirectFilter(tab.key as typeof directFilter)}
                className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-heading font-bold whitespace-nowrap transition-all cursor-pointer flex items-center justify-center ${
                  directFilter === tab.key
                    ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-[#1A1A24] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Direct Briefs List */}
          <div className="space-y-4">
            {filteredDirectBriefs.length > 0 ? (
              filteredDirectBriefs.map((brief) => {
                const currentStatus = getBriefStatus(brief);
                const isAccepted = currentStatus === 'qabul_qilindi';
                const isRejected = currentStatus === 'rad_etildi';
                const isNewWaiting = currentStatus === 'yangi';

                const guarantee = checkBriefGuaranteeStatus(brief);

                // Format budget
                const budgetText =
                  brief.budgetMin && brief.budgetMax
                    ? `${brief.budgetMin} — ${brief.budgetMax} soʻm`
                    : brief.budgetMin
                    ? `${brief.budgetMin} soʻmdan`
                    : brief.budgetMax
                    ? `${brief.budgetMax} soʻmgacha`
                    : 'Kelishuv asosida';

                // Display info: if viewer is creator, show brand; if brand, show selected creator
                const partnerName = isCreator
                  ? brief.brandName || 'Brend hamkor'
                  : brief.selectedCreatorName || 'Tanlangan kreator';

                const partnerAvatar = isCreator
                  ? brief.brandAvatar
                  : (brief.selectedCreatorAvatar && !brief.selectedCreatorAvatar.includes('photo-1535713875002-d1d0cf377fde') ? brief.selectedCreatorAvatar : '');

                const partnerRoleBadge = isCreator ? 'Brend hamkor' : 'Ijodkor';

                return (
                  <div
                    key={brief.id}
                    id={`direct-brief-${brief.id}`}
                    className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all flex flex-col gap-4 relative"
                  >
                    {/* Top Bar: Partner Avatar & Name + Status Badge */}
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        {partnerAvatar ? (
                          <img
                            src={partnerAvatar}
                            alt={partnerName}
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            decoding="async"
                            width={44}
                            height={44}
                            className="w-11 h-11 rounded-xl object-cover border border-slate-200/80 dark:border-slate-700/80 shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-heading font-bold text-sm shrink-0 border border-slate-200/80 dark:border-slate-700/80 select-none">
                            {(partnerName || 'U').slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            {!isCreator && brief.selectedCreatorId ? (
                              <button
                                type="button"
                                onClick={() => {
                                  window.location.hash = `#kreator-${brief.selectedCreatorId}`;
                                }}
                                className="min-h-[44px] inline-flex items-center font-heading font-bold text-base text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 text-left transition-colors cursor-pointer"
                                title="Kreator profilini ochish"
                              >
                                {partnerName}
                              </button>
                            ) : (
                              <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                                {partnerName}
                              </h3>
                            )}
                            <span className="text-[11px] font-heading font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {partnerRoleBadge}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-body">
                            Yuborilgan vaqti: {brief.createdAt}
                          </span>
                        </div>
                      </div>

                      {/* Status Badges - Requirements 1, 3, 4, 5 */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {isAccepted && (
                          <span
                            id={`status-accepted-${brief.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-heading font-bold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span>Qabul qilindi ✓</span>
                          </span>
                        )}

                        {isRejected && (
                          <span
                            id={`status-rejected-${brief.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-heading font-bold bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                          >
                            <XCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                            <span>Rad etildi</span>
                          </span>
                        )}

                        {isNewWaiting && (
                          <span
                            id={`status-waiting-${brief.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-heading font-bold bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300"
                          >
                            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            <span>{isCreator ? "Yangi brif (Javob kutilmoqda)" : "Kutilmoqda"}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Brief Details Box */}
                    <div className="bg-slate-50/70 dark:bg-[#12121A] border border-slate-100 dark:border-slate-800 rounded-xl p-3.5 sm:p-4 space-y-2">
                      <h4 className="font-heading font-bold text-base text-slate-900 dark:text-white break-words">
                        {brief.taskTitle}
                      </h4>
                      <p className="text-[15px] sm:text-xs text-slate-600 dark:text-[#D0D0D8] font-body line-clamp-2 leading-relaxed break-words">
                        {brief.requirementsSummary || brief.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 dark:text-[#D0D0D8] font-body pt-1">
                        <span>
                          Format: <strong className="text-slate-800 dark:text-slate-200">{brief.formats.join(', ')}</strong>
                        </span>
                        <span>•</span>
                        {brief.paymentType === 'barter' ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 font-heading font-semibold">
                            <span>🔄 Barter:</span>
                            <span className="font-body text-slate-800 dark:text-slate-200 font-medium">
                              {brief.barterDescription || 'Mahsulot/xizmat taklifi'}
                              {brief.barterEstimatedValue ? ` (~${brief.barterEstimatedValue} soʻm)` : ''}
                            </span>
                          </span>
                        ) : (
                          <span>
                            Byudjet: <strong className="text-slate-900 dark:text-white font-mono">{budgetText}</strong>
                          </span>
                        )}
                        <span>•</span>
                        <span>
                          Muddat: <strong className="text-slate-800 dark:text-slate-200">{brief.deadline || 'Kelishuv asosida'}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Rejection Note if rejected */}
                    {isRejected && brief.rejectionReason && (
                      <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                        <span className="font-heading font-semibold text-slate-500 shrink-0">Rad etish sababi:</span>
                        <span className="italic font-body">"{brief.rejectionReason}"</span>
                      </div>
                    )}

                    {/* BOGʻLANISH MAʼLUMOTLARI (Faqat qabul qilingan briflarda koʻrinadi) */}
                    {isAccepted && (
                      <AcceptedContactBlock
                        partnerName={partnerName}
                        partnerRole={isCreator ? 'Brend' : 'Kreator'}
                        phoneNumber={
                          isCreator
                            ? resolvePartnerContact(brief.brandId, brief.brandPhoneNumber, brief.brandTelegramUsername).phoneNumber
                            : resolvePartnerContact(brief.selectedCreatorId, brief.creatorPhoneNumber, brief.creatorTelegramUsername).phoneNumber
                        }
                        telegramUsername={
                          isCreator
                            ? resolvePartnerContact(brief.brandId, brief.brandPhoneNumber, brief.brandTelegramUsername).telegramUsername
                            : resolvePartnerContact(brief.selectedCreatorId, brief.creatorPhoneNumber, brief.creatorTelegramUsername).telegramUsername
                        }
                        onOpenChat={() => handleStartChatWithPartner(brief)}
                      />
                    )}

                    {/* Guarantee Status Pill - Requirement 6 */}
                    <div className="flex items-center justify-between flex-wrap gap-2 text-xs pt-1">
                      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>{guarantee.statusText}</span>
                        <button
                          type="button"
                          onClick={() => setGuaranteeInfoModal(brief)}
                          className="min-w-[44px] min-h-[44px] -my-2 inline-flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                          title="Kafolat shartlarini koʻrish"
                        >
                          <HelpCircle className="w-4 h-4" />
                        </button>
                      </div>

                      {/* If eligible for 30-day refund (waiting 30+ days without response) */}
                      {guarantee.isEligibleForRefund && isBrand && (
                        <button
                          type="button"
                          onClick={() => setGuaranteeInfoModal(brief)}
                          className="min-h-[44px] px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-heading font-bold hover:bg-emerald-100 transition-colors cursor-pointer inline-flex items-center justify-center"
                        >
                          Pulni qaytarish kafolati
                        </button>
                      )}
                    </div>

                    {/* Card Footer: Action Buttons (Requirements 2, 3, 4, 5) */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => setViewingDetailsBrief(brief)}
                        className="min-h-[44px] inline-flex items-center gap-1.5 text-xs sm:text-sm font-heading font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors cursor-pointer self-start sm:self-auto"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Brif tafsilotlari</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      {/* Action buttons based on Role and Status */}
                      <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
                        {/* 1. CREATOR VIEW: "Qabul qilish" & "Rad etish" (Req 2, 3, 4) */}
                        {isCreator && isNewWaiting && (
                          <>
                            {/* "Rad etish" button: neutral / gray color, not red, friendly appearance */}
                            <button
                              type="button"
                              id={`btn-reject-brief-${brief.id}`}
                              disabled={isSubmittingResponse}
                              onClick={() => handleOpenRejectModal(brief)}
                              className="flex-1 sm:flex-none min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300/80 dark:border-slate-700 text-xs font-heading font-semibold transition-all cursor-pointer active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Rad etish</span>
                            </button>

                            {/* "Qabul qilish" button: positive green/emerald */}
                            <button
                              type="button"
                              id={`btn-accept-brief-${brief.id}`}
                              disabled={isSubmittingResponse}
                              onClick={() => handleAcceptBrief(brief)}
                              className="flex-1 sm:flex-none min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-heading font-bold shadow-xs shadow-emerald-600/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>Qabul qilish</span>
                            </button>
                          </>
                        )}

                        {/* 2. ACCEPTED: Show "Xabar yozish" button (Req 3) */}
                        {isAccepted && (
                          <button
                            type="button"
                            id={`btn-chat-brief-${brief.id}`}
                            onClick={() => handleStartChatWithPartner(brief)}
                            className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-heading font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>Xabar yozish</span>
                          </button>
                        )}

                        {/* 3. REJECTED: Creator/Brand see polite indicator */}
                        {isRejected && (
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-body">
                            Rad etilgan brif
                          </span>
                        )}

                        {/* 4. BRAND VIEW when still waiting: option to message or wait */}
                        {isBrand && isNewWaiting && (
                          <span className="text-xs text-amber-600 dark:text-amber-400 font-heading font-semibold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Kreator javobi kutilmoqda</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center max-w-md mx-auto">
                <Package className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
                <p className="text-sm font-heading font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  {directFilter === 'yangi'
                    ? 'Yangi javob berilmagan briflar yoʻq'
                    : directFilter === 'qabul_qilindi'
                    ? 'Qabul qilingan briflar yoʻq'
                    : directFilter === 'rad_etildi'
                    ? 'Rad etilgan briflar mavjud emas'
                    : 'Hozircha shaxsiy briflar mavjud emas'}
                </p>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-[#D0D0D8] font-body mb-4">
                  {isCreator
                    ? "Brendlar sizga shaxsiy brif yoʻllaganda, ular shu yerda koʻrinadi."
                    : "Kreatorlarga yoʻllagan shaxsiy briflaringiz shu yerda shakllanadi."}
                </p>
                {directFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setDirectFilter('all')}
                    className="min-h-[44px] px-4 py-2 inline-flex items-center justify-center text-xs font-heading font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Barcha briflarni koʻrish
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: OCHIQ E'LONLAR (OMMAVIY BRIFLAR) */}
      {/* ========================================================= */}
      {activeMainTab === 'open' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Search and Category Filter Box */}
          <div className="bg-white dark:bg-[#1A1A24] p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 space-y-3.5 shadow-2xs">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ochiq eʼlonlarni nomi, brend yoki talablar boʻyicha qidirish..."
                className="w-full min-h-[48px] pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-base sm:text-sm font-body text-slate-900 dark:text-white bg-slate-50 dark:bg-[#12121A] focus:bg-white dark:focus:bg-[#1A1A24] focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
              />
            </div>

            {/* Categories Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
              {CATEGORIES_LIST.map((category) => {
                const isSelected = selectedCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-heading font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center justify-center ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Open Briefs Cards List */}
          <div className="space-y-3.5">
            {filteredOpenBriefs.length > 0 ? (
              filteredOpenBriefs.map((brief) => {
                const matchesCreatorCategory =
                  creatorUserCategory &&
                  brief.categories.some((c) =>
                    c.toLowerCase().includes(creatorUserCategory.toLowerCase())
                  );

                // 1 ta asosiy kategoriya belgisi
                const mainCategory = brief.categories?.[0] || 'Umumiy';

                // Bitta qisqa qator: narx (yoki "Barter") + muddat
                const priceAndDeadlineText =
                  brief.paymentType === 'barter'
                    ? `🔄 Barter${brief.barterEstimatedValue ? ` (~${brief.barterEstimatedValue} soʻm)` : ''} · ${brief.deadline || 'Kelishuv asosida'}`
                    : brief.budgetMin && brief.budgetMax
                    ? `💰 ${brief.budgetMin} — ${brief.budgetMax} soʻm · ${brief.deadline || 'Kelishuv asosida'}`
                    : brief.budgetMin
                    ? `💰 ${brief.budgetMin} soʻmdan · ${brief.deadline || 'Kelishuv asosida'}`
                    : brief.budgetMax
                    ? `💰 ${brief.budgetMax} soʻmgacha · ${brief.deadline || 'Kelishuv asosida'}`
                    : `💰 Kelishuv asosida · ${brief.deadline || 'Muddati kelishiladi'}`;

                // Tavsifning FAQAT birinchi qatori
                const rawDesc = brief.requirementsSummary || brief.description || '';
                const firstLineDesc = rawDesc.split('\n')[0].trim();

                return (
                  <div
                    key={brief.id}
                    id={`open-brief-card-${brief.id}`}
                    className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all flex flex-col gap-3 relative overflow-hidden"
                  >
                    {/* Category match highlight badge */}
                    {matchesCreatorCategory && (
                      <div className="absolute top-0 right-0 bg-gradient-to-l from-indigo-600 to-purple-600 text-white text-[10px] font-heading font-bold px-2.5 py-0.5 rounded-bl-xl shadow-xs flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Sizga mos</span>
                      </div>
                    )}

                    {/* 1. Yuqori qator: avatar + brend nomi + vaqt + FAQAT BITTA kategoriya belgisi */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={brief.brandAvatar || 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&w=200&q=80'}
                          alt={brief.brandName || 'Brend'}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          decoding="async"
                          width={36}
                          height={36}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-200/80 dark:border-slate-700/80 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white truncate">
                              {brief.brandName || 'Brend hamkor'}
                            </h3>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-body">
                              • {brief.createdAt}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* FAQAT BITTA kategoriya belgisi (eng asosiysi) */}
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-heading font-bold shrink-0">
                        {mainCategory}
                      </span>
                    </div>

                    {/* 2. Brif sarlavhasi (qalin) */}
                    <h4 className="font-heading font-bold text-base text-slate-900 dark:text-white line-clamp-1">
                      {brief.taskTitle}
                    </h4>

                    {/* 3. Tavsifning FAQAT birinchi qatori (1 qator, "..." bilan kesilgan) */}
                    <p className="text-[15px] sm:text-sm text-slate-600 dark:text-[#D0D0D8] font-body truncate leading-relaxed">
                      {firstLineDesc}
                    </p>

                    {/* 4. Bitta qisqa qator: narx + muddat bitta chiziqda */}
                    <div className="text-xs font-heading font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 pt-0.5 break-words">
                      <span>{priceAndDeadlineText}</span>
                    </div>

                    {/* BOGʻLANISH MAʼLUMOTLARI: Ochiq brifda ariza qabul qilingan holatda */}
                    {(() => {
                      if (isCreator && currentUser?.uid) {
                        const myApp = (brief.applications || []).find((a) => a.creatorId === currentUser.uid);
                        const isMyAccepted = myApp && (myApp.status === 'accepted' || myApp.creatorStatus === 'qabul_qilindi');
                        if (isMyAccepted && myApp) {
                          const contact = resolvePartnerContact(
                            brief.brandId,
                            myApp.brandPhoneNumber || brief.brandPhoneNumber,
                            myApp.brandTelegramUsername || brief.brandTelegramUsername
                          );
                          return (
                            <AcceptedContactBlock
                              partnerName={brief.brandName || 'Brend hamkor'}
                              partnerRole="Brend"
                              phoneNumber={contact.phoneNumber}
                              telegramUsername={contact.telegramUsername}
                              onOpenChat={() => handleStartChatWithPartner(brief)}
                            />
                          );
                        }
                      }
                      return null;
                    })()}

                    {/* 5. Pastda FAQAT BITTA tugma: "Batafsil" */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end">
                      <button
                        type="button"
                        id={`btn-view-brief-${brief.id}`}
                        onClick={() => setViewingDetailsBrief(brief)}
                        className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-heading font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Batafsil</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : openCustomBriefs.length === 0 ? (
              <div className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center max-w-md mx-auto">
                <Globe className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
                <p className="text-sm font-heading font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Hozircha ochiq eʼlonlar mavjud emas
                </p>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-[#D0D0D8] font-body">
                  Brendlar ochiq briflar joylashtirganda, ular shu yerda koʻrinadi.
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center max-w-md mx-auto">
                <Globe className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
                <p className="text-sm font-heading font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  Mos ochiq eʼlonlar topilmadi
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('Barchasi');
                    setSearchQuery('');
                  }}
                  className="min-h-[44px] px-4 py-2 inline-flex items-center justify-center text-xs font-heading font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Filtrlarni tozalash
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: ARIZA YUBORISH (CREATOR APPLICATION MODAL) */}
      {/* ========================================================= */}
      {applyingBrief && (
        <div
          id="modal-apply-brief-backdrop"
          className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div
            onFocusCapture={handleModalInputFocus}
            className="bg-white dark:bg-[#1A1A24] rounded-t-3xl sm:rounded-3xl border-t sm:border border-slate-200 dark:border-slate-800 w-full sm:max-w-lg shadow-2xl flex flex-col max-h-[94dvh] sm:max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
          >
            <div className="px-5 py-4 sm:px-7 sm:py-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 shrink-0 bg-white/95 dark:bg-[#1A1A24]/95 backdrop-blur-md">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Send className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white truncate">
                    Ochiq brifga ariza yuborish
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-[#D0D0D8] font-body block truncate">
                    Brend taklifingiz bilan tanishadi
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApplyingBrief(null)}
                aria-label="Yopish"
                className="min-w-[44px] min-h-[44px] rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-7 space-y-5 pb-[max(24px,calc(env(safe-area-inset-bottom,0px)+16px))] sm:pb-7">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#12121A] border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                <span className="block font-heading font-bold text-slate-900 dark:text-white break-words">
                  {applyingBrief.taskTitle}
                </span>
                <span className="block text-slate-500 dark:text-[#D0D0D8] font-body break-words">
                  Brend: <strong>{applyingBrief.brandName || 'Brend'}</strong> • Formatlar: {applyingBrief.formats.join(', ')}
                </span>
                {applyingBrief.paymentType === 'barter' ? (
                  <div className="pt-1 flex flex-wrap items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300 font-medium">
                    <span className="px-2 py-0.5 rounded-md bg-amber-100/80 dark:bg-amber-950/60 font-bold font-heading text-[11px]">🔄 Barter taklifi</span>
                    <span>{applyingBrief.barterDescription || 'Mahsulot/xizmat taklifi'}</span>
                    {applyingBrief.barterEstimatedValue ? <span className="text-slate-500 font-mono">(taxm. {applyingBrief.barterEstimatedValue} soʻm)</span> : null}
                  </div>
                ) : (applyingBrief.budgetMin || applyingBrief.budgetMax) ? (
                  <div className="pt-1 text-xs text-emerald-700 dark:text-emerald-400 font-medium font-mono">
                    Byudjet: {applyingBrief.budgetMin ? `${applyingBrief.budgetMin} soʻmdan` : ''} {applyingBrief.budgetMax ? `${applyingBrief.budgetMax} soʻmgacha` : ''}
                  </div>
                ) : null}
              </div>

              {applicationSuccess ? (
                <div className="p-6 text-center space-y-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-600 dark:text-emerald-400" />
                  <h4 className="font-heading font-bold text-base">Arizangiz muvaffaqiyatli yuborildi!</h4>
                  <p className="text-xs sm:text-sm font-body">
                    Brend javob qaytarganda sizga bildirishnoma keladi.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitApplication} className="space-y-4">
                  <div>
                    <label className="block text-xs font-heading font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {applyingBrief.paymentType === 'barter'
                        ? "Qoʻshimcha toʻlov taklifi (agar kerak boʻlsa, ixtiyoriy)"
                        : "Siz taklif etayotgan narx (ixtiyoriy)"}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={proposedPrice}
                        onChange={(e) => setProposedPrice(e.target.value)}
                        placeholder={applyingBrief.paymentType === 'barter' ? "Masalan: 500 000 yoki boʻsh qoldiring" : "Masalan: 3 000 000"}
                        className="w-full min-h-[48px] pl-3.5 pr-14 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-base sm:text-sm font-body text-slate-900 dark:text-white bg-white dark:bg-[#12121A] focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-body text-slate-400 pointer-events-none">
                        soʻm
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-heading font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Taklifingiz va xabaringiz <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      value={applicationMessage}
                      onChange={(e) => {
                        setApplicationMessage(e.target.value);
                        if (applicationError) setApplicationError('');
                      }}
                      placeholder="Salom! Men ushbu vazifani belgilangan muddatda yuqori sifatda tayyorlay olaman..."
                      className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-base sm:text-sm font-body text-slate-900 dark:text-white bg-white dark:bg-[#12121A] focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 resize-y"
                    />
                    {applicationError && (
                      <p className="text-xs font-heading font-semibold text-rose-600 dark:text-rose-400 mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{applicationError}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setApplyingBrief(null)}
                      className="min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-heading font-semibold transition-colors cursor-pointer"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      className="flex-1 sm:flex-none min-h-[48px] px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-heading font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Arizani yuborish</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: TO'LIQ BRIF TAFSILOTLARI (DETAILS MODAL) */}
      {/* ========================================================= */}
      {viewingDetailsBrief && (
        <div
          id="modal-brief-details-backdrop"
          className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div
            id="modal-brief-details-card"
            className="bg-white dark:bg-[#1A1A24] rounded-t-3xl sm:rounded-3xl border-t sm:border border-slate-200 dark:border-slate-800 w-full sm:max-w-xl shadow-2xl flex flex-col max-h-[94dvh] sm:max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 relative"
          >
            {/* Modal Header (Fixed top bar) */}
            <div className="p-4 sm:px-7 sm:py-5 border-b border-slate-100 dark:border-slate-800/80 flex items-start justify-between gap-3 shrink-0 bg-white/95 dark:bg-[#1A1A24]/95 backdrop-blur-md z-10">
              <div className="min-w-0">
                <span className="text-[11px] font-heading font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  {viewingDetailsBrief.recipientType === 'direct' ? 'Shaxsiy brif tafsilotlari' : 'Ochiq brif tafsilotlari'}
                </span>
                <h3 className="font-heading font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white mt-0.5 break-words">
                  {viewingDetailsBrief.taskTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingDetailsBrief(null)}
                aria-label="Yopish"
                className="min-w-[44px] min-h-[44px] rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-7 pt-4 space-y-5 overflow-y-auto overscroll-contain flex-1 min-h-0 pb-10 sm:pb-12">
              {/* Status indicator in Modal */}
            {viewingDetailsBrief.recipientType === 'direct' && (
              <div className="flex items-center justify-between gap-2 flex-wrap p-3 rounded-xl bg-slate-50 dark:bg-[#12121A] border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-heading font-semibold text-slate-600 dark:text-slate-300">
                  Brif holati:
                </span>
                {getBriefStatus(viewingDetailsBrief) === 'qabul_qilindi' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-bold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Qabul qilindi ✓</span>
                  </span>
                ) : getBriefStatus(viewingDetailsBrief) === 'rad_etildi' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-bold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Rad etildi</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-bold bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Kreator javobi kutilmoqda</span>
                  </span>
                )}
              </div>
            )}

            {/* Brand & Categories Header */}
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#12121A] border border-slate-100 dark:border-slate-800 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={viewingDetailsBrief.brandAvatar || 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&w=200&q=80'}
                  alt="Brand"
                  loading="lazy"
                  decoding="async"
                  className="w-11 h-11 rounded-xl object-cover shrink-0"
                />
                <div className="min-w-0">
                  <span className="block text-xs font-heading font-bold text-slate-900 dark:text-white truncate">
                    {viewingDetailsBrief.brandName || 'Brend hamkor'}
                  </span>
                  <span className="block text-[11px] text-slate-500 dark:text-[#D0D0D8] font-body">
                    Joylashtirilgan: {viewingDetailsBrief.createdAt}
                  </span>
                </div>
              </div>

              {viewingDetailsBrief.recipientType === 'open' && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 text-xs font-heading font-bold text-indigo-700 dark:text-indigo-300">
                  <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Kelgan arizalar ({viewingDetailsBrief.applications?.length || 0})</span>
                </div>
              )}
            </div>

            {/* Description Body */}
            <div>
              <h4 className="text-xs font-heading font-bold text-slate-900 dark:text-white mb-1.5">
                Vazifa tavsifi va talablar:
              </h4>
              <p className="text-[15px] sm:text-sm text-slate-700 dark:text-slate-300 font-body leading-relaxed whitespace-pre-line break-words bg-slate-50/60 dark:bg-[#12121A] p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                {viewingDetailsBrief.description}
              </p>
            </div>

            {/* Attributes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#12121A] border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Kategoriyalar</span>
                <span className="font-heading font-bold text-slate-800 dark:text-slate-200">
                  {viewingDetailsBrief.categories?.join(', ') || 'Umumiy'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#12121A] border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Format</span>
                <span className="font-heading font-bold text-slate-800 dark:text-slate-200">
                  {viewingDetailsBrief.formats?.join(', ') || 'Standart'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#12121A] border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Topshirish muddati</span>
                <span className="font-heading font-bold text-slate-800 dark:text-slate-200">
                  {viewingDetailsBrief.deadline || 'Kelishuv asosida'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#12121A] border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block">
                  {viewingDetailsBrief.paymentType === 'barter' ? 'Toʻlov (Barter)' : 'Byudjet'}
                </span>
                {viewingDetailsBrief.paymentType === 'barter' ? (
                  <span className="font-heading font-bold text-amber-600 dark:text-amber-400 block text-[11px] leading-tight mt-0.5">
                    🔄 {viewingDetailsBrief.barterDescription || 'Mahsulot/xizmat'}
                    {viewingDetailsBrief.barterEstimatedValue ? ` (~${viewingDetailsBrief.barterEstimatedValue} soʻm)` : ''}
                  </span>
                ) : (
                  <span className="font-heading font-bold text-slate-900 dark:text-white font-mono block">
                    {viewingDetailsBrief.budgetMin && viewingDetailsBrief.budgetMax
                      ? `${viewingDetailsBrief.budgetMin} — ${viewingDetailsBrief.budgetMax} soʻm`
                      : viewingDetailsBrief.budgetMin
                      ? `${viewingDetailsBrief.budgetMin} soʻmdan`
                      : viewingDetailsBrief.budgetMax
                      ? `${viewingDetailsBrief.budgetMax} soʻmgacha`
                      : 'Kelishuv asosida'}
                  </span>
                )}
              </div>
            </div>

            {/* Attached files if any */}
            {viewingDetailsBrief.attachedFiles && viewingDetailsBrief.attachedFiles.length > 0 && (
              <div>
                <h4 className="text-xs font-heading font-bold text-slate-900 dark:text-white mb-1.5">
                  Biriktirilgan fayllar:
                </h4>
                <div className="space-y-1.5">
                  {viewingDetailsBrief.attachedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-[#12121A] border border-slate-100 dark:border-slate-800 text-xs"
                    >
                      <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{file.name}</span>
                      <span className="text-slate-400 text-[10px] font-mono">({file.size})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rejection reason display if rejected */}
            {getBriefStatus(viewingDetailsBrief) === 'rad_etildi' && viewingDetailsBrief.rejectionReason && (
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                <span className="font-heading font-bold text-slate-700 dark:text-slate-300 block">
                  Rad etish sababi:
                </span>
                <span className="text-slate-600 dark:text-[#D0D0D8] italic block">
                  "{viewingDetailsBrief.rejectionReason}"
                </span>
              </div>
            )}

            {/* BOGʻLANISH MAʼLUMOTLARI (Qabul qilingan holatda - ikkala tomon uchun) */}
            {(() => {
              const briefStatus = getBriefStatus(viewingDetailsBrief);
              const isDirectAccepted =
                viewingDetailsBrief.recipientType === 'direct' && briefStatus === 'qabul_qilindi';

              const myApp =
                viewingDetailsBrief.recipientType === 'open' && isCreator && currentUser?.uid
                  ? (viewingDetailsBrief.applications || []).find((a) => a.creatorId === currentUser.uid)
                  : null;
              const isMyOpenAppAccepted =
                myApp && (myApp.status === 'accepted' || myApp.creatorStatus === 'qabul_qilindi');

              const selectedApp =
                viewingDetailsBrief.recipientType === 'open' && isBrand
                  ? (viewingDetailsBrief.applications || []).find(
                      (a) =>
                        a.id === viewingDetailsBrief.selectedApplicationId ||
                        a.status === 'accepted' ||
                        a.creatorStatus === 'qabul_qilindi'
                    )
                  : null;

              if (isDirectAccepted) {
                const partnerName = isCreator
                  ? viewingDetailsBrief.brandName || 'Brend hamkor'
                  : viewingDetailsBrief.selectedCreatorName || 'Tanlangan kreator';
                const contact = isCreator
                  ? resolvePartnerContact(
                      viewingDetailsBrief.brandId,
                      viewingDetailsBrief.brandPhoneNumber,
                      viewingDetailsBrief.brandTelegramUsername
                    )
                  : resolvePartnerContact(
                      viewingDetailsBrief.selectedCreatorId,
                      viewingDetailsBrief.creatorPhoneNumber,
                      viewingDetailsBrief.creatorTelegramUsername
                    );

                return (
                  <AcceptedContactBlock
                    partnerName={partnerName}
                    partnerRole={isCreator ? 'Brend' : 'Kreator'}
                    phoneNumber={contact.phoneNumber}
                    telegramUsername={contact.telegramUsername}
                    onOpenChat={() => {
                      const b = viewingDetailsBrief;
                      setViewingDetailsBrief(null);
                      handleStartChatWithPartner(b);
                    }}
                  />
                );
              }

              if (isMyOpenAppAccepted && myApp) {
                const contact = resolvePartnerContact(
                  viewingDetailsBrief.brandId,
                  myApp.brandPhoneNumber || viewingDetailsBrief.brandPhoneNumber,
                  myApp.brandTelegramUsername || viewingDetailsBrief.brandTelegramUsername
                );
                return (
                  <AcceptedContactBlock
                    partnerName={viewingDetailsBrief.brandName || 'Brend hamkor'}
                    partnerRole="Brend"
                    phoneNumber={contact.phoneNumber}
                    telegramUsername={contact.telegramUsername}
                    onOpenChat={() => {
                      const b = viewingDetailsBrief;
                      setViewingDetailsBrief(null);
                      handleStartChatWithPartner(b);
                    }}
                  />
                );
              }

              if (selectedApp && isBrand) {
                const contact = resolvePartnerContact(
                  selectedApp.creatorId,
                  selectedApp.creatorPhoneNumber || viewingDetailsBrief.creatorPhoneNumber,
                  selectedApp.creatorTelegramUsername || viewingDetailsBrief.creatorTelegramUsername
                );
                return (
                  <AcceptedContactBlock
                    partnerName={selectedApp.creatorName || 'Kreator'}
                    partnerRole="Kreator"
                    phoneNumber={contact.phoneNumber}
                    telegramUsername={contact.telegramUsername}
                    onOpenChat={() => {
                      setViewingDetailsBrief(null);
                      handleStartChatWithPartner({
                        ...viewingDetailsBrief,
                        selectedCreatorId: selectedApp.creatorId,
                        selectedCreatorName: selectedApp.creatorName,
                        selectedCreatorAvatar: selectedApp.creatorAvatar,
                      });
                    }}
                  />
                );
              }

              return null;
            })()}

            {/* Generous bottom spacing ensuring content never reaches or hides behind the footer */}
            <div className="h-6 sm:h-8" aria-hidden="true" />
          </div>

          {/* Modal Bottom Action Controls (Docked elevated footer layer with prominent visual boundary, border, shadow, and gradient) */}
          <div className="shrink-0 p-4 pb-[max(16px,calc(env(safe-area-inset-bottom,0px)+8px))] sm:px-7 sm:py-4 bg-white/95 dark:bg-[#1A1A24]/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.08)] dark:shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.5)] relative z-20">
            {/* Visual gradient edge separating scrollable content from action buttons */}
            <div className="absolute -top-3 left-0 right-0 h-3 bg-gradient-to-t from-black/5 dark:from-black/25 to-transparent pointer-events-none" />

            <button
              type="button"
              onClick={() => setViewingDetailsBrief(null)}
              className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-heading font-semibold transition-colors cursor-pointer"
            >
              Yopish
            </button>

            <div className="flex items-center gap-2 flex-wrap flex-1 sm:flex-none justify-end">
              {/* A. If direct brief and creator is reviewing a 'yangi' brief */}
              {viewingDetailsBrief.recipientType === 'direct' &&
                isCreator &&
                getBriefStatus(viewingDetailsBrief) === 'yangi' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleOpenRejectModal(viewingDetailsBrief)}
                      className="min-h-[44px] px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-heading font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Rad etish</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAcceptBrief(viewingDetailsBrief)}
                      className="min-h-[44px] px-4 sm:px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-heading font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Qabul qilish</span>
                    </button>
                  </>
                )}

              {/* B. If direct brief and accepted */}
              {viewingDetailsBrief.recipientType === 'direct' &&
                getBriefStatus(viewingDetailsBrief) === 'qabul_qilindi' && (
                  <button
                    type="button"
                    onClick={() => {
                      const b = viewingDetailsBrief;
                      setViewingDetailsBrief(null);
                      handleStartChatWithPartner(b);
                    }}
                    className="min-h-[44px] px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-heading font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Xabar yozish</span>
                  </button>
                )}

              {/* C. If open brief and user hasn't applied yet */}
              {viewingDetailsBrief.recipientType === 'open' &&
                !hasUserApplied(viewingDetailsBrief) &&
                !isBrand && (
                  <button
                    type="button"
                    onClick={() => {
                      const b = viewingDetailsBrief;
                      setViewingDetailsBrief(null);
                      handleOpenApplyModal(b);
                    }}
                    className="min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-heading font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Ariza yuborish</span>
                  </button>
                )}
            </div>
          </div>
        </div>
      </div>
    )}

      {/* ========================================================= */}
      {/* MODAL 3: REJECTION CONFIRMATION MODAL (REQUIREMENT 4) */}
      {/* ========================================================= */}
      {rejectingBrief && (
        <div
          id="modal-reject-brief-backdrop"
          className="fixed inset-0 z-[75] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div
            onFocusCapture={handleModalInputFocus}
            className="bg-white dark:bg-[#1A1A24] rounded-t-3xl sm:rounded-3xl border-t sm:border border-slate-200 dark:border-slate-800 w-full sm:max-w-md shadow-2xl flex flex-col max-h-[94dvh] sm:max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="px-5 py-4 sm:px-7 sm:py-5 border-b border-slate-100 dark:border-slate-800/80 flex items-start justify-between gap-3 shrink-0 bg-white/95 dark:bg-[#1A1A24]/95 backdrop-blur-md">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                  <XCircle className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white leading-snug">
                    Bu brifni rad etishni tasdiqlaysizmi?
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-[#D0D0D8] font-body block">
                    Brendga doʻstona javob bildirishnomasi yuboriladi
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectingBrief(null)}
                aria-label="Yopish"
                className="min-w-[44px] min-h-[44px] rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-7 space-y-4 pb-[max(24px,calc(env(safe-area-inset-bottom,0px)+16px))] sm:pb-7">
              {/* Target brief summary */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#12121A] border border-slate-100 dark:border-slate-800 text-xs">
                <span className="block font-heading font-bold text-slate-900 dark:text-white break-words">
                  {rejectingBrief.taskTitle}
                </span>
                <span className="block text-slate-500 dark:text-[#D0D0D8] font-body text-[11px] mt-0.5">
                  Brend: {rejectingBrief.brandName || 'Brend'}
                </span>
              </div>

              {/* Optional rejection reason options */}
              <div className="space-y-2">
                <label className="block text-xs font-heading font-semibold text-slate-700 dark:text-slate-300">
                  Rad etish sababi <span className="text-slate-400 font-normal">(ixtiyoriy)</span>:
                </label>

                <div className="space-y-2">
                  {REJECTION_REASONS.map((reason) => (
                    <label
                      key={reason}
                      className={`min-h-[44px] flex items-center gap-2.5 p-3 rounded-xl border text-xs sm:text-sm cursor-pointer transition-colors ${
                        selectedRejectionTemplate === reason
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-medium'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1A1A24] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <input
                        type="radio"
                        name="rejection-reason"
                        value={reason}
                        checked={selectedRejectionTemplate === reason}
                        onChange={() => setSelectedRejectionTemplate(reason)}
                        className="text-indigo-600 focus:ring-indigo-500 w-4 h-4 shrink-0"
                      />
                      <span>{reason}</span>
                    </label>
                  ))}
                </div>

                {/* Custom reason / note */}
                <div className="pt-1">
                  <input
                    type="text"
                    value={customRejectionReason}
                    onChange={(e) => setCustomRejectionReason(e.target.value)}
                    placeholder="Qoʻshimcha qisqa izoh (masalan: keyingi oyda boʻsh boʻlaman)..."
                    className="w-full min-h-[48px] px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-base sm:text-xs font-body text-slate-900 dark:text-white bg-slate-50 dark:bg-[#12121A] focus:bg-white dark:focus:bg-[#1A1A24] focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setRejectingBrief(null)}
                  className="min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-heading font-semibold transition-colors cursor-pointer"
                >
                  Bekor qilish
                </button>
                {/* Neutral slate button, friendly appearance - not harsh red */}
                <button
                  type="button"
                  id="btn-confirm-rejection"
                  disabled={isSubmittingResponse}
                  onClick={handleConfirmRejectBrief}
                  className="flex-1 sm:flex-none min-h-[48px] px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-heading font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isSubmittingResponse ? (
                    <span>Yuborilmoqda...</span>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      <span>Rad etishni tasdiqlash</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: KELGAN ARIZALAR (BRAND APPLICANTS VIEW - REQ 5) */}
      {/* ========================================================= */}
      {viewingApplicationsBrief && (
        <div
          id="modal-applications-brief-backdrop"
          className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div className="bg-white dark:bg-[#1A1A24] rounded-t-3xl sm:rounded-3xl border-t sm:border border-slate-200 dark:border-slate-800 w-full sm:max-w-xl shadow-2xl flex flex-col max-h-[94dvh] sm:max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 relative">
            {/* Header (Fixed top bar) */}
            <div className="p-4 sm:px-7 sm:py-5 border-b border-slate-100 dark:border-slate-800/80 flex items-start justify-between gap-3 shrink-0 bg-white/95 dark:bg-[#1A1A24]/95 backdrop-blur-md z-10">
              <div className="min-w-0">
                <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white">
                  Kelgan arizalar ({viewingApplicationsBrief.applications?.length || 0})
                </h3>
                <span className="text-xs text-slate-500 dark:text-[#D0D0D8] font-body truncate block">
                  {viewingApplicationsBrief.taskTitle}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewingApplicationsBrief(null)}
                aria-label="Yopish"
                className="min-w-[44px] min-h-[44px] rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Applications scrollable body */}
            <div className="p-4 sm:p-7 pt-4 space-y-3 overflow-y-auto overscroll-contain flex-1 min-h-0 pb-10 sm:pb-12">
              {viewingApplicationsBrief.applications && viewingApplicationsBrief.applications.length > 0 ? (
                viewingApplicationsBrief.applications.map((app) => {
                  const isAppAccepted = app.creatorStatus === 'qabul_qilindi' || app.status === 'accepted';
                  const isAppRejected = app.creatorStatus === 'rad_etildi' || app.status === 'rejected';
                  const isAppPending = !isAppAccepted && !isAppRejected;

                  return (
                    <div
                      key={app.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-[#12121A] border border-slate-200/80 dark:border-slate-800 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-3">
                          {app.creatorAvatar && !app.creatorAvatar.includes('photo-1534528741775-53994a69daeb') ? (
                            <img
                              src={app.creatorAvatar}
                              alt={app.creatorName}
                              loading="lazy"
                              decoding="async"
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                                const fallback = (e.target as HTMLElement).nextElementSibling;
                                if (fallback) (fallback as HTMLElement).style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            style={{ display: app.creatorAvatar && !app.creatorAvatar.includes('photo-1534528741775-53994a69daeb') ? 'none' : 'flex' }}
                            className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white items-center justify-center font-heading font-bold text-xs border border-slate-200 dark:border-slate-700 shrink-0 select-none"
                          >
                            {(app.creatorName || 'K').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => {
                                setViewingApplicationsBrief(null);
                                window.location.hash = `#kreator-${app.creatorId}`;
                              }}
                              className="min-h-[44px] flex flex-col justify-center text-left cursor-pointer group"
                              title="Kreator profilini ochish"
                            >
                              <span className="block font-heading font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {app.creatorName}
                              </span>
                              <span className="block text-[11px] text-indigo-600 dark:text-indigo-400 font-mono">
                                {app.creatorHandle || '@kreator'}
                              </span>
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Status Badge */}
                          {isAppAccepted && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-heading font-bold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Qabul qilindi ✓</span>
                            </span>
                          )}

                          {isAppRejected && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-heading font-bold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                              <XCircle className="w-3 h-3" />
                              <span>Rad etildi</span>
                            </span>
                          )}

                          {isAppPending && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-heading font-bold bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300">
                              <Clock className="w-3 h-3" />
                              <span>Kutilmoqda</span>
                            </span>
                          )}

                          {app.proposedPrice && (
                            <div className="text-right pl-2 border-l border-slate-200 dark:border-slate-800">
                              <span className="text-[10px] text-slate-400 block">Taklif narxi</span>
                              <span className="font-heading font-bold text-xs text-emerald-600 dark:text-emerald-400">
                                {app.proposedPrice} soʻm
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-[15px] sm:text-xs text-slate-700 dark:text-slate-300 font-body bg-white dark:bg-[#1A1A24] p-3 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed break-words">
                        {app.message}
                      </p>

                      {/* BOGʻLANISH MAʼLUMOTLARI: Brend qabul qilingan kreator kontaktlarini koʻradi */}
                      {isAppAccepted && (
                        <AcceptedContactBlock
                          partnerName={app.creatorName}
                          partnerRole="Kreator"
                          phoneNumber={
                            resolvePartnerContact(
                              app.creatorId,
                              app.creatorPhoneNumber || viewingApplicationsBrief.creatorPhoneNumber,
                              app.creatorTelegramUsername || viewingApplicationsBrief.creatorTelegramUsername
                            ).phoneNumber
                          }
                          telegramUsername={
                            resolvePartnerContact(
                              app.creatorId,
                              app.creatorPhoneNumber || viewingApplicationsBrief.creatorPhoneNumber,
                              app.creatorTelegramUsername || viewingApplicationsBrief.creatorTelegramUsername
                            ).telegramUsername
                          }
                          onOpenChat={async () => {
                            const targetCreator = {
                              uid: app.creatorId,
                              name: app.creatorName || 'Kreator',
                              avatar: app.creatorAvatar,
                              handle: app.creatorHandle,
                              role: 'Bloger',
                            };
                            if (currentUser) {
                              try {
                                await getOrCreateConversation(currentUser, targetCreator);
                              } catch (e) {
                                console.error("Suhbat yaratishda xatolik:", e);
                              }
                            }
                            setViewingApplicationsBrief(null);
                            if (onOpenChat) onOpenChat(targetCreator);
                          }}
                        />
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 pt-1 gap-2.5">
                        <span>Ariza sanasi: {app.createdAt}</span>

                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Brand accept/reject buttons for this applicant */}
                          {isAppPending && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  handleBrandRespondToApplication(
                                    viewingApplicationsBrief.id,
                                    app.id,
                                    'rad_etildi',
                                    'Boshqa nomzod tanlandi'
                                  )
                                }
                                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-heading font-semibold transition-colors cursor-pointer flex items-center justify-center"
                              >
                                Rad etish
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleBrandRespondToApplication(
                                    viewingApplicationsBrief.id,
                                    app.id,
                                    'qabul_qilindi'
                                  )
                                }
                                className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-heading font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Qabul qilish</span>
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setViewingApplicationsBrief(null);
                              window.location.hash = `#kreator-${app.creatorId}`;
                            }}
                            className="min-h-[44px] px-2.5 inline-flex items-center gap-1 font-heading font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs transition-colors cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Profilni koʻrish</span>
                          </button>

                          <button
                            type="button"
                            onClick={async () => {
                              const targetCreator = {
                                uid: app.creatorId,
                                name: app.creatorName || 'Kreator',
                                avatar: app.creatorAvatar,
                                handle: app.creatorHandle,
                                role: 'Bloger',
                              };
                              if (currentUser) {
                                try {
                                  await getOrCreateConversation(currentUser, targetCreator);
                                } catch (e) {
                                  console.error("Suhbat yaratishda xatolik:", e);
                                }
                              }
                              setViewingApplicationsBrief(null);
                              if (onOpenChat) onOpenChat(targetCreator);
                            }}
                            className="min-h-[44px] px-2.5 inline-flex items-center gap-1 font-heading font-bold text-indigo-600 dark:text-indigo-400 hover:underline text-xs cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Chatda bogʻlanish</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-heading font-semibold">Hozircha arizalar kelib tushmagan</p>
                </div>
              )}

              {/* Generous bottom spacing */}
              <div className="h-6 sm:h-8" aria-hidden="true" />
            </div>

            {/* Modal Bottom Action Controls */}
            <div className="shrink-0 p-4 pb-[max(16px,calc(env(safe-area-inset-bottom,0px)+8px))] sm:px-7 sm:py-4 bg-white/95 dark:bg-[#1A1A24]/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-3 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.08)] dark:shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.5)] relative z-20">
              <div className="absolute -top-3 left-0 right-0 h-3 bg-gradient-to-t from-black/5 dark:from-black/25 to-transparent pointer-events-none" />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-heading">
                Jami: {viewingApplicationsBrief.applications?.length || 0} ta ariza
              </span>
              <button
                type="button"
                onClick={() => setViewingApplicationsBrief(null)}
                className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-heading font-semibold transition-colors cursor-pointer"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: 100% PUL QAYTARISH KAFOLATI TUSHUNTIRISHI (REQ 6) */}
      {/* ========================================================= */}
      {guaranteeInfoModal && (
        <div
          id="modal-guarantee-backdrop"
          className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div className="bg-white dark:bg-[#1A1A24] rounded-t-3xl sm:rounded-3xl border-t sm:border border-slate-200 dark:border-slate-800 w-full sm:max-w-md shadow-2xl flex flex-col max-h-[94dvh] sm:max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            <div className="px-5 py-4 sm:px-7 sm:py-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 shrink-0 bg-white/95 dark:bg-[#1A1A24]/95 backdrop-blur-md">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-heading font-extrabold text-base sm:text-lg text-slate-900 dark:text-white truncate">
                    100% pul qaytarish kafolati
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-[#D0D0D8] font-body block truncate">
                    Collabix xavfsizlik va shaffoflik standarti
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setGuaranteeInfoModal(null);
                  setRefundRequestedSuccess(false);
                }}
                aria-label="Yopish"
                className="min-w-[44px] min-h-[44px] rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-7 space-y-4 pb-[max(24px,calc(env(safe-area-inset-bottom,0px)+16px))] sm:pb-7">
              {/* Guarantee Explanation in Natural Uzbek */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 space-y-2.5 text-[15px] sm:text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed font-body">
                <div className="flex items-start gap-2">
                  <span className="text-base leading-none shrink-0">🛡️</span>
                  <p>
                    <strong>Kafolat qoidasi:</strong> Agar siz yuborgan brifga <strong>30 kun ichida</strong> birorta ham kreator javob bermasa (qabul qilmasa yoki rad etmasa), toʻlovingiz 100% toʻliq qaytarib beriladi.
                  </p>
                </div>

                <div className="flex items-start gap-2 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40">
                  <span className="text-base leading-none shrink-0">ℹ️</span>
                  <p>
                    <strong>Kreator javobi:</strong> Kreator brifni koʻrib chiqib <strong>"Qabul qilish"</strong> yoki <strong>"Rad etish"</strong> tugmasini bossa, bu rasmiy javob hisoblanadi (chunki kreator taklifni koʻrib chiqdi).
                  </p>
                </div>
              </div>

              {/* Current Brief Guarantee Status */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#12121A] border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                <span className="text-slate-400 block text-[11px]">Tanlangan brif holati:</span>
                <span className="font-heading font-bold text-slate-900 dark:text-white block break-words">
                  {guaranteeInfoModal.taskTitle}
                </span>
                <span className="font-heading font-semibold text-emerald-600 dark:text-emerald-400 block pt-1">
                  {checkBriefGuaranteeStatus(guaranteeInfoModal).statusText}
                </span>
              </div>

              {/* Refund request button if 30+ days expired */}
              {checkBriefGuaranteeStatus(guaranteeInfoModal).isEligibleForRefund && isBrand && (
                <div className="pt-2">
                  {refundRequestedSuccess ? (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-heading font-bold text-center">
                      ✓ Pulni qaytarish arizangiz qabul qilindi. 24 soat ichida hisobingizga tushiriladi.
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setRefundRequestedSuccess(true)}
                      className="w-full min-h-[48px] py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-heading font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>100% toʻlovni qaytarishni soʻrash</span>
                    </button>
                  )}
                </div>
              )}

              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setGuaranteeInfoModal(null);
                    setRefundRequestedSuccess(false);
                  }}
                  className="w-full sm:w-auto min-h-[48px] px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-heading font-semibold transition-colors cursor-pointer"
                >
                  Tushundim
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
