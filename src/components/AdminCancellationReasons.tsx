import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  RotateCw,
  Search,
  Filter,
  UserX,
  MessageSquare,
  Calendar,
  User,
  Mail,
  Shield,
  Tag,
  ArrowUpDown,
  TrendingDown,
  Info,
} from 'lucide-react';
import { CancellationRecord, CANCELLATION_REASONS } from '../types';
import { subscribeToCancellationRecords, formatUzbekDate } from '../firebase';

interface AdminCancellationReasonsProps {
  onCountChange?: (count: number) => void;
}

const REASON_COLORS: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  "Narx men uchun qimmat": {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-900/60",
    bar: "bg-rose-500",
  },
  "Kerakli kreator/brendni topa olmadim": {
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-900/60",
    bar: "bg-indigo-500",
  },
  "Platforma qulay emas / texnik muammolar": {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-900/60",
    bar: "bg-amber-500",
  },
  "Boshqa maqsadga o'tdim / kerak emas": {
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-700",
    bar: "bg-slate-500",
  },
  "Boshqa sabab": {
    bg: "bg-purple-50 dark:bg-purple-950/40",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-900/60",
    bar: "bg-purple-500",
  },
};

export const AdminCancellationReasons: React.FC<AdminCancellationReasonsProps> = ({
  onCountChange,
}) => {
  const [records, setRecords] = useState<CancellationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterReason, setSelectedFilterReason] = useState<string>('all');

  // Real-time Firestore subscription to cancellations
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToCancellationRecords(
      (data) => {
        setRecords(data);
        setIsLoading(false);
        setIsRefreshing(false);
        if (onCountChange) {
          onCountChange(data.length);
        }
      },
      (err) => {
        console.error("Cancellations fetch error:", err);
        setIsLoading(false);
        setIsRefreshing(false);
      }
    );

    return () => unsubscribe();
  }, [onCountChange]);

  // Reason distribution statistics calculation
  const stats = useMemo(() => {
    const total = records.length;
    const counts: Record<string, number> = {};

    CANCELLATION_REASONS.forEach((r) => {
      counts[r] = 0;
    });

    records.forEach((rec) => {
      const reasonKey = rec.reason || "Boshqa sabab";
      counts[reasonKey] = (counts[reasonKey] || 0) + 1;
    });

    let topReason = '';
    let topCount = -1;

    Object.entries(counts).forEach(([r, count]) => {
      if (count > topCount && count > 0) {
        topCount = count;
        topReason = r;
      }
    });

    return {
      total,
      counts,
      topReason,
      topCount,
    };
  }, [records]);

  // Filtered records based on search and selected filter
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // Reason filter
      if (selectedFilterReason !== 'all' && rec.reason !== selectedFilterReason) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = rec.userName?.toLowerCase().includes(q);
        const emailMatch = rec.userEmail?.toLowerCase().includes(q);
        const handleMatch = rec.userHandle?.toLowerCase().includes(q);
        const reasonMatch = rec.reason?.toLowerCase().includes(q);
        const detailsMatch = rec.reasonDetails?.toLowerCase().includes(q);
        return Boolean(nameMatch || emailMatch || handleMatch || reasonMatch || detailsMatch);
      }

      return true;
    });
  }, [records, selectedFilterReason, searchQuery]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <UserX className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight">
              Obunani bekor qilish sabablari
            </h2>
          </div>
          <p className="text-xs sm:text-sm font-body text-slate-500 dark:text-slate-400 mt-1">
            Foydalanuvchilar nima sababdan Pro rejimni bekor qilayotganini tahlil qilish va mahsulotni yaxshilash paneli.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-heading font-medium text-slate-500 dark:text-slate-400">
            Jami bekor qilingan: <strong className="text-slate-900 dark:text-white font-bold">{stats.total} ta</strong>
          </span>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            id="btn-refresh-cancellations"
            title="Qayta yuklash"
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center justify-center"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600 dark:text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* SABABLAR BO'YICHA ODDIY RO'YXAT (Murakkab diagramma va foiz hisoblagichlar o'rniga oddiy ro'yxat) */}
      <div className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <h3 className="text-sm font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserX className="w-4 h-4 text-rose-500" />
            <span>Sabablar roʻyxati</span>
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            Jami: {stats.total} ta yozuv
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {CANCELLATION_REASONS.map((reason) => {
            const count = stats.counts[reason] || 0;
            return (
              <div
                key={reason}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60"
              >
                <div className="text-[11px] font-heading font-medium text-slate-600 dark:text-slate-400 truncate" title={reason}>
                  {reason}
                </div>
                <div className="text-base font-mono font-bold text-slate-900 dark:text-white mt-1">
                  {count} ta
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Foydalanuvchi ismi, email yoki izohdan qidirish..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-body text-slate-900 dark:text-white bg-slate-50/50 dark:bg-[#12121A] placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Quick Filter Pill Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedFilterReason('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition-all shrink-0 cursor-pointer ${
                selectedFilterReason === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Barchasi ({records.length})
            </button>

            {CANCELLATION_REASONS.map((r) => {
              const count = stats.counts[r] || 0;
              const isSelected = selectedFilterReason === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedFilterReason(isSelected ? 'all' : r)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-heading font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="truncate max-w-[130px]">{r}</span>
                  <span className="font-mono text-[10px] px-1 py-0.2 rounded-full bg-white/20">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* TABLE / LIST OF CANCELLATION RECORDS */}
      <div className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-heading font-bold text-slate-900 dark:text-white">
              Bekor qilingan obunalar roʻyxati
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-mono font-bold text-slate-600 dark:text-slate-300">
              {filteredRecords.length} ta
            </span>
          </div>

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs text-indigo-600 hover:underline font-medium cursor-pointer"
            >
              Qidiruvni tozalash
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <RotateCw className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-xs font-body">Maʼlumotlar yuklanmoqda...</span>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-3">
              <UserX className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-heading font-bold text-slate-800 dark:text-white">
              {searchQuery || selectedFilterReason !== 'all'
                ? "Filtr boʻyicha hech qanday natija topilmadi"
                : "Hozircha bekor qilingan obunalar mavjud emas"}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-body max-w-sm mx-auto mt-1">
              {searchQuery || selectedFilterReason !== 'all'
                ? "Qidiruv soʻzini yoki tanlangan sabab filtrini oʻzgartirib koʻring."
                : "Foydalanuvchilar Pro rejim obunasini bekor qilganlarida, barcha sabablar va fikr-mulohazalar ushbu jadvalda real vaqtda koʻrinadi."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredRecords.map((item) => {
              const colors = REASON_COLORS[item.reason] || REASON_COLORS["Boshqa sabab"];
              const dateFormatted = formatUzbekDate(item.cancelledAt) || item.cancelledAt;

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                >
                  {/* Left: User details & selected reason */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-heading font-bold text-sm shrink-0">
                        {item.userName ? item.userName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-heading font-bold text-slate-900 dark:text-white">
                            {item.userName}
                          </span>
                          {item.userRole && (
                            <span className="text-[10px] font-heading font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                              {item.userRole}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-body mt-0.5">
                          {item.userEmail && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                              <span>{item.userEmail}</span>
                            </span>
                          )}
                          {item.userHandle && (
                            <span className="text-slate-400 dark:text-slate-500">
                              @{item.userHandle.replace(/^@/, '')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Selected Reason Badge */}
                    <div className="pt-1 flex items-center gap-2">
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-body">Sabab:</span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-heading font-bold border ${colors.bg} ${colors.text} ${colors.border}`}
                      >
                        <Tag className="w-3 h-3" />
                        <span>{item.reason}</span>
                      </span>
                    </div>

                    {/* Additional Details (if provided) */}
                    {item.reasonDetails && (
                      <div className="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs font-body text-slate-700 dark:text-slate-300 space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-heading font-bold text-slate-500 dark:text-slate-400">
                          <MessageSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>Foydalanuvchi izohi:</span>
                        </div>
                        <p className="leading-relaxed text-slate-800 dark:text-slate-200 italic">
                          "{item.reasonDetails}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right: Date Timestamp */}
                  <div className="sm:text-right shrink-0 flex items-center sm:flex-col sm:items-end justify-between text-xs text-slate-400 dark:text-slate-500 font-body pt-1 sm:pt-0">
                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>{dateFormatted}</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-1">
                      ID: {item.id.replace('cancel_', '')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
