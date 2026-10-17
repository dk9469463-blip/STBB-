import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  Check,
  Copy,
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
import { saveReadingProgress } from '../utils/readingProgress';
import { useAppPreferences } from '../utils/appPreferences';
import { getOfflineBookBlob } from '../utils/offlineBooks';

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
  const [usingOfflineCopy, setUsingOfflineCopy] = useState(false);
  const { preferences } = useAppPreferences();

  // In-Reader AI Side Panel State
  const [isAiPanelOpen, setIsAiPanelOpen] = useState<boolean>(false);
  const [selectedReaderText, setSelectedReaderText] = useState<string>('');
  const [floatingSelection, setFloatingSelection] = useState<{
    text: string;
    pageNumber: number;
    clientX: number;
    clientY: number;
  } | null>(null);
  const [copiedSelectionText, setCopiedSelectionText] = useState<boolean>(false);

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

  // PDF.js document reference & lifecycle guards.
  // A loading task is cancelled whenever another book replaces the current one.
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const pdfLoadingTaskRef = useRef<ReturnType<typeof pdfjsLib.getDocument> | null>(null);
  const loadRequestIdRef = useRef(0);
  const pageJumpTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const offlineObjectUrlRef = useRef<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isProgrammaticScrollRef = useRef<boolean>(false);

  // Lower rendering resolution for slow connections; settings persist across books.
  useEffect(() => {
    if (!book) return;
    setScale(
      preferences.lowDataMode
        ? (window.innerWidth < 640 ? 0.7 : 0.9)
        : (window.innerWidth < 640 ? 0.9 : 1.25)
    );
  }, [book?.id, preferences.lowDataMode]);

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
      // Invalidate callbacks before cancelling so an old book cannot update the
      // loading percentage, error state, or document shown for the next book.
      loadRequestIdRef.current += 1;

      if (pageJumpTimeoutRef.current !== null) {
        clearTimeout(pageJumpTimeoutRef.current);
        pageJumpTimeoutRef.current = null;
      }

      document.body.style.overflow = 'auto';

      const loadingTask = pdfLoadingTaskRef.current;
      const currentDocument = pdfDocRef.current;
      const offlineObjectUrl = offlineObjectUrlRef.current;
      pdfLoadingTaskRef.current = null;
      pdfDocRef.current = null;
      offlineObjectUrlRef.current = null;

      if (loadingTask) {
        void loadingTask.destroy().catch(() => {
          // Cancellation during book switching is expected.
        }).finally(() => {
          if (offlineObjectUrl) URL.revokeObjectURL(offlineObjectUrl);
        });
      } else if (currentDocument) {
        const destroyDocument = (
          currentDocument as pdfjsLib.PDFDocumentProxy & {
            destroy?: () => Promise<void> | void;
          }
        ).destroy;

        if (typeof destroyDocument === 'function') {
          void Promise.resolve(destroyDocument.call(currentDocument)).catch(() => {
            // The document may already have been closed by PDF.js.
          }).finally(() => {
            if (offlineObjectUrl) URL.revokeObjectURL(offlineObjectUrl);
          });
        } else if (offlineObjectUrl) {
          URL.revokeObjectURL(offlineObjectUrl);
        }
      } else if (offlineObjectUrl) {
        URL.revokeObjectURL(offlineObjectUrl);
      }
    };
  }, [book, initialPageNumber]);

  // 2. Load PDF document using streaming byte-range endpoint.
  // Each request gets a generation ID; progress/errors from old books are ignored.
  const loadPdfDocument = async () => {
    if (!book) return;

    const loadId = ++loadRequestIdRef.current;
    const previousTask = pdfLoadingTaskRef.current;
    const previousDocument = pdfDocRef.current;
    const previousOfflineUrl = offlineObjectUrlRef.current;
    pdfLoadingTaskRef.current = null;
    pdfDocRef.current = null;
    offlineObjectUrlRef.current = null;

    if (previousTask) {
      void previousTask.destroy().catch(() => {
        // Replacing a loading textbook is expected cancellation.
      }).finally(() => {
        if (previousOfflineUrl) URL.revokeObjectURL(previousOfflineUrl);
      });
    } else if (previousDocument) {
      const destroyDocument = (
        previousDocument as pdfjsLib.PDFDocumentProxy & {
          destroy?: () => Promise<void> | void;
        }
      ).destroy;

      if (typeof destroyDocument === 'function') {
        void Promise.resolve(destroyDocument.call(previousDocument)).catch(() => {
          // Ignore repeated cleanup if PDF.js already closed the document.
        }).finally(() => {
          if (previousOfflineUrl) URL.revokeObjectURL(previousOfflineUrl);
        });
      } else if (previousOfflineUrl) {
        URL.revokeObjectURL(previousOfflineUrl);
      }
    } else if (previousOfflineUrl) {
      URL.revokeObjectURL(previousOfflineUrl);
    }

    if (pageJumpTimeoutRef.current !== null) {
      clearTimeout(pageJumpTimeoutRef.current);
      pageJumpTimeoutRef.current = null;
    }

    setIsLoadingDoc(true);
    setDocError(null);
    setErrorDetails(null);
    setLoadingPercent(null);
    setUsingOfflineCopy(false);
    setNumPages(0);
    setPageAnnotations({});
    setUndoHistory({});
    setRedoHistory({});

    const streamUrl = book.driveFileId
      ? `/api/pdf/drive-stream?id=${encodeURIComponent(book.driveFileId)}`
      : book.officialId
      ? `/api/pdf/stream?id=${encodeURIComponent(book.officialId)}`
      : `/api/pdf/stream?url=${encodeURIComponent(book.pdfUrl || '')}`;

    let loadingTask: ReturnType<typeof pdfjsLib.getDocument> | null = null;

    try {
      // Prefer the copy stored in this browser; only request the network when needed.
      const offlineBlob = await getOfflineBookBlob(book.id).catch(() => null);
      if (loadId !== loadRequestIdRef.current) return;

      let sourceUrl = streamUrl;
      if (offlineBlob) {
        sourceUrl = URL.createObjectURL(offlineBlob);
        offlineObjectUrlRef.current = sourceUrl;
        setUsingOfflineCopy(true);
        setLoadingPercent(100);
      }

      // Low-data mode keeps PDF.js on smaller byte-range requests and avoids
      // fetching unused pages; normal mode uses larger chunks to reduce round trips.
      loadingTask = pdfjsLib.getDocument({
        url: sourceUrl,
        withCredentials: false,
        cMapUrl: '/cmaps/',
        cMapPacked: true,
        disableAutoFetch: true,
        disableStream: false,
        rangeChunkSize: preferences.lowDataMode ? 64 * 1024 : 256 * 1024,
      });
      pdfLoadingTaskRef.current = loadingTask;

      loadingTask.onProgress = (progressData: { loaded: number; total: number }) => {
        if (
          loadId !== loadRequestIdRef.current ||
          pdfLoadingTaskRef.current !== loadingTask ||
          pdfDocRef.current
        ) {
          return;
        }

        if (progressData.total > 0) {
          const pct = Math.min(100, Math.round((progressData.loaded / progressData.total) * 100));
          setLoadingPercent(pct);
        }
      };

      const pdf = await loadingTask.promise;

      // The reader may have been closed or switched while the request was pending.
      if (loadId !== loadRequestIdRef.current || pdfLoadingTaskRef.current !== loadingTask) {
        await loadingTask.destroy().catch(() => {
          // Stale document cleanup is expected.
        });
        return;
      }

      pdfDocRef.current = pdf;
      setNumPages(pdf.numPages);
      setIsLoadingDoc(false);

      // Restore saved annotations only for the first pages; other pages load on demand.
      const initialMap: { [pageNum: number]: AnnotationStroke[] } = {};
      for (let p = 1; p <= Math.min(10, pdf.numPages); p++) {
        const saved = getStoredPageAnnotations(book.id, p);
        if (saved.length > 0) {
          initialMap[p] = saved;
        }
      }
      setPageAnnotations(initialMap);

      if (initialPageNumber && initialPageNumber > 1) {
        pageJumpTimeoutRef.current = setTimeout(() => {
          if (loadId !== loadRequestIdRef.current) return;
          const clamped = Math.max(1, Math.min(initialPageNumber, pdf.numPages));
          const pageEl = document.getElementById(`pdf-page-${clamped}`);
          if (pageEl && scrollContainerRef.current) {
            pageEl.scrollIntoView({ behavior: 'auto', block: 'start' });
          }
          pageJumpTimeoutRef.current = null;
        }, 400);
      }
    } catch (err: unknown) {
      // PDF.js rejects a pending promise when its loading task is cancelled.
      if (loadId !== loadRequestIdRef.current) return;

      console.error('Failed to load PDF with PDF.js:', err);
      setIsLoadingDoc(false);
      const msg = err instanceof Error ? err.message : 'Unknown loading error';
      setErrorDetails(msg);

      if (msg.includes('404')) {
        setDocError(
          `The official Sindh Textbook Board server reported that the digital PDF file for this title (${book.title}) is currently pending upload on portal.stbb.edu.pk.`
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

      if (pdfLoadingTaskRef.current === loadingTask) {
        pdfLoadingTaskRef.current = null;
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

  // Save the last page read for this book on this device.
  useEffect(() => {
    if (!book || !pdfDocRef.current || numPages < 1) return;
    saveReadingProgress(book.id, currentPage);
  }, [book, currentPage, numPages]);

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
    setFloatingSelection(null);
    setShowThumbnailsDrawer(false);
    setIsAiPanelOpen(true);
  };

  const handleAskAiAboutPage = (pageNum: number) => {
    scrollToPage(pageNum);
    setShowThumbnailsDrawer(false);
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
              onClick={() => {
                const nextOpen = !isAiPanelOpen;
                setIsAiPanelOpen(nextOpen);
                if (nextOpen) setShowThumbnailsDrawer(false);
              }}
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
            className={`${isAiPanelOpen ? 'hidden md:flex' : 'flex'} flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-2 sm:p-6 flex-col items-center relative`}
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
                  <p className="text-base font-bold text-white">
                    {usingOfflineCopy ? 'Opening Saved Offline Textbook...' : 'Loading Official STBB Textbook...'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {usingOfflineCopy ? 'Reading the copy saved on this device.' : 'Streaming verified document from Sindh Textbook Board (portal.stbb.edu.pk)'}
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
                    bookId={book.id}
                    scale={scale}
                    rotation={rotation}
                    activeTool={activeTool}
                    currentColor={currentColor}
                    strokeWidth={strokeWidth}
                    highlighterOpacity={highlighterOpacity}
                    showAnnotations={showAnnotations}
                    strokes={pageAnnotations[pageNum] !== undefined ? pageAnnotations[pageNum] : getStoredPageAnnotations(book.id, pageNum)}
                    onSaveStrokes={handleSavePageStrokes}
                    isBookmarked={bookmarks.includes(pageNum)}
                    onToggleBookmark={handleToggleBookmark}
                    isDarkMode={isDarkMode}
                    lowDataMode={preferences.lowDataMode}
                    onAskAiPage={handleAskAiAboutPage}
                    onSelectionChange={setFloatingSelection}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Portal the selection actions to <body> so modal overflow/stacking
              can never clip the toolbar or hide it behind the PDF viewer. */}
          {floatingSelection && createPortal(
            <div
              role="toolbar"
              aria-label="Selected text actions"
              onMouseDown={(event) => event.preventDefault()}
              onTouchStart={(event) => event.stopPropagation()}
              style={{
                position: 'fixed',
                left: `${Math.min(window.innerWidth - 276, Math.max(12, floatingSelection.clientX - 108))}px`,
                top: `${Math.min(window.innerHeight - 56, Math.max(12, floatingSelection.clientY - 50))}px`,
                zIndex: 240,
              }}
              className="bg-slate-950 border border-slate-600 rounded-2xl shadow-2xl p-1.5 flex items-center gap-1.5 text-xs text-white backdrop-blur-xl"
            >
              <span className="hidden sm:inline max-w-28 truncate px-2 text-[10px] text-slate-400" title={floatingSelection.text}>
                Text selected
              </span>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard?.writeText(floatingSelection.text).then(() => {
                    setCopiedSelectionText(true);
                    window.setTimeout(() => setCopiedSelectionText(false), 1600);
                  }).catch(() => {
                    setCopiedSelectionText(false);
                  });
                }}
                className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Copy selected text"
              >
                {copiedSelectionText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  // Open the book-aware in-reader assistant, prefilled with only
                  // the selected passage. It can still retrieve this book when the
                  // student chooses a whole exercise or specific-question workflow.
                  handleSelectTextOnPage(floatingSelection.text);
                  setFloatingSelection(null);
                }}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold flex items-center gap-1.5 transition cursor-pointer shadow-md"
                title="Open chatbot with only your selected text"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>Ask Chatbot</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  window.getSelection()?.removeAllRanges();
                  setFloatingSelection(null);
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Dismiss text actions"
                aria-label="Dismiss text actions"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>,
            document.body
          )}

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
