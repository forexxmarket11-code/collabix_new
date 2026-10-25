import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FileText, Trash2, Loader2, RefreshCw, Search, Users, Calendar, X, Check } from 'lucide-react';
import { BriefData } from '../types';
import { fetchAllBriefsAdmin, deleteBriefAdmin } from '../firebase';

interface AdminBriefsProps {
  onCountChange?: (count: number) => void;
  onUnauthorized?: () => void;
}

type Filter = 'open' | 'direct' | 'all';

function formatDate(b: BriefData): string {
  const ms = typeof b.createdAtMillis === 'number' ? b.createdAtMillis : Date.parse(b.createdAt || '');
  if (!ms || Number.isNaN(ms)) return '—';
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

function formatBudget(b: BriefData): string {
  if (b.paymentType === 'barter') return 'Barter';
  const min = (b.budgetMin || '').trim();
  const max = (b.budgetMax || '').trim();
  if (min && max) return `${min} – ${max} soʻm`;
  if (min || max) return `${min || max} soʻm`;
  return 'Kelishiladi';
}

export const AdminBriefs: React.FC<AdminBriefsProps> = ({ onCountChange, onUnauthorized }) => {
  const [briefs, setBriefs] = useState<BriefData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('open');
  const [query, setQuery] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchAllBriefsAdmin();
      setBriefs(list);
    } catch (err: any) {
      if (err?.code === 'auth/not-admin' || err?.code === 'permission-denied') {
        onUnauthorized?.();
      }
      setError('Eʼlonlarni yuklab boʻlmadi. Sahifani yangilab qayta urinib koʻring.');
    } finally {
      setLoading(false);
    }
  }, [onUnauthorized]);

  useEffect(() => {
    load();
  }, [load]);

  const openCount = useMemo(() => briefs.filter((b) => b.recipientType === 'open').length, [briefs]);
  const directCount = briefs.length - openCount;

  useEffect(() => {
    onCountChange?.(openCount);
  }, [openCount, onCountChange]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return briefs.filter((b) => {
      if (filter !== 'all' && b.recipientType !== filter) return false;
      if (!q) return true;
      return [b.taskTitle, b.description, b.brandName, b.selectedCreatorName]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [briefs, filter, query]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setError(null);
    try {
      await deleteBriefAdmin(id);
      setBriefs((prev) => prev.filter((b) => b.id !== id));
      setConfirmId(null);
    } catch (err: any) {
      if (err?.code === 'auth/not-admin') onUnauthorized?.();
      setError('Eʼlonni oʻchirishda xatolik yuz berdi. Qayta urinib koʻring.');
    } finally {
      setDeletingId(null);
    }
  };

  const filterBtn = (key: Filter, label: string, count: number) => (
    <button
      type="button"
      onClick={() => setFilter(key)}
      className={`min-h-[44px] px-4 rounded-xl text-sm font-heading font-bold flex items-center gap-2 cursor-pointer transition-colors ${
        filter === key
          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
      }`}
    >
      {label} ({count})
    </button>
  );

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-[#1A1A24] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {filterBtn('open', 'Ochiq eʼlonlar', openCount)}
            {filterBtn('direct', 'Shaxsiy briflar', directCount)}
            {filterBtn('all', 'Barchasi', briefs.length)}
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="min-h-[44px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-heading font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Yangilash
          </button>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Sarlavha, tavsif yoki brend nomi boʻyicha qidirish..."
            className="w-full min-h-[44px] pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-indigo-400"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 flex items-center justify-center text-slate-500 dark:text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Yuklanmoqda...</span>
        </div>
      ) : visible.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-[#1A1A24] rounded-2xl border border-slate-200/80 dark:border-slate-800">
          Hozircha eʼlonlar yoʻq.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {visible.map((b) => {
            const appsCount = Array.isArray(b.applications) ? b.applications.length : 0;
            const isConfirming = confirmId === b.id;
            const isDeleting = deletingId === b.id;
            return (
              <div
                key={b.id}
                className="bg-white dark:bg-[#1A1A24] rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold ${
                          b.recipientType === 'open'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                        }`}
                      >
                        {b.recipientType === 'open' ? 'OCHIQ' : 'SHAXSIY'}
                      </span>
                      {b.status && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {b.status}
                        </span>
                      )}
                    </div>
                    <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white break-words">
                      {b.taskTitle || 'Nomsiz eʼlon'}
                    </h3>
                  </div>
                  <FileText className="w-5 h-5 text-slate-400 shrink-0" />
                </div>

                {b.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3 break-words">
                    {b.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <span>Brend: <strong className="text-slate-700 dark:text-slate-200">{b.brandName || '—'}</strong></span>
                  {b.recipientType === 'direct' && (
                    <span>Kreator: <strong className="text-slate-700 dark:text-slate-200">{b.selectedCreatorName || '—'}</strong></span>
                  )}
                  <span>Byudjet: <strong className="text-slate-700 dark:text-slate-200">{formatBudget(b)}</strong></span>
                  <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(b)}</span>
                  {b.recipientType === 'open' && (
                    <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" />{appsCount} ta ariza</span>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  {isConfirming ? (
                    <div className="flex flex-wrap items-center justify-end gap-2 w-full">
                      <span className="text-sm text-rose-600 dark:text-rose-400 font-semibold mr-auto">
                        Rostdan oʻchirasizmi? Qaytarib boʻlmaydi.
                      </span>
                      <button
                        type="button"
                        onClick={() => setConfirmId(null)}
                        disabled={isDeleting}
                        className="min-h-[44px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-heading font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <X className="w-4 h-4" /> Yoʻq
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(b.id)}
                        disabled={isDeleting}
                        className="min-h-[44px] px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-heading font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                      >
                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Ha, oʻchirish
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmId(b.id)}
                      className="min-h-[44px] px-4 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-sm font-heading font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" /> Oʻchirish
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
