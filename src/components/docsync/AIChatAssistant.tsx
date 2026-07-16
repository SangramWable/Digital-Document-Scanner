'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Send,
  Bot,
  User,
  Trash2,
  Globe,
  Loader2,
  Mic,
  MicOff,
  Volume2,
} from 'lucide-react';

import { useAppStore, type ChatMessage } from '@/lib/store';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const QUICK_QUESTIONS = [
  'How can I update my Aadhaar?',
  'How do I correct my PAN DOB?',
  'Which documents are needed for a scholarship?',
  'Where is the nearest Tehsil office?',
  'Can I correct my address online?',
  'What is DigiLocker?',
];

const LANGUAGES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
  mr: 'Marathi',
};

export default function AIChatAssistant() {
  const {
    chatMessages,
    chatLoading,
    addChatMessage,
    setChatLoading,
    clearChat,
  } = useAppStore();

  const [inputValue, setInputValue] = useState('');
  const [language, setLanguage] = useState('en');
  const [error, setError] = useState<string | null>(null);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      );
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [chatMessages, chatLoading]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || chatLoading) return;

      setError(null);
      setRetryMessage(null);

      // Add user message
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: message.trim(),
        timestamp: new Date().toISOString(),
      };
      addChatMessage(userMessage);
      setInputValue('');
      setChatLoading(true);

      try {
        // Build history from last 10 messages
        const history = chatMessages.slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: message.trim(),
            history,
            language,
          }),
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        // Add assistant message
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.response || 'I apologize, I could not process your request.',
          timestamp: new Date().toISOString(),
        };
        addChatMessage(assistantMessage);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Something went wrong';
        setError(errorMessage);
        setRetryMessage(message.trim());
      } finally {
        setChatLoading(false);
        inputRef.current?.focus();
      }
    },
    [chatLoading, chatMessages, language, addChatMessage, setChatLoading]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
  };

  const handleRetry = () => {
    if (retryMessage) {
      setError(null);
      setRetryMessage(null);
      sendMessage(retryMessage);
    }
  };

  const handleClearChat = () => {
    clearChat();
    setError(null);
    setRetryMessage(null);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto">
      {/* Chat Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-emerald-200 dark:border-emerald-800 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg text-emerald-900 dark:text-emerald-100">
                    AI Chat Assistant
                  </CardTitle>
                  <p className="text-sm text-emerald-700/70 dark:text-emerald-300/70">
                    Ask about Indian government documents, corrections, and services
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Language Selector */}
                <div className="flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-[120px] h-8 text-xs border-emerald-300 dark:border-emerald-700 bg-white/80 dark:bg-emerald-950/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(LANGUAGES).map(([code, name]) => (
                        <SelectItem key={code} value={code}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator
                  orientation="vertical"
                  className="h-6 bg-emerald-300/50 dark:bg-emerald-700/50"
                />

                {/* Clear Chat */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleClearChat}
                      disabled={chatMessages.length === 0}
                      className="h-8 w-8 text-emerald-600 hover:text-red-600 hover:bg-red-50 dark:text-emerald-400 dark:hover:text-red-400 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Clear chat history</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Chat Messages Area */}
      <Card className="flex-1 mt-3 flex flex-col min-h-0 border-emerald-200/60 dark:border-emerald-800/60">
        <ScrollArea ref={scrollRef} className="flex-1 px-1">
          <div className="p-4 space-y-4">
            {/* Welcome message when chat is empty */}
            <AnimatePresence mode="wait">
              {chatMessages.length === 0 && !chatLoading && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                    <Bot className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
                    Welcome to DocSync AI Assistant
                  </h3>
                  <p className="mt-1 max-w-md text-sm text-muted-foreground">
                    I can help you with Indian government document queries, correction
                    processes, portal information, and more. Ask me anything!
                  </p>
                  <Badge
                    variant="secondary"
                    className="mt-3 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                  >
                    <Volume2 className="mr-1 h-3 w-3" />
                    {LANGUAGES[language]} mode active
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <AnimatePresence initial={false}>
              {chatMessages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25, delay: index === chatMessages.length - 1 ? 0.05 : 0 }}
                  className={`flex gap-2.5 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {/* Bot Avatar - left side */}
                  {msg.role === 'assistant' && (
                    <div className="flex-shrink-0 mt-1">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800">
                        <Bot className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[80%] sm:max-w-[70%] ${
                      msg.role === 'user'
                        ? 'order-1'
                        : ''
                    }`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-emerald-600 text-white rounded-br-md'
                          : 'bg-card border border-border rounded-bl-md shadow-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    </div>
                    <div
                      className={`mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground ${
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <User className="h-3 w-3" />
                      ) : (
                        <Bot className="h-3 w-3" />
                      )}
                      <span>{formatTimestamp(msg.timestamp)}</span>
                    </div>
                  </div>

                  {/* User Avatar - right side */}
                  {msg.role === 'user' && (
                    <div className="flex-shrink-0 mt-1 order-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white">
                        <User className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Loading indicator */}
            <AnimatePresence>
              {chatLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex gap-2.5 justify-start"
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800">
                      <Bot className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                  <div className="max-w-[80%] sm:max-w-[70%]">
                    <div className="rounded-2xl rounded-bl-md bg-card border border-border px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin text-emerald-600 dark:text-emerald-400" />
                        <span>Thinking...</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error with retry */}
            <AnimatePresence>
              {error && !chatLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex justify-center"
                >
                  <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-center">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {error}
                    </p>
                    {retryMessage && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRetry}
                        className="mt-2 h-7 text-xs border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950/50"
                      >
                        Retry
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </Card>

      {/* Quick Questions */}
      <AnimatePresence>
        {chatMessages.length === 0 && !chatLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="mt-3"
          >
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Quick questions:
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_QUESTIONS.map((question) => (
                <Button
                  key={question}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickQuestion(question)}
                  disabled={chatLoading}
                  className="h-8 text-xs rounded-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950/40 dark:hover:border-emerald-600"
                >
                  {question}
                </Button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mt-3 pb-1"
      >
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                chatLoading
                  ? 'Waiting for response...'
                  : 'Ask about documents, corrections, services...'
              }
              disabled={chatLoading}
              className="h-11 pr-12 rounded-xl border-emerald-200 bg-white/80 focus-visible:ring-emerald-500 dark:border-emerald-800 dark:bg-emerald-950/30 dark:focus-visible:ring-emerald-600"
            />
          </div>

          {/* Voice Input Button - Coming Soon */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled
                className="h-11 w-11 rounded-xl border-emerald-200 text-emerald-600 dark:border-emerald-800 dark:text-emerald-400 opacity-60"
              >
                <Mic className="h-4 w-4" />
                <span className="sr-only">Voice input - Coming Soon</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Voice input - Coming Soon</p>
            </TooltipContent>
          </Tooltip>

          {/* Send Button */}
          <Button
            type="submit"
            disabled={!inputValue.trim() || chatLoading}
            className="h-11 w-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md disabled:opacity-50"
          >
            {chatLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">Send message</span>
          </Button>
        </form>

        {/* Bottom info bar */}
        <div className="mt-1.5 flex items-center justify-between px-1">
          <p className="text-[10px] text-muted-foreground">
            Press <kbd className="rounded border px-1 py-0.5 text-[10px]">Enter</kbd>{' '}
            to send
          </p>
          <p className="text-[10px] text-muted-foreground">
            {chatMessages.length > 0 && `${chatMessages.length} messages`}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
