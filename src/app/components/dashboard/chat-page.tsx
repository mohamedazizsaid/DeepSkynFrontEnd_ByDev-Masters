import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Send,
    Sparkles,
    Lock,
    Crown,
    Loader,
    Trash2,
    MessageSquare,
    Clock3,
    History,
    ChevronRight
} from 'lucide-react';
import { Button } from '../button';
import { Card } from '../card';
import { chatService } from '../../../lib/services/chat.service';
import { subscriptionService } from '../../../lib/services/subscription.service';
import type { ChatHistory } from '../../../lib/types';

interface ChatPageProps {
    onBack: () => void;
    onUpgrade?: () => void;
}

interface Message {
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: Date;
}

interface PersistedChatMessage {
    role?: string;
    content?: string;
    timestamp?: string;
}

const premiumButtonClass = 'bg-gradient-to-r from-[#FACC15] to-[#F59E0B] text-white border border-[#FCD34D] hover:from-[#FBBF24] hover:to-[#D97706] shadow-md hover:shadow-lg';

const formatRelative = (dateString?: string) => {
    if (!dateString) return 'Now';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Now';
    const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diffMin < 1) return 'Now';
    if (diffMin < 60) return `${diffMin}m`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const getConversationMessages = (chat: ChatHistory): Message[] => {
    const raw = Array.isArray(chat.messages) ? (chat.messages as PersistedChatMessage[]) : [];
    if (raw.length > 0) {
        return raw
            .filter((m) => m.content)
            .map((m, index) => ({
                id: `${chat.id}-${m.role || 'msg'}-${index}`,
                type: m.role === 'assistant' ? 'ai' : 'user',
                content: m.content || '',
                timestamp: new Date(m.timestamp || chat.updatedAt || chat.createdAt || Date.now()),
            }));
    }

    const fallback: Message[] = [];
    if (chat.message) {
        fallback.push({
            id: `${chat.id}-user-fallback`,
            type: 'user',
            content: chat.message,
            timestamp: new Date(chat.createdAt || Date.now()),
        });
    }
    if (chat.assistantResponse) {
        fallback.push({
            id: `${chat.id}-ai-fallback`,
            type: 'ai',
            content: chat.assistantResponse,
            timestamp: new Date(chat.updatedAt || chat.createdAt || Date.now()),
        });
    }
    return fallback;
};

const getConversationTitle = (chat: ChatHistory): string => {
    const raw = Array.isArray(chat.messages) ? (chat.messages as PersistedChatMessage[]) : [];
    const firstUser = raw.find((m) => m.role === 'user' && m.content?.trim());
    const title = firstUser?.content || chat.message || 'Skincare conversation';
    return title.length > 64 ? `${title.slice(0, 64)}...` : title;
};

