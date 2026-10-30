import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Search,
  ShieldCheck,
  ExternalLink,
  Phone,
  Mail,
  Send,
  MapPin,
  Crown,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { UserSession } from '../types';
import {
  subscribeToUsersForAdmin,
  approveCreatorForCatalogAdmin,
  rejectCreatorForCatalogAdmin,
  enableCatalogReviewAdmin,
  disableCatalogReviewAdmin,
} from '../firebase';
import { getBloggerCatalogReadiness, isUserPro } from '../utils/subscription';
import { isVideoLikeItem, GalleryVideoThumb } from './GalleryMedia';

interface AdminCatalogReviewProps {
  catalogProOnly: boolean;
  catalogReviewRequired: boolean;
  onPendingCountChange?: (count: number) => void;
  onUnauthorized?: () => void;
}

type Filter = 'pending' | 'approved' | 'rejected';

const SOCIALS: { key: 'instagram' | 'tiktok' | 'youtube' | 'telegram'; label: string; base: string }[] = [
  { key: 'instagram', label: 'Instagram', base: 'https://instagram.com/' },
  { key: 'tiktok', label: 'TikTok', base: 'https://www.tiktok.com/@' },
  { key: 'youtube', label: 'YouTube', base: 'https://www.youtube.com/@' },
  { key: 'telegram', label: 'Telegram', base: 'https://t.me/' },
];

function socialHref(base: string, raw: string): string | null {
  const v = (raw || '').trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  const handle = v.replace(/^@/, '').replace(/^(www\.)?(instagram\.com|tiktok\.com|youtube\.com|t\.me)\/@?/i, '');
  if (!/^[A-Za-z0-9._-]+$/.test(handle)) return null;
  return base + handle;
}

function safeHref(raw?: string): string | null {
  const v = (raw || '').trim();
  return /^https?:\/\//i.test(v) ? v : null;
}

function dateOf(u: UserSession): string {
  const c: any = u.createdAt;
  let ms = 0;
  if (c?.toMillis) ms = c.toMillis();
  else if (typeof c?.seconds === 'number') ms = c.seconds * 1000;
  if (ms) return new Date(ms).toLocaleDateString('ru-RU');
  return u.registeredAt || '—';
}

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col sm:flex-row sm:gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
    <span className="sm:w-44 shrink-0 text-xs font-heading font-semibold text-slate-500 dark:text-slate-400">{label}</span>
    <span className="text-sm text-slate-900 dark:text-slate-100 break-words min-w-0">{children}</span>
  </div>
);

