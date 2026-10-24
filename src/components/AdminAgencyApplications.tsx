import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Search,
  RotateCw,
  Phone,
  Mail,
  User,
  Globe,
  Clock,
  CheckCircle2,
  PhoneCall,
  Sparkles,
  ChevronDown,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import { AgencyApplication, AgencyApplicationStatus } from '../types';
import { subscribeToAgencyApplications, updateAgencyApplicationStatus } from '../firebase';

interface AdminAgencyApplicationsProps {
  onCountChange?: (pendingCount: number) => void;
}

export const AdminAgencyApplications: React.FC<AdminAgencyApplicationsProps> = ({
  onCountChange,
}) => {
  const [applications, setApplications] = useState<AgencyApplication[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | AgencyApplicationStatus>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Subscribe to real-time Firestore updates
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToAgencyApplications(
      (loadedApps) => {
        setApplications(loadedApps);
        setIsLoading(false);

        // Notify parent about pending 'yangi' count
        const yangiCount = loadedApps.filter((a) => a.status === 'yangi').length;
        if (onCountChange) {
          onCountChange(yangiCount);
        }
      },
      (err) => {
        console.error("Admin: Agentlik arizalarini yuklashda xatolik:", err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [onCountChange]);

  // Handle status update
  const handleStatusChange = async (appId: string, newStatus: AgencyApplicationStatus) => {
    setUpdatingId(appId);
    try {
      await updateAgencyApplicationStatus(appId, newStatus);
      const statusNames: Record<AgencyApplicationStatus, string> = {
        yangi: 'Yangi',
        boglanildi: 'Bogʻlanildi',
        hamkor_boldi: 'Hamkor boʻldi',
      };
      setToastMessage(`Status "${statusNames[newStatus]}" holatiga oʻzgartirildi.`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error("Statusni yangilashda xatolik:", err);
      alert("Statusni oʻzgartirishda xatolik yuz berdi.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter and search
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      if (statusFilter !== 'all' && app.status !== statusFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          app.agencyName.toLowerCase().includes(q) ||
          app.contactPerson.toLowerCase().includes(q) ||
          app.phoneOrEmail.toLowerCase().includes(q) ||
          (app.websiteOrInstagram && app.websiteOrInstagram.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [applications, statusFilter, searchTerm]);

  // Metric counts
  const totalCount = applications.length;
  const yangiCount = applications.filter((a) => a.status === 'yangi').length;
  const boglanildiCount = applications.filter((a) => a.status === 'boglanildi').length;
  const hamkorCount = applications.filter((a) => a.status === 'hamkor_boldi').length;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-heading font-semibold animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Metrics Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#1A1A24] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-heading font-semibold text-slate-500 dark:text-slate-400">Jami arizalar</span>
            <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-heading font-extrabold text-slate-900 dark:text-white mt-1">
            {totalCount}
          </div>
        </div>

        <div className="bg-white dark:bg-[#1A1A24] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-heading font-semibold text-amber-600 dark:text-amber-400">Yangi</span>
            <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-heading font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {yangiCount}
          </div>
        </div>

        <div className="bg-white dark:bg-[#1A1A24] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-heading font-semibold text-indigo-600 dark:text-indigo-400">Bogʻlanildi</span>
            <PhoneCall className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-heading font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
            {boglanildiCount}
          </div>
        </div>

        <div className="bg-white dark:bg-[#1A1A24] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-heading font-semibold text-emerald-600 dark:text-emerald-400">Hamkor boʻldi</span>
            <Sparkles className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-heading font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {hamkorCount}
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-[#1A1A24] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Agentlik, aloqa shaxsi yoki raqam..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-body text-slate-900 dark:text-white bg-slate-50 dark:bg-[#12121A] focus:bg-white dark:focus:bg-[#151520] focus:outline-none focus:border-indigo-600 transition-colors placeholder:text-slate-400"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
          {[
            { key: 'all', label: `Barchasi (${totalCount})` },
            { key: 'yangi', label: `Yangi (${yangiCount})` },
            { key: 'boglanildi', label: `Bogʻlanildi (${boglanildiCount})` },
            { key: 'hamkor_boldi', label: `Hamkor boʻldi (${hamkorCount})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-heading font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Applications List Table / Cards */}
      {isLoading ? (
        <div className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400">
          <RotateCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-heading font-semibold">Agentlik arizalari yuklanmoqda...</span>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400">
          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-40 text-slate-400" />
          <p className="text-sm font-heading font-bold text-slate-700 dark:text-slate-200 mb-1">
            {searchTerm || statusFilter !== 'all'
              ? 'Qidiruv boʻyicha arizalar topilmadi'
              : 'Hozircha agentlik arizalari mavjud emas'}
          </p>
          <p className="text-xs font-body text-slate-500 dark:text-slate-400">
            Foydalanuvchilar "Hamkorlik dasturi" sahifasidan ariza yuborganlarida shu yerda paydo boʻladi.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredApps.map((app) => {
            const isUpdating = updatingId === app.id;

            return (
              <div
                key={app.id}
                id={`agency-app-${app.id}`}
                className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all space-y-3"
              >
                {/* Header Row: Agency Name, Date, Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                        {app.agencyName}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 font-body">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{app.createdAt}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {app.status === 'yangi' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-bold bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300">
                        <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                        <span>Yangi</span>
                      </span>
                    )}
                    {app.status === 'boglanildi' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-bold bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
                        <PhoneCall className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                        <span>Bogʻlanildi</span>
                      </span>
                    )}
                    {app.status === 'hamkor_boldi' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-bold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                        <span>Hamkor boʻldi</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {/* Contact Person */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 space-y-0.5">
                    <span className="text-[11px] font-heading font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>Aloqa shaxsi:</span>
                    </span>
                    <span className="font-heading font-bold text-slate-800 dark:text-slate-200 block text-sm">
                      {app.contactPerson}
                    </span>
                  </div>

                  {/* Phone / Email */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 space-y-0.5">
                    <span className="text-[11px] font-heading font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      <span>Telefon / Email:</span>
                    </span>
                    <span className="font-heading font-bold text-indigo-600 dark:text-indigo-400 block text-sm select-all">
                      {app.phoneOrEmail}
                    </span>
                  </div>

                  {/* Website / Instagram */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 space-y-0.5">
                    <span className="text-[11px] font-heading font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      <span>Veb-sayt / Instagram:</span>
                    </span>
                    <span className="font-heading font-bold text-slate-700 dark:text-slate-300 block truncate text-sm">
                      {app.websiteOrInstagram ? (
                        <a
                          href={
                            app.websiteOrInstagram.startsWith('http')
                              ? app.websiteOrInstagram
                              : `https://${app.websiteOrInstagram.replace(/^@/, 'instagram.com/')}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline text-indigo-600 dark:text-indigo-400"
                        >
                          {app.websiteOrInstagram}
                        </a>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 font-normal">Koʻrsatilmagan</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Notes if any */}
                {app.notes && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-heading font-semibold text-slate-500 dark:text-slate-400 mr-1.5">Izoh:</span>
                    <span className="font-body">{app.notes}</span>
                  </div>
                )}

                {/* Status Action Controls */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="font-heading font-semibold text-slate-500 dark:text-slate-400">
                    Statusni oʻzgartirish:
                  </span>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      disabled={isUpdating || app.status === 'yangi'}
                      onClick={() => handleStatusChange(app.id, 'yangi')}
                      className={`px-3 py-1.5 rounded-xl font-heading font-semibold transition-all cursor-pointer ${
                        app.status === 'yangi'
                          ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Yangi
                    </button>

                    <button
                      type="button"
                      disabled={isUpdating || app.status === 'boglanildi'}
                      onClick={() => handleStatusChange(app.id, 'boglanildi')}
                      className={`px-3 py-1.5 rounded-xl font-heading font-semibold transition-all cursor-pointer ${
                        app.status === 'boglanildi'
                          ? 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700 font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Bogʻlanildi
                    </button>

                    <button
                      type="button"
                      disabled={isUpdating || app.status === 'hamkor_boldi'}
                      onClick={() => handleStatusChange(app.id, 'hamkor_boldi')}
                      className={`px-3 py-1.5 rounded-xl font-heading font-semibold transition-all cursor-pointer ${
                        app.status === 'hamkor_boldi'
                          ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Hamkor boʻldi
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
