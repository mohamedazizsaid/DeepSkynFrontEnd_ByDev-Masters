import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Check, CheckCheck, Trash2, Loader2, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useNotificationStore } from '../../stores/notification.store';
import type { Notification } from '../../lib/types';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  info: <Info className="w-5 h-5 text-[#0EA5E9]" />,
  success: <CheckCircle className="w-5 h-5 text-[#10B981]" />,
  warning: <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />,
  error: <XCircle className="w-5 h-5 text-[#EF4444]" />,
};

const typeBg: Record<string, string> = {
  info: 'bg-[#0EA5E9]/10',
  success: 'bg-[#10B981]/10',
  warning: 'bg-[#F59E0B]/10',
  error: 'bg-[#EF4444]/10',
};

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotificationStore();

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      Promise.all([fetchNotifications(), fetchUnreadCount()]).finally(() =>
        setLoading(false)
      );
    }
  }, [isOpen, fetchNotifications, fetchUnreadCount]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins}min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Il y a ${diffDays}j`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-3">
                <Bell className="w-6 h-6 text-[#0EA5E9]" />
                <h2 className="text-xl font-bold">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-[#EF4444] text-white rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="p-2 hover:bg-[#F9FAFB] rounded-lg transition-colors"
                    title="Tout marquer comme lu"
                  >
                    <CheckCheck className="w-5 h-5 text-[#0EA5E9]" />
                  </button>
                )}
                <button onClick={onClose} className="p-2 hover:bg-[#F9FAFB] rounded-lg transition-colors">
                  <X className="w-5 h-5 text-[#6B7280]" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[#0EA5E9]" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Bell className="w-16 h-16 mb-4 text-[#D1D5DB]" />
                  <h3 className="text-lg font-semibold text-[#6B7280]">Aucune notification</h3>
                  <p className="text-sm text-[#9CA3AF]">Vous êtes à jour !</p>
                </div>
              ) : (
                <div>
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, x: 50 }}
                      className={`flex items-start gap-3 p-4 border-b border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors ${
                        !notification.isRead ? 'bg-[#0EA5E9]/5' : ''
                      }`}
                    >
                      <div className={`mt-0.5 w-10 h-10 rounded-xl ${typeBg[notification.type]} flex items-center justify-center shrink-0`}>
                        {typeIcons[notification.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-sm font-medium ${!notification.isRead ? 'text-[#111827]' : 'text-[#6B7280]'}`}>
                            {notification.title}
                          </h4>
                          <span className="text-xs text-[#9CA3AF] whitespace-nowrap">{formatTime(notification.createdAt)}</span>
                        </div>
                        <p className="text-sm text-[#6B7280] mt-0.5 line-clamp-2">{notification.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-[#0EA5E9] hover:underline flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" /> Marquer comme lu
                            </button>
                          )}
                          <button
                            onClick={() => removeNotification(notification.id)}
                            className="text-xs text-[#EF4444] hover:underline flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Supprimer
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
