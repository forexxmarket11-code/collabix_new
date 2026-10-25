import React, { useState, useEffect } from 'react';
import {
  Users,
  Check,
  X,
  Eye,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Search,
  Ban,
  MapPin,
  Instagram,
  Youtube,
  Send,
  Video,
  Loader2,
  Gift,
  Crown,
} from 'lucide-react';
import { UserSession } from '../types';
import {
  subscribeToUsersForAdmin,
  updateUserAccountStatus,
  isCurrentUserAdmin,
  calculateProfileCompletion,
  giftProAdmin,
} from '../firebase';
import { getBloggerCatalogReadiness, isUserPro } from '../utils/subscription';

interface AdminUserApprovalsProps {
  catalogProOnly?: boolean;
  onPendingCountChange?: (count: number) => void;
  onUnauthorized?: () => void;
}

export const AdminUserApprovals: React.FC<AdminUserApprovalsProps> = ({
  catalogProOnly = true,
  onPendingCountChange,
  onUnauthorized,
}) => {
  const [users, setUsers] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected user for inspection modal
  const [selectedUser, setSelectedUser] = useState<UserSession | null>(null);

  // Block (rejected) modal state
  const [rejectingUser, setRejectingUser] = useState<UserSession | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Pro sovg'a qilish oynasi
  const [giftingUser, setGiftingUser] = useState<UserSession | null>(null);
  const [giftDays, setGiftDays] = useState<number>(30);
  const [isGifting, setIsGifting] = useState(false);

  const handleConfirmGift = async () => {
    if (!giftingUser?.uid || isGifting) return;
    if (!isCurrentUserAdmin()) {
      onUnauthorized?.();
      return;
    }
    setIsGifting(true);
    try {
      const { endMs } = await giftProAdmin(giftingUser.uid, giftDays);
      const endText = new Date(endMs).toLocaleDateString('ru-RU');
      showToast(`${giftingUser.name} ga ${giftDays} kunlik Pro sovgʻa qilindi (${endText} gacha)`);
      if (selectedUser?.uid === giftingUser.uid) {
        setSelectedUser({
          ...selectedUser,
          subscriptionStatus: 'active',
          trialEndDate: new Date(endMs).toISOString(),
          proExpiresAtMillis: endMs,
        });
      }
      setGiftingUser(null);
    } catch (err: any) {
      if (err?.code === 'auth/not-admin') {
        onUnauthorized?.();
        return;
      }
      console.error('Pro sovgʻa qilishda xatolik:', err);
      showToast('Pro sovgʻa qilib boʻlmadi. Qayta urinib koʻring', 'error');
    } finally {
      setIsGifting(false);
    }
  };

  // Notification toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    if (!isCurrentUserAdmin()) {
      onUnauthorized?.();
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeToUsersForAdmin((fetchedUsers) => {
      setUsers(fetchedUsers);
      setLoading(false);

      if (onPendingCountChange) {
        onPendingCountChange(fetchedUsers.length);
      }
    });

    return () => unsubscribe();
  }, [onPendingCountChange, onUnauthorized]);

  const handleUnblock = async (user: UserSession) => {
    if (!isCurrentUserAdmin()) {
      onUnauthorized?.();
      return;
    }
    if (!user.uid) return;
    setIsProcessing(user.uid);
    try {
      await updateUserAccountStatus(user.uid, 'approved');
      showToast(`${user.name} blokdan chiqarildi!`);
      if (selectedUser?.uid === user.uid) {
        setSelectedUser({ ...selectedUser, accountStatus: 'approved', rejectionReason: '' });
      }
    } catch (err: any) {
      if (err?.code === 'auth/not-admin') {
        onUnauthorized?.();
        return;
      }
      console.error('Blokdan chiqarishda xatolik:', err);
      showToast('Xatolik yuz berdi. Iltimos, qayta urinib koʻring', 'error');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleOpenBlockModal = (user: UserSession) => {
    if (!isCurrentUserAdmin()) {
      onUnauthorized?.();
      return;
    }
    setRejectingUser(user);
    setRejectReason(user.rejectionReason || '');
  };

  const handleConfirmBlock = async () => {
    if (!isCurrentUserAdmin()) {
      onUnauthorized?.();
      return;
    }
    if (!rejectingUser?.uid) return;
    setIsProcessing(rejectingUser.uid);
    try {
      await updateUserAccountStatus(rejectingUser.uid, 'rejected', rejectReason);
      showToast(`${rejectingUser.name} hisobi bloklandi`, 'success');
      if (selectedUser?.uid === rejectingUser.uid) {
        setSelectedUser({ ...selectedUser, accountStatus: 'rejected', rejectionReason: rejectReason });
      }
      setRejectingUser(null);
      setRejectReason('');
    } catch (err: any) {
      if (err?.code === 'auth/not-admin') {
        onUnauthorized?.();
        return;
      }
      console.error('Bloklashda xatolik:', err);
      showToast('Xatolik yuz berdi. Iltimos, qayta urinib koʻring', 'error');
    } finally {
      setIsProcessing(null);
    }
  };

  // Filtered users: only accountStatus === 'rejected' is blocked; all others ('approved', 'pending', undefined) are active
  const filteredUsers = users.filter((u) => {
    const isBlocked = u.accountStatus === 'rejected';
    if (filterStatus === 'active' && isBlocked) return false;
    if (filterStatus === 'rejected' && !isBlocked) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = u.name?.toLowerCase().includes(q);
      const matchEmail = u.email?.toLowerCase().includes(q);
      const matchContact = u.contact?.toLowerCase().includes(q);
      const matchCity = u.city?.toLowerCase().includes(q);
      const matchBio = u.bio?.toLowerCase().includes(q);
      return matchName || matchEmail || matchContact || matchCity || matchBio;
    }

    return true;
  });

  const activeCount = users.filter((u) => u.accountStatus !== 'rejected').length;
  const rejectedCount = users.filter((u) => u.accountStatus === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 inset-x-4 sm:left-auto sm:right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-5 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : 'bg-rose-900 text-white border-rose-700'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="break-words">{toastMessage.text}</span>
        </div>
      )}

      {/* Header and Controls */}
      <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-2xs">
                <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Jami {users.length} ta foydalanuvchi</span>
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
              Barcha foydalanuvchilar
            </h2>

            <p className="text-xs text-slate-500 dark:text-slate-400 font-body leading-relaxed max-w-xl">
              Platformada roʻyxatdan oʻtgan barcha bloger va brendlar roʻyxati. Foydalanuvchi maʼlumotlarini koʻrishingiz yoki kerak boʻlganda hisobni bloklashingiz mumkin.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ism, email, telefon yoki shahar boʻyicha..."
              className="w-full min-h-[48px] pl-9 pr-4 py-2.5 text-base sm:text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50/70 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar flex-nowrap w-full touch-pan-x">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl font-heading font-semibold transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Barchasi ({users.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('active')}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl font-heading font-semibold transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
              filterStatus === 'active'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Faollar ({activeCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('rejected')}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl font-heading font-semibold transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
              filterStatus === 'rejected'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Bloklanganlar ({rejectedCount})</span>
          </button>
        </div>
      </div>

      {/* Users List Table */}
      <div className="bg-white dark:bg-[#1A1A24] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center gap-2 text-xs">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
            <span>Foydalanuvchilar yuklanmoqda...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-slate-500 dark:text-slate-400 px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400 dark:text-slate-500">
              <Users className="w-6 h-6" />
            </div>
            <p className="font-heading font-bold text-sm text-slate-800 dark:text-slate-200">
              Tanlangan filtr boʻyicha foydalanuvchilar topilmadi
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto font-body">
              Yangi foydalanuvchilar roʻyxatdan oʻtganda ular avtomatik shu roʻyxatda koʻrinadi.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-heading font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Foydalanuvchi</th>
                  <th className="py-3.5 px-4">Turi</th>
                  <th className="py-3.5 px-4">Roʻyxatdan oʻtgan</th>
                  <th className="py-3.5 px-4">Profil maʼlumotlari</th>
                  <th className="py-3.5 px-4">Holati</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((u) => {
                  const isBlocked = u.accountStatus === 'rejected';
                  const isBlogger = u.role !== 'brend';
                  const bloggerReadiness = isBlogger
                    ? getBloggerCatalogReadiness(u, catalogProOnly)
                    : null;
                  const completionPercent =
                    typeof u.profileCompletion === 'number'
                      ? u.profileCompletion
                      : calculateProfileCompletion(u);

                  return (
                    <tr
                      key={u.uid}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      onClick={() => setSelectedUser(u)}
                    >
                      {/* User Info */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          {u.avatar ? (
                            <img
                              src={u.avatar}
                              alt={u?.name || 'Foydalanuvchi'}
                              loading="lazy"
                              decoding="async"
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center border border-indigo-100 dark:border-indigo-800 shrink-0 text-sm">
                              {u?.name ? u.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-heading font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                                {u.name || 'Ismsiz foydalanuvchi'}
                              </p>
                              {isBlogger && bloggerReadiness && (
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-heading font-bold shrink-0 ${
                                    bloggerReadiness.adminStatus === 'in_catalog'
                                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                      : bloggerReadiness.adminStatus === 'no_pro'
                                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                                      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                  }`}
                                >
                                  {bloggerReadiness.adminStatus === 'in_catalog'
                                    ? 'Katalogda ✅'
                                    : bloggerReadiness.adminStatus === 'no_pro'
                                    ? 'Pro yoʻq 💳'
                                    : 'Toʻliq emas ⚠️'}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {u.contact || u.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            u.role === 'bloger'
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800'
                              : 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800'
                          }`}
                        >
                          {u.role === 'bloger' ? 'Bloger' : 'Brend'}
                        </span>
                      </td>

                      {/* Registered Date */}
                      <td className="py-4 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 text-[11px]">
                        {u.registeredAt || 'Yaqinda'}
                      </td>

                      {/* Profile overview */}
                      <td className="py-4 px-4 max-w-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-[11px]">
                            {u.city && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span>{u.city}</span>
                              </span>
                            )}
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span className="font-medium text-indigo-600 dark:text-indigo-400">
                              {completionPercent}% toʻldirilgan
                            </span>
                          </div>
                          {u.bio && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 italic">
                              "{u.bio}"
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Account Status Badge */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {isBlocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            <XCircle className="w-3 h-3" />
                            <span>Bloklangan</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Faol</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                        <div
                          className="inline-flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedUser(u)}
                            className="min-w-[44px] min-h-[44px] p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer inline-flex items-center justify-center"
                            title="Batafsil maʼlumotlarni koʻrish"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {isBlocked ? (
                            <button
                              type="button"
                              onClick={() => handleUnblock(u)}
                              disabled={isProcessing === u.uid}
                              className="min-h-[44px] px-3.5 py-2 rounded-xl font-heading font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs disabled:opacity-50"
                            >
                              {isProcessing === u.uid ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              <span>Blokdan chiqarish</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenBlockModal(u)}
                              disabled={isProcessing === u.uid}
                              className="min-h-[44px] px-3.5 py-2 rounded-xl font-heading font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 disabled:opacity-50"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Bloklash</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Full Profile Inspection Modal */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="relative w-full max-w-xl max-h-[94dvh] sm:max-h-[90vh] flex flex-col bg-white dark:bg-[#1A1A24] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky Header */}
            <div className="px-5 sm:px-8 pt-5 sm:pt-7 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                {selectedUser.avatar ? (
                  <img
                    src={selectedUser.avatar}
                    alt={selectedUser?.name || 'Foydalanuvchi'}
                    loading="lazy"
                    decoding="async"
                    className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-2xl object-cover border-2 border-indigo-100 dark:border-indigo-900/60"
                  />
                ) : (
                  <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-2xl flex items-center justify-center border border-indigo-100 dark:border-indigo-800">
                    {selectedUser?.name ? selectedUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-heading font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white break-words">
                      {selectedUser?.name || 'Foydalanuvchi'}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                        selectedUser.role === 'bloger'
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800'
                          : 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800'
                      }`}
                    >
                      {selectedUser.role === 'bloger' ? 'Bloger' : 'Brend'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-all">
                    {selectedUser.contact || selectedUser.email}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    Roʻyxatdan oʻtgan sana: {selectedUser.registeredAt || 'Yaqinda'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                aria-label="Yopish"
                className="w-11 h-11 min-w-[44px] min-h-[44px] shrink-0 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-8 py-5 space-y-4 text-xs">
              {/* Current Status Indicator */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Hisob holati:</span>
                  {selectedUser.accountStatus === 'rejected' ? (
                    <span className="font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded-md">
                      Bloklangan
                    </span>
                  ) : (
                    <span className="font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                      Faol
                    </span>
                  )}
                  {selectedUser.role !== 'brend' && (() => {
                    const r = getBloggerCatalogReadiness(selectedUser, catalogProOnly);
                    return (
                      <span
                        className={`font-bold px-2 py-0.5 rounded-md ${
                          r.adminStatus === 'in_catalog'
                            ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                            : r.adminStatus === 'no_pro'
                            ? 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300'
                            : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        {r.adminStatus === 'in_catalog'
                          ? 'Katalogda ✅'
                          : r.adminStatus === 'no_pro'
                          ? 'Pro yoʻq 💳'
                          : 'Toʻliq emas ⚠️'}
                      </span>
                    );
                  })()}
                </div>
                {isUserPro(selectedUser) && (
                  <span className="inline-flex items-center gap-1 font-bold text-purple-800 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 px-2 py-0.5 rounded-md text-xs">
                    <Crown className="w-3.5 h-3.5" />
                    Pro{selectedUser.trialEndDate ? `: ${new Date(selectedUser.trialEndDate).toLocaleDateString('ru-RU')} gacha` : ''}
                  </span>
                )}
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {typeof selectedUser.profileCompletion === 'number'
                    ? selectedUser.profileCompletion
                    : calculateProfileCompletion(selectedUser)}% toʻldirilgan
                </span>
              </div>

              {/* Block Reason if any */}
              {selectedUser.accountStatus === 'rejected' && selectedUser.rejectionReason && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-900 dark:text-rose-200 space-y-1">
                  <span className="font-bold flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                    Bloklash sababi:
                  </span>
                  <p className="text-rose-800 dark:text-rose-300 leading-relaxed pl-5 break-words">
                    {selectedUser.rejectionReason}
                  </p>
                </div>
              )}

              {/* Bio */}
              <div>
                <h4 className="font-heading font-bold mb-1 text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Oʻzi haqida (Bio)
                </h4>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-[15px] sm:text-xs text-slate-800 dark:text-slate-200 leading-relaxed break-words">
                  {selectedUser.bio || 'Bio kiritilmagan'}
                </div>
              </div>

              {/* Location & Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Shahar:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedUser.city || 'Belgilanmagan'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Jinsi:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedUser.gender ? (selectedUser.gender === 'erkak' ? 'Erkak' : 'Ayol') : 'Belgilanmagan'}
                  </span>
                </div>
              </div>

              {/* Categories */}
              {selectedUser.categories && selectedUser.categories.length > 0 && (
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block mb-1.5 uppercase tracking-wider text-[11px] font-bold">
                    Kategoriyalar:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedUser.categories.map((c) => (
                      <span
                        key={c}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-medium"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Links */}
              <div>
                <span className="text-slate-400 dark:text-slate-500 block mb-1.5 uppercase tracking-wider text-[11px] font-bold">
                  Ijtimoiy tarmoqlar:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-2 min-w-0">
                    <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300 shrink-0">
                      <Instagram className="w-4 h-4 text-pink-500" />
                      <span>Instagram</span>
                    </span>
                    <span className="font-mono text-slate-600 dark:text-slate-400 font-semibold truncate">
                      {selectedUser.socialLinks?.instagram || selectedUser.instagramHandle || 'Kiritilmagan'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-2 min-w-0">
                    <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300 shrink-0">
                      <Video className="w-4 h-4 text-slate-900 dark:text-white" />
                      <span>TikTok</span>
                    </span>
                    <span className="font-mono text-slate-600 dark:text-slate-400 font-semibold truncate">
                      {selectedUser.socialLinks?.tiktok || 'Kiritilmagan'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-2 min-w-0">
                    <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300 shrink-0">
                      <Youtube className="w-4 h-4 text-red-500" />
                      <span>YouTube</span>
                    </span>
                    <span className="font-mono text-slate-600 dark:text-slate-400 font-semibold truncate">
                      {selectedUser.socialLinks?.youtube || 'Kiritilmagan'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-2 min-w-0">
                    <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300 shrink-0">
                      <Send className="w-4 h-4 text-blue-500" />
                      <span>Telegram</span>
                    </span>
                    <span className="font-mono text-slate-600 dark:text-slate-400 font-semibold truncate">
                      {selectedUser.socialLinks?.telegram || 'Kiritilmagan'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Price Range */}
              {selectedUser.priceRange && (selectedUser.priceRange.min || selectedUser.priceRange.max) && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-slate-500 dark:text-slate-400">Narx oraligʻi:</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white">
                    {selectedUser.priceRange.min || '0'} – {selectedUser.priceRange.max || '0'} soʻm
                  </span>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="px-5 sm:px-8 pt-3.5 pb-[max(16px,calc(env(safe-area-inset-bottom,0px)+12px))] sm:pb-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-end gap-2 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="min-h-[48px] px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-heading font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Yopish
              </button>

              {selectedUser.accountStatus !== 'rejected' && (
                <button
                  type="button"
                  onClick={() => {
                    setGiftDays(30);
                    setGiftingUser(selectedUser);
                  }}
                  className="min-h-[48px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-heading font-bold text-xs sm:text-sm shadow-md shadow-purple-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Gift className="w-4 h-4" />
                  <span>{isUserPro(selectedUser) ? 'Pro muddatini uzaytirish' : 'Pro sovgʻa qilish'}</span>
                </button>
              )}

              {selectedUser.accountStatus === 'rejected' ? (
                <button
                  type="button"
                  onClick={() => handleUnblock(selectedUser)}
                  disabled={isProcessing === selectedUser.uid}
                  className="min-h-[48px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isProcessing === selectedUser.uid ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>Blokdan chiqarish</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleOpenBlockModal(selectedUser)}
                  className="min-h-[48px] px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-heading font-bold text-xs sm:text-sm border border-rose-200 dark:border-rose-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Ban className="w-4 h-4" />
                  <span>Bloklash</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Block User Dialog */}
      {rejectingUser && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setRejectingUser(null)}
        >
          <div
            className="w-full max-w-md max-h-[92dvh] flex flex-col bg-white dark:bg-[#1A1A24] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 sm:px-7 pt-5 sm:pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 min-w-0">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center">
                  <Ban className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white">
                    Foydalanuvchini bloklash
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {rejectingUser.name} hisobini cheklash sababini kiriting
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setRejectingUser(null)}
                aria-label="Yopish"
                className="w-11 h-11 min-w-[44px] min-h-[44px] shrink-0 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              onFocusCapture={(e) => {
                const target = e.target as HTMLElement;
                if (target && target.tagName === 'TEXTAREA') {
                  setTimeout(() => {
                    target.scrollIntoView({ block: 'center', behavior: 'smooth' });
                  }, 250);
                }
              }}
              className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-7 py-5"
            >
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Bloklash sababi (ixtiyoriy, foydalanuvchiga koʻrsatiladi):
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Masalan: Platforma qoidalariga zid faoliyat yoki notoʻgʻri maʼlumotlar..."
                rows={4}
                className="w-full p-3.5 text-base sm:text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-slate-800 dark:text-slate-200 bg-slate-50/70 dark:bg-slate-800"
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 leading-relaxed">
                Bloklangan foydalanuvchi tizimga kira olmaydi; istalgan vaqtda hisobni blokdan chiqarishingiz mumkin.
              </p>
            </div>

            <div className="px-5 sm:px-7 pt-3.5 pb-[max(16px,calc(env(safe-area-inset-bottom,0px)+12px))] sm:pb-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setRejectingUser(null)}
                className="min-h-[48px] px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-heading font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Bekor qilish
              </button>

              <button
                type="button"
                onClick={handleConfirmBlock}
                disabled={isProcessing === rejectingUser.uid}
                className="min-h-[48px] px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-heading font-bold text-xs sm:text-sm shadow-md shadow-rose-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isProcessing === rejectingUser.uid ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Ban className="w-4 h-4" />
                )}
                <span>Bloklash</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL 3: Pro sovg'a qilish */}
      {giftingUser && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => !isGifting && setGiftingUser(null)}
        >
          <div
            className="w-full max-w-md max-h-[92dvh] flex flex-col bg-white dark:bg-[#1A1A24] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 sm:px-7 pt-5 sm:pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center">
                  <Gift className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white">Pro sovgʻa qilish</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{giftingUser.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGiftingUser(null)}
                disabled={isGifting}
                aria-label="Yopish"
                className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 sm:px-7 py-5 space-y-4">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Necha kunga?</div>
              <div className="grid grid-cols-4 gap-2">
                {[7, 30, 90, 365].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setGiftDays(d)}
                    className={`min-h-[48px] rounded-xl text-sm font-heading font-bold border cursor-pointer transition-colors ${
                      giftDays === d
                        ? 'bg-purple-600 border-purple-600 text-white'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {d === 365 ? '1 yil' : `${d} kun`}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {isUserPro(giftingUser)
                  ? 'Foydalanuvchida Pro allaqachon bor — muddat hozirgi tugash sanasidan uzaytiriladi.'
                  : 'Pro darhol yoqiladi. Foydalanuvchiga bildirishnoma boradi.'}{' '}
                Sovgʻa toʻlov hisobotiga kirmaydi va referal mukofotini bermaydi.
              </p>
            </div>

            <div className="px-5 sm:px-7 pt-3.5 pb-[max(16px,calc(env(safe-area-inset-bottom,0px)+12px))] sm:pb-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setGiftingUser(null)}
                disabled={isGifting}
                className="min-h-[48px] px-4 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-heading font-semibold text-sm cursor-pointer disabled:opacity-50"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleConfirmGift}
                disabled={isGifting}
                className="min-h-[48px] px-5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-heading font-bold text-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {isGifting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
                <span>{giftDays === 365 ? '1 yil' : `${giftDays} kun`} sovgʻa qilish</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
