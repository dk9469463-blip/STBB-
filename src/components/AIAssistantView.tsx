import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Languages,
  BookOpen,
  HelpCircle,
  Copy,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Image as ImageIcon,
  X,
  FileQuestion,
  ChevronDown,
  Layers,
  GraduationCap,
  Calculator,
  MessageSquare,
  ArrowRight,
  BookMarked,
  RefreshCw,
  Play,
  Pause,
  Square,
  CheckCircle2,
  AlertCircle,
  Upload,
} from 'lucide-react';
import { ALL_VERIFIED_BOOKS, CLASSES_LIST } from '../data/stbbData';
import { Book } from '../types';

export type AssistantLanguage = 'english' | 'urdu' | 'sindhi';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  language: AssistantLanguage;
  bookContext?: {
    classNumber?: number;
    subjectName?: string;
    bookTitle?: string;
    chapter?: string;
    exercise?: string;
    pageNumber?: number;
    questionNumber?: string;
    selectedText?: string;
  };
  imageBase64?: string;
  followUps?: string[];
  batchInfo?: {
    currentBatch: number;
    hasMore: boolean;
  };
}

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
  // Chat Language
  const [selectedLanguage, setSelectedLanguage] = useState<AssistantLanguage>('english');

  // Active Context Fields
  const [selectedClass, setSelectedClass] = useState<number | null>(
    initialBook?.classNumber || 10
  );
  const [selectedBookId, setSelectedBookId] = useState<string>(
    initialBook?.id || ''
  );
  const [chapterInput, setChapterInput] = useState<string>('');
  const [exerciseInput, setExerciseInput] = useState<string>('');
  const [pageInput, setPageInput] = useState<string>(
    initialPageNumber ? initialPageNumber.toString() : ''
  );
  const [questionInput, setQuestionInput] = useState<string>('');
  const [showAdvancedLocator, setShowAdvancedLocator] = useState<boolean>(false);

  // Message Input & Image Attachment
  const [userInput, setUserInput] = useState<string>(initialSelectedText || '');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);

  // Conversation State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Voice Speech-to-Text State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // Voice Text-to-Speech State
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isSpeechPaused, setIsSpeechPaused] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Available books for the selected class
  const availableBooks = selectedClass
    ? ALL_VERIFIED_BOOKS.filter((b) => b.classNumber === selectedClass)
    : ALL_VERIFIED_BOOKS;

  const currentSelectedBook = ALL_VERIFIED_BOOKS.find((b) => b.id === selectedBookId) || null;

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognizer = new SpeechRecognition();
      recognizer.continuous = false;
      recognizer.interimResults = true;

      recognizer.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setUserInput(transcript);
      };

      recognizer.onend = () => {
        setIsRecording(false);
      };

      recognizer.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognitionRef.current = recognizer;
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Sync initial props from reader or external navigation
  useEffect(() => {
    if (initialBook) {
      setSelectedClass(initialBook.classNumber);
      setSelectedBookId(initialBook.id);
    }
    if (initialSelectedText) {
      setUserInput(initialSelectedText);
    }
    if (initialPageNumber) {
      setPageInput(initialPageNumber.toString());
      setShowAdvancedLocator(true);
    }
  }, [initialBook, initialSelectedText, initialPageNumber]);

  // Set initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      const greetingMap = {
        english:
          'Welcome to the official STBB AI Study Assistant! I can help you solve textbook exercises, explain difficult scientific formulas, translate vocabulary in English, Urdu, or Sindhi, solve step-by-step mathematical problems, and answer review questions across all 12 classes.',
        urdu:
          'سندھ ٹیکسٹ بک بورڈ (STBB) کے اے آئی اسٹڈی اسسٹنٹ میں خوش آمدید! میں کلاس 1 تا 12 کے تمام درسی کتب، مشقی سوالات کے مرحلہ وار حل، سائنسی و ریاضیاتی فارمولوں اور مشکل الفاظ کے اردو معانی و وضاحت میں آپ کی رہنمائی کر سکتا ہوں۔',
        sindhi:
          'سنڌ ٽيڪسٽ بوڪ بورڊ (STBB) جي AI اسٽڊي اسسٽنٽ ۾ ڀليڪار! مان ڪلاس 1 کان 12 تائين سمورن درسي ڪتابن، مشقن جي مرحليوار حل، سائنسي ۽ رياضياتي فارمولن جي سمجهاڻي، ۽ سنڌي، اردو ۽ انگريزي ۾ درسي سوالن جا تفصيلي جواب ڏئي سگهان ٿو.',
      };

      setMessages([
        {
          id: 'welcome-1',
          role: 'assistant',
          content: greetingMap[selectedLanguage],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          language: selectedLanguage,
          followUps:
            selectedLanguage === 'urdu'
              ? [
                  'کلاس 9 حیاتیات (Biology) کے مشقی سوالات حل کریں',
                  'کلاس 11 ریاضی (Mathematics) سیٹ اور فنکشنز',
                  'مشکل لفظ کا معنی اور جملہ معلوم کریں',
                ]
              : selectedLanguage === 'sindhi'
              ? [
                  'ڪلاس 8 سنڌي درسي ڪتاب جي مشق حل ڪريو',
                  'ڪلاس 10 فزڪس جا نيوميريڪل سمجهايو',
                  'هن لفظ جي سنڌي معنيٰ ۽ سمجهاڻي ٻڌايو',
                ]
              : [
                  'Class 11 Mathematics: Exercise 9.1 Sets and Functions',
                  'Class 9 Biology: Cell structure and review questions',
                  'Class 10 Physics: Motion and Newton laws numericals',
                ],
        },
      ]);
    }
  }, [selectedLanguage]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle Speech Recognition Toggle
  const toggleSpeechRecognition = () => {
    if (!speechSupported || !recognitionRef.current) {
      setErrorNotice('Speech recognition is not supported in this browser. Please type your query.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setErrorNotice(null);
      // Map language
      let langCode = 'en-US';
      if (selectedLanguage === 'urdu') langCode = 'ur-PK';
      else if (selectedLanguage === 'sindhi') langCode = 'sd-PK';

      try {
        recognitionRef.current.lang = langCode;
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.warn('Speech start error:', err);
        setIsRecording(false);
      }
    }
  };

  // Handle Text-to-Speech Read Aloud
  const handleToggleSpeak = (msgId: string, text: string, lang: AssistantLanguage) => {
    if (!('speechSynthesis' in window)) {
      setErrorNotice('Text-to-speech audio playback is not supported in this browser.');
      return;
    }

    if (speakingMessageId === msgId) {
      if (isSpeechPaused) {
        window.speechSynthesis.resume();
        setIsSpeechPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsSpeechPaused(true);
      }
      return;
    }

    window.speechSynthesis.cancel();

    // Clean markdown symbols for natural reading
    const cleanSpeechText = text
      .replace(/[*_#`$]/g, '')
      .replace(/\n+/g, '. ')
      .slice(0, 800);

    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    if (lang === 'urdu') {
      const urduVoice = voices.find((v) => v.lang.startsWith('ur'));
      if (urduVoice) utterance.voice = urduVoice;
      else utterance.lang = 'ur-PK';
    } else if (lang === 'sindhi') {
      const sindhiVoice = voices.find((v) => v.lang.startsWith('sd'));
      if (sindhiVoice) utterance.voice = sindhiVoice;
      else {
        // Fallback to Urdu/Hindi voice if Sindhi TTS engine is uninstalled on device OS
        const fallbackVoice = voices.find((v) => v.lang.startsWith('ur') || v.lang.startsWith('hi'));
        if (fallbackVoice) utterance.voice = fallbackVoice;
        utterance.lang = 'sd-PK';
      }
    } else {
      const enVoice = voices.find((v) => v.lang.startsWith('en'));
      if (enVoice) utterance.voice = enVoice;
      else utterance.lang = 'en-US';
    }

    utterance.onend = () => {
      setSpeakingMessageId(null);
      setIsSpeechPaused(false);
    };

    utterance.onerror = () => {
      setSpeakingMessageId(null);
      setIsSpeechPaused(false);
    };

    setSpeakingMessageId(msgId);
    setIsSpeechPaused(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleStopSpeech = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
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

  // Send Question to Backend AI
  const handleSendMessage = async (customPrompt?: string) => {
    const promptToSend = (customPrompt || userInput).trim();
    if (!promptToSend && !attachedImage) return;

    setErrorNotice(null);
    setIsLoading(true);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: promptToSend || 'Explain the questions on this textbook page image.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language: selectedLanguage,
      imageBase64: attachedImage || undefined,
      bookContext: {
        classNumber: selectedClass || undefined,
        subjectName: currentSelectedBook?.subjectName,
        bookTitle: currentSelectedBook?.title,
        chapter: chapterInput.trim() || undefined,
        exercise: exerciseInput.trim() || undefined,
        pageNumber: pageInput ? parseInt(pageInput, 10) : undefined,
        questionNumber: questionInput.trim() || undefined,
      },
    };

    setMessages((prev) => [...prev, userMsg]);
    setUserInput('');
    const currentAttachment = attachedImage;
    setAttachedImage(null);
    setImageFileName(null);

    try {
      const response = await fetch('/api/ai/study-assist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: promptToSend,
          language: selectedLanguage,
          mode: exerciseInput ? 'solve-exercise' : 'general',
          bookContext: userMsg.bookContext,
          imageBase64: currentAttachment,
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
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('AI Request Failed:', err);
      setErrorNotice(err.message || 'Unable to connect to AI Study Assistant. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleNewChat = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeakingMessageId(null);
    setMessages([]);
    setUserInput('');
    setAttachedImage(null);
    setErrorNotice(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] min-h-[550px] max-w-5xl mx-auto bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden mb-8">
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
                Universal STBB Tutor
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Classes 1–12 • Every Subject • Math, Science, Languages & Exercises
            </p>
          </div>
        </div>

        {/* Right: Language Selector & New Chat */}
        <div className="flex items-center gap-2">
          {/* Trilingual Language Selector */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <Languages className="w-3.5 h-3.5 text-amber-400 ml-1 mr-1.5" />
            <button
              onClick={() => setSelectedLanguage('english')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                selectedLanguage === 'english'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setSelectedLanguage('urdu')}
              className={`px-2.5 py-1 rounded-lg transition font-sans cursor-pointer ${
                selectedLanguage === 'urdu'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              اردو
            </button>
            <button
              onClick={() => setSelectedLanguage('sindhi')}
              className={`px-2.5 py-1 rounded-lg transition font-sans cursor-pointer ${
                selectedLanguage === 'sindhi'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              سنڌي
            </button>
          </div>

          <button
            onClick={handleNewChat}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title="Start New Chat"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Textbook Context Bar (Class, Subject, Exercise Locator) */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          {/* Class Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
            <select
              value={selectedClass || ''}
              onChange={(e) => {
                const val = e.target.value ? parseInt(e.target.value, 10) : null;
                setSelectedClass(val);
                setSelectedBookId('');
              }}
              className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
            >
              {CLASSES_LIST.map((c) => (
                <option key={c.classNumber} value={c.classNumber} className="bg-slate-900 text-white">
                  Class {c.classNumber} ({c.level})
                </option>
              ))}
            </select>
          </div>

          {/* Book / Subject Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 max-w-[200px] sm:max-w-[280px]">
            <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <select
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer truncate w-full"
            >
              <option value="" className="bg-slate-900 text-slate-400">
                All Subjects in Class {selectedClass}
              </option>
              {availableBooks.map((book) => (
                <option key={book.id} value={book.id} className="bg-slate-900 text-white">
                  {book.title} ({book.medium} Medium)
                </option>
              ))}
            </select>
          </div>

          {/* Quick toggle for detailed exercise fields */}
          <button
            onClick={() => setShowAdvancedLocator(!showAdvancedLocator)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
              showAdvancedLocator || exerciseInput || chapterInput
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>{showAdvancedLocator ? 'Hide Chapter / Exercise' : 'Specify Exercise & Page'}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showAdvancedLocator ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {currentSelectedBook && onOpenBookReader && (
          <button
            onClick={() => onOpenBookReader(currentSelectedBook, pageInput ? parseInt(pageInput, 10) : 1)}
            className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-bold transition cursor-pointer"
          >
            <span>Open in Reader</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Collapsible Advanced Locator Bar (Chapter, Exercise, Page, Question) */}
      {showAdvancedLocator && (
        <div className="bg-slate-950 border-b border-slate-800 p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs shrink-0 animate-in slide-in-from-top-2 duration-150">
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">
              Chapter / Unit:
            </label>
            <input
              type="text"
              placeholder="e.g. Sets and Functions"
              value={chapterInput}
              onChange={(e) => setChapterInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-500 text-xs focus:ring-1 focus:ring-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">
              Exercise Number:
            </label>
            <input
              type="text"
              placeholder="e.g. 9.1 or Review Exercise"
              value={exerciseInput}
              onChange={(e) => setExerciseInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-500 text-xs focus:ring-1 focus:ring-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">
              Printed Page Number:
            </label>
            <input
              type="number"
              placeholder="e.g. 120"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-500 text-xs focus:ring-1 focus:ring-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">
              Question Number:
            </label>
            <input
              type="text"
              placeholder="e.g. Q3 or All"
              value={questionInput}
              onChange={(e) => setQuestionInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-500 text-xs focus:ring-1 focus:ring-amber-400 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Main Conversation Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin">
        {messages.map((msg) => {
          const isAssistant = msg.role === 'assistant';
          const isSpeaking = speakingMessageId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
            >
              <div
                className={`max-w-[90%] sm:max-w-[82%] rounded-2xl p-4 sm:p-5 shadow-lg space-y-3 leading-relaxed text-sm ${
                  isAssistant
                    ? 'bg-slate-800 text-slate-100 border border-slate-700/80 rounded-tl-sm'
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

                {/* Message Body with Markdown-Friendly Whitespace */}
                <div
                  className={`whitespace-pre-wrap break-words leading-relaxed ${
                    msg.language === 'urdu' || msg.language === 'sindhi'
                      ? 'text-right font-sans text-base leading-loose'
                      : ''
                  }`}
                  dir={msg.language === 'urdu' || msg.language === 'sindhi' ? 'rtl' : 'ltr'}
                >
                  {msg.content}
                </div>

                {/* Assistant Controls Bar: Read Aloud, Copy, Timestamp */}
                {isAssistant && (
                  <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleSpeak(msg.id, msg.content, msg.language)}
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
                        onClick={() => handleCopyText(msg.id, msg.content)}
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

              {/* Follow-up Chips for Easy Learning */}
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

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start">
            <div className="max-w-[75%] rounded-2xl rounded-tl-sm p-4 bg-slate-800 border border-slate-700 text-slate-300 text-sm flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
              <div>
                <p className="font-bold text-white text-xs">Analyzing Sindh Textbook Board Curriculum...</p>
                <p className="text-[11px] text-slate-400">Solving with step-by-step verified explanations</p>
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

          {/* Text Input Field */}
          <div className="relative flex-1">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={
                selectedLanguage === 'urdu'
                  ? 'اپنا سوال یا مشق یہاں لکھیے (مثلاً: کلاس 11 میتھ مشق 9.1 سوال 3 حل کریں)...'
                  : selectedLanguage === 'sindhi'
                  ? 'پنهنجو درسي سوال هتي لکو (مثال: ڪلاس 8 سنڌي سبق 4 سوال 3 سمجهايو)...'
                  : 'Ask any textbook question, exercise, concept, or word (e.g. Class 11 Maths Ex 9.1)...'
              }
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
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

        {/* Quick Suggestion Prompts */}
        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs text-slate-400 scrollbar-none">
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
      </div>
    </div>
  );
};
