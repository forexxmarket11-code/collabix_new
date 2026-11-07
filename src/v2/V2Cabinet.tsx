import React, { useEffect, useMemo, useState } from 'react';
import { BriefData, BriefApplication, UserSession, NotificationItem } from '../types';
import { backfillAcceptedCreatorIds, markAllNotificationsAsReadInFirestore } from '../firebase';
import type { WorkflowAction } from '../firebase';
import { Avatar, Pill, Icon, budgetText, btn, appStatus, isBriefOpen, reviewState, timeAgo, go } from './ui';
import { ReviewBanner } from './V2Applications';
import { CATEGORY_LIST } from './V2Home';
import { WorkflowPanel, WorkflowSteps, wfStage, wfNeedsBrand, WF_STAGE_LABEL } from './Workflow';

interface CabinetProps {
  currentUser: UserSession;
  briefs: BriefData[];
  onRespond: (brief: BriefData, app: BriefApplication, status: 'qabul_qilindi' | 'rad_etildi', reason?: string) => Promise<void>;
  onWorkflow: (brief: BriefData, app: BriefApplication, action: WorkflowAction) => Promise<void>;
  onContactCreator: (app: BriefApplication) => void;
  onOpenCreator: (creatorId: string) => void;
  onOpenPro: () => void;
  onOpenEditProfile: () => void;
  notifications: NotificationItem[];
  onResubmit: () => Promise<void>;
  onCloseBrief: (brief: BriefData) => Promise<void>;
}

type Tab = 'home' | 'projects' | 'analytics' | 'notif';
const num = (v: unknown) => Number(String(v ?? '').replace(/[^\d]/g, '')) || 0;
const fmt = (n: number) => Math.round(n).toLocaleString('ru-RU').replace(/,/g, ' ');

