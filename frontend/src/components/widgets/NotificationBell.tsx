import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Clock,
  Package,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  ExternalLink,
  Inbox,
  Sparkles,
} from 'lucide-react';
import { getSocket } from '../../lib/socketClient';
import { apiClient, adminApiClient } from '../../lib/apiClient';
import { getAuthToken, getAdminAuthToken } from '../../lib/auth-storage';

interface NotificationItem {
  id: string;
  type: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationBellProps {
  isAdmin?: boolean;
}

function formatTimeAgo(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return 'Vừa xong';
    if (diffMin < 60) return `${diffMin} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) {
      return `Hôm qua, ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ isAdmin: isAdminProp }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = Boolean(
    isAdminProp ?? (location.pathname.startsWith('/admin') || location.pathname.startsWith('/crm'))
  );

  const [activeToken, setActiveToken] = useState<string | null>(() =>
    isAdmin ? getAdminAuthToken() : getAuthToken()
  );

  useEffect(() => {
    const updateToken = () => {
      setActiveToken(isAdmin ? getAdminAuthToken() : getAuthToken());
    };
    updateToken();
    window.addEventListener('auth-change', updateToken);
    window.addEventListener('customer-auth-change', updateToken);
    window.addEventListener('admin-auth-change', updateToken);
    return () => {
      window.removeEventListener('auth-change', updateToken);
      window.removeEventListener('customer-auth-change', updateToken);
      window.removeEventListener('admin-auth-change', updateToken);
    };
  }, [isAdmin]);

  const client = useMemo(() => (isAdmin ? adminApiClient : apiClient), [isAdmin]);

  const fetchNotifications = useCallback(async () => {
    if (!activeToken) return;
    try {
      setIsRefreshing(true);
      const data = await client('/api/notifications');
      setNotifications(data?.notifications || []);
      setUnreadCount(data?.unreadCount || 0);
    } catch (err: any) {
      const msg = err?.message ?? '';
      const isSilent = msg === 'Unauthorized' || /HTTP Error (401|500|502|503)/.test(msg);
      if (!isSilent) {
        console.error('[NotificationBell] Error fetching notifications:', err);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [activeToken, client]);

  useEffect(() => {
    if (!activeToken) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications();

    // Connect to WebSockets via centralized client
    const socket = getSocket(activeToken);

    const handleNotification = (newNotif: NotificationItem) => {
      setNotifications((prev) => [newNotif, ...prev.filter((item) => item.id !== newNotif.id)]);
      setUnreadCount((prev) => prev + 1);

      // Subtle pleasant chime for new live notification
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
          osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.35);
        }
      } catch {
        // Ignore audio errors if blocked by browser policy
      }
    };

    socket.on('notification', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
    };
  }, [activeToken, fetchNotifications]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await client(`/api/notifications/${id}/read`, {
        method: 'PATCH',
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[NotificationBell] Error marking read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await client('/api/notifications/read-all', {
        method: 'PATCH',
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('[NotificationBell] Error marking all read:', err);
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.is_read) {
      markAsRead(notif.id);
    }
    setIsOpen(false);

    // Smart Navigation based on notification type
    if (isAdmin) {
      if (notif.type === 'ORDER_CREATED') {
        navigate('/admin/orders');
      } else if (notif.type === 'LOW_STOCK') {
        navigate('/admin/catalog');
      } else if (notif.type === 'RETURN_REQUESTED' || notif.type === 'RETURN_UPDATED') {
        navigate('/admin/returns');
      }
    } else {
      if (notif.type === 'ORDER_CREATED' || notif.type === 'RETURN_UPDATED') {
        navigate('/my-orders');
      }
    }
  };

  const getTypeMeta = (type: string) => {
    switch (type) {
      case 'ORDER_CREATED':
        return {
          icon: <Package className="w-4 h-4 text-emerald-600" />,
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          label: 'Đơn hàng mới',
        };
      case 'LOW_STOCK':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-rose-600" />,
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          label: 'Cảnh báo kho',
        };
      case 'RETURN_REQUESTED':
      case 'RETURN_UPDATED':
        return {
          icon: <RotateCcw className="w-4 h-4 text-sky-600" />,
          bg: 'bg-sky-50 text-sky-700 border-sky-200',
          label: 'Đổi trả',
        };
      default:
        return {
          icon: <Sparkles className="w-4 h-4 text-amber-600" />,
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          label: 'Hệ thống',
        };
    }
  };

  if (!activeToken) return null;

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.is_read;
    return true;
  });

