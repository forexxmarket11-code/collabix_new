import React from 'react';
import { Home, Search, Package, MessageSquare, User, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { PageType, UserSession } from '../types';

interface BottomNavProps {
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
  isLoggedIn: boolean;
  currentUser?: UserSession | null;
  onOpenRegister: () => void;
  unreadNotificationsCount?: number;
  unreadMessagesCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentPage,
  onNavigate,
  isLoggedIn,
  currentUser,
  onOpenRegister,
  unreadNotificationsCount = 0,
  unreadMessagesCount = 0,
}) => {
  const navItems: Array<{
    id: string;
    key: PageType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    requiresAuth?: boolean;
  }> = [
    {
      id: 'btn-bottom-nav-home',
      key: 'home',
      label: 'Bosh sahifa',
      icon: Home,
    },
    {
      id: 'btn-bottom-nav-catalog',
      key: 'catalog',
      label: 'Katalog',
      icon: Search,
    },
    {
      id: 'btn-bottom-nav-orders',
      key: 'orders',
      label: 'Briflar',
      icon: Package,
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
    },
    {
      id: 'btn-bottom-nav-messages',
      key: 'messages',
      label: 'Xabarlar',
      icon: MessageSquare,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
    },
    {
      id: 'btn-bottom-nav-profile',
      key: 'profile',
      label: 'Profil',
      icon: User,
      requiresAuth: true,
    },
  ];

  const handleItemClick = (item: typeof navItems[number]) => {
    if (item.requiresAuth && !isLoggedIn) {
      onOpenRegister();
      return;
    }
    onNavigate(item.key);
  };

  return (
    <aside
      id="bottom-navigation-container"
      aria-label="Pastki suzuvchi navigatsiya paneli"
      className="fixed bottom-0 inset-x-0 z-40 flex justify-center pointer-events-none px-2.5 sm:px-4 pt-2 pb-[max(12px,calc(env(safe-area-inset-bottom,0px)+8px))] sm:pb-[max(20px,calc(env(safe-area-inset-bottom,0px)+12px))]"
    >
      {/* Floating Pill Capsule Dock */}
      <nav
        id="bottom-navigation-bar"
        className="pointer-events-auto relative flex items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 rounded-full bg-slate-950/98 border border-white/15 shadow-[0_16px_36px_rgba(15,23,42,0.38),0_4px_12px_rgba(0,0,0,0.16)] ring-1 ring-white/10 max-w-md w-full justify-between select-none transform-gpu"
      >
        {/* Subtle decorative glow inside dock */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 pointer-events-none" />

        {navItems.map((item) => {
          const isActive = currentPage === item.key;
          const Icon = item.icon;

          return (
            <button
              key={item.key}
              id={item.id}
              type="button"
              onClick={() => handleItemClick(item)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex-1 flex flex-col items-center justify-center min-h-[48px] min-w-[44px] py-1.5 px-1 sm:px-2 rounded-full transition-all duration-200 cursor-pointer group outline-none ${
                isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Sliding Active Capsule Indicator using motion */}
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active-pill"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-md shadow-indigo-600/35 border border-white/20"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              {/* Icon with badges & avatar handling */}
              <div className="relative z-10 flex items-center justify-center">
                {item.key === 'profile' && isLoggedIn && currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    width={22}
                    height={22}
                    className={`w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-full object-cover ring-2 transition-transform ${
                      isActive ? 'ring-white scale-110' : 'ring-slate-500 group-hover:scale-105'
                    }`}
                  />
                ) : (
                  <Icon
                    className={`w-5 h-5 sm:w-5.5 sm:h-5.5 transition-all duration-200 ${
                      isActive
                        ? 'stroke-[2.5] scale-110 text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.4)]'
                        : 'stroke-[1.8] text-slate-400 group-hover:text-white group-hover:scale-105'
                    }`}
                  />
                )}

                {/* Notification Badge on Orders or Messages */}
                {item.badge && !isActive && (
                  typeof item.badge === 'number' && item.key === 'orders' ? (
                    <span className="absolute -top-1.5 -right-2 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-600 ring-2 ring-slate-950 text-[9px] font-heading font-extrabold text-white flex items-center justify-center animate-pulse">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  ) : (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-pink-500 ring-2 ring-slate-950 animate-pulse" />
                  )
                )}
              </div>

              {/* Label */}
              <span
                className={`relative z-10 text-[10.5px] sm:text-[11px] font-heading tracking-tight mt-1 transition-all duration-200 truncate max-w-full leading-none ${
                  isActive
                    ? 'font-extrabold text-white scale-100'
                    : 'font-medium text-slate-400 group-hover:text-slate-200'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
