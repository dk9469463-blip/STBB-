import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bot,
  Check,
  ChevronDown,
  CircleHelp,
  GraduationCap,
  Lightbulb,
  MessageCircle,
  Minus,
  Send,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';

type ChatRole = 'user' | 'assistant';
interface TutorMessage {
  id: string;
  role: ChatRole;
  content: string;
}

const STORAGE_KEY = 'stbb_conversational_tutor_v1';
const CHAT_EVENT = 'stbb:open-chat';
const STARTER_CHOICES = [
  {
    label: 'Solve a whole exercise',
    prompt: 'I want help solving a whole exercise. Use the selected book/page context if available. If no book is selected, ask me for the class, subject and exercise number. Search for the exercise before asking me to type it out.',
    icon: GraduationCap,
  },
  {
    label: 'Solve a specific question',
    prompt: 'I want to solve a specific question. If a book/page is selected, look for the question there first. If I have not given the question number, ask me for the question number and then explain it step by step.',
    icon: CircleHelp,
  },
  {
    label: 'Explain a concept',
    prompt: 'I want to learn a concept. Please ask me which concept I want explained, then teach it in simple English with an example.',
    icon: Lightbulb,
  },
  {
    label: 'Ask something else',
    prompt: 'I have another study question. Please ask me what I would like help with.',
    icon: MessageCircle,
  },
];

function readSavedMessages(): TutorMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is TutorMessage =>
        Boolean(item) &&
        (item.role === 'user' || item.role === 'assistant') &&
        typeof item.content === 'string' &&
        item.content.trim().length > 0
      )
      .slice(-40);
  } catch {
    return [];
  }
}

function makeId(): string {
  return String(Date.now()) + '-' + Math.random().toString(36).slice(2, 9);
}

interface ReaderChatContext {
  selectedText?: string;
  bookTitle?: string;
  classNumber?: number;
  subjectName?: string;
  pageNumber?: number;
}