export function ChatPage({ onBack, onUpgrade }: ChatPageProps) {
    const welcomeMessage: Message = {
        id: 'welcome',
        type: 'ai',
        content: "Hello! I'm your AI dermatology coach. I can help with skincare routines, active ingredients, and personalized tips based on your profile.",
        timestamp: new Date()
    };

    const [messages, setMessages] = useState<Message[]>([
        welcomeMessage
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isPremium, setIsPremium] = useState(false);
    const [dailyMessageCount, setDailyMessageCount] = useState(0);
    const [historyItems, setHistoryItems] = useState<ChatHistory[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const loadHistoryFromDb = async (preferredChatId?: string | null) => {
        const history = await chatService.getHistory(50, 0);

        if (history.length === 0) {
            setHistoryItems([]);
            setActiveChatId(null);
            setMessages([welcomeMessage]);
            setDailyMessageCount(0);
            return;
        }

        const ordered = [...history].sort(
            (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime(),
        );
        setHistoryItems(ordered);

        const selected = ordered.find((item) => item.id === preferredChatId) || ordered[0];
        setActiveChatId(selected.id);
        const selectedMessages = getConversationMessages(selected);
        setMessages(selectedMessages.length > 0 ? selectedMessages : [welcomeMessage]);

        const today = new Date().toDateString();
        const allMessages = ordered.flatMap(getConversationMessages);
        const todayCount = allMessages.filter((m) => m.type === 'user' && m.timestamp.toDateString() === today).length;
        setDailyMessageCount(todayCount);
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const [premium, history] = await Promise.allSettled([
                    subscriptionService.isPremium(),
                    chatService.getHistory(50, 0),
                ]);
                if (premium.status === 'fulfilled') setIsPremium(premium.value);

                if (history.status === 'fulfilled' && history.value.length > 0) {
                    const ordered = [...history.value].sort(
                        (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime(),
                    );
                    setHistoryItems(ordered);

                    const active = ordered[0];
                    setActiveChatId(active.id);
                    const loaded = getConversationMessages(active);
                    setMessages(loaded.length > 0 ? loaded : [welcomeMessage]);

                    const today = new Date().toDateString();
                    const allMessages = ordered.flatMap(getConversationMessages);
                    const todayCount = allMessages.filter((m) => m.type === 'user' && m.timestamp.toDateString() === today).length;
                    setDailyMessageCount(todayCount);
                } else if (history.status === 'fulfilled') {
                    setHistoryItems([]);
                    setActiveChatId(null);
                    setMessages([welcomeMessage]);
                    setDailyMessageCount(0);
                }
            } catch { /* use defaults */ }
        };
        loadData();
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const quickSuggestions = [
        'Build me a simple AM routine for oily skin',
        'Can I combine vitamin C and niacinamide?',
        'How to fade post-acne dark spots safely?',
        'What should I avoid if my skin is sensitive?'
    ];

    const freeLimit = 5;
    const freeRemaining = Math.max(0, freeLimit - dailyMessageCount);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            type: 'user',
            content: inputValue,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        const message = inputValue;
        setInputValue('');
        setIsTyping(true);

        try {
            const response = await chatService.sendMessage({ message, chatId: activeChatId || undefined });
            const aiMessage: Message = {
                id: response.id || (Date.now() + 1).toString(),
                type: 'ai',
                content: response.assistantResponse || 'I apologize, I could not generate a response. Please try again.',
                timestamp: new Date(response.createdAt || Date.now())
            };
            setMessages(prev => [...prev, aiMessage]);
            setDailyMessageCount((prev) => prev + 1);

            const chatId = response.id || activeChatId || `chat-${Date.now()}`;
            setActiveChatId(chatId);
            setHistoryItems((prev) => {
                const existing = prev.find((item) => item.id === chatId);
                const updated: ChatHistory = {
                    ...(existing || {
                        id: chatId,
                        userId: response.userId || '',
                        imageUrl: null,
                        modelUsed: null,
                        context: null,
                        isPremium,
                        messages: [],
                    }),
                    message,
                    assistantResponse: response.assistantResponse || existing?.assistantResponse || null,
                    createdAt: existing?.createdAt || response.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };

                const withoutCurrent = prev.filter((item) => item.id !== chatId);
                return [updated, ...withoutCurrent];
            });

            await loadHistoryFromDb(chatId);
        } catch (error: any) {
            const backendMessage = error?.response?.data?.message;
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: typeof backendMessage === 'string'
                    ? backendMessage
                    : 'Sorry, something went wrong. Please try again later.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleClearChat = async () => {
        try {
            await chatService.deleteAll();
            setMessages([{ ...welcomeMessage, timestamp: new Date() }]);
            setDailyMessageCount(0);
            setHistoryItems([]);
            setActiveChatId(null);
        } catch { /* ignore */ }
    };

    const handleQuickSuggestion = (suggestion: string) => {
        setInputValue(suggestion);
    };

    const handleSelectHistory = (chat: ChatHistory) => {
        const conversation = getConversationMessages(chat);
        setActiveChatId(chat.id);
        setMessages(conversation.length > 0 ? conversation : [welcomeMessage]);
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col">

            {/* Header */}
            <div className="mb-6 md:mb-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#0EA5E9]/25">
                            <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A]">AI Dermatology Coach</h1>
                            <div className="flex items-center gap-2 text-sm text-[#64748B]">
                                <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></div>
                                <span>Realtime assistant online</span>
                                <span className="hidden sm:inline">•</span>
                                <span className="hidden sm:inline">Personalized with your profile</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white/90 px-3 py-2 text-xs text-[#475569]">
                            <MessageSquare className="w-4 h-4 text-[#0EA5E9]" />
                            <span>{dailyMessageCount} sent today</span>
                        </div>
                        <button
                            onClick={handleClearChat}
                            className="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white/90 px-3 py-2 text-xs text-[#475569] hover:bg-[#F8FAFC] transition-colors"
                        >
                            <Trash2 className="w-4 h-4 text-[#64748B]" />
                            Clear chat
                        </button>
                        {!isPremium && onUpgrade && (
                            <Button onClick={onUpgrade} className={premiumButtonClass}>
                                <Crown className="w-5 h-5 text-white" />
                                Upgrade to Premium
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 flex-1 min-h-0">
                {/* Chat Area */}
                <div className="lg:col-span-2 flex flex-col min-h-0">
                    <Card className="flex-1 flex flex-col h-full p-0 overflow-hidden border-[#E2E8F0] shadow-md">

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-white [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                            <AnimatePresence>
                                {messages.map((message) => (
                                    <motion.div
                                        key={message.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[88%] md:max-w-[78%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                                            <div
                                                className={`rounded-2xl px-4 py-3 ${message.type === 'user'
                                                        ? 'bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] text-white shadow-lg shadow-[#0EA5E9]/20'
                                                        : 'bg-white text-[#334155] border border-[#E2E8F0] shadow-sm'
                                                    }`}
                                            >
                                                {message.type === 'ai' && (
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Sparkles className="w-4 h-4 text-[#0EA5E9]" />
                                                        <span className="text-xs font-medium text-[#0EA5E9]">AI Coach</span>
                                                    </div>
                                                )}
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                                            </div>
                                            <p className="text-xs text-[#94A3B8] mt-1 px-2 inline-flex items-center gap-1">
                                                <Clock3 className="w-3 h-3" />
                                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {/* Typing Indicator */}
                            {isTyping && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex justify-start"
                                >
                                    <div className="bg-white border border-[#E2E8F0] rounded-2xl px-4 py-3 shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <Loader className="w-4 h-4 text-[#0EA5E9] animate-spin" />
                                            <span className="text-sm text-[#6B7280]">AI is typing...</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="border-t border-[#E2E8F0] p-4 md:p-5 bg-white">
                            {!isPremium && (
                                <div className="mb-4 p-3 bg-[#FBBF24]/10 rounded-xl flex items-center gap-2 text-sm">
                                    <Lock className="w-4 h-4 text-[#FBBF24]" />
                                    <span className="text-[#F59E0B]">
                                        You have {freeRemaining} free messages remaining today.
                                        <button className="ml-1 underline font-medium" onClick={onUpgrade}>
                                            Upgrade for unlimited
                                        </button>
                                    </span>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Ask me anything about skincare..."
                                    className="flex-1 px-4 py-3 bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-xl 
                    focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20
                    transition-all duration-200"
                                />
                                <Button onClick={handleSend} disabled={!inputValue.trim() || isTyping}>
                                    <Send className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6 min-h-0 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {/* Chat History */}
                    <Card className="border-[#DBEAFE] bg-gradient-to-b from-white to-[#F8FAFC]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold inline-flex items-center gap-2">
                                <History className="w-5 h-5 text-[#0EA5E9]" />
                                Chat History
                            </h3>
                            <span className="text-xs px-2 py-1 rounded-full bg-[#E0F2FE] text-[#0369A1] font-medium">
                                {historyItems.length}
                            </span>
                        </div>

                        {historyItems.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-[#BFDBFE] bg-[#F0F9FF] px-4 py-5 text-sm text-[#64748B]">
                                Start a conversation to build your history.
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                <AnimatePresence initial={false}>
                                    {historyItems.map((chat) => {
                                        const isActive = chat.id === activeChatId;
                                        return (
                                            <motion.button
                                                key={chat.id}
                                                onClick={() => handleSelectHistory(chat)}
                                                whileHover={{ x: 2 }}
                                                whileTap={{ scale: 0.99 }}
                                                className={`w-full text-left p-3 rounded-xl border transition-all ${isActive
                                                    ? 'bg-[#E0F2FE] border-[#7DD3FC] shadow-sm'
                                                    : 'bg-white border-[#E2E8F0] hover:border-[#BAE6FD] hover:bg-[#F8FAFC]'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="text-sm font-semibold text-[#0F172A] line-clamp-2">
                                                        {getConversationTitle(chat)}
                                                    </p>
                                                    <span className="text-[11px] text-[#64748B] shrink-0">
                                                        {formatRelative(chat.updatedAt || chat.createdAt)}
                                                    </span>
                                                </div>
                                                <div className="mt-2 inline-flex items-center gap-1 text-xs text-[#0284C7] font-medium">
                                                    Open conversation
                                                    <ChevronRight className="w-3.5 h-3.5" />
                                                </div>
                                            </motion.button>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        )}
                    </Card>

                    {/* Quick Suggestions */}
                    <Card className="border-[#BFDBFE] bg-gradient-to-b from-white via-[#F8FBFF] to-[#F0F9FF] shadow-md shadow-[#0EA5E9]/10">
                        <div className="mb-4">
                            <h3 className="text-lg font-bold text-[#0F172A]">Quick Suggestions</h3>
                            <p className="text-xs text-[#64748B] mt-1">Tap a prompt to start a faster conversation</p>
                        </div>
                        <div className="space-y-2">
                            {quickSuggestions.map((suggestion, index) => (
                                <motion.button
                                    key={index}
                                    onClick={() => handleQuickSuggestion(suggestion)}
                                    className="group w-full text-left px-4 py-3 bg-white border border-[#DBEAFE] hover:bg-[#F0F9FF] hover:text-[#0369A1] hover:border-[#7DD3FC] rounded-xl transition-all duration-200 text-sm shadow-sm"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <span className="flex items-center justify-between gap-2">
                                        <span>{suggestion}</span>
                                        <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#0284C7] transition-colors" />
                                    </span>
                                </motion.button>
                            ))}
                        </div>
                    </Card>

                    {/* Context Info */}
                    <Card className="border-[#BFDBFE] bg-gradient-to-b from-white to-[#F8FAFC] shadow-md shadow-[#0EA5E9]/10">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-[#0F172A]">AI Context</h3>
                            <span className="text-[11px] px-2 py-1 rounded-full bg-[#E0F2FE] text-[#0369A1] font-semibold">Live</span>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between rounded-lg border border-[#E2E8F0] bg-white px-3 py-2">
                                <span className="text-[#6B7280]">Skin Type</span>
                                <span className="font-semibold text-[#0F172A]">Type III</span>
                            </div>
                            <div className="flex items-center justify-between rounded-lg border border-[#E2E8F0] bg-white px-3 py-2">
                                <span className="text-[#6B7280]">Age</span>
                                <span className="font-semibold text-[#0F172A]">28 years</span>
                            </div>
                            <div className="flex items-center justify-between rounded-lg border border-[#E2E8F0] bg-white px-3 py-2">
                                <span className="text-[#6B7280]">Main Concerns</span>
                                <span className="font-semibold text-[#0F172A]">Acne, Dark Spots</span>
                            </div>
                            <div className="rounded-lg border border-[#BAE6FD] bg-[#F0F9FF] px-3 py-2">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[#0369A1] font-medium">Current Score</span>
                                    <span className="font-bold text-[#0284C7]">87/100</span>
                                </div>
                                <div className="h-2 rounded-full bg-[#DBEAFE] overflow-hidden">
                                    <div className="h-full w-[87%] bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] rounded-full" />
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-[#0EA5E9]/10 rounded-xl border border-[#BAE6FD]">
                            <p className="text-xs text-[#0369A1]">
                                The AI uses your profile data to provide personalized skincare advice
                            </p>
                        </div>
                    </Card>

                    {/* Premium Features */}
                    {!isPremium && (
                        <Card className="border-2 border-[#FBBF24] bg-gradient-to-br from-[#FFFDF5] to-white">
                            <div className="text-center">
                                <Crown className="w-12 h-12 mx-auto mb-3 text-[#FBBF24]" />
                                <h3 className="text-lg font-bold mb-2">Premium Features</h3>
                                <ul className="text-sm text-[#6B7280] space-y-2 mb-4 text-left">
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#FBBF24]" />
                                        Unlimited messages
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#FBBF24]" />
                                        Priority responses
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#FBBF24]" />
                                        Advanced skin insights
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#FBBF24]" />
                                        Product recommendations
                                    </li>
                                </ul>
                                <Button className={`w-full ${premiumButtonClass}`} onClick={onUpgrade}>
                                    <Crown className="w-4 h-4 text-white" />
                                    Upgrade Now
                                </Button>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
