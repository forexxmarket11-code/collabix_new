import React, { useState } from 'react';
import { Menu, X, ArrowRight, ShieldCheck, Sparkles, User, LogOut } from 'lucide-react';
import { PageType, UserSession, NotificationItem } from '../types';
import { ThemeToggle } from './ThemeToggle';
import { NotificationDropdown } from './NotificationDropdown';
import { isUserPro } from '../utils/subscription';

interface NavbarProps {
  onStartClick: () => void;
  onCatalogClick: () => void;
  onNavigate: (sectionId: string) => void;
  currentPage?: PageType;
  onHomeClick?: () => void;
  onCreateBriefClick?: () => void;
  currentUser?: UserSession | null;
  onLogout?: () => void;
  onProfileClick?: () => void;
  onOpenProModal?: () => void;
  notifications?: NotificationItem[];
  onSelectBrief?: (briefId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onStartClick,
  onCatalogClick,
  onNavigate,
  currentPage = 'home',
  onHomeClick,
  onCreateBriefClick,
  currentUser,
  onLogout,
  onProfileClick,
  onOpenProModal,
  notifications = [],
  onSelectBrief,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isRestricted = Boolean(currentUser && currentUser.accountStatus === 'rejected');
  const isPro = Boolean(isUserPro(currentUser) && !isRestricted);

  const handleNavClick = (sectionId: string) => {
    if (currentPage !== 'home' && onHomeClick) {
      onHomeClick();
      setTimeout(() => {
        onNavigate(sectionId);
      }, 100);
    } else {
      onNavigate(sectionId);
    }
    setMobileMenuOpen(false);
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onHomeClick) {
      onHomeClick();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header
      id="main-navbar"
      className="sticky top-0 z-50 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-indigo-100/70 dark:border-slate-800/80 transition-colors duration-200"
    >
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          
          {/* Logo with Vibrant Accent */}
          <div className="flex items-center gap-4 sm:gap-8 shrink-0">
            <a
              id="collabix-logo"
              href="#"
              onClick={handleLogoClick}
              className="flex items-center gap-1.5 min-h-[44px] group cursor-pointer shrink-0 whitespace-nowrap"
            >
              <span className="font-brand font-extrabold text-xl sm:text-2xl tracking-tighter bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-700 dark:from-white dark:via-indigo-200 dark:to-indigo-400 bg-clip-text text-transparent">
                COLLABIX
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 inline-block mb-1 shrink-0 group-hover:scale-125 transition-transform" />
            </a>

            {/* Verification Status Pill */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/60 dark:bg-indigo-950/40 text-xs font-mono font-medium text-indigo-900 dark:text-indigo-300">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Tekshirilgan kreatorlar tarmog'i</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          {isRestricted ? (
            <div className="hidden lg:flex items-center gap-3">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs font-heading font-medium text-rose-800 dark:text-rose-200">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Hisobingiz cheklangan</span>
              </span>
            </div>
          ) : (
            <nav className="hidden lg:flex items-center gap-5 xl:gap-7 whitespace-nowrap text-sm font-heading font-semibold text-slate-700 dark:text-slate-200">
              {currentPage !== 'home' && (
                <button
                  id="nav-link-home"
                  onClick={onHomeClick}
                  className="min-h-[44px] hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  Bosh sahifa
                </button>
              )}
              <button
                id="nav-link-catalog"
                onClick={onCatalogClick}
                className={`min-h-[44px] transition-colors cursor-pointer ${
                  currentPage === 'catalog'
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                Katalog
              </button>
              <button
                id="nav-link-create-brief"
                onClick={onCreateBriefClick}
                className={`min-h-[44px] transition-colors cursor-pointer ${
                  currentPage === 'create-brief'
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                Brif yaratish
              </button>
              {currentUser ? (
                <button
                  id="nav-link-profile"
                  onClick={onProfileClick}
                  className={`min-h-[44px] transition-colors cursor-pointer ${
                    currentPage === 'profile' || currentPage === 'edit-profile'
                      ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                >
                  Mening profilim
                </button>
              ) : (
                <button
                  id="nav-link-register"
                  onClick={onStartClick}
                  className="min-h-[44px] hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  Ro'yxatdan o'tish
                </button>
              )}
              <button
                id="nav-link-why"
                onClick={() => handleNavClick('why-collabix-section')}
                className="min-h-[44px] hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
              >
                Nima uchun Collabix
              </button>
              <button
                id="nav-link-how"
                onClick={() => handleNavClick('how-it-works-section')}
                className="min-h-[44px] hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
              >
                Qanday ishlaydi
              </button>
            </nav>
          )}

          {/* Action Buttons & Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Theme Toggle (Light/Dark mode) */}
            <ThemeToggle id="btn-navbar-theme-toggle" />

            {/* Notifications Dropdown */}
            {currentUser && (
              <NotificationDropdown
                notifications={notifications}
                currentUserId={currentUser.uid}
                onSelectBrief={onSelectBrief}
                className="hidden sm:block"
              />
            )}

            {currentUser ? (
              <div className="hidden sm:flex items-center gap-2.5">
                <button
                  type="button"
                  id="btn-nav-user-profile"
                  onClick={onProfileClick}
                  className="flex items-center gap-2 min-h-[44px] py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/70 transition-colors cursor-pointer"
                >
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name || 'User'}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold font-heading shrink-0">
                      {(currentUser?.name ? currentUser.name.charAt(0) : 'U').toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-heading font-bold text-slate-800 dark:text-slate-200 max-w-[120px] truncate">
                    {currentUser.name || 'Foydalanuvchi'}
                  </span>
                </button>
                <button
                  type="button"
                  id="btn-nav-logout"
                  onClick={onLogout}
                  title="Chiqish"
                  className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-200 dark:hover:border-rose-900 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-heading font-bold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Chiqish</span>
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-3">
                {currentPage !== 'home' ? (
                  <button
                    id="btn-nav-home"
                    onClick={onHomeClick}
                    className="min-h-[44px] px-4 py-2 text-xs font-heading font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/50 bg-white dark:bg-slate-800 cursor-pointer"
                  >
                    Bosh sahifa
                  </button>
                ) : (
                  <button
                    id="btn-nav-catalog"
                    onClick={onCatalogClick}
                    className="min-h-[44px] px-4 py-2 text-xs font-heading font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/50 bg-white dark:bg-slate-800 cursor-pointer"
                  >
                    Katalog
                  </button>
                )}
                
                <button
                  id="btn-nav-start"
                  onClick={onStartClick}
                  className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-heading font-bold text-xs uppercase tracking-wider shadow-md shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
                >
                  <span>Boshlash</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            )}

            {/* Mobile Notifications Dropdown */}
            {currentUser && (
              <div className="sm:hidden">
                <NotificationDropdown
                  notifications={notifications}
                  currentUserId={currentUser.uid}
                  onSelectBrief={onSelectBrief}
                />
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden min-w-[44px] min-h-[44px] p-2.5 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center"
              aria-label="Menyuni ochish"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu-dropdown"
          className="lg:hidden max-h-[calc(100dvh-64px)] overflow-y-auto overscroll-contain border-b border-indigo-100 dark:border-slate-800 bg-white/98 dark:bg-slate-900/98 px-4 pt-3 pb-6 space-y-3 shadow-xl transition-colors duration-300"
        >
          <div className="flex flex-col space-y-1 font-heading font-semibold text-[15px] text-slate-800 dark:text-slate-200">
            {isRestricted ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60">
                  <p className="text-sm font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Hisobingiz cheklangan</span>
                  </p>
                  <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">
                    Profil maʼlumotlarini tahrirlashingiz mumkin.
                  </p>
                </div>

                <button
                  id="mobile-nav-restricted-edit"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onProfileClick) onProfileClick();
                  }}
                  className="w-full min-h-[46px] text-left py-2.5 px-1 text-indigo-600 dark:text-indigo-400 font-bold border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2"
                >
                  <span>Profilni tahrirlash (Maʼlumotlarni toʻldirish)</span>
                  <span className="text-sm shrink-0">→</span>
                </button>
              </div>
            ) : (
              <>
                {currentPage === 'catalog' && (
                  <button
                    id="mobile-nav-home"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onHomeClick) onHomeClick();
                    }}
                    className="min-h-[46px] text-left py-2.5 border-b border-slate-100 dark:border-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center"
                  >
                    Bosh sahifa
                  </button>
                )}
                <button
                  id="mobile-nav-catalog"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onCatalogClick();
                  }}
                  className={`min-h-[46px] text-left py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center ${
                    currentPage === 'catalog' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                >
                  Katalog
                </button>
                <button
                  id="mobile-nav-create-brief"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onCreateBriefClick) onCreateBriefClick();
                  }}
                  className={`min-h-[46px] text-left py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center ${
                    currentPage === 'create-brief' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                >
                  Brif yaratish
                </button>
                {currentUser ? (
                  <button
                    id="mobile-nav-profile"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onProfileClick) onProfileClick();
                    }}
                    className={`min-h-[46px] text-left py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 ${
                      currentPage === 'profile' || currentPage === 'edit-profile'
                        ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                        : 'hover:text-indigo-600 dark:hover:text-indigo-400'
                    }`}
                  >
                    <span className="truncate">Mening profilim ({currentUser.name || 'Foydalanuvchi'})</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 uppercase shrink-0">
                      {currentUser.role}
                    </span>
                  </button>
                ) : (
                  <button
                    id="mobile-nav-register"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onStartClick();
                    }}
                    className="min-h-[46px] text-left py-2.5 border-b border-slate-100 dark:border-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center"
                  >
                    Ro'yxatdan o'tish
                  </button>
                )}
                <button
                  id="mobile-nav-why"
                  onClick={() => handleNavClick('why-collabix-section')}
                  className="min-h-[46px] text-left py-2.5 border-b border-slate-100 dark:border-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center"
                >
                  Nima uchun Collabix
                </button>
                <button
                  id="mobile-nav-how"
                  onClick={() => handleNavClick('how-it-works-section')}
                  className="min-h-[46px] text-left py-2.5 border-b border-slate-100 dark:border-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center"
                >
                  Qanday ishlaydi
                </button>
              </>
            )}
          </div>

          <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-sm font-heading font-medium text-slate-600 dark:text-slate-300">Rejim (Kunduzgi / Tungi)</span>
            <ThemeToggle id="btn-mobile-dropdown-theme-toggle" variant="pill" />
          </div>

          <div className="pt-1">
            {currentUser ? (
              <button
                id="mobile-btn-logout"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onLogout) onLogout();
                }}
                className="w-full min-h-[48px] py-3 px-4 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-heading font-bold text-center text-[15px] flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span className="truncate">Chiqish ({currentUser.name || 'Foydalanuvchi'})</span>
              </button>
            ) : (
              <button
                id="mobile-btn-start"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onStartClick();
                }}
                className="w-full min-h-[48px] py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-heading font-bold text-center text-[15px] shadow-md"
              >
                Boshlash
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
