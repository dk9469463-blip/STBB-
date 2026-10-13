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
} from 'lucide-react';
import { CLASSES_LIST } from '../data/stbbData';

interface HomeViewProps {
  onExploreClasses: () => void;
  onSelectClass: (classNumber: number) => void;
  onGoToSearch: (initialQuery?: string) => void;
  onGoToAIAssistant: () => void;
  lastSelectedClass: number | null;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onExploreClasses,
  onSelectClass,
  onGoToSearch,
  onGoToAIAssistant,
  lastSelectedClass,
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Primary */}
          <div
            onClick={() => onSelectClass(1)}
            className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 shadow-xs hover:shadow-lg transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm mb-3 group-hover:scale-110 transition-transform">
              1 - 5
            </div>
            <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-700 transition-colors">
              Primary School
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Classes 1 to 5. Foundational literacy, numeracy, general science & mother tongue.
            </p>
            <div className="mt-4 flex items-center justify-between text-xs font-semibold text-blue-600">
              <span>Classes 1, 2, 3, 4, 5</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Middle */}
          <div
            onClick={() => onSelectClass(6)}
            className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 shadow-xs hover:shadow-lg transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm mb-3 group-hover:scale-110 transition-transform">
              6 - 8
            </div>
            <h3 className="font-bold text-slate-900 text-base group-hover:text-emerald-700 transition-colors">
              Middle School
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Classes 6 to 8. General Science, Mathematics, Computer Education, History & Geography.
            </p>
            <div className="mt-4 flex items-center justify-between text-xs font-semibold text-emerald-600">
              <span>Classes 6, 7, 8</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Secondary (Matric) */}
          <div
            onClick={() => onSelectClass(9)}
            className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 shadow-xs hover:shadow-lg transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm mb-3 group-hover:scale-110 transition-transform">
              9 - 10
            </div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-slate-900 text-base group-hover:text-amber-700 transition-colors">
                Secondary (Matric)
              </h3>
              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                BSEK
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Classes 9 & 10 (SSC I & II). Biology, Physics, Chemistry, Computer & Mathematics.
            </p>
            <div className="mt-4 flex items-center justify-between text-xs font-semibold text-amber-700">
              <span>Classes 9 & 10</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Higher Secondary (Inter) */}
          <div
            onClick={() => onSelectClass(11)}
            className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-purple-400 shadow-xs hover:shadow-lg transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm mb-3 group-hover:scale-110 transition-transform">
              11 - 12
            </div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-slate-900 text-base group-hover:text-purple-700 transition-colors">
                Higher Secondary (Inter)
              </h3>
              <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.2 rounded">
                BIEK
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Classes 11 & 12 (HSSC I & II). Pre-Medical, Pre-Engineering, ICS & Commerce faculties.
            </p>
            <div className="mt-4 flex items-center justify-between text-xs font-semibold text-purple-600">
              <span>Classes 11 & 12</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
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