export const AdminCatalogReview: React.FC<AdminCatalogReviewProps> = ({
  catalogProOnly,
  catalogReviewRequired,
  onPendingCountChange,
  onUnauthorized,
}) => {
  const [users, setUsers] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('pending');
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [toggleBusy, setToggleBusy] = useState(false);
  const [confirmEnable, setConfirmEnable] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsub = subscribeToUsersForAdmin((list) => {
      setUsers(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const creators = useMemo(
    () => users.filter((u) => u.role !== 'brend' && u.accountStatus !== 'rejected'),
    [users]
  );

  const groups = useMemo(() => {
    const pending: UserSession[] = [];
    const approved: UserSession[] = [];
    const rejected: UserSession[] = [];
    const currentlyVisible: string[] = [];
    creators.forEach((u) => {
      const now = getBloggerCatalogReadiness(u, catalogProOnly, false);
      if (now.isVisibleInCatalog && u.uid) currentlyVisible.push(u.uid);
      const r = getBloggerCatalogReadiness(u, catalogProOnly, true);
      if (r.isCatalogRejected) rejected.push(u);
      else if (r.isAwaitingReview) pending.push(u);
      else if (r.isCatalogApproved && r.isProfileComplete) approved.push(u);
    });
    const byNewest = (a: UserSession, b: UserSession) =>
      Number(b.catalogResubmittedAtMillis || 0) - Number(a.catalogResubmittedAtMillis || 0);
    pending.sort(byNewest);
    return { pending, approved, rejected, currentlyVisible };
  }, [creators, catalogProOnly]);

  useEffect(() => {
    onPendingCountChange?.(catalogReviewRequired ? groups.pending.length : 0);
  }, [groups.pending.length, catalogReviewRequired, onPendingCountChange]);

  const list = useMemo(() => {
    const base = groups[filter];
    const q = search.trim().toLowerCase();
    if (!q) return base;
    return base.filter((u) =>
      [u.name, u.email, u.contact, u.phoneNumber, u.city, u.telegramUsername, u.socialLinks?.instagram]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [groups, filter, search]);

  const handleErr = (err: any) => {
    if (err?.code === 'auth/not-admin') onUnauthorized?.();
    else setError('Xatolik yuz berdi. Qayta urinib koʻring.');
  };

  const approve = async (u: UserSession) => {
    if (!u.uid) return;
    setBusyId(u.uid);
    setError('');
    try {
      await approveCreatorForCatalogAdmin(u.uid);
    } catch (e) {
      handleErr(e);
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (u: UserSession) => {
    if (!u.uid) return;
    if (rejectReason.trim().length < 3) {
      setError('Rad etish sababini yozing (kamida 3 ta belgi).');
      return;
    }
    setBusyId(u.uid);
    setError('');
    try {
      await rejectCreatorForCatalogAdmin(u.uid, rejectReason);
      setRejectingId(null);
      setRejectReason('');
    } catch (e) {
      handleErr(e);
    } finally {
      setBusyId(null);
    }
  };

  const enableReview = async () => {
    setToggleBusy(true);
    setError('');
    try {
      await enableCatalogReviewAdmin(groups.currentlyVisible);
      setConfirmEnable(false);
    } catch (e) {
      handleErr(e);
    } finally {
      setToggleBusy(false);
    }
  };

  const disableReview = async () => {
    setToggleBusy(true);
    setError('');
    try {
      await disableCatalogReviewAdmin();
    } catch (e) {
      handleErr(e);
    } finally {
      setToggleBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-500 py-10 justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
        <span className="text-sm font-heading font-semibold">Yuklanmoqda...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Tekshiruv holati */}
      {!catalogReviewRequired ? (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-4 sm:p-5 space-y-3">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-slate-800 dark:text-slate-200 space-y-1">
              <p className="font-heading font-bold">Admin tekshiruvi hali yoqilmagan</p>
              <p>
                Hozir profili toʻliq blogerlar avtomatik katalogga chiqyapti. Tekshiruvni yoqsangiz, hozir katalogda turgan{' '}
                <b>{groups.currentlyVisible.length} ta</b> bloger avtomatik tasdiqlanadi va katalogda qoladi. Yangi blogerlar esa faqat siz
                tasdiqlagandan keyin chiqadi.
              </p>
            </div>
          </div>
          {!confirmEnable ? (
            <button
              type="button"
              onClick={() => setConfirmEnable(true)}
              className="min-h-[44px] px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-heading font-bold cursor-pointer"
            >
              Tekshiruvni yoqish
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-heading font-semibold text-slate-800 dark:text-slate-200">Ishonchingiz komilmi?</span>
              <button
                type="button"
                onClick={enableReview}
                disabled={toggleBusy}
                className="min-h-[44px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-heading font-bold cursor-pointer inline-flex items-center gap-2"
              >
                {toggleBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                Ha, yoqish
              </button>
              <button
                type="button"
                onClick={() => setConfirmEnable(false)}
                disabled={toggleBusy}
                className="min-h-[44px] px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-heading font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                Bekor qilish
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-sm text-emerald-900 dark:text-emerald-200">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-heading font-bold">
              Tekshiruv yoqilgan: yangi blogerlar faqat tasdiqdan keyin katalogga chiqadi.
            </span>
          </div>
          <button
            type="button"
            onClick={disableReview}
            disabled={toggleBusy}
            className="min-h-[40px] px-3 rounded-xl border border-emerald-300 dark:border-emerald-700 text-xs font-heading font-bold text-emerald-800 dark:text-emerald-200 cursor-pointer shrink-0 disabled:opacity-60"
          >
            Tekshiruvni oʻchirish
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-800 px-4 py-2.5 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Filtrlar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="flex gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-2xl overflow-x-auto">
          {([
            ['pending', 'Kutilmoqda', groups.pending.length, <Clock key="c" className="w-4 h-4 text-amber-500" />],
            ['approved', 'Tasdiqlangan', groups.approved.length, <CheckCircle2 key="a" className="w-4 h-4 text-emerald-500" />],
            ['rejected', 'Rad etilgan', groups.rejected.length, <XCircle key="r" className="w-4 h-4 text-rose-500" />],
          ] as [Filter, string, number, React.ReactNode][]).map(([key, label, count, icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`min-h-[44px] px-3.5 rounded-xl text-xs font-heading font-bold flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                filter === key
                  ? 'bg-white dark:bg-[#1A1A24] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {icon}
              <span>{label}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-slate-900/10 dark:bg-white/10 text-[10px] font-mono">{count}</span>
            </button>
          ))}
        </div>
        <div className="relative sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ism, telefon, shahar..."
            className="w-full min-h-[44px] pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1A1A24] text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-400"
          />
        </div>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
          {filter === 'pending' ? 'Tekshiruvni kutayotgan profil yoʻq 🎉' : 'Hozircha hech kim yoʻq'}
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((u) => {
            const uid = u.uid || '';
            const isOpen = openId === uid;
            const gallery = [...(u.gallery || []), ...(u.mediaGallery || [])].filter((g) => g && g.url);
            const pro = isUserPro(u);
            return (
              <div
                key={uid}
                className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#1A1A24] shadow-xs overflow-hidden"
              >
                {/* Sarlavha */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : uid)}
                    className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
                  >
                    {u.avatar ? (
                      <img src={u.avatar} alt="" className="w-14 h-14 rounded-2xl object-cover shrink-0 bg-slate-100" />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-pink-500 text-white flex items-center justify-center text-xl font-heading font-black shrink-0">
                        {(u.name || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-heading font-extrabold text-slate-900 dark:text-white truncate">{u.name || 'Ismsiz'}</span>
                        {pro && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                            <Crown className="w-3 h-3" /> Pro
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {(u.categories || []).join(', ') || 'Kategoriya yoʻq'} · {u.city || 'Shahar yoʻq'} · {dateOf(u)}
                      </p>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-slate-400 shrink-0 ml-auto" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 shrink-0 ml-auto" />
                    )}
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    {filter !== 'approved' && (
                      <button
                        type="button"
                        onClick={() => approve(u)}
                        disabled={busyId === uid}
                        className="min-h-[44px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-heading font-bold cursor-pointer inline-flex items-center gap-1.5"
                      >
                        {busyId === uid ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Tasdiqlash
                      </button>
                    )}
                    {filter !== 'rejected' && (
                      <button
                        type="button"
                        onClick={() => {
                          setRejectingId(rejectingId === uid ? null : uid);
                          setRejectReason('');
                          setError('');
                        }}
                        disabled={busyId === uid}
                        className="min-h-[44px] px-4 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-heading font-bold cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        {filter === 'approved' ? 'Katalogdan olish' : 'Rad etish'}
                      </button>
                    )}
                  </div>
                </div>

                {rejectingId === uid && (
                  <div className="px-4 pb-4 flex flex-col sm:flex-row gap-2">
                    <input
                      autoFocus
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      maxLength={500}
                      placeholder="Sababi: masalan, rasm sifatsiz yoki obunachilar soni notoʻgʻri"
                      className="flex-1 min-h-[44px] px-3 rounded-xl border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white outline-none focus:border-rose-400"
                    />
                    <button
                      type="button"
                      onClick={() => reject(u)}
                      disabled={busyId === uid}
                      className="min-h-[44px] px-4 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-xs font-heading font-bold cursor-pointer"
                    >
                      Yuborish
                    </button>
                  </div>
                )}

                {filter === 'rejected' && u.catalogRejectReason && (
                  <div className="px-4 pb-3 text-xs text-rose-700 dark:text-rose-300">Sabab: {u.catalogRejectReason}</div>
                )}

                {/* Toʻliq maʼlumot */}
                {isOpen && (
                  <div className="border-t border-slate-100 dark:border-slate-800 p-4 sm:p-5 space-y-5 bg-slate-50/60 dark:bg-slate-900/40">
                    <div>
                      <Row label="Ism">{u.name || '—'}</Row>
                      <Row label="Bio">
                        <span className="whitespace-pre-wrap">{u.bio || '—'}</span>
                      </Row>
                      <Row label="Kategoriyalar">{(u.categories || []).join(', ') || '—'}</Row>
                      <Row label="Kontent turlari">{(u.contentTypes || []).join(', ') || '—'}</Row>
                      <Row label="Tillar">{(u.languages || []).join(', ') || '—'}</Row>
                      <Row label="Shahar">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {u.city || '—'}
                        </span>
                      </Row>
                      <Row label="Jinsi / yoshi">
                        {[u.gender, u.age ? `${u.age} yosh` : ''].filter(Boolean).join(' · ') || '—'}
                      </Row>
                      {(u.height || u.weight) && (
                        <Row label="Boʻy / vazn">{[u.height && `${u.height} sm`, u.weight && `${u.weight} kg`].filter(Boolean).join(' · ')}</Row>
                      )}
                      <Row label="Tajriba">{u.experienceYears ? `${u.experienceYears} yil` : '—'}</Row>
                      <Row label="Narx">
                        {u.priceRange?.min || '—'}
                        {u.priceRange?.max ? ` – ${u.priceRange.max}` : ''} soʻm
                      </Row>
                    </div>

                    <div>
                      <p className="text-xs font-heading font-bold text-slate-500 dark:text-slate-400 mb-2">Ijtimoiy tarmoqlar</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {SOCIALS.map((s) => {
                          const val = (u.socialLinks as any)?.[s.key] || (s.key === 'instagram' ? u.instagramHandle : s.key === 'telegram' ? u.telegramUsername : '');
                          const followers = (u.socialLinks as any)?.[`${s.key}Followers`];
                          const enabled = (u.socialLinks as any)?.[`${s.key}Enabled`] !== false;
                          if (!val) return null;
                          const href = socialHref(s.base, String(val));
                          return (
                            <div
                              key={s.key}
                              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1A1A24] px-3 py-2.5 text-sm"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-heading font-bold text-slate-900 dark:text-white">
                                  {s.label} {!enabled && <span className="text-[10px] text-slate-400">(yashirin)</span>}
                                </span>
                                <span className="text-xs text-slate-500">{followers ? `${followers} obunachi` : 'obunachi kiritilmagan'}</span>
                              </div>
                              {href ? (
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 dark:text-indigo-400 text-xs inline-flex items-center gap-1 break-all mt-0.5"
                                >
                                  {String(val)} <ExternalLink className="w-3 h-3 shrink-0" />
                                </a>
                              ) : (
                                <span className="text-xs text-slate-600 dark:text-slate-300 break-all">{String(val)}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-heading font-bold text-slate-500 dark:text-slate-400 mb-2">Aloqa (faqat adminga koʻrinadi)</p>
                      <div className="flex flex-wrap gap-2 text-sm">
                        {u.phoneNumber && (
                          <a href={`tel:${u.phoneNumber}`} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#1A1A24] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                            <Phone className="w-4 h-4 text-emerald-600" /> {u.phoneNumber}
                          </a>
                        )}
                        {u.email && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#1A1A24] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white break-all">
                            <Mail className="w-4 h-4 text-indigo-600" /> {u.email}
                          </span>
                        )}
                        {u.telegramUsername && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#1A1A24] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                            <Send className="w-4 h-4 text-sky-500" /> {u.telegramUsername}
                          </span>
                        )}
                        {u.contact && u.contact !== u.email && u.contact !== u.phoneNumber && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#1A1A24] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white break-all">
                            {u.contact}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <Row label="Roʻyxatdan oʻtgan">{dateOf(u)}</Row>
                      <Row label="Pro holati">
                        {pro
                          ? `Faol${u.proExpiresAtMillis ? ` · ${new Date(u.proExpiresAtMillis).toLocaleDateString('ru-RU')} gacha` : ''}`
                          : 'Yoʻq'}
                      </Row>
                      <Row label="Profil toʻliqligi">{typeof u.profileCompletion === 'number' ? `${u.profileCompletion}%` : '—'}</Row>
                      <Row label="Profil koʻrishlar">{u.views ?? 0}</Row>
                      <Row label="ID">
                        <span className="font-mono text-xs">{uid}</span>
                      </Row>
                    </div>

                    {(u.pastCollaborations || []).length > 0 && (
                      <div>
                        <p className="text-xs font-heading font-bold text-slate-500 dark:text-slate-400 mb-2">
                          Portfolio ({u.pastCollaborations!.length} ta brend)
                        </p>
                        <div className="space-y-1.5">
                          {u.pastCollaborations!.map((c) => {
                            const href = safeHref(c.link);
                            return (
                              <div key={c.id} className="rounded-xl bg-white dark:bg-[#1A1A24] border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm">
                                <span className="font-heading font-bold text-slate-900 dark:text-white">{c.brand}</span>
                                {c.year ? <span className="text-slate-500"> · {c.year}</span> : null}
                                {c.description ? <p className="text-xs text-slate-600 dark:text-slate-300">{c.description}</p> : null}
                                {href && (
                                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 dark:text-indigo-400 inline-flex items-center gap-1 break-all">
                                    Havola <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {gallery.length > 0 && (
                      <div>
                        <p className="text-xs font-heading font-bold text-slate-500 dark:text-slate-400 mb-2">Galereya ({gallery.length})</p>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                          {gallery.map((g, i) => {
                            const href = safeHref(g.url);
                            const inner = isVideoLikeItem(g) ? (
                              <GalleryVideoThumb url={g.url} />
                            ) : (
                              <img src={g.url} alt="" className="w-full h-full object-cover" />
                            );
                            const cls = 'block aspect-square rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 relative';
                            return href ? (
                              <a key={g.id || i} href={href} target="_blank" rel="noopener noreferrer" className={cls}>
                                {inner}
                              </a>
                            ) : (
                              <div key={g.id || i} className={cls}>
                                {inner}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
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
