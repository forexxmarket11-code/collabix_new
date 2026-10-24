import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  CheckCheck,
  Package,
  FileText,
  UserCheck,
  X,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { NotificationItem } from '../types';
import {
  markNotificationAsReadInFirestore,
  markAllNotificationsAsReadInFirestore,
  requestBrowserNotificationPermission,
} from '../firebase';

interface NotificationDropdownProps {
  notifications: NotificationItem[];
  currentUserId?: string;
  onSelectBrief?: (briefId: string) => void;
  onOpenChat?: () => void;
  className?: string;
}

function formatUzbekRelativeTime(dateStr: string): string {
  if (!dateStr || dateStr === 'Hozirgina') return 'Hozirgina';
  const time = new Date(dateStr).getTime();
  if (isNaN(time)) return dateStr;
  const now = Date.now();
  const diffSec = Math.floor((now - time) / 1000);
  if (diffSec < 60) return 'Hozirgina';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} daqiqa oldin`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} soat oldin`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return 'Kecha';
  if (diffDay < 7) return `${diffDay} kun oldin`;
  return new Date(time).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' });
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  currentUserId,
  onSelectBrief,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleMarkAllAsRead = async () => {
    if (currentUserId) {
      await markAllNotificationsAsReadInFirestore(currentUserId);
    }
  };

  const handleItemClick = async (notif: NotificationItem) => {
    if (!notif.read) {
      await markNotificationAsReadInFirestore(notif.id);
    }
    setIsOpen(false);

    // If it's linked to a brief, open it directly
    if (notif.briefId && onSelectBrief) {
      onSelectBrief(notif.briefId);
    }
  };

  const handleEnableBrowserNotifications = async () => {
    const granted = await requestBrowserNotificationPermission();
    setHasPermission(granted);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        id="btn-navbar-notifications"
        onClick={handleToggle}
        aria-label="Bildirishnomalar"
        aria-expanded={isOpen}
        title="Bildirishnomalar"
        className={`relative p-2 rounded-xl border transition-all cursor-pointer ${
          isOpen
            ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20'
            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/70 hover:text-indigo-600 dark:hover:text-indigo-400'
        }`}
      >
        <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />

        {/* Unread Red Badge */}
        {unreadCount > 0 && (
          <span
            id="notification-badge-counter"
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-heading font-extrabold flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-sm animate-pulse"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover / Dropdown Menu */}
      {isOpen && (
        <div
          id="notifications-dropdown-menu"
          className="absolute right-0 mt-2 w-[340px] sm:w-[390px] max-w-[92vw] rounded-2xl bg-white dark:bg-[#181822] border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/70 dark:bg-[#13131C]">
            <div className="flex items-center gap-2">
              <span className="font-heading font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                Bildirishnomalar
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-heading font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60">
                  {unreadCount} ta yangi
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  id="btn-mark-all-read"
                  onClick={handleMarkAllAsRead}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-heading font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
                  title="Barchasini o'qilgan deb belgilash"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>O'qilgan qilish</span>
                </button>
              )}
              <button
                type="button"
                id="btn-close-notifications"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {notifications.length === 0 ? (
              <div className="py-12 px-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6 stroke-[1.8]" />
                </div>
                <h4 className="font-heading font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">
                  Hozircha yangi bildirishnomalar yo'q
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[260px] mx-auto leading-relaxed">
                  Brendlardan yangi briflar va takliflar yuborilganda bu yerda ko'rinadi.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isBrief = notif.type === 'yangi_brif';
                const isApplication = notif.type === 'ariza_keldi';

                return (
                  <button
                    key={notif.id}
                    type="button"
                    onClick={() => handleItemClick(notif)}
                    className={`w-full text-left p-3.5 sm:p-4 flex items-start gap-3 transition-colors cursor-pointer group ${
                      !notif.read
                        ? 'bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Avatar or Icon */}
                    <div className="relative shrink-0 mt-0.5">
                      {notif.senderAvatar ? (
                        <img
                          src={notif.senderAvatar}
                          alt={notif.senderName || 'Brend'}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                        />
                      ) : (
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-heading font-bold text-xs ${
                            isBrief
                              ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm'
                              : isApplication
                              ? 'bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {isBrief ? (
                            <Package className="w-5 h-5 text-white" />
                          ) : isApplication ? (
                            <FileText className="w-5 h-5 text-white" />
                          ) : (
                            <UserCheck className="w-5 h-5" />
                          )}
                        </div>
                      )}

                      {/* Small badge icon */}
                      <span
                        className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-[#181822] text-[9px] ${
                          isBrief
                            ? 'bg-indigo-600 text-white'
                            : isApplication
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-600 text-white'
                        }`}
                      >
                        {isBrief ? '⚡' : '📋'}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-heading font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          {isBrief ? 'Yangi Brif' : isApplication ? 'Ariza keldi' : 'Bildirishnoma'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {formatUzbekRelativeTime(notif.createdAt)}
                        </span>
                      </div>

                      <p
                        className={`text-xs sm:text-[13px] leading-snug line-clamp-2 ${
                          !notif.read
                            ? 'font-bold text-slate-900 dark:text-white'
                            : 'font-medium text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {notif.message}
                      </p>

                      {notif.briefTitle && (
                        <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium max-w-full truncate">
                          <span className="truncate">Vazifa: "{notif.briefTitle}"</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-60 group-hover:opacity-100" />
                        </div>
                      )}
                    </div>

                    {/* Unread indicator dot */}
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0 mt-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer - Optional Browser Push permission prompt */}
          {!hasPermission && typeof window !== 'undefined' && 'Notification' in window && (
            <div className="p-3 bg-slate-50 dark:bg-[#12121A] border-t border-slate-100 dark:border-slate-800 text-center">
              <button
                type="button"
                id="btn-enable-browser-notifications"
                onClick={handleEnableBrowserNotifications}
                className="inline-flex items-center gap-1.5 text-[11px] font-heading font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Brauzer bildirishnomalarini yoqish</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
