import apiClient from '../api-client';
import { io, Socket } from 'socket.io-client';
import type { Notification, PaginatedResponse } from '../types';

let socket: Socket | null = null;

export const notificationService = {
  // ─── REST API ───
  async getAll(page = 1, limit = 20, unreadOnly = false): Promise<PaginatedResponse<Notification>> {
    const res = await apiClient.get<PaginatedResponse<Notification>>('/notifications', {
      params: { page, limit, unreadOnly },
    });
    return res.data;
  },

  async getUnreadCount(): Promise<number> {
    const res = await apiClient.get<{ count: number }>('/notifications/unread-count');
    return res.data.count;
  },

  async markAsRead(id: string): Promise<Notification> {
    const res = await apiClient.patch<Notification>(`/notifications/${id}/read`);
    return res.data;
  },

  async markAllAsRead(): Promise<{ count: number }> {
    const res = await apiClient.patch<{ count: number }>('/notifications/read-all');
    return res.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/notifications/${id}`);
  },

  async deleteAll(): Promise<{ count: number }> {
    const res = await apiClient.delete<{ count: number }>('/notifications');
    return res.data;
  },

  // ─── WebSocket ───
  connect(userId: string, onNotification: (n: Notification) => void): void {
    const baseUrl = 'http://localhost:3000';
    
    socket = io(`${baseUrl}/notifications`, {
      auth: { token: localStorage.getItem('access_token') },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      socket?.emit('join', { userId });
    });

    socket.on('notification', (notification: Notification) => {
      onNotification(notification);
    });

    socket.on('disconnect', () => {
      console.log('Notification socket disconnected');
    });
  },

  disconnect(): void {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },
};
