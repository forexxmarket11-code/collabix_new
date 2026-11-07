import React, { useEffect, useState } from 'react';
import { UserSession } from '../types';
import { fetchCreatorPoolStats, CreatorPoolStats } from '../firebase';
import { Icon, btn, go } from './ui';

/** Brendlar yozishi mumkin bo'lgan Telegram (masalan 'collabix_help'). Bo'sh bo'lsa tugma ko'rinmaydi. */
export const SUPPORT_TELEGRAM = 'gonzo_usaa';

const fmt = (n: number) => n.toLocaleString('ru-RU').replace(/,/g, ' ');

const Bar: React.FC<{ label: string; value: number; total: number; dark?: boolean }> = ({ label, value, total, dark }) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between gap-3 text-[14px] font-semibold">
        <span className="truncate">{label}</span>
        <span className={dark ? 'text-[#BDB8CC]' : 'text-[#5E5A6B]'}>{fmt(value)} · {pct}%</span>
      </div>
      <div className={`mt-1.5 h-2.5 rounded-full overflow-hidden ${dark ? 'bg-[#2A2636]' : 'bg-[#ECEAE4]'}`}>
        <div className={`h-full rounded-full ${dark ? 'bg-[#C8F169]' : 'bg-[#5B3DF5]'}`} style={{ width: `${Math.max(pct, value > 0 ? 3 : 0)}%` }} />
      </div>
    </div>
  );
};

const FAQ: [string, string][] = [
  ['Collabix brendlar uchun pullikmi?', "Yo'q. Brendlar uchun e'lon joylash, arizalarni ko'rish va blogerlar bilan yozishish — tekin."],
  ['Blogerlar haqiqiymi?', "Har bir bloger profili admin tomonidan qo'lda tekshiriladi. Tasdiqlanmagan profil e'lonlarga ariza yubora olmaydi."],
  ["E'lon qachon blogerlarga ko'rinadi?", "Joylangan zahoti barcha blogerlarga ko'rinadi. Arizalar soni byudjet, format va kategoriyaga bog'liq."],
  ['Blogerni qanday tanlayman?', "Har bir arizada blogerning profili, Instagram'i, obunachilari va taklif narxi ko'rinadi. Mosini qabul qilasiz, qolganlarini rad etasiz."],
  ['Blogerga pulni qanday to\'layman?', "Hozircha narx va to'lovni bloger bilan to'g'ridan-to'g'ri kelishasiz. Collabix sizni tekshirilgan blogerlar bilan bog'laydi."],
  ['Barter (mahsulot evaziga) mumkinmi?', "Ha. E'lon berishda to'lov turini \"barter\" qilib, nima berishingizni yozasiz."],
  ['Bir nechta bloger bilan ishlasam bo\'ladimi?', "Ha. Bitta e'longa kelgan arizalardan xohlaganingizcha blogerni qabul qilishingiz mumkin."],
  ['Qanday boshlayman?', "Brend sifatida ro'yxatdan o'ting (2 daqiqa), profilingiz tasdiqlangach birinchi e'loningizni joylang."],
];

