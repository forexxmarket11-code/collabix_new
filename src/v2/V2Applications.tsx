import React, { useMemo, useState } from 'react';
import { BriefData, UserSession } from '../types';
import { isUserPro } from '../utils/subscription';
import { Avatar, Pill, Icon, budgetText, btn, appStatus, reviewState } from './ui';

interface Props {
  currentUser: UserSession;
  briefs: BriefData[];
  onOpenEditProfile: () => void;
  onOpenPro: () => void;
  onContactBrand: (brief: BriefData) => void;
  onResubmit: () => Promise<void>;
}

export const ReviewBanner: React.FC<{ user: UserSession; onEdit: () => void; onResubmit: () => Promise<void> }> = ({ user, onEdit, onResubmit }) => {
  const st = reviewState(user);
  const [busy, setBusy] = useState(false);
  if (st === 'approved') return null;
  if (st === 'pending') {
    return (
      <div className="rounded-3xl bg-[#FEF3C7] text-[#78350F] p-5 flex gap-3.5 items-start">
        <span className="text-[#A16207] mt-0.5">{Icon.clock(24)}</span>
        <div>
          <div className="font-bold text-[16px]">Profilingiz admin tekshiruvida</div>
          <div className="text-[14px] mt-0.5">Tasdiqlangach bildirishnoma keladi. Odatda bir necha soat ichida.</div>
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-3xl bg-[#FEF2F2] text-[#7F1D1D] p-5 flex flex-wrap gap-4 items-center justify-between">
      <div>
        <div className="font-bold text-[16px]">Profilingiz tasdiqlanmadi</div>
        {user.catalogRejectReason && <div className="text-[14px] mt-0.5">Sabab: {user.catalogRejectReason}</div>}
        <div className="text-[14px] mt-0.5">Tuzatib, qayta tekshiruvga yuboring.</div>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onEdit} className={btn.ghost}>Tahrirlash</button>
        <button
          type="button"
          disabled={busy}
          onClick={async () => { setBusy(true); try { await onResubmit(); } finally { setBusy(false); } }}
          className={btn.dark}
        >
          {busy ? 'Yuborilmoqda...' : 'Qayta yuborish'}
        </button>
      </div>
    </div>
  );
};

export const V2Applications: React.FC<Props> = ({ currentUser, briefs, onOpenEditProfile, onOpenPro, onContactBrand, onResubmit }) => {
  const [tab, setTab] = useState<'all' | 'wait' | 'ok' | 'no'>('all');
  const uid = currentUser.uid;

  const mine = useMemo(() => {
    const rows: { brief: BriefData; status: 'ok' | 'no' | 'wait'; reason?: string; ms: number }[] = [];
    briefs.forEach((b) => {
      const a = (b.applications || []).find((x) => x.creatorId === uid);
      if (!a) return;
      const ms = Date.parse(a.appliedAt || a.respondedAt || '') || Number(b.createdAtMillis) || 0;
      rows.push({ brief: b, status: appStatus(a), reason: a.rejectionReason, ms });
    });
    return rows.sort((x, y) => y.ms - x.ms);
  }, [briefs, uid]);

  const count = (s: string) => mine.filter((r) => r.status === s).length;
  const rows = mine.filter((r) => tab === 'all' || r.status === tab);
  const pro = isUserPro(currentUser);
  const proEnd = currentUser.trialEndDate ? new Date(currentUser.trialEndDate).toLocaleDateString('ru-RU') : '';

  const pill = (s: 'ok' | 'no' | 'wait') =>
    s === 'ok' ? <Pill tone="green">{Icon.check(13)} Qabul qilindi</Pill> : s === 'no' ? <Pill tone="red">Rad etildi</Pill> : <Pill tone="amber">Kutilmoqda</Pill>;

  return (
    <main className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-8 pb-16 flex flex-wrap gap-7 items-start">
      <aside className="flex-[1_1_300px] min-w-0 rounded-[28px] bg-white border border-[#E6E3DC] p-7">
        <Avatar name={currentUser.name} src={currentUser.avatar} size={76} round />
        <div className="v2-display mt-3.5 font-extrabold text-[24px] leading-tight">{currentUser.name}</div>
        <div className="text-[14px] text-[#5E5A6B]">{[...(currentUser.categories || []).slice(0, 2), currentUser.city].filter(Boolean).join(' · ') || 'Bloger'}</div>
        <div className="mt-4 flex flex-wrap gap-2">
          {reviewState(currentUser) === 'approved' ? <Pill tone="green">{Icon.check(13)} Profil tasdiqlangan</Pill> : reviewState(currentUser) === 'pending' ? <Pill tone="amber">Tekshiruvda</Pill> : <Pill tone="red">Tasdiqlanmagan</Pill>}
          {pro ? <Pill tone="dark">PRO{proEnd ? ` · ${proEnd} gacha` : ''}</Pill> : null}
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-[#F6F5F1] py-3"><div className="v2-display font-extrabold text-[24px]">{mine.length}</div><div className="text-[12px] text-[#5E5A6B]">Ariza</div></div>
          <div className="rounded-2xl bg-[#DCFCE7] py-3"><div className="v2-display font-extrabold text-[24px] text-[#15803D]">{count('ok')}</div><div className="text-[12px] text-[#166534]">Qabul</div></div>
          <div className="rounded-2xl bg-[#FEF3C7] py-3"><div className="v2-display font-extrabold text-[24px] text-[#A16207]">{count('wait')}</div><div className="text-[12px] text-[#854D0E]">Kutilmoqda</div></div>
        </div>
        <button type="button" onClick={onOpenEditProfile} className={`${btn.ghost} mt-5 w-full`}>Profilni tahrirlash</button>
        {!pro && <button type="button" onClick={onOpenPro} className={`${btn.violet} mt-2.5 w-full`}>Pro'ni yoqish — 59 000 so'm</button>}
      </aside>

      <section className="flex-[999_1_600px] min-w-0">
        <h1 className="v2-display m-0 font-extrabold text-[34px] sm:text-[44px] tracking-[-1.5px] leading-[1.05]">Mening arizalarim</h1>
        <p className="mt-2 mb-0 text-[#5E5A6B]">Brend javob berishi bilan holat shu yerda o'zgaradi va sizga bildirishnoma keladi.</p>
        <div className="mt-5"><ReviewBanner user={currentUser} onEdit={onOpenEditProfile} onResubmit={onResubmit} /></div>

        <div role="tablist" aria-label="Holat bo'yicha" className="mt-5 flex flex-wrap gap-2">
          {([['all', 'Hammasi', mine.length], ['wait', 'Kutilmoqda', count('wait')], ['ok', 'Qabul qilindi', count('ok')], ['no', 'Rad etildi', count('no')]] as const).map(([id, label, n]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`min-h-[44px] px-4 rounded-xl font-bold text-[15px] border inline-flex items-center gap-2 cursor-pointer ${tab === id ? 'bg-[#14121C] text-white border-[#14121C]' : 'bg-white text-[#14121C] border-[#E6E3DC]'}`}
            >
              {label}
              <span className={`min-w-[22px] h-[22px] px-1.5 rounded-full text-[12px] inline-flex items-center justify-center ${tab === id ? 'bg-[#C8F169] text-[#14121C]' : 'bg-[#F1F0EC] text-[#3E3A4A]'}`}>{n}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {rows.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#D6D2C8] bg-white/60 py-12 px-6 text-center">
              <div className="v2-display font-bold text-[20px]">{mine.length === 0 ? 'Hali ariza yubormagansiz' : "Bu bo'limda ariza yo'q"}</div>
              <p className="mt-2 mb-4 text-[#5E5A6B]">Ochiq e'lonlarni ko'rib, sizga mosiga ariza yuboring.</p>
              <a href="#" className={btn.dark}>E'lonlarni ko'rish</a>
            </div>
          ) : (
            rows.map(({ brief, status, reason }) => (
              <article key={brief.id} className="rounded-3xl bg-white border border-[#E6E3DC] px-5 py-5 flex flex-wrap gap-4 items-center">
                <Avatar name={brief.brandName} src={brief.brandAvatar} size={52} />
                <div className="flex-[999_1_240px] min-w-0">
                  <div className="text-[13px] text-[#5E5A6B] font-semibold">{brief.brandName || 'Brend'}</div>
                  <a href={`#elon-${encodeURIComponent(brief.id)}`} className="v2-display block font-bold text-[19px] leading-[1.25] hover:text-[#5B3DF5]">{brief.taskTitle}</a>
                  {status === 'no' && reason && <div className="mt-2 px-3 py-2.5 rounded-xl bg-[#FEF2F2] text-[#991B1B] text-[14px]"><strong>Sabab:</strong> {reason}</div>}
                </div>
                <div className="flex-[1_1_auto] flex flex-wrap items-center justify-end gap-3">
                  <div className="v2-display font-extrabold text-[17px] whitespace-nowrap">{budgetText(brief)}</div>
                  {pill(status)}
                  {status === 'ok' && (
                    <button type="button" onClick={() => onContactBrand(brief)} className={btn.dark}>{Icon.chat(16)} Brendga yozish</button>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
};
