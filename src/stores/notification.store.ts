import { create } from 'zustand';
import { notificationService } from '../lib/services/notification.service';
import type { Notification } from '../lib/types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;

  connect: (userId: string) => void;
  disconnect: () => void;
  fetchNotifications: (page?: number) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
  addNotification: (n: Notification) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isConnected: false,

  connect: (userId) => {
    notificationService.connect(userId, (notification) => {
      set((state) => ({
        notifications: [notification, ...state.notifications],
        unreadCount: notification.isRead ? state.unreadCount : state.unreadCount + 1,
      }));
    });
    set({ isConnected: true });
  },

  disconnect: () => {
    notificationService.disconnect();
    set({ isConnected: false });
  },

  fetchNotifications: async (page = 1) => {
    try {
      const result = await notificationService.getAll(page, 20);
      // Handle both PaginatedResponse and direct Array
      const notificationsFromApi = Array.isArray(result) ? result : (result as any).notifications || [];
      const unreadCountFromApi = Array.isArray(result) ? 0 : (result as any).unreadCount ?? 0;

      // Keep local notifications (created in frontend) so they are not lost after API refresh.
      const localNotifications = get().notifications.filter(
        (n) => typeof n.id === 'string' && n.id.startsWith('local-')
      );

      const apiIds = new Set(notificationsFromApi.map((n: Notification) => n.id));
      const localOnly = localNotifications.filter((n) => !apiIds.has(n.id));

      const mergedNotifications = [...localOnly, ...notificationsFromApi];
      const localUnread = localOnly.filter((n) => !n.isRead).length;
      
      set({ 
        notifications: mergedNotifications,
        unreadCount: unreadCountFromApi + localUnread
      });
    } catch {
      // silent fail
    }
  },

  fetchUnreadCount: async () => {
    try {
      const count = await notificationService.getUnreadCount();
      set({ unreadCount: count });
    } catch {
      // silent fail
    }
  },

  markAsRead: async (id) => {
    await notificationService.markAsRead(id);
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllAsRead: async () => {
    await notificationService.markAllAsRead();
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },

  removeNotification: async (id) => {
    await notificationService.delete(id);
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  addNotification: (n) =>
    set((state) => ({
      notifications: [n, ...state.notifications],
      unreadCount: n.isRead ? state.unreadCount : state.unreadCount + 1,
    })),
}));
