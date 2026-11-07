import React, { useState } from 'react';
import { BriefApplication } from '../types';
import type { WorkflowAction } from '../firebase';
import { Icon, btn } from './ui';

export type WfStage = 'script' | 'script_wait' | 'draft' | 'draft_wait' | 'reels' | 'done';

/** Qabul qilingan arizaning hozirgi bosqichi */
export function wfStage(a: BriefApplication): WfStage {
  const w = a.workflow || {};
  if (w.reels?.url) return 'done';
  if (w.draft?.status === 'ok') return 'reels';
  if (w.draft?.status === 'wait') return 'draft_wait';
  if (w.draft?.status === 'no' || w.script?.status === 'ok') return 'draft';
  if (w.script?.status === 'wait') return 'script_wait';
  return 'script';
}

/** Brend javobini kutayotganmi */
export const wfNeedsBrand = (a: BriefApplication) => {
  const s = wfStage(a);
  return s === 'script_wait' || s === 'draft_wait';
};

export const WF_STAGE_LABEL: Record<WfStage, string> = {
  script: 'Ssenariy yozilmoqda',
  script_wait: 'Ssenariy tasdiq kutmoqda',
  draft: 'Video tayyorlanmoqda',
  draft_wait: 'Draft tasdiq kutmoqda',
  reels: 'Joylanishi kutilmoqda',
  done: 'Reels joylandi',
};

const STEPS = [
  ['Kelishildi', 'Ariza qabul qilindi'],
  ['Ssenariy', 'Bloger yozadi, brend tasdiqlaydi'],
  ['Draft', 'Video joylanishdan oldin'],
  ['Reels', 'Joylandi + ko\'rishlar'],
] as const;

const stepIndex = (s: WfStage) => (s === 'script' || s === 'script_wait' ? 1 : s === 'draft' || s === 'draft_wait' ? 2 : s === 'reels' ? 3 : 4);

export const WorkflowSteps: React.FC<{ app?: BriefApplication; sample?: boolean }> = ({ app, sample }) => {
  const idx = sample ? 2 : app ? stepIndex(wfStage(app)) : 0;
  const waiting = sample ? true : app ? wfNeedsBrand(app) : false;
  return (
    <ol className="m-0 p-0 list-none grid grid-cols-4 gap-1.5 sm:gap-2">
      {STEPS.map(([t, d], i) => {
        const done = i < idx;
        const cur = i === idx;
        return (
          <li key={t} className={`rounded-xl px-2 sm:px-3 py-2.5 ${done ? 'bg-[#DCFCE7] text-[#14532D]' : cur ? (waiting ? 'bg-[#FEF3C7] text-[#78350F]' : 'bg-[#EDE9FE] text-[#3B1FB8]') : 'bg-[#F1F0EC] text-[#8A8597]'}`}>
            <div className="flex items-center gap-1.5 font-extrabold text-[12px] sm:text-[14px]">
              <span className={`w-5 h-5 shrink-0 rounded-full inline-flex items-center justify-center text-[11px] text-white ${done ? 'bg-[#15803D]' : cur ? (waiting ? 'bg-[#D97706]' : 'bg-[#5B3DF5]') : 'bg-[#C9C5BC]'}`}>
                {done ? Icon.check(12) : i + 1}
              </span>
              <span className="truncate">{t}</span>
            </div>
            <div className="hidden sm:block mt-0.5 text-[12px] leading-snug opacity-80">{cur && waiting ? 'Tasdiqingizni kutmoqda' : d}</div>
          </li>
        );
      })}
    </ol>
  );
};

const input = 'w-full box-border min-h-[44px] px-3.5 rounded-xl border border-[#D6D2C8] bg-white outline-none focus:border-[#5B3DF5] text-[15px]';
const okBtn = 'min-h-[44px] px-4 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white font-bold text-[14px] inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60';
const noBtn = 'min-h-[44px] px-4 rounded-xl border-[1.5px] border-[#FECACA] bg-white text-[#991B1B] font-bold text-[14px] cursor-pointer disabled:opacity-60';

