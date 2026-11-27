import { useEffect, useRef, useState } from 'react';
import { Bell, Check, CheckCheck, Ticket, Utensils, ShieldCheck } from 'lucide-react';
import { notificationService } from '../../services/adminService';
import { formatRelativeTime } from '../../utils/formatters';

const TYPE_ICON = {
  coupon: { icon: Ticket, cls: 'bg-emerald-50 text-emerald-600' },
  redemption: { icon: Check, cls: 'bg-teal-50 text-teal-700' },
  menu: { icon: Utensils, cls: 'bg-amber-50 text-amber-600' },
  account: { icon: ShieldCheck, cls: 'bg-slate-100 text-slate-700' },
  system: { icon: Bell, cls: 'bg-slate-100 text-slate-600' },
};

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications(15);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // Fail silently in navbar dropdown
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const data = await notificationService.getNotifications(15);
        if (!active) return;
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } catch {
        // ignore
      }
    };
    poll();
    const interval = setInterval(poll, 45000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) fetchNotifications();
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#059669] px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-[#059669] hover:text-[#064E3B]"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="mx-auto mb-2 h-6 w-6 text-slate-300" />
                <p className="text-sm font-medium text-slate-700">You&apos;re all caught up</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Coupon updates and menu alerts will appear here.
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const typeInfo = TYPE_ICON[item.type] || TYPE_ICON.system;
                const IconComp = typeInfo.icon;
                return (
                  <div
                    key={item._id}
                    onClick={() => !item.read && handleMarkRead(item._id)}
                    className={`flex gap-3 px-4 py-3 transition-colors ${
                      item.read ? 'bg-white' : 'cursor-pointer bg-emerald-50/40 hover:bg-emerald-50/70'
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${typeInfo.cls}`}
                    >
                      <IconComp className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-900">{item.title}</p>
                        <span className="shrink-0 text-[11px] text-slate-400">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{item.message}</p>
                    </div>
                    {!item.read && (
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#059669]" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
