import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Bookmark, Loader2, Sparkles } from 'lucide-react';
import { AnnotationStroke, AnnotationToolType } from '../types/annotations';
import { getStoredPageAnnotations } from '../utils/annotationStorage';

interface TextItemData {
  str: string;
  left: number;
  top: number;
  width: number;
  height: number;
  fontSize: number;
}

interface PDFPageItemProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  pageNumber: number;
  bookId: string;
  scale: number;
  rotation: number;
  activeTool: AnnotationToolType;
  currentColor: string;
  strokeWidth: number;
  highlighterOpacity: number;
  showAnnotations: boolean;
  strokes?: AnnotationStroke[];
  onSaveStrokes: (pageNumber: number, strokes: AnnotationStroke[]) => void;
  isBookmarked: boolean;
  onToggleBookmark: (pageNumber: number) => void;
  isDarkMode: boolean;
  lowDataMode: boolean;
  onAskAiPage?: (pageNumber: number) => void;
  onSelectionChange?: (
    selection: { text: string; pageNumber: number; clientX: number; clientY: number } | null
  ) => void;
}

export const PDFPageItem: React.FC<PDFPageItemProps> = ({
  pdfDoc,
  pageNumber,
  bookId,
  scale,
  rotation,
  activeTool,
  currentColor,
  strokeWidth,
  highlighterOpacity,
  showAnnotations,
  strokes: propStrokes,
  onSaveStrokes,
  isBookmarked,
  onToggleBookmark,
  isDarkMode,
  lowDataMode,
  onAskAiPage,
  onSelectionChange,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const annotationCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isInViewport, setIsInViewport] = useState<boolean>(false);
  const [isRendered, setIsRendered] = useState<boolean>(false);
  const [textItems, setTextItems] = useState<TextItemData[]>([]);
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number }>({
    width: 600 * scale,
    height: 850 * scale,
  });

  // Effective strokes: use props if provided, otherwise restore from persistent storage
  const strokes = propStrokes !== undefined ? propStrokes : getStoredPageAnnotations(bookId, pageNumber);

  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const currentStrokePointsRef = useRef<{ x: number; y: number }[]>([]);

  // 1. Intersection Observer for Lazy Rendering
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInViewport(true);
          } else {
            // Keep buffer of near pages, but unmount far pages to save memory
            if (Math.abs(entry.boundingClientRect.top) > window.innerHeight * 2.5) {
              setIsInViewport(false);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: '600px 0px 600px 0px',
        threshold: 0.01,
      }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, []);

  // 2. Fetch exact dimensions only for nearby pages.
  // Requesting dimensions for every page at once delayed the first visible page.
  useEffect(() => {
    if (!isInViewport) return;

    let isCancelled = false;
    pdfDoc
      .getPage(pageNumber)
      .then((page) => {
        if (isCancelled) return;
        const viewport = page.getViewport({ scale, rotation });
        setPageDimensions({ width: viewport.width, height: viewport.height });
      })
      .catch(() => {
        // A page may be cancelled if the book closes while loading.
      });

    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, pageNumber, scale, rotation, isInViewport]);

  // 3. Render PDF Page onto HTML5 Canvas & Extract Text Content
  const renderPdfCanvas = useCallback(async () => {
    if (!isInViewport || !pdfDoc) return;

    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch {
        // ignore
      }
      renderTaskRef.current = null;
    }

    try {
      const page = await pdfDoc.getPage(pageNumber);
      const canvas = pdfCanvasRef.current;
      if (!canvas) return;

      const viewport = page.getViewport({ scale, rotation });
      const pixelRatio = Math.min(window.devicePixelRatio || 1, lowDataMode ? 1 : 2);

      canvas.width = Math.floor(viewport.width * pixelRatio);
      canvas.height = Math.floor(viewport.height * pixelRatio);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const renderContext: any = {
        canvasContext: ctx,
        viewport,
      };

      const task = page.render(renderContext);
      renderTaskRef.current = task;
      await task.promise;
      setIsRendered(true);

      // Extract selectable text layer items
      try {
        const textContent = await page.getTextContent();
        const extracted: TextItemData[] = [];
        for (const item of textContent.items as any[]) {
          if (!item.str || !item.transform) continue;
          const [vx, vy] = viewport.convertToViewportPoint(item.transform[4], item.transform[5]);
          const fontSize =
            Math.sqrt(item.transform[0] * item.transform[0] + item.transform[1] * item.transform[1]) * scale;
          extracted.push({
            str: item.str,
            left: vx,
            top: vy - (item.height * scale || fontSize),
            width: item.width * scale,
            height: item.height * scale || fontSize,
            fontSize,
          });
        }
        setTextItems(extracted);
      } catch {
        // Scanned page without text layer
      }
    } catch (err: unknown) {
      if ((err as { name?: string })?.name !== 'RenderingCancelledException') {
        console.error(`Page ${pageNumber} render error:`, err);
      }
    }
  }, [isInViewport, pdfDoc, pageNumber, scale, rotation, lowDataMode]);

  useEffect(() => {
    if (isInViewport) {
      renderPdfCanvas();
    } else {
      setIsRendered(false);
    }

    return () => {
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
        renderTaskRef.current = null;
      }
    };
  }, [isInViewport, renderPdfCanvas]);

  // 4. Redraw Annotations Canvas with high-readability highlighter blending
  const redrawAnnotations = useCallback(() => {
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;

    const { width, height } = pageDimensions;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(width * pixelRatio);
    canvas.height = Math.floor(height * pixelRatio);
    canvas.style.width = `${Math.floor(width)}px`;
    canvas.style.height = `${Math.floor(height)}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!showAnnotations) return;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    // Draw all completed strokes
    strokes.forEach((stroke) => {
      if (stroke.points.length < 1) return;

      ctx.save();
      ctx.beginPath();

      if (stroke.tool === 'highlighter') {
        // Translucent multiply blend mode keeps the underlying black text perfectly readable
        ctx.globalCompositeOperation = 'multiply';
        ctx.strokeStyle = stroke.color;
        ctx.globalAlpha = stroke.opacity || highlighterOpacity || 0.35;
        ctx.lineWidth = Math.max(10, stroke.width * (scale / 1.0));
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = stroke.color;
        ctx.globalAlpha = 1.0;
        ctx.lineWidth = Math.max(1.5, stroke.width * (scale / 1.0));
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }

      const p0 = stroke.points[0];
      ctx.moveTo(p0.x * width, p0.y * height);

      for (let i = 1; i < stroke.points.length; i++) {
        const p = stroke.points[i];
        ctx.lineTo(p.x * width, p.y * height);
      }

      ctx.stroke();
      ctx.restore();
    });
  }, [strokes, pageDimensions, scale, showAnnotations, highlighterOpacity]);

  useEffect(() => {
    redrawAnnotations();
  }, [redrawAnnotations]);

  // 5. Interactive Annotation Drawing Handlers
  const getNormalizedPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    return {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeTool === 'cursor') return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    const pt = getNormalizedPoint(e);
    if (activeTool === 'eraser') {
      eraseStrokeNear(pt);
      return;
    }

    isDrawingRef.current = true;
    currentStrokePointsRef.current = [pt];
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeTool === 'cursor') return;
    const pt = getNormalizedPoint(e);

    if (activeTool === 'eraser' && (e.buttons === 1 || e.pressure > 0)) {
      eraseStrokeNear(pt);
      return;
    }

    if (!isDrawingRef.current) return;
    currentStrokePointsRef.current.push(pt);

    // Live preview on canvas
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = pageDimensions;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const pts = currentStrokePointsRef.current;
    if (pts.length < 2) return;

    ctx.save();
    ctx.beginPath();
    if (activeTool === 'highlighter') {
      ctx.globalCompositeOperation = 'multiply';
      ctx.strokeStyle = currentColor;
      ctx.globalAlpha = highlighterOpacity;
      ctx.lineWidth = Math.max(10, strokeWidth * (scale / 1.0));
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = currentColor;
      ctx.globalAlpha = 1.0;
      ctx.lineWidth = Math.max(1.5, strokeWidth * (scale / 1.0));
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    const prev = pts[pts.length - 2];
    const curr = pts[pts.length - 1];
    ctx.moveTo(prev.x * width, prev.y * height);
    ctx.lineTo(curr.x * width, curr.y * height);
    ctx.stroke();
    ctx.restore();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeTool === 'cursor') return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (currentStrokePointsRef.current.length > 0) {
      const newStroke: AnnotationStroke = {
        id: `stroke-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        tool: activeTool as 'pen' | 'highlighter',
        points: [...currentStrokePointsRef.current],
        color: currentColor,
        width: strokeWidth,
        opacity: activeTool === 'highlighter' ? highlighterOpacity : 1.0,
        createdAt: Date.now(),
      };

      onSaveStrokes(pageNumber, [...strokes, newStroke]);
      currentStrokePointsRef.current = [];
    }
  };

  // Erase only strokes on this page
  const eraseStrokeNear = (pt: { x: number; y: number }) => {
    const threshold = 0.04; // 4% radius
    let found = false;

    const filtered = strokes.filter((stroke) => {
      for (const p of stroke.points) {
        const dx = p.x - pt.x;
        const dy = (p.y - pt.y) * (pageDimensions.height / pageDimensions.width);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < threshold) {
          found = true;
          return false;
        }
      }
      return true;
    });

    if (found) {
      onSaveStrokes(pageNumber, filtered);
    }
  };

  // 6. Handle Selection and trigger floating contextual menu without automatic submission
  const handleCheckSelection = () => {
    if (activeTool !== 'cursor' || !onSelectionChange) return;

    setTimeout(() => {
      const sel = window.getSelection();
      const text = sel?.toString().trim();
      if (text && text.length >= 2 && sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          onSelectionChange({
            text,
            pageNumber,
            clientX: rect.left + rect.width / 2,
            clientY: rect.top - 8,
          });
          return;
        }
      }
      // If no valid selection, dismiss
      onSelectionChange(null);
    }, 50);
  };

  return (
    <div
      ref={containerRef}
      id={`pdf-page-${pageNumber}`}
      data-page-number={pageNumber}
      onMouseUp={handleCheckSelection}
      onTouchEnd={handleCheckSelection}
      className="relative mb-6 rounded-md shadow-xl transition-all duration-150 mx-auto group"
      style={{
        width: `${Math.floor(pageDimensions.width)}px`,
        minHeight: `${Math.floor(pageDimensions.height)}px`,
        backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
      }}
    >
      {/* Top Left: Ask AI Quick Button for this Page */}
      {onAskAiPage && (
        <button
          onClick={() => onAskAiPage(pageNumber)}
          className="absolute top-2 left-2 z-20 px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-900 border border-amber-400/30 text-amber-300 text-xs font-bold transition-all shadow-md flex items-center gap-1.5 opacity-90 hover:opacity-100 hover:scale-105 cursor-pointer backdrop-blur-xs"
          title={`Ask AI Tutor about Page ${pageNumber}`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Ask AI</span>
        </button>
      )}

      {/* Bookmark Ribbon Button */}
      <button
        onClick={() => onToggleBookmark(pageNumber)}
        className={`absolute top-2 right-2 z-20 p-1.5 rounded-lg transition-all cursor-pointer shadow-sm ${
          isBookmarked
            ? 'bg-amber-500 text-slate-950 font-bold scale-105'
            : 'bg-slate-900/70 hover:bg-slate-900 text-slate-300 opacity-0 group-hover:opacity-100'
        }`}
        title={isBookmarked ? 'Remove Bookmark' : `Bookmark Page ${pageNumber}`}
        aria-label={`Bookmark Page ${pageNumber}`}
      >
        <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
      </button>

      {/* Page Number Watermark Badge */}
      <div className="absolute bottom-2 right-2 z-10 px-2 py-0.5 rounded bg-slate-900/60 backdrop-blur-xs text-[10px] font-mono text-slate-300 pointer-events-none">
        Page {pageNumber}
      </div>

      {/* Lightweight Loading Skeleton */}
      {!isRendered && isInViewport && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/10 text-slate-400 gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <span className="text-xs font-semibold">Rendering Page {pageNumber}...</span>
        </div>
      )}

      {/* Rendered PDF Canvas */}
      <canvas
        ref={pdfCanvasRef}
        className={`block mx-auto rounded-sm ${isDarkMode ? 'invert contrast-125 brightness-95' : ''}`}
        style={{
          display: isRendered ? 'block' : 'none',
        }}
      />

      {/* Selectable Text Layer: Clearly visible blue highlight, perfectly positioned over canvas */}
      {textItems.length > 0 && activeTool === 'cursor' && (
        <div
          className="absolute inset-0 z-12 overflow-hidden pointer-events-auto select-text cursor-text"
          style={{
            userSelect: 'text',
            WebkitUserSelect: 'text',
          }}
        >
          {textItems.map((item, idx) => (
            <span
              key={idx}
              style={{
                position: 'absolute',
                left: `${item.left}px`,
                top: `${item.top}px`,
                width: `${item.width}px`,
                height: `${item.height}px`,
                fontSize: `${item.fontSize}px`,
                lineHeight: `${item.height}px`,
                color: 'transparent',
                backgroundColor: 'transparent',
              }}
              className="selection:bg-blue-500/40 selection:text-transparent"
            >
              {item.str}{' '}
            </span>
          ))}
        </div>
      )}

      {/* Drawing & Annotation Canvas Overlay */}
      <canvas
        ref={annotationCanvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`absolute inset-0 z-15 ${
          activeTool === 'cursor'
            ? 'pointer-events-none'
            : activeTool === 'eraser'
            ? 'cursor-crosshair pointer-events-auto'
            : 'cursor-crosshair pointer-events-auto touch-none'
        }`}
        style={{
          opacity: showAnnotations ? 1 : 0,
        }}
      />
    </div>
  );
};