const safeUrl = (u?: string) => (u && /^https?:\/\//i.test(u) ? u : u ? `https://${u}` : '#');
const fmtViews = (n?: number) => (n || 0).toLocaleString('ru-RU').replace(/,/g, ' ');

interface PanelProps {
  app: BriefApplication;
  role: 'brand' | 'creator';
  onAction: (action: WorkflowAction) => Promise<void>;
}

export const WorkflowPanel: React.FC<PanelProps> = ({ app, role, onAction }) => {
  const st = wfStage(app);
  const w = app.workflow || {};
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [comment, setComment] = useState('');
  const [views, setViews] = useState('');
  const [note, setNote] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const run = async (a: WorkflowAction) => {
    setBusy(true);
    setErr('');
    try {
      await onAction(a);
      setText(''); setUrl(''); setComment(''); setViews(''); setNote(''); setRejecting(false);
    } catch (e: any) {
      const m = String(e?.message || e);
      setErr(/permission|RUXSAT/i.test(m) ? "Ruxsat yo'q. Admin Firebase qoidalarini yangilashi kerak." : "Saqlanmadi. Qayta urinib ko'ring.");
    } finally {
      setBusy(false);
    }
  };

  const box = (children: React.ReactNode, tone: 'gray' | 'amber' | 'red' | 'green' = 'gray') => (
    <div className={`rounded-2xl p-4 text-[14px] ${tone === 'amber' ? 'bg-[#FFFBEB] border border-[#FDE68A]' : tone === 'red' ? 'bg-[#FEF2F2] border border-[#FECACA]' : tone === 'green' ? 'bg-[#F0FDF4] border border-[#BBF7D0]' : 'bg-[#F6F5F1]'}`}>{children}</div>
  );

  const rejectRow = (kind: 'script_no' | 'draft_no') =>
    rejecting ? (
      <div className="mt-3 flex flex-wrap gap-2">
        <label className="flex-[999_1_240px]">
          <span className="v2-sr">Nimani tuzatish kerak</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nimani tuzatish kerak? (masalan: narxni oxirida ayting)" className={input} />
        </label>
        <button type="button" onClick={() => setRejecting(false)} className={btn.ghost}>Bekor</button>
        <button type="button" disabled={busy || note.trim().length < 3} onClick={() => run({ kind, note })} className="min-h-[44px] px-4 rounded-xl bg-[#B91C1C] text-white font-bold cursor-pointer disabled:opacity-60">Yuborish</button>
      </div>
    ) : null;

  const scriptView = w.script ? (
    <div className="mt-1 whitespace-pre-line break-words text-[#14121C]">"{w.script.text}"</div>
  ) : null;

  const draftView = w.draft ? (
    <div className="mt-1 flex flex-wrap items-center gap-2">
      <a href={safeUrl(w.draft.url)} target="_blank" rel="noopener noreferrer" className="font-bold text-[#4329D9] underline break-all">Videoni ochish</a>
      {w.draft.comment && <span className="text-[#5E5A6B]">— {w.draft.comment}</span>}
    </div>
  ) : null;

  let body: React.ReactNode = null;

  if (role === 'brand') {
    if (st === 'script') body = box(<><b>Bloger ssenariy yozmoqda.</b> Yuborgach shu yerda tasdiqlaysiz.{w.script?.status === 'no' && <div className="mt-1 text-[#991B1B]">Siz so'ragan tuzatish: {w.script.note}</div>}</>);
    if (st === 'script_wait') body = box(<>
      <div className="font-bold">Yangi ssenariy — tasdig'ingizni kutmoqda</div>
      {scriptView}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => run({ kind: 'script_ok' })} className={okBtn}>{Icon.check(16)} Tasdiqlash</button>
        {!rejecting && <button type="button" disabled={busy} onClick={() => setRejecting(true)} className={noBtn}>Rad etish</button>}
      </div>
      {rejectRow('script_no')}
    </>, 'amber');
    if (st === 'draft') body = box(<><b>Bloger videoni tayyorlamoqda.</b> Draft kelgach shu yerda ko'rasiz.{w.draft?.status === 'no' && <div className="mt-1 text-[#991B1B]">Siz so'ragan tuzatish: {w.draft.note}</div>}</>);
    if (st === 'draft_wait') body = box(<>
      <div className="font-bold">Yangi draft — joylanishdan oldin ko'rib chiqing</div>
      {draftView}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => run({ kind: 'draft_ok' })} className={okBtn}>{Icon.check(16)} Tasdiqlash</button>
        {!rejecting && <button type="button" disabled={busy} onClick={() => setRejecting(true)} className={noBtn}>Tuzatish kerak</button>}
      </div>
      {rejectRow('draft_no')}
    </>, 'amber');
    if (st === 'reels') body = box(<><b>Video tasdiqlandi.</b> Bloger joylagach Reels havolasi shu yerda chiqadi.</>, 'green');
  } else {
    if (st === 'script') body = box(<>
      <div className="font-bold">1-qadam: ssenariy yoki g'oyani yozing</div>
      {w.script?.status === 'no' && <div className="mt-1 text-[#991B1B]">Brend tuzatish so'radi: {w.script.note}</div>}
      <label className="block mt-2">
        <span className="v2-sr">Ssenariy</span>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="Masalan: 15 soniyada mahsulotni ochaman, asosiy afzalligini ko'rsataman, oxirida chegirma kodini aytaman." className={`${input} py-2.5 resize-y`} />
      </label>
      <button type="button" disabled={busy || text.trim().length < 10} onClick={() => run({ kind: 'script_send', text })} className={`${btn.violet} mt-2`}>Ssenariyni yuborish</button>
    </>, w.script?.status === 'no' ? 'red' : 'gray');
    if (st === 'script_wait') body = box(<><b>Ssenariy yuborildi — brend tasdig'ini kutmoqda.</b>{scriptView}</>, 'amber');
    if (st === 'draft') body = box(<>
      <div className="font-bold">2-qadam: videoni draft sifatida yuboring</div>
      {w.draft?.status === 'no' ? <div className="mt-1 text-[#991B1B]">Brend tuzatish so'radi: {w.draft.note}</div> : <div className="mt-1 text-[#5E5A6B]">Videoni hali joylamang. Google Drive yoki Telegram havolasini yuboring.</div>}
      <div className="mt-2 flex flex-col gap-2">
        <label><span className="v2-sr">Video havolasi</span><input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://drive.google.com/... yoki https://t.me/..." className={input} /></label>
        <label><span className="v2-sr">Izoh</span><input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Izoh (ixtiyoriy)" className={input} /></label>
      </div>
      <button type="button" disabled={busy || url.trim().length < 8} onClick={() => run({ kind: 'draft_send', url, comment })} className={`${btn.violet} mt-2`}>Draftni yuborish</button>
    </>, w.draft?.status === 'no' ? 'red' : 'gray');
    if (st === 'draft_wait') body = box(<><b>Draft yuborildi — brend ko'rib chiqmoqda.</b>{draftView}</>, 'amber');
    if (st === 'reels') body = box(<>
      <div className="font-bold">3-qadam: videoni joylang va havolasini yuboring</div>
      <div className="mt-2 flex flex-wrap gap-2">
        <label className="flex-[999_1_240px]"><span className="v2-sr">Reels havolasi</span><input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.instagram.com/reel/..." className={input} /></label>
        <label className="flex-[1_1_140px]"><span className="v2-sr">Ko'rishlar soni</span><input value={views} onChange={(e) => setViews(e.target.value.replace(/[^\d]/g, ''))} inputMode="numeric" placeholder="Ko'rishlar (hozir)" className={input} /></label>
      </div>
      <button type="button" disabled={busy || url.trim().length < 8} onClick={() => run({ kind: 'reels_send', url, views: Number(views) || 0 })} className={`${btn.violet} mt-2`}>Reels havolasini yuborish</button>
    </>, 'green');
  }

  if (st === 'done' && w.reels) {
    body = box(<>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-bold">Reels joylandi</div>
          <a href={safeUrl(w.reels.url)} target="_blank" rel="noopener noreferrer" className="font-bold text-[#4329D9] underline break-all">Reels'ni ochish</a>
        </div>
        <div className="text-right">
          <div className="v2-display font-extrabold text-[26px] leading-none">{fmtViews(w.reels.views)}</div>
          <div className="text-[12px] text-[#5E5A6B]">ko'rish{w.reels.viewsAt ? ` · ${new Date(w.reels.viewsAt).toLocaleDateString('ru-RU')}` : ''}</div>
        </div>
      </div>
      {role === 'creator' && (
        <div className="mt-3 flex flex-wrap gap-2">
          <label className="flex-[999_1_180px]"><span className="v2-sr">Yangi ko'rishlar soni</span><input value={views} onChange={(e) => setViews(e.target.value.replace(/[^\d]/g, ''))} inputMode="numeric" placeholder="Ko'rishlarni yangilash" className={input} /></label>
          <button type="button" disabled={busy || !views} onClick={() => run({ kind: 'views_update', views: Number(views) })} className={btn.dark}>Yangilash</button>
        </div>
      )}
    </>, 'green');
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      <WorkflowSteps app={app} />
      {body}
      {err && <div className="text-[14px] text-[#B91C1C]">{err}</div>}
    </div>
  );
};
