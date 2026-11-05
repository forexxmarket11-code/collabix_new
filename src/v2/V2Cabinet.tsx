import React, { useMemo, useState } from 'react';
import { BriefData, BriefApplication, UserSession } from '../types';
import { isUserPro } from '../utils/subscription';
import { Avatar, Pill, Icon, budgetText, btn, appStatus, isBriefOpen, reviewState, timeAgo, go } from './ui';
import { ReviewBanner } from './V2Applications';
import { CATEGORY_LIST } from './V2Home';

interface CabinetProps {
  currentUser: UserSession;
  briefs: BriefData[];
  onRespond: (brief: BriefData, app: BriefApplication, status: 'qabul_qilindi' | 'rad_etildi', reason?: string) => Promise<void>;
  onContactCreator: (app: BriefApplication) => void;
  onOpenCreator: (creatorId: string) => void;
  onOpenPro: () => void;
  onOpenEditProfile: () => void;
  onResubmit: () => Promise<void>;
  onCloseBrief: (brief: BriefData) => Promise<void>;
}

export const V2Cabinet: React.FC<CabinetProps> = ({ currentUser, briefs, onRespond, onContactCreator, onOpenCreator, onOpenPro, onOpenEditProfile, onResubmit, onCloseBrief }) => {
  const mine = useMemo(() => briefs.filter((b) => b.brandId === currentUser.uid || b.ownerId === currentUser.uid), [briefs, currentUser.uid]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'wait' | 'ok' | 'no'>('wait');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const selected = mine.find((b) => b.id === selectedId) || mine[0] || null;
  const allApps = mine.flatMap((b) => b.applications || []);
  const newApps = allApps.filter((a) => appStatus(a) === 'wait').length;
  const okApps = allApps.filter((a) => appStatus(a) === 'ok').length;
  const pro = isUserPro(currentUser);
  const approved = reviewState(currentUser) === 'approved';

  const apps = (selected?.applications || []).filter((a) => appStatus(a) === filter);
  const cnt = (s: 'wait' | 'ok' | 'no') => (selected?.applications || []).filter((a) => appStatus(a) === s).length;

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

  const nav = (label: string, active: boolean, onClick: () => void, badge?: number) => (
    <button type="button" onClick={onClick} className={`w-full min-h-[46px] px-3.5 rounded-xl font-semibold flex items-center gap-3 cursor-pointer text-left ${active ? 'bg-[#2A2636] text-white' : 'text-[#BDB8CC] hover:text-white'}`}>
      {label}
      {badge ? <span className="ml-auto min-w-[24px] h-6 px-1.5 rounded-full bg-[#C8F169] text-[#14121C] text-[12px] font-extrabold inline-flex items-center justify-center">{badge}</span> : null}
    </button>
  );

  return (
    <div className="flex flex-wrap min-h-[calc(100vh-70px)]">
      <aside className="flex-[1_1_250px] max-w-full min-w-0 bg-[#14121C] text-white px-5 py-7 flex flex-col gap-1.5">
        <div className="flex items-center gap-3 px-2 pb-5">
          <Avatar name={currentUser.name} src={currentUser.avatar} size={44} />
          <div className="min-w-0"><div className="font-bold truncate">{currentUser.name}</div><div className="text-[13px] text-[#BDB8CC]">Brend kabineti</div></div>
        </div>
        {nav("E'lonlarim", true, () => {}, undefined)}
        {nav('Yangi arizalar', false, () => setFilter('wait'), newApps)}
        {nav('Brend profili', false, onOpenEditProfile)}
        {nav('Xabarlar', false, () => go('xabarlar'))}
        <div className={`mt-5 rounded-2xl p-4 ${pro ? 'bg-[#5B3DF5]' : 'bg-[#2A2636]'}`}>
          <div className="font-extrabold text-[15px]">{pro ? 'Brend Pro faol' : 'Brend Pro yoqilmagan'}</div>
          <div className="mt-0.5 text-[13px] text-[#E4DEFF]">{pro && currentUser.trialEndDate ? `${new Date(currentUser.trialEndDate).toLocaleDateString('ru-RU')} gacha · 99 000 so'm/oy` : "99 000 so'm/oy — e'lon joylash uchun"}</div>
          {!pro && <button type="button" onClick={onOpenPro} className={`${btn.lime} mt-3 w-full`}>Pro'ni yoqish</button>}
        </div>
      </aside>

      <main className="flex-[999_1_640px] min-w-0 px-4 sm:px-8 pt-8 pb-16">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[14px] text-[#5E5A6B] font-semibold">Xush kelibsiz,</div>
            <h1 className="v2-display mt-0.5 mb-0 font-extrabold text-[32px] sm:text-[40px] tracking-[-1.4px] leading-[1.05]">{currentUser.name}</h1>
          </div>
          <a href="#yangi-elon" className={`${btn.violet} min-h-[52px]`}>{Icon.plus()} Yangi e'lon joylash</a>
        </div>

        <div className="mt-5"><ReviewBanner user={currentUser} onEdit={onOpenEditProfile} onResubmit={onResubmit} /></div>

        <div className="mt-5 grid gap-3 grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
          <div className="rounded-[20px] bg-white border border-[#E6E3DC] p-4"><div className="text-[13px] text-[#5E5A6B] font-semibold">Ochiq e'lonlar</div><div className="v2-display font-extrabold text-[32px]">{mine.filter(isBriefOpen).length}</div></div>
          <div className="rounded-[20px] bg-[#C8F169] p-4"><div className="text-[13px] font-bold">Yangi arizalar</div><div className="v2-display font-extrabold text-[32px]">{newApps}</div></div>
          <div className="rounded-[20px] bg-white border border-[#E6E3DC] p-4"><div className="text-[13px] text-[#5E5A6B] font-semibold">Qabul qilingan</div><div className="v2-display font-extrabold text-[32px]">{okApps}</div></div>
          <div className="rounded-[20px] bg-white border border-[#E6E3DC] p-4"><div className="text-[13px] text-[#5E5A6B] font-semibold">Jami e'lonlar</div><div className="v2-display font-extrabold text-[32px]">{mine.length}</div></div>
        </div>

        {mine.length === 0 ? (
          <div className="mt-7 rounded-[28px] border border-dashed border-[#D6D2C8] bg-white/60 py-14 px-6 text-center">
            <div className="v2-display font-extrabold text-[24px]">Hali e'lon joylamagansiz</div>
            <p className="mt-2 mb-5 text-[#5E5A6B]">Birinchi e'loningizni joylang — blogerlar o'zi ariza yuboradi.</p>
            <a href="#yangi-elon" className={btn.violet}>{Icon.plus()} E'lon joylash</a>
            {!approved && <p className="mt-4 mb-0 text-[13px] text-[#5E5A6B]">Eslatma: e'lon joylash uchun profil admin tomonidan tasdiqlangan bo'lishi kerak.</p>}
          </div>
        ) : (
          <>
            {/* brief selector */}
            <div className="mt-7 flex gap-2.5 overflow-x-auto pb-1">
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
                      {([['wait', 'Yangi'], ['ok', 'Qabul'], ['no', 'Rad']] as const).map(([id, label]) => (
                        <button key={id} type="button" onClick={() => setFilter(id)} className={`min-h-[40px] px-3.5 rounded-xl cursor-pointer ${filter === id ? 'bg-white font-bold shadow-sm' : 'font-semibold text-[#5E5A6B]'}`}>
                          {label} ({cnt(id)})
                        </button>
                      ))}
                    </div>
                    {isBriefOpen(selected) && (
                      <button type="button" onClick={() => onCloseBrief(selected)} className={btn.ghost}>E'lonni yopish</button>
                    )}
                  </div>
                </div>
                {error && <div className="px-7 pt-4 text-[14px] text-[#B91C1C]">{error}</div>}
                {apps.length === 0 ? (
                  <div className="px-7 py-12 text-center text-[#5E5A6B]">
                    {filter === 'wait' ? "Yangi ariza yo'q. Blogerlar ariza yuborishi bilan shu yerda ko'rinadi." : "Bu bo'limda ariza yo'q."}
                  </div>
                ) : (
                  apps.map((a) => {
                    const st = appStatus(a);
                    return (
                      <div key={a.id} className={`px-5 sm:px-7 py-5 border-b border-[#EEECE6] last:border-b-0 ${st === 'ok' ? 'bg-[#F7FEF9]' : ''}`}>
                        <div className="flex flex-wrap gap-4 items-center">
                          <Avatar name={a.creatorName} src={a.creatorAvatar} size={56} round />
                          <div className="flex-[999_1_260px] min-w-0">
                            <div className="font-bold text-[17px]">{a.creatorName}</div>
                            <div className="text-[14px] text-[#5E5A6B]">{a.creatorHandle || ''}{a.proposedPrice ? ` · Taklif: ${a.proposedPrice} so'm` : ''}</div>
                            {a.message && <div className="mt-1.5 text-[14px] text-[#3E3A4A] whitespace-pre-line break-words">"{a.message}"</div>}
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
                            {st === 'ok' && (
                              <>
                                <Pill tone="green">{Icon.check(13)} Qabul qilindi</Pill>
                                <button type="button" onClick={() => onContactCreator(a)} className={btn.dark}>{Icon.chat(16)} Yozish</button>
                              </>
                            )}
                            {st === 'no' && <Pill tone="red">Rad etildi</Pill>}
                          </div>
                        </div>
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
        )}
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
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [barter, setBarter] = useState('');
  const [deadline, setDeadline] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const approved = reviewState(currentUser) === 'approved';
  const pro = isUserPro(currentUser);
  const toggle = (list: string[], set: (v: string[]) => void, v: string) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  if (!approved || !pro) {
    return (
      <main className="max-w-[720px] mx-auto px-4 sm:px-6 py-16 text-center">
        <h1 className="v2-display m-0 font-extrabold text-[34px] tracking-[-1.2px]">E'lon joylash</h1>
        {!approved ? (
          <p className="mt-3 text-[#5E5A6B]">Profilingiz admin tomonidan tasdiqlangach e'lon joylay olasiz. Odatda bir necha soat ichida.</p>
        ) : (
          <>
            <p className="mt-3 text-[#5E5A6B]">E'lon joylash uchun Brend Pro kerak — 99 000 so'm/oy.</p>
            <button type="button" onClick={onOpenPro} className={`${btn.violet} mt-3`}>Pro'ni yoqish</button>
          </>
        )}
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
            <div className="mt-3 grid gap-3 grid-cols-2">
              <label className="block text-[14px] font-semibold">Byudjet (so'm)<input value={min} onChange={(e) => setMin(e.target.value)} inputMode="numeric" placeholder="500 000" className={field} /></label>
              <label className="block text-[14px] font-semibold">Gacha (ixtiyoriy)<input value={max} onChange={(e) => setMax(e.target.value)} inputMode="numeric" placeholder="1 000 000" className={field} /></label>
            </div>
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
