import React from 'react';
import { BookOpen, Layers, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';
import { NavTab } from './Header';

interface FooterProps {
  onSelectTab: (tab: NavTab) => void;
  onSelectClass: (classNumber: number) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab, onSelectClass }) => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-700 text-amber-300 flex items-center justify-center font-bold text-xs shadow-sm">
                <img src="/logo.svg" alt="STBB Books" className="w-7 h-7 object-contain" />
              </div>
              <span className="text-base font-black tracking-wider text-white">
                STBB BOOKS
              </span>
            </div>
            <p className="text-xs text-amber-400 font-bold">
              Every Class, Every Book, One Library.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Official digital textbook library providing access to Sindh Textbook Board (Jamshoro) curriculum for students and educators across Sindh, Pakistan.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Navigation
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button
                  onClick={() => onSelectTab('home')}
                  className="hover:text-amber-300 transition cursor-pointer"
                >
                  Home Library
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('classes')}
                  className="hover:text-amber-300 transition cursor-pointer"
                >
                  Browse All Classes
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('ai-assistant')}
                  className="text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>AI Study Assistant</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('search')}
                  className="hover:text-amber-300 transition cursor-pointer"
                >
                  Search Syllabus & Textbooks
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('about')}
                  className="hover:text-amber-300 transition cursor-pointer"
                >
                  About Curriculum & Portal
                </button>
              </li>
            </ul>
          </div>

          {/* Educational Stages */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Educational Stages
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button
                  onClick={() => onSelectClass(1)}
                  className="hover:text-amber-300 transition cursor-pointer"
                >
                  Primary (Classes 1 - 5)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectClass(6)}
                  className="hover:text-amber-300 transition cursor-pointer"
                >
                  Middle (Classes 6 - 8)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectClass(9)}
                  className="hover:text-amber-300 transition cursor-pointer"
                >
                  Secondary Matric (Classes 9 - 10)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectClass(11)}
                  className="hover:text-amber-300 transition cursor-pointer"
                >
                  Higher Secondary Inter (Classes 11 - 12)
                </button>
              </li>
            </ul>
          </div>

          {/* Official Sindh Education Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Curriculum Source
            </h4>
            <div className="flex items-center gap-2">
              <img
                src="/government-sindh-logo.svg"
                alt="Government of Sindh"
                className="w-10 h-10 object-contain rounded-full bg-white/5 p-1"
              />
              <div className="text-xs">
                <p className="font-bold text-white">Sindh Textbook Board</p>
                <p className="text-[11px] text-emerald-400">Jamshoro, Sindh, Pakistan</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Textbooks are copyrighted by Sindh Textbook Board, Jamshoro. All digital streams are sourced directly from the official portal.
            </p>
            <a
              href="https://ebooks.stbb.edu.pk/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold"
            >
              <span>Visit ebooks.stbb.edu.pk</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Bottom Disclaimer & Copyright Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} STBB BOOKS. Non-commercial educational platform for students across Sindh.
          </p>
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Verified STBB Jamshoro Curriculum Standards</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
