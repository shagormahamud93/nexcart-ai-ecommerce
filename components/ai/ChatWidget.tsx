'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  ShoppingCart,
  Package,
  Trash2,
  ChevronDown,
  Search,
  Square,
  RotateCcw,
  LogIn,
  WifiOff,
} from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { ChatMessageView } from './ChatMessage';
import type {
  ChatMessage,
  NotificationLevel,
  StreamEvent,
  ToolEvent,
} from './types';

const STORAGE_KEY = 'nexcart-chat-history';
const MAX_PERSISTED = 30;

type QuickAction = {
  label: string;
  prompt: string;
  icon: React.ReactNode;
  color: string;
  authRequired?: boolean;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: 'Browse trending',
    prompt: 'Show me your best-rated products',
    icon: <Sparkles className="w-3.5 h-3.5" />,
    color: 'from-amber-500 to-orange-500',
  },
  {
    label: 'View my cart',
    prompt: "What's in my cart?",
    icon: <ShoppingCart className="w-3.5 h-3.5" />,
    color: 'from-indigo-500 to-violet-500',
    authRequired: true,
  },
  {
    label: 'Track order',
    prompt: 'Where is my latest order?',
    icon: <Package className="w-3.5 h-3.5" />,
    color: 'from-emerald-500 to-teal-500',
    authRequired: true,
  },
  {
    label: 'Find a deal',
    prompt: 'Show me products under $50',
    icon: <Search className="w-3.5 h-3.5" />,
    color: 'from-rose-500 to-pink-500',
  },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function notify(level: NotificationLevel, message: string) {
  switch (level) {
    case 'success':
      toast.success(message);
      break;
    case 'warn':
      toast(message, { icon: '⚠️' });
      break;
    case 'info':
      toast(message);
      break;
    case 'error':
    default:
      toast.error(message);
  }
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [unread, setUnread] = useState(0);
  const [online, setOnline] = useState(true);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const stickToBottomRef = useRef(true);
  const lastUserPromptRef = useRef<string | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const fetchCart = useCartStore((s) => s.fetchCart);
  const user = useAuthStore((s) => s.user);

  // Restore history.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ChatMessage[];
        if (Array.isArray(parsed)) setMessages(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  // Track online status.
  useEffect(() => {
    if (typeof navigator !== 'undefined') setOnline(navigator.onLine);
    const onOn = () => setOnline(true);
    const onOff = () => {
      setOnline(false);
      toast.error('You appear to be offline.');
    };
    window.addEventListener('online', onOn);
    window.addEventListener('offline', onOff);
    return () => {
      window.removeEventListener('online', onOn);
      window.removeEventListener('offline', onOff);
    };
  }, []);

  // Persist (only finalized messages).
  useEffect(() => {
    if (messages.some((m) => m.streaming)) return;
    try {
      const persistable = messages.slice(-MAX_PERSISTED).map((m) => ({
        ...m,
        tools: m.tools?.filter((t) => t.status === 'done'),
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
    } catch {
      // ignore
    }
  }, [messages]);

  // Smart auto-scroll.
  useEffect(() => {
    if (!scrollRef.current) return;
    if (stickToBottomRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  // Scroll-to-bottom pill visibility.
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.clientHeight - el.scrollTop;
    stickToBottomRef.current = distanceFromBottom < 80;
    setShowScrollDown(distanceFromBottom > 200);
  };

  const scrollToBottom = () => {
    if (!scrollRef.current) return;
    stickToBottomRef.current = true;
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  };

  // Auto-grow textarea.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  // Focus on open + clear unread.
  useEffect(() => {
    if (open) {
      setUnread(0);
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, [open]);

  // Esc to close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !sending) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, sending]);

  const handleClientAction = useCallback(
    (action: Extract<StreamEvent, { type: 'client_action' }>['action']) => {
      switch (action.type) {
        case 'navigate':
          router.push(action.path);
          break;
        case 'cart_update':
          fetchCart();
          break;
        case 'open_checkout':
          window.location.href = action.url;
          break;
      }
    },
    [router, fetchCart]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        toast.error('You are offline.');
        return;
      }

      setError(null);
      setInput('');
      stickToBottomRef.current = true;
      lastUserPromptRef.current = trimmed;

      const userMsg: ChatMessage = { id: uid(), role: 'user', content: trimmed };
      const assistantId = uid();
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        tools: [],
        streaming: true,
      };

      let outgoing: Array<{ role: 'user' | 'assistant'; content: string }> = [];
      setMessages((prev) => {
        const next = [...prev, userMsg, assistantMsg];
        outgoing = next
          .filter((m) => !m.streaming || m.id !== assistantId)
          .map((m) => ({ role: m.role, content: m.content }));
        return next;
      });
      setSending(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: outgoing,
            pageContext: { path: pathname ?? null },
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const errBody = await res.json().catch(() => ({ error: 'Request failed' }));
          throw new Error(errBody.error || `HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.trim()) continue;
            let event: StreamEvent;
            try {
              event = JSON.parse(line);
            } catch {
              continue;
            }
            applyEvent(assistantId, event, handleClientAction, setMessages);
          }
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          // User stopped — mark message non-erroring with current content.
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    streaming: false,
                    content: m.content || '⏹️ Stopped.',
                  }
                : m
            )
          );
          return;
        }
        const friendly = friendlyClientError(err);
        setError(friendly);
        toast.error(friendly);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  streaming: false,
                  errored: true,
                  content: m.content || friendly,
                }
              : m
          )
        );
      } finally {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m))
        );
        setSending(false);
        abortRef.current = null;
        if (!open) setUnread((u) => u + 1);
      }
    },
    [sending, handleClientAction, open, pathname]
  );

  const handleAddToCart = useCallback(
    (productId: string) => {
      if (!user) {
        toast.error('Please sign in to add items to your cart.');
        router.push('/login');
        return;
      }
      void sendMessage(`Add product ${productId} to my cart`);
    },
    [sendMessage, user, router]
  );

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleRetry = useCallback(() => {
    if (sending) return;
    const last = lastUserPromptRef.current;
    if (!last) return;
    // Strip the failed assistant turn so the retry starts clean.
    setMessages((prev) => {
      const lastUserIdx = [...prev].reverse().findIndex((m) => m.role === 'user');
      if (lastUserIdx === -1) return prev;
      const cutFrom = prev.length - lastUserIdx;
      return prev.slice(0, cutFrom);
    });
    setError(null);
    setTimeout(() => void sendMessage(last), 0);
  }, [sending, sendMessage]);

  const handleClear = useCallback(() => {
    if (sending) return;
    setMessages([]);
    setError(null);
    lastUserPromptRef.current = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, [sending]);

  const handleQuickAction = (q: QuickAction) => {
    if (q.authRequired && !user) {
      toast.error('Please sign in to use this.');
      router.push('/login');
      return;
    }
    void sendMessage(q.prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  };

  const isStreaming = messages.some((m) => m.streaming);
  const lastMsg = messages[messages.length - 1];
  const showRetry =
    !sending && (error || (lastMsg && lastMsg.role === 'assistant' && lastMsg.errored));

  return (
    <>
      {/* Floating launcher */}
      <motion.button
        type="button"
        aria-label={open ? 'Close chat' : 'Open chat'}
        onClick={() => setOpen((v) => !v)}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.3 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-linear-to-br from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-500/40 flex items-center justify-center cursor-pointer ring-4 ring-white/40"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? 'close' : 'open'}
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
            transition={{ duration: 0.18 }}
            className="absolute"
          >
            {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
          </motion.span>
        </AnimatePresence>

        {!open && (
          <span className="absolute top-0.5 right-0.5 flex">
            <span
              className={`absolute inline-flex h-2.5 w-2.5 rounded-full opacity-75 ${
                online ? 'bg-emerald-400 animate-ping' : 'bg-gray-400'
              }`}
            />
            <span
              className={`relative inline-flex h-2.5 w-2.5 rounded-full ring-2 ring-white ${
                online ? 'bg-emerald-500' : 'bg-gray-400'
              }`}
            />
          </span>
        )}

        <AnimatePresence>
          {!open && unread > 0 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -bottom-1 -left-1 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white"
            >
              {unread}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            style={{ transformOrigin: 'bottom right' }}
            className="fixed bottom-24 right-6 z-50 w-[min(92vw,400px)] h-[min(80vh,640px)] bg-white rounded-3xl shadow-2xl shadow-gray-900/20 border border-gray-200/80 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="relative px-4 py-3.5 bg-linear-to-br from-indigo-600 via-violet-600 to-purple-600 text-white">
              <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-white/15 backdrop-blur flex items-center justify-center ring-2 ring-white/30">
                      <Sparkles className="w-4.5 h-4.5" />
                    </div>
                    <span
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-indigo-600 ${
                        online ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-sm leading-tight">NexCart Assistant</div>
                    <div className="text-[11px] opacity-85 flex items-center gap-1">
                      {!online ? (
                        <span className="inline-flex items-center gap-1">
                          <WifiOff className="w-3 h-3" /> Offline
                        </span>
                      ) : isStreaming ? (
                        <motion.span
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1.2, repeat: Infinity }}
                        >
                          Typing…
                        </motion.span>
                      ) : user ? (
                        <>Online · Hi, {user.name.split(' ')[0]}</>
                      ) : (
                        <>Online · Sign in for cart access</>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {messages.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClear}
                      title="Clear conversation"
                      disabled={sending}
                      className="p-1.5 rounded-xl hover:bg-white/15 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    title="Close (Esc)"
                    className="p-1.5 rounded-xl hover:bg-white/15 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 bg-linear-to-b from-gray-50 to-white scroll-smooth"
            >
              {messages.length === 0 && (
                <EmptyState
                  authed={!!user}
                  onPick={(p) => void sendMessage(p)}
                  onPickAction={handleQuickAction}
                  onSignIn={() => router.push('/login')}
                />
              )}

              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <ChatMessageView
                    key={m.id}
                    message={m}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </AnimatePresence>

              {showRetry && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center"
                >
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-300 text-xs font-medium text-gray-700 hover:border-indigo-400 hover:text-indigo-600 shadow-sm transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Retry
                  </button>
                </motion.div>
              )}
            </div>

            {/* Scroll-to-bottom pill */}
            <AnimatePresence>
              {showScrollDown && (
                <motion.button
                  type="button"
                  onClick={scrollToBottom}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute bottom-22 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-full bg-gray-900 text-white text-xs font-medium shadow-lg flex items-center gap-1 cursor-pointer hover:bg-gray-800 transition-colors"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                  New messages
                </motion.button>
              )}
            </AnimatePresence>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void sendMessage(input);
              }}
              className="border-t border-gray-200/80 bg-white px-3 py-2.5"
            >
              <div className="flex items-end gap-2 bg-gray-100 rounded-3xl px-3.5 py-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    !online
                      ? 'You are offline…'
                      : sending
                      ? 'Thinking…'
                      : 'Ask anything…'
                  }
                  disabled={sending || !online}
                  rows={1}
                  className="flex-1 text-sm bg-transparent outline-none resize-none py-1.5 max-h-30 placeholder:text-gray-400 disabled:opacity-60"
                />
                <AnimatePresence mode="wait">
                  {sending ? (
                    <motion.button
                      key="stop"
                      type="button"
                      onClick={handleStop}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.12 }}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      className="w-8 h-8 shrink-0 rounded-full bg-gray-900 text-white flex items-center justify-center shadow-md cursor-pointer"
                      aria-label="Stop"
                      title="Stop generating"
                    >
                      <Square className="w-3 h-3 fill-current" />
                    </motion.button>
                  ) : input.trim() ? (
                    <motion.button
                      key="send"
                      type="submit"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.12 }}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      disabled={!online}
                      className="w-8 h-8 shrink-0 rounded-full bg-linear-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Send"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </motion.button>
                  ) : null}
                </AnimatePresence>
              </div>
              <div className="text-[10px] text-gray-400 text-center mt-1.5">
                {sending ? (
                  <>Press <kbd className="px-1 bg-gray-100 rounded">Esc</kbd> or click ⏹ to stop</>
                ) : (
                  <>AI may show inaccurate info · Enter to send · Shift+Enter for newline</>
                )}
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function EmptyState({
  authed,
  onPick,
  onPickAction,
  onSignIn,
}: {
  authed: boolean;
  onPick: (prompt: string) => void;
  onPickAction: (q: QuickAction) => void;
  onSignIn: () => void;
}) {
  void onPick;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center text-center pt-4"
    >
      <motion.div
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 14, delay: 0.1 }}
        className="w-16 h-16 rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-3"
      >
        <Sparkles className="w-8 h-8 text-white" />
      </motion.div>
      <h3 className="text-base font-bold text-gray-900">How can I help today?</h3>
      <p className="text-xs text-gray-500 mt-1 max-w-65">
        I can find products, manage your cart, track orders, or help you check out — all from this chat.
      </p>

      {!authed && (
        <motion.button
          type="button"
          onClick={onSignIn}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.2 }}
          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition-colors cursor-pointer"
        >
          <LogIn className="w-3 h-3" />
          Sign in for cart & orders
        </motion.button>
      )}

      <div className="grid grid-cols-2 gap-2 mt-5 w-full">
        {QUICK_ACTIONS.map((q, i) => {
          const locked = q.authRequired && !authed;
          return (
            <motion.button
              key={q.label}
              type="button"
              onClick={() => onPickAction(q)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.15 + i * 0.05 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className={`group p-2.5 rounded-2xl bg-white border text-left cursor-pointer transition-all ${
                locked
                  ? 'border-gray-200 opacity-70 hover:border-amber-300'
                  : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg bg-linear-to-br ${q.color} text-white flex items-center justify-center mb-1.5 shadow-sm`}
              >
                {q.icon}
              </div>
              <div className="text-[11px] font-semibold text-gray-900 leading-tight flex items-center gap-1">
                {q.label}
                {locked && <LogIn className="w-2.5 h-2.5 text-amber-500" />}
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

function friendlyClientError(err: unknown): string {
  if (err instanceof TypeError) {
    return 'Network error — check your connection.';
  }
  if (err instanceof Error) {
    if (err.message.toLowerCase().includes('failed to fetch')) {
      return 'Network error — check your connection.';
    }
    return err.message;
  }
  return 'Something went wrong.';
}

function applyEvent(
  assistantId: string,
  event: StreamEvent,
  handleClientAction: (
    a: Extract<StreamEvent, { type: 'client_action' }>['action']
  ) => void,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
) {
  switch (event.type) {
    case 'text': {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: m.content + event.delta } : m
        )
      );
      break;
    }
    case 'tool_call': {
      const tool: ToolEvent = {
        name: event.name,
        args: event.args,
        status: 'pending',
      };
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, tools: [...(m.tools ?? []), tool] } : m
        )
      );
      break;
    }
    case 'tool_result': {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== assistantId) return m;
          const tools = [...(m.tools ?? [])];
          for (let i = tools.length - 1; i >= 0; i--) {
            if (tools[i].name === event.name && tools[i].status === 'pending') {
              tools[i] = { ...tools[i], status: 'done', result: event.result };
              break;
            }
          }
          return { ...m, tools };
        })
      );
      break;
    }
    case 'client_action':
      handleClientAction(event.action);
      break;
    case 'notification':
      notify(event.level, event.message);
      break;
    case 'error':
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                errored: true,
                content:
                  (m.content ? m.content + '\n\n' : '') + `⚠️ ${event.error}`,
              }
            : m
        )
      );
      break;
    case 'done':
      break;
  }
}
