import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Languages,
  BookOpen,
  Copy,
  Check,
  Plus,
  Volume2,
  Mic,
  MicOff,
  Image as ImageIcon,
  X,
  ChevronDown,
  GraduationCap,
  Calculator,
  MessageSquare,
  ArrowRight,
  BookMarked,
  RefreshCw,
  Play,
  Pause,
  Square,
  AlertCircle,
  History,
  Trash2,
} from 'lucide-react';
import { ALL_VERIFIED_BOOKS, CLASSES_LIST } from '../data/stbbData';
import { Book } from '../types';
import {
  AssistantLanguage,
  ChatMessage,
  Conversation,
  getStoredConversations,
  saveConversations,
  getActiveConversationId,
  setActiveConversationId,
  createNewConversation,
  getOrCreateActiveConversation,
  updateConversation,
  deleteConversation,
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

interface AIAssistantViewProps {
  initialBook?: Book | null;
  initialSelectedText?: string;
  initialPageNumber?: number;
  onOpenBookReader?: (book: Book, pageNumber?: number) => void;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  initialBook,
  initialSelectedText,
  initialPageNumber,
  onOpenBookReader,
}) => {
  // Conversation List & Active Conversation
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [showHistoryDrawer, setShowHistoryDrawer] = useState<boolean>(false);
  const [showExamplePrompts, setShowExamplePrompts] = useState<boolean>(false);

  // Active Chat Language
  const [selectedLanguage, setSelectedLanguage] = useState<AssistantLanguage>('english');

  // Active Context Fields
  const [selectedClass, setSelectedClass] = useState<number | null>(
    initialBook?.classNumber || 10
  );
  const [selectedBookId, setSelectedBookId] = useState<string>(
    initialBook?.id || ''
  );
  // General questions should be answered directly by the AI. Textbook retrieval
  // is opt-in unless this assistant was opened from a specific book in the reader.
  // The main assistant is always a general-purpose chat. Book-aware help
  // lives in the PDF reader's own assistant, where the actual reader context exists.
  const [answerMode, setAnswerMode] = useState<'general' | 'textbook'>('general');
  const [chapterInput, setChapterInput] = useState<string>('');
  const [exerciseInput, setExerciseInput] = useState<string>('');
  const [pageInput, setPageInput] = useState<string>(
    initialPageNumber ? initialPageNumber.toString() : ''
  );
  const [questionInput, setQuestionInput] = useState<string>('');
  const [showAdvancedLocator, setShowAdvancedLocator] = useState<boolean>(false);

  // Keep highlighted textbook text as separate context. Never auto-fill the student's message box.
  const [selectedPassage, setSelectedPassage] = useState<string>(initialSelectedText || '');

  // Keep the selected passage separate from the user's question; it is sent as context.
  const [userInput, setUserInput] = useState<string>('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);

  // Loading & State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [failedPrompt, setFailedPrompt] = useState<string | null>(null);

  // Voice Speech-to-Text State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);
  const voiceBaseInputRef = useRef<string>('');

  // Voice Text-to-Speech State
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isSpeechPaused, setIsSpeechPaused] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load conversations from localStorage on mount
  useEffect(() => {
    const loaded = getStoredConversations();
    setConversations(loaded);

    const initialConv = getOrCreateActiveConversation('english', {
      classNumber: initialBook?.classNumber,
      subjectName: initialBook?.subjectName,
      bookTitle: initialBook?.title,
      pageNumber: initialPageNumber,
      selectedText: initialSelectedText,
    });

    setActiveConvId(initialConv.id);
    setSelectedLanguage(initialConv.language || 'english');
  }, []);

  // Synchronize active conversation
  const activeConversation = conversations.find((c) => c.id === activeConvId) || null;
  const messages = activeConversation?.messages || [];

  // Available books for the selected class
  const availableBooks = selectedClass
    ? ALL_VERIFIED_BOOKS.filter((b) => b.classNumber === selectedClass)
    : ALL_VERIFIED_BOOKS;

  const currentSelectedBook = ALL_VERIFIED_BOOKS.find((b) => b.id === selectedBookId) || null;

  // Initialize speech support detection. A recognizer is created only when
  // the user taps the microphone, through the shared speech helper.
  useEffect(() => {
    setSpeechSupported(isSpeechRecognitionSupported());

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Sync initial props from reader
  useEffect(() => {
    if (initialBook) {
      setSelectedClass(initialBook.classNumber);
      setSelectedBookId(initialBook.id);
    }
    setSelectedPassage(initialSelectedText || '');
    setUserInput('');
    setErrorNotice(null);
    setFailedPrompt(null);
    setPageInput(initialPageNumber ? initialPageNumber.toString() : '');
  }, [initialBook, initialSelectedText, initialPageNumber]);

  // Scroll to bottom on new message or loading change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isLoading]);

  // Language Change: updates conversation language without wiping messages
  const handleLanguageChange = (newLang: AssistantLanguage) => {
    setSelectedLanguage(newLang);
    if (activeConvId) {
      const updated = updateConversation(activeConvId, (conv) => ({
        ...conv,
        language: newLang,
      }));
      setConversations(updated);
    }
  };

  // Start New Chat: creates a new conversation and switches to it
  const handleNewChat = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeakingMessageId(null);
    setErrorNotice(null);
    setFailedPrompt(null);
    setUserInput('');
    setSelectedPassage('');
    setAttachedImage(null);

    const bookContext = {
      bookId: currentSelectedBook?.id,
      officialId: currentSelectedBook?.officialId,
      medium: currentSelectedBook?.medium,
      classNumber: selectedClass || undefined,
      subjectName: currentSelectedBook?.subjectName,
      bookTitle: currentSelectedBook?.title,
      chapter: chapterInput.trim() || undefined,
      exercise: exerciseInput.trim() || undefined,
      pageNumber: pageInput ? parseInt(pageInput, 10) : undefined,
      questionNumber: questionInput.trim() || undefined,
    };

    const newConv = createNewConversation(selectedLanguage, bookContext);
    setConversations(getStoredConversations());
    setActiveConvId(newConv.id);
    setShowHistoryDrawer(false);
  };

  // Switch Conversation
  const handleSelectConversation = (convId: string) => {
    setActiveConvId(convId);
    setActiveConversationId(convId);
    const target = conversations.find((c) => c.id === convId);
    if (target) {
      setSelectedLanguage(target.language || 'english');
    }
    setShowHistoryDrawer(false);
    setErrorNotice(null);
  };

  // Delete Conversation
  const handleDeleteConversation = (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    const updated = deleteConversation(convId);
    setConversations(updated);
    if (activeConvId === convId) {
      const nextId = updated[0]?.id || '';
      setActiveConvId(nextId);
      if (!nextId) {
        handleNewChat();
      }
    }
  };

  // Handle Speech Recognition Toggle with Permission Checks and Editable Text
  const toggleSpeechRecognition = async () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    setErrorNotice(null);

    // Explicit microphone permission check
    const perm = await requestMicrophonePermission();
    if (!perm.granted) {
      setErrorNotice(perm.error || 'Microphone access is not permitted.');
      return;
    }

    // Keep the text typed before recording as a fixed prefix. Interim
    // recognition updates replace the dictated draft instead of appending it.
    voiceBaseInputRef.current = userInput.trim();

    const rec = createSpeechRecognizer({
      language: selectedLanguage,
      onResult: (transcript) => {
        const base = voiceBaseInputRef.current;
        setUserInput([base, transcript.trim()].filter(Boolean).join(' '));
      },
      onError: (err) => {
        setErrorNotice(err);
        setIsRecording(false);
      },
      onEnd: () => {
        setIsRecording(false);
      },
    });

    if (rec) {
      recognitionRef.current = rec;
      rec.start();
      setIsRecording(true);
    }
  };

  // Handle Text-to-Speech Read Aloud with Play/Pause/Stop
  const handleToggleSpeak = (msgId: string, text: string, lang: AssistantLanguage) => {
    if (!isSpeechSynthesisSupported()) {
      setErrorNotice('Text-to-speech audio playback is not supported in this browser.');
      return;
    }

    if (speakingMessageId === msgId) {
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
    setSpeakingMessageId(msgId);

    speakText(
      text,
      lang,
      () => {
        setSpeakingMessageId(null);
        setIsSpeechPaused(false);
      },
      () => {
        setSpeakingMessageId(null);
        setIsSpeechPaused(false);
      }
    );
  };

  const handleStopSpeech = () => {
    stopSpeech();
    setSpeakingMessageId(null);
    setIsSpeechPaused(false);
  };

  // Image Upload handler
  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorNotice('Please upload a valid image file (PNG, JPG, WEBP) of your textbook page.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorNotice('Image size exceeds 15MB limit. Please attach a smaller screenshot.');
      return;
    }

    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage(reader.result as string);
      setErrorNotice(null);
    };
    reader.readAsDataURL(file);
  };

  // Send Message: Appends user message and AI response, preserves history.
  // Students can submit a chapter/exercise locator without knowing the page number.
  const handleSendMessage = async (customPrompt?: string) => {
    const typedPrompt = (customPrompt ?? userInput).trim();
    // The universal assistant is intentionally simple: the student writes a
    // question in their own words. Book-specific exercise workflows live inside
    // the PDF reader, where the actual book/page context is available.
    const promptToSend = typedPrompt || (
      attachedImage ? 'Please explain the attached image and answer any visible question.' : ''
    );
    if (!promptToSend && !attachedImage) return;

    setErrorNotice(null);
    setFailedPrompt(null);
    setIsLoading(true);

    // A page may be typed naturally in chat (for example, "solve Exercise 7.1 on page 199")
    // rather than entered in the locator. Detect that page too so the browser can send
    // an image of scanned PDFs to the AI instead of relying on selectable PDF text.
    const typedPromptPageMatch = typedPrompt.match(/\b(?:pdf\s*)?page(?:\s*(?:number|no\.?)\s*)?[:#-]?\s*(\d{1,4})\b/i) ||
      typedPrompt.match(/\bp\.?\s*(\d{1,4})\b/i);
    const typedPromptPageNumber = typedPromptPageMatch ? Number(typedPromptPageMatch[1]) : undefined;
    const locatorPageNumber = pageInput.trim() && Number.isInteger(Number(pageInput)) && Number(pageInput) > 0
      ? Number(pageInput)
      : typedPromptPageNumber;

    const selectedBookContext = {
      bookId: currentSelectedBook?.id,
      officialId: currentSelectedBook?.officialId,
      medium: currentSelectedBook?.medium,
      classNumber: selectedClass || undefined,
      subjectName: currentSelectedBook?.subjectName,
      bookTitle: currentSelectedBook?.title,
      chapter: chapterInput.trim() || undefined,
      exercise: exerciseInput.trim() || undefined,
      // A supplied or naturally typed PDF page number takes priority over exercise scanning.
      pageNumber: locatorPageNumber,
      questionNumber: questionInput.trim() || undefined,
      selectedText: selectedPassage.trim() || undefined,
    };
    // Selected text is always useful context, even in Direct Answer mode, but it
    // must never force textbook retrieval or be inserted into the message box.
    const bookContext = answerMode === 'textbook' || selectedPassage.trim()
      ? selectedBookContext
      : undefined;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: promptToSend || 'Solve and explain the questions on this textbook page image.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language: selectedLanguage,
      imageBase64: attachedImage || undefined,
      bookContext,
    };

    // Append user message to active conversation immediately
    let targetConvId = activeConvId;
    if (!targetConvId) {
      const newConv = createNewConversation(selectedLanguage, bookContext);
      targetConvId = newConv.id;
      setActiveConvId(newConv.id);
    }

    const updatedWithUser = updateConversation(targetConvId, (conv) => {
      // Auto-update conversation title if it's the first user question
      const newTitle =
        conv.messages.filter((m) => m.role === 'user').length === 0
          ? promptToSend.slice(0, 36)
          : conv.title;

      return {
        ...conv,
        title: newTitle,
        messages: [...conv.messages, userMsg],
      };
    });
    setConversations(updatedWithUser);

    setUserInput('');
    let currentAttachment = attachedImage;
    setAttachedImage(null);
    setImageFileName(null);

    // Prepare previous history turns for multi-turn context
    const currentConv = updatedWithUser.find((c) => c.id === targetConvId);
    const previousHistory = (currentConv?.messages || [])
      .slice(0, -1) // exclude the message we just added
      .filter((m) => !m.isError)
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    try {
      // Do not silently attach a full textbook page just because a page number
      // is selected. Only a photo explicitly chosen by the student is sent.
      // The backend can search the book text using the supplied page context.

      const response = await fetch('/api/ai/study-assist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: promptToSend,
          language: selectedLanguage,
          mode: answerMode === 'textbook' && (
            Boolean(exerciseInput.trim()) ||
            /\b(?:review\s+exercise|exercise|review\s+questions?)\s*(?:no\.?\s*)?\d+(?:\.\d+)?/i.test(typedPrompt)
          ) ? 'solve-exercise' : 'general',
          useTextbook: answerMode === 'textbook',
          bookContext,
          imageBase64: currentAttachment,
          history: previousHistory,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const data = await response.json();

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.answer || 'No answer provided.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: selectedLanguage,
        followUps: data.followUps || [],
        sources: Array.isArray(data.sources) ? data.sources : [],
      };

      // Append assistant message in chronological order
      const updatedWithAI = updateConversation(targetConvId, (conv) => ({
        ...conv,
        messages: [...conv.messages, assistantMsg],
      }));
      setConversations(updatedWithAI);
    } catch (err: any) {
      console.error('AI Request Failed:', err);
      const rawError = err instanceof Error ? err.message : '';
      const errMsg = /failed to fetch|networkerror|load failed/i.test(rawError)
        ? 'The AI server connection was lost. In Codespaces, check that the terminal still shows the STBB Books server running. If it stopped or reports a port conflict, press Ctrl+C and run npm run dev once, then retry.'
        : rawError || 'Unable to connect to AI Study Assistant.';
      setErrorNotice(errMsg);
      setFailedPrompt(promptToSend);

      // Append an error notice as a response so user history is never lost
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Could not complete response: ${errMsg}. Click Retry below to run your question again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: selectedLanguage,
        isError: true,
      };

      const updatedWithError = updateConversation(targetConvId, (conv) => ({
        ...conv,
        messages: [...conv.messages, errorMsg],
      }));
      setConversations(updatedWithError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] min-h-[550px] max-w-5xl mx-auto bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden mb-8 relative">
      {/* Top Header & Study Workspace Bar */}
      <div className="bg-slate-950/90 border-b border-slate-800 p-3 sm:p-4 shrink-0 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Branding & Universal Bot Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-amber-500 text-white flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                AI Study Assistant
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-[11px] font-bold text-blue-300 hidden sm:inline">
                Curriculum Grounded
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Classes 1–12 • Every Subject • Plain text explanations & step-by-step solutions
            </p>
          </div>
        </div>

        {/* Right: History, Language Selector & New Chat */}
        <div className="flex items-center gap-2">
          {/* Saved Chats History Drawer Button */}
          <button
            onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              showHistoryDrawer
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Saved Chat History"
          >
            <History className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Saved Chats</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-400">
              {conversations.length}
            </span>
          </button>

          {/* Trilingual Language Selector */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <Languages className="w-3.5 h-3.5 text-amber-400 ml-1 mr-1.5" />
            <button
              onClick={() => handleLanguageChange('english')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                selectedLanguage === 'english'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              English
            </button>
            <button
              onClick={() => handleLanguageChange('urdu')}
              className={`px-2.5 py-1 rounded-lg transition font-sans cursor-pointer ${
                selectedLanguage === 'urdu'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              اردو
            </button>
            <button
              onClick={() => handleLanguageChange('sindhi')}
              className={`px-2.5 py-1 rounded-lg transition font-sans cursor-pointer ${
                selectedLanguage === 'sindhi'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              سنڌي
            </button>
          </div>

          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer shadow-sm"
            title="Start a New Conversation"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* Saved Conversations Dropdown / Drawer */}
      {showHistoryDrawer && (
        <div className="absolute top-16 right-4 z-30 w-80 max-h-96 bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in-50 duration-150">
          <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <History className="w-4 h-4 text-amber-400" />
              <span>Past Conversations</span>
            </div>
            <button
              onClick={() => setShowHistoryDrawer(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-y-auto p-2 space-y-1 flex-1">
            {conversations.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No saved conversations yet.</p>
            ) : (
              conversations.map((conv) => {
                const isActive = conv.id === activeConvId;
                const userMsgCount = conv.messages.filter((m) => m.role === 'user').length;

                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition group ${
                      isActive
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="truncate text-xs font-medium">{conv.title}</p>
                      <p className={`text-[10px] ${isActive ? 'text-blue-200' : 'text-slate-500'}`}>
                        {new Date(conv.updatedAt).toLocaleDateString()} • {userMsgCount} questions
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteConversation(e, conv.id)}
                      className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition ${
                        isActive
                          ? 'hover:bg-blue-700 text-blue-200 hover:text-white'
                          : 'hover:bg-slate-800 text-slate-400 hover:text-rose-400'
                      }`}
                      title="Delete Conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-2 border-t border-slate-800 bg-slate-900">
            <button
              onClick={handleNewChat}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Start Fresh Conversation</span>
            </button>
          </div>
        </div>
      )}

      {/* Universal assistant: no class, subject or chapter filters. Type any question directly. */}
      <div className="shrink-0 border-b border-slate-800 bg-slate-900/80 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
            General Study Assistant
          </span>
          <span className="text-[11px] text-slate-400">Ask any question in your own words.</span>
        </div>
        <span className="text-[10px] text-slate-500">For a textbook passage, select text in the reader and choose Ask Chatbot.</span>
      </div>

      {/* Selected passage is visible as context, not inserted into the question field. */}
      {selectedPassage.trim() && (
        <div className="shrink-0 border-b border-slate-800 bg-blue-950/30 px-4 py-2.5">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-amber-300">Selected textbook passage · context only</span>
            <button
              type="button"
              onClick={() => setSelectedPassage('')}
              className="text-[11px] text-slate-400 underline hover:text-white"
            >
              Clear
            </button>
          </div>
          <div className="max-h-20 overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-blue-900/40 bg-slate-950/70 p-2 text-xs leading-relaxed text-blue-100">
            {selectedPassage}
          </div>
        </div>
      )}

      {/* Main Conversation Messages Scroll Area (Chronological Order) */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 scrollbar-thin">
        {messages.map((msg) => {
          const isAssistant = msg.role === 'assistant';
          const displayContent = formatStudyAnswer(msg.content);
          const isSpeaking = speakingMessageId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
            >
              <div
                className={`max-w-[96%] sm:max-w-[92%] rounded-2xl p-4 sm:p-5 shadow-lg space-y-3 leading-relaxed text-sm ${
                  isAssistant
                    ? msg.isError
                      ? 'bg-rose-950/80 text-rose-100 border border-rose-800/80 rounded-tl-sm'
                      : 'bg-slate-800 text-slate-100 border border-slate-700/80 rounded-tl-sm'
                    : 'bg-blue-600 text-white rounded-tr-sm'
                }`}
              >
                {/* User Attachment Thumbnail */}
                {msg.imageBase64 && (
                  <div className="mb-2">
                    <img
                      src={msg.imageBase64}
                      alt="Uploaded textbook page"
                      className="max-h-60 rounded-xl border border-white/20 object-contain bg-black/40"
                    />
                  </div>
                )}

                {/* Context Header Badge on User Message */}
                {msg.bookContext && (msg.bookContext.bookTitle || msg.bookContext.exercise) && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/25 text-[11px] font-mono text-amber-200">
                    <BookMarked className="w-3 h-3" />
                    <span>
                      {msg.bookContext.bookTitle || `Class ${msg.bookContext.classNumber}`}
                      {msg.bookContext.exercise ? ` • Ex ${msg.bookContext.exercise}` : ''}
                      {msg.bookContext.pageNumber ? ` • P.${msg.bookContext.pageNumber}` : ''}
                    </span>
                  </div>
                )}

                {/* Plain-Text Content Display */}
                <div
                  className={`whitespace-pre-wrap break-words leading-relaxed font-normal text-slate-100 ${
                    msg.language === 'urdu' || msg.language === 'sindhi'
                      ? 'text-right font-sans text-base leading-loose'
                      : ''
                  }`}
                  dir={msg.language === 'urdu' || msg.language === 'sindhi' ? 'rtl' : 'ltr'}
                >
                  {displayContent}
                </div>

                {/* Official textbook sources returned by the server-side catalogue lookup */}
                {isAssistant && !msg.isError && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-900/60 p-3 space-y-2" dir="ltr">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300">Textbook sources</p>
                    {msg.sources.map((source, sourceIndex) => (
                      <a
                        key={msg.id + '-source-' + sourceIndex}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-lg px-2 py-2 hover:bg-slate-800 transition"
                      >
                        <span className="block text-xs font-bold text-blue-200 underline underline-offset-2">{source.title}</span>
                        {source.detail && <span className="mt-0.5 block text-[10px] text-slate-400">{source.detail}</span>}
                      </a>
                    ))}
                  </div>
                )}

                {/* Retry Button if message was an error */}
                {msg.isError && failedPrompt && (
                  <button
                    onClick={() => handleSendMessage(failedPrompt)}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-rose-800 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Question</span>
                  </button>
                )}

                {/* Assistant Controls Bar: Read Aloud, Copy, Timestamp */}
                {isAssistant && !msg.isError && (
                  <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleSpeak(msg.id, displayContent, msg.language)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition cursor-pointer ${
                          isSpeaking
                            ? 'bg-amber-400 text-slate-950 font-bold'
                            : 'bg-slate-700/60 hover:bg-slate-700 text-slate-300'
                        }`}
                        title="Read Aloud"
                      >
                        {isSpeaking ? (
                          isSpeechPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                        <span>{isSpeaking ? (isSpeechPaused ? 'Resume' : 'Pause') : 'Listen'}</span>
                      </button>

                      {isSpeaking && (
                        <button
                          onClick={handleStopSpeech}
                          className="p-1 rounded-lg bg-slate-700 text-rose-400 hover:text-white transition cursor-pointer"
                          title="Stop Speech"
                        >
                          <Square className="w-3.5 h-3.5 fill-current" />
                        </button>
                      )}

                      <button
                        onClick={() => handleCopyText(msg.id, displayContent)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                        title="Copy Answer"
                      >
                        {copiedMessageId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    <span className="text-[10px] text-slate-500 font-mono">
                      {msg.timestamp}
                    </span>
                  </div>
                )}
              </div>

              {/* Follow-up Chips for Continuous Learning */}
              {isAssistant && msg.followUps && msg.followUps.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 max-w-[85%]">
                  {msg.followUps.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(chip)}
                      className="px-3 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-700 text-xs transition cursor-pointer"
                    >
                      {chip} →
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator — earlier messages remain fully visible */}
        {isLoading && (
          <div className="flex items-start">
            <div className="max-w-[75%] rounded-2xl rounded-tl-sm p-4 bg-slate-800 border border-slate-700 text-slate-300 text-sm flex items-center gap-3 shadow-md">
              <RefreshCw className="w-5 h-5 text-amber-400 animate-spin shrink-0" />
              <div>
                <p className="font-bold text-white text-xs">Generating verified STBB response...</p>
                <p className="text-[11px] text-slate-400">Grounding steps in official syllabus</p>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Notice */}
      {errorNotice && (
        <div className="px-4 py-2 bg-rose-950/80 border-t border-rose-800/60 text-xs text-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorNotice}</span>
          </div>
          <button onClick={() => setErrorNotice(null)} className="p-1 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Image Preview Strip before sending */}
      {attachedImage && (
        <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src={attachedImage}
              alt="Attached preview"
              className="w-9 h-9 object-cover rounded-lg border border-slate-700"
            />
            <span className="text-xs text-amber-300 font-medium truncate max-w-xs">
              Attached: {imageFileName || 'Textbook Page Photo'}
            </span>
          </div>
          <button
            onClick={() => {
              setAttachedImage(null);
              setImageFileName(null);
            }}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bottom Message Input Controls Bar */}
      <div className="bg-slate-950 p-3 sm:p-4 border-t border-slate-800 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* Image Upload Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageFileSelect}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition cursor-pointer"
            title="Attach Textbook Page Photo or Screenshot"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          {/* Voice Microphone Input Button */}
          <button
            type="button"
            onClick={toggleSpeechRecognition}
            className={`p-2.5 rounded-xl transition cursor-pointer ${
              isRecording
                ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400'
            }`}
            title={isRecording ? 'Listening... click to stop' : 'Voice Input (Speech to Text)'}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Multi-line question field: Enter sends; Shift+Enter adds a line. */}
          <div className="relative min-w-0 flex-1">
            <textarea
              rows={2}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={
                selectedLanguage === 'urdu'
                  ? 'اپنا سوال یا مشق یہاں لکھیے (مثلاً: کلاس 11 میتھ مشق 9.1 سوال 3 حل کریں)...'
                  : selectedLanguage === 'sindhi'
                  ? 'پنهنجو درسي سوال هتي لکو (مثال: ڪلاس 8 سنڌي سبق 4 سوال 3 سمجهايو)...'
                  : 'Ask a question, exercise, concept, or word…'
              }
              className="w-full min-h-[52px] max-h-32 resize-y bg-slate-900 border border-slate-700 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              dir={selectedLanguage === 'urdu' || selectedLanguage === 'sindhi' ? 'rtl' : 'ltr'}
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={isLoading || (!userInput.trim() && !attachedImage)}
            className="p-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-lg transition-transform active:scale-95 cursor-pointer shrink-0"
          >
            <Send className="w-5 h-5 text-amber-300" />
          </button>
        </form>

        {/* Example prompts are collapsed by default to leave more room for chat. */}
        <div className="mt-1.5 flex justify-end">
          <button
            type="button"
            onClick={() => setShowExamplePrompts((show) => !show)}
            className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-slate-400 hover:bg-slate-900 hover:text-amber-300 transition"
            aria-expanded={showExamplePrompts}
          >
            {showExamplePrompts ? 'Hide examples −' : 'Show example questions +'}
          </button>
        </div>
        {showExamplePrompts && (
        <div className="mt-1.5 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs text-slate-400 scrollbar-none">
          <span className="text-[11px] font-semibold text-slate-500 shrink-0">Try:</span>
          <button
            type="button"
            onClick={() => handleSendMessage('Class 11 Mathematics, Sets and Functions, Exercise 9.1 solve karo')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-300 transition shrink-0 cursor-pointer"
          >
            Class 11 Maths Ex 9.1
          </button>
          <button
            type="button"
            onClick={() => handleSendMessage('Class 9 Biology, page 120, review exercise solve karo')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-300 transition shrink-0 cursor-pointer"
          >
            Class 9 Biology P.120 Review
          </button>
          <button
            type="button"
            onClick={() => handleSendMessage('Class 8 Sindhi book, chapter 4, question 3 samjhao')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-300 transition shrink-0 cursor-pointer"
          >
            Class 8 Sindhi Ch 4 Q3
          </button>
          <button
            type="button"
            onClick={() => handleSendMessage('Class 10 Physics: Newton laws of motion with formula and SI units')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-300 transition shrink-0 cursor-pointer"
          >
            Class 10 Physics Motion
          </button>
        </div>
        )}
      </div>
    </div>
  );
};
