import React, { useState, useEffect } from 'react';
import {
  Users,
  Check,
  X,
  Eye,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  ShieldCheck,
  MapPin,
  Mail,
  Phone,
  Instagram,
  Youtube,
  Send,
  Video,
  ExternalLink,
  Loader2,
  Calendar,
  DollarSign,
  Tag,
  Sparkles,
} from 'lucide-react';
import { UserSession, AccountStatus } from '../types';
import { subscribeToUsersForAdmin, updateUserAccountStatus } from '../firebase';

interface AdminUserApprovalsProps {
  onPendingCountChange?: (count: number) => void;
}

export const AdminUserApprovals: React.FC<AdminUserApprovalsProps> = ({
  onPendingCountChange,
}) => {
  const [users, setUsers] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected user for inspection modal
  const [selectedUser, setSelectedUser] = useState<UserSession | null>(null);

  // Reject modal state
  const [rejectingUser, setRejectingUser] = useState<UserSession | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Notification toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToUsersForAdmin((fetchedUsers) => {
      setUsers(fetchedUsers);
      setLoading(false);
      
      const pendingCount = fetchedUsers.filter((u) => u.accountStatus === 'pending').length;
      if (onPendingCountChange) {
        onPendingCountChange(pendingCount);
      }
    });

    return () => unsubscribe();
  }, [onPendingCountChange]);

  const handleApprove = async (user: UserSession) => {
    if (!user.uid) return;
    setIsProcessing(user.uid);
    try {
      await updateUserAccountStatus(user.uid, 'approved');
      showToast(`${user.name} arizasi muvaffaqiyatli tasdiqlandi!`);
      if (selectedUser?.uid === user.uid) {
        setSelectedUser({ ...selectedUser, accountStatus: 'approved', rejectionReason: '' });
      }
    } catch (err) {
      console.error('Tasdiqlashda xatolik:', err);
      showToast('Xatolik yuz berdi. Iltimos qayta urinib koʻring', 'error');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleOpenRejectModal = (user: UserSession) => {
    setRejectingUser(user);
    setRejectReason(user.rejectionReason || '');
  };

  const handleConfirmReject = async () => {
    if (!rejectingUser?.uid) return;
    setIsProcessing(rejectingUser.uid);
    try {
      await updateUserAccountStatus(rejectingUser.uid, 'rejected', rejectReason);
      showToast(`${rejectingUser.name} arizasi rad etildi`, 'success');
      if (selectedUser?.uid === rejectingUser.uid) {
        setSelectedUser({ ...selectedUser, accountStatus: 'rejected', rejectionReason: rejectReason });
      }
      setRejectingUser(null);
      setRejectReason('');
    } catch (err) {
      console.error('Rad etishda xatolik:', err);
      showToast('Xatolik yuz berdi. Iltimos qayta urinib koʻring', 'error');
    } finally {
      setIsProcessing(null);
    }
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    // Status filter
    if (filterStatus !== 'all') {
      const status = u.accountStatus || 'approved';
      if (status !== filterStatus) return false;
    }

    // Search query
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

  const pendingCount = users.filter((u) => u.accountStatus === 'pending').length;
  const approvedCount = users.filter((u) => (u.accountStatus || 'approved') === 'approved').length;
  const rejectedCount = users.filter((u) => u.accountStatus === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-5 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : 'bg-rose-900 text-white border-rose-700'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header and Controls */}
      <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            {/* Status indicator badge displayed distinctly without colliding with the title */}
            <div>
              {pendingCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-2xs">
                  <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>{pendingCount} ta tasdiqlash kutilmoqda</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Barchasi koʻrib chiqilgan</span>
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
              Tasdiqlashni kutayotgan foydalanuvchilar
            </h2>

            <p className="text-xs text-slate-500 dark:text-slate-400 font-body leading-relaxed max-w-xl">
              Yangi roʻyxatdan oʻtgan foydalanuvchilar arizasini tekshiring, profillarini koʻrib chiqing va tasdiqlang yoki rad eting.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ism, email yoki shahar boʻyicha qidirish..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50/70 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Status Filter Chips - Horizontally scrollable and shrink-proof */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar flex-nowrap w-full touch-pan-x">
          <button
            type="button"
            onClick={() => setFilterStatus('pending')}
            className={`px-3.5 py-2 rounded-xl font-heading font-semibold transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
              filterStatus === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Kutilmoqda ({pendingCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('approved')}
            className={`px-3.5 py-2 rounded-xl font-heading font-semibold transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
              filterStatus === 'approved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Tasdiqlanganlar ({approvedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('rejected')}
            className={`px-3.5 py-2 rounded-xl font-heading font-semibold transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
              filterStatus === 'rejected'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Rad etilganlar ({rejectedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3.5 py-2 rounded-xl font-heading font-semibold transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Barchasi ({users.length})</span>
          </button>
        </div>
      </div>

      {/* Users List Table / Cards */}
      <div className="bg-white dark:bg-[#1A1A24] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center gap-2 text-xs">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
            <span>Foydalanuvchilar yuklanmoqda...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-slate-500 dark:text-slate-400 px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400 dark:text-slate-500">
              <Clock className="w-6 h-6" />
            </div>
            <p className="font-heading font-bold text-sm text-slate-800 dark:text-slate-200">
              {filterStatus === 'pending'
                ? 'Hozircha tasdiqlashni kutayotgan yangi arizalar yoʻq'
                : 'Tanlangan filtr boʻyicha foydalanuvchilar topilmadi'}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto font-body">
              Yangi foydalanuvchilar roʻyxatdan oʻtganda ular avtomatik shu yerda aks etadi.
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
                  const status = u.accountStatus || 'approved';
                  const isUserPending = status === 'pending';
                  const isUserRejected = status === 'rejected';

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
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center border border-indigo-100 dark:border-indigo-800 shrink-0 text-sm">
                              {u?.name ? u.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-heading font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                              {u.name || 'Ismsiz foydalanuvchi'}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {u.email || u.contact}
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
                              {u.profileCompletion || 30}% toʻldirilgan
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
                        {status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Clock className="w-3 h-3" />
                            <span>Kutilmoqda</span>
                          </span>
                        )}
                        {status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Tasdiqlangan</span>
                          </span>
                        )}
                        {status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            <XCircle className="w-3 h-3" />
                            <span>Rad etilgan</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                        <div
                          className="inline-flex items-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Inspect Profile */}
                          <button
                            type="button"
                            onClick={() => setSelectedUser(u)}
                            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Batafsil maʼlumotlarni koʻrish"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Approve button */}
                          <button
                            type="button"
                            onClick={() => handleApprove(u)}
                            disabled={isProcessing === u.uid}
                            className={`px-3 py-1.5 rounded-xl font-heading font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                              status === 'approved'
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700 dark:hover:text-emerald-300'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                            }`}
                          >
                            {isProcessing === u.uid ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>{status === 'approved' ? 'Qayta tasdiqlash' : 'Tasdiqlash'}</span>
                          </button>

                          {/* Reject button */}
                          <button
                            type="button"
                            onClick={() => handleOpenRejectModal(u)}
                            disabled={isProcessing === u.uid}
                            className={`px-3 py-1.5 rounded-xl font-heading font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                              status === 'rejected'
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-700 dark:hover:text-rose-300'
                                : 'bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            }`}
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Rad etish</span>
                          </button>
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="relative w-full max-w-xl bg-white dark:bg-[#1A1A24] rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 my-auto animate-in fade-in zoom-in-95 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {selectedUser.avatar ? (
                  <img
                    src={selectedUser.avatar}
                    alt={selectedUser?.name || 'Foydalanuvchi'}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-100 dark:border-indigo-900/60"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-2xl flex items-center justify-center border border-indigo-100 dark:border-indigo-800">
                    {selectedUser?.name ? selectedUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-extrabold text-xl text-slate-900 dark:text-white">
                      {selectedUser?.name || 'Foydalanuvchi'}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        selectedUser.role === 'bloger'
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800'
                          : 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800'
                      }`}
                    >
                      {selectedUser.role === 'bloger' ? 'Bloger' : 'Brend'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {selectedUser.email} {selectedUser.contact && selectedUser.contact !== selectedUser.email ? `• ${selectedUser.contact}` : ''}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    Roʻyxatdan oʻtgan sana: {selectedUser.registeredAt || 'Yaqinda'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Status Indicator */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Hisob holati:</span>
                {selectedUser.accountStatus === 'pending' && (
                  <span className="font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                    Kutilmoqda (Admin tasdiqi talab qilinadi)
                  </span>
                )}
                {selectedUser.accountStatus === 'approved' && (
                  <span className="font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                    Tasdiqlangan (Faol)
                  </span>
                )}
                {selectedUser.accountStatus === 'rejected' && (
                  <span className="font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded-md">
                    Rad etilgan
                  </span>
                )}
              </div>
              <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {selectedUser.profileCompletion || 30}% toʻldirilgan
              </span>
            </div>

            {/* Rejection Reason if any */}
            {selectedUser.rejectionReason && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-900 dark:text-rose-200 space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  Rad etish sababi:
                </span>
                <p className="text-rose-800 dark:text-rose-300 leading-relaxed pl-5">
                  {selectedUser.rejectionReason}
                </p>
              </div>
            )}

            {/* Profile Detailed Sections */}
            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1 text-xs">
              {/* Bio */}
              <div>
                <h4 className="font-heading font-bold mb-1 text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Oʻzi haqida (Bio)
                </h4>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 leading-relaxed">
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
                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Instagram className="w-4 h-4 text-pink-500" />
                      <span>Instagram</span>
                    </span>
                    <span className="font-mono text-slate-600 dark:text-slate-400 font-semibold truncate max-w-[140px]">
                      {selectedUser.socialLinks?.instagram || selectedUser.instagramHandle || 'Kiritilmagan'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Video className="w-4 h-4 text-slate-900 dark:text-white" />
                      <span>TikTok</span>
                    </span>
                    <span className="font-mono text-slate-600 dark:text-slate-400 font-semibold truncate max-w-[140px]">
                      {selectedUser.socialLinks?.tiktok || 'Kiritilmagan'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Youtube className="w-4 h-4 text-red-500" />
                      <span>YouTube</span>
                    </span>
                    <span className="font-mono text-slate-600 dark:text-slate-400 font-semibold truncate max-w-[140px]">
                      {selectedUser.socialLinks?.youtube || 'Kiritilmagan'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Send className="w-4 h-4 text-blue-500" />
                      <span>Telegram</span>
                    </span>
                    <span className="font-mono text-slate-600 dark:text-slate-400 font-semibold truncate max-w-[140px]">
                      {selectedUser.socialLinks?.telegram || 'Kiritilmagan'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Price Range */}
              {selectedUser.priceRange && (selectedUser.priceRange.min || selectedUser.priceRange.max) && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Narx oraligʻi:</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white">
                    {selectedUser.priceRange.min || '0'} – {selectedUser.priceRange.max || '0'} soʻm
                  </span>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-heading font-semibold text-xs transition-colors cursor-pointer"
              >
                Yopish
              </button>

              <button
                type="button"
                onClick={() => {
                  handleOpenRejectModal(selectedUser);
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-heading font-bold text-xs border border-rose-200 dark:border-rose-800 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Rad etish</span>
              </button>

              <button
                type="button"
                onClick={() => handleApprove(selectedUser)}
                disabled={isProcessing === selectedUser.uid}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isProcessing === selectedUser.uid ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Tasdiqlash</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Rejection Reason Dialog */}
      {rejectingUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setRejectingUser(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#1A1A24] rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white">
                  Arizani rad etish
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {rejectingUser.name} uchun rad etish sababini kiriting
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Rad etish sababi (ixtiyoriy, foydalanuvchiga koʻrsatiladi):
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Masalan: Ijtimoiy tarmoq havolalari notoʻgʻri koʻrsatilgan yoki profil toʻliq toʻldirilmagan..."
                rows={4}
                className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-slate-800 dark:text-slate-200 bg-slate-50/70 dark:bg-slate-800"
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Ushbu sabab foydalanuvchining ekranida chiqadi va u maʼlumotlarini toʻgʻrilab, arizani qayta yuborishi mumkin boʻladi.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRejectingUser(null)}
                className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-heading font-semibold text-xs transition-colors cursor-pointer"
              >
                Bekor qilish
              </button>

              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isProcessing === rejectingUser.uid}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-heading font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isProcessing === rejectingUser.uid ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                <span>Rad etishni tasdiqlash</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
