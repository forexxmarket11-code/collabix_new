import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { RegisterModal } from './components/RegisterModal';
import { WhyCollabixSection } from './components/WhyCollabixSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { Footer } from './components/Footer';
import { BottomNav } from './components/BottomNav';
import { ReferralBanner } from './components/ReferralBanner';
import { MoneyBackGuaranteeBanner } from './components/MoneyBackGuaranteeBanner';
import { AgencyBanner } from './components/AgencyBanner';
import { TrialReminderBanner, shouldShowTrialReminderBanner } from './components/TrialReminderBanner';
import { CancelSubscriptionModal } from './components/CancelSubscriptionModal';
import { ProUpgradeModal } from './components/ProUpgradeModal';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { BloggerCatalogBanner } from './components/BloggerCatalogBanner';
import { PageType, UserSession, BriefData, CatalogCreator, BriefApplication, NotificationItem } from './types';
import {
  auth,
  ADMIN_UID,
  onFirebaseAuthReady,
  onAuthUserChanged,
  logoutUser,
  markReminderSent,
  subscribeToBriefs,
  subscribeToCatalogSettings,
  createBriefInFirestore,
  applyToBriefInFirestore,
  getOrCreateConversation,
  subscribeToUserNotifications,
  showBrowserPushNotification,
  recordSubscriptionCancellation,
  updateApplicationWorkflowInFirestore,
} from './firebase';
import type { WorkflowAction } from './firebase';
import { checkProUserAndProceed, isUserPro } from './utils/subscription';
import { V2Navbar, V2BottomNav, V2Footer } from './v2/V2Shell';
import { V2ForBrands } from './v2/V2ForBrands';
import { V2EditProfile } from './v2/V2EditProfile';
import { V2Profile } from './v2/V2Profile';
import { V2Home } from './v2/V2Home';
import { V2BriefPage, V2BrandPage } from './v2/V2BriefPage';
import { V2Register } from './v2/V2Register';
import { V2Applications } from './v2/V2Applications';
import { V2Cabinet, V2NewBrief } from './v2/V2Cabinet';
import { parseV2Hash, go } from './v2/ui';
import {
  subscribeToOpenBriefsPublic,
  respondToBriefApplicationInFirestore,
  resubmitCatalogReview,
  closeBriefInFirestore,
} from './firebase';

