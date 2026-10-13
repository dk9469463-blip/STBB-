import React, { useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Filter,
  Layers,
  ChevronRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { CLASSES_LIST, getSubjectsByClass } from '../data/stbbData';
import { Book, Subject, LanguageMedium } from '../types';
import { BookCard } from './BookCard';

interface SubjectListViewProps {
  classNumber: number;
  onBackToClasses: () => void;
  onViewBook: (book: Book) => void;
  onSelectAnotherClass: (classNumber: number) => void;
}

export const SubjectListView: React.FC<SubjectListViewProps> = ({
  classNumber,
  onBackToClasses,
  onViewBook,
  onSelectAnotherClass,
}) => {
  const classInfo = CLASSES_LIST.find((c) => c.classNumber === classNumber);
  const subjects = getSubjectsByClass(classNumber);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [selectedMedium, setSelectedMedium] = useState<LanguageMedium | 'All'>('All');

  // Filter subjects and books
  const activeSubjects =
    selectedSubjectId === 'all'
      ? subjects
      : subjects.filter((s) => s.id === selectedSubjectId);

  // Collect books matching filters
  const displayedBooks = activeSubjects
    .flatMap((s) => s.books)
    .filter((b) => (selectedMedium === 'All' ? true : b.medium === selectedMedium));

  return (
    <div className="space-y-8 pb-16">
      {/* Navigation Breadcrumb & Back Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <button
            onClick={onBackToClasses}
            className="flex items-center gap-1.5 font-bold text-blue-700 hover:text-blue-900 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Classes</span>
          </button>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-800">
            {classInfo?.title || `Class ${classNumber}`}
          </span>
        </div>

        {/* Quick Class Switcher */}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-slate-500 mr-1 hidden sm:inline">Jump to:</span>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
            <button
              key={num}
              onClick={() => onSelectAnotherClass(num)}
              className={`w-7 h-7 rounded-lg font-bold transition cursor-pointer ${
                num === classNumber
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
              title={`Switch to Class ${num}`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {/* Class Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-blue-900">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 font-bold text-xs border border-amber-400/30">
                {classInfo?.level || 'Sindh Curriculum'}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 text-white font-medium text-xs">
                {classInfo?.romanNumeral}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified STBB Syllabus
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {classInfo?.title} Textbooks & Syllabus
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              {classInfo?.tagline}. Official textbooks for schools and colleges accredited under Sindh educational boards.
            </p>
          </div>

          <div className="flex flex-row md:flex-col gap-2 shrink-0 text-xs sm:text-sm">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 text-center min-w-[110px]">
              <span className="block text-2xl font-black text-amber-300">
                {subjects.length}
              </span>
              <span className="text-slate-300">Prescribed Subjects</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 text-center min-w-[110px]">
              <span className="block text-2xl font-black text-white">
                {subjects.flatMap((s) => s.books).length}
              </span>
              <span className="text-slate-300">Textbooks Catalog</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Subject Selector Bar */}
      <div className="space-y-4">
        {/* Subject Pills */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-700" />
            <span>Select Subject Syllabus</span>
          </h2>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Medium:</span>
            {(['All', 'English', 'Sindhi', 'Urdu'] as const).map((med) => (
              <button
                key={med}
                onClick={() => setSelectedMedium(med)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  selectedMedium === med
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {med}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Subjects Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedSubjectId('all')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
              selectedSubjectId === 'all'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            All Subjects ({subjects.length})
          </button>

          {subjects.map((sub) => {
            const isSelected = selectedSubjectId === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => setSelectedSubjectId(sub.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-700 text-white shadow-sm font-bold'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{sub.name}</span>
                {sub.nameSindhi && (
                  <span className="opacity-75 text-[11px] font-normal">
                    ({sub.nameSindhi})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Books Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            Showing <strong>{displayedBooks.length}</strong> textbooks for{' '}
            <strong>Class {classNumber}</strong>
            {selectedMedium !== 'All' ? ` (${selectedMedium} Medium)` : ''}
          </span>
          <span className="text-xs text-slate-500">
            Source: Sindh Textbook Board Jamshoro
          </span>
        </div>

        {displayedBooks.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3 max-w-md mx-auto">
            <Info className="w-10 h-10 text-amber-500 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">
              No textbooks matching this filter
            </h3>
            <p className="text-xs text-slate-500">
              Try switching the language medium filter to All or select another subject.
            </p>
            <button
              onClick={() => {
                setSelectedSubjectId('all');
                setSelectedMedium('All');
              }}
              className="px-4 py-2 bg-blue-700 text-white rounded-xl text-xs font-semibold hover:bg-blue-800 transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedBooks.map((book) => (
              <BookCard key={book.id} book={book} onViewBook={onViewBook} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
