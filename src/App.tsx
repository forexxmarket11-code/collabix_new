import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { RegisterModal } from './components/RegisterModal';
import { WhyCollabixSection } from './components/WhyCollabixSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { Footer } from './components/Footer';
import { CatalogPage } from './components/CatalogPage';
import { BottomNav } from './components/BottomNav';
import { OrdersPage } from './components/OrdersPage';
import { MessagesPage } from './components/MessagesPage';
import { ProfilePage } from './components/ProfilePage';
import { EditProfilePage } from './components/EditProfilePage';
import { ReferralBanner } from './components/ReferralBanner';
import { MoneyBackGuaranteeBanner } from './components/MoneyBackGuaranteeBanner';
import { ReferralPage } from './components/ReferralPage';
import { AgencyBanner } from './components/AgencyBanner';
import { AgencyPage } from './components/AgencyPage';
import { AdminLoginPage } from './components/AdminLoginPage';
import { AdminDashboardPage } from './components/AdminDashboardPage';
import { CreateBriefPage } from './components/CreateBriefPage';
import { TrialReminderBanner } from './components/TrialReminderBanner';
import { CancelSubscriptionModal } from './components/CancelSubscriptionModal';
import { ProUpgradeModal } from './components/ProUpgradeModal';
import { CreatorPublicProfilePage } from './components/CreatorPublicProfilePage';
import { PendingApprovalPage } from './components/PendingApprovalPage';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { PageType, UserSession, BriefData, CatalogCreator, BriefApplication, NotificationItem } from './types';
import {
  onFirebaseAuthReady,
  onAuthUserChanged,
  logoutUser,
  updateSubscriptionStatus,
  markReminderSent,
  subscribeToBriefs,
  createBriefInFirestore,
  applyToBriefInFirestore,
  getOrCreateConversation,
  subscribeToUserNotifications,
  showBrowserPushNotification,
  recordSubscriptionCancellation,
} from './firebase';
import { checkProUserAndProceed, isUserPro } from './utils/subscription';

