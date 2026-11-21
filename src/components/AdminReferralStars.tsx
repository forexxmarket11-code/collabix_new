import React, { useEffect, useMemo, useState } from 'react';
import { UserSession } from '../types';
import { subscribeReferralStarItems, saveReferralStarItemsAdmin, subscribeToUsersForAdmin, ReferralStarItem } from '../firebase';

/** Admin: "Collabix'ni reklama qilgan blogerlar" sahifasi uchun ro'yxat */
export const AdminReferralStars: React.FC = () => {
  const [items, setItems] = useState<ReferralStarItem[]>([]);
  const [users, setUsers] = useState<UserSession[]>([]);
  const [q, setQ] = useState('');
  const [pick, setPick] = useState<UserSession | null>(null);
  const [video, setVideo] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => subscribeReferralStarItems(setItems), []);
  useEffect(() => {
    return subscribeToUsersForAdmin((list) => setUsers(Array.isArray(list) ? list : []));
  }, []);

  const byId = useMemo(() => new Map(users.map((u) => [u.uid || '', u])), [users]);
  const found = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    return users
      .filter((u) => u.role !== 'brend' && [u.name, u.instagramHandle, (u.socialLinks as any)?.instagram, u.city].some((x) => String(x || '').toLowerCase().includes(s)))
      .slice(0, 8);
  }, [q, users]);

  const save = async (next: ReferralStarItem[], ok: string) => {
    setBusy(true); setMsg('');
    try { await saveReferralStarItemsAdmin(next); setMsg(ok); } catch (e: any) { setMsg(`Xatolik: ${e?.message || e}`); } finally { setBusy(false); }
  };

  const add = () => {
    if (!pick?.uid) { setMsg('Avval blogerni tanlang'); return; }
    if (items.some((x) => x.uid === pick.uid)) { setMsg("Bu bloger ro'yxatda bor"); return; }
    save([...items, { uid: pick.uid, video: video.trim() }], "Qo'shildi ✓");
    setPick(null); setQ(''); setVideo('');
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
      <div>
        <h3 className="m-0 font-heading font-extrabold text-lg text-slate-900">Referal sahifasi: video qilgan blogerlar</h3>
        <p className="m-0 mt-1 text-sm text-slate-600">
          Bu yerdagi blogerlar <a href="#referal-blogerlar" target="_blank" rel="noopener noreferrer" className="underline font-bold text-indigo-700">collabix.uz/#referal-blogerlar</a> sahifasida videosi va referal daromadi bilan chiqadi. Faqat <b>roziligini olgan</b> blogerlarni qo'shing.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <div className="relative">
          <label className="block text-xs font-bold text-slate-700">Bloger
            <input value={pick ? pick.name || '' : q} onChange={(e) => { setPick(null); setQ(e.target.value); }} placeholder="Ism yoki @instagram" className="mt-1 w-full min-h-[44px] px-3 rounded-xl border border-slate-300 text-sm" />
          </label>
          {!pick && found.length > 0 && (
            <ul className="absolute z-10 left-0 right-0 mt-1 max-h-64 overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg list-none p-1 m-0">
              {found.map((u) => (
                <li key={u.uid}>
                  <button type="button" onClick={() => { setPick(u); setQ(''); }} className="w-full text-left min-h-[44px] px-3 rounded-lg hover:bg-slate-50 cursor-pointer text-sm">
                    <b>{u.name}</b> <span className="text-slate-500">{[u.city, `topgan: ${Number(u.referralEarnedTotal || 0).toLocaleString('ru-RU')}`].filter(Boolean).join(' · ')}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <label className="block text-xs font-bold text-slate-700">Video havolasi (Instagram Reels yoki YouTube)
          <input value={video} onChange={(e) => setVideo(e.target.value)} placeholder="https://www.instagram.com/reel/..." className="mt-1 w-full min-h-[44px] px-3 rounded-xl border border-slate-300 text-sm" />
        </label>
        <button type="button" disabled={busy} onClick={add} className="self-end min-h-[44px] px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-bold cursor-pointer">Qo'shish</button>
      </div>
      {msg && <div className="text-sm font-semibold text-slate-700">{msg}</div>}

      {items.length === 0 ? (
        <div className="text-sm text-slate-500">Hozircha hech kim qo'shilmagan — sahifada "Birinchi bo'ling!" yozuvi turadi.</div>
      ) : (
        <ul className="list-none m-0 p-0 divide-y divide-slate-100 border border-slate-200 rounded-xl">
          {items.map((it, i) => {
            const u = byId.get(it.uid);
            return (
              <li key={it.uid} className="p-3 flex flex-wrap items-center gap-2">
                <span className="font-bold text-sm text-slate-900 min-w-[120px]">{i + 1}. {u?.name || it.uid}</span>
                <span className="text-xs text-slate-500">topgan: {Number(u?.referralEarnedTotal || 0).toLocaleString('ru-RU')} so'm</span>
                <input
                  defaultValue={it.video}
                  onBlur={(e) => { const v = e.target.value.trim(); if (v !== it.video) save(items.map((x) => (x.uid === it.uid ? { ...x, video: v } : x)), 'Video yangilandi ✓'); }}
                  placeholder="Video havolasi"
                  className="flex-1 min-w-[200px] min-h-[40px] px-3 rounded-lg border border-slate-300 text-xs"
                />
                <button type="button" disabled={busy} onClick={() => save(items.filter((x) => x.uid !== it.uid), "Olib tashlandi")} className="min-h-[40px] px-3 rounded-lg border border-rose-300 text-rose-700 text-xs font-bold cursor-pointer">Olib tashlash</button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
