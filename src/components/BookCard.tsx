import React, { useState } from 'react';
import {
  BookOpen,
  Download,
  AlertCircle,
  CheckCircle2,
  Layers,
  Globe,
  Loader2,
  Check,
} from 'lucide-react';
import { Book } from '../types';
import { downloadBookDirectly, DownloadProgress } from '../utils/downloadHelper';

interface BookCardProps {
  book: Book;
  onViewBook: (book: Book) => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onViewBook }) => {
  const [imgError, setImgError] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDownloading) return;

    setIsDownloading(true);
    await downloadBookDirectly(book, (progress) => {
      setDownloadProgress(progress);
      if (progress.status === 'completed' || progress.status === 'error') {
        setTimeout(() => {
          setIsDownloading(false);
          setDownloadProgress(null);
        }, 2500);
      }
    });
  };

  return (
    <div className="group flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-xl hover:border-blue-400 transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
      {/* Front Cover Container */}
      <div className="relative aspect-[3/4] max-h-72 w-full bg-slate-900 overflow-hidden flex items-center justify-center">
        {book.coverUrl && !imgError ? (
          <img
            src={book.coverUrl}
            alt={`${book.title} official textbook cover`}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          /* Professional STBB Textbook Placeholder Cover */
          <div
            className="w-full h-full p-5 flex flex-col justify-between text-white"
            style={{
              background: `linear-gradient(135deg, #0f172a 0%, ${book.coverAccentColor || '#1e3a8a'} 60%, #172554 100%)`,
            }}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold tracking-wider text-amber-300">STBB E-BOOKS</span>
              <span className="px-2 py-0.5 rounded bg-white/20 text-white font-bold text-[10px]">
                Class {book.classNumber}
              </span>
            </div>

            <div className="my-auto py-2">
              <span className="text-[10px] uppercase tracking-wider text-amber-300/90 font-semibold block mb-1">
                {book.subjectName}
              </span>
              <h4 className="text-base font-black leading-tight line-clamp-3 text-white">
                {book.title}
              </h4>
              <p className="text-xs text-slate-300 mt-2">
                {book.medium} Medium
              </p>
            </div>

            <div className="text-[10px] text-slate-300 border-t border-white/20 pt-2 flex justify-between">
              <span>{book.editionYear}</span>
              <span>STBB Jamshoro</span>
            </div>
          </div>
        )}

        {/* Floating Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950/85 backdrop-blur-md text-white font-bold text-xs border border-white/20 shadow-xs">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            Class {book.classNumber}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold backdrop-blur-md border shadow-xs ${
              book.medium === 'Sindhi'
                ? 'bg-emerald-950/85 text-emerald-300 border-emerald-400/40'
                : book.medium === 'Urdu'
                ? 'bg-purple-950/85 text-purple-300 border-purple-400/40'
                : 'bg-blue-950/85 text-blue-200 border-blue-400/40'
            }`}
          >
            <Globe className="w-3 h-3" />
            {book.medium}
          </span>
        </div>
      </div>

      {/* Book Information Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Verified STBB Source
            </span>
            <span className="text-[10px] text-slate-500 font-semibold px-2 py-0.5 rounded-md bg-slate-100">
              {book.editionYear} Edition
            </span>
          </div>

          <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2 pt-1">
            {book.title}
          </h3>

          <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
            <span>Subject:</span>
            <strong className="text-slate-700">{book.subjectName}</strong>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-100">
          {book.isPdfAvailable && book.pdfUrl ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onViewBook(book)}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm transition-all shadow-xs hover:shadow-md cursor-pointer"
                title={`Read ${book.title} in reader`}
              >
                <BookOpen className="w-4 h-4 text-amber-300" />
                <span>View Book</span>
              </button>

              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-extrabold text-xs sm:text-sm transition-all shadow-xs hover:shadow-md cursor-pointer disabled:opacity-60"
                title={`Download official ${book.title} PDF directly (no extra tab)`}
              >
                {isDownloading ? (
                  downloadProgress?.status === 'completed' ? (
                    <Check className="w-4 h-4 text-emerald-800" />
                  ) : (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  )
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>
                  {isDownloading
                    ? downloadProgress?.status === 'completed'
                      ? 'Saved!'
                      : downloadProgress?.percent
                      ? `${downloadProgress.percent}%`
                      : 'Saving...'
                    : 'Download'}
                </span>
              </button>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Book PDF is not available yet.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
