import React, { useCallback, useEffect, useState } from 'react';
import { fetchReferralStarsPage, setReferralStarVideoAdmin, setReferralStarHiddenAdmin, ReferralStar } from '../firebase';

const fmt = (n: number) => Math.round(n).toLocaleString('ru-RU').replace(/,/g, ' ');

/** Admin: referal sahifasidagi blogerlar — video qo'shish va yashirish */
export const AdminReferralStars: React.FC = () => {
  const [stars, setStars] = useState<ReferralStar[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    fetchReferralStarsPage({ includeHidden: true })
      .then((d) => setStars(d.stars))
      .catch((e) => { setStars([]); setMsg(`Yuklab bo'lmadi: ${e?.message || e}`); });
  }, []);
  useEffect(() => { load(); }, [load]);

  const run = async (uid: string, fn: () => Promise<void>, ok: string) => {
    setBusy(uid); setMsg('');
    try { await fn(); setMsg(ok); load(); } catch (e: any) { setMsg(`Xatolik: ${e?.message || e}`); } finally { setBusy(null); }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
      <div>
        <h3 className="m-0 font-heading font-extrabold text-lg text-slate-900">Referal sahifasi: Collabix'ni reklama qilgan blogerlar</h3>
        <p className="m-0 mt-1 text-sm text-slate-600">
          Havolasi orqali kamida bitta odam kelgan har bir bloger{' '}
          <a href="#referal-blogerlar" target="_blank" rel="noopener noreferrer" className="underline font-bold text-indigo-700">referal sahifasida</a>{' '}
          avtomatik chiqadi. Bu yerda uning videosini (Instagram Reels yoki YouTube havolasi) qo'shasiz yoki sahifadan yashirasiz.
        </p>
      </div>
      {msg && <div className="text-sm font-semibold text-slate-700">{msg}</div>}
      {stars === null ? (
        <div className="h-24 rounded-xl bg-slate-100 animate-pulse" />
      ) : stars.length === 0 ? (
        <div className="text-sm text-slate-500">Hozircha hech kimning havolasi orqali odam kelmagan.</div>
      ) : (
        <ul className="list-none m-0 p-0 divide-y divide-slate-100 border border-slate-200 rounded-xl">
          {stars.map((s, i) => (
            <li key={s.uid} className={`p-3 grid gap-2 sm:grid-cols-[minmax(160px,1fr)_minmax(220px,2fr)_auto] sm:items-center ${s.hidden ? 'bg-slate-50 opacity-70' : ''}`}>
              <div className="min-w-0">
                <div className="font-bold text-sm text-slate-900 truncate">{i + 1}. {s.name}{s.hidden ? ' · yashirilgan' : ''}</div>
                <div className="text-xs text-slate-500">{s.invited} kishi keldi · topgan {fmt(s.earned)} so'm</div>
              </div>
              <label className="block">
                <span className="sr-only">{s.name} videosi</span>
                <input
                  key={`${s.uid}-${s.video}`}
                  defaultValue={s.video}
                  onBlur={(e) => { const v = e.target.value.trim(); if (v !== s.video) run(s.uid, () => setReferralStarVideoAdmin(s.uid, v), v ? 'Video saqlandi ✓' : "Video o'chirildi"); }}
                  placeholder="https://www.instagram.com/reel/... (ixtiyoriy)"
                  className="w-full min-h-[44px] px-3 rounded-lg border border-slate-300 text-sm"
                />
              </label>
              <button
                type="button"
                disabled={busy === s.uid}
                onClick={() => run(s.uid, () => setReferralStarHiddenAdmin(s.uid, !s.hidden), s.hidden ? "Sahifada ko'rsatiladi" : 'Sahifadan yashirildi')}
                className={`min-h-[44px] px-3 rounded-lg text-xs font-bold cursor-pointer border ${s.hidden ? 'border-emerald-300 text-emerald-700' : 'border-rose-300 text-rose-700'}`}
              >
                {s.hidden ? "Ko'rsatish" : 'Yashirish'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
