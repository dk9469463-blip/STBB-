import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Download,
  Maximize2,
  Minimize2,
  AlertCircle,
  Loader2,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize,
  ShieldCheck,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  Bookmark,
  Grid,
  Moon,
  Sun,
  PenTool,
  BookmarkCheck,
  Sparkles,
  Camera,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { Book } from '../types';
import { AnnotationStroke, AnnotationToolType } from '../types/annotations';
import {
  getStoredPageAnnotations,
  saveStoredPageAnnotations,
  clearStoredPageAnnotations,
  getStoredBookmarks,
  toggleStoredBookmark,
} from '../utils/annotationStorage';
import { downloadBookDirectly, DownloadProgress } from '../utils/downloadHelper';
import { PDFPageItem } from './PDFPageItem';
import { PDFAnnotationToolbar } from './PDFAnnotationToolbar';
import { AIReaderPanel } from './AIReaderPanel';

// Configure self-hosted worker from public directory
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';
}

interface PDFViewerModalProps {
  book: Book | null;
  initialPageNumber?: number;
  onClose: () => void;
  onOpenUniversalAiAssistant?: (book: Book, pageNumber?: number, text?: string) => void;
}

export const PDFViewerModal: React.FC<PDFViewerModalProps> = ({
  book,
  initialPageNumber,
  onClose,
  onOpenUniversalAiAssistant,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(initialPageNumber || 1);
  const [pageInput, setPageInput] = useState<string>((initialPageNumber || 1).toString());
  const [scale, setScale] = useState<number>(1.2);
  const [rotation, setRotation] = useState<number>(0);
  const [isLoadingDoc, setIsLoadingDoc] = useState<boolean>(true);
  const [loadingPercent, setLoadingPercent] = useState<number | null>(null);
  const [docError, setDocError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  // In-Reader AI Side Panel State
  const [isAiPanelOpen, setIsAiPanelOpen] = useState<boolean>(false);
  const [selectedReaderText, setSelectedReaderText] = useState<string>('');

  // Study workspace annotation state
  const [isStudyToolsOpen, setIsStudyToolsOpen] = useState<boolean>(false);
  const [activeTool, setActiveTool] = useState<AnnotationToolType>('cursor');
  const [currentColor, setCurrentColor] = useState<string>('#2563eb');
  const [strokeWidth, setStrokeWidth] = useState<number>(4);
  const [highlighterOpacity, setHighlighterOpacity] = useState<number>(0.35);
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true);
  const [pageAnnotations, setPageAnnotations] = useState<{ [pageNum: number]: AnnotationStroke[] }>({});
  const [undoHistory, setUndoHistory] = useState<{ [pageNum: number]: AnnotationStroke[][] }>({});
  const [redoHistory, setRedoHistory] = useState<{ [pageNum: number]: AnnotationStroke[][] }>({});

  // Bookmarks & Thumbnails Drawer
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [showThumbnailsDrawer, setShowThumbnailsDrawer] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Download state
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // PDF.js document reference & DOM container
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isProgrammaticScrollRef = useRef<boolean>(false);

  // 1. Reset & initialize when book opens
  useEffect(() => {
    const startPage = initialPageNumber || 1;
    setCurrentPage(startPage);
    setPageInput(startPage.toString());
    setNumPages(0);
    setDocError(null);
    setErrorDetails(null);
    setLoadingPercent(null);
    setScale(window.innerWidth < 640 ? 0.9 : 1.25);
    setRotation(0);
    setDownloadProgress(null);
    setIsDownloading(false);
    setActiveTool('cursor');
    setPageAnnotations({});
    setUndoHistory({});
    setRedoHistory({});
    setShowThumbnailsDrawer(false);
    setIsAiPanelOpen(false);
    setSelectedReaderText('');

    if (book) {
      document.body.style.overflow = 'hidden';
      const savedBm = getStoredBookmarks(book.id);
      setBookmarks(savedBm);
      loadPdfDocument();
    }

    return () => {
      document.body.style.overflow = 'auto';
      if (pdfDocRef.current) {
        (pdfDocRef.current as unknown as { destroy?: () => void }).destroy?.();
        pdfDocRef.current = null;
      }
    };
  }, [book, initialPageNumber]);

  // 2. Load PDF document using streaming byte-range endpoint
  const loadPdfDocument = async () => {
    if (!book) return;
    setIsLoadingDoc(true);
    setDocError(null);
    setErrorDetails(null);
    setLoadingPercent(null);

    const streamUrl = book.officialId
      ? `/api/pdf/stream?id=${encodeURIComponent(book.officialId)}`
      : `/api/pdf/stream?url=${encodeURIComponent(book.pdfUrl || '')}`;

    try {
      // Configure PDF.js for chunked range loading
      const loadingTask = pdfjsLib.getDocument({
        url: streamUrl,
        withCredentials: false,
        cMapUrl: '/cmaps/',
        cMapPacked: true,
        disableAutoFetch: true, // Prevents loading all 200MB upfront
        disableStream: false,
        rangeChunkSize: 65536,
      });

      loadingTask.onProgress = (progressData: { loaded: number; total: number }) => {
        if (progressData.total > 0) {
          const pct = Math.round((progressData.loaded / progressData.total) * 100);
          setLoadingPercent(pct);
        }
      };

      const pdf = await loadingTask.promise;
      pdfDocRef.current = pdf;
      setNumPages(pdf.numPages);
      setIsLoadingDoc(false);

      // Preload saved annotations for early pages
      const initialMap: { [pageNum: number]: AnnotationStroke[] } = {};
      for (let p = 1; p <= Math.min(10, pdf.numPages); p++) {
        const saved = getStoredPageAnnotations(book.id, p);
        if (saved.length > 0) {
          initialMap[p] = saved;
        }
      }
      setPageAnnotations(initialMap);

      if (initialPageNumber && initialPageNumber > 1) {
        setTimeout(() => {
          const clamped = Math.max(1, Math.min(initialPageNumber, pdf.numPages));
          const pageEl = document.getElementById(`pdf-page-${clamped}`);
          if (pageEl && scrollContainerRef.current) {
            pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 500);
      }
    } catch (err: unknown) {
      console.error('Failed to load PDF with PDF.js:', err);
      setIsLoadingDoc(false);
      const msg = err instanceof Error ? err.message : 'Unknown loading error';
      setErrorDetails(msg);

      if (msg.includes('404')) {
        setDocError(
          `The official Sindh Textbook Board server reported that the digital PDF file for this title (${book.title}) is currently pending upload on ebooks.stbb.edu.pk.`
        );
      } else if (msg.includes('502') || msg.includes('504')) {
        setDocError(
          'The official Sindh Textbook Board portal is temporarily taking longer to respond. Please check your network and click Retry Loading.'
        );
      } else {
        setDocError(
          `Unable to open textbook PDF: ${msg}. You may retry or visit the official Sindh Textbook Board portal.`
        );
      }
    }
  };

  // 3. Track active page during vertical scrolling
  const handleScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current) return;
    const container = scrollContainerRef.current;
    if (!container || numPages === 0) return;

    const containerTop = container.getBoundingClientRect().top;
    const containerCenter = containerTop + container.clientHeight / 2;

    let closestPage = currentPage;
    let minDistance = Infinity;

    for (let p = 1; p <= numPages; p++) {
      const pageEl = document.getElementById(`pdf-page-${p}`);
      if (pageEl) {
        const rect = pageEl.getBoundingClientRect();
        const pageCenter = rect.top + rect.height / 2;
        const dist = Math.abs(pageCenter - containerCenter);
        if (dist < minDistance) {
          minDistance = dist;
          closestPage = p;
        }
      }
    }

    if (closestPage !== currentPage) {
      setCurrentPage(closestPage);
      setPageInput(closestPage.toString());
    }
  }, [currentPage, numPages]);

  // 4. Smooth page navigation helpers
  const scrollToPage = useCallback(
    (targetPage: number) => {
      const clamped = Math.max(1, Math.min(targetPage, numPages));
      setCurrentPage(clamped);
      setPageInput(clamped.toString());

      const pageEl = document.getElementById(`pdf-page-${clamped}`);
      if (pageEl && scrollContainerRef.current) {
        isProgrammaticScrollRef.current = true;
        pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 600);
      }
    },
    [numPages]
  );

  const goToPrevPage = () => {
    if (currentPage > 1) {
      scrollToPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < numPages) {
      scrollToPage(currentPage + 1);
    }
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(pageInput, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= numPages) {
      scrollToPage(parsed);
    } else {
      setPageInput(currentPage.toString());
    }
  };

  // 5. Zoom & View Controls
  const zoomIn = () => setScale((prev) => Math.min(Number((prev + 0.25).toFixed(2)), 3.0));
  const zoomOut = () => setScale((prev) => Math.max(Number((prev - 0.25).toFixed(2)), 0.6));
  const rotateClockwise = () => setRotation((prev) => (prev + 90) % 360);

  const fitToWidth = () => {
    if (!scrollContainerRef.current || !pdfDocRef.current) return;
    pdfDocRef.current.getPage(currentPage).then((page) => {
      const viewport = page.getViewport({ scale: 1.0, rotation });
      const availableWidth = scrollContainerRef.current?.clientWidth || 800;
      const targetScale = (availableWidth - 56) / viewport.width;
      setScale(Math.max(0.65, Math.min(Number(targetScale.toFixed(2)), 2.5)));
    });
  };

  // 6. Annotation Operations
  const handleSavePageStrokes = useCallback(
    (pageNum: number, newStrokes: AnnotationStroke[]) => {
      if (!book) return;

      const currentStrokes = pageAnnotations[pageNum] || [];
      setUndoHistory((prev) => ({
        ...prev,
        [pageNum]: [...(prev[pageNum] || []), currentStrokes],
      }));
      setRedoHistory((prev) => ({
        ...prev,
        [pageNum]: [],
      }));

      setPageAnnotations((prev) => ({
        ...prev,
        [pageNum]: newStrokes,
      }));
      saveStoredPageAnnotations(book.id, pageNum, newStrokes);
    },
    [book, pageAnnotations]
  );

  const handleUndo = () => {
    if (!book) return;
    const history = undoHistory[currentPage] || [];
    if (history.length === 0) return;

    const previousState = history[history.length - 1];
    const newUndoHistory = history.slice(0, history.length - 1);
    const currentStrokes = pageAnnotations[currentPage] || [];

    setRedoHistory((prev) => ({
      ...prev,
      [currentPage]: [...(prev[currentPage] || []), currentStrokes],
    }));

    setUndoHistory((prev) => ({
      ...prev,
      [currentPage]: newUndoHistory,
    }));

    setPageAnnotations((prev) => ({
      ...prev,
      [currentPage]: previousState,
    }));
    saveStoredPageAnnotations(book.id, currentPage, previousState);
  };

  const handleRedo = () => {
    if (!book) return;
    const redos = redoHistory[currentPage] || [];
    if (redos.length === 0) return;

    const nextState = redos[redos.length - 1];
    const newRedoHistory = redos.slice(0, redos.length - 1);
    const currentStrokes = pageAnnotations[currentPage] || [];

    setUndoHistory((prev) => ({
      ...prev,
      [currentPage]: [...(prev[currentPage] || []), currentStrokes],
    }));

    setRedoHistory((prev) => ({
      ...prev,
      [currentPage]: newRedoHistory,
    }));

    setPageAnnotations((prev) => ({
      ...prev,
      [currentPage]: nextState,
    }));
    saveStoredPageAnnotations(book.id, currentPage, nextState);
  };

  const handleClearCurrentPage = () => {
    if (!book) return;
    const currentStrokes = pageAnnotations[currentPage] || [];
    if (currentStrokes.length === 0) return;

    if (!window.confirm(`Clear all drawings on Page ${currentPage}?`)) return;

    setUndoHistory((prev) => ({
      ...prev,
      [currentPage]: [...(prev[currentPage] || []), currentStrokes],
    }));
    setRedoHistory((prev) => ({
      ...prev,
      [currentPage]: [],
    }));

    setPageAnnotations((prev) => ({
      ...prev,
      [currentPage]: [],
    }));
    clearStoredPageAnnotations(book.id, currentPage);
  };

  const handleToggleBookmark = (pageNum: number) => {
    if (!book) return;
    const updated = toggleStoredBookmark(book.id, pageNum);
    setBookmarks(updated);
  };

  // 7. Page Canvas Capture for Multimodal AI OCR / Solver
  const captureCurrentPageImage = async (): Promise<string | null> => {
    const pageEl = document.getElementById(`pdf-page-${currentPage}`);
    if (!pageEl) return null;
    const canvas = pageEl.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) return null;
    try {
      return canvas.toDataURL('image/jpeg', 0.85);
    } catch {
      return null;
    }
  };

  const handleSelectTextOnPage = (text: string) => {
    setSelectedReaderText(text);
    setIsAiPanelOpen(true);
  };

  const handleAskAiAboutPage = (pageNum: number) => {
    scrollToPage(pageNum);
    setIsAiPanelOpen(true);
  };

  // 8. Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        goToNextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        goToPrevPage();
      } else if (e.key === 'Escape') {
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault();
        handleRedo();
      } else if (e.key === '+' || e.key === '=') {
        zoomIn();
      } else if (e.key === '-') {
        zoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, numPages, undoHistory, redoHistory]);

  // 9. Direct download handler
  const handleDirectDownload = async () => {
    if (!book || isDownloading) return;
    setIsDownloading(true);
    await downloadBookDirectly(book, (progress) => {
      setDownloadProgress(progress);
      if (progress.status === 'completed' || progress.status === 'error') {
        setTimeout(() => {
          setIsDownloading(false);
        }, 3000);
      }
    });
  };

  if (!book) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-0 sm:p-3 transition-all"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reader-title"
    >
      <div
        className={`flex flex-col bg-slate-900 border border-slate-700 text-white shadow-2xl overflow-hidden transition-all duration-200 w-full ${
          isFullscreen ? 'h-full max-w-full rounded-none' : 'max-w-7xl h-[96vh] rounded-2xl'
        }`}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 bg-slate-950 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-900 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0 shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-900/80 text-blue-200 border border-blue-700/50">
                  Class {book.classNumber}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {book.medium} Medium
                </span>
                <span className="text-[11px] text-slate-400 hidden md:inline truncate">
                  {book.subjectName}
                </span>
              </div>
              <h2
                id="reader-title"
                className="text-xs sm:text-sm font-extrabold text-white truncate max-w-xs sm:max-w-md lg:max-w-xl"
              >
                {book.title}
              </h2>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Ask AI Side Panel Button */}
            <button
              onClick={() => setIsAiPanelOpen(!isAiPanelOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm ${
                isAiPanelOpen
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 ring-2 ring-amber-300'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
              title="Open AI Study Assistant for this textbook"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>

            {/* Toggle Study Tools */}
            <button
              onClick={() => setIsStudyToolsOpen(!isStudyToolsOpen)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                isStudyToolsOpen
                  ? 'bg-blue-600/90 text-white shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title="Toggle Study & Annotation Toolbar"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Draw</span>
            </button>

            {/* Toggle Thumbnails Drawer */}
            <button
              onClick={() => setShowThumbnailsDrawer(!showThumbnailsDrawer)}
              className={`p-1.5 sm:p-2 rounded-xl transition cursor-pointer ${
                showThumbnailsDrawer
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title="Page Thumbnails & Bookmarks"
              aria-label="Page Thumbnails"
            >
              <Grid className="w-4 h-4" />
            </button>

            {/* Reading Mode Dark/Light */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer hidden sm:block"
              title={isDarkMode ? 'Day Reading Mode' : 'Night Reading Mode'}
              aria-label="Toggle Night Reading Mode"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Direct Download Button */}
            {book.isPdfAvailable && (
              <button
                onClick={handleDirectDownload}
                disabled={isDownloading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-extrabold text-xs sm:text-sm transition-all shadow-sm cursor-pointer disabled:opacity-60"
                title="Download verified textbook PDF directly to your device"
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">
                  {isDownloading
                    ? downloadProgress?.percent
                      ? `${downloadProgress.percent}%`
                      : 'Downloading...'
                    : 'Download'}
                </span>
              </button>
            )}

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer hidden sm:block"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-red-900/60 hover:text-red-300 text-slate-400 transition cursor-pointer"
              title="Close Reader"
              aria-label="Close Reader"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Reader Controls Toolbar */}
        {!isLoadingDoc && !docError && (
          <div className="flex items-center justify-between px-3 sm:px-6 py-2 bg-slate-900/95 border-b border-slate-800 text-xs sm:text-sm text-slate-200 overflow-x-auto gap-2 shrink-0 scrollbar-none">
            {/* Page Navigation Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={goToPrevPage}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition cursor-pointer"
                title="Previous Page (Left Arrow / PageUp)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1">
                <span className="text-slate-400 hidden xs:inline">Page</span>
                <input
                  type="text"
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  className="w-12 px-1.5 py-0.5 text-center bg-slate-800 border border-slate-700 rounded-md font-bold text-white text-xs focus:outline-none focus:border-amber-400"
                  aria-label="Current page number"
                />
                <span className="text-slate-400">/ {numPages}</span>
              </form>

              <button
                onClick={goToNextPage}
                disabled={currentPage >= numPages}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition cursor-pointer"
                title="Next Page (Right Arrow / PageDown)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Quick Bookmark Current Page */}
              <button
                onClick={() => handleToggleBookmark(currentPage)}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  bookmarks.includes(currentPage)
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
                title={bookmarks.includes(currentPage) ? 'Remove Bookmark' : 'Bookmark this page'}
              >
                <Bookmark className={`w-3.5 h-3.5 ${bookmarks.includes(currentPage) ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Zoom, Fit, and Rotate Controls */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={zoomOut}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <span className="font-mono text-xs text-amber-300 w-12 text-center">
                {Math.round(scale * 100)}%
              </span>

              <button
                onClick={zoomIn}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                onClick={fitToWidth}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition cursor-pointer"
                title="Fit to Width"
              >
                <Maximize className="w-3.5 h-3.5" />
                <span>Fit</span>
              </button>

              <button
                onClick={rotateClockwise}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                title="Rotate 90° Clockwise"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Study Workspace Annotation Toolbar */}
        {!isLoadingDoc && !docError && isStudyToolsOpen && (
          <PDFAnnotationToolbar
            activeTool={activeTool}
            onSelectTool={setActiveTool}
            currentColor={currentColor}
            onSelectColor={setCurrentColor}
            strokeWidth={strokeWidth}
            onSelectStrokeWidth={setStrokeWidth}
            highlighterOpacity={highlighterOpacity}
            onSelectHighlighterOpacity={setHighlighterOpacity}
            canUndo={(undoHistory[currentPage] || []).length > 0}
            canRedo={(redoHistory[currentPage] || []).length > 0}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onClearCurrentPage={handleClearCurrentPage}
            showAnnotations={showAnnotations}
            onToggleShowAnnotations={() => setShowAnnotations(!showAnnotations)}
            currentPageNumber={currentPage}
          />
        )}

        {/* Direct Download Progress Banner */}
        {downloadProgress && (
          <div
            className={`px-4 py-2 text-xs flex items-center justify-between border-b shrink-0 ${
              downloadProgress.status === 'error'
                ? 'bg-red-950/80 text-red-200 border-red-800'
                : downloadProgress.status === 'completed'
                ? 'bg-emerald-950/80 text-emerald-200 border-emerald-800'
                : 'bg-blue-950/80 text-blue-200 border-blue-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {downloadProgress.status === 'completed' ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : downloadProgress.status === 'error' ? (
                <AlertCircle className="w-4 h-4 text-red-400" />
              ) : (
                <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
              )}
              <span>
                {downloadProgress.status === 'completed' &&
                  `Downloaded "${downloadProgress.filename}" directly to your device.`}
                {downloadProgress.status === 'downloading' &&
                  `Downloading ${downloadProgress.filename}: ${downloadProgress.percent}%`}
                {downloadProgress.status === 'starting' &&
                  `Preparing download for ${downloadProgress.filename}...`}
                {downloadProgress.status === 'error' &&
                  `Download failed: ${downloadProgress.errorMessage || 'Please try again.'}`}
              </span>
            </div>
            {downloadProgress.status === 'downloading' && (
              <span className="font-mono text-amber-300">{downloadProgress.percent}%</span>
            )}
          </div>
        )}

        {/* Main Body Area: Thumbnails Drawer + Scrollable PDF Viewport + AI Side Panel */}
        <div className="relative flex-1 flex overflow-hidden bg-slate-950">
          {/* Slide-out Thumbnails & Bookmarks Panel */}
          {showThumbnailsDrawer && numPages > 0 && (
            <div className="w-56 sm:w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 z-30 animate-in slide-in-from-left duration-200">
              <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Pages ({numPages})
                </span>
                <button
                  onClick={() => setShowThumbnailsDrawer(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Bookmarks Section */}
              {bookmarks.length > 0 && (
                <div className="p-2 border-b border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400 px-1 mb-1 flex items-center gap-1">
                    <BookmarkCheck className="w-3 h-3 text-amber-400" />
                    <span>Bookmarked Pages</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {bookmarks.map((bm) => (
                      <button
                        key={bm}
                        onClick={() => scrollToPage(bm)}
                        className={`px-2 py-1 rounded text-xs font-bold transition cursor-pointer ${
                          currentPage === bm
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800 hover:bg-slate-700 text-amber-300'
                        }`}
                      >
                        P. {bm}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Page Grid */}
              <div className="flex-1 overflow-y-auto p-2 grid grid-cols-2 gap-2 scrollbar-thin">
                {Array.from({ length: numPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => scrollToPage(p)}
                    className={`p-2 rounded-lg border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      currentPage === p
                        ? 'border-amber-400 bg-amber-500/20 text-white font-bold ring-1 ring-amber-400'
                        : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <span className="text-xs font-mono">Page {p}</span>
                    {bookmarks.includes(p) && (
                      <Bookmark className="w-3 h-3 text-amber-400 fill-current" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Continuous Multi-Page Scroll Viewport */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-6 flex flex-col items-center select-none relative"
            style={{ scrollBehavior: 'smooth' }}
          >
            {/* Loading State */}
            {isLoadingDoc && (
              <div className="my-auto flex flex-col items-center justify-center p-8 gap-4 text-center">
                <div className="relative">
                  <Loader2 className="w-14 h-14 text-amber-400 animate-spin" />
                  {loadingPercent !== null && (
                    <span className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold text-white">
                      {loadingPercent}%
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-base font-bold text-white">Loading Official STBB Textbook...</p>
                  <p className="text-xs text-slate-400">
                    Streaming verified document from Sindh Textbook Board (ebooks.stbb.edu.pk)
                    {loadingPercent === null ? '' : ` — ${loadingPercent}% loaded`}
                  </p>
                </div>
              </div>
            )}

            {/* Error State */}
            {docError && (
              <div className="my-auto max-w-lg bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl text-center space-y-4 shadow-xl">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white">Textbook Unavailable in Reader</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{docError}</p>
                  {errorDetails && (
                    <p className="text-[11px] font-mono text-slate-400 bg-slate-950/70 p-2 rounded-md break-all">
                      {errorDetails}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 justify-center pt-2">
                  <button
                    onClick={loadPdfDocument}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry Loading
                  </button>
                  {book.isPdfAvailable && (
                    <button
                      onClick={handleDirectDownload}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Direct Download
                    </button>
                  )}
                  {book.officialPageUrl && (
                    <a
                      href={book.officialPageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> STBB Portal
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* All PDF Pages Rendered in Continuous Vertical Stack */}
            {!isLoadingDoc && !docError && pdfDocRef.current && (
              <div className="w-full flex flex-col items-center">
                {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                  <PDFPageItem
                    key={pageNum}
                    pdfDoc={pdfDocRef.current!}
                    pageNumber={pageNum}
                    scale={scale}
                    rotation={rotation}
                    activeTool={activeTool}
                    currentColor={currentColor}
                    strokeWidth={strokeWidth}
                    highlighterOpacity={highlighterOpacity}
                    showAnnotations={showAnnotations}
                    strokes={pageAnnotations[pageNum] || []}
                    onSaveStrokes={handleSavePageStrokes}
                    isBookmarked={bookmarks.includes(pageNum)}
                    onToggleBookmark={handleToggleBookmark}
                    isDarkMode={isDarkMode}
                    onAskAiPage={handleAskAiAboutPage}
                    onSelectText={handleSelectTextOnPage}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Ask AI Side Panel */}
          {isAiPanelOpen && (
            <AIReaderPanel
              book={book}
              currentPage={currentPage}
              selectedText={selectedReaderText}
              onClearSelectedText={() => setSelectedReaderText('')}
              onClose={() => setIsAiPanelOpen(false)}
              onCapturePageImage={captureCurrentPageImage}
            />
          )}
        </div>

        {/* Bottom Status Bar (Zero developer-credit text) */}
        <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 truncate">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">
              Sindh Textbook Board, Jamshoro • Verified Record #{book.officialId || 'STBB'} • Continuous Scroll Reader
            </span>
          </div>
          <span className="text-amber-400/90 font-semibold hidden sm:inline">
            STBB BOOKS • Every Class, Every Book, One Library.
          </span>
        </div>
      </div>
    </div>
  );
};