export default function App() {
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
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

      // Check if logged-in user is restricted (pending approval or rejected)
      const savedUserStr = localStorage.getItem('collabix_user');
      if (savedUserStr) {
        const savedUser: UserSession = JSON.parse(savedUserStr);
        if (savedUser.accountStatus === 'pending' || savedUser.accountStatus === 'rejected') {
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

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('collabix_admin_auth') === 'true';
    } catch {
      return false;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('collabix_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authUid, setAuthUid] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onFirebaseAuthReady((uid) => {
      setAuthUid(uid);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const isUserRestricted = Boolean(
    currentUser && (currentUser.accountStatus === 'pending' || currentUser.accountStatus === 'rejected')
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
        if (userProfile.accountStatus === 'approved') {
          setCurrentPage((prev) => (prev === 'pending-approval' ? 'home' : prev));
        } else if (userProfile.accountStatus === 'pending' || userProfile.accountStatus === 'rejected') {
          setCurrentPage((prev) => (prev === 'edit-profile' ? 'edit-profile' : 'pending-approval'));
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
        if (activeUser && (activeUser.accountStatus === 'pending' || activeUser.accountStatus === 'rejected')) {
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
          target = 'catalog';
        } else if (hash === '#create-brief' || hash === '#brif' || hash === '#brief') {
          if (currentUser?.role !== 'bloger' && !isUserPro(currentUser)) {
            setIsProModalOpen(true);
            target = 'catalog';
          } else {
            target = 'create-brief';
          }
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
            setIsRegisterModalOpen(true);
            return;
          }
        } else if (hash === '#edit-profile' || hash === '#tahrirlash') {
          const saved = localStorage.getItem('collabix_user');
          if (saved) {
            target = 'edit-profile';
          } else {
            setIsRegisterModalOpen(true);
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
    if (isUserRestricted && page !== 'edit-profile' && page !== 'pending-approval') {
      page = 'pending-approval';
    }

    if (page === 'profile' && !currentUser) {
      setIsRegisterModalOpen(true);
      return;
    }

    if (page === 'create-brief') {
      if (currentUser?.role !== 'bloger' && !isUserPro(currentUser)) {
        setIsProModalOpen(true);
        return;
      }
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

  const handleBriefCreated = async (brief: BriefData) => {
    try {
      const savedId = await createBriefInFirestore(brief);
      setUserBriefs((prev) => {
        const nextBrief = { ...brief, id: savedId || brief.id };
        const filtered = prev.filter((item) => item.id !== nextBrief.id);
        return [nextBrief, ...filtered];
      });
    } catch (err) {
      console.error("Firestore ga brif yozishda xatolik:", err);
    }
  };

  const handleApplyToBrief = async (briefId: string, application: BriefApplication) => {
    try {
      await applyToBriefInFirestore(briefId, application);
    } catch (err) {
      console.error("Firestore ga ariza yozishda xatolik:", err);
    }
  };

  const handleSelectBriefFromNotification = (briefId: string) => {
    setTargetBriefIdForOrders(briefId);
    handlePageChange('orders');
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
  };

  const handleAdminLogout = () => {
    try {
      sessionStorage.removeItem('collabix_admin_auth');
    } catch {
      // ignore
    }
    setIsAdminAuthenticated(false);
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
    setIsRegisterModalOpen(true);
  };

  const handleUserRegisterSuccess = (user: UserSession) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('collabix_user', JSON.stringify(user));
    } catch {
      // ignore
    }
    if (user.accountStatus === 'pending' || user.accountStatus === 'rejected') {
      handlePageChange('pending-approval');
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

  // Completely isolated Admin Portal - not shown anywhere in public nav/footer/bottom dock
  if (currentPage === 'admin') {
    return (
      <div className="min-h-screen bg-[#F8FAFD] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex flex-col antialiased selection:bg-indigo-600 selection:text-white transition-colors duration-300">
        {isAdminAuthenticated ? (
          <AdminDashboardPage
            onLogout={handleAdminLogout}
            onGoToSite={handleGoHome}
          />
        ) : (
          <AdminLoginPage
            onLoginSuccess={handleAdminLoginSuccess}
            onGoHome={handleGoHome}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFD] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex flex-col antialiased selection:bg-indigo-600 selection:text-white transition-colors duration-300">
      {/* Top Navigation */}
      <Navbar
        onStartClick={handleStart}
        onCatalogClick={handleOpenCatalog}
        onNavigate={handleNavigate}
        currentPage={currentPage}
        onHomeClick={handleGoHome}
        onCreateBriefClick={handleOpenCreateBrief}
        currentUser={currentUser}
        onLogout={handleLogout}
        onProfileClick={() => handlePageChange(isUserRestricted ? 'edit-profile' : 'profile')}
        onOpenProModal={() => setIsProModalOpen(true)}
        notifications={notifications}
        onSelectBrief={handleSelectBriefFromNotification}
      />

      {/* Main Content Areas with bottom spacing so floating pill dock never overlaps */}
      <main className={`flex-1 ${currentPage === 'messages' ? 'pb-20 sm:pb-22 flex flex-col' : isUserRestricted ? 'pb-12' : 'pb-28 sm:pb-32'}`}>
        {/* If user is restricted (pending approval or rejected), strictly show PendingApprovalPage or EditProfilePage */}
        {isUserRestricted && currentPage !== 'edit-profile' && currentUser && (
          <PendingApprovalPage
            user={currentUser}
            onLogout={handleLogout}
            onEditProfile={handleOpenEditProfile}
            onStatusUpdated={(updated) => handleUpdateUser(updated)}
          />
        )}

        {currentPage === 'edit-profile' && (
          <EditProfilePage
            user={currentUser}
            onSave={(updated) => {
              handleUpdateUser(updated);
              if (isUserRestricted) {
                handlePageChange('pending-approval');
              }
            }}
            onBack={() => handlePageChange(isUserRestricted ? 'pending-approval' : 'profile')}
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
                setIsRegisterModalOpen(true);
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
            <ProfilePage
              user={currentUser}
              onLogout={handleLogout}
              onOpenRegister={handleStart}
              onUpdateUser={handleUpdateUser}
              onNavigateToEdit={handleOpenEditProfile}
              onOpenCancelModal={() => setIsCancelModalOpen(true)}
              onOpenProModal={() => setIsProModalOpen(true)}
            />
          </>
        )}

        {!isUserRestricted && currentPage === 'referral' && (
          <ReferralPage
            onBackToHome={handleGoHome}
            onOpenRegister={handleStart}
          />
        )}

        {!isUserRestricted && currentPage === 'agency' && (
          <AgencyPage onBackToHome={handleGoHome} />
        )}

        {!isUserRestricted && currentPage === 'home' && (
          <>
            {/* Hero Section */}
            <HeroSection
              onStartClick={handleStart}
              onCatalogClick={handleOpenCatalog}
            />

            {/* 100% Pul qaytarish kafolati (Money-Back Guarantee Trust Banner) */}
            <MoneyBackGuaranteeBanner
              onLearnMore={() => {
                handlePageChange('profile');
              }}
            />

            {/* Referral Program Announcement Banner */}
            <ReferralBanner onLearnMore={handleOpenReferral} />

            {/* Marketing Agency Partnership Banner - Vaqtincha yashirilgan */}
            {/* <AgencyBanner onLearnMore={handleOpenAgency} /> */}

            {/* Why Collabix Section (3 Feature Cards) */}
            <WhyCollabixSection onExploreClick={handleOpenCatalog} />

            {/* How It Works Section (3 Steps) */}
            <HowItWorksSection onStartStep1={handleOpenCatalog} />
          </>
        )}
      </main>

      {/* Minimal Footer - strictly hidden on chat (messages), edit-profile, create-brief, or when restricted */}
      {!isUserRestricted && currentPage !== 'messages' && currentPage !== 'create-brief' && currentPage !== 'edit-profile' && (
        <Footer
          onCatalogClick={handleOpenCatalog}
          onNavigate={handleNavigate}
          onReferralClick={handleOpenReferral}
          onAgencyClick={handleOpenAgency}
          onAdminClick={() => handlePageChange('admin')}
          onCreateBriefClick={handleOpenCreateBrief}
        />
      )}

      {/* Bottom Navigation Bar (Floating Pill Capsule Dock - hidden on edit-profile, create-brief, creator-profile, or when restricted) */}
      {!isUserRestricted && currentPage !== 'edit-profile' && currentPage !== 'create-brief' && currentPage !== 'creator-profile' && (
        <BottomNav
          currentPage={currentPage}
          onNavigate={handlePageChange}
          isLoggedIn={!!currentUser}
          currentUser={currentUser}
          onOpenRegister={handleStart}
          unreadNotificationsCount={unreadNotificationsCount}
        />
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
        onClose={() => setIsProModalOpen(false)}
        currentUser={currentUser}
        onUpdateUser={handleUpdateUser}
        onOpenRegisterModal={() => {
          setIsProModalOpen(false);
          setIsRegisterModalOpen(true);
        }}
      />

      {/* PWA In-App Install Prompt Banner & Guide */}
      <PWAInstallPrompt />
    </div>
  );
}