export const V2Cabinet: React.FC<CabinetProps> = ({ currentUser, briefs, onRespond, onWorkflow, onContactCreator, onOpenCreator, onOpenEditProfile, notifications, onResubmit, onCloseBrief }) => {
  const mine = useMemo(() => briefs.filter((b) => b.brandId === currentUser.uid || b.ownerId === currentUser.uid), [briefs, currentUser.uid]);
  const [tab, setTab] = useState<Tab>('home');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'wait' | 'ok' | 'no'>('wait');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  // Avval qabul qilingan blogerlar ham ish bosqichlarini yubora olishi uchun
  useEffect(() => {
    mine.forEach((b) => { backfillAcceptedCreatorIds(b).catch(() => {}); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mine.map((b) => `${b.id}:${(b.applications || []).filter((a) => appStatus(a) === 'ok').length}:${(b.acceptedCreatorIds || []).length}`).join('|')]);

  const selected = mine.find((b) => b.id === selectedId) || mine[0] || null;
  const pairs = useMemo(() => mine.flatMap((b) => (b.applications || []).map((a) => ({ brief: b, app: a }))), [mine]);
  const newApps = pairs.filter((p) => appStatus(p.app) === 'wait');
  const working = pairs.filter((p) => appStatus(p.app) === 'ok');
  const needMe = working.filter((p) => wfNeedsBrand(p.app));
  const posted = working.filter((p) => wfStage(p.app) === 'done');
  const totalViews = posted.reduce((s, p) => s + (p.app.workflow?.reels?.views || 0), 0);
  const approved = reviewState(currentUser) === 'approved';

  const apps = (selected?.applications || []).filter((a) => appStatus(a) === filter);
  const cnt = (s: 'wait' | 'ok' | 'no') => (selected?.applications || []).filter((a) => appStatus(a) === s).length;

  const openProject = (briefId: string, f: 'wait' | 'ok') => {
    setSelectedId(briefId);
    setFilter(f);
    setTab('projects');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const respond = async (app: BriefApplication, status: 'qabul_qilindi' | 'rad_etildi', why?: string) => {
    if (!selected) return;
    setBusyId(app.id);
    setError('');
    try {
      await onRespond(selected, app, status, why);
      setRejecting(null);
      setReason('');
    } catch {
      setError("Javob saqlanmadi. Qayta urinib ko'ring.");
    } finally {
      setBusyId(null);
    }
  };

  const unread = notifications.filter((n) => !n.read).length;
  const NAV: [Tab | 'profile', string, number?][] = [
    ['home', 'Asosiy', needMe.length + newApps.length || undefined],
    ['projects', 'Reklama loyihalari'],
    ['analytics', 'Analitika'],
    ['notif', 'Bildirishnomalar', unread || undefined],
    ['profile', 'Brend profili'],
  ];
  const navClick = (id: Tab | 'profile') => {
    if (id === 'profile') return onOpenEditProfile();
    setTab(id);
  };

  /* ------------------------------ ASOSIY ------------------------------ */
  const homeView = (
    <>
      <div className="mt-5 grid gap-3 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[20px] bg-white border border-[#E6E3DC] p-4"><div className="text-[13px] text-[#5E5A6B] font-semibold">Ochiq e'lonlar</div><div className="v2-display font-extrabold text-[30px]">{mine.filter(isBriefOpen).length}</div></div>
        <div className="rounded-[20px] bg-[#C8F169] p-4"><div className="text-[13px] font-bold">Yangi arizalar</div><div className="v2-display font-extrabold text-[30px]">{newApps.length}</div></div>
        <div className="rounded-[20px] bg-white border border-[#E6E3DC] p-4"><div className="text-[13px] text-[#5E5A6B] font-semibold">Ishdagi blogerlar</div><div className="v2-display font-extrabold text-[30px]">{working.length}</div></div>
        <div className="rounded-[20px] bg-[#14121C] text-white p-4"><div className="text-[13px] text-[#BDB8CC] font-semibold">Jami ko'rishlar</div><div className="v2-display font-extrabold text-[30px]">{fmt(totalViews)}</div></div>
      </div>

      <section className="mt-6 rounded-[28px] bg-white border border-[#E6E3DC] overflow-hidden">
        <div className="px-5 sm:px-7 py-5 border-b border-[#EEECE6] flex items-center justify-between gap-3">
          <h2 className="v2-display m-0 font-extrabold text-[22px] tracking-[-0.5px]">Tasdig'ingizni kutmoqda</h2>
          <Pill tone={needMe.length + newApps.length ? 'amber' : 'gray'}>{needMe.length + newApps.length}</Pill>
        </div>
        {needMe.length + newApps.length === 0 ? (
          <div className="px-7 py-10 text-center text-[#5E5A6B]">Hozircha hammasi ko'rib chiqilgan. Yangi ariza, ssenariy yoki draft kelsa shu yerda chiqadi.</div>
        ) : (
          [...needMe.map((p) => ({ ...p, label: WF_STAGE_LABEL[wfStage(p.app)], f: 'ok' as const })), ...newApps.map((p) => ({ ...p, label: 'Yangi ariza', f: 'wait' as const }))].map(({ brief, app, label, f }) => (
            <div key={`${brief.id}-${app.id}`} className="px-5 sm:px-7 py-4 border-b border-[#EEECE6] last:border-b-0 flex flex-wrap items-center gap-3">
              <Avatar name={app.creatorName} src={app.creatorAvatar} size={44} round />
              <div className="flex-[999_1_200px] min-w-0">
                <div className="font-bold truncate">{app.creatorName}</div>
                <div className="text-[13px] text-[#5E5A6B] truncate">{brief.taskTitle}</div>
              </div>
              <Pill tone={f === 'wait' ? 'lime' : 'amber'}>{label}</Pill>
              <button type="button" onClick={() => openProject(brief.id, f)} className={btn.dark}>Ko'rish {Icon.arrow(14)}</button>
            </div>
          ))
        )}
      </section>

      {working.length === 0 && (
        <section className="mt-6 rounded-[28px] bg-white border border-[#E6E3DC] p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="v2-display m-0 font-extrabold text-[22px] tracking-[-0.5px]">Loyiha qanday o'tadi</h2>
            <Pill>Namuna</Pill>
          </div>
          <p className="mt-1.5 mb-4 text-[14px] text-[#5E5A6B]">Blogerni qabul qilganingizdan keyin har bir ish shu bosqichlardan o'tadi. Hech narsa tasdig'ingizsiz joylanmaydi.</p>
          <WorkflowSteps sample />
          <div className="mt-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] p-4 text-[14px]">
            <div className="font-bold">Yangi ssenariy — tasdig'ingizni kutmoqda</div>
            <div className="mt-1">"15 daqiqada kechki ovqat tayyorlaymiz. Asosiy sirini oxirida aytaman."</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="min-h-[40px] px-4 rounded-xl bg-[#15803D] text-white font-bold text-[14px] inline-flex items-center gap-1.5 opacity-80">{Icon.check(16)} Tasdiqlash</span>
              <span className="min-h-[40px] px-4 rounded-xl border-[1.5px] border-[#FECACA] bg-white text-[#991B1B] font-bold text-[14px] inline-flex items-center opacity-80">Rad etish</span>
            </div>
          </div>
        </section>
      )}
    </>
  );

  /* ---------------------------- ANALITIKA ---------------------------- */
  const spent = posted.reduce((s, p) => s + (num(p.app.proposedPrice) || (p.brief.priceUnit === 'per_reels' ? num(p.brief.budgetMin || p.brief.budgetMax) : 0)), 0);
  const analyticsView = (
    <>
      <div className="mt-5 grid gap-3 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[20px] bg-[#14121C] text-white p-4"><div className="text-[13px] text-[#BDB8CC] font-semibold">Jami ko'rishlar</div><div className="v2-display font-extrabold text-[30px]">{fmt(totalViews)}</div></div>
        <div className="rounded-[20px] bg-white border border-[#E6E3DC] p-4"><div className="text-[13px] text-[#5E5A6B] font-semibold">Joylangan Reels</div><div className="v2-display font-extrabold text-[30px]">{posted.length}</div></div>
        <div className="rounded-[20px] bg-white border border-[#E6E3DC] p-4"><div className="text-[13px] text-[#5E5A6B] font-semibold">O'rtacha ko'rish</div><div className="v2-display font-extrabold text-[30px]">{posted.length ? fmt(totalViews / posted.length) : 0}</div></div>
        <div className="rounded-[20px] bg-[#C8F169] p-4"><div className="text-[13px] font-bold">1 000 ko'rish narxi</div><div className="v2-display font-extrabold text-[30px]">{spent && totalViews ? `${fmt((spent / totalViews) * 1000)}` : '—'}</div><div className="text-[12px] font-semibold">{spent && totalViews ? "so'm (taxminan)" : 'narx kiritilmagan'}</div></div>
      </div>
      <section className="mt-6 rounded-[28px] bg-white border border-[#E6E3DC] overflow-hidden">
        <div className="px-5 sm:px-7 py-5 border-b border-[#EEECE6]"><h2 className="v2-display m-0 font-extrabold text-[22px] tracking-[-0.5px]">Blogerlar bo'yicha</h2></div>
        {working.length === 0 ? (
          <div className="px-7 py-10 text-center text-[#5E5A6B]">Blogerni qabul qilganingizdan keyin natijalar shu yerda chiqadi.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-[14px] border-collapse">
              <thead><tr className="text-left text-[#5E5A6B]"><th className="px-5 sm:px-7 py-3 font-semibold">Bloger</th><th className="px-3 py-3 font-semibold">E'lon</th><th className="px-3 py-3 font-semibold">Bosqich</th><th className="px-3 py-3 font-semibold text-right">Ko'rishlar</th><th className="px-5 sm:px-7 py-3 font-semibold text-right">Reels</th></tr></thead>
              <tbody>
                {working.map(({ brief, app }) => {
                  const st = wfStage(app);
                  const r = app.workflow?.reels;
                  return (
                    <tr key={`${brief.id}-${app.id}`} className="border-t border-[#EEECE6]">
                      <td className="px-5 sm:px-7 py-3"><div className="flex items-center gap-2.5"><Avatar name={app.creatorName} src={app.creatorAvatar} size={34} round /><span className="font-bold">{app.creatorName}</span></div></td>
                      <td className="px-3 py-3 max-w-[220px] truncate">{brief.taskTitle}</td>
                      <td className="px-3 py-3"><Pill tone={st === 'done' ? 'green' : wfNeedsBrand(app) ? 'amber' : 'gray'}>{WF_STAGE_LABEL[st]}</Pill></td>
                      <td className="px-3 py-3 text-right font-extrabold">{r ? fmt(r.views || 0) : '—'}</td>
                      <td className="px-5 sm:px-7 py-3 text-right">{r ? <a href={/^https?:/i.test(r.url) ? r.url : `https://${r.url}`} target="_blank" rel="noopener noreferrer" className="font-bold text-[#4329D9] underline">Ochish</a> : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <p className="mt-3 text-[13px] text-[#5E5A6B]">Ko'rishlar sonini bloger o'zi kiritadi. 1 000 ko'rish narxi blogerning taklif narxidan hisoblanadi.</p>
    </>
  );

  /* ------------------------- REKLAMA LOYIHALARI ------------------------- */
  const projectsView = mine.length === 0 ? (
    <div className="mt-7 rounded-[28px] border border-dashed border-[#D6D2C8] bg-white/60 py-14 px-6 text-center">
      <div className="v2-display font-extrabold text-[24px]">Hali e'lon joylamagansiz</div>
      <p className="mt-2 mb-5 text-[#5E5A6B]">Birinchi e'loningizni joylang — blogerlar o'zi ariza yuboradi.</p>
      <a href="#yangi-elon" className={btn.violet}>{Icon.plus()} E'lon joylash</a>
      {!approved && <p className="mt-4 mb-0 text-[13px] text-[#5E5A6B]">Eslatma: e'lon joylash uchun profil admin tomonidan tasdiqlangan bo'lishi kerak.</p>}
    </div>
  ) : (
    <>
      <div className="mt-6 flex gap-2.5 overflow-x-auto pb-1">
        {mine.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setSelectedId(b.id)}
            className={`shrink-0 max-w-[280px] text-left rounded-2xl px-4 py-3 border cursor-pointer ${selected?.id === b.id ? 'bg-[#14121C] text-white border-[#14121C]' : 'bg-white border-[#E6E3DC]'}`}
          >
            <div className="font-bold text-[14px] truncate">{b.taskTitle}</div>
            <div className={`text-[12px] ${selected?.id === b.id ? 'text-[#BDB8CC]' : 'text-[#5E5A6B]'}`}>{(b.applications || []).length} ta ariza · {isBriefOpen(b) ? 'Ochiq' : 'Yopilgan'}</div>
          </button>
        ))}
      </div>
      {selected && (
        <section className="mt-4 rounded-[28px] bg-white border border-[#E6E3DC] overflow-hidden">
          <div className="px-5 sm:px-7 py-5 border-b border-[#EEECE6] flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[13px] text-[#5E5A6B] font-semibold">{(selected.formats || []).join(', ') || "E'lon"} · {budgetText(selected)} · {timeAgo(selected)}</div>
              <a href={`#elon-${encodeURIComponent(selected.id)}`} className="v2-display block font-extrabold text-[22px] sm:text-[26px] tracking-[-0.5px] hover:text-[#5B3DF5]">{selected.taskTitle}</a>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-1.5 p-1.5 rounded-2xl bg-[#F1F0EC] text-[14px]">
                {([['wait', 'Yangi'], ['ok', 'Ishda'], ['no', 'Rad']] as const).map(([id, label]) => (
                  <button key={id} type="button" onClick={() => setFilter(id)} className={`min-h-[40px] px-3.5 rounded-xl cursor-pointer ${filter === id ? 'bg-white font-bold shadow-sm' : 'font-semibold text-[#5E5A6B]'}`}>
                    {label} ({cnt(id)})
                  </button>
                ))}
              </div>
              {isBriefOpen(selected) && <button type="button" onClick={() => onCloseBrief(selected)} className={btn.ghost}>E'lonni yopish</button>}
            </div>
          </div>
          {error && <div className="px-7 pt-4 text-[14px] text-[#B91C1C]">{error}</div>}
          {apps.length === 0 ? (
            <div className="px-7 py-12 text-center text-[#5E5A6B]">
              {filter === 'wait' ? "Yangi ariza yo'q. Blogerlar ariza yuborishi bilan shu yerda ko'rinadi." : filter === 'ok' ? "Hali hech kimni qabul qilmagansiz." : "Bu bo'limda ariza yo'q."}
            </div>
          ) : (
            apps.map((a) => {
              const st = appStatus(a);
              return (
                <div key={a.id} className="px-5 sm:px-7 py-5 border-b border-[#EEECE6] last:border-b-0">
                  <div className="flex flex-wrap gap-4 items-center">
                    <Avatar name={a.creatorName} src={a.creatorAvatar} size={56} round />
                    <div className="flex-[999_1_260px] min-w-0">
                      <div className="font-bold text-[17px]">{a.creatorName}</div>
                      <div className="text-[14px] text-[#5E5A6B]">{a.creatorHandle || ''}{a.proposedPrice ? ` · Taklif: ${a.proposedPrice} so'm` : ''}</div>
                      {st !== 'ok' && a.message && <div className="mt-1.5 text-[14px] text-[#3E3A4A] whitespace-pre-line break-words">"{a.message}"</div>}
                      {st === 'no' && a.rejectionReason && <div className="mt-1.5 text-[13px] text-[#991B1B]">Rad etish sababi: {a.rejectionReason}</div>}
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <button type="button" onClick={() => onOpenCreator(a.creatorId)} className={btn.ghost}>Profil</button>
                      {st === 'wait' && (
                        <>
                          <button type="button" disabled={busyId === a.id} onClick={() => { setRejecting(a.id); setReason(''); }} className="min-h-[44px] px-4 rounded-xl border-[1.5px] border-[#FECACA] bg-white text-[#991B1B] font-bold text-[14px] cursor-pointer">Rad etish</button>
                          <button type="button" disabled={busyId === a.id} onClick={() => respond(a, 'qabul_qilindi')} className="min-h-[44px] px-4 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white font-bold text-[14px] inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
                            {Icon.check(16)} {busyId === a.id ? '...' : 'Qabul qilish'}
                          </button>
                        </>
                      )}
                      {st === 'ok' && <button type="button" onClick={() => onContactCreator(a)} className={btn.dark}>{Icon.chat(16)} Yozish</button>}
                      {st === 'no' && <Pill tone="red">Rad etildi</Pill>}
                    </div>
                  </div>
                  {st === 'ok' && <WorkflowPanel app={a} role="brand" onAction={(act) => onWorkflow(selected, a, act)} />}
                  {rejecting === a.id && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <label className="flex-[999_1_260px]">
                        <span className="v2-sr">Rad etish sababi</span>
                        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Sabab (ixtiyoriy): masalan, boshqa bloger tanlandi" className="w-full box-border min-h-[44px] px-3.5 rounded-xl border border-[#FECACA] outline-none focus:border-[#B91C1C]" />
                      </label>
                      <button type="button" onClick={() => setRejecting(null)} className={btn.ghost}>Bekor</button>
                      <button type="button" disabled={busyId === a.id} onClick={() => respond(a, 'rad_etildi', reason.trim() || 'Boshqa nomzod tanlandi')} className="min-h-[44px] px-4 rounded-xl bg-[#B91C1C] text-white font-bold cursor-pointer disabled:opacity-60">Rad etishni tasdiqlash</button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </section>
      )}
    </>
  );

  const notifView = (
    <section className="mt-6 rounded-[28px] bg-white border border-[#E6E3DC] overflow-hidden">
      <div className="px-5 sm:px-7 py-4 border-b border-[#EEECE6] flex items-center justify-between gap-3">
        <div className="font-bold">{unread ? `${unread} ta o'qilmagan` : "Hammasi o'qilgan"}</div>
        {unread > 0 && <button type="button" onClick={() => { if (currentUser.uid) markAllNotificationsAsReadInFirestore(currentUser.uid).catch(() => {}); }} className={btn.ghost}>Hammasini o'qilgan qilish</button>}
      </div>
      {notifications.length === 0 ? (
        <div className="px-7 py-10 text-center text-[#5E5A6B]">Bildirishnomalar yo'q.</div>
      ) : (
        [...notifications].sort((a, b) => (Number(b.createdAtMillis) || Date.parse(b.createdAt) || 0) - (Number(a.createdAtMillis) || Date.parse(a.createdAt) || 0)).slice(0, 50).map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => { const b = mine.find((x) => x.id === n.briefId); if (b) openProject(b.id, n.type === 'ariza_keldi' ? 'wait' : 'ok'); }}
            className={`w-full text-left px-5 sm:px-7 py-4 border-b border-[#EEECE6] last:border-b-0 flex gap-3 items-start cursor-pointer hover:bg-[#FAFAF7] ${n.read ? '' : 'bg-[#F5F3FF]'}`}
          >
            <span className={`mt-1.5 w-2.5 h-2.5 shrink-0 rounded-full ${n.read ? 'bg-[#D6D2C8]' : 'bg-[#5B3DF5]'}`} />
            <span className="min-w-0">
              <span className="block font-bold">{n.title}</span>
              <span className="block text-[14px] text-[#3E3A4A]">{n.message}</span>
              <span className="block mt-0.5 text-[12px] text-[#8A8597]">{new Date(Number(n.createdAtMillis) || Date.parse(n.createdAt) || Date.now()).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
            </span>
          </button>
        ))
      )}
    </section>
  );

  const titles: Record<Tab, string> = { home: 'Asosiy', projects: 'Reklama loyihalari', analytics: 'Analitika', notif: 'Bildirishnomalar' };

  return (
    <div className="flex min-h-[calc(100vh-70px)]">
      <aside className="hidden md:flex w-[250px] shrink-0 bg-[#14121C] text-white px-5 py-7 flex-col gap-1.5">
        <div className="flex items-center gap-3 px-2 pb-5">
          <Avatar name={currentUser.name} src={currentUser.avatar} size={44} />
          <div className="min-w-0"><div className="font-bold truncate">{currentUser.name}</div><div className="text-[13px] text-[#BDB8CC]">Brend kabineti</div></div>
        </div>
        {NAV.map(([id, label, badge]) => (
          <button key={id} type="button" onClick={() => navClick(id)} className={`w-full min-h-[46px] px-3.5 rounded-xl font-semibold flex items-center gap-3 cursor-pointer text-left ${tab === id ? 'bg-[#2A2636] text-white' : 'text-[#BDB8CC] hover:text-white'}`}>
            {label}
            {badge ? <span className="ml-auto min-w-[24px] h-6 px-1.5 rounded-full bg-[#C8F169] text-[#14121C] text-[12px] font-extrabold inline-flex items-center justify-center">{badge}</span> : null}
          </button>
        ))}
        <div className="mt-5 rounded-2xl p-4 bg-[#5B3DF5]">
          <div className="font-extrabold text-[15px]">Brendlar uchun bepul</div>
          <div className="mt-0.5 text-[13px] text-[#E4DEFF]">E'lon joylash va arizalarni ko'rish — obunasiz</div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 px-4 sm:px-8 pt-6 md:pt-8 pb-16">
        {/* Telefon: bo'limlar */}
        <div className="md:hidden -mx-4 px-4 mb-4 flex gap-2 overflow-x-auto pb-1">
          {NAV.map(([id, label, badge]) => (
            <button key={id} type="button" onClick={() => navClick(id)} className={`shrink-0 min-h-[40px] px-3.5 rounded-full text-[14px] font-semibold border inline-flex items-center gap-1.5 cursor-pointer ${tab === id ? 'bg-[#14121C] text-white border-[#14121C]' : 'bg-white border-[#E6E3DC]'}`}>
              {label}
              {badge ? <span className="min-w-[20px] h-5 px-1 rounded-full bg-[#C8F169] text-[#14121C] text-[11px] font-extrabold inline-flex items-center justify-center">{badge}</span> : null}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[14px] text-[#5E5A6B] font-semibold">{tab === 'home' ? 'Xush kelibsiz,' : currentUser.name}</div>
            <h1 className="v2-display mt-0.5 mb-0 font-extrabold text-[30px] sm:text-[40px] tracking-[-1.4px] leading-[1.05]">{tab === 'home' ? currentUser.name : titles[tab]}</h1>
          </div>
          <a href="#yangi-elon" className={`${btn.violet} min-h-[52px]`}>{Icon.plus()} Yangi e'lon</a>
        </div>

        {tab === 'home' && <div className="mt-5"><ReviewBanner user={currentUser} onEdit={onOpenEditProfile} onResubmit={onResubmit} /></div>}
        {tab === 'home' ? homeView : tab === 'analytics' ? analyticsView : tab === 'notif' ? notifView : projectsView}
      </main>
    </div>
  );
};

/* ------------------------------- Yangi e'lon ------------------------------- */

interface NewBriefProps {
  currentUser: UserSession;
  onCreate: (brief: BriefData) => Promise<string | null>;
  onOpenPro: () => void;
}

const FORMATS = ['Reels', 'Story', 'Post', 'YouTube video', 'TikTok', 'Telegram post'];

export const V2NewBrief: React.FC<NewBriefProps> = ({ currentUser, onCreate, onOpenPro }) => {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [reqs, setReqs] = useState('');
  const [formats, setFormats] = useState<string[]>([]);
  const [cats, setCats] = useState<string[]>([]);
  const [payment, setPayment] = useState<'money' | 'barter'>('money');
  const [unit, setUnit] = useState<'total' | 'per_reels'>('per_reels');
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [barter, setBarter] = useState('');
  const [deadline, setDeadline] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const approved = reviewState(currentUser) === 'approved';
  const toggle = (list: string[], set: (v: string[]) => void, v: string) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  if (!approved) {
    return (
      <main className="max-w-[720px] mx-auto px-4 sm:px-6 py-16 text-center">
        <h1 className="v2-display m-0 font-extrabold text-[34px] tracking-[-1.2px]">E'lon joylash</h1>
        <p className="mt-3 text-[#5E5A6B]">Profilingiz admin tomonidan tasdiqlangach e'lon joylay olasiz. Odatda bir necha soat ichida.</p>
        <div className="mt-6"><a href="#kabinet" className={btn.ghost}>Kabinetga qaytish</a></div>
      </main>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (title.trim().length < 5) return setError("Sarlavhani yozing (kamida 5 belgi)");
    if (desc.trim().length < 20) return setError('Vazifani batafsilroq yozing (kamida 20 belgi)');
    if (formats.length === 0) return setError('Kamida bitta formatni tanlang');
    if (payment === 'money' && !min.replace(/[^\d]/g, '')) return setError('Byudjetni yozing');
    if (payment === 'barter' && barter.trim().length < 3) return setError('Barterda nima berishingizni yozing');
    setBusy(true);
    try {
      const brief: BriefData = {
        id: '',
        taskTitle: title.trim(),
        description: desc.trim(),
        requirementsSummary: reqs.trim(),
        formats,
        categories: cats,
        recipientType: 'open',
        paymentType: payment,
        ...(payment === 'money' ? { priceUnit: unit } : {}),
        budgetMin: payment === 'money' ? min.replace(/[^\d]/g, '') : '',
        budgetMax: payment === 'money' ? max.replace(/[^\d]/g, '') : '',
        barterDescription: payment === 'barter' ? barter.trim() : '',
        deadline: deadline.trim(),
        brandName: currentUser.name,
        brandAvatar: currentUser.avatar,
        brandId: currentUser.uid,
        ownerId: currentUser.uid,
        applications: [],
        status: 'open',
        createdAt: new Date().toISOString(),
        createdAtMillis: Date.now(),
      };
      const id = await onCreate(brief);
      if (id) go(`elon-${encodeURIComponent(id)}`);
      else setError("E'lon saqlanmadi. Qayta urinib ko'ring.");
    } catch {
      setError("E'lon saqlanmadi. Qayta urinib ko'ring.");
    } finally {
      setBusy(false);
    }
  };

  const field = 'mt-2 w-full box-border min-h-[52px] px-4 rounded-2xl border-2 border-[#E6E3DC] bg-white text-[16px] outline-none focus:border-[#5B3DF5]';
  const chip = (on: boolean) => `min-h-[44px] px-4 rounded-full font-semibold text-[15px] border-2 cursor-pointer ${on ? 'bg-[#5B3DF5] text-white border-[#5B3DF5]' : 'bg-white border-[#E6E3DC] hover:border-[#14121C]'}`;

  return (
    <main className="max-w-[860px] mx-auto px-4 sm:px-6 pt-6 pb-16">
      <a href="#kabinet" className="inline-flex items-center gap-2 min-h-[44px] font-semibold text-[#5E5A6B] hover:text-[#14121C]">{Icon.back()} Kabinet</a>
      <h1 className="v2-display mt-2 mb-0 font-extrabold text-[34px] sm:text-[44px] tracking-[-1.5px]">Yangi e'lon</h1>
      <p className="mt-2 mb-0 text-[#5E5A6B]">E'lon barcha tasdiqlangan blogerlarga ko'rinadi. Arizalarni kabinetingizda qabul yoki rad etasiz.</p>
      <form onSubmit={submit} className="mt-7 rounded-[28px] bg-white border border-[#E6E3DC] p-6 sm:p-9 flex flex-col gap-6">
        <label className="block font-bold">Sarlavha
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Masalan: Yangi krem uchun 1 ta Reels" className={field} />
        </label>
        <label className="block font-bold">Vazifa
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={5} placeholder="Nima qilish kerak, mahsulot nima, nimani ta'kidlash kerak?" className={`${field} py-3 resize-y`} />
        </label>
        <div>
          <div className="font-bold">Format</div>
          <div className="mt-2.5 flex flex-wrap gap-2">{FORMATS.map((f) => <button key={f} type="button" aria-pressed={formats.includes(f)} onClick={() => toggle(formats, setFormats, f)} className={chip(formats.includes(f))}>{f}</button>)}</div>
        </div>
        <div>
          <div className="font-bold">Kategoriya</div>
          <div className="mt-2.5 flex flex-wrap gap-2">{CATEGORY_LIST.map((c) => <button key={c} type="button" aria-pressed={cats.includes(c)} onClick={() => toggle(cats, setCats, c)} className={chip(cats.includes(c))}>{c}</button>)}</div>
        </div>
        <div>
          <div className="font-bold">To'lov turi</div>
          <div className="mt-2.5 flex gap-2">
            <button type="button" aria-pressed={payment === 'money'} onClick={() => setPayment('money')} className={chip(payment === 'money')}>Pul</button>
            <button type="button" aria-pressed={payment === 'barter'} onClick={() => setPayment('barter')} className={chip(payment === 'barter')}>Barter</button>
          </div>
          {payment === 'money' ? (
            <>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" aria-pressed={unit === 'per_reels'} onClick={() => setUnit('per_reels')} className={chip(unit === 'per_reels')}>Har bir Reels uchun</button>
              <button type="button" aria-pressed={unit === 'total'} onClick={() => setUnit('total')} className={chip(unit === 'total')}>Butun ish uchun</button>
            </div>
            <div className="mt-3 grid gap-3 grid-cols-2">
              <label className="block text-[14px] font-semibold">Byudjet (so'm)<input value={min} onChange={(e) => setMin(e.target.value)} inputMode="numeric" placeholder="500 000" className={field} /></label>
              <label className="block text-[14px] font-semibold">Gacha (ixtiyoriy)<input value={max} onChange={(e) => setMax(e.target.value)} inputMode="numeric" placeholder="1 000 000" className={field} /></label>
            </div>
            </>
          ) : (
            <label className="block mt-3 text-[14px] font-semibold">Evaziga nima berasiz?<input value={barter} onChange={(e) => setBarter(e.target.value)} placeholder="Masalan: 2 kishilik tushlik + sovg'a" className={field} /></label>
          )}
        </div>
        <label className="block font-bold">Muddat
          <input value={deadline} onChange={(e) => setDeadline(e.target.value)} placeholder="Masalan: 5 kun ichida" className={field} />
        </label>
        <label className="block font-bold">Blogerga talablar (ixtiyoriy)
          <textarea value={reqs} onChange={(e) => setReqs(e.target.value)} rows={3} placeholder="Masalan: kamida 10 ming obunachi, go'zallik yo'nalishi" className={`${field} py-3 resize-y`} />
        </label>
        {error && <div className="text-[15px] font-semibold text-[#B91C1C]">{error}</div>}
        <button type="submit" disabled={busy} className={`${btn.violet} min-h-[56px] text-[17px]`}>{busy ? 'Joylanmoqda...' : "E'lonni joylash"}</button>
      </form>
    </main>
  );
};
