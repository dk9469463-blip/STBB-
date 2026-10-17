import React from 'react';
import {
  BookOpen,
  ArrowRight,
  Search,
  Sparkles,
  Layers,
  GraduationCap,
  DownloadCloud,
  Globe2,
  ShieldCheck,
  Bookmark,
  Calculator,
  MessageSquare,
  Clock3,
} from 'lucide-react';
import { CLASSES_LIST, getAllBooks } from '../data/stbbData';
import { Book } from '../types';
import { getMostRecentReadingProgress, getStoredReadingPage } from '../utils/readingProgress';
import { getRecentlyViewedBookIds } from '../utils/recentlyViewed';

interface HomeViewProps {
  onExploreClasses: () => void;
  onSelectClass: (classNumber: number) => void;
  onGoToSearch: (initialQuery?: string) => void;
  onGoToAIAssistant: () => void;
  lastSelectedClass: number | null;
  readingProgressVersion: number;
  onContinueReading: (book: Book, pageNumber: number) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onExploreClasses,
  onSelectClass,
  onGoToSearch,
  onGoToAIAssistant,
  lastSelectedClass,
  readingProgressVersion,
  onContinueReading,
}) => {
  const [searchInput, setSearchInput] = React.useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onGoToSearch(searchInput.trim());
    } else {
      onGoToSearch();
    }
  };

  const lastClassInfo = lastSelectedClass
    ? CLASSES_LIST.find((c) => c.classNumber === lastSelectedClass)
    : null;

  const [continueReadingBook, setContinueReadingBook] = React.useState<Book | null>(null);
  const [continueReadingPage, setContinueReadingPage] = React.useState(1);
  const [recentlyViewedBooks, setRecentlyViewedBooks] = React.useState<Book[]>([]);

  React.useEffect(() => {
    const allBooks = getAllBooks();
    const validBookIds = new Set(allBooks.map((book) => book.id));
    const saved = getMostRecentReadingProgress(validBookIds);
    const matchingBook = saved ? allBooks.find((book) => book.id === saved.bookId) : null;

    setContinueReadingBook(matchingBook || null);
    setContinueReadingPage(saved?.pageNumber || 1);

    const recentIds = getRecentlyViewedBookIds(validBookIds);
    setRecentlyViewedBooks(
      recentIds
        .map((id) => allBooks.find((book) => book.id === id))
        .filter((book): book is Book => Boolean(book))
        .slice(0, 4)
    );
  }, [readingProgressVersion]);

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Welcome Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-10 md:p-14 shadow-2xl border border-blue-900/60">
        {/* Decorative Golden Ambient Elements */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-80 h-80 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          {/* Official Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs sm:text-sm font-semibold tracking-wide">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Sindh Textbook Board Digital Repository</span>
          </div>

          {/* Welcome Heading & Tagline */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight text-white">
              Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-400">STBB Books</span>
            </h1>
            <p className="text-lg sm:text-2xl font-bold text-blue-100 tracking-wide">
              Every Class, Every Book, One Library.
            </p>
          </div>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            A comprehensive, modern digital library designed specifically for students and teachers across Sindh, Pakistan.
            Access 178 verified Sindh Textbook Board (Jamshoro) textbooks from Class 1 through Class 12 sourced directly from the official portal (<code className="text-amber-300 font-mono text-xs">ebooks.stbb.edu.pk</code>) in English, Sindhi, and Urdu mediums.
          </p>

          {/* Quick Hero Search Input */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col sm:flex-row gap-2 max-w-xl pt-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Class 9 Biology, Maths, Physics, Sindhi..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white/15 transition"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition shadow-lg hover:shadow-xl cursor-pointer shrink-0"
            >
              Search Books
            </button>
          </form>

          {/* Action Buttons: Explore Classes + Prominent AI Study Assistant */}
          <div className="flex flex-wrap items-center gap-3.5 pt-3">
            <button
              onClick={onExploreClasses}
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-extrabold text-base transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 cursor-pointer border border-blue-400/30"
            >
              <span>Explore Classes</span>
              <ArrowRight className="w-5 h-5 text-amber-300" />
            </button>

            {/* PROMINENT AI STUDY ASSISTANT HERO BUTTON */}
            <button
              onClick={onGoToAIAssistant}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-base transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 cursor-pointer border border-amber-300"
            >
              <Sparkles className="w-5 h-5 text-slate-950 fill-current" />
              <span>AI Study Assistant</span>
            </button>

            {lastClassInfo && (
              <button
                onClick={() => onSelectClass(lastClassInfo.classNumber)}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-amber-300 font-semibold text-sm transition border border-white/15 cursor-pointer backdrop-blur-md"
              >
                <Bookmark className="w-4 h-4 text-amber-400" />
                <span>Resume {lastClassInfo.title}</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {continueReadingBook && (
        <section className="rounded-2xl border border-blue-100 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Continue Reading</p>
              <h2 className="truncate text-base font-extrabold text-slate-900">{continueReadingBook.title}</h2>
              <p className="text-sm text-slate-500">Class {continueReadingBook.classNumber} · {continueReadingBook.subjectName} · Page {continueReadingPage}</p>
            </div>
            <button
              onClick={() => onContinueReading(continueReadingBook, continueReadingPage)}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-700 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800"
              aria-label={`Continue reading ${continueReadingBook.title} from page ${continueReadingPage}`}
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Continue</span>
            </button>
          </div>
        </section>
      )}

      {recentlyViewedBooks.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-blue-700" />
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">Recently Viewed</h2>
              <p className="text-xs text-slate-500">Quickly reopen books you visited on this device</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recentlyViewedBooks.map((book) => (
              <button
                type="button"
                key={book.id}
                onClick={() => onContinueReading(book, getStoredReadingPage(book.id) ?? 1)}
                className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-blue-300 hover:shadow-sm"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <BookOpen className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-slate-900">{book.title}</span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500">
                    Class {book.classNumber} · {book.subjectName} · {book.medium}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* AI Study Assistant Feature Banner */}
      <section
        onClick={onGoToAIAssistant}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 border border-amber-400/30 p-6 sm:p-8 text-white shadow-xl cursor-pointer hover:border-amber-400 transition-all group"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Universal STBB Educational Tutor</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-amber-300 transition-colors">
              Need help solving a textbook exercise or question?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Ask our Universal AI Assistant in <strong>English</strong>, <strong>اردو (Urdu)</strong>, or <strong>سنڌي (Sindhi)</strong>.
              Solve mathematical exercises step-by-step, explain complex science concepts, understand review questions, or upload a textbook page photo.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onGoToAIAssistant();
              }}
              className="px-6 py-3 rounded-2xl bg-amber-400 text-slate-950 font-black text-sm shadow-lg hover:bg-amber-300 transition flex items-center gap-2 cursor-pointer"
            >
              <span>Open AI Assistant</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Educational Tiers Quick Access */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Browse by Educational Stage
            </h2>
            <p className="text-sm text-slate-500">
              Curriculum organized according to Sindh School Education & Literacy Department
            </p>
          </div>
          <button
            onClick={onExploreClasses}
            className="text-sm font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
          >
            <span>View All 12 Classes</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              number: 1,
              title: 'Primary School',
              range: 'Classes 1–5',
              code: '01 — 05',
              description: 'Build strong foundations in reading, writing, numbers and discovery.',
              subjects: 'Core learning · Languages · Science',
              icon: BookOpen,
              tone: 'blue',
            },
            {
              number: 6,
              title: 'Middle School',
              range: 'Classes 6–8',
              code: '06 — 08',
              description: 'Grow subject knowledge, reasoning and independent study skills.',
              subjects: 'Maths · Science · Computer',
              icon: Layers,
              tone: 'teal',
            },
            {
              number: 9,
              title: 'Secondary School',
              range: 'Classes 9–10',
              code: '09 — 10',
              description: 'Prepare for SSC with focused study across core school subjects.',
              subjects: 'SSC · Biology · Physics · Maths',
              icon: Calculator,
              tone: 'amber',
            },
            {
              number: 11,
              title: 'Higher Secondary',
              range: 'Classes 11–12',
              code: '11 — 12',
              description: 'Continue into HSSC subjects and prepare for the next academic step.',
              subjects: 'Pre-Medical · Engineering · ICS',
              icon: GraduationCap,
              tone: 'violet',
            },
          ].map((stage) => {
            const Icon = stage.icon;
            const theme = stage.tone === 'blue'
              ? { glow: 'bg-blue-500/10', chip: 'bg-blue-50 text-blue-700 ring-blue-100', accent: 'text-blue-700', hover: 'group-hover:text-blue-700', line: 'from-blue-600 to-cyan-500' }
              : stage.tone === 'teal'
                ? { glow: 'bg-teal-500/10', chip: 'bg-teal-50 text-teal-700 ring-teal-100', accent: 'text-teal-700', hover: 'group-hover:text-teal-700', line: 'from-teal-600 to-emerald-400' }
                : stage.tone === 'amber'
                  ? { glow: 'bg-amber-500/10', chip: 'bg-amber-50 text-amber-700 ring-amber-100', accent: 'text-amber-700', hover: 'group-hover:text-amber-700', line: 'from-amber-500 to-orange-400' }
                  : { glow: 'bg-violet-500/10', chip: 'bg-violet-50 text-violet-700 ring-violet-100', accent: 'text-violet-700', hover: 'group-hover:text-violet-700', line: 'from-violet-600 to-fuchsia-500' };

            return (
              <button
                key={stage.title}
                type="button"
                onClick={() => onSelectClass(stage.number)}
                aria-label={'Browse ' + stage.title + ' books'}
                className="group relative isolate min-h-64 overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 sm:p-6"
              >
                <div className={'pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full blur-2xl transition-opacity group-hover:opacity-150 ' + theme.glow} />
                <div className={'pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-70 transition-opacity group-hover:opacity-100 ' + theme.line} />
                <div className="relative flex items-start justify-between gap-3">
                  <span className={'flex h-12 w-12 items-center justify-center rounded-2xl ring-1 transition duration-300 group-hover:scale-105 ' + theme.chip}>
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="rounded-full bg-slate-50 px-3 py-1.5 text-[10px] font-extrabold tracking-widest text-slate-400 ring-1 ring-slate-100">
                    {stage.code}
                  </span>
                </div>
                <div className="relative mt-5">
                  <p className={'text-xs font-extrabold uppercase tracking-widest ' + theme.accent}>{stage.range}</p>
                  <h3 className={'mt-1 text-lg font-black tracking-tight text-slate-900 transition-colors ' + theme.hover}>{stage.title}</h3>
                  <p className="mt-2 min-h-10 text-sm leading-relaxed text-slate-500">{stage.description}</p>
                </div>
                <div className="relative mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <span className="text-[11px] font-semibold leading-relaxed text-slate-400">{stage.subjects}</span>
                  <span className={'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-50 transition duration-300 group-hover:translate-x-1 group-hover:bg-slate-900 group-hover:text-white ' + theme.accent}>
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Distinctive Features Grid */}
      <section className="bg-slate-100/80 rounded-3xl p-6 sm:p-10 border border-slate-200 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Built for Students Across Sindh
          </h2>
          <p className="text-sm text-slate-600">
            Engineered with student-first features to make studying seamless and reliable.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Verified STBB Syllabus</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Every subject and book is matched to the official syllabus published by Sindh Textbook Board Jamshoro, clearly noting SNC updates.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Globe2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Trilingual Library Support</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Textbooks available in <strong>English Medium</strong>, <strong>Sindhi Medium (سنڌي)</strong>, and <strong>Urdu Medium (اردو)</strong> wherever published.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <DownloadCloud className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">In-App Reader & Offline PWA</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Read books directly inside the embedded viewer or download official PDFs. Install to your Android or Desktop as a lightweight app.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
