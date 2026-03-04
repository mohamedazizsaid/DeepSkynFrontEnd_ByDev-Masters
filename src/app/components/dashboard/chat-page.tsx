import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Send, Sparkles, Lock, Crown, Loader, Trash2 } from 'lucide-react';
import { Button } from '../button';
import { Card } from '../card';
import { chatService } from '../../../lib/services/chat.service';
import { subscriptionService } from '../../../lib/services/subscription.service';
import type { ChatMessage } from '../../../lib/types';

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

export function ChatPage({ onBack, onUpgrade }: ChatPageProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hello! I'm your AI dermatology coach. I can help you with skincare advice, product recommendations, and answer questions about your skin. How can I assist you today?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [premium, history] = await Promise.allSettled([
          subscriptionService.isPremium(),
          chatService.getHistory(1, 50),
        ]);
        if (premium.status === 'fulfilled') setIsPremium(premium.value);
        if (history.status === 'fulfilled' && history.value.data?.length > 0) {
          const loaded: Message[] = history.value.data.flatMap((chat: ChatMessage) => {
            const msgs: Message[] = [
              { id: chat.id + '-user', type: 'user', content: chat.message, timestamp: new Date(chat.createdAt) },
            ];
            if (chat.response) {
              msgs.push({ id: chat.id + '-ai', type: 'ai', content: chat.response, timestamp: new Date(chat.createdAt) });
            }
            return msgs;
          });
          setMessages(prev => [...prev, ...loaded]);
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
    "What's best for dry skin?",
    "Should I use retinol?",
    "How to reduce dark spots?",
    "Best morning routine?"
  ];

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
      const response = await chatService.sendMessage({ message });
      const aiMessage: Message = {
        id: response.id || (Date.now() + 1).toString(),
        type: 'ai',
        content: response.response || 'I apologize, I could not generate a response. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Sorry, something went wrong. Please try again later.',
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
      setMessages([{
        id: '1',
        type: 'ai',
        content: "Chat history cleared! How can I help you today?",
        timestamp: new Date()
      }]);
    } catch { /* ignore */ }
  };

  const handleQuickSuggestion = (suggestion: string) => {
    setInputValue(suggestion);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#6B7280] hover:text-[#0EA5E9] mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Dermatology Coach</h1>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></div>
                <span className="text-sm text-[#6B7280]">Online</span>
              </div>
            </div>
          </div>
          
          {!isPremium && onUpgrade && (
            <Button variant="outline" onClick={onUpgrade}>
              <Crown className="w-5 h-5 text-[#FBBF24]" />
              Upgrade to Premium
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 h-[calc(100%-120px)]">
        {/* Chat Area */}
        <div className="lg:col-span-2 flex flex-col">
          <Card className="flex-1 flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          message.type === 'user'
                            ? 'bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] text-white'
                            : 'bg-[#F9FAFB] text-[#374151] border border-[#E5E7EB]'
                        }`}
                      >
                        {message.type === 'ai' && (
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-[#0EA5E9]" />
                            <span className="text-xs font-medium text-[#0EA5E9]">AI Coach</span>
                          </div>
                        )}
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      </div>
                      <p className="text-xs text-[#9CA3AF] mt-1 px-2">
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
                  <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl px-4 py-3">
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
            <div className="border-t border-[#E5E7EB] p-4">
              {!isPremium && (
                <div className="mb-4 p-3 bg-[#FBBF24]/10 rounded-xl flex items-center gap-2 text-sm">
                  <Lock className="w-4 h-4 text-[#FBBF24]" />
                  <span className="text-[#F59E0B]">
                    You have 5 free messages remaining today. 
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
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me anything about skincare..."
                  className="flex-1 px-4 py-3 bg-[#F9FAFB] border-2 border-[#E5E7EB] rounded-xl 
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
        <div className="space-y-6">
          {/* Quick Suggestions */}
          <Card>
            <h3 className="text-lg font-bold mb-4">Quick Suggestions</h3>
            <div className="space-y-2">
              {quickSuggestions.map((suggestion, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleQuickSuggestion(suggestion)}
                  className="w-full text-left px-4 py-3 bg-[#F9FAFB] hover:bg-[#0EA5E9]/10 hover:text-[#0EA5E9] rounded-xl transition-all duration-200 text-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </Card>

          {/* Context Info */}
          <Card>
            <h3 className="text-lg font-bold mb-4">AI Context</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[#6B7280]">Skin Type:</span>
                <span className="font-medium">Type III</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B7280]">Age:</span>
                <span className="font-medium">28 years</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B7280]">Main Concerns:</span>
                <span className="font-medium">Acne, Dark Spots</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B7280]">Current Score:</span>
                <span className="font-medium text-[#0EA5E9]">87/100</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-[#0EA5E9]/10 rounded-xl">
              <p className="text-xs text-[#0EA5E9]">
                The AI uses your profile data to provide personalized skincare advice
              </p>
            </div>
          </Card>

          {/* Premium Features */}
          {!isPremium && (
            <Card className="border-2 border-[#FBBF24]">
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
                <Button className="w-full" onClick={onUpgrade}>
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
