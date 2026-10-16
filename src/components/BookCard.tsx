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
  DownloadCloud,
  Trash2,
  Flag,
  HardDrive,
} from 'lucide-react';
import { Book } from '../types';
import { downloadBookDirectly, DownloadProgress } from '../utils/downloadHelper';
import { useAppPreferences } from '../utils/appPreferences';
import { saveBookForOffline, isBookSavedOffline, removeOfflineBook, OfflineSaveProgress } from '../utils/offlineBooks';

interface BookCardProps {
  book: Book;
  onViewBook: (book: Book) => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onViewBook }) => {
  const [imgError, setImgError] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSavedOffline, setIsSavedOffline] = useState(false);
  const [isSavingOffline, setIsSavingOffline] = useState(false);
  const [offlineProgress, setOfflineProgress] = useState<OfflineSaveProgress | null>(null);
  const [offlineError, setOfflineError] = useState<string | null>(null);
  const { preferences } = useAppPreferences();

  React.useEffect(() => {
    let cancelled = false;
    isBookSavedOffline(book.id)
      .then((saved) => {
        if (!cancelled) setIsSavedOffline(saved);
      })
      .catch(() => {
        if (!cancelled) setIsSavedOffline(false);
      });
    return () => {
      cancelled = true;
    };
  }, [book.id]);

  const canOpenPdf = book.isPdfAvailable && Boolean(book.driveFileId || book.officialId || book.pdfUrl);

  const handleSaveOffline = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSavingOffline || isSavedOffline) return;

    setOfflineError(null);
    setIsSavingOffline(true);
    setOfflineProgress({ loaded: 0, total: 0, percent: null, attempt: 1 });
    try {
      await saveBookForOffline(book, setOfflineProgress);
      setIsSavedOffline(true);
      setOfflineProgress({ loaded: 1, total: 1, percent: 100, attempt: 1 });
    } catch (error) {
      setOfflineError(error instanceof Error ? error.message : 'Could not save this book offline.');
    } finally {
      setIsSavingOffline(false);
    }
  };

  const handleRemoveOffline = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isSavedOffline || isSavingOffline) return;
    const confirmed = window.confirm(
      `Remove "${book.title}" from offline storage on this device?`
    );
    if (!confirmed) return;

    setOfflineError(null);
    try {
      await removeOfflineBook(book.id);
      setIsSavedOffline(false);
      setOfflineProgress(null);
    } catch (error) {
      setOfflineError(error instanceof Error ? error.message : 'Could not remove the offline copy.');
    }
  };

  const handleStudyOffline = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSavedOffline) onViewBook(book);
  };

  const handleReportBrokenBook = (e: React.MouseEvent) => {
    e.stopPropagation();
    const title = `Broken textbook: ${book.title} (Class ${book.classNumber})`;
    const body = [
      'Please check this STBB textbook in the library.',
      '',
      `Book ID: ${book.id}`,
      `Class: ${book.classNumber}`,
      `Subject: ${book.subjectName}`,
      `Medium: ${book.medium}`,
      `Official ID: ${book.officialId || 'not listed'}`,
      `PDF URL: ${book.pdfUrl || book.driveViewUrl || 'not listed'}`,
      '',
      'Problem observed:',
      '- [ ] Book does not open',
      '- [ ] Incorrect textbook',
      '- [ ] Download fails',
      '- [ ] Other',
    ].join('\\n');
    const issueUrl = `https://github.com/dk9469463-blip/STBB-/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
    window.open(issueUrl, '_blank', 'noopener,noreferrer');
  };

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
        {book.coverUrl && !imgError && !preferences.lowDataMode ? (
          <img
            src={book.coverUrl}
            alt={`${book.title} official textbook cover`}
            loading="lazy"
            data-stbb-book-cover="true"
            decoding="async"
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
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${canOpenPdf ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
              {isSavedOffline ? <HardDrive className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
              {isSavedOffline ? 'Saved Offline' : canOpenPdf ? 'PDF Listed' : 'PDF Not Listed'}
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
          {canOpenPdf ? (
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
                      ? book.driveFileId
                        ? 'Started!'
                        : 'Saved!'
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

          {isSavedOffline ? (
            <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <button
                type="button"
                onClick={handleStudyOffline}
                className="flex min-w-0 items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2.5 text-xs font-extrabold text-emerald-800 transition hover:bg-emerald-100"
                title={`Study ${book.title} from the saved offline copy`}
              >
                <BookOpen className="h-4 w-4 shrink-0" />
                <span>Study Offline</span>
              </button>
              <button
                type="button"
                onClick={handleRemoveOffline}
                disabled={isSavingOffline}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                title={`Remove ${book.title} from offline storage`}
                aria-label={`Remove ${book.title} from offline storage`}
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Remove</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSaveOffline}
              disabled={isSavingOffline || !canOpenPdf}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
              title="Save this PDF inside STBB Books for offline reading on this device"
            >
              {isSavingOffline ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <DownloadCloud className="h-4 w-4" />
              )}
              <span>
                {isSavingOffline
                  ? offlineProgress?.percent !== null && offlineProgress?.percent !== undefined
                    ? `Saving for offline… ${offlineProgress.percent}%`
                    : offlineProgress?.loaded
                      ? `Saving for offline… ${Math.ceil(offlineProgress.loaded / (1024 * 1024))} MB`
                      : 'Saving for offline…'
                  : 'Save for Offline'}
              </span>
            </button>
          )}
          {offlineError && (
            <p role="status" className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900">
              {offlineError}
            </p>
          )}
          <button
            type="button"
            onClick={handleReportBrokenBook}
            className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-blue-700"
            title="Open a prefilled report for this textbook"
          >
            <Flag className="h-3.5 w-3.5" />
            Report a broken book
          </button>
        </div>
      </div>
    </div>
  );
};
