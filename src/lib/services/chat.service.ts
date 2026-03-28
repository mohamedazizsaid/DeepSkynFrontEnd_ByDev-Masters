import apiClient from '../api-client';
import type { ChatHistory, SendMessageDto } from '../types';

type BackendSendMessageResponse = {
  chatId?: string;
  isNewChat?: boolean;
  message?: {
    role?: string;
    content?: string;
    timestamp?: string;
  };
};

type BackendHistoryResponse =
  | ChatHistory[]
  | {
      chats?: ChatHistory[];
      total?: number;
    };

const nowIso = () => new Date().toISOString();

function normalizeChatHistory(chat: ChatHistory): ChatHistory {
  const rawMessages = Array.isArray(chat.messages)
    ? (chat.messages as Array<{ role?: string; content?: string; timestamp?: string }> )
    : [];

  const lastUser = [...rawMessages].reverse().find((m) => m.role === 'user');
  const lastAssistant = [...rawMessages].reverse().find((m) => m.role === 'assistant');

  const createdAt = chat.createdAt || lastAssistant?.timestamp || lastUser?.timestamp || nowIso();

  return {
    ...chat,
    message: chat.message || lastUser?.content || '',
    assistantResponse: chat.assistantResponse || lastAssistant?.content || null,
    createdAt,
    updatedAt: chat.updatedAt || createdAt,
  };
}

function normalizeSendMessageResponse(
  data: ChatHistory | BackendSendMessageResponse,
  sentMessage: string,
  sentContext?: Record<string, unknown>,
): ChatHistory {
  if ('assistantResponse' in data || 'createdAt' in data) {
    return normalizeChatHistory(data as ChatHistory);
  }

  const timestamp = data.message?.timestamp || nowIso();
  const assistantText = data.message?.content || null;

  return {
    id: data.chatId || `chat-${Date.now()}`,
    userId: '',
    message: sentMessage,
    imageUrl: null,
    modelUsed: null,
    assistantResponse: assistantText,
    messages: [
      { role: 'user', content: sentMessage, timestamp },
      ...(assistantText
        ? [{ role: 'assistant', content: assistantText, timestamp }]
        : []),
    ],
    context: sentContext || null,
    isPremium: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export const chatService = {
  async sendMessage(data: SendMessageDto): Promise<ChatHistory> {
    const res = await apiClient.post<ChatHistory | BackendSendMessageResponse>(
      '/chat/message',
      data,
    );
    return normalizeSendMessageResponse(res.data, data.message, data.context);
  },

  async getHistory(limit = 20, offset = 0): Promise<ChatHistory[]> {
    const res = await apiClient.get<BackendHistoryResponse>('/chat/history', {
      params: { limit, offset },
    });

    const chats = Array.isArray(res.data) ? res.data : (res.data.chats || []);
    return chats.map(normalizeChatHistory);
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
