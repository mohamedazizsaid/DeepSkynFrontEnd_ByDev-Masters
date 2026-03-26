import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Check, CheckCheck, Trash2, Loader2, Info, CheckCircle, AlertTriangle, XCircle, BellOff, Sparkles } from 'lucide-react';
import { useNotificationStore } from '../../stores/notification.store';
import { useAccessibilityStore } from '../../stores/accessibility.store';
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
  info: 'bg-[#0EA5E9]/10 dark:bg-[#0EA5E9]/20',
  success: 'bg-[#10B981]/10 dark:bg-[#10B981]/20',
  warning: 'bg-[#F59E0B]/10 dark:bg-[#F59E0B]/20',
  error: 'bg-[#EF4444]/10 dark:bg-[#EF4444]/20',
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

  const { theme } = useAccessibilityStore();
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
          {/* Backdrop with sophisticated blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />

          {/* Panel - Premium Glassmorphism */}
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: 'spring', damping: 28, stiffness: 200 }}
            className="fixed right-4 top-4 bottom-4 w-full max-w-md bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-2xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] z-[101] flex flex-col rounded-3xl border border-white/20 dark:border-white/10 overflow-hidden"
          >
            {/* Premium Header with Gradient */}
            <div className="relative p-6 border-b border-gray-100 dark:border-white/10">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0EA5E9] via-[#06B6D4] to-[#F9A8D4]" />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-[#0EA5E9]/10 dark:bg-[#0EA5E9]/20 flex items-center justify-center">
                      <Bell className="w-6 h-6 text-[#0EA5E9]" />
                    </div>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#EF4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-[#0f172a] animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Notifications</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Restez informé de votre activité</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsRead()}
                      className="group p-2.5 bg-gray-50 dark:bg-white/5 hover:bg-[#0EA5E9] rounded-xl transition-all duration-300"
                      title="Tout marquer comme lu"
                    >
                      <CheckCheck className="w-5 h-5 text-[#0EA5E9] group-hover:text-white transition-colors" />
                    </button>
                  )}
                  <button 
                    onClick={onClose} 
                    className="p-2.5 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-all"
                  >
                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-[#0EA5E9]/20 border-t-[#0EA5E9] animate-spin" />
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-[#0EA5E9] animate-pulse" />
                  </div>
                  <p className="text-sm font-medium text-gray-500 animate-pulse">Chargement premium...</p>
                </div>
              ) : notifications.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-24 px-8 text-center"
                >
                  <div className="w-24 h-24 mb-6 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0EA5E9]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <BellOff className="w-10 h-10 text-gray-300 dark:text-gray-600 transition-transform group-hover:scale-110" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Tout est calme ici</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Vous n'avez aucune notification pour le moment. Revenez plus tard !</p>
                </motion.div>
              ) : (
                <div className="space-y-2 p-2">
                  {notifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`relative group flex items-start gap-4 p-4 rounded-2xl transition-all duration-300 border ${
                        !notification.isRead 
                          ? 'bg-[#0EA5E9]/5 dark:bg-[#0EA5E9]/10 border-[#0EA5E9]/20 dark:border-[#0EA5E9]/30' 
                          : 'bg-white dark:bg-white/5 border-transparent hover:border-gray-100 dark:hover:border-white/10 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-none'
                      }`}
                    >
                      <div className={`mt-0.5 w-12 h-12 rounded-2xl ${typeBg[notification.type]} flex items-center justify-center shrink-0 shadow-inner`}>
                        {typeIcons[notification.type]}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className={`text-sm font-bold truncate ${!notification.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                            {notification.title}
                          </h4>
                          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter whitespace-nowrap">
                            {formatTime(notification.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center gap-4 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-[11px] font-bold text-[#0EA5E9] hover:text-[#06B6D4] transition-colors flex items-center gap-1.5"
                            >
                              <div className="w-5 h-5 rounded-full bg-[#0EA5E9]/10 flex items-center justify-center">
                                <Check className="w-3 h-3" />
                              </div>
                              Marquer comme lu
                            </button>
                          )}
                          <button
                            onClick={() => removeNotification(notification.id)}
                            className="text-[11px] font-bold text-gray-400 hover:text-[#EF4444] transition-colors flex items-center gap-1.5"
                          >
                            <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                              <Trash2 className="w-3 h-3" />
                            </div>
                            Supprimer
                          </button>
                        </div>
                      </div>

                      {!notification.isRead && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#0EA5E9] shadow-[0_0_10px_#0EA5E9] group-hover:hidden" />
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with a bit of flare */}
            <div className="p-4 bg-gray-50/50 dark:bg-white/5 border-t border-gray-100 dark:border-white/10 flex items-center justify-center">
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
                DeepSkyn Notification Engine
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
