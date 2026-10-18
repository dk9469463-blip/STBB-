import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  Languages,
  Copy,
  Check,
  Volume2,
  RefreshCw,
  Camera,
  RotateCcw,
  Mic,
  MicOff,
  Play,
  Pause,
  Square,
  AlertCircle,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
} from 'lucide-react';
import { Book } from '../types';
import {
  AssistantLanguage,
  ChatMessage,
  getStoredReaderMessages,
  saveStoredReaderMessages,
} from '../utils/chatStorage';
import {
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  requestMicrophonePermission,
  createSpeechRecognizer,
  SpeechRecognizerHandle,
  speakText,
  pauseSpeech,
  resumeSpeech,
  stopSpeech,
} from '../utils/speechHelper';
import { formatStudyAnswer } from '../utils/formatStudyAnswer';

interface AIReaderPanelProps {
  book: Book;
  currentPage: number;
  selectedText: string;
  selectedImage?: string | null;
  onClearSelectedText: () => void;
  onClose: () => void;
  onCapturePageImage?: () => Promise<string | null>;
}

export const AIReaderPanel: React.FC<AIReaderPanelProps> = ({
  book,
  currentPage,
  selectedText,
  selectedImage,
  onClearSelectedText,
  onClose,
  onCapturePageImage,
}) => {
  const [language, setLanguage] = useState<AssistantLanguage>('english');
  // Keep the composer empty after opening the chatbot. Selected passage text is
  // shown as context and sent separately, so it is never mistaken for the user's question.
  const [inputQuery, setInputQuery] = useState<string>('');
  const [showAdvancedTools, setShowAdvancedTools] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [pendingQuestionNumber, setPendingQuestionNumber] = useState<boolean>(false);
  const [pendingConceptTopic, setPendingConceptTopic] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Speech Recognition & Playback State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognizerRef = useRef<SpeechRecognizerHandle | null>(null);
  const voiceBaseInputRef = useRef<string>('');
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isSpeechPaused, setIsSpeechPaused] = useState<boolean>(false);

  // Persistent Messages for this book reader session
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Load saved reader chat for this book from localStorage
  useEffect(() => {
    const saved = getStoredReaderMessages(book.id);
    if (saved.length > 0) {
      // Refresh an old, untouched welcome screen so existing users get the new choices.
      const onlyWelcome = saved.length === 1 &&
        saved[0].role === 'assistant' &&
        saved[0].id.startsWith('reader-welcome-');
      if (onlyWelcome) {
        const welcome: ChatMessage = {
          ...saved[0],
          content: `Welcome to your study chat for ${book.title}. If you select text, I will show exactly what was selected. Choose an option below to get help; your selected text is context, not a question you must send.`,
          followUps: ['Solve the whole exercise', 'Solve a specific question', 'Learn a concept', "Something else (I'll type)"],
        };
        setMessages([welcome]);
        saveStoredReaderMessages(book.id, [welcome]);
      } else {
        setMessages(saved);
      }
    } else {
      const welcome: ChatMessage = {
        id: `reader-welcome-${book.id}`,
        role: 'assistant',
        content: `Welcome to your study chat for ${book.title}. If you select text, I will show exactly what was selected. Choose an option below to get help; your selected text is context, not a question you must send.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: 'english',
        followUps: ['Solve the whole exercise', 'Solve a specific question', 'Learn a concept', "Something else (I'll type)"],
      };
      setMessages([welcome]);
      saveStoredReaderMessages(book.id, [welcome]);
    }
  }, [book.id]);

  // A passage selection updates the context preview only. Keep the composer clear
  // so the student can choose a quick action or write their own question.
  useEffect(() => {
    setInputQuery('');
    setPendingQuestionNumber(false);
    setPendingConceptTopic(false);
    setCapturedImage(null);
    setErrorMsg(null);
  }, [book.id, selectedText]);


  // Scroll only the chat's own message viewport. scrollIntoView() also moves
  // ancestor containers, which caused the PDF reader to jump on mobile.
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  }, [messages.length, isGenerating]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      stopSpeech();
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
    };
  }, []);

  // Toggle Voice Input
  const handleToggleVoiceInput = async () => {
    if (isListening) {
      if (recognizerRef.current) recognizerRef.current.stop();
      setIsListening(false);
      return;
    }

    setSpeechError(null);

    // Request microphone permission first
    const perm = await requestMicrophonePermission();
    if (!perm.granted) {
      setSpeechError(perm.error || 'Microphone access is not permitted.');
      return;
    }

    // Preserve anything the student already typed; replace the voice draft
    // on each partial recognition update so interim words never stack up.
    voiceBaseInputRef.current = inputQuery.trim();

    const rec = createSpeechRecognizer({
      language,
      onResult: (transcript) => {
        const base = voiceBaseInputRef.current;
        setInputQuery([base, transcript.trim()].filter(Boolean).join(' '));
      },
      onError: (err) => {
        setSpeechError(err);
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    if (rec) {
      recognizerRef.current = rec;
      rec.start();
      setIsListening(true);
    }
  };

  // Toggle Voice Playback
  const handleToggleSpeak = (msgId: string, text: string) => {
    if (!isSpeechSynthesisSupported()) {
      setErrorMsg('Text-to-speech audio playback is not supported in this browser.');
      return;
    }

    if (speakingId === msgId) {
      if (isSpeechPaused) {
        resumeSpeech();
        setIsSpeechPaused(false);
      } else {
        pauseSpeech();
        setIsSpeechPaused(true);
      }
      return;
    }

    stopSpeech();
    setIsSpeechPaused(false);
    setSpeakingId(msgId);

    speakText(
      text,
      language,
      () => {
        setSpeakingId(null);
        setIsSpeechPaused(false);
      },
      () => {
        setSpeakingId(null);
        setIsSpeechPaused(false);
      }
    );
  };

  const handleStopSpeech = () => {
    stopSpeech();
    setSpeakingId(null);
    setIsSpeechPaused(false);
  };

  // New Chat for this book
  const handleNewChat = () => {
    stopSpeech();
    setSpeakingId(null);
    setErrorMsg(null);
    setSpeechError(null);
    setInputQuery('');
    setCapturedImage(null);
    setPendingQuestionNumber(false);
    setPendingConceptTopic(false);

    const welcome: ChatMessage = {
      id: `reader-welcome-${Date.now()}`,
      role: 'assistant',
      content: `New chat for ${book.title}. Choose a quick action below or type your own question. Any selected passage remains available as context. Full-page images are never attached automatically.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language,
      followUps: ['Solve the whole exercise', 'Solve a specific question', 'Learn a concept', "Something else (I'll type)"],
    };
    setMessages([welcome]);
    saveStoredReaderMessages(book.id, [welcome]);
  };

  // Quick Action Buttons
  const handleQuickAction = async (actionType: string) => {
    let prompt = '';
    const textContext = selectedText.trim();

    switch (actionType) {
      case 'explain':
        prompt = textContext
          ? `Explain the following textbook passage clearly according to Class ${book.classNumber} ${book.subjectName} syllabus:\n"${textContext}"`
          : `Explain the key concepts on Page ${currentPage} of ${book.title}.`;
        break;
      case 'meaning':
        prompt = `Explain the meaning, context, and usage of this word/phrase from ${book.title} (Page ${currentPage}):\n"${textContext}"`;
        break;
      case 'translate_urdu':
        prompt = `Translate and explain the following text into standard Urdu (اردو):\n"${textContext}"`;
        setLanguage('urdu');
        break;
      case 'translate_sindhi':
        prompt = `Translate and explain the following text into standard Sindhi (سنڌي):\n"${textContext}"`;
        setLanguage('sindhi');
        break;
      case 'solve':
        prompt = `Solve this question with complete step-by-step method and final answer from ${book.title} (Page ${currentPage}):\n"${textContext || `Page ${currentPage}`}"`;
        break;
      case 'mcqs':
        prompt = `Create 3 exam-style multiple choice questions (MCQs) with correct answers and explanations based on this section:\n"${textContext || `Page ${currentPage}`}"`;
        break;
      case 'summarize':
        prompt = `Provide a concise, easy-to-revise bullet summary of this textbook section:\n"${textContext || `Page ${currentPage}`}"`;
        break;
      default:
        prompt = textContext;
    }

    sendQuery(prompt);
  };

  // Add a local clarification turn without making the student wait for an AI API call.
  // The actual answer request is sent only after the student supplies the missing detail.
  const appendLocalClarification = (choice: string, question: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: choice,
      timestamp,
      language,
    };
    const assistantMsg: ChatMessage = {
      id: `ai-prompt-${Date.now() + 1}`,
      role: 'assistant',
      content: question,
      timestamp,
      language,
    };
    const nextMessages = [...messages, userMsg, assistantMsg];
    setMessages(nextMessages);
    saveStoredReaderMessages(book.id, nextMessages);
    setInputQuery('');
    window.setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleFollowUpClick = (chip: string) => {
    const choice = chip.trim().toLowerCase();

    if (choice === 'solve the whole exercise') {
      sendQuery(
        `Please solve the complete exercise shown on or near PDF page ${currentPage} of ${book.title} (Class ${book.classNumber}, ${book.subjectName}, ${book.medium} medium). First use the selected passage, if any, and the current page plus nearby pages to identify the exact exercise. Read any continuation pages from this same book and solve every question in the original order, showing clear step-by-step working. Do not ask me to type the whole page or repeat text already selected. If you still cannot identify the exercise after checking the available pages, ask only for the exercise number.`
      );
      return;
    }

    if (choice === 'solve a specific question') {
      setPendingQuestionNumber(true);
      setPendingConceptTopic(false);
      appendLocalClarification(
        'Solve a specific question',
        'Which question number would you like me to solve? For example, Question 3 or Question 3(b). Type the number below. I will use this book and page as context, and you do not need to type the whole page.'
      );
      return;
    }

    if (choice === 'learn a concept') {
      if (selectedText.trim()) {
        sendQuery('Teach me the concept in the highlighted textbook passage. Explain it in simple English, step by step, and give one clear example. Focus on the selected passage rather than the entire page.');
      } else {
        setPendingConceptTopic(true);
        setPendingQuestionNumber(false);
        appendLocalClarification(
          'Learn a concept',
          'Which concept or topic would you like to learn? Type its name below, and I will explain it step by step with an example.'
        );
      }
      return;
    }

    if (choice === "something else (i'll type)") {
      inputRef.current?.focus();
      return;
    }

    // Keep normal AI follow-up suggestions working as before.
    sendQuery(chip);
  };

  const handleCaptureCurrentPage = async () => {
    if (!onCapturePageImage) return;
    setIsCapturing(true);
    setErrorMsg(null);
    try {
      const dataUrl = await onCapturePageImage();
      if (dataUrl) {
        setCapturedImage(dataUrl);
      } else {
        setErrorMsg('Unable to snapshot page canvas. Please select text directly.');
      }
    } catch {
      setErrorMsg('Page capture failed.');
    } finally {
      setIsCapturing(false);
    }
  };

  const sendQuery = async (
    customPrompt?: string,
    retryContext?: { baseMessages: ChatMessage[]; originalUserMessage: ChatMessage }
  ) => {
    const baseMessages = retryContext?.baseMessages || messages;
    const originalRetryMessage = retryContext?.originalUserMessage;
    const typedPrompt = (customPrompt ?? inputQuery).trim();
    const isClarificationReply = !customPrompt && (pendingQuestionNumber || pendingConceptTopic);
    const finalPrompt = pendingQuestionNumber && typedPrompt
      ? `Please solve question "${typedPrompt}" from ${book.title} (Class ${book.classNumber}, ${book.subjectName}, PDF page ${currentPage}) step by step. Use the selected text shown in the reader as context if it matches this question. Find the question from the book when possible; do not invent its wording or values if it cannot be located.`
      : pendingConceptTopic && typedPrompt
        ? `Please teach me the concept/topic "${typedPrompt}" from ${book.title} (Class ${book.classNumber}, ${book.subjectName}) in simple English, step by step, with one clear example.`
        : typedPrompt;

    // An empty input must not silently submit the highlighted passage or capture
    // the entire PDF page. The welcome choices guide the student first.
    if (!finalPrompt) {
      inputRef.current?.focus();
      return;
    }

    if (isClarificationReply) {
      setPendingQuestionNumber(false);
      setPendingConceptTopic(false);
    }

    setIsGenerating(true);
    setErrorMsg(null);
    setSpeechError(null);

    // A scanned-PDF selection stays as a cropped image attached to the student's
    // next question. Never attach the full PDF page automatically.
    const attachmentForRequest = originalRetryMessage?.imageBase64 || capturedImage || selectedImage || null;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: finalPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language: originalRetryMessage?.language || language,
      imageBase64: attachmentForRequest || undefined,
      bookContext: originalRetryMessage?.bookContext || {
        bookId: book.id,
        officialId: book.officialId,
        medium: book.medium,
        classNumber: book.classNumber,
        subjectName: book.subjectName,
        bookTitle: book.title,
        pageNumber: currentPage,
        // Keep the chosen question number as structured locator context too.
        questionNumber: pendingQuestionNumber && typedPrompt ? typedPrompt.trim() : undefined,
        selectedText: selectedText || undefined,
      },
    };

    // Append user message immediately
    const nextMessages = [...baseMessages, userMsg];
    setMessages(nextMessages);
    saveStoredReaderMessages(book.id, nextMessages);

    setInputQuery('');
    const currentAttachment = attachmentForRequest;
    setCapturedImage(null);

    // Multi-turn history (excluding the current user message)
    const historyPayload = baseMessages
      .filter((m) => !m.isError)
      .slice(-6)
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    try {
      const res = await fetch('/api/ai/study-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMsg.content,
          language: userMsg.language,
          mode: /\b(?:whole|complete|entire)\s+(?:of\s+)?(?:the\s+)?exercise\b|\bsolve\s+(?:all|every)\s+(?:the\s+)?questions\b|\bsolve\s+(?:this\s+)?question\b/i.test(userMsg.content)
            ? 'solve-exercise'
            : 'general',
          useTextbook: true,
          bookContext: userMsg.bookContext,
          imageBase64: currentAttachment,
          history: historyPayload,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Server error');
      }

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.answer || 'No response generated.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: userMsg.language,
        followUps: data.followUps || [],
        sources: Array.isArray(data.sources) ? data.sources : [],
      };

      const finalMessages = [...nextMessages, assistantMsg];
      setMessages(finalMessages);
      saveStoredReaderMessages(book.id, finalMessages);
    } catch (err: any) {
      const errText = err.message || 'Failed to get answer from AI Assistant.';
      setErrorMsg(errText);

      // Keep user message intact and append error response
      const errMsgItem: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Could not retrieve response: ${errText}. Please click Retry below to run your question again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: userMsg.language,
        isError: true,
      };

      const withErrorMessages = [...nextMessages, errMsgItem];
      setMessages(withErrorMessages);
      saveStoredReaderMessages(book.id, withErrorMessages);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRetryError = (errorId: string) => {
    const errorIndex = messages.findIndex((message) => message.id === errorId);
    if (errorIndex < 0) return;

    let failedUserIndex = -1;
    for (let index = errorIndex - 1; index >= 0; index -= 1) {
      if (messages[index].role === 'user') {
        failedUserIndex = index;
        break;
      }
    }
    if (failedUserIndex < 0 || isGenerating) return;

    const originalUserMessage = messages[failedUserIndex];
    const baseMessages = messages.filter((message, index) =>
      index !== failedUserIndex && message.id !== errorId
    );
    setMessages(baseMessages);
    saveStoredReaderMessages(book.id, baseMessages);
    setErrorMsg(null);
    void sendQuery(originalUserMessage.content, { baseMessages, originalUserMessage });
  };

  return (
    <aside
      className={isExpanded
        ? "fixed inset-2 sm:inset-4 z-[260] w-auto h-auto min-h-0 rounded-2xl border border-blue-400/30 bg-slate-900 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        : "fixed inset-0 z-[260] w-full h-full min-h-0 bg-slate-900 border border-slate-700 flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-right duration-200 md:relative md:inset-auto md:z-40 md:w-96 lg:w-[420px] md:h-full md:border-y-0 md:border-r-0 md:border-l"
      }
      aria-label="AI textbook study chat"
    >
      {/* Panel Header */}
      <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-amber-500 text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-black text-white truncate">
              Ask AI in Reader
            </h3>
            <p className="text-[10px] text-slate-400 truncate">
              {book.title} • Page {currentPage}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleNewChat}
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition cursor-pointer"
            title="Start New Chat in Reader"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded((expanded) => !expanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition cursor-pointer"
            title={isExpanded ? "Return to reader side panel" : "Expand chat for easier reading"}
            aria-label={isExpanded ? "Collapse chatbot" : "Expand chatbot"}
            aria-pressed={isExpanded}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Close Panel"
            aria-label="Close chatbot"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Language Switcher */}
      <div className="px-3 py-1.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs shrink-0">
        <span className="text-slate-400 text-[11px] font-medium">Language:</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setLanguage('english')}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
              language === 'english' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage('urdu')}
            className={`px-2 py-0.5 rounded text-[11px] font-bold font-sans transition cursor-pointer ${
              language === 'urdu' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            اردو
          </button>
          <button
            onClick={() => setLanguage('sindhi')}
            className={`px-2 py-0.5 rounded text-[11px] font-bold font-sans transition cursor-pointer ${
              language === 'sindhi' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            سنڌي
          </button>
        </div>
      </div>

      {/* Selected Text Banner */}
      {selectedText && (
        <div className="p-2.5 bg-blue-950/40 border-b border-blue-900/50 text-xs text-blue-200 shrink-0 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-amber-300">
            <span>Selected Textbook Passage:</span>
            <button
              onClick={onClearSelectedText}
              className="text-slate-400 hover:text-white underline cursor-pointer"
            >
              Clear
            </button>
          </div>
          <p className="max-h-20 overflow-y-auto whitespace-pre-wrap break-words italic bg-slate-950/50 p-1.5 rounded-lg border border-blue-900/40 text-[11px] leading-relaxed">
            "{selectedText}"
          </p>
        </div>
      )}

      {/* Always-visible choices: the student should not need to type a prompt first. */}
      <div className="shrink-0 border-b border-slate-800 bg-slate-950/70 px-3 py-2.5">
        <p className="mb-2 text-[11px] font-semibold text-slate-300">What would you like to do?</p>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => handleFollowUpClick('Solve the whole exercise')}
            disabled={isGenerating}
            className="min-w-0 rounded-xl border border-blue-500/30 bg-blue-500/10 px-2 py-2 text-left text-[11px] font-bold text-blue-100 transition hover:bg-blue-500/20 disabled:opacity-50 cursor-pointer"
          >
            Solve the whole exercise
          </button>
          <button
            type="button"
            onClick={() => handleFollowUpClick('Solve a specific question')}
            disabled={isGenerating}
            className="min-w-0 rounded-xl border border-amber-500/30 bg-amber-500/10 px-2 py-2 text-left text-[11px] font-bold text-amber-100 transition hover:bg-amber-500/20 disabled:opacity-50 cursor-pointer"
          >
            Solve a specific question
          </button>
          <button
            type="button"
            onClick={() => handleFollowUpClick('Learn a concept')}
            disabled={isGenerating}
            className="min-w-0 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2 py-2 text-left text-[11px] font-bold text-emerald-100 transition hover:bg-emerald-500/20 disabled:opacity-50 cursor-pointer"
          >
            Learn a concept
          </button>
          <button
            type="button"
            onClick={() => handleFollowUpClick("Something else (I'll type)")}
            className="min-w-0 rounded-xl border border-slate-700 bg-slate-800/70 px-2 py-2 text-left text-[11px] font-bold text-slate-200 transition hover:bg-slate-700 cursor-pointer"
          >
            Something else — I’ll type
          </button>
        </div>
      </div>

      {/* Captured Image Preview */}
      {capturedImage && (
        <div className="p-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <img
              src={capturedImage}
              alt="Page snapshot"
              className="w-8 h-8 object-cover rounded-md border border-slate-700"
            />
            <span className="text-xs text-amber-300 font-mono">Page {currentPage} Snapshot Ready</span>
          </div>
          <button
            onClick={() => setCapturedImage(null)}
            className="p-1 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Compact, collapsible tools keep more room for the conversation. */}
      <div className="px-3 py-1.5 border-b border-slate-800 bg-slate-900/60 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Study tools</span>
          <button
            type="button"
            onClick={() => setShowAdvancedTools((open) => !open)}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-300 hover:bg-slate-800 hover:text-amber-300 transition"
            aria-expanded={showAdvancedTools}
          >
            <SlidersHorizontal className="w-3 h-3" />
            {showAdvancedTools ? 'Hide tools' : 'More tools'}
          </button>
        </div>
        {showAdvancedTools && (
          <div className="mt-1.5 flex flex-wrap gap-1.5 pb-1">
            <button
              type="button"
              onClick={() => handleQuickAction('explain')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-300 text-[11px] font-medium transition cursor-pointer"
            >
              💡 Explain
            </button>
            {selectedText && selectedText.split(' ').length <= 4 && (
              <button
                type="button"
                onClick={() => handleQuickAction('meaning')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-300 text-[11px] font-medium transition cursor-pointer"
              >
                📖 Meaning
              </button>
            )}
            <button
              type="button"
              onClick={() => handleQuickAction('solve')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-300 text-[11px] font-medium transition cursor-pointer"
            >
              ✏️ Solve
            </button>
            <button
              type="button"
              onClick={() => handleQuickAction('translate_urdu')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-300 text-[11px] font-medium transition cursor-pointer"
            >
              اردو
            </button>
            <button
              type="button"
              onClick={() => handleQuickAction('translate_sindhi')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-300 text-[11px] font-medium transition cursor-pointer"
            >
              سنڌي
            </button>
            <button
              type="button"
              onClick={() => handleQuickAction('mcqs')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-300 text-[11px] font-medium transition cursor-pointer"
            >
              🎯 MCQs
            </button>
            {onCapturePageImage && !capturedImage && (
              <button
                type="button"
                onClick={handleCaptureCurrentPage}
                disabled={isCapturing}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-medium transition flex items-center gap-1 cursor-pointer"
              >
                <Camera className="w-3 h-3" />
                <span>{isCapturing ? 'Capturing...' : 'Capture Page'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Voice Listening Active Banner */}
      {isListening && (
        <div className="px-3 py-1.5 bg-rose-950/80 border-b border-rose-800 text-[11px] text-rose-200 flex items-center justify-between animate-pulse shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>Listening to voice... speak your question now</span>
          </div>
          <button
            onClick={handleToggleVoiceInput}
            className="px-2 py-0.5 rounded bg-rose-700 text-white font-bold text-[10px]"
          >
            Done
          </button>
        </div>
      )}

      {/* Speech / Audio Notice */}
      {speechError && (
        <div className="px-3 py-1.5 bg-amber-950/80 border-b border-amber-800 text-[11px] text-amber-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{speechError}</span>
          </div>
          <button onClick={() => setSpeechError(null)} className="p-0.5 text-amber-400 hover:text-white">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Chronological Messages Stream */}
      <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 space-y-3 text-sm sm:text-[15px] leading-relaxed scrollbar-thin" style={{ WebkitOverflowScrolling: 'touch', overscrollBehaviorY: 'contain' }}>
        {messages.map((msg) => {
          const isAssistant = msg.role === 'assistant';
          const displayContent = formatStudyAnswer(msg.content);
          const isSpeaking = speakingId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
            >
              <div
                className={`max-w-[92%] rounded-2xl p-3 shadow-md space-y-2 leading-relaxed ${
                  isAssistant
                    ? msg.isError
                      ? 'bg-rose-950/80 text-rose-100 border border-rose-800/80 rounded-tl-sm'
                      : 'bg-slate-800 text-slate-100 border border-slate-700/80 rounded-tl-sm'
                    : 'bg-blue-600 text-white rounded-tr-sm'
                }`}
              >
                {/* Image attachment preview if any */}
                {msg.imageBase64 && (
                  <img
                    src={msg.imageBase64}
                    alt="Uploaded page"
                    className="max-h-40 rounded-lg border border-white/20 object-contain bg-black/40 mb-1"
                  />
                )}

                {/* Plain Text Content */}
                <div
                  className={`whitespace-pre-wrap break-words ${
                    msg.language === 'urdu' || msg.language === 'sindhi'
                      ? 'text-right font-sans text-sm leading-loose'
                      : ''
                  }`}
                  dir={msg.language === 'urdu' || msg.language === 'sindhi' ? 'rtl' : 'ltr'}
                >
                  {displayContent}
                </div>

                {isAssistant && msg.isError && (
                  <button
                    type="button"
                    onClick={() => handleRetryError(msg.id)}
                    disabled={isGenerating}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-rose-700 bg-rose-900/50 px-2.5 py-1.5 text-[11px] font-bold text-rose-100 hover:bg-rose-800/70 disabled:opacity-50"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Retry question
                  </button>
                )}

                {/* Official textbook sources returned by the assistant */}
                {isAssistant && !msg.isError && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/60 p-2.5 space-y-1.5" dir="ltr">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300">Textbook sources</p>
                    {msg.sources.map((source, sourceIndex) => (
                      <a
                        key={msg.id + '-source-' + sourceIndex}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-lg px-2 py-1.5 hover:bg-slate-800 transition"
                      >
                        <span className="block text-[11px] font-bold text-blue-200 underline underline-offset-2">{source.title}</span>
                        {source.detail && <span className="mt-0.5 block text-[10px] text-slate-400">{source.detail}</span>}
                      </a>
                    ))}
                  </div>
                )}

                {/* Toolbar for Assistant answers */}
                {isAssistant && !msg.isError && (
                  <div className="pt-1.5 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleSpeak(msg.id, displayContent)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded transition cursor-pointer ${
                          isSpeaking
                            ? 'bg-amber-400 text-slate-950 font-bold'
                            : 'bg-slate-700/60 hover:bg-slate-700 text-slate-300'
                        }`}
                        title="Read answer aloud"
                      >
                        {isSpeaking ? (
                          isSpeechPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />
                        ) : (
                          <Volume2 className="w-3 h-3" />
                        )}
                        <span>{isSpeaking ? (isSpeechPaused ? 'Resume' : 'Pause') : 'Listen'}</span>
                      </button>

                      {isSpeaking && (
                        <button
                          onClick={handleStopSpeech}
                          className="p-1 rounded bg-slate-700 text-rose-400 hover:text-white transition cursor-pointer"
                          title="Stop speech"
                        >
                          <Square className="w-3 h-3 fill-current" />
                        </button>
                      )}

                      <button
                        onClick={() => handleCopy(msg.id, displayContent)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-700/60 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{msg.timestamp}</span>
                  </div>
                )}
              </div>

              {/* Follow-up suggestions */}
              {isAssistant && msg.followUps && msg.followUps.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1 max-w-[90%]">
                  {msg.followUps.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleFollowUpClick(chip)}
                      className="px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] border border-slate-700 transition cursor-pointer"
                    >
                      {chip} →
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator — previous messages remain visible */}
        {isGenerating && (
          <div className="flex items-start">
            <div className="max-w-[85%] rounded-2xl rounded-tl-sm p-3 bg-slate-800 border border-slate-700 text-slate-300 text-xs flex items-center gap-2.5 shadow-md">
              <RefreshCw className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
              <div>
                <p className="font-bold text-white text-[11px]">Consulting textbook...</p>
                <p className="text-[10px] text-slate-400">Formulating plain-text answer</p>
              </div>
            </div>
          </div>
        )}

        
      </div>

      {/* Compact quick-help actions stay visible whenever the composer is empty. */}
      {!isGenerating && !inputQuery.trim() && !pendingQuestionNumber && !pendingConceptTopic && (
        <div className="px-3 py-1.5 bg-slate-950/95 border-t border-slate-800 shrink-0">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wide font-bold text-slate-500">
            <Sparkles className="w-3 h-3 text-amber-400" />
            What would you like to do?
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => handleFollowUpClick('Solve the whole exercise')} className="min-h-[42px] rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-100 hover:border-amber-400/60 hover:text-amber-300 active:bg-slate-800">Whole exercise</button>
            <button type="button" onClick={() => handleFollowUpClick('Solve a specific question')} className="min-h-[42px] rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-100 hover:border-amber-400/60 hover:text-amber-300 active:bg-slate-800">Specific question</button>
            <button type="button" onClick={() => handleFollowUpClick('Learn a concept')} className="min-h-[42px] rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-100 hover:border-amber-400/60 hover:text-amber-300 active:bg-slate-800">Learn a concept</button>
            <button type="button" onClick={() => handleFollowUpClick("Something else (I'll type)")} className="min-h-[42px] rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-100 hover:border-amber-400/60 hover:text-amber-300 active:bg-slate-800">Type a question</button>
          </div>
        </div>
      )}

      {/* Input Bar with Voice Input & Edit Before Send */}
      <div className="p-2 bg-slate-950 border-t border-slate-800 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendQuery();
          }}
          className="flex items-center gap-2"
        >
          {/* Voice Microphone Input Button */}
          {isSpeechRecognitionSupported() && (
            <button
              type="button"
              onClick={handleToggleVoiceInput}
              className={`p-2 rounded-xl transition cursor-pointer shrink-0 ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400'
              }`}
              title={isListening ? 'Listening... click to stop' : 'Voice Input (Speech to Text)'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}

          {/* Multi-line composer: use Enter to send and Shift+Enter for a new line. */}
          <textarea
            ref={inputRef}
            rows={2}
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendQuery();
              }
            }}
            placeholder={
              language === 'urdu'
                ? 'اس صفحے یا سوال سے متعلق کچھ بھی پوچھیں...'
                : language === 'sindhi'
                ? 'هن صفحي يا درسي سوال بابت پڇو...'
                : 'Ask a question, enter a question number, or use a quick action…'
            }
            className="min-w-0 flex-1 resize-y bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/70 max-h-32 min-h-[48px]"
            dir={language === 'urdu' || language === 'sindhi' ? 'rtl' : 'ltr'}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={isGenerating || !inputQuery.trim()}
            className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4 text-amber-300" />
          </button>
        </form>
      </div>
    </aside>
  );
};
