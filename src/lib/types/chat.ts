// ─── Chat Types ───
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface ChatHistory {
  id: string;
  userId: string;
  message: string;
  imageUrl: string | null;
  modelUsed: string | null;
  assistantResponse: string | null;
  messages: ChatMessage[] | null;
  context: Record<string, unknown> | null;
  isPremium: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageDto {
  message: string;
  chatId?: string;
  context?: Record<string, unknown>;
}