  return (
    <div className="relative select-none" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative transition-all duration-200 cursor-pointer focus:outline-none ${
          isAdmin
            ? `w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full border shadow-2xs ${
                isOpen
                  ? 'bg-amber-50 text-amber-900 border-[#C8A96E] ring-2 ring-[#C8A96E]/30'
                  : 'border-[#C8A96E]/70 bg-white text-slate-700 hover:text-amber-800 hover:bg-amber-50/50 hover:border-[#C8A96E]'
              }`
            : `p-2 rounded-full ${
                isOpen
                  ? 'bg-amber-100/70 text-amber-900 ring-2 ring-amber-500/40'
                  : 'text-slate-700 hover:text-[#C8A96E] hover:bg-slate-100'
              }`
        }`}
        title="Thông báo hệ thống"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            className={`absolute bg-rose-600 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-xs animate-pulse ${
              isAdmin
                ? '-top-1 -right-1 min-w-[18px] h-[18px] px-1'
                : 'top-0.5 right-0.5 min-w-[18px] h-[18px] px-1'
            }`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popup */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600">
                <Bell className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                Thông Báo Hệ Thống
              </h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 rounded-full">
                  {unreadCount} mới
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={fetchNotifications}
                disabled={isRefreshing}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                title="Làm mới thông báo"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`} />
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-xs font-bold text-amber-700 hover:text-amber-800 hover:bg-amber-50 px-2 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer"
                  title="Đánh dấu tất cả là đã đọc"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Đọc hết
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 px-4 pt-2.5 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              Tất cả ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('unread')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'unread'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              Chưa đọc ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-84 overflow-y-auto divide-y divide-slate-100/80">
            {filteredNotifications.length === 0 ? (
              <div className="py-10 px-4 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
                  <Inbox className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-700">
                  {activeTab === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
                </p>
                <p className="text-[11px] text-slate-400">
                  Các cập nhật đơn hàng, tồn kho và đổi trả sẽ xuất hiện tại đây.
                </p>
              </div>
            ) : (
              filteredNotifications.map((n) => {
                const meta = getTypeMeta(n.type);
                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-3.5 text-xs transition-all duration-150 cursor-pointer flex items-start gap-3 hover:bg-amber-50/40 ${
                      !n.is_read
                        ? 'bg-amber-50/25 font-semibold text-slate-900'
                        : 'text-slate-600 bg-white'
                    }`}
                  >
                    {/* Type Icon */}
                    <div className="p-2 rounded-xl bg-slate-100/80 shrink-0 mt-0.5">
                      {meta.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${meta.bg}`}>
                          {meta.label}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(n.created_at)}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-800 leading-relaxed font-medium break-words">
                        {n.content}
                      </p>

                      <div className="flex items-center justify-between pt-0.5">
                        {!n.is_read ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
                            Mới
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Đã xem</span>
                        )}
                        <span className="text-[10px] text-slate-400 hover:text-amber-700 inline-flex items-center gap-0.5 font-medium">
                          Xem chi tiết <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Tổng cộng: {notifications.length} thông báo</span>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    navigate('/admin/orders');
                    setIsOpen(false);
                  }}
                  className="font-bold text-amber-700 hover:underline cursor-pointer"
                >
                  Quản lý đơn hàng →
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
