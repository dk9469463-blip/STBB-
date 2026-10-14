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
  Check,
  AlertTriangle,
  Sliders,
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

const PEN_COLORS = [
  { name: 'Black', hex: '#0f172a' },
  { name: 'Royal Blue', hex: '#2563eb' },
  { name: 'Crimson Red', hex: '#dc2626' },
  { name: 'Emerald Green', hex: '#16a34a' },
  { name: 'Violet', hex: '#7c3aed' },
];

const HIGHLIGHTER_COLORS = [
  { name: 'Neon Yellow', hex: '#fde047' },
  { name: 'Mint Green', hex: '#86efac' },
  { name: 'Sky Cyan', hex: '#7dd3fc' },
  { name: 'Rose Pink', hex: '#f9a8d4' },
  { name: 'Peach Orange', hex: '#fdba74' },
  { name: 'Lavender', hex: '#d8b4fe' },
];

const PEN_WIDTHS = [
  { label: 'Fine', value: 2 },
  { label: 'Medium', value: 4 },
  { label: 'Broad', value: 7 },
];

const HIGHLIGHTER_WIDTHS = [
  { label: 'Slim', value: 16 },
  { label: 'Medium', value: 24 },
  { label: 'Wide', value: 36 },
];

const OPACITY_PRESETS = [
  { label: '25%', value: 0.25 },
  { label: '35%', value: 0.35 },
  { label: '50%', value: 0.50 },
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
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showOpacityMenu, setShowOpacityMenu] = useState(false);

  const colors = activeTool === 'highlighter' ? HIGHLIGHTER_COLORS : PEN_COLORS;

  const handleClearConfirm = () => {
    onClearCurrentPage();
    setShowConfirmClear(false);
  };

  return (
    <>
      {/* Floating Study Tools Dock */}
      <div className="flex items-center justify-between gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-200 select-none shadow-md shrink-0 overflow-x-auto scrollbar-none">
        {/* Tool Mode Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Navigate / Scroll Mode */}
          <button
            onClick={() => onSelectTool('cursor')}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer text-xs ${
              activeTool === 'cursor'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Scroll & Navigation Mode"
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Scroll</span>
          </button>

          {/* Pen Tool */}
          <button
            onClick={() => {
              onSelectTool('pen');
              if (!PEN_COLORS.some((c) => c.hex === currentColor)) {
                onSelectColor(PEN_COLORS[1].hex);
              }
            }}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer text-xs ${
              activeTool === 'pen'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Pen Tool (Freehand notes)"
          >
            <Pen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pen</span>
            {activeTool === 'pen' && (
              <span
                className="w-2 h-2 rounded-full border border-slate-900 shadow-xs ml-0.5"
                style={{ backgroundColor: currentColor }}
              />
            )}
          </button>

          {/* Highlighter Tool */}
          <button
            onClick={() => {
              onSelectTool('highlighter');
              if (!HIGHLIGHTER_COLORS.some((c) => c.hex === currentColor)) {
                onSelectColor(HIGHLIGHTER_COLORS[0].hex);
              }
            }}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer text-xs ${
              activeTool === 'highlighter'
                ? 'bg-yellow-400 text-slate-950 font-bold shadow-xs'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Highlighter Tool (Translucent study marking)"
          >
            <Highlighter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Highlighter</span>
            {activeTool === 'highlighter' && (
              <span
                className="w-2 h-2 rounded-full border border-slate-900 shadow-xs ml-0.5"
                style={{ backgroundColor: currentColor }}
              />
            )}
          </button>

          {/* Eraser Tool */}
          <button
            onClick={() => onSelectTool('eraser')}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer text-xs ${
              activeTool === 'eraser'
                ? 'bg-rose-600 text-white font-bold shadow-xs'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Eraser Tool (Delete strokes on current page)"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Eraser</span>
          </button>
        </div>

        {/* Color and Thickness Palette (when pen or highlighter is active) */}
        {(activeTool === 'pen' || activeTool === 'highlighter') && (
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Color Swatches */}
            <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 sm:p-1 rounded-lg border border-slate-700">
              {colors.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => onSelectColor(c.hex)}
                  className={`w-4 h-4 sm:w-5 sm:h-5 rounded-md transition-all cursor-pointer flex items-center justify-center ${
                    currentColor === c.hex
                      ? 'scale-110 ring-2 ring-white ring-offset-1 ring-offset-slate-900'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
                  {currentColor === c.hex && (
                    <Check
                      className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${
                        c.hex === '#fde047' || c.hex === '#86efac' || c.hex === '#f9a8d4'
                          ? 'text-slate-950'
                          : 'text-white'
                      }`}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Thickness Selector */}
            <div className="hidden md:flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
              {(activeTool === 'pen' ? PEN_WIDTHS : HIGHLIGHTER_WIDTHS).map((item) => (
                <button
                  key={item.label}
                  onClick={() => onSelectStrokeWidth(item.value)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                    strokeWidth === item.value
                      ? 'bg-slate-700 text-amber-300 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Highlighter Opacity Selector */}
            {activeTool === 'highlighter' && (
              <div className="relative">
                <button
                  onClick={() => setShowOpacityMenu(!showOpacityMenu)}
                  className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-semibold text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
                  title="Adjust Highlighter Opacity"
                >
                  <Sliders className="w-2.5 h-2.5 text-amber-400" />
                  <span>{Math.round(highlighterOpacity * 100)}%</span>
                </button>

                {showOpacityMenu && (
                  <div className="absolute top-7 left-0 z-30 bg-slate-950 border border-slate-700 rounded-lg p-1.5 shadow-xl flex gap-1">
                    {OPACITY_PRESETS.map((op) => (
                      <button
                        key={op.label}
                        onClick={() => {
                          onSelectHighlighterOpacity(op.value);
                          setShowOpacityMenu(false);
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                          highlighterOpacity === op.value
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        {op.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Controls: Undo, Redo, Eye, Clear */}
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          {/* Undo */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1 sm:p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 transition cursor-pointer"
            title="Undo stroke (Ctrl+Z)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Redo */}
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1 sm:p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 transition cursor-pointer"
            title="Redo stroke (Ctrl+Y)"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* Toggle Visibility */}
          <button
            onClick={onToggleShowAnnotations}
            className={`p-1 sm:p-1.5 rounded-lg transition cursor-pointer ${
              showAnnotations
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                : 'bg-amber-900/40 text-amber-300 border border-amber-600/50'
            }`}
            title={showAnnotations ? 'Hide annotations' : 'Show annotations'}
          >
            {showAnnotations ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>

          {/* Clear Page Annotations */}
          <button
            onClick={() => setShowConfirmClear(true)}
            className="p-1 sm:p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 transition cursor-pointer"
            title={`Clear annotations on Page ${currentPageNumber}`}
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
                <h4 className="text-sm font-bold text-white">Clear Page {currentPageNumber} Annotations?</h4>
                <p className="text-xs text-slate-400">
                  This will remove your pen and highlighter markings on Page {currentPageNumber} only. Other pages will not be affected.
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