export const V2ForBrands: React.FC<{ currentUser: UserSession | null }> = ({ currentUser }) => {
  const [stats, setStats] = useState<CreatorPoolStats | null>(null);
  const [open, setOpen] = useState<number | null>(0);

  useEffect(() => {
    let alive = true;
    try {
      const c = JSON.parse(sessionStorage.getItem('cbx_pool') || 'null');
      if (c && Date.now() - c.at < 30 * 60 * 1000) { setStats(c.s); return () => { alive = false; }; }
    } catch {}
    fetchCreatorPoolStats()
      .then((s) => {
        if (!alive) return;
        setStats(s);
        try { sessionStorage.setItem('cbx_pool', JSON.stringify({ at: Date.now(), s })); } catch {}
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const isBrand = currentUser?.role === 'brend';
  const start = () => go(isBrand ? 'yangi-elon' : 'royxat');
  const total = stats?.total || 0;

  return (
    <div>
      {/* HERO */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-8">
        <div className="rounded-[36px] bg-[#14121C] text-white px-6 sm:px-12 py-12 sm:py-16 relative overflow-hidden">
          <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-[#5B3DF5] opacity-80" aria-hidden="true" />
          <div className="absolute right-24 -bottom-28 w-56 h-56 rounded-full bg-[#C8F169] opacity-90" aria-hidden="true" />
          <div className="relative max-w-[720px]">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-[13px] font-bold tracking-[1px] text-[#C8F169]">BRENDLAR UCHUN · TEKIN</div>
            <h1 className="v2-display mt-5 mb-0 font-extrabold text-[38px] sm:text-[60px] leading-[1] tracking-[-2px]">
              Mahsulotingizni <span className="text-[#C8F169]">tekshirilgan blogerlar</span> orqali tanitamiz
            </h1>
            <p className="mt-5 mb-0 text-[17px] sm:text-[19px] leading-[1.55] text-[#BDB8CC]">
              Bitta e'lon joylang — mos blogerlar o'zlari ariza yuboradi. Siz faqat tanlaysiz. Agentliksiz, ortiqcha yozishmalarsiz.
            </p>
            <div className="mt-8 flex flex-wrap gap-2.5">
              <button type="button" onClick={start} className={`${btn.lime} min-h-[52px] px-6`}>
                {isBrand ? "E'lon joylash" : "Tekin e'lon joylash"} {Icon.arrow(16)}
              </button>
              {SUPPORT_TELEGRAM && (
                <a href={`https://t.me/${SUPPORT_TELEGRAM}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 min-h-[52px] px-6 rounded-xl border border-white/25 text-white font-semibold hover:bg-white/10">
                  Telegram'da savol berish
                </a>
              )}
            </div>
            <div className="mt-10 grid grid-cols-3 gap-3 max-w-[560px]">
              {[
                [total ? `${fmt(total)}+` : '—', 'bloger'],
                ['0 so\'m', 'brend uchun'],
                ['2 daqiqa', "ro'yxatdan o'tish"],
              ].map(([n, l]) => (
                <div key={l}>
                  <div className="v2-display font-extrabold text-[26px] sm:text-[36px] leading-none">{n}</div>
                  <div className="mt-1 text-[13px] text-[#BDB8CC]">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CREATOR POOL */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-10 pb-6">
        <div className="text-[13px] font-bold tracking-[2px] text-[#5B3DF5]">BLOGERLAR BAZASI</div>
        <h2 className="v2-display mt-2 mb-0 font-extrabold text-[32px] sm:text-[44px] tracking-[-1.5px] leading-[1.05]">Kimlar bilan ishlaysiz</h2>
        <p className="mt-3 mb-0 max-w-[640px] text-[#5E5A6B]">Raqamlar Collabix'dagi bloger profillaridan avtomatik hisoblanadi.</p>
        {!stats ? (
          <div className="mt-7 grid gap-4 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
            {[0, 1, 2].map((i) => <div key={i} className="h-[260px] rounded-3xl bg-white border border-[#E6E3DC] animate-pulse" />)}
          </div>
        ) : (
          <div className="mt-7 grid gap-4 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
            <div className="rounded-3xl bg-white border border-[#E6E3DC] p-6">
              <div className="font-bold text-[17px]">Kategoriyalar</div>
              <div className="mt-4 flex flex-col gap-3.5">
                {stats.categories.slice(0, 6).map(([k, v]) => <Bar key={k} label={k} value={v} total={total} />)}
              </div>
            </div>
            <div className="rounded-3xl bg-white border border-[#E6E3DC] p-6">
              <div className="font-bold text-[17px]">Shaharlar</div>
              <div className="mt-4 flex flex-col gap-3.5">
                {stats.cities.slice(0, 6).map(([k, v]) => <Bar key={k} label={k} value={v} total={total} />)}
              </div>
            </div>
            <div className="rounded-3xl bg-[#14121C] text-white p-6">
              <div className="font-bold text-[17px]">Obunachilar soni</div>
              <div className="mt-4 flex flex-col gap-3.5">
                {stats.followers.map(([k, v]) => <Bar key={k} label={k} value={v} total={total} dark />)}
              </div>
              {stats.women + stats.men > 0 && (
                <div className="mt-6 pt-5 border-t border-white/10 flex gap-6">
                  <div><div className="v2-display font-extrabold text-[28px]">{Math.round((stats.women / (stats.women + stats.men)) * 100)}%</div><div className="text-[13px] text-[#BDB8CC]">ayollar</div></div>
                  <div><div className="v2-display font-extrabold text-[28px]">{Math.round((stats.men / (stats.women + stats.men)) * 100)}%</div><div className="text-[13px] text-[#BDB8CC]">erkaklar</div></div>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* HOW IT WORKS FOR BRANDS */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-14 pb-6">
        <div className="text-[13px] font-bold tracking-[2px] text-[#5B3DF5]">QANDAY ISHLAYDI</div>
        <h2 className="v2-display mt-2 mb-0 font-extrabold text-[32px] sm:text-[44px] tracking-[-1.5px] leading-[1.05]">4 qadamda reklama</h2>
        <div className="mt-8 grid gap-4 grid-cols-[repeat(auto-fit,minmax(230px,1fr))]">
          {[
            ['01', "E'lon joylang", "Nima reklama qilinadi, format, byudjet yoki barter va muddat. 3 daqiqa."],
            ['02', 'Arizalar keladi', "Mos blogerlar o'zlari ariza yuboradi — profil, Instagram va narx bilan."],
            ['03', 'Tanlang', 'Yoqqanini qabul qiling, qolganini bir tugma bilan rad eting.'],
            ['04', 'Ishni boshlang', "Bloger bilan Collabix chatida kelishing va natijani kuzating."],
          ].map(([n, t, d], i) => (
            <div key={n} className={`rounded-3xl p-6 ${i === 3 ? 'bg-[#5B3DF5] text-white' : 'bg-white border border-[#E6E3DC]'}`}>
              <div className={`v2-display font-extrabold text-[44px] leading-none ${i === 3 ? 'text-[#C8F169]' : 'text-[#5B3DF5]'}`}>{n}</div>
              <div className="mt-4 font-bold text-[19px]">{t}</div>
              <p className={`mt-2 mb-0 text-[15px] ${i === 3 ? 'text-[#E4DEFF]' : 'text-[#5E5A6B]'}`}>{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* COMPARISON */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-14 pb-6">
        <div className="text-[13px] font-bold tracking-[2px] text-[#5B3DF5]">SOLISHTIRING</div>
        <h2 className="v2-display mt-2 mb-0 font-extrabold text-[32px] sm:text-[44px] tracking-[-1.5px] leading-[1.05]">Nega Collabix?</h2>
        <div className="mt-7 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[620px] border-separate border-spacing-0 rounded-3xl overflow-hidden bg-white border border-[#E6E3DC] text-[15px]">
            <thead>
              <tr>
                <th className="text-left p-4 font-semibold text-[#5E5A6B]" />
                <th className="p-4 bg-[#5B3DF5] text-white font-extrabold">Collabix</th>
                <th className="p-4 font-bold">Agentlik</th>
                <th className="p-4 font-bold">O'zingiz qidirish</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Brend uchun narx', "Tekin", "Xizmat haqi oladi", 'Tekin'],
                ['Bloger topish', "Blogerlar o'zi ariza beradi", 'Agentlik tanlaydi', "Har biriga alohida yozasiz"],
                ['Profil tekshiruvi', 'Admin tekshiradi', 'Ha', "Yo'q"],
                ['Tezlik', "E'lon darhol ko'rinadi", 'Kelishuvga bog\'liq', 'Har biridan javob kutasiz'],
                ['Hamma narsa bir joyda', 'Ha — e\'lon, arizalar, chat', 'Qisman', "Yo'q"],
              ].map((row, i) => (
                <tr key={row[0]}>
                  {row.map((c, j) => (
                    <td key={j} className={`p-4 border-t border-[#EEECE6] ${j === 0 ? 'font-bold' : 'text-center'} ${j === 1 ? 'bg-[#F1EEFF] font-bold text-[#4329D9]' : ''}`}>
                      {j === 1 ? <span className="inline-flex items-center gap-1.5">{Icon.check(16)} {c}</span> : c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-[900px] mx-auto px-4 sm:px-6 pt-14 pb-6">
        <div className="text-[13px] font-bold tracking-[2px] text-[#5B3DF5]">SAVOL-JAVOB</div>
        <h2 className="v2-display mt-2 mb-0 font-extrabold text-[32px] sm:text-[44px] tracking-[-1.5px] leading-[1.05]">Ko'p beriladigan savollar</h2>
        <div className="mt-7 flex flex-col gap-2.5">
          {FAQ.map(([q, a], i) => (
            <div key={q} className="rounded-2xl bg-white border border-[#E6E3DC]">
              <button
                type="button"
                aria-expanded={open === i}
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full min-h-[56px] px-5 py-3 flex items-center justify-between gap-4 text-left font-bold text-[16px] cursor-pointer"
              >
                {q}
                <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[20px] leading-none ${open === i ? 'bg-[#14121C] text-white' : 'bg-[#F1F0EC]'}`}>{open === i ? '−' : '+'}</span>
              </button>
              {open === i && <p className="m-0 px-5 pb-5 text-[15px] leading-[1.6] text-[#5E5A6B]">{a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-14 pb-4">
        <div className="rounded-[36px] bg-[#C8F169] px-6 sm:px-12 py-12 flex flex-wrap gap-6 items-center justify-between">
          <div className="max-w-[620px]">
            <h2 className="v2-display m-0 font-extrabold text-[30px] sm:text-[42px] tracking-[-1.5px] leading-[1.05]">Birinchi e'loningizni bugun joylang</h2>
            <p className="mt-3 mb-0 text-[16px] text-[#3E3A4A]">Ro'yxatdan o'tish 2 daqiqa. Brendlar uchun tekin.</p>
          </div>
          <button type="button" onClick={start} className={`${btn.dark} min-h-[56px] px-7 text-[16px]`}>
            {isBrand ? "E'lon joylash" : 'Brend sifatida boshlash'} {Icon.arrow(16)}
          </button>
        </div>
      </section>
    </div>
  );
};
