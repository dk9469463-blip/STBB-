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
  angle: number;
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
  onScannedRegionSelect?: (selection: {
    pageNumber: number;
    imageBase64: string;
    clientX: number;
    clientY: number;
  }) => void;
  enableScannedSelection?: boolean;
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
  onScannedRegionSelect,
  enableScannedSelection = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const annotationCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const selectionTimerRef = useRef<number | null>(null);

  const [isInViewport, setIsInViewport] = useState<boolean>(false);
  const [isRendered, setIsRendered] = useState<boolean>(false);
  const [textItems, setTextItems] = useState<TextItemData[]>([]);
  const [hasCheckedTextLayer, setHasCheckedTextLayer] = useState<boolean>(false);
  const [scanSelectionRect, setScanSelectionRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const scanSelectionStartRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);
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
    setHasCheckedTextLayer(false);
    setTextItems([]);
    setScanSelectionRect(null);

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
          // Multiply the PDF text transform by the actual page viewport transform.
          // This aligns selection spans with rendered pixels at different zoom levels
          // and on rotated pages instead of approximating with the zoom value alone.
          const [va, vb, vc, vd, ve, vf] = viewport.transform;
          const [ia, ib, ic, id, ie, iff] = item.transform as number[];
          const tx = [
            va * ia + vc * ib,
            vb * ia + vd * ib,
            va * ic + vc * id,
            vb * ic + vd * id,
            va * ie + vc * iff + ve,
            vb * ie + vd * iff + vf,
          ];
          const fontSize = Math.max(1, Math.hypot(tx[2], tx[3]));
          const angle = Math.atan2(tx[1], tx[0]);
          extracted.push({
            str: item.str,
            left: tx[4],
            top: tx[5] - fontSize,
            width: Math.max(1, item.width * scale),
            height: Math.max(fontSize, item.height * scale),
            fontSize,
            angle,
          });
        }
        setTextItems(extracted);
        setHasCheckedTextLayer(true);
      } catch {
        // Scanned page without text layer: enable the crop-to-text selection tool.
        setTextItems([]);
        setHasCheckedTextLayer(true);
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

  // 6. Detect native text selection reliably. Document selectionchange is
  // more dependable than mouseup alone, especially when selecting across spans,
  // using a touch screen, or moving the pointer after a drag.
  const inspectSelection = useCallback(() => {
    if (activeTool !== 'cursor' || !onSelectionChange) return;

    if (selectionTimerRef.current !== null) {
      window.clearTimeout(selectionTimerRef.current);
    }

    selectionTimerRef.current = window.setTimeout(() => {
      selectionTimerRef.current = null;
      const host = containerRef.current;
      const selection = window.getSelection();
      const text = selection?.toString().replace(/\s+/g, ' ').trim();

      if (!host || !selection || selection.rangeCount < 1) {
        onSelectionChange(null);
        return;
      }
      if (!text || text.length < 2) {
        onSelectionChange(null);
        return;
      }

      const range = selection.getRangeAt(0);
      const anchorInside = Boolean(selection.anchorNode && host.contains(selection.anchorNode));
      const focusInside = Boolean(selection.focusNode && host.contains(selection.focusNode));
      const commonAncestorInside = host.contains(range.commonAncestorContainer);
      if (!anchorInside && !focusInside && !commonAncestorInside) return;

      const rects = Array.from(range.getClientRects()).filter((rect) => rect.width > 0 && rect.height > 0);
      const rect = range.getBoundingClientRect();
      const positionRect = rect.width > 0 && rect.height > 0 ? rect : rects[rects.length - 1];
      if (!positionRect) return;

      onSelectionChange({
        text,
        pageNumber,
        clientX: positionRect.left + Math.min(positionRect.width / 2, 180),
        clientY: positionRect.top - 8,
      });
    }, 35);
  }, [activeTool, onSelectionChange, pageNumber]);

  useEffect(() => {
    const handleSelectionChange = () => inspectSelection();
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      if (selectionTimerRef.current !== null) {
        window.clearTimeout(selectionTimerRef.current);
        selectionTimerRef.current = null;
      }
    };
  }, [inspectSelection]);

  const handleCheckSelection = () => {
    inspectSelection();
  };

  // Scanned PDFs have no real text layer. Let the student drag a small rectangle
  // around the words they want; the parent crops that region and asks the AI to
  // transcribe it, instead of sending the entire page.
  const getScanPoint = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(rect.width, event.clientX - rect.left)),
      y: Math.max(0, Math.min(rect.height, event.clientY - rect.top)),
    };
  };

  const handleScanSelectionDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!onScannedRegionSelect || activeTool !== 'cursor') return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = getScanPoint(event);
    scanSelectionStartRef.current = { ...point, pointerId: event.pointerId };
    setScanSelectionRect({ left: point.x, top: point.y, width: 0, height: 0 });
  };

  const handleScanSelectionMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = scanSelectionStartRef.current;
    if (!start || start.pointerId !== event.pointerId) return;
    event.preventDefault();
    const point = getScanPoint(event);
    setScanSelectionRect({
      left: Math.min(start.x, point.x),
      top: Math.min(start.y, point.y),
      width: Math.abs(point.x - start.x),
      height: Math.abs(point.y - start.y),
    });
  };

  const handleScanSelectionUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = scanSelectionStartRef.current;
    if (!start || start.pointerId !== event.pointerId) return;
    scanSelectionStartRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer may already have been released.
    }

    const point = getScanPoint(event);
    const left = Math.min(start.x, point.x);
    const top = Math.min(start.y, point.y);
    const width = Math.abs(point.x - start.x);
    const height = Math.abs(point.y - start.y);
    const selection = { left, top, width, height };
    setScanSelectionRect(selection);

    if (width < 14 || height < 10) {
      window.setTimeout(() => setScanSelectionRect(null), 400);
      return;
    }

    const sourceCanvas = pdfCanvasRef.current;
    const canvasRect = sourceCanvas?.getBoundingClientRect();
    if (!sourceCanvas || !canvasRect || !sourceCanvas.width || !sourceCanvas.height) {
      setScanSelectionRect(null);
      return;
    }

    const scaleX = sourceCanvas.width / canvasRect.width;
    const scaleY = sourceCanvas.height / canvasRect.height;
    const sx = Math.max(0, Math.floor(left * scaleX));
    const sy = Math.max(0, Math.floor(top * scaleY));
    const sw = Math.min(sourceCanvas.width - sx, Math.ceil(width * scaleX));
    const sh = Math.min(sourceCanvas.height - sy, Math.ceil(height * scaleY));
    if (sw < 1 || sh < 1) {
      setScanSelectionRect(null);
      return;
    }

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = sw;
    cropCanvas.height = sh;
    const context = cropCanvas.getContext('2d');
    if (!context) {
      setScanSelectionRect(null);
      return;
    }

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, sw, sh);
    context.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, sw, sh);
    let imageBase64 = '';
    try {
      imageBase64 = cropCanvas.toDataURL('image/jpeg', 0.94);
    } catch {
      imageBase64 = '';
    }
    cropCanvas.width = 0;
    cropCanvas.height = 0;

    setScanSelectionRect(null);
    if (imageBase64) {
      onScannedRegionSelect?.({
        pageNumber,
        imageBase64,
        clientX: canvasRect.left + left + width / 2,
        clientY: canvasRect.top + top - 8,
      });
    }
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

      {/* Real DOM text overlay: selectable, copyable, and independent from the PDF canvas. */}
      {textItems.length > 0 && activeTool === 'cursor' && (
        <div
          className="pdf-selectable-text-layer absolute inset-0 z-[12] overflow-hidden pointer-events-auto cursor-text"
          style={{
            userSelect: 'text',
            WebkitUserSelect: 'text',
            touchAction: 'auto',
            WebkitTouchCallout: 'default',
            WebkitTapHighlightColor: 'transparent',
          }}
          aria-label={`Selectable text on page ${pageNumber}`}
        >
          {textItems.map((item, idx) => (
            <span
              key={idx}
              data-pdf-text-item="true"
              style={{
                position: 'absolute',
                display: 'block',
                left: `${item.left}px`,
                top: `${item.top}px`,
                width: `${Math.max(item.width, item.fontSize * 0.75)}px`,
                height: `${Math.max(item.height, item.fontSize)}px`,
                fontSize: `${item.fontSize}px`,
                lineHeight: `${Math.max(item.height, item.fontSize)}px`,
                whiteSpace: 'pre',
                fontFamily: 'Arial, Helvetica, sans-serif',
                color: 'rgba(0, 0, 0, 0.001)',
                backgroundColor: 'transparent',
                transform: Math.abs(item.angle) > 0.01 ? `rotate(${item.angle}rad)` : undefined,
                transformOrigin: 'left top',
                userSelect: 'text',
                WebkitUserSelect: 'text',
                WebkitTouchCallout: 'default',
              }}
              className="selection:bg-sky-500/40 selection:text-slate-900"
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

      {/* When the PDF has no selectable text, allow drag-to-select a crop for OCR. */}
            {/* Keep scanned-page selection opt-in so ordinary touch scrolling still works on phones. */}
      {hasCheckedTextLayer && textItems.length === 0 && activeTool === 'cursor' && isRendered && onScannedRegionSelect && !enableScannedSelection && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full border border-slate-400/40 bg-slate-950/80 px-3 py-1.5 text-center text-[10px] font-semibold text-slate-100 shadow-lg">
          Scanned page — tap Select Area to choose text
        </div>
      )}

{hasCheckedTextLayer && textItems.length === 0 && activeTool === 'cursor' && isRendered && onScannedRegionSelect && enableScannedSelection && (
        <div
          className="absolute inset-0 z-[18] cursor-crosshair select-none touch-none"
          style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
          onContextMenu={(event) => event.preventDefault()}
          onPointerDown={handleScanSelectionDown}
          onPointerMove={handleScanSelectionMove}
          onPointerUp={handleScanSelectionUp}
          onPointerCancel={handleScanSelectionUp}
          aria-label="Drag around text to select it for the AI chatbot"
          title="Drag around a line or word to select it for the AI chatbot"
        >
          {!scanSelectionRect && (
            <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-sky-300/70 bg-slate-950/85 px-3 py-1.5 text-[10px] font-bold text-sky-100 shadow-lg backdrop-blur">
              Drag around text to select it
            </div>
          )}
          {scanSelectionRect && (
            <div
              className="pointer-events-none absolute rounded-md border-2 border-sky-400 bg-sky-400/20 shadow-[0_0_0_9999px_rgba(2,6,23,0.12)]"
              style={{
                left: scanSelectionRect.left,
                top: scanSelectionRect.top,
                width: scanSelectionRect.width,
                height: scanSelectionRect.height,
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};
