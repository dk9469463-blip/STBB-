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
} from 'lucide-react';
import { Book } from '../types';
import {
  AssistantLanguage,
  ChatMessage,
  getStoredReaderMessages,
  saveStoredReaderMessages,
  getStoredReaderChatArchive,
  archiveStoredReaderMessages,
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

interface AIReaderPanelProps {
  book: Book;
  currentPage: number;
  selectedText: string;
  onClearSelectedText: () => void;
  onClose: () => void;
  onCapturePageImage?: () => Promise<string | null>;
}

export const AIReaderPanel: React.FC<AIReaderPanelProps> = ({
  book,
  currentPage,
  selectedText,
  onClearSelectedText,
  onClose,
  onCapturePageImage,
}) => {
  const [language, setLanguage] = useState<AssistantLanguage>('english');
  const [inputQuery, setInputQuery] = useState<string>('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Speech Recognition & Playback State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognizerRef = useRef<SpeechRecognizerHandle | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isSpeechPaused, setIsSpeechPaused] = useState<boolean>(false);

  // Persistent Messages for this book reader session
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [archivedChats, setArchivedChats] = useState<ChatMessage[][]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load saved reader chat for this book from localStorage
  useEffect(() => {
    setArchivedChats(getStoredReaderChatArchive(book.id));
    const saved = getStoredReaderMessages(book.id);
    if (saved.length > 0) {
      setMessages(saved);
    } else {
      const welcome: ChatMessage = {
        id: `reader-welcome-${book.id}`,
        role: 'assistant',
        content: `I'm your AI Reader Tutor for ${book.title} (Class ${book.classNumber} ${book.subjectName}). You can highlight text on any page, click quick actions below, or ask questions directly in plain text.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: 'english',
        followUps: [
          `Explain key topics on Page ${currentPage}`,
          'Solve exercise questions on this page',
          'Create 3 practice questions',
        ],
      };
      setMessages([welcome]);
      saveStoredReaderMessages(book.id, [welcome]);
    }
  }, [book.id]);

  // When selectedText is transferred from reader text selection, pre-fill editable inputQuery
  useEffect(() => {
    if (selectedText && selectedText.trim()) {
      setInputQuery(`Explain this passage: "${selectedText.trim()}"`);
    }
  }, [selectedText]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

    const rec = createSpeechRecognizer({
      language,
      onResult: (transcript) => {
        setInputQuery((prev) => (prev ? `${prev} ${transcript}` : transcript));
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
    archiveStoredReaderMessages(book.id, messages);
    setArchivedChats(getStoredReaderChatArchive(book.id));
    stopSpeech();
    setSpeakingId(null);
    setErrorMsg(null);
    setSpeechError(null);
    setInputQuery('');
    setCapturedImage(null);

    const welcome: ChatMessage = {
      id: `reader-welcome-${Date.now()}`,
      role: 'assistant',
      content: `Started fresh session for ${book.title} (Page ${currentPage}). Ask any question or click an action below.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language,
      followUps: [`Summarize Page ${currentPage}`, 'Explain main formulas on this page'],
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

  const sendQuery = async (customPrompt?: string) => {
    const finalPrompt = (customPrompt || inputQuery).trim();
    if (!finalPrompt && !capturedImage && !selectedText) return;

    setIsGenerating(true);
    setErrorMsg(null);
    setSpeechError(null);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: finalPrompt || (selectedText ? `Explain this textbook passage:\n"${selectedText}"` : `Explain Page ${currentPage}`),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language,
      imageBase64: capturedImage || undefined,
      bookContext: {
        classNumber: book.classNumber,
        subjectName: book.subjectName,
        bookTitle: book.title,
        pageNumber: currentPage,
        selectedText: selectedText || undefined,
      },
    };

    // Append user message immediately
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    saveStoredReaderMessages(book.id, nextMessages);

    setInputQuery('');
    const currentAttachment = capturedImage;
    setCapturedImage(null);

    // Multi-turn history (excluding the current user message)
    const historyPayload = messages
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
          language,
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
        language,
        followUps: data.followUps || [],
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
        language,
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

  return (
    <aside className="w-full md:w-96 lg:w-[420px] bg-slate-900 border-l border-slate-800 flex flex-col h-full shadow-2xl z-40 animate-in slide-in-from-right duration-200">
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
          {archivedChats.length > 0 && (
            <select
              aria-label="Open previous reader chat"
              title="Open a previous conversation"
              className="max-w-28 sm:max-w-36 rounded-md border border-slate-700 bg-slate-900 px-1.5 py-1 text-[10px] text-slate-200"
              defaultValue=""
              onChange={(event) => {
                const index = Number(event.target.value);
                const archived = archivedChats[index];
                if (Number.isInteger(index) && archived?.length) {
                  archiveStoredReaderMessages(book.id, messages);
                  saveStoredReaderMessages(book.id, archived);
                  setMessages(archived);
                  setArchivedChats(getStoredReaderChatArchive(book.id));
                  event.target.value = "";
                }
              }}
            >
              <option value="">Previous chats ({archivedChats.length})</option>
              {archivedChats.map((chat, index) => (
                <option key={index} value={index}>
                  {chat.find((message) => message.role === 'user')?.content.slice(0, 32) || `Chat ${index + 1}`}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={handleNewChat}
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition cursor-pointer"
            title="Start New Chat in Reader"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Close Panel"
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
          <p className="line-clamp-2 italic bg-slate-950/50 p-1.5 rounded-lg border border-blue-900/40 text-[11px]">
            "{selectedText}"
          </p>
        </div>
      )}

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

      {/* Quick Action Chips */}
      <div className="p-2.5 border-b border-slate-800 bg-slate-900/60 flex flex-wrap gap-1.5 shrink-0">
        <button
          onClick={() => handleQuickAction('explain')}
          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-300 text-[11px] font-medium transition cursor-pointer"
        >
          💡 Explain
        </button>
        {selectedText && selectedText.split(' ').length <= 4 && (
          <button
            onClick={() => handleQuickAction('meaning')}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-300 text-[11px] font-medium transition cursor-pointer"
          >
            📖 Meaning
          </button>
        )}
        <button
          onClick={() => handleQuickAction('solve')}
          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-300 text-[11px] font-medium transition cursor-pointer"
        >
          ✏️ Solve
        </button>
        <button
          onClick={() => handleQuickAction('translate_urdu')}
          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-300 text-[11px] font-medium transition cursor-pointer"
        >
          اردو
        </button>
        <button
          onClick={() => handleQuickAction('translate_sindhi')}
          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-300 text-[11px] font-medium transition cursor-pointer"
        >
          سنڌي
        </button>
        <button
          onClick={() => handleQuickAction('mcqs')}
          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-300 text-[11px] font-medium transition cursor-pointer"
        >
          🎯 MCQs
        </button>

        {onCapturePageImage && !capturedImage && (
          <button
            onClick={handleCaptureCurrentPage}
            disabled={isCapturing}
            className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-medium transition flex items-center gap-1 cursor-pointer"
          >
            <Camera className="w-3 h-3" />
            <span>{isCapturing ? 'Snapping...' : 'Capture Page'}</span>
          </button>
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
      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs sm:text-sm scrollbar-thin">
        {messages.map((msg) => {
          const isAssistant = msg.role === 'assistant';
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
                  {msg.content}
                </div>

                {/* Toolbar for Assistant answers */}
                {isAssistant && !msg.isError && (
                  <div className="pt-1.5 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleSpeak(msg.id, msg.content)}
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
                        onClick={() => handleCopy(msg.id, msg.content)}
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
                      onClick={() => sendQuery(chip)}
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

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar with Voice Input & Edit Before Send */}
      <div className="p-2.5 bg-slate-950 border-t border-slate-800 shrink-0">
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

          {/* Editable text field */}
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder={
              language === 'urdu'
                ? 'اس صفحے یا سوال سے متعلق کچھ بھی پوچھیں...'
                : language === 'sindhi'
                ? 'هن صفحي يا درسي سوال بابت پڇو...'
                : 'Ask about this page or question...'
            }
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            dir={language === 'urdu' || language === 'sindhi' ? 'rtl' : 'ltr'}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={isGenerating || (!inputQuery.trim() && !selectedText && !capturedImage)}
            className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4 text-amber-300" />
          </button>
        </form>
      </div>
    </aside>
  );
};
