import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  TrendingUp,
  DollarSign,
  Gift,
  LogOut,
  Sparkles,
  Award,
  ArrowUpRight,
  ExternalLink,
  CheckCircle2,
  Loader2,
  RotateCw,
  Clock,
  UserCheck,
  BarChart3,
  Inbox,
  UserX,
  CreditCard,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  ADMIN_UID,
  isCurrentUserAdmin,
  onFirebaseAuthReady,
  fetchUsersStatistics,
  fetchRevenueStatistics,
  fetchReferralStatistics,
} from '../firebase';
import {
  UsersStatistics,
  RevenueStatistics,
  ReferralStatistics,
} from '../types';
import { AdminUserApprovals } from './AdminUserApprovals';
import { AdminPaymentRequests } from './AdminPaymentRequests';
import { AdminCancellationReasons } from './AdminCancellationReasons';
import { AdminAgencyApplications } from './AdminAgencyApplications';
import { ThemeToggle } from './ThemeToggle';
import { Building2 } from 'lucide-react';

interface AdminDashboardPageProps {
  onLogout: () => void;
  onGoToSite: () => void;
  onUnauthorized?: () => void;
}

export function AdminDashboardPage({ onLogout, onGoToSite, onUnauthorized }: AdminDashboardPageProps) {
  const [activeTab, setActiveTab] = useState<'approvals' | 'payment_requests' | 'reports' | 'cancellations' | 'agency_applications'>('approvals');
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [paymentRequestsCount, setPaymentRequestsCount] = useState<number>(0);
  const [cancellationsCount, setCancellationsCount] = useState<number>(0);
  const [agencyCount, setAgencyCount] = useState<number>(0);
  const [stats, setStats] = useState<UsersStatistics | null>(null);
  const [revenueStats, setRevenueStats] = useState<RevenueStatistics | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStatistics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleUnauthorized = useCallback(() => {
    if (onUnauthorized) {
      onUnauthorized();
    } else {
      onLogout();
    }
  }, [onUnauthorized, onLogout]);

  useEffect(() => {
    const unsub = onFirebaseAuthReady((uid) => {
      if (uid !== ADMIN_UID) {
        handleUnauthorized();
      }
    });
    return () => unsub();
  }, [handleUnauthorized]);

  const loadStats = useCallback(async (isManualRefresh = false) => {
    if (!isCurrentUserAdmin()) {
      handleUnauthorized();
      return;
    }
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      const [userData, revData, refData] = await Promise.all([
        fetchUsersStatistics(),
        fetchRevenueStatistics(),
        fetchReferralStatistics(),
      ]);
      setStats(userData);
      setRevenueStats(revData);
      setReferralStats(refData);
    } catch (err: any) {
      if (err?.code === 'auth/not-admin') {
        handleUnauthorized();
        return;
      }
      console.error("Foydalanuvchilar va hisobotlar statistikasini yuklashda Firestore xatosi:", err);
      setError("Firestore ma'lumotlarini yuklashda xatolik yuz berdi.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0E0E15] text-slate-900 dark:text-white transition-colors duration-200 pb-16">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#12121A]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-heading font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Collabix
                </span>
                <span className="text-[11px] font-heading font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
                  Admin panel
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-body">
                Platforma hisobotlari va statistikasi
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button */}
            <ThemeToggle variant="compact" />

            <button
              type="button"
              onClick={onGoToSite}
              id="btn-admin-view-site"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-heading font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <span>Saytni ochish</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onLogout}
              id="btn-admin-logout"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-heading font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Chiqish</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Navigation Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight">
              {activeTab === 'approvals'
                ? 'Barcha foydalanuvchilar'
                : activeTab === 'payment_requests'
                ? 'Toʻlov soʻrovlari (Pro rejim)'
                : activeTab === 'cancellations'
                ? 'Obunani bekor qilish sabablari'
                : activeTab === 'agency_applications'
                ? 'Agentlik arizalari'
                : 'Platforma umumiy hisoboti'}
            </h1>
            <p className="text-xs sm:text-sm font-body text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {activeTab === 'approvals'
                ? 'Platformada roʻyxatdan oʻtgan barcha bloger va brendlar roʻyxati hamda hisoblarni boshqarish.'
                : activeTab === 'payment_requests'
                ? 'Bank kartasi orqali yuborilgan toʻlov cheklari va screenshotlarini tekshirish hamda Pro rejimni faollashtirish.'
                : activeTab === 'cancellations'
                ? 'Pro rejim obunalarini bekor qilgan foydalanuvchilar, sabablar tahlili va fikr-mulohazalar.'
                : activeTab === 'agency_applications'
                ? 'Marketing agentliklaridan kelgan hamkorlik arizalari, aloqa maʼlumotlari va statuslar.'
                : 'Foydalanuvchilar oʻsishi, obunalar daromadi va tavsiya (referral) koʻrsatkichlari (Faqat koʻrish rejimi).'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-2xl shrink-0 self-start lg:self-auto overflow-x-auto max-w-full no-scrollbar flex-nowrap w-full lg:w-auto touch-pan-x">
            <button
              type="button"
              id="tab-btn-approvals"
              onClick={() => setActiveTab('approvals')}
              className={`px-3.5 py-2 rounded-xl text-xs font-heading font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'approvals'
                  ? 'bg-white dark:bg-[#1A1A24] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Barcha foydalanuvchilar</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-mono font-bold leading-none">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              type="button"
              id="tab-btn-payment-requests"
              onClick={() => setActiveTab('payment_requests')}
              className={`px-3.5 py-2 rounded-xl text-xs font-heading font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'payment_requests'
                  ? 'bg-white dark:bg-[#1A1A24] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Toʻlov soʻrovlari</span>
              {paymentRequestsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-mono font-bold leading-none animate-pulse">
                  {paymentRequestsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              id="tab-btn-reports"
              onClick={() => setActiveTab('reports')}
              className={`px-3.5 py-2 rounded-xl text-xs font-heading font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'reports'
                  ? 'bg-white dark:bg-[#1A1A24] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Umumiy hisobotlar</span>
            </button>

            <button
              type="button"
              id="tab-btn-agency-applications"
              onClick={() => setActiveTab('agency_applications')}
              className={`px-3.5 py-2 rounded-xl text-xs font-heading font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'agency_applications'
                  ? 'bg-white dark:bg-[#1A1A24] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
              <span>Agentlik arizalari</span>
              {agencyCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-mono font-bold leading-none">
                  {agencyCount}
                </span>
              )}
            </button>

            <button
              type="button"
              id="tab-btn-cancellations"
              onClick={() => setActiveTab('cancellations')}
              className={`px-3.5 py-2 rounded-xl text-xs font-heading font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'cancellations'
                  ? 'bg-white dark:bg-[#1A1A24] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <UserX className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>Bekor qilish sabablari</span>
              {cancellationsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold leading-none">
                  {cancellationsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab 1: User Approvals */}
        {activeTab === 'approvals' && (
          <AdminUserApprovals
            onPendingCountChange={setPendingCount}
            onUnauthorized={handleUnauthorized}
          />
        )}

        {/* Tab: Manual Payment Requests */}
        {activeTab === 'payment_requests' && (
          <AdminPaymentRequests
            onCountChange={setPaymentRequestsCount}
            onUnauthorized={handleUnauthorized}
          />
        )}

        {/* Tab 2: General Reports & Statistics */}
        {activeTab === 'reports' && (
          <div className="space-y-8">
            {/* SECTION A: FOYDALANUVCHILAR STATISTIKASI */}
            <section aria-labelledby="heading-users-stats" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 id="heading-users-stats" className="text-base font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>A) Foydalanuvchilar statistikasi</span>
            </h2>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-heading font-medium text-slate-500 dark:text-slate-400">
                Oxirgi yangilanish: {stats?.lastUpdated || 'Bugun'}
              </span>
              <button
                type="button"
                onClick={() => loadStats(true)}
                disabled={isLoading || isRefreshing}
                title="Maʼlumotlarni qayta yuklash"
                id="btn-admin-refresh-stats"
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center justify-center"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Metric Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Users */}
            <div className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-heading font-semibold text-slate-500 dark:text-slate-400">
                    Jami roʻyxatdan oʻtganlar
                  </span>
                  <span className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </span>
                </div>
                {isLoading ? (
                  <div className="flex items-center gap-2 text-slate-400 py-1 text-base font-heading font-semibold">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400" />
                    <span>Yuklanmoqda...</span>
                  </div>
                ) : (
                  <div className="text-3xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {(stats?.totalUsers ?? 0).toLocaleString('uz-UZ')}
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-body text-slate-600 dark:text-slate-400">
                {isLoading ? (
                  <span className="text-slate-400">Yuklanmoqda...</span>
                ) : (
                  <>
                    <span>
                      <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{(stats?.bloggersCount ?? 0).toLocaleString('uz-UZ')}</strong> bloger ({stats?.bloggerPercentage ?? 0}%)
                    </span>
                    <span>
                      <strong className="text-purple-600 dark:text-purple-400 font-bold">{(stats?.brandsCount ?? 0).toLocaleString('uz-UZ')}</strong> brend ({stats?.brandPercentage ?? 0}%)
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Last 30 Days Growth */}
            <div className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-heading font-semibold text-slate-500 dark:text-slate-400">
                    Oxirgi 30 kunda qoʻshilganlar
                  </span>
                  <span className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </span>
                </div>
                {isLoading ? (
                  <div className="flex items-center gap-2 text-slate-400 py-1 text-base font-heading font-semibold">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-400" />
                    <span>Yuklanmoqda...</span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-3xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight">
                      +{(stats?.last30DaysCount ?? 0).toLocaleString('uz-UZ')}
                    </span>
                    {stats && stats.totalUsers > 0 && (
                      <span className="text-xs font-heading font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-0.5">
                        <ArrowUpRight className="w-3 h-3" />
                        +{stats.last30DaysGrowthRate}%
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-body text-slate-500 dark:text-slate-400">
                {isLoading ? 'Yuklanmoqda...' : 'Firestore sana (createdAt) boʻyicha hisoblangan'}
              </div>
            </div>

            {/* Breakdown Mini Card */}
            <div className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-heading font-semibold text-slate-500 dark:text-slate-400">
                    Foydalanuvchilar nisbati
                  </span>
                  <span className="text-xs font-heading font-semibold text-slate-400">
                    100%
                  </span>
                </div>
                {/* Progress bar */}
                {isLoading ? (
                  <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse mb-3" />
                ) : (
                  <div className="h-3 w-full bg-purple-100 dark:bg-purple-950/60 rounded-full overflow-hidden flex mb-3">
                    <div
                      className="bg-indigo-600 h-full rounded-l-full transition-all duration-500"
                      style={{ width: `${stats?.totalUsers ? stats.bloggerPercentage : 50}%` }}
                    />
                    <div
                      className="bg-purple-600 h-full rounded-r-full transition-all duration-500"
                      style={{ width: `${stats?.totalUsers ? stats.brandPercentage : 50}%` }}
                    />
                  </div>
                )}
              </div>
              <div className="space-y-1 text-xs font-body">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
                    Kreator va blogerlar
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {isLoading ? '...' : (stats?.bloggersCount ?? 0).toLocaleString('uz-UZ')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-600 inline-block" />
                    Brend va tadbirkorlar
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {isLoading ? '...' : (stats?.brandsCount ?? 0).toLocaleString('uz-UZ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Completion Card (To'liq to'ldirilgan profillar soni & O'rtacha foiz) */}
            <div className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-heading font-semibold text-slate-500 dark:text-slate-400">
                    Toʻliq toʻldirilgan profillar
                  </span>
                  <span className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                </div>
                {isLoading ? (
                  <div className="flex items-center gap-2 text-slate-400 py-1 text-base font-heading font-semibold">
                    <Loader2 className="w-4 h-4 animate-spin text-teal-600 dark:text-teal-400" />
                    <span>Yuklanmoqda...</span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {(stats?.completedProfilesCount ?? 0).toLocaleString('uz-UZ')}
                    </span>
                    <span className="text-xs font-heading font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800">
                      100% toʻliq
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-body">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-1.5">
                  <span>Oʻrtacha toʻldirilganlik:</span>
                  <strong className="text-indigo-600 dark:text-indigo-400 font-bold">
                    {isLoading ? '...' : `${stats?.averageCompletionPercentage ?? 0}%`}
                  </strong>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-teal-500 rounded-full transition-all duration-500"
                    style={{ width: `${stats?.averageCompletionPercentage ?? 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* User Growth Chart */}
          <div className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-heading font-bold text-slate-900 dark:text-white">
                  Haftalik foydalanuvchilar oʻsish grafigi
                </h3>
                <p className="text-xs font-body text-slate-500 dark:text-slate-400">
                  Soʻnggi 4 haftada bloger va brendlar boʻyicha yangi qoʻshilganlar soni
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-heading font-medium">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <span className="w-3 h-3 rounded bg-indigo-600 inline-block" />
                  Blogerlar
                </span>
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <span className="w-3 h-3 rounded bg-purple-500 inline-block" />
                  Brendlar
                </span>
              </div>
            </div>

            <div className="h-64 sm:h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={
                    stats?.weeklyGrowth && stats.weeklyGrowth.length > 0
                      ? stats.weeklyGrowth
                      : [
                          { name: '1-hafta', blogger: 0, brand: 0, total: 0 },
                          { name: '2-hafta', blogger: 0, brand: 0, total: 0 },
                          { name: '3-hafta', blogger: 0, brand: 0, total: 0 },
                          { name: '4-hafta', blogger: 0, brand: 0, total: 0 },
                        ]
                  }
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 12 }} stroke="#CBD5E1" />
                  <YAxis tick={{ fill: '#64748B', fontSize: 12 }} stroke="#CBD5E1" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      padding: '8px 12px',
                    }}
                    formatter={(value: number, name: string) => [
                      `${value} ta`,
                      name === 'blogger' ? 'Blogerlar' : 'Brendlar',
                    ]}
                  />
                  <Bar dataKey="blogger" name="blogger" fill="#4F46E5" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="brand" name="brand" fill="#A855F7" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* SECTION B: DAROMAD HISOBOTI */}
        <section aria-labelledby="heading-revenue-stats" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 id="heading-revenue-stats" className="text-base font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>B) Daromad hisoboti (obunalardan)</span>
            </h2>
            <span className="text-xs font-heading font-medium text-slate-500 dark:text-slate-400">
              Valyuta: Oʻzbekiston soʻmi (UZS)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Total Revenue */}
            <div className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-heading font-semibold text-slate-500 dark:text-slate-400">
                  Jami tushgan daromad
                </span>
                <span className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <div className="text-3xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight">
                {(revenueStats?.totalRevenue ?? 0).toLocaleString('uz-UZ')}{' '}
                <span className="text-base font-semibold text-slate-500 dark:text-slate-400">soʻm</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-body text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Platformadagi barcha obuna tariflaridan</span>
                <span className="text-slate-700 dark:text-slate-300 font-semibold">
                  {revenueStats && revenueStats.totalRevenue > 0 ? '100% obunalar' : '0 ta toʻlov'}
                </span>
              </div>
            </div>

            {/* This Month's Revenue */}
            <div className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-heading font-semibold text-slate-500 dark:text-slate-400">
                  Shu oydagi daromad
                </span>
                {revenueStats && revenueStats.growthRate > 0 && (
                  <span className="text-xs font-heading font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-0.5">
                    <ArrowUpRight className="w-3 h-3" />
                    +{revenueStats.growthRate}%
                  </span>
                )}
              </div>
              <div className="text-3xl font-heading font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
                {(revenueStats?.thisMonthRevenue ?? 0).toLocaleString('uz-UZ')}{' '}
                <span className="text-base font-semibold text-slate-500 dark:text-slate-400">soʻm</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-body text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Oʻrtacha oylik daromad:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {(revenueStats?.averageMonthlyRevenue ?? 0).toLocaleString('uz-UZ')} soʻm
                </span>
              </div>
            </div>
          </div>

          {/* Monthly Revenue Chart */}
          <div className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-heading font-bold text-slate-900 dark:text-white">
                  Oylar boʻyicha daromad grafigi
                </h3>
                <p className="text-xs font-body text-slate-500 dark:text-slate-400">
                  Oxirgi 6 oy mobaynida tushgan oylik obuna toʻlovlari miqdori (million soʻmda)
                </p>
              </div>
              <div className="text-xs font-heading font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800 px-3 py-1 rounded-lg">
                Jami: 6 oylik dinamika
              </div>
            </div>

            <div className="h-64 sm:h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={
                    revenueStats?.monthlyRevenueData && revenueStats.monthlyRevenueData.length > 0
                      ? revenueStats.monthlyRevenueData
                      : [
                          { month: 'Aprel', amount: 0, formatted: '0 mln' },
                          { month: 'May', amount: 0, formatted: '0 mln' },
                          { month: 'Iyun', amount: 0, formatted: '0 mln' },
                          { month: 'Iyul', amount: 0, formatted: '0 mln' },
                          { month: 'Avgust', amount: 0, formatted: '0 mln' },
                          { month: 'Sentyabr', amount: 0, formatted: '0 mln' },
                        ]
                  }
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 12 }} stroke="#CBD5E1" />
                  <YAxis
                    tick={{ fill: '#64748B', fontSize: 12 }}
                    stroke="#CBD5E1"
                    tickFormatter={(val) => `${val}M`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      padding: '8px 12px',
                    }}
                    formatter={(value: number) => [`${value} million soʻm`, 'Daromad']}
                  />
                  <Bar
                    dataKey="amount"
                    fill="#10B981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* SECTION C: TAVSIYALAR (REFERRAL) STATISTIKASI */}
        <section aria-labelledby="heading-referral-stats" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 id="heading-referral-stats" className="text-base font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Gift className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>C) Tavsiyalar (referral) statistikasi</span>
            </h2>
            <span className="text-xs font-heading font-medium text-slate-500 dark:text-slate-400">
              30 000 soʻmlik taklif dasturi
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Total referral users */}
            <div className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-heading font-semibold text-slate-500 dark:text-slate-400">
                  Tavsiya orqali qoʻshilganlar
                </span>
                <span className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Gift className="w-4 h-4" />
                </span>
              </div>
              <div className="text-3xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight">
                {(referralStats?.totalReferralUsers ?? 0).toLocaleString('uz-UZ')}{' '}
                <span className="text-base font-semibold text-slate-500 dark:text-slate-400">ta</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-body text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Jami foydalanuvchilarning ulushi:</span>
                <span className="text-purple-700 dark:text-purple-400 font-bold">
                  {referralStats?.referralPercentage ?? 0}%
                </span>
              </div>
            </div>

            {/* Total rewards paid */}
            <div className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-heading font-semibold text-slate-500 dark:text-slate-400">
                  Toʻlangan jami mukofot summasi
                </span>
                <span className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </span>
              </div>
              <div className="text-3xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight">
                {(referralStats?.totalRewardsPaid ?? 0).toLocaleString('uz-UZ')}{' '}
                <span className="text-base font-semibold text-slate-500 dark:text-slate-400">soʻm</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-body text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Kutilayotgan toʻlovlar:</span>
                <span className="text-amber-700 dark:text-amber-400 font-semibold">
                  {(referralStats?.pendingRewards ?? 0).toLocaleString('uz-UZ')} soʻm
                </span>
              </div>
            </div>
          </div>

          {/* Top Referrers Table */}
          <div className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
            <div className="mb-4">
              <h3 className="text-sm font-heading font-bold text-slate-900 dark:text-white">
                Eng koʻp tavsiya qilgan foydalanuvchilar roʻyxati
              </h3>
              <p className="text-xs font-body text-slate-500 dark:text-slate-400">
                Collabix referral dasturi orqali eng koʻp doʻstlarini taklif qilgan faol blogerlar
              </p>
            </div>

            {referralStats?.topReferrers && referralStats.topReferrers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-heading font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-3">Oʻrin</th>
                      <th className="py-3 px-3">Foydalanuvchi</th>
                      <th className="py-3 px-3 text-center">Tavsiyalar soni</th>
                      <th className="py-3 px-3 text-right">Mukofot summasi</th>
                      <th className="py-3 px-3 text-right">Holat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-body text-slate-700 dark:text-slate-300">
                    {referralStats.topReferrers.map((ref, idx) => (
                      <tr key={ref.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-3 font-heading font-bold">
                          {idx === 0 ? (
                            <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 inline-flex items-center justify-center text-[10px]">
                              1
                            </span>
                          ) : idx === 1 ? (
                            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 inline-flex items-center justify-center text-[10px]">
                              2
                            </span>
                          ) : idx === 2 ? (
                            <span className="w-5 h-5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 inline-flex items-center justify-center text-[10px]">
                              3
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 pl-1.5">{idx + 1}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="font-heading font-semibold text-slate-900 dark:text-white block">
                            {ref.name}
                          </span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                            {ref.handle}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-heading font-bold text-xs border border-indigo-100 dark:border-indigo-800">
                            {ref.referralCount} ta
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right font-heading font-bold text-slate-900 dark:text-white">
                          {ref.rewardAmount}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-heading font-semibold text-[11px] border border-emerald-100 dark:border-emerald-800">
                            {ref.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-3">
                  <Gift className="w-6 h-6" />
                </div>
                <h4 className="font-heading font-bold text-sm text-slate-800 dark:text-white mb-1">
                  Hozircha tavsiyalar boʻyicha maʼlumotlar yoʻq
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Foydalanuvchilar oʻz referral havolalari orqali yangi aʼzolarni taklif qilganda roʻyxat shu yerda shakllanadi.
                </p>
              </div>
            )}
          </div>
        </section>
          </div>
        )}

        {/* Tab 3: Agency Applications & Leads */}
        {activeTab === 'agency_applications' && (
          <AdminAgencyApplications
            onCountChange={setAgencyCount}
            onUnauthorized={handleUnauthorized}
          />
        )}

        {/* Tab 4: Cancellation Reasons & Insights */}
        {activeTab === 'cancellations' && (
          <AdminCancellationReasons onCountChange={setCancellationsCount} />
        )}
      </div>
    </div>
  );
}