// Og'ir sahifalar faqat kerak bo'lganda yuklanadi (sayt tezroq ochilishi uchun)
const CatalogPage = React.lazy(() => import('./components/CatalogPage').then((m) => ({ default: m.CatalogPage })));
const OrdersPage = React.lazy(() => import('./components/OrdersPage').then((m) => ({ default: m.OrdersPage })));
const MessagesPage = React.lazy(() => import('./components/MessagesPage').then((m) => ({ default: m.MessagesPage })));
const EditProfilePage = React.lazy(() => import('./components/EditProfilePage').then((m) => ({ default: m.EditProfilePage })));
const ReferralPage = React.lazy(() => import('./components/ReferralPage').then((m) => ({ default: m.ReferralPage })));
const AgencyPage = React.lazy(() => import('./components/AgencyPage').then((m) => ({ default: m.AgencyPage })));
const AdminLoginPage = React.lazy(() => import('./components/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage })));
const AdminDashboardPage = React.lazy(() => import('./components/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));
const CreateBriefPage = React.lazy(() => import('./components/CreateBriefPage').then((m) => ({ default: m.CreateBriefPage })));
const CreatorPublicProfilePage = React.lazy(() => import('./components/CreatorPublicProfilePage').then((m) => ({ default: m.CreatorPublicProfilePage })));
const PendingApprovalPage = React.lazy(() => import('./components/PendingApprovalPage').then((m) => ({ default: m.PendingApprovalPage })));
const PageSpinner = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="w-7 h-7 border-[3px] border-[#5B3DF5]/25 border-t-[#5B3DF5] rounded-full animate-spin" />
  </div>
);

export default function App() {
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [proModalReason, setProModalReason] = useState<string | null>(null);
  const [userBriefs, setUserBriefs] = useState<BriefData[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [targetBriefIdForOrders, setTargetBriefIdForOrders] = useState<string | null>(null);


  const [currentPage, setCurrentPage] = useState<PageType>(() => {
    try {
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      if (path === '/admin' || path === '/admin/' || hash === '#admin' || hash === '#/admin') {
        return 'admin';
      }

      // Check if logged-in user is blocked (rejected)
      const savedUserStr = localStorage.getItem('collabix_user');
      if (savedUserStr) {
        const savedUser: UserSession = JSON.parse(savedUserStr);
        if (savedUser.accountStatus === 'rejected') {
          if (hash === '#edit-profile' || hash === '#tahrirlash') {
            return 'edit-profile';
          }
          return 'pending-approval';
        }
      }

      if (hash === '#create-brief' || hash === '#brif' || hash === '#brief') {
        return 'create-brief';
      }
      if (hash === '#messages' || hash === '#xabarlar' || hash === '#chat' || path === '/chat') {
        return 'messages';
      }
      if (hash === '#orders' || hash === '#buyurtmalar' || hash === '#briflar') {
        return 'orders';
      }
      if (hash === '#katalog' || hash === '#catalog') {
        return 'catalog';
      }
      if (hash === '#referral' || hash === '#taklif' || hash === '#dostlar') {
        return 'referral';
      }
      if (hash === '#agency' || hash === '#agentlik' || hash === '#hamkorlik' || path === '/agency') {
        return 'agency';
      }
      if (hash === '#profile' || hash === '#profil') {
        return localStorage.getItem('collabix_user') ? 'profile' : 'home';
      }
      if (hash === '#edit-profile' || hash === '#tahrirlash') {
        return localStorage.getItem('collabix_user') ? 'edit-profile' : 'home';
      }
      if (hash.startsWith('#kreator-') || hash.startsWith('#creator-') || hash === '#creator-profile') {
        return 'creator-profile';
      }
    } catch {
      // ignore
    }
    return 'home';
  });

  const [selectedCreatorForProfile, setSelectedCreatorForProfile] = useState<CatalogCreator | null>(null);

  const [preselectedCreatorForBrief, setPreselectedCreatorForBrief] = useState<{
    id: string;
    name: string;
    avatar?: string;
    handle?: string;
  } | null>(null);

  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('collabix_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authUid, setAuthUid] = useState<string | null>(null);
  // ===== Yangi sayt (v2) holati =====
  const [fullEditor, setFullEditor] = useState(false);
  // Yangi sayt faqat yorug' rejimda (eski sahifalar ham bir xil ko'rinsin)
  useEffect(() => {
    try { document.documentElement.classList.remove('dark'); } catch {}
  }, []);
  const [v2Hash, setV2Hash] = useState<string>(() => (typeof window !== 'undefined' ? window.location.hash : ''));
  // Oxirgi ko'rilgan e'lonlar darhol ko'rinadi, keyin bazadan yangilanadi
  const [publicBriefs, setPublicBriefs] = useState<BriefData[]>(() => {
    try {
      const c = JSON.parse(localStorage.getItem('cbx_briefs_v1') || 'null');
      return Array.isArray(c) ? c : [];
    } catch {
      return [];
    }
  });
  const [publicBriefsLoading, setPublicBriefsLoading] = useState(() => {
    try { return !localStorage.getItem('cbx_briefs_v1'); } catch { return true; }
  });
  useEffect(() => {
    const onHash = () => setV2Hash(window.location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  useEffect(() => {
    const unsub = subscribeToOpenBriefsPublic((list) => {
      setPublicBriefs(list);
      setPublicBriefsLoading(false);
      try {
        // Keshga yengil nusxa: ariza rasmlarisiz
        const lite = list.slice(0, 60).map((b) => ({
          ...b,
          applications: (b.applications || []).map((a) => ({ ...a, creatorAvatar: a.creatorAvatar && a.creatorAvatar.length > 300 ? undefined : a.creatorAvatar })),
          brandAvatar: b.brandAvatar && b.brandAvatar.length > 60000 ? undefined : b.brandAvatar,
        }));
        localStorage.setItem('cbx_briefs_v1', JSON.stringify(lite));
      } catch {}
    });
    return () => unsub();
  }, [authUid]);
  useEffect(() => {
    const h = v2Hash.replace(/^#/, '');
    if (['brendlar', 'narxlar', 'elonlar', 'qanday'].includes(h)) {
      const t = setTimeout(() => document.getElementById(h)?.scrollIntoView({ behavior: 'smooth' }), 120);
      return () => clearTimeout(t);
    }
  }, [v2Hash]);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [catalogProOnly, setCatalogProOnly] = useState<boolean>(true);
  const [catalogReviewRequired, setCatalogReviewRequired] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onFirebaseAuthReady((uid) => {
      setAuthUid(uid);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToCatalogSettings((settings) => {
      setCatalogProOnly(settings.catalogProOnly);
      setCatalogReviewRequired(settings.catalogReviewRequired);
    });
    return () => unsubscribe();
  }, []);

  const isAdminAuthenticated = isAuthReady && authUid === ADMIN_UID;

  const isUserRestricted = Boolean(
    authUid !== ADMIN_UID &&
      currentUser?.uid !== ADMIN_UID &&
      currentUser &&
      currentUser.accountStatus === 'rejected'
  );

  // Real-time Firestore subscription to notifications for current authenticated user
  useEffect(() => {
    if (!isAuthReady) {
      return;
    }
    if (!authUid) {
      setNotifications([]);
      return;
    }

    let isInitialMount = true;
    let prevUnreadCount = 0;

    const unsubscribe = subscribeToUserNotifications(
      authUid,
      (items) => {
        setNotifications(items);

        // Optional browser push notification on new incoming notification
        const unreadList = items.filter((n) => !n.read);
        if (!isInitialMount && unreadList.length > prevUnreadCount) {
          const latestItem = unreadList[0];
          if (latestItem) {
            showBrowserPushNotification('Collabix: Yangi bildirishnoma!', {
              body: latestItem.message,
            });
          }
        }
        isInitialMount = false;
        prevUnreadCount = unreadList.length;
      }
    );

    return () => unsubscribe();
  }, [isAuthReady, authUid]);

  // Real-time Firestore subscription to briefs (waits for Firebase Auth readiness; skips guest home/catalog pages)
  const shouldSubscribeBriefs =
    isAuthReady && (Boolean(authUid) || currentPage === 'orders' || currentPage === 'creator-profile');

  useEffect(() => {
    if (!shouldSubscribeBriefs) {
      if (isAuthReady && !authUid) {
        setUserBriefs([]);
      }
      return;
    }

    const unsubscribe = subscribeToBriefs(
      (loadedBriefs) => {
        setUserBriefs(loadedBriefs);
      },
      (err) => {
        if (err?.code !== 'permission-denied' && err?.code !== 'unavailable') {
          console.warn("Firestore briefs subscription warning:", err?.message || err);
        }
      },
      authUid || undefined
    );
    return () => unsubscribe();
  }, [shouldSubscribeBriefs, authUid, isAuthReady]);

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isTrialBannerDismissedLocally, setIsTrialBannerDismissedLocally] = useState(false);
  const [isBloggerBannerActive, setIsBloggerBannerActive] = useState(false);
  const [isPwaBannerVisibleOnMobile, setIsPwaBannerVisibleOnMobile] = useState(false);

  const handleConfirmCancelSubscription = async (reason: string, reasonDetails?: string) => {
    if (!currentUser?.uid) return;
    await recordSubscriptionCancellation({
      userId: currentUser.uid,
      userName: currentUser.name || "Foydalanuvchi",
      userEmail: currentUser.email || '',
      userRole: currentUser.role || '',
      userHandle: currentUser.handle || currentUser.instagramHandle || '',
      reason,
      reasonDetails,
    });
    const updatedUser: UserSession = {
      ...currentUser,
      subscriptionStatus: 'cancelled',
      cancellationReason: reason,
    };
    handleUpdateUser(updatedUser);
  };

  const handleDismissTrialBanner = async () => {
    setIsTrialBannerDismissedLocally(true);
    if (currentUser?.uid) {
      await markReminderSent(currentUser.uid);
      const updatedUser: UserSession = {
        ...currentUser,
        reminderSent: true,
      };
      handleUpdateUser(updatedUser);
    }
  };

  // Listen to real-time Firebase Auth state changes and session persistence
  useEffect(() => {
    const unsubscribe = onAuthUserChanged((userProfile) => {
      if (userProfile) {
        setCurrentUser(userProfile);
        try {
          localStorage.setItem('collabix_user', JSON.stringify(userProfile));
        } catch {
          // ignore
        }
        if (userProfile.uid === ADMIN_UID || userProfile.accountStatus !== 'rejected') {
          setCurrentPage((prev) => (prev === 'pending-approval' ? 'home' : prev));
        } else if (userProfile.accountStatus === 'rejected') {
          setCurrentPage((prev) => (prev === 'edit-profile' || prev === 'admin' ? prev : 'pending-approval'));
        }
      } else {
        setCurrentUser(null);
        try {
          localStorage.removeItem('collabix_user');
        } catch {
          // ignore
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync route with URL path and hash so users can bookmark, share, or access /admin
  useEffect(() => {
    const handleLocationRoute = () => {
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      let target: PageType = 'home';

      if (path === '/admin' || path === '/admin/' || hash === '#admin' || hash === '#/admin') {
        target = 'admin';
      } else {
        // Check if restricted user tries to navigate
        const savedUserStr = localStorage.getItem('collabix_user');
        let localUser: UserSession | null = null;
        try {
          localUser = savedUserStr ? JSON.parse(savedUserStr) : null;
        } catch {}
        const activeUser = currentUser || localUser;
        if (
          activeUser &&
          activeUser.uid !== ADMIN_UID &&
          activeUser.accountStatus === 'rejected'
        ) {
          if (hash === '#edit-profile' || hash === '#tahrirlash') {
            target = 'edit-profile';
          } else {
            target = 'pending-approval';
          }
          setCurrentPage((prev) => {
            if (prev !== target) {
              window.scrollTo({ top: 0, behavior: 'instant' });
              return target;
            }
            return prev;
          });
          return;
        }

        if (hash === '#katalog' || hash === '#catalog') {
          target = 'home';
        } else if (hash === '#create-brief' || hash === '#brif' || hash === '#brief') {
          target = 'create-brief';
        } else if (hash === '#orders' || hash === '#buyurtmalar' || hash === '#briflar') {
          target = 'orders';
        } else if (hash === '#messages' || hash === '#xabarlar' || hash === '#chat' || path === '/chat') {
          target = 'messages';
        } else if (hash === '#referral' || hash === '#taklif' || hash === '#dostlar') {
          target = 'referral';
        } else if (hash === '#profile' || hash === '#profil') {
          const saved = localStorage.getItem('collabix_user');
          if (saved) {
            target = 'profile';
          } else {
            handleStart();
            return;
          }
        } else if (hash === '#edit-profile' || hash === '#tahrirlash') {
          const saved = localStorage.getItem('collabix_user');
          if (saved) {
            target = 'edit-profile';
          } else {
            handleStart();
            return;
          }
        } else if (hash.startsWith('#kreator-') || hash.startsWith('#creator-') || hash === '#creator-profile') {
          target = 'creator-profile';
        } else {
          target = 'home';
        }
      }

      setCurrentPage((prev) => {
        if (prev !== target) {
          window.scrollTo({ top: 0, behavior: 'instant' });
          return target;
        }
        return prev;
      });
    };

    handleLocationRoute();
    window.addEventListener('hashchange', handleLocationRoute);
    window.addEventListener('popstate', handleLocationRoute);
    return () => {
      window.removeEventListener('hashchange', handleLocationRoute);
      window.removeEventListener('popstate', handleLocationRoute);
    };
  }, [currentUser]);

  const handlePageChange = (page: PageType) => {
    if (isUserRestricted && page !== 'edit-profile' && page !== 'pending-approval' && page !== 'admin') {
      page = 'pending-approval';
    }

    if (page === 'profile' && !currentUser) {
      handleStart();
      return;
    }

    setCurrentPage(page);
    if (page === 'home') {
      if (window.location.pathname === '/admin' || window.location.pathname === '/admin/') {
        window.history.pushState(null, '', '/');
      } else {
        window.history.pushState(null, '', window.location.pathname);
      }
      window.location.hash = '';
    } else if (page === 'pending-approval') {
      window.location.hash = '#kutilmoqda';
    } else if (page === 'messages') {
      window.location.hash = '#xabarlar';
    } else if (page === 'orders') {
      window.location.hash = '#briflar';
    } else if (page === 'catalog') {
      window.location.hash = '#katalog';
    } else if (page === 'profile') {
      window.location.hash = '#profil';
    } else if (page === 'creator-profile') {
      if (selectedCreatorForProfile?.id) {
        window.location.hash = `#kreator-${selectedCreatorForProfile.id}`;
      }
    } else {
      window.location.hash = `#${page}`;
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleOpenCatalog = () => {
    handlePageChange('catalog');
  };

  const handleOpenReferral = () => {
    handlePageChange('referral');
  };

  const handleOpenAgency = () => {
    handlePageChange('agency');
  };

  const handleOpenEditProfile = () => {
    setFullEditor(false);
    handlePageChange('edit-profile');
  };

  const checkProAndProceed = (action: () => void) => {
    checkProUserAndProceed({
      currentUser,
      onProceed: action,
      onProRequired: () => setIsProModalOpen(true),
    });
  };

  const handleOpenCreateBrief = (preselected?: { id: string; name: string; avatar?: string; handle?: string } | null) => {
    setPreselectedCreatorForBrief(preselected || null);
    handlePageChange('create-brief');
  };

  const handleBriefCreated = async (brief: BriefData): Promise<boolean> => {
    try {
      const savedId = await createBriefInFirestore(brief);
      setUserBriefs((prev) => {
        const nextBrief = { ...brief, id: savedId || brief.id };
        const filtered = prev.filter((item) => item.id !== nextBrief.id);
        return [nextBrief, ...filtered];
      });
      return true;
    } catch (err) {
      console.error("Firestore ga brif yozishda xatolik:", err);
      return false;
    }
  };

  const handleApplyToBrief = async (briefId: string, application: BriefApplication): Promise<boolean> => {
    try {
      await applyToBriefInFirestore(briefId, application);
      return true;
    } catch (err: any) {
      console.error("Firestore ga ariza yozishda xatolik:", err);
      // Maxsus holatlarni (takroriy ariza, toʻliq boʻlmagan profil) OrdersPage oʻzi koʻrsatadi
      if (err?.message === 'ALREADY_APPLIED' || err?.message === 'PROFILE_INCOMPLETE') {
        throw err;
      }
      return false;
    }
  };

  const handleSelectBriefFromNotification = (briefId: string) => {
    setTargetBriefIdForOrders(briefId);
    handlePageChange('orders');
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const handleAdminLoginSuccess = () => {
    if (auth.currentUser?.uid === ADMIN_UID) {
      setAuthUid(ADMIN_UID);
      setIsAuthReady(true);
    }
  };

  const handleAdminLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Admin chiqish xatosi:', err);
    }
    setAuthUid(null);
    setCurrentUser(null);
  };

  const handleGoHome = () => {
    try {
      if (window.location.pathname === '/admin' || window.location.pathname === '/admin/') {
        window.history.pushState(null, '', '/');
      }
      window.location.hash = '';
    } catch {
      // ignore
    }
    handlePageChange('home');
  };

  const handleStart = () => {
    setIsRegisterModalOpen(false);
    setCurrentPage('home');
    go('royxat');
  };

  const handleUserRegisterSuccess = (user: UserSession, isNewRegistration?: boolean) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('collabix_user', JSON.stringify(user));
    } catch {
      // ignore
    }
    if (user.accountStatus === 'rejected') {
      handlePageChange('pending-approval');
    } else if (isNewRegistration && user.role === 'bloger') {
      handlePageChange('edit-profile');
    } else {
      handlePageChange('home');
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Firebase chiqish xatosi:", err);
    }
    setCurrentUser(null);
    try {
      localStorage.removeItem('collabix_user');
    } catch {
      // ignore
    }
    handlePageChange('home');
  };

  const handleUpdateUser = (updated: UserSession) => {
    setCurrentUser(updated);
    try {
      localStorage.setItem('collabix_user', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleNavigate = (sectionId: string) => {
    if (currentPage !== 'home') {
      setCurrentPage('home');
      window.history.pushState(null, '', window.location.pathname);
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  /* ======================= Yangi sayt (v2) handlerlari ======================= */
  const v2Route = parseV2Hash(v2Hash);
  const allBriefs: BriefData[] = (() => {
    const map = new Map<string, BriefData>();
    publicBriefs.forEach((b) => map.set(b.id, b));
    userBriefs.forEach((b) => { if (!map.has(b.id) && b.recipientType === 'open') map.set(b.id, b); });
    return Array.from(map.values()).sort((a, b) => (Number(b.createdAtMillis) || 0) - (Number(a.createdAtMillis) || 0));
  })();

  const v2Workflow = async (brief: BriefData, app: BriefApplication, action: WorkflowAction) => {
    await updateApplicationWorkflowInFirestore(brief.id, app.id, action);
  };

  const v2Apply = async (brief: BriefData, message: string, price: string) => {
    if (!currentUser?.uid) throw new Error('AUTH');
    const application: BriefApplication = {
      id: `app-${Date.now()}`,
      briefId: brief.id,
      creatorId: currentUser.uid,
      creatorName: currentUser.name || 'Bloger',
      creatorHandle: currentUser.instagramHandle || currentUser.socialLinks?.instagram || currentUser.handle || '',
      creatorAvatar: currentUser.avatar || undefined,
      message: message.trim(),
      proposedPrice: price.trim() || undefined,
      appliedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: 'pending',
      creatorStatus: 'yangi',
    };
    await applyToBriefInFirestore(brief.id, application);
  };

  const v2Respond = async (brief: BriefData, app: BriefApplication, status: 'qabul_qilindi' | 'rad_etildi', reason?: string) => {
    if (!currentUser?.uid) return;
    await respondToBriefApplicationInFirestore(
      brief.id,
      app.id,
      status,
      { uid: currentUser.uid, name: currentUser.name, avatar: currentUser.avatar, phoneNumber: currentUser.phoneNumber, telegramUsername: currentUser.telegramUsername },
      reason
    );
  };

  const v2OpenChatWith = async (target: { uid: string; name: string; avatar?: string; handle?: string; role: string }) => {
    if (currentUser && target.uid) {
      try {
        await getOrCreateConversation(currentUser, target as any);
      } catch (e) {
        console.error('Suhbatni ochishda xatolik:', e);
      }
    }
    handlePageChange('messages');
  };

  const v2Resubmit = async () => {
    if (!currentUser?.uid) return;
    const at = await resubmitCatalogReview(currentUser.uid);
    handleUpdateUser({ ...currentUser, catalogResubmittedAtMillis: at });
  };

  const v2CreateBrief = async (brief: BriefData): Promise<string | null> => {
    try {
      const id = await createBriefInFirestore(brief);
      return id || null;
    } catch (err) {
      console.error("E'lon yaratishda xato:", err);
      return null;
    }
  };

  const v2Active =
    currentPage === 'home'
      ? v2Route?.name === 'applications' ? 'applications'
        : v2Route?.name === 'cabinet' || v2Route?.name === 'new-brief' ? 'cabinet'
        : v2Hash === '#brendlar' || v2Route?.name === 'brand' ? 'brands'
        : v2Hash === '#narxlar' ? 'pricing'
        : v2Route?.name === 'for-brands' ? 'forBrands'
        : 'home'
      : currentPage === 'profile' || currentPage === 'edit-profile' ? 'profile' : '';

  const renderV2 = () => {
    const r = v2Route;
    if (!r) return <V2Home briefs={allBriefs} loading={publicBriefsLoading} currentUser={currentUser} />;
    if (r.name === 'brief') {
      return (
        <V2BriefPage
          brief={allBriefs.find((b) => b.id === r.id) || null}
          loading={publicBriefsLoading}
          currentUser={currentUser}
          onApply={v2Apply}
          onOpenPro={() => { setProModalReason("Ochiq e'lonlarga ariza yuborish uchun Pro rejim kerak"); setIsProModalOpen(true); }}
          onOpenEditProfile={handleOpenEditProfile}
        />
      );
    }
    if (r.name === 'brand') return <V2BrandPage brandId={r.id} briefs={allBriefs} />;
    if (r.name === 'for-brands') return <V2ForBrands currentUser={currentUser} />;
    if (r.name === 'register') {
      return (
        <V2Register
          mode={r.mode}
          onDone={(u) => {
            handleUpdateUser(u);
          }}
        />
      );
    }
    if (!currentUser) return <V2Register mode="login" onDone={(u) => handleUpdateUser(u)} />;
    if (r.name === 'applications') {
      if (currentUser.role === 'brend') {
        return <V2Cabinet currentUser={currentUser} briefs={allBriefs} onRespond={v2Respond} onContactCreator={(a) => v2OpenChatWith({ uid: a.creatorId, name: a.creatorName, avatar: a.creatorAvatar, handle: a.creatorHandle, role: 'Bloger' })} onOpenCreator={(id) => { window.location.hash = `#kreator-${id}`; }} onWorkflow={v2Workflow} notifications={notifications} onOpenPro={() => setIsProModalOpen(true)} onOpenEditProfile={handleOpenEditProfile} onResubmit={v2Resubmit} onCloseBrief={async (b) => { try { await closeBriefInFirestore(b.id); } catch (e) { console.error(e); } }} />;
      }
      return (
        <V2Applications
          currentUser={currentUser}
          briefs={allBriefs}
          onOpenEditProfile={handleOpenEditProfile}
          onOpenPro={() => setIsProModalOpen(true)}
          onContactBrand={(b) => v2OpenChatWith({ uid: b.brandId || b.ownerId || '', name: b.brandName || 'Brend', avatar: b.brandAvatar, handle: '', role: 'Brend' })}
          onResubmit={v2Resubmit}
          onWorkflow={v2Workflow}
        />
      );
    }
    if (r.name === 'cabinet') {
      if (currentUser.role !== 'brend') {
        return <V2Applications currentUser={currentUser} briefs={allBriefs} onOpenEditProfile={handleOpenEditProfile} onOpenPro={() => setIsProModalOpen(true)} onContactBrand={(b) => v2OpenChatWith({ uid: b.brandId || b.ownerId || '', name: b.brandName || 'Brend', avatar: b.brandAvatar, handle: '', role: 'Brend' })} onResubmit={v2Resubmit} onWorkflow={v2Workflow} />;
      }
      return (
        <V2Cabinet
          currentUser={currentUser}
          briefs={allBriefs}
          onRespond={v2Respond}
          onContactCreator={(a) => v2OpenChatWith({ uid: a.creatorId, name: a.creatorName, avatar: a.creatorAvatar, handle: a.creatorHandle, role: 'Bloger' })}
          onOpenCreator={(id) => { window.location.hash = `#kreator-${id}`; }}
          onWorkflow={v2Workflow}
          notifications={notifications}
          onOpenPro={() => { setProModalReason("E'lon joylash uchun Brend Pro kerak"); setIsProModalOpen(true); }}
          onOpenEditProfile={handleOpenEditProfile}
          onResubmit={v2Resubmit}
          onCloseBrief={async (b) => { try { await closeBriefInFirestore(b.id); } catch (e) { console.error(e); } }}
        />
      );
    }
    if (r.name === 'new-brief') {
      if (currentUser.role !== 'brend') return <V2Home briefs={allBriefs} loading={publicBriefsLoading} currentUser={currentUser} />;
      return <V2NewBrief currentUser={currentUser} onCreate={v2CreateBrief} onOpenPro={() => { setProModalReason("E'lon joylash uchun Brend Pro kerak"); setIsProModalOpen(true); }} />;
    }
    return <V2Home briefs={allBriefs} loading={publicBriefsLoading} currentUser={currentUser} />;
  };

  // Completely isolated Admin Portal - strictly requires Firebase Auth UID === ADMIN_UID
  if (currentPage === 'admin') {
    return (
      <div className="min-h-screen bg-[#F8FAFD] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex flex-col antialiased selection:bg-indigo-600 selection:text-white transition-colors duration-300">
        <React.Suspense fallback={<PageSpinner />}>
        {!isAuthReady ? (
          <div className="min-h-screen flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : isAdminAuthenticated ? (
          <AdminDashboardPage
            onLogout={handleAdminLogout}
            onGoToSite={handleGoHome}
            onUnauthorized={handleAdminLogout}
          />
        ) : (
          <AdminLoginPage
            onLoginSuccess={handleAdminLoginSuccess}
            onGoHome={handleGoHome}
          />
        )}
        </React.Suspense>
      </div>
    );
  }

  const isTrialBannerActive = Boolean(
    !isUserRestricted &&
      currentPage === 'profile' &&
      shouldShowTrialReminderBanner(currentUser, isTrialBannerDismissedLocally)
  );

  const isBottomNavVisible = Boolean(
    !isUserRestricted &&
      currentPage !== 'edit-profile' &&
      currentPage !== 'create-brief' &&
      currentPage !== 'creator-profile'
  );

  const shouldSuppressPwaOnMobile = Boolean(
    !isBottomNavVisible ||
      currentPage === 'messages' ||
      isTrialBannerActive ||
      (!isUserRestricted && currentPage !== 'messages' && isBloggerBannerActive)
  );

  return (
    <div
      className={`v2 min-h-screen w-full max-w-full overflow-x-clip bg-[#F6F5F1] text-[#14121C] flex flex-col antialiased selection:bg-[#5B3DF5] selection:text-white ${
        isBottomNavVisible && currentPage !== 'messages'
          ? isPwaBannerVisibleOnMobile
            ? 'pb-[calc(168px+env(safe-area-inset-bottom,0px))] md:pb-0'
            : 'pb-[calc(92px+env(safe-area-inset-bottom,0px))] md:pb-0'
          : ''
      }`}
    >
      {/* Top Navigation (yangi sayt) */}
      <V2Navbar
        currentUser={currentUser}
        unreadCount={unreadNotificationsCount}
        notifications={notifications}
        onOpenMessages={() => handlePageChange('messages')}
        onOpenProfile={() => handlePageChange(isUserRestricted ? 'edit-profile' : 'profile')}
        onLogout={handleLogout}
        active={v2Active}
      />

      {/* Main Content Areas */}
      <main className={`flex-1 min-w-0 ${currentPage === 'messages' ? 'pb-[calc(88px+env(safe-area-inset-bottom,0px))] sm:pb-24 flex flex-col' : isUserRestricted ? 'pb-12' : 'pb-12 sm:pb-16'}`}>
        <React.Suspense fallback={<PageSpinner />}>
        {/* If user is restricted (pending approval or rejected), strictly show PendingApprovalPage or EditProfilePage */}
        {isUserRestricted && currentPage !== 'edit-profile' && currentUser && (
          <PendingApprovalPage
            user={currentUser}
            onLogout={handleLogout}
            onEditProfile={handleOpenEditProfile}
            onStatusUpdated={(updated) => handleUpdateUser(updated)}
          />
        )}


        {currentPage === 'edit-profile' && !fullEditor && (
          <V2EditProfile
            user={currentUser}
            onSave={(updated) => {
              handleUpdateUser(updated);
            }}
            onBack={() => handlePageChange(isUserRestricted ? 'pending-approval' : 'profile')}
            onOpenFullEditor={() => setFullEditor(true)}
          />
        )}

        {currentPage === 'edit-profile' && fullEditor && (
          <EditProfilePage
            user={currentUser}
            catalogProOnly={catalogProOnly}
            catalogReviewRequired={catalogReviewRequired}
            onOpenProModal={() => setIsProModalOpen(true)}
            onSave={(updated) => {
              handleUpdateUser(updated);
              if (isUserRestricted) {
                handlePageChange('pending-approval');
              }
            }}
            onBack={() => setFullEditor(false)}
            onOpenRegister={handleStart}
          />
        )}

        {!isUserRestricted && currentPage === 'catalog' && (
          <CatalogPage
            onBackToHome={handleGoHome}
            onOpenRegister={handleStart}
            onOpenChat={() => handlePageChange('messages')}
            currentUser={currentUser}
            onOpenProModal={() => setIsProModalOpen(true)}
            onSendBrief={(creator) => handleOpenCreateBrief(creator)}
            onViewCreatorProfile={(creator) => {
              setSelectedCreatorForProfile(creator);
              window.location.hash = `#kreator-${creator.id}`;
              setCurrentPage('creator-profile');
            }}
          />
        )}

        {!isUserRestricted && currentPage === 'creator-profile' && (
          <CreatorPublicProfilePage
            creatorId={
              selectedCreatorForProfile?.id ||
              window.location.hash.replace(/^#(kreator|creator)-/, '').trim() ||
              ''
            }
            initialCreator={selectedCreatorForProfile}
            currentUser={currentUser}
            onBack={handleOpenCatalog}
            onSendBrief={(creator) => handleOpenCreateBrief(creator)}
            onOpenProModal={() => setIsProModalOpen(true)}
            onOpenChat={async (creator) => {
              if (!currentUser) {
                handleStart();
              } else {
                if (creator?.id && currentUser.uid) {
                  try {
                    await getOrCreateConversation(currentUser, {
                      uid: creator.id,
                      name: creator.name || 'Kreator',
                      handle: creator.handle || '@creator',
                      avatar: creator.avatar,
                      role: 'Bloger',
                    });
                  } catch (e) {
                    console.error("Suhbatni ochishda xatolik:", e);
                  }
                }
                handlePageChange('messages');
              }
            }}
            onEditProfile={handleOpenEditProfile}
            userBriefs={userBriefs}
            onUpdateUser={handleUpdateUser}
            onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
          />
        )}

        {!isUserRestricted && currentPage === 'create-brief' && (
          <CreateBriefPage
            onBack={handleGoHome}
            onBriefCreated={handleBriefCreated}
            onViewOrders={() => handlePageChange('orders')}
            preselectedCreator={preselectedCreatorForBrief}
            currentUser={currentUser}
          />
        )}

        {!isUserRestricted && currentPage === 'orders' && (
          <OrdersPage
            onOpenCatalog={handleOpenCatalog}
            onOpenRegister={handleStart}
            isLoggedIn={!!currentUser}
            currentUser={currentUser}
            onOpenCreateBrief={handleOpenCreateBrief}
            customBriefs={userBriefs}
            onApplyToBrief={handleApplyToBrief}
            onOpenChat={async (targetUser) => {
              if (currentUser && targetUser?.uid) {
                try {
                  await getOrCreateConversation(currentUser, targetUser);
                } catch (e) {
                  console.error("Suhbatni ochishda xatolik:", e);
                }
              }
              handlePageChange('messages');
            }}
            initialBriefId={targetBriefIdForOrders}
            onClearInitialBriefId={() => setTargetBriefIdForOrders(null)}
            onOpenProUpgrade={() => {
              setProModalReason("Ochiq briflarga ariza yuborish uchun Pro rejim kerak");
              setIsProModalOpen(true);
            }}
          />
        )}

        {!isUserRestricted && currentPage === 'messages' && (
          <MessagesPage currentUser={currentUser} />
        )}

        {!isUserRestricted && currentPage === 'profile' && (
          <>
            {/* Trial Expiration Reminder Banner (only on Profile page) */}
            {!isTrialBannerDismissedLocally && currentUser && (
              <TrialReminderBanner
                user={currentUser}
                onDismiss={handleDismissTrialBanner}
                onOpenCancelModal={() => setIsCancelModalOpen(true)}
              />
            )}
            <V2Profile
              user={currentUser}
              briefs={allBriefs}
              onEdit={handleOpenEditProfile}
              onLogout={handleLogout}
              onOpenPro={() => setIsProModalOpen(true)}
              onOpenCancelModal={() => setIsCancelModalOpen(true)}
              onOpenRegister={handleStart}
            />
          </>
        )}

        {!isUserRestricted && currentPage === 'referral' && (
          <ReferralPage
            onBackToHome={handleGoHome}
            onOpenRegister={handleStart}
            currentUser={currentUser}
            onOpenProModal={() => setIsProModalOpen(true)}
          />
        )}

        {!isUserRestricted && currentPage === 'agency' && (
          <AgencyPage
            onBackToHome={handleGoHome}
            currentUser={currentUser}
            onOpenRegister={handleStart}
          />
        )}

        {!isUserRestricted && currentPage === 'home' && renderV2()}
        </React.Suspense>
      </main>

      {!isUserRestricted && currentPage !== 'messages' && currentPage !== 'edit-profile' && !(currentPage === 'home' && (v2Route?.name === 'register' || v2Route?.name === 'cabinet')) && <V2Footer />}

      {!isUserRestricted && currentPage !== 'edit-profile' && currentPage !== 'create-brief' && !(currentPage === 'home' && v2Route?.name === 'register') && (
        <V2BottomNav currentUser={currentUser} active={v2Active} onOpenProfile={() => handlePageChange('profile')} />
      )}

      {/* Registration & Login Modal */}
      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onOpenCatalog={handleOpenCatalog}
        onSuccess={handleUserRegisterSuccess}
        onGoToProfile={() => handlePageChange('profile')}
      />

      {/* Subscription Cancellation Modal */}
      <CancelSubscriptionModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirmCancel={handleConfirmCancelSubscription}
        trialEndDate={currentUser?.trialEndDate}
        user={currentUser}
      />

      {/* Pro Upgrade Modal */}
      <ProUpgradeModal
        isOpen={isProModalOpen}
        onClose={() => {
          setIsProModalOpen(false);
          setProModalReason(null);
        }}
        reasonText={proModalReason}
        currentUser={currentUser}
        onUpdateUser={handleUpdateUser}
        onOpenRegisterModal={() => {
          setIsProModalOpen(false);
          handleStart();
        }}
      />

      {/* PWA In-App Install Prompt Banner & Guide */}
      <PWAInstallPrompt
        suppressOnMobile={shouldSuppressPwaOnMobile}
        onVisibilityChange={setIsPwaBannerVisibleOnMobile}
      />
    </div>
  );
}
