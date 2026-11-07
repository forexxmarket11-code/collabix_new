import React, { useState } from 'react';
import { UserSession } from '../types';
import { Logo, Avatar, btn, go, Icon } from './ui';

interface NavProps {
  currentUser: UserSession | null;
  unreadCount: number;
  onOpenMessages: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  active?: string;
}

export const V2Navbar: React.FC<NavProps> = ({ currentUser, unreadCount, onOpenMessages, onOpenProfile, onLogout, active }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const isBrand = currentUser?.role === 'brend';
  const link = (id: string, label: string, hash: string) => (
    <a
      key={id}
      href={hash}
      onClick={() => setMenuOpen(false)}
      className={`min-h-[44px] inline-flex items-center font-semibold text-[15px] hover:text-[#5B3DF5] transition-colors ${active === id ? 'text-[#4329D9]' : 'text-[#14121C]'}`}
    >
      {label}
    </a>
  );
  return (
    <header className="sticky top-0 z-40 border-b border-[#E6E3DC] bg-[#F6F5F1]/90 backdrop-blur-md">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <a href="#" onClick={(e) => { e.preventDefault(); go(''); }} aria-label="Collabix bosh sahifa">
          <Logo size={36} />
        </a>
        <nav aria-label="Asosiy menyu" className="hidden md:flex items-center gap-7">
          {link('home', "E'lonlar", '#')}
          {link('brands', 'Brendlar', '#brendlar')}
          {currentUser?.role !== 'bloger' && link('forBrands', 'Brendlar uchun', '#brendlar-uchun')}
          {currentUser && !isBrand && link('applications', 'Mening arizalarim', '#arizalarim')}
          {currentUser && isBrand && link('cabinet', 'Kabinet', '#kabinet')}
          {link('pricing', 'Narxlar', '#narxlar')}
        </nav>
        <div className="flex items-center gap-2">
          {currentUser ? (
            <>
              {isBrand && (
                <a href="#yangi-elon" className={`${btn.violet} hidden sm:inline-flex`}>
                  {Icon.plus(16)} E'lon joylash
                </a>
              )}
              <button
                type="button"
                onClick={onOpenMessages}
                aria-label="Xabarlar va bildirishnomalar"
                className="relative w-11 h-11 rounded-xl border border-[#E6E3DC] bg-white flex items-center justify-center cursor-pointer"
              >
                {Icon.chat(19)}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-[#5B3DF5] text-white text-[11px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="Profil menyusi"
                  aria-expanded={menuOpen}
                  className="rounded-full cursor-pointer"
                >
                  <Avatar name={currentUser.name} src={currentUser.avatar} size={44} round />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white border border-[#E6E3DC] shadow-xl p-2 z-50">
                    <div className="px-3 py-2">
                      <div className="font-bold truncate">{currentUser.name}</div>
                      <div className="text-[13px] text-[#5E5A6B]">{isBrand ? 'Brend' : 'Bloger'}</div>
                    </div>
                    <button type="button" onClick={() => { setMenuOpen(false); onOpenProfile(); }} className="w-full text-left min-h-[44px] px-3 rounded-xl hover:bg-[#F6F5F1] font-semibold cursor-pointer">Mening profilim</button>
                    {isBrand ? (
                      <a href="#kabinet" onClick={() => setMenuOpen(false)} className="flex items-center min-h-[44px] px-3 rounded-xl hover:bg-[#F6F5F1] font-semibold">Brend kabineti</a>
                    ) : (
                      <a href="#arizalarim" onClick={() => setMenuOpen(false)} className="flex items-center min-h-[44px] px-3 rounded-xl hover:bg-[#F6F5F1] font-semibold">Mening arizalarim</a>
                    )}
                    <a href="#referral" onClick={() => setMenuOpen(false)} className="flex items-center min-h-[44px] px-3 rounded-xl hover:bg-[#F6F5F1] font-semibold">Do'stlarni taklif qilish</a>
                    <button type="button" onClick={() => { setMenuOpen(false); onLogout(); }} className="w-full text-left min-h-[44px] px-3 rounded-xl hover:bg-[#FEF2F2] text-[#991B1B] font-semibold cursor-pointer">Chiqish</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <a href="#kirish" className="min-h-[44px] px-4 inline-flex items-center rounded-xl font-semibold text-[15px] hover:text-[#5B3DF5]">Kirish</a>
              <a href="#royxat" className={btn.dark}>
                Ro'yxatdan o'tish <span className="hidden sm:inline-flex">{Icon.arrow(15)}</span>
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

/** Telefon uchun pastki menyu */
export const V2BottomNav: React.FC<{ currentUser: UserSession | null; active?: string; onOpenProfile: () => void }> = ({ currentUser, active, onOpenProfile }) => {
  const isBrand = currentUser?.role === 'brend';
  const item = (id: string, label: string, hash: string | null, icon: React.ReactNode, onClick?: () => void) => {
    const cls = `flex flex-col items-center justify-center gap-0.5 min-h-[56px] text-[11px] font-semibold ${active === id ? 'text-[#C8F169]' : 'text-[#BDB8CC]'}`;
    return hash ? (
      <a key={id} href={hash} className={cls}>{icon}{label}</a>
    ) : (
      <button key={id} type="button" onClick={onClick} className={`${cls} cursor-pointer`}>{icon}{label}</button>
    );
  };
  const s = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  return (
    <nav aria-label="Pastki menyu" className="md:hidden fixed left-3 right-3 z-40 rounded-[22px] bg-[#14121C] grid grid-cols-4 shadow-2xl" style={{ bottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}>
      {item('home', "E'lonlar", '#', <svg {...s}><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>)}
      {item('brands', 'Brendlar', '#brendlar', <svg {...s}><path d="M4 21V8l8-5 8 5v13" /><path d="M9 21v-6h6v6" /></svg>)}
      {isBrand
        ? item('cabinet', 'Kabinet', '#kabinet', <svg {...s}><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 9h16M9 20V9" /></svg>)
        : item('applications', 'Arizalarim', currentUser ? '#arizalarim' : '#royxat', <svg {...s}><path d="M8 4h8l1 3H7z" /><rect x="4" y="7" width="16" height="14" rx="2" /><path d="M9 13l2 2 4-4" /></svg>)}
      {currentUser
        ? item('profile', 'Profil', null, <svg {...s}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></svg>, onOpenProfile)
        : item('profile', 'Kirish', '#kirish', <svg {...s}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></svg>)}
    </nav>
  );
};

export const V2Footer: React.FC = () => (
  <footer className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-14 pb-32 md:pb-12 flex flex-wrap gap-6 items-center justify-between text-[14px] text-[#5E5A6B]">
    <Logo size={30} />
    <nav aria-label="Footer" className="flex flex-wrap gap-5 font-semibold">
      <a href="#" className="hover:text-[#5B3DF5]">E'lonlar</a>
      <a href="#brendlar" className="hover:text-[#5B3DF5]">Brendlar</a>
      <a href="#brendlar-uchun" className="hover:text-[#5B3DF5]">Brendlar uchun</a>
      <a href="#narxlar" className="hover:text-[#5B3DF5]">Narxlar</a>
      <a href="#referral" className="hover:text-[#5B3DF5]">Do'stlarni taklif qilish</a>
      <a href="/privacy.html" className="hover:text-[#5B3DF5]">Maxfiylik siyosati</a>
    </nav>
    <div>© 2026 Collabix · collabix.uz</div>
  </footer>
);
