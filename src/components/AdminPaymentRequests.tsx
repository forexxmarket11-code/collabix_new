import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  Search,
  RotateCw,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  ExternalLink,
  AlertCircle,
  Sparkles,
  Calendar,
  User,
  Phone,
  Mail,
  ShieldCheck,
  ZoomIn,
} from 'lucide-react';
import { PaymentRequest, PaymentRequestStatus } from '../types';
import {
  subscribeToPaymentRequests,
  approvePaymentRequest,
  rejectPaymentRequest,
  formatUzbekDate,
  isCurrentUserAdmin,
} from '../firebase';

function isPdfReceiptUrl(url?: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return lower.startsWith('data:application/pdf') || lower.includes('.pdf');
}

interface AdminPaymentRequestsProps {
  onCountChange?: (pendingCount: number) => void;
  onUnauthorized?: () => void;
}

export const AdminPaymentRequests: React.FC<AdminPaymentRequestsProps> = ({
  onCountChange,
  onUnauthorized,
}) => {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal for viewing full receipt image or PDF
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Modal for rejecting request with optional reason
  const [rejectingItem, setRejectingItem] = useState<PaymentRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // Real-time Firestore subscription
  useEffect(() => {
    if (!isCurrentUserAdmin()) {
      onUnauthorized?.();
      return;
    }
    setIsLoading(true);
    const unsubscribe = subscribeToPaymentRequests(
      (loadedRequests) => {
        setRequests(loadedRequests);
        setIsLoading(false);

        const pending = loadedRequests.filter((r) => r.status === 'pending').length;
        if (onCountChange) {
          onCountChange(pending);
        }
      },
      (err: any) => {
        if (err?.code !== 'permission-denied' && err?.code !== 'unavailable') {
          console.warn('Toʻlov soʻrovlarini yuklashda ogohlantirish:', err?.message || err);
        }
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [onCountChange, onUnauthorized]);

  // Handle Approve
  const handleApprove = async (req: PaymentRequest) => {
    if (!isCurrentUserAdmin()) {
      onUnauthorized?.();
      return;
    }
    setActionLoadingId(req.id);
    try {
      await approvePaymentRequest(req.id, req.userId);
      setToastMessage(`✓ ${req.userName} toʻlovi tasdiqlandi va 30 kunlik Pro rejim faollashtirildi!`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      if (err?.code === 'auth/not-admin') {
        onUnauthorized?.();
        return;
      }
      console.error('Toʻlovni tasdiqlashda xatolik:', err);
      setToastMessage('Tasdiqlashda xatolik yuz berdi. Qaytadan urinib koʻring.');
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Reject Confirm
  const handleConfirmReject = async () => {
    if (!isCurrentUserAdmin()) {
      onUnauthorized?.();
      return;
    }
    if (!rejectingItem) return;
    setActionLoadingId(rejectingItem.id);
    try {
      await rejectPaymentRequest(rejectingItem.id, rejectionReason.trim());
      setToastMessage(`Soʻrov rad etildi.`);
      setTimeout(() => setToastMessage(null), 3000);
      setRejectingItem(null);
      setRejectionReason('');
    } catch (err: any) {
      if (err?.code === 'auth/not-admin') {
        onUnauthorized?.();
        return;
      }
      console.error('Toʻlovni rad etishda xatolik:', err);
      setToastMessage('Rad etishda xatolik yuz berdi.');
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter and search
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      if (statusFilter !== 'all' && req.status !== statusFilter) {
        return false;
      }
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        req.userName.toLowerCase().includes(term) ||
        (req.userPhone && req.userPhone.toLowerCase().includes(term)) ||
        (req.userEmail && req.userEmail.toLowerCase().includes(term))
      );
    });
  }, [requests, statusFilter, searchTerm]);

  const pendingTotal = requests.filter((r) => r.status === 'pending').length;
  const approvedTotal = requests.filter((r) => r.status === 'approved').length;
  const rejectedTotal = requests.filter((r) => r.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-heading font-bold shadow-md flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Filter and Search Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#12121A] border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xs">
        {/* Status Tab Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Kutilayotganlar</span>
            {pendingTotal > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
                statusFilter === 'pending' ? 'bg-white/30 text-white' : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
              }`}>
                {pendingTotal}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              statusFilter === 'approved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Tasdiqlanganlar</span>
            {approvedTotal > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
                statusFilter === 'approved' ? 'bg-white/30 text-white' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
              }`}>
                {approvedTotal}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              statusFilter === 'rejected'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Rad etilganlar</span>
            {rejectedTotal > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
                statusFilter === 'rejected' ? 'bg-white/30 text-white' : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
              }`}>
                {rejectedTotal}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold transition-all cursor-pointer shrink-0 ${
              statusFilter === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Barchasi ({requests.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Ism yoki telefon boʻyicha qidirish..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-body text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Main List */}
      {isLoading ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#12121A] border border-slate-200 dark:border-slate-800">
          <RotateCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
          <p className="text-xs font-heading text-slate-500 dark:text-slate-400">
            Toʻlov soʻrovlari yuklanmoqda...
          </p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#12121A] border border-slate-200 dark:border-slate-800">
          <CreditCard className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="font-heading font-extrabold text-base text-slate-800 dark:text-slate-200">
            {statusFilter === 'pending'
              ? 'Tasdiqlashni kutayotgan toʻlov soʻrovlari yoʻq'
              : 'Soʻrovlar topilmadi'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-body mt-1 max-w-sm mx-auto">
            {statusFilter === 'pending'
              ? 'Yangi bank oʻtkazmalari va cheklar yuborilganda bu yerda avtomatik paydo boʻladi.'
              : 'Tanlangan filtr yoki qidiruv soʻziga mos keladigan toʻlovlar mavjud emas.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => {
            const isPending = req.status === 'pending';
            const isApproved = req.status === 'approved';
            const isRejected = req.status === 'rejected';

            let dateDisplay = 'Yaqinda';
            try {
              dateDisplay = formatUzbekDate(req.sana);
            } catch {
              dateDisplay = req.sana;
            }

            return (
              <div
                key={req.id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#12121A] border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                {/* User & Request Info */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {/* Thumbnail / Receipt Image or PDF Button */}
                  <div className="relative group shrink-0">
                    {req.screenshotUrl ? (
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewImage({
                            url: req.screenshotUrl,
                            title: `${req.userName} - Toʻlov cheki`,
                          })
                        }
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 relative cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all block"
                        title="Chekni katta koʻrinishda ochish"
                      >
                        {isPdfReceiptUrl(req.screenshotUrl) ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs">
                            <span>PDF</span>
                            <span className="text-[10px] font-normal">Chek</span>
                          </div>
                        ) : (
                          <img
                            src={req.screenshotUrl}
                            alt="Chek rasmi"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                          <ZoomIn className="w-5 h-5" />
                        </div>
                      </button>
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 text-[10px] text-center p-1">
                        Chek yoʻq
                      </div>
                    )}
                  </div>

                  {/* Text details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-heading font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                        {req.userName}
                      </h4>

                      {/* Status Badge */}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800 text-[11px] font-mono font-bold">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Kutilmoqda (pending)</span>
                        </span>
                      )}
                      {isApproved && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 text-[11px] font-mono font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Tasdiqlangan</span>
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800 text-[11px] font-mono font-bold">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          <span>Rad etilgan</span>
                        </span>
                      )}
                    </div>

                    {/* Metadata line */}
                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-body flex-wrap">
                      <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-heading font-bold">
                        <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                        <span>59 000 soʻm</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{dateDisplay}</span>
                      </span>
                      {req.userPhone && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{req.userPhone}</span>
                          </span>
                        </>
                      )}
                    </div>

                    {/* Rejection reason if any */}
                    {isRejected && req.rejectionReason && (
                      <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-body">
                        <strong>Rad etish sababi:</strong> {req.rejectionReason}
                      </p>
                    )}

                    {/* Approved info if any */}
                    {isApproved && (
                      <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-body">
                        ✓ Foydalanuvchiga 30 kunlik Pro rejim faollashtirilgan
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0 w-full sm:w-auto justify-end">
                  {/* View receipt full button */}
                  {req.screenshotUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewImage({
                          url: req.screenshotUrl,
                          title: `${req.userName} - Toʻlov cheki`,
                        })
                      }
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-heading font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Chekni koʻrish</span>
                    </button>
                  )}

                  {isPending && (
                    <>
                      {/* Rad etish button */}
                      <button
                        type="button"
                        onClick={() => {
                          setRejectingItem(req);
                          setRejectionReason('');
                        }}
                        disabled={actionLoadingId === req.id}
                        className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-heading font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Rad etish</span>
                      </button>

                      {/* Tasdiqlash button */}
                      <button
                        type="button"
                        onClick={() => handleApprove(req)}
                        disabled={actionLoadingId === req.id}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-heading font-extrabold shadow-sm hover:shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Tasdiqlash</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FULLSCREEN RECEIPT IMAGE MODAL */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 pb-[calc(90px+env(safe-area-inset-bottom,0px))] sm:pb-4 overflow-y-auto"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                {previewImage.title}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-auto rounded-xl bg-slate-950 flex items-center justify-center p-2">
              {isPdfReceiptUrl(previewImage.url) ? (
                <iframe
                  src={previewImage.url}
                  title={previewImage.title}
                  className="w-full h-[70vh] rounded-lg bg-white"
                />
              ) : (
                <img
                  src={previewImage.url}
                  alt={previewImage.title}
                  className="max-h-[70vh] w-auto object-contain rounded-lg shadow-md"
                />
              )}
            </div>

            <div className="mt-4 flex justify-between items-center">
              <span className="text-xs text-slate-500 font-body">
                Karta: 9860 0901 0699 8728 (Sobirov Aziz) · 59 000 soʻm
              </span>
              <a
                href={previewImage.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-heading font-semibold hover:underline"
              >
                <span>Asl oʻlchamda ochish</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL WITH REASON */}
      {rejectingItem && (
        <div
          className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 pb-[calc(90px+env(safe-area-inset-bottom,0px))] sm:pb-4 overflow-y-auto"
          onClick={() => setRejectingItem(null)}
        >
          <div
            className="relative max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-auto animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
              <XCircle className="w-6 h-6 stroke-[2.2]" />
            </div>

            <h3 className="font-heading font-extrabold text-lg text-center text-slate-900 dark:text-white">
              Toʻlov soʻrovini rad etish
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center font-body mt-1">
              {rejectingItem.userName} tomonidan yuborilgan soʻrov rad etiladi.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-heading font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Rad etish sababi (ixtiyoriy):
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Masalan: Chekdagi summa toʻliq emas yoki rekvizitlar xato..."
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-body text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />

              {/* Quick suggestions */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[
                  'Chek maʼlumotlari oʻqilmadi',
                  'Toʻlov summasi kam',
                  'Karta raqami mos kelmadi',
                ].map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setRejectionReason(sug)}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-heading font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={actionLoadingId === rejectingItem.id}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-heading font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Rad etish</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
