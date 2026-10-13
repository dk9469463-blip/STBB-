import React, { useState } from 'react';
import {
  Layers,
  ArrowRight,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
} from 'lucide-react';
import { CLASSES_LIST } from '../data/stbbData';
import { ClassInfo, GradeLevel } from '../types';

interface ClassesViewProps {
  onSelectClass: (classNumber: number) => void;
  lastSelectedClass: number | null;
}

export const ClassesView: React.FC<ClassesViewProps> = ({
  onSelectClass,
  lastSelectedClass,
}) => {
  const [filterLevel, setFilterLevel] = useState<GradeLevel | 'All'>('All');

  const filteredClasses =
    filterLevel === 'All'
      ? CLASSES_LIST
      : CLASSES_LIST.filter((c) => c.level === filterLevel);

  return (
    <div className="space-y-8 pb-16">
      {/* Page Title & Intro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Sindh Textbook Board Jamshoro</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Class Library (Grade 1 to 12)
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Select any class from primary through intermediate to explore verified STBB subjects, curriculum syllabi, and official textbooks.
          </p>
        </div>

        {lastSelectedClass && (
          <button
            onClick={() => onSelectClass(lastSelectedClass)}
            className="self-start sm:self-center flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/15 border border-amber-400 text-amber-900 font-bold text-xs transition hover:bg-amber-500/25 cursor-pointer shadow-xs"
          >
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Last Visited: Class {lastSelectedClass}</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {(['All', 'Primary', 'Middle', 'Secondary (Matric)', 'Higher Secondary (Inter)'] as const).map(
          (level) => (
            <button
              key={level}
              onClick={() => setFilterLevel(level)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                filterLevel === level
                  ? 'bg-blue-700 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {level === 'All' ? 'All Classes (1-12)' : level}
            </button>
          )
        )}
      </div>

      {/* Classes Grid: 1 to 12 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredClasses.map((cls) => {
          const isLastViewed = cls.classNumber === lastSelectedClass;

          // Distinct color theme per tier
          let tierBadgeColor = 'bg-blue-100 text-blue-800 border-blue-200';
          let borderAccent = 'hover:border-blue-500';
          let iconBg = 'bg-blue-700';

          if (cls.level === 'Middle') {
            tierBadgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
            borderAccent = 'hover:border-emerald-500';
            iconBg = 'bg-emerald-700';
          } else if (cls.level === 'Secondary (Matric)') {
            tierBadgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
            borderAccent = 'hover:border-amber-500';
            iconBg = 'bg-amber-600';
          } else if (cls.level === 'Higher Secondary (Inter)') {
            tierBadgeColor = 'bg-purple-100 text-purple-800 border-purple-200';
            borderAccent = 'hover:border-purple-500';
            iconBg = 'bg-purple-700';
          }

          return (
            <div
              key={cls.classNumber}
              onClick={() => onSelectClass(cls.classNumber)}
              className={`group flex flex-col justify-between bg-white rounded-2xl border p-5 shadow-xs hover:shadow-xl transition-all duration-200 cursor-pointer transform hover:-translate-y-1 ${borderAccent} ${
                isLastViewed ? 'border-amber-400 ring-2 ring-amber-300/40 bg-amber-50/20' : 'border-slate-200'
              }`}
            >
              <div className="space-y-4">
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <div
                    className={`w-12 h-12 rounded-2xl ${iconBg} text-white flex items-center justify-center font-black text-lg shadow-md group-hover:scale-110 transition-transform`}
                  >
                    {cls.classNumber}
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${tierBadgeColor}`}
                    >
                      {cls.level}
                    </span>
                    {isLastViewed && (
                      <span className="text-[10px] text-amber-700 font-extrabold uppercase">
                        Recent
                      </span>
                    )}
                  </div>
                </div>

                {/* Class Title & Roman Numeral */}
                <div>
                  <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-700 transition-colors">
                    {cls.title}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500">
                    {cls.romanNumeral} • {cls.ageGroup}
                  </p>
                </div>

                {/* Description Tagline */}
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {cls.tagline}
                </p>

                {/* Subject Count & Verification */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    {cls.subjectsCount} Verified Subjects
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified STBB
                  </span>
                </div>
              </div>

              {/* Bottom Action Button */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-700 group-hover:text-blue-900">
                <span>Open Subject Catalog</span>
                <div className="w-7 h-7 rounded-lg bg-blue-50 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
