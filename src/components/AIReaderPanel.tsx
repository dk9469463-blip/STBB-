import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Send,
  Languages,
  Copy,
  Check,
  Volume2,
  VolumeX,
  RefreshCw,
  Camera,
  BookOpen,
  HelpCircle,
  FileText,
  Lightbulb,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Book } from '../types';
import { AssistantLanguage } from './AIAssistantView';

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
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState<boolean>(false);

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
        prompt = `Solve this question with complete step-by-step method and final answer from ${book.title} (Page ${currentPage}):\n"${textContext}"`;
        break;
      case 'mcqs':
        prompt = `Create 3 exam-style multiple choice questions (MCQs) with correct answers and explanations based on this textbook section:\n"${textContext}"`;
        break;
      case 'summarize':
        prompt = `Provide a concise, easy-to-revise bullet summary of this textbook section:\n"${textContext}"`;
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
    } catch (err: any) {
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
    setAiResponse(null);

    try {
      const res = await fetch('/api/ai/study-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt || (selectedText ? `Explain this textbook selection:\n"${selectedText}"` : 'Explain this textbook page.'),
          language,
          bookContext: {
            classNumber: book.classNumber,
            subjectName: book.subjectName,
            bookTitle: book.title,
            pageNumber: currentPage,
            selectedText: selectedText || undefined,
          },
          imageBase64: capturedImage,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Server error');
      }

      const data = await res.json();
      setAiResponse(data.answer || 'No response generated.');
      setInputQuery('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to get answer from AI Assistant.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (aiResponse) {
      navigator.clipboard.writeText(aiResponse);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSpeak = () => {
    if (!('speechSynthesis' in window) || !aiResponse) return;

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const clean = aiResponse.replace(/[*_#`$]/g, '').slice(0, 600);
    const utter = new SpeechSynthesisUtterance(clean);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);

    setSpeaking(true);
    window.speechSynthesis.speak(utter);
  };

  return (
    <aside className="w-full md:w-96 lg:w-[420px] bg-slate-900 border-l border-slate-800 flex flex-col h-full shadow-2xl z-40 animate-in slide-in-from-right duration-200">
      {/* Panel Header */}
      <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-amber-500 text-white flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-1.5">
              <span>Ask AI in Reader</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {book.title} • Page {currentPage}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Language Switcher */}
      <div className="px-3 py-2 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between text-xs shrink-0">
        <span className="text-slate-400 font-medium">Response Language:</span>
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
        <div className="p-3 bg-blue-950/40 border-b border-blue-900/50 text-xs text-blue-200 shrink-0 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-amber-300">
            <span>Selected Textbook Passage:</span>
            <button
              onClick={onClearSelectedText}
              className="text-slate-400 hover:text-white underline cursor-pointer"
            >
              Clear
            </button>
          </div>
          <p className="line-clamp-3 italic bg-slate-950/50 p-2 rounded-lg border border-blue-900/40">
            "{selectedText}"
          </p>
        </div>
      )}

      {/* Captured Image Preview */}
      {capturedImage && (
        <div className="p-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <img
              src={capturedImage}
              alt="Page snapshot"
              className="w-10 h-10 object-cover rounded-md border border-slate-700"
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
      <div className="p-3 border-b border-slate-800 bg-slate-900/50 flex flex-wrap gap-1.5 shrink-0">
        <button
          onClick={() => handleQuickAction('explain')}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-300 text-xs font-medium transition cursor-pointer"
        >
          💡 Explain this
        </button>
        {selectedText && selectedText.split(' ').length <= 4 && (
          <button
            onClick={() => handleQuickAction('meaning')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-300 text-xs font-medium transition cursor-pointer"
          >
            📖 Meaning of word
          </button>
        )}
        <button
          onClick={() => handleQuickAction('solve')}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-300 text-xs font-medium transition cursor-pointer"
        >
          ✏️ Solve Question
        </button>
        <button
          onClick={() => handleQuickAction('translate_urdu')}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-300 text-xs font-medium transition cursor-pointer"
        >
          اردو ترجمہ
        </button>
        <button
          onClick={() => handleQuickAction('translate_sindhi')}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-300 text-xs font-medium transition cursor-pointer"
        >
          سنڌي ترجمو
        </button>
        <button
          onClick={() => handleQuickAction('mcqs')}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-300 text-xs font-medium transition cursor-pointer"
        >
          🎯 Create MCQs
        </button>
        <button
          onClick={() => handleQuickAction('summarize')}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-300 text-xs font-medium transition cursor-pointer"
        >
          📝 Summarize
        </button>

        {onCapturePageImage && !capturedImage && (
          <button
            onClick={handleCaptureCurrentPage}
            disabled={isCapturing}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-medium transition flex items-center gap-1 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{isCapturing ? 'Snapping...' : 'Capture Page for AI'}</span>
          </button>
        )}
      </div>

      {/* Answer Body / Content Area */}
      <div className="flex-1 overflow-y-auto p-4 text-xs sm:text-sm text-slate-200 space-y-3 scrollbar-thin">
        {isGenerating && (
          <div className="flex flex-col items-center justify-center p-8 space-y-3 text-center">
            <RefreshCw className="w-7 h-7 text-amber-400 animate-spin" />
            <p className="font-bold text-white text-xs">Consulting STBB Curriculum...</p>
            <p className="text-[11px] text-slate-400">Formulating step-by-step verified explanation</p>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs">
            {errorMsg}
          </div>
        )}

        {aiResponse && !isGenerating && (
          <div className="space-y-3">
            <div
              className={`p-4 rounded-2xl bg-slate-800/90 border border-slate-700 leading-relaxed whitespace-pre-wrap ${
                language === 'urdu' || language === 'sindhi' ? 'text-right font-sans text-base leading-loose' : ''
              }`}
              dir={language === 'urdu' || language === 'sindhi' ? 'rtl' : 'ltr'}
            >
              {aiResponse}
            </div>

            {/* Answer Toolbar */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSpeak}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    speaking ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{speaking ? 'Stop' : 'Listen'}</span>
                </button>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <span className="text-[10px] text-amber-400/80 font-mono">
                STBB AI Verified
              </span>
            </div>
          </div>
        )}

        {!isGenerating && !aiResponse && !errorMsg && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-amber-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-sm">Need help with this page?</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Select text on the page or click any of the action buttons above (Explain, Meaning, Solve Question, or Capture Page) to get instant tutoring.
            </p>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendQuery();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder={
              language === 'urdu'
                ? 'اس صفحے سے متعلق کچھ بھی پوچھیں...'
                : language === 'sindhi'
                ? 'هن صفحي بابت ڪجهه به پڇو...'
                : 'Ask a question about this page...'
            }
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            dir={language === 'urdu' || language === 'sindhi' ? 'rtl' : 'ltr'}
          />
          <button
            type="submit"
            disabled={isGenerating || (!inputQuery.trim() && !selectedText && !capturedImage)}
            className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition cursor-pointer"
          >
            <Send className="w-4 h-4 text-amber-300" />
          </button>
        </form>
      </div>
    </aside>
  );
};
