import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, FileText, Calendar, CreditCard, MessageSquare, Radio, Info } from 'lucide-react';
import { useNotifications, type Notification } from '../../hooks/useNotifications';

interface NotificationBellProps {
  userId: string | null;
}

// ── Icon per notification type ─────────────────────────────────────────────
const typeIcon = (type: Notification['type']) => {
  const cls = 'h-4 w-4';
  switch (type) {
    case 'quote':       return <FileText className={cls} />;
    case 'appointment': return <Calendar className={cls} />;
    case 'payment':     return <CreditCard className={cls} />;
    case 'message':     return <MessageSquare className={cls} />;
    case 'live':        return <Radio className={cls} />;
    default:            return <Info className={cls} />;
  }
};

const typeBg = (type: Notification['type']) => {
  switch (type) {
    case 'quote':       return 'bg-blue-100 text-blue-600';
    case 'appointment': return 'bg-purple-100 text-purple-600';
    case 'payment':     return 'bg-green-100 text-green-600';
    case 'message':     return 'bg-amber-100 text-amber-600';
    case 'live':        return 'bg-red-100 text-red-600';
    default:            return 'bg-secondary-100 text-secondary-600';
  }
};

const timeAgo = (date: string): string => {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60)   return 'À l\'instant';
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  return `Il y a ${Math.floor(diff / 86400)}j`;
};

const NotificationBell: React.FC<NotificationBellProps> = ({ userId }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(userId);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setOpen((prev) => !prev);
  };

  const handleClick = async (notif: Notification) => {
    if (!notif.is_read) await markAsRead(notif.id);
    if (notif.link) window.location.href = notif.link;
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* ── Bell button ── */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-full text-secondary-600 hover:text-primary-600 hover:bg-primary-50 transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[1rem] px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-secondary-100 z-50 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-secondary-100 bg-secondary-50">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary-600" />
              <span className="font-semibold text-secondary-800 text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-primary-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary-600 hover:text-primary-800 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-primary-50 transition-colors"
                  title="Tout marquer comme lu"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Tout lire
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-96 overflow-y-auto divide-y divide-secondary-50">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="h-8 w-8 text-secondary-300 mx-auto mb-2" />
                <p className="text-sm text-secondary-500">Aucune notification</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`w-full text-left px-4 py-3 hover:bg-secondary-50 transition-colors flex gap-3 items-start group ${
                    !notif.is_read ? 'bg-primary-50/40' : ''
                  }`}
                >
                  {/* Icon */}
                  <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${typeBg(notif.type)}`}>
                    {typeIcon(notif.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium truncate ${!notif.is_read ? 'text-secondary-900' : 'text-secondary-700'}`}>
                        {notif.title}
                      </p>
                      {!notif.is_read && (
                        <span className="shrink-0 h-2 w-2 rounded-full bg-primary-500 mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-secondary-500 line-clamp-2 mt-0.5">{notif.message}</p>
                    <p className="text-[10px] text-secondary-400 mt-1">{timeAgo(notif.created_at)}</p>
                  </div>

                  {/* Mark as read on hover */}
                  {!notif.is_read && (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); markAsRead(notif.id); } }}
                      className="shrink-0 p-1 rounded-full text-secondary-300 hover:text-primary-600 hover:bg-primary-50 opacity-0 group-hover:opacity-100 transition-all"
                      title="Marquer comme lu"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-secondary-100 bg-secondary-50 text-center">
              <p className="text-xs text-secondary-400">{notifications.length} notification{notifications.length > 1 ? 's' : ''} au total</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
