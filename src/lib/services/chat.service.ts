import apiClient from '../api-client';
import type { ChatHistory, SendMessageDto } from '../types';

export const chatService = {
  async sendMessage(data: SendMessageDto): Promise<ChatHistory> {
    const res = await apiClient.post<ChatHistory>('/chat/message', data);
    return res.data;
  },

  async getHistory(limit = 20, offset = 0): Promise<ChatHistory[]> {
    const res = await apiClient.get<ChatHistory[]>('/chat/history', {
      params: { limit, offset },
    });
    return res.data;
  },

  async getById(id: string): Promise<ChatHistory> {
    const res = await apiClient.get<ChatHistory>(`/chat/${id}`);
    return res.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/chat/${id}`);
  },

  async deleteAll(): Promise<{ deletedCount: number }> {
    const res = await apiClient.delete<{ deletedCount: number }>('/chat');
    return res.data;
  },
};