export const FloatingTutorChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<TutorMessage[]>(readSavedMessages);
  const [readerContext, setReaderContext] = useState<ReaderChatContext | null>(null);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [justCopied, setJustCopied] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
    } catch {
      // Private browsing or storage limits should not stop the chatbot.
    }
  }, [messages]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isLoading, isOpen]);

  useEffect(() => {
    const handleOpenChat = (event: Event) => {
      const detail = (event as CustomEvent<{
        selectedText?: string;
        bookTitle?: string;
        classNumber?: number;
        subjectName?: string;
        pageNumber?: number;
      }>).detail;
      setIsOpen(true);
      setError('');
      setReaderContext(detail && (detail.bookTitle || detail.selectedText)
        ? {
            selectedText: detail.selectedText,
            bookTitle: detail.bookTitle,
            classNumber: detail.classNumber,
            subjectName: detail.subjectName,
            pageNumber: detail.pageNumber,
          }
        : null);
      if (detail?.selectedText?.trim()) {
        const bookContext = [
          detail.bookTitle,
          detail.classNumber ? 'Class ' + detail.classNumber : '',
          detail.subjectName,
          detail.pageNumber ? 'PDF page ' + detail.pageNumber : '',
        ].filter(Boolean).join(' · ');
        const contextLine = bookContext ? 'Reader context: ' + bookContext + '\n\n' : '';
        setDraft(
          contextLine +
          'Selected text:\n' + detail.selectedText.trim() +
          '\n\nWhat would you like to know about this text?'
        );
      } else {
        setDraft((current) => current);
      }
      window.setTimeout(() => inputRef.current?.focus(), 100);
    };
    window.addEventListener(CHAT_EVENT, handleOpenChat);
    return () => window.removeEventListener(CHAT_EVENT, handleOpenChat);
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  const clearChat = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
    setMessages([]);
    setReaderContext(null);
    setDraft('');
    setError('');
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore localStorage failures.
    }
  }, []);

  const sendMessage = useCallback(async (override?: string) => {
    const text = (override ?? draft).trim();
    if (!text || isLoading) return;

    const userMessage: TutorMessage = { id: makeId(), role: 'user', content: text };
    const assistantMessage: TutorMessage = { id: makeId(), role: 'assistant', content: '' };
    const updatedMessages = [...messages, userMessage].slice(-40);
    const requestMessages = updatedMessages.slice(-10).map(({ role, content }) => ({ role, content }));

    setMessages([...updatedMessages, assistantMessage].slice(-40));
    setDraft('');
    setError('');
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;
    let streamedText = '';

    try {

      // Route the floating tutor through the same AI endpoint as the
      // textbook-aware reader assistant instead of maintaining a separate,
      // conversation-only Gemini path.
      const hasReaderContext = Boolean(readerContext?.bookTitle || readerContext?.selectedText);
      const response = await fetch('/api/ai/study-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          prompt: text,
          language: /[ء-ي]/.test(text) ? 'urdu' : 'english',
          mode: 'general',
          useTextbook: hasReaderContext,
          bookContext: hasReaderContext && readerContext ? {
            bookTitle: readerContext.bookTitle,
            classNumber: readerContext.classNumber,
            subjectName: readerContext.subjectName,
            pageNumber: readerContext.pageNumber,
            selectedText: readerContext.selectedText,
          } : undefined,
          history: requestMessages.slice(0, -1),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || ('AI service returned ' + response.status + '. Please try again.'));
      }

      const data = await response.json();
      streamedText = typeof data.answer === 'string' ? data.answer.trim() : '';
      if (!streamedText) {
        throw new Error(data.error || 'The AI returned an empty answer. Please try again.');
      }
      setMessages((current) => current.map((message) =>
        message.id === assistantMessage.id
          ? { ...message, content: streamedText }
          : message
      ));
    } catch (chatError) {
      if (chatError instanceof Error && chatError.name === 'AbortError') return;
      const errorText = chatError instanceof Error
        ? chatError.message
        : 'The chatbot could not connect. Check your connection and try again.';
      setError(errorText);
      if (!streamedText.trim()) {
        setMessages((current) => current.filter((message) => message.id !== assistantMessage.id));
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setIsLoading(false);
    }
  }, [draft, isLoading, messages, readerContext]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void sendMessage();
  };

  return (
    <div className="stbb-tutor-widget">
      {isOpen && (
        <section className="stbb-tutor-panel" role="dialog" aria-label="SindhLearn Study Assistant" aria-modal="false">
          <header className="stbb-tutor-header">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/30 bg-emerald-400/15 text-emerald-300">
                <Bot className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-base font-extrabold text-white">SindhLearn Study Assistant</h2>
                <p className="mt-0.5 text-xs text-emerald-200">Your friendly learning assistant</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button type="button" onClick={clearChat} className="stbb-tutor-icon-button" aria-label="Clear chat" title="Clear chat">
                <Trash2 className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setIsOpen(false)} className="stbb-tutor-icon-button" aria-label="Minimize chat" title="Minimize chat">
                <Minus className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setIsOpen(false)} className="stbb-tutor-icon-button" aria-label="Close chat" title="Close chat">
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div className="stbb-tutor-messages" ref={listRef} aria-live="polite">
            {messages.length === 0 && !draft.trim() && (
              <div className="mx-auto w-full max-w-sm py-3">
                <div className="mb-4 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <Sparkles className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900">What would you like help with?</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">Choose an option or type any question in your own words.</p>
                </div>
                <div className="grid gap-2">
                  {STARTER_CHOICES.map((choice) => {
                    const Icon = choice.icon;
                    return (
                      <button
                        key={choice.label}
                        type="button"
                        onClick={() => void sendMessage(choice.prompt)}
                        disabled={isLoading}
                        className="stbb-tutor-starter"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="flex-1 text-left text-sm font-bold">{choice.label}</span>
                        <ChevronDown className="h-4 w-4 -rotate-90 text-slate-400" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className={'stbb-tutor-message-row ' + (message.role === 'user' ? 'is-user' : 'is-assistant')}>
                <div className={'stbb-tutor-avatar ' + (message.role === 'user' ? 'user-avatar' : 'assistant-avatar')}>
                  {message.role === 'user' ? <span>You</span> : <Bot className="h-4 w-4" />}
                </div>
                <div className="min-w-0 max-w-[88%]">
                  {message.content ? (
                    <div className={'stbb-tutor-bubble ' + (message.role === 'user' ? 'user-bubble' : 'assistant-bubble')}>
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</p>
                      {message.role === 'assistant' && (
                        <button
                          type="button"
                          onClick={() => {
                            void navigator.clipboard?.writeText(message.content);
                            setJustCopied(message.id);
                            window.setTimeout(() => setJustCopied(null), 1500);
                          }}
                          className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-emerald-700"
                          title="Copy answer"
                        >
                          {justCopied === message.id ? <Check className="h-3 w-3" /> : null}
                          {justCopied === message.id ? 'Copied' : 'Copy answer'}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="stbb-tutor-bubble assistant-bubble">
                      <div className="flex items-center gap-1.5 py-1" role="status" aria-label="AI is thinking">
                        <span className="stbb-tutor-dot" />
                        <span className="stbb-tutor-dot delay-1" />
                        <span className="stbb-tutor-dot delay-2" />
                      </div>
                    </div>
                  )}
                  {message.role === 'assistant' && message.content && (
                    <p className="mt-1.5 px-1 text-[10px] leading-relaxed text-slate-400">
                      AI answers may be incorrect. Please verify important answers with your teacher or textbook.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="mx-4 mb-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-relaxed text-rose-800" role="alert">
              {error}
              <button
                type="button"
                onClick={() => {
                  const lastQuestion = messages.filter((message) => message.role === 'user').slice(-1)[0];
                  if (lastQuestion) void sendMessage(lastQuestion.content);
                }}
                className="ml-2 font-extrabold underline"
              >
                Retry
              </button>
            </div>
          )}

          <form className="stbb-tutor-composer" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="stbb-tutor-message">Your question</label>
            <textarea
              id="stbb-tutor-message"
              ref={inputRef}
              rows={1}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder="Type your question here..."
              className="stbb-tutor-input"
              disabled={isLoading}
            />
            <button type="submit" disabled={!draft.trim() || isLoading} className="stbb-tutor-send" aria-label="Send message">
              <Send className="h-4 w-4" />
            </button>
          </form>
          <div className="stbb-tutor-footnote">Selected text is included only when you choose Ask Chatbot. PDFs are not attached automatically.</div>
        </section>
      )}

      {!isOpen && (
        <button
          type="button"
          className="stbb-tutor-launcher"
          onClick={() => {
            setIsOpen(true);
            setError('');
            window.setTimeout(() => inputRef.current?.focus(), 80);
          }}
          aria-label="Open study chatbot"
          title="Ask SindhLearn AI"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="stbb-tutor-launcher-label">Ask AI</span>
        </button>
      )}
    </div>
  );
};
