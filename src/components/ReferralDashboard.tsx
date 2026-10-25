import React, { useCallback, useEffect, useState } from 'react';
import {
  Copy,
  Check,
  Share2,
  Lock,
  Wallet,
  Users,
  BadgeCheck,
  Loader2,
  CreditCard,
  Clock,
  XCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { UserSession, ReferralWithdrawal } from '../types';
import { isUserPro } from '../utils/subscription';
import {
  buildReferralLink,
  fetchMyReferralInvitedCount,
  fetchMyReferralWithdrawals,
  requestReferralWithdrawal,
  REFERRAL_MIN_WITHDRAWAL,
} from '../firebase';

interface ReferralDashboardProps {
  currentUser: UserSession | null;
  onOpenRegister: () => void;
  onOpenProModal: () => void;
}

function som(n: number): string {
  return `${Math.max(0, Math.round(n)).toLocaleString('ru-RU').replace(/,/g, ' ')} soʻm`;
}

function formatCardInput(raw: string): string {
  return raw
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ');
}

function maskCard(card: string): string {
  const d = (card || '').replace(/\D/g, '');
  return d.length >= 4 ? `•••• ${d.slice(-4)}` : '••••';
}

export const ReferralDashboard: React.FC<ReferralDashboardProps> = ({
  currentUser,
  onOpenRegister,
  onOpenProModal,
}) => {
  const uid = currentUser?.uid || '';
  const hasPro = isUserPro(currentUser);
  const balance = Number(currentUser?.referralBalance || 0);
  const earnedTotal = Number(currentUser?.referralEarnedTotal || 0);

  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<{ invited: number; paid: number }>({ invited: 0, paid: 0 });
  const [withdrawals, setWithdrawals] = useState<ReferralWithdrawal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardOwner, setCardOwner] = useState('');
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const load = useCallback(async () => {
    if (!uid || !hasPro) return;
    const [s, w] = await Promise.all([fetchMyReferralInvitedCount(uid), fetchMyReferralWithdrawals(uid)]);
    setStats(s);
    setWithdrawals(w);
  }, [uid, hasPro]);

  useEffect(() => {
    load();
  }, [load]);

  const link = uid ? buildReferralLink(uid) : '';
  const hasPending = withdrawals.some((w) => w.status === 'pending');
  const canWithdraw = balance >= REFERRAL_MIN_WITHDRAWAL && !hasPending;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  const handleShare = async () => {
    const text =
      'Collabix — blogerlar va brendlarni toʻgʻridan-toʻgʻri bogʻlaydigan platforma. Mening havolam orqali roʻyxatdan oʻting:';
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Collabix', text, url: link });
        return;
      }
    } catch {
      return;
    }
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length !== 16) {
      setFormError('Karta raqamini toʻliq kiriting (16 ta raqam).');
      return;
    }
    if (cardOwner.trim().length < 3) {
      setFormError('Karta egasining ism-familiyasini kiriting.');
      return;
    }
    setSending(true);
    setFormError(null);
    try {
      await requestReferralWithdrawal({
        userName: currentUser?.name || 'Foydalanuvchi',
        amount: balance,
        cardNumber: digits,
        cardOwner,
      });
      setSuccess(true);
      setShowForm(false);
      setCardNumber('');
      await load();
    } catch (err: any) {
      const msg = String(err?.message || '');
      setFormError(
        msg && !msg.toLowerCase().includes('firebase') && !msg.toLowerCase().includes('permission')
          ? msg
          : 'Soʻrovni yuborib boʻlmadi. Sahifani yangilab qayta urinib koʻring.'
      );
    } finally {
      setSending(false);
    }
  };

  // 1) Mehmon
  if (!currentUser) {
    return (
      <LockedCard
        title="Referal havolangizni olish uchun tizimga kiring"
        text="Referal dasturi Pro rejimi faol foydalanuvchilar uchun. Avval roʻyxatdan oʻting yoki hisobingizga kiring."
        buttonLabel="Roʻyxatdan oʻtish / Kirish"
        onClick={onOpenRegister}
      />
    );
  }

  // 2) Pro emas
  if (!hasPro) {
    return (
      <LockedCard
        title="Referal dasturi faqat Pro foydalanuvchilar uchun"
        text="Pro rejimni faollashtiring — shaxsiy havolangiz ochiladi va har bir Pro olgan doʻstingiz uchun 29 000 soʻm mukofot olasiz."
        buttonLabel="Pro rejimga oʻtish"
        onClick={onOpenProModal}
      />
    );
  }

  // 3) Pro foydalanuvchi paneli
  return (
    <div
      id="referral-dashboard"
      className="bg-white dark:bg-[#1A1A24] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-8 shadow-sm mb-10 space-y-6"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-pink-500" />
        <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-white">
          Mening referal panelim
        </h2>
      </div>

      {/* Havola */}
      <div>
        <label className="text-xs font-heading font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Shaxsiy havolangiz
        </label>
        <div className="mt-2 flex flex-col sm:flex-row gap-2">
          <div className="flex-1 min-w-0 min-h-[48px] px-4 flex items-center rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-mono text-sm text-slate-800 dark:text-slate-100 overflow-hidden">
            <span className="truncate select-all">{link}</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 sm:flex-none min-h-[48px] px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-heading font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Nusxalandi' : 'Nusxalash'}
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="flex-1 sm:flex-none min-h-[48px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-heading font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Share2 className="w-4 h-4" />
              Ulashish
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Doʻstingiz shu havola orqali roʻyxatdan oʻtib, birinchi marta Pro rejimni olsa — balansingizga 29 000 soʻm qoʻshiladi.
        </p>
      </div>

      {/* Statistika */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={<Users className="w-4 h-4" />} label="Taklif qilinganlar" value={String(stats.invited)} />
        <Stat icon={<BadgeCheck className="w-4 h-4" />} label="Pro olganlar" value={String(stats.paid)} />
        <Stat icon={<Wallet className="w-4 h-4" />} label="Jami ishlangan" value={som(earnedTotal)} />
        <Stat icon={<Wallet className="w-4 h-4" />} label="Balans" value={som(balance)} highlight />
      </div>

      {/* Yechib olish */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="font-heading font-bold text-slate-900 dark:text-white">Mukofotni kartaga yechib olish</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kamida 29 000 soʻm. Pul 1–3 ish kuni ichida kartangizga oʻtkaziladi.
            </div>
          </div>
          {!showForm && (
            <button
              type="button"
              disabled={!canWithdraw}
              onClick={() => {
                setShowForm(true);
                setSuccess(false);
                setFormError(null);
                if (!cardOwner) setCardOwner(currentUser?.name || '');
              }}
              className="min-h-[48px] px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-heading font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CreditCard className="w-4 h-4" />
              {som(balance)} yechib olish
            </button>
          )}
        </div>

        {hasPending && (
          <div className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
            <Clock className="w-4 h-4 shrink-0" />
            Soʻrovingiz koʻrib chiqilmoqda. Toʻlangach, bildirishnoma keladi.
          </div>
        )}
        {success && !hasPending && (
          <div className="text-sm text-emerald-700 dark:text-emerald-300">Soʻrov yuborildi ✅</div>
        )}
        {!hasPending && balance < REFERRAL_MIN_WITHDRAWAL && (
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Yechib olish uchun yana {som(REFERRAL_MIN_WITHDRAWAL - balance)} kerak.
          </div>
        )}

        {showForm && (
          <form onSubmit={handleWithdraw} className="space-y-3 pt-1">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="cc-number"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardInput(e.target.value))}
              placeholder="Karta raqami: 8600 0000 0000 0000"
              className="w-full min-h-[48px] px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-base text-slate-900 dark:text-white outline-none focus:border-emerald-400"
            />
            <input
              type="text"
              autoComplete="cc-name"
              value={cardOwner}
              onChange={(e) => setCardOwner(e.target.value)}
              placeholder="Karta egasi (ism familiya)"
              className="w-full min-h-[48px] px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-base text-slate-900 dark:text-white outline-none focus:border-emerald-400"
            />
            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-sm text-rose-700 dark:text-rose-300">
                {formError}
              </div>
            )}
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={sending}
                className="min-h-[48px] px-5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-heading font-bold cursor-pointer disabled:opacity-50"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={sending}
                className="min-h-[48px] px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-heading font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                {som(balance)} yuborish
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Tarix */}
      {withdrawals.length > 0 && (
        <div>
          <div className="text-xs font-heading font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Yechib olishlar tarixi
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {withdrawals.map((w) => (
              <div key={w.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <div className="font-mono font-bold text-slate-900 dark:text-white">{som(w.amount)}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {maskCard(w.cardNumber)} · {new Date(w.createdAtMillis).toLocaleDateString('ru-RU')}
                  </div>
                  {w.status === 'rejected' && w.rejectionReason && (
                    <div className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">{w.rejectionReason}</div>
                  )}
                </div>
                <StatusPill status={w.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Stat: React.FC<{ icon: React.ReactNode; label: string; value: string; highlight?: boolean }> = ({
  icon,
  label,
  value,
  highlight,
}) => (
  <div
    className={`p-3.5 sm:p-4 rounded-2xl border ${
      highlight
        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
    }`}
  >
    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
      {icon}
      <span>{label}</span>
    </div>
    <div
      className={`mt-1 font-mono font-extrabold text-lg sm:text-xl ${
        highlight ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-900 dark:text-white'
      }`}
    >
      {value}
    </div>
  </div>
);

const StatusPill: React.FC<{ status: ReferralWithdrawal['status'] }> = ({ status }) => {
  if (status === 'paid') {
    return (
      <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
        <CheckCircle2 className="w-3.5 h-3.5" /> Toʻlandi
      </span>
    );
  }
  if (status === 'rejected') {
    return (
      <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-bold">
        <XCircle className="w-3.5 h-3.5" /> Rad etildi
      </span>
    );
  }
  return (
    <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-bold">
      <Clock className="w-3.5 h-3.5" /> Kutilmoqda
    </span>
  );
};

const LockedCard: React.FC<{ title: string; text: string; buttonLabel: string; onClick: () => void }> = ({
  title,
  text,
  buttonLabel,
  onClick,
}) => (
  <div
    id="referral-dashboard"
    className="bg-white dark:bg-[#1A1A24] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-sm mb-10 flex flex-col sm:flex-row sm:items-center gap-5"
  >
    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-pink-500 text-white flex items-center justify-center shrink-0 shadow-md">
      <Lock className="w-7 h-7" />
    </div>
    <div className="flex-1 min-w-0">
      <h2 className="font-heading font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white">{title}</h2>
      <p className="text-[15px] sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{text}</p>
    </div>
    <button
      type="button"
      onClick={onClick}
      className="min-h-[48px] px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-heading font-bold cursor-pointer shrink-0"
    >
      {buttonLabel}
    </button>
  </div>
);
