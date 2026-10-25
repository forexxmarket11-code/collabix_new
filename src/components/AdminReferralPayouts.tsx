import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCw, Copy, Check, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { ReferralWithdrawal } from '../types';
import {
  fetchAllReferralWithdrawalsAdmin,
  markReferralWithdrawalPaid,
  rejectReferralWithdrawal,
} from '../firebase';

interface AdminReferralPayoutsProps {
  onCountChange?: (count: number) => void;
  onUnauthorized?: () => void;
}

type Filter = 'pending' | 'paid' | 'rejected' | 'all';

function som(n: number): string {
  return `${Math.round(n || 0).toLocaleString('ru-RU').replace(/,/g, ' ')} soʻm`;
}

function formatCard(card: string): string {
  return (card || '').replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
}

export const AdminReferralPayouts: React.FC<AdminReferralPayoutsProps> = ({ onCountChange, onUnauthorized }) => {
  const [items, setItems] = useState<ReferralWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('pending');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; action: 'paid' | 'reject' } | null>(null);
  const [reason, setReason] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchAllReferralWithdrawalsAdmin());
    } catch (err: any) {
      if (err?.code === 'auth/not-admin' || err?.code === 'permission-denied') onUnauthorized?.();
      setError('Soʻrovlarni yuklab boʻlmadi.');
    } finally {
      setLoading(false);
    }
  }, [onUnauthorized]);

  useEffect(() => {
    load();
  }, [load]);

  const pendingCount = useMemo(() => items.filter((i) => i.status === 'pending').length, [items]);
  useEffect(() => {
    onCountChange?.(pendingCount);
  }, [pendingCount, onCountChange]);

  const visible = useMemo(
    () => (filter === 'all' ? items : items.filter((i) => i.status === filter)),
    [items, filter]
  );

  const totalPaid = useMemo(
    () => items.filter((i) => i.status === 'paid').reduce((sum, i) => sum + (i.amount || 0), 0),
    [items]
  );

  const runAction = async () => {
    if (!confirm) return;
    setBusyId(confirm.id);
    setError(null);
    try {
      if (confirm.action === 'paid') {
        await markReferralWithdrawalPaid(confirm.id);
      } else {
        await rejectReferralWithdrawal(confirm.id, reason.trim());
      }
      setConfirm(null);
      setReason('');
      await load();
    } catch (err: any) {
      if (err?.code === 'auth/not-admin') onUnauthorized?.();
      setError('Amalni bajarib boʻlmadi. Qayta urinib koʻring.');
    } finally {
      setBusyId(null);
    }
  };

  const copyCard = async (w: ReferralWithdrawal) => {
    try {
      await navigator.clipboard.writeText((w.cardNumber || '').replace(/\D/g, ''));
      setCopiedId(w.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  const filterBtn = (key: Filter, label: string) => (
    <button
      type="button"
      onClick={() => setFilter(key)}
      className={`min-h-[44px] px-4 rounded-xl text-sm font-heading font-bold cursor-pointer transition-colors ${
        filter === key
          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-[#1A1A24] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {filterBtn('pending', `Kutilmoqda (${pendingCount})`)}
          {filterBtn('paid', 'Toʻlangan')}
          {filterBtn('rejected', 'Rad etilgan')}
          {filterBtn('all', 'Barchasi')}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600 dark:text-slate-300">
            Jami toʻlangan: <strong className="text-emerald-600 dark:text-emerald-400">{som(totalPaid)}</strong>
          </span>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="min-h-[44px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer disabled:opacity-50"
            aria-label="Yangilash"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" /> <span className="text-sm">Yuklanmoqda...</span>
        </div>
      ) : visible.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-[#1A1A24] rounded-2xl border border-slate-200/80 dark:border-slate-800">
          Hozircha soʻrovlar yoʻq.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {visible.map((w) => {
            const isConfirming = confirm?.id === w.id;
            const busy = busyId === w.id;
            return (
              <div
                key={w.id}
                className="bg-white dark:bg-[#1A1A24] rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-heading font-bold text-slate-900 dark:text-white break-words">{w.userName}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(w.createdAtMillis).toLocaleString('ru-RU')}
                    </div>
                  </div>
                  <div className="font-mono font-extrabold text-lg text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    {som(w.amount)}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-mono font-bold tracking-wider whitespace-nowrap">{formatCard(w.cardNumber)}</div>
                    <div className="text-xs text-slate-300 truncate">{w.cardOwner || '—'}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyCard(w)}
                    className="min-h-[40px] px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {copiedId === w.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedId === w.id ? 'Nusxalandi' : 'Nusxalash'}
                  </button>
                </div>

                {w.status !== 'pending' ? (
                  <div className="flex items-center gap-2 text-sm">
                    {w.status === 'paid' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                        <CheckCircle2 className="w-4 h-4" /> Toʻlangan
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold">
                        <XCircle className="w-4 h-4" /> Rad etilgan{w.rejectionReason ? `: ${w.rejectionReason}` : ''}
                      </span>
                    )}
                  </div>
                ) : isConfirming ? (
                  <div className="space-y-2">
                    {confirm?.action === 'reject' && (
                      <input
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Sabab (masalan: karta raqami notoʻgʻri)"
                        className="w-full min-h-[44px] px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-none"
                      />
                    )}
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {confirm?.action === 'paid'
                        ? 'Pulni kartaga oʻtkazdingizmi? Balansdan ayiriladi.'
                        : 'Soʻrovni rad etasizmi? Balans saqlanib qoladi.'}
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setConfirm(null);
                          setReason('');
                        }}
                        disabled={busy}
                        className="min-h-[44px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer disabled:opacity-50"
                      >
                        Yoʻq
                      </button>
                      <button
                        type="button"
                        onClick={runAction}
                        disabled={busy}
                        className={`min-h-[44px] px-4 rounded-xl text-white text-sm font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60 ${
                          confirm?.action === 'paid' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                        }`}
                      >
                        {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                        Ha, tasdiqlayman
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2 justify-end">
                    <span className="mr-auto inline-flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400 font-bold">
                      <Clock className="w-4 h-4" /> Kutilmoqda
                    </span>
                    <button
                      type="button"
                      onClick={() => setConfirm({ id: w.id, action: 'reject' })}
                      className="min-h-[44px] px-4 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-sm font-bold cursor-pointer"
                    >
                      Rad etish
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirm({ id: w.id, action: 'paid' })}
                      className="min-h-[44px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold cursor-pointer"
                    >
                      Toʻladim
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
