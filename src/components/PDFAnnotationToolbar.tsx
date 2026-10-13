import React, { useState } from 'react';
import {
  Pen,
  Highlighter,
  Eraser,
  MousePointer,
  RotateCcw,
  RotateCw,
  Trash2,
  Eye,
  EyeOff,
  Palette,
  Check,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { AnnotationToolType } from '../types/annotations';

interface PDFAnnotationToolbarProps {
  activeTool: AnnotationToolType;
  onSelectTool: (tool: AnnotationToolType) => void;
  currentColor: string;
  onSelectColor: (color: string) => void;
  strokeWidth: number;
  onSelectStrokeWidth: (width: number) => void;
  highlighterOpacity: number;
  onSelectHighlighterOpacity: (opacity: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClearCurrentPage: () => void;
  showAnnotations: boolean;
  onToggleShowAnnotations: () => void;
  currentPageNumber: number;
}

const COLOR_PRESETS = [
  { name: 'Black', hex: '#0f172a' },
  { name: 'Royal Blue', hex: '#2563eb' },
  { name: 'Crimson Red', hex: '#dc2626' },
  { name: 'Study Yellow', hex: '#facc15' },
  { name: 'Emerald Green', hex: '#16a34a' },
  { name: 'Purple', hex: '#9333ea' },
];

const PEN_WIDTHS = [
  { label: 'Fine', value: 2 },
  { label: 'Medium', value: 4 },
  { label: 'Broad', value: 7 },
];

const HIGHLIGHTER_WIDTHS = [
  { label: 'Slim', value: 14 },
  { label: 'Medium', value: 22 },
  { label: 'Wide', value: 32 },
];

export const PDFAnnotationToolbar: React.FC<PDFAnnotationToolbarProps> = ({
  activeTool,
  onSelectTool,
  currentColor,
  onSelectColor,
  strokeWidth,
  onSelectStrokeWidth,
  highlighterOpacity,
  onSelectHighlighterOpacity,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClearCurrentPage,
  showAnnotations,
  onToggleShowAnnotations,
  currentPageNumber,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const handleClearConfirm = () => {
    onClearCurrentPage();
    setShowConfirmClear(false);
  };

  return (
    <>
      {/* Floating Study Tools Dock */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-6 py-2 bg-slate-900 border-b border-slate-800 text-xs text-slate-200 select-none shadow-md shrink-0">
        {/* Tool Mode Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Navigate / Scroll (Hand / Pointer) */}
          <button
            onClick={() => onSelectTool('cursor')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeTool === 'cursor'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Scroll & Navigation Mode (Mouse wheel, trackpad & touch scroll freely)"
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Scroll Mode</span>
          </button>

          {/* Pen Tool */}
          <button
            onClick={() => onSelectTool('pen')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeTool === 'pen'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Pen Tool (Freehand notes & diagrams)"
          >
            <Pen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pen</span>
            {activeTool === 'pen' && (
              <span
                className="w-2 h-2 rounded-full border border-slate-900 shadow-xs"
                style={{ backgroundColor: currentColor }}
              />
            )}
          </button>

          {/* Highlighter Tool */}
          <button
            onClick={() => onSelectTool('highlighter')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeTool === 'highlighter'
                ? 'bg-yellow-400 text-slate-950 font-bold shadow-xs'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Highlighter Tool (Semi-transparent highlighting)"
          >
            <Highlighter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Highlighter</span>
            {activeTool === 'highlighter' && (
              <span
                className="w-2 h-2 rounded-full border border-slate-900 shadow-xs"
                style={{ backgroundColor: currentColor }}
              />
            )}
          </button>

          {/* Eraser Tool */}
          <button
            onClick={() => onSelectTool('eraser')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeTool === 'eraser'
                ? 'bg-rose-600 text-white font-bold shadow-xs'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Eraser Tool (Remove strokes without touching textbook text)"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Eraser</span>
          </button>
        </div>

        {/* Color and Stroke Controls (visible when pen or highlighter is active) */}
        {(activeTool === 'pen' || activeTool === 'highlighter') && (
          <div className="flex items-center gap-2 relative">
            {/* Quick Color Palette */}
            <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => onSelectColor(c.hex)}
                  className={`w-5 h-5 rounded-md transition-all cursor-pointer flex items-center justify-center ${
                    currentColor === c.hex
                      ? 'scale-115 ring-2 ring-white ring-offset-1 ring-offset-slate-900'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
                  {currentColor === c.hex && (
                    <Check
                      className={`w-3 h-3 ${
                        c.hex === '#facc15' || c.hex === '#ffffff' ? 'text-slate-900' : 'text-white'
                      }`}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Stroke Thickness Selector */}
            <div className="hidden md:flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
              {(activeTool === 'pen' ? PEN_WIDTHS : HIGHLIGHTER_WIDTHS).map((item) => (
                <button
                  key={item.label}
                  onClick={() => onSelectStrokeWidth(item.value)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer ${
                    strokeWidth === item.value
                      ? 'bg-slate-700 text-amber-300 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title={`${item.label} thickness (${item.value}px)`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Undo, Redo, Visibility, Clear Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 ml-auto">
          {/* Active Tool Badge Indicator */}
          <div className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800/70 border border-slate-700/60 text-[11px] text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {activeTool === 'cursor'
                ? 'Scrolling Active'
                : activeTool === 'pen'
                ? 'Writing Active'
                : activeTool === 'highlighter'
                ? 'Highlight Active'
                : 'Eraser Active'}
            </span>
          </div>

          {/* Undo */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 transition cursor-pointer"
            title="Undo stroke (Ctrl+Z)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Redo */}
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 transition cursor-pointer"
            title="Redo stroke (Ctrl+Y)"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* Toggle Annotation Visibility */}
          <button
            onClick={onToggleShowAnnotations}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              showAnnotations
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                : 'bg-amber-900/40 text-amber-300 border border-amber-600/50'
            }`}
            title={showAnnotations ? 'Hide annotations' : 'Show annotations'}
          >
            {showAnnotations ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>

          {/* Clear Page Annotations with confirmation */}
          <button
            onClick={() => setShowConfirmClear(true)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 transition cursor-pointer"
            title="Clear annotations on current page"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Clearing Page Annotations */}
      {showConfirmClear && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Clear Page Annotations?</h4>
                <p className="text-xs text-slate-400">
                  This will remove all pen and highlighter markings on Page {currentPageNumber}.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleClearConfirm}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer"
              >
                Clear Page
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
