import React from 'react';

/** Sahifada kutilmagan xato bo'lsa oq ekran o'rniga tushunarli xabar chiqaradi */
export class V2ErrorBoundary extends React.Component<{ children: React.ReactNode; resetKey?: string }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) { console.error('Sahifa xatosi:', error); }
  componentDidUpdate(prev: { resetKey?: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="max-w-[520px] mx-auto px-4 py-16 text-center">
        <h1 className="v2-display m-0 font-extrabold text-[28px]">Sahifani ochib bo'lmadi</h1>
        <p className="mt-2 text-[#5E5A6B]">Kutilmagan xatolik yuz berdi. Sahifani yangilab ko'ring.</p>
        <p className="mt-2 text-[12px] text-[#8A8597] break-words">{String(this.state.error?.message || '').slice(0, 200)}</p>
        <div className="mt-5 flex flex-wrap gap-2.5 justify-center">
          <button type="button" onClick={() => window.location.reload()} className="min-h-[48px] px-5 rounded-xl bg-[#14121C] text-white font-bold cursor-pointer">Yangilash</button>
          <a href="#" className="min-h-[48px] px-5 rounded-xl border-[1.5px] border-[#E6E3DC] font-bold inline-flex items-center">Bosh sahifa</a>
        </div>
      </div>
    );
  }
}
