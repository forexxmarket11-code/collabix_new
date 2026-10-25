import React, { useState } from 'react';
import { Briefcase, ExternalLink, Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { PastCollaboration, MAX_PAST_COLLABORATIONS } from '../types';

/** Havolani xavfsiz holatga keltiradi: faqat http(s), aks holda bo'sh */
export function normalizeCollabLink(raw?: string): string {
  const t = (raw || '').trim();
  if (!t) return '';
  const withProto = /^https?:\/\//i.test(t) ? t : `https://${t.replace(/^\/+/, '')}`;
  try {
    const u = new URL(withProto);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
    if (!u.hostname.includes('.')) return '';
    return u.toString();
  } catch {
    return '';
  }
}

/** Saqlashdan oldin tozalash: bo'sh brendlarni olib tashlash, uzunliklarni cheklash */
export function cleanPastCollaborations(items: PastCollaboration[] | undefined): PastCollaboration[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((it, idx) => ({
      id: String(it?.id || `collab_${Date.now()}_${idx}`).slice(0, 60),
      brand: String(it?.brand || '').trim().slice(0, 80),
      description: String(it?.description || '').trim().slice(0, 200),
      link: normalizeCollabLink(it?.link).slice(0, 300),
      year: String(it?.year || '').trim().slice(0, 12),
    }))
    .filter((it) => it.brand.length > 0)
    .slice(0, MAX_PAST_COLLABORATIONS);
}

function linkLabel(link: string): string {
  try {
    const host = new URL(link).hostname.replace(/^www\./, '');
    if (host.includes('instagram')) return 'Instagram\'da koʻrish';
    if (host.includes('tiktok')) return 'TikTok\'da koʻrish';
    if (host.includes('youtu')) return 'YouTube\'da koʻrish';
    if (host.includes('t.me')) return 'Telegram\'da koʻrish';
    return 'Koʻrish';
  } catch {
    return 'Koʻrish';
  }
}

/* ===================== Ommaviy profildagi ko'rinish ===================== */

export const PortfolioCollabsSection: React.FC<{ items?: PastCollaboration[]; id?: string }> = ({ items, id }) => {
  const list = cleanPastCollaborations(items);
  if (list.length === 0) return null;
  return (
    <div
      id={id || 'creator-portfolio-section'}
      className="bg-white dark:bg-[#1A1A24] rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800/90 p-5 sm:p-7 shadow-2xs"
    >
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Briefcase className="w-4 h-4" />
          </div>
          <h2 className="font-heading font-bold text-lg sm:text-xl text-slate-900 dark:text-white">Portfolio</h2>
        </div>
        <span className="text-xs font-heading font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 px-2.5 py-1 rounded-full">
          {list.length} ta brend bilan ishlagan
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {list.map((c) => (
          <div
            key={c.id}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex flex-col gap-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-pink-500 text-white font-heading font-extrabold flex items-center justify-center shrink-0">
                  {c.brand.charAt(0).toUpperCase()}
                </div>
                <div className="font-heading font-bold text-[15px] text-slate-900 dark:text-white break-words min-w-0">
                  {c.brand}
                </div>
              </div>
              {c.year && (
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 shrink-0 mt-1">{c.year}</span>
              )}
            </div>
            {c.description && (
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed break-words">{c.description}</p>
            )}
            {c.link && (
              <a
                href={c.link}
                target="_blank"
                rel="noopener noreferrer nofollow ugc"
                className="inline-flex items-center gap-1.5 min-h-[36px] text-sm font-heading font-semibold text-indigo-600 dark:text-indigo-400 hover:underline self-start"
              >
                <ExternalLink className="w-4 h-4" />
                {linkLabel(c.link)}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ===================== Profilni tahrirlashdagi muharrir ===================== */

const emptyDraft = { brand: '', description: '', link: '', year: '' };

export const PortfolioCollabsEditor: React.FC<{
  items: PastCollaboration[];
  onChange: (items: PastCollaboration[]) => void;
}> = ({ items, onChange }) => {
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const isFull = items.length >= MAX_PAST_COLLABORATIONS;

  const resetForm = () => {
    setDraft(emptyDraft);
    setEditingId(null);
    setError(null);
    setFormOpen(false);
  };

  const handleSubmit = () => {
    const brand = draft.brand.trim();
    if (!brand) {
      setError('Brend nomini kiriting.');
      return;
    }
    if (draft.link.trim() && !normalizeCollabLink(draft.link)) {
      setError('Havola notoʻgʻri. Masalan: instagram.com/p/...');
      return;
    }
    const item: PastCollaboration = {
      id: editingId || `collab_${Date.now()}`,
      brand: brand.slice(0, 80),
      description: draft.description.trim().slice(0, 200),
      link: normalizeCollabLink(draft.link),
      year: draft.year.trim().slice(0, 12),
    };
    if (editingId) {
      onChange(items.map((it) => (it.id === editingId ? item : it)));
    } else {
      if (isFull) return;
      onChange([...items, item]);
    }
    resetForm();
  };

  const startEdit = (it: PastCollaboration) => {
    setDraft({
      brand: it.brand || '',
      description: it.description || '',
      link: it.link || '',
      year: it.year || '',
    });
    setEditingId(it.id);
    setError(null);
    setFormOpen(true);
  };

  const inputCls =
    'w-full min-h-[48px] px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-base sm:text-sm text-slate-900 dark:text-white bg-slate-50/50 dark:bg-[#12121A] focus:bg-white dark:focus:bg-[#12121A] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600';

  return (
    <section
      aria-labelledby="section-portfolio-heading"
      className="bg-white dark:bg-[#1A1A24] rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-8 shadow-xs"
    >
      <div className="flex items-start justify-between gap-3 mb-1">
        <h2
          id="section-portfolio-heading"
          className="text-base font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2"
        >
          <Briefcase className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>Portfolio — kimlar bilan ishlagansiz</span>
        </h2>
        <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 shrink-0">
          {items.length} / {MAX_PAST_COLLABORATIONS}
        </span>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 font-body mb-5 leading-relaxed">
        Avval reklama qilgan brendlaringizni qoʻshing. Brendlar sizga koʻproq ishonadi. Reklama postiga havola qoʻshsangiz, yanada yaxshi.
      </p>

      {items.length > 0 && (
        <div className="space-y-2.5 mb-4">
          {items.map((it) => (
            <div
              key={it.id}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="font-heading font-bold text-sm text-slate-900 dark:text-white break-words">
                  {it.brand}
                  {it.year ? <span className="font-mono font-normal text-xs text-slate-500 ml-2">{it.year}</span> : null}
                </div>
                {it.description && (
                  <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 break-words">{it.description}</div>
                )}
                {it.link && <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5 truncate">{it.link}</div>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => startEdit(it)}
                  aria-label="Tahrirlash"
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChange(items.filter((x) => x.id !== it.id));
                    if (editingId === it.id) resetForm();
                  }}
                  aria-label="Oʻchirish"
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen ? (
        <div className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={draft.brand}
              onChange={(e) => setDraft({ ...draft, brand: e.target.value })}
              placeholder="Brend nomi *"
              maxLength={80}
              className={`${inputCls} sm:col-span-2`}
            />
            <input
              type="text"
              value={draft.year}
              onChange={(e) => setDraft({ ...draft, year: e.target.value })}
              placeholder="Yil (2025)"
              maxLength={12}
              inputMode="numeric"
              className={inputCls}
            />
          </div>
          <input
            type="text"
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="Nima qildingiz? Masalan: 3 ta Reels va 5 ta Story"
            maxLength={200}
            className={inputCls}
          />
          <input
            type="url"
            value={draft.link}
            onChange={(e) => setDraft({ ...draft, link: e.target.value })}
            placeholder="Reklama postiga havola (ixtiyoriy)"
            maxLength={300}
            inputMode="url"
            autoCapitalize="none"
            className={inputCls}
          />
          {error && <div className="text-sm text-rose-600 dark:text-rose-400">{error}</div>}
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <button
              type="button"
              onClick={resetForm}
              className="min-h-[48px] px-5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-heading font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <X className="w-4 h-4" /> Bekor qilish
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="min-h-[48px] px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-heading font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" /> {editingId ? 'Saqlash' : 'Qoʻshish'}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={isFull}
          onClick={() => {
            setDraft(emptyDraft);
            setEditingId(null);
            setError(null);
            setFormOpen(true);
          }}
          className="w-full min-h-[52px] rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 text-slate-600 dark:text-slate-300 hover:text-indigo-600 text-sm font-heading font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-5 h-5" />
          {isFull ? 'Maksimal soni qoʻshildi' : 'Hamkorlik qoʻshish'}
        </button>
      )}
      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-3">
        Oʻzgarishlar pastdagi «Saqlash» tugmasi bosilganda saqlanadi.
      </p>
    </section>
  );
};
