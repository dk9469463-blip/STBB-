import React, { useState, useEffect } from 'react';
import {
  Search,
  BookOpen,
  Layers,
  Sparkles,
  X,
  Filter,
  CheckCircle2,
  FileQuestion,
  ArrowRight,
} from 'lucide-react';
import { searchBooksAndSubjects, CLASSES_LIST } from '../data/stbbData';
import { Book, Subject, ClassInfo } from '../types';
import { BookCard } from './BookCard';

interface SearchViewProps {
  initialQuery?: string;
  onViewBook: (book: Book) => void;
  onSelectClass: (classNumber: number) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  initialQuery = '',
  onViewBook,
  onSelectClass,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [selectedMedium, setSelectedMedium] = useState<'All' | 'English' | 'Sindhi' | 'Urdu'>('All');
  const [selectedClassFilter, setSelectedClassFilter] = useState<number | 'All'>('All');
  const [onlyAvailablePdf, setOnlyAvailablePdf] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const { books, subjects, matchedClasses } = searchBooksAndSubjects(query);

  // Apply secondary filters
  const filteredBooks = books.filter((b) => {
    if (selectedMedium !== 'All' && b.medium !== selectedMedium) return false;
    if (selectedClassFilter !== 'All' && b.classNumber !== selectedClassFilter) return false;
    if (onlyAvailablePdf && !b.isPdfAvailable) return false;
    return true;
  });

  const clearSearch = () => {
    setQuery('');
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Title & Search Bar */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Search STBB Library
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Search across Classes 1–12, subjects (Maths, Science, Biology, Sindhi, Urdu, Physics...), and textbooks.
          </p>
        </div>

        {/* Input */}
        <div className="relative max-w-3xl">
          <Search className="absolute left-4 top-4 w-5 h-5 text-blue-600" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by book name, subject, class (e.g. 'Class 9 Chemistry' or 'رياضيات')..."
            className="w-full pl-12 pr-12 py-3.5 bg-white rounded-2xl border-2 border-slate-200 text-slate-900 placeholder-slate-400 text-sm sm:text-base focus:outline-none focus:border-blue-600 shadow-xs transition"
            autoFocus
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-3.5 top-3.5 p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              title="Clear search"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-slate-500 font-medium">Popular searches:</span>
          {[
            'Class 9 Physics',
            'Class 10 Biology',
            'Class 11 Chemistry',
            'Class 1 Mathematics',
            'Sindhi Salees',
            'Pakistan Studies',
          ].map((tag) => (
            <button
              key={tag}
              onClick={() => setQuery(tag)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-100/80 rounded-2xl border border-slate-200 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-700">
          <Filter className="w-3.5 h-3.5 text-blue-700" />
          <span>Filters:</span>
        </div>

        {/* Class Filter */}
        <select
          value={selectedClassFilter}
          onChange={(e) =>
            setSelectedClassFilter(e.target.value === 'All' ? 'All' : Number(e.target.value))
          }
          className="bg-white px-3 py-1.5 rounded-xl border border-slate-300 font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
        >
          <option value="All">All Classes (1-12)</option>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
            <option key={num} value={num}>
              Class {num}
            </option>
          ))}
        </select>

        {/* Medium Filter */}
        <div className="flex items-center gap-1">
          {(['All', 'English', 'Sindhi', 'Urdu'] as const).map((med) => (
            <button
              key={med}
              onClick={() => setSelectedMedium(med)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                selectedMedium === med
                  ? 'bg-blue-700 text-white'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {med}
            </button>
          ))}
        </div>

        {/* Availability Toggle */}
        <label className="flex items-center gap-1.5 ml-auto cursor-pointer font-medium text-slate-700">
          <input
            type="checkbox"
            checked={onlyAvailablePdf}
            onChange={(e) => setOnlyAvailablePdf(e.target.checked)}
            className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
          />
          <span>Only Available PDFs</span>
        </label>
      </div>

      {/* Matched Classes shortcuts if user query looks like a class or subject */}
      {matchedClasses.length > 0 && query.trim() !== '' && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Matching Classes
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {matchedClasses.map((cls) => (
              <button
                key={cls.classNumber}
                onClick={() => onSelectClass(cls.classNumber)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-900 text-xs font-bold transition cursor-pointer"
              >
                <span>{cls.title}</span>
                <span className="text-blue-600">({cls.level})</span>
                <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            {query.trim() === '' ? (
              <>Showing all <strong>{filteredBooks.length}</strong> textbooks across syllabus</>
            ) : (
              <>
                Found <strong>{filteredBooks.length}</strong> textbooks matching "{query}"
              </>
            )}
          </span>
        </div>

        {filteredBooks.length === 0 ? (
          /* Empty state message as strictly requested by user */
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <FileQuestion className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900">
                No matching textbooks found
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                We couldn't find any books matching "{query}". Check your spelling or try searching by class number (e.g. "Class 9") or subject name.
              </p>
            </div>
            <button
              onClick={() => {
                setQuery('');
                setSelectedMedium('All');
                setSelectedClassFilter('All');
                setOnlyAvailablePdf(false);
              }}
              className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map((book) => (
              <BookCard key={book.id} book={book} onViewBook={onViewBook} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
