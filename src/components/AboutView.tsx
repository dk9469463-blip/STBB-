import React from 'react';
import {
  BookOpen,
  Sparkles,
  School,
  Database,
  ShieldCheck,
  Globe2,
  ExternalLink,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

export const AboutView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-16">
      {/* Hero Header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-950 text-amber-300 p-3 mx-auto flex items-center justify-center shadow-xl border border-amber-400/30">
          <BookOpen className="w-9 h-9" />
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            About STBB Books
          </h1>
          <p className="text-base font-semibold text-amber-600">
            Every Class, Every Book, One Library.
          </p>
        </div>
      </div>

      {/* Project Mission Quote */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-10 shadow-xl border border-blue-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-300">
              Project Statement
            </span>
            <blockquote className="text-lg sm:text-xl md:text-2xl font-bold text-blue-50 leading-relaxed italic border-l-4 border-amber-400 pl-4 sm:pl-6">
              "STBB Books is an educational library platform designed to help students and teachers across Sindh organize and access their textbooks in one convenient place."
            </blockquote>
          </div>

          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 border border-amber-400/20 text-amber-300">
                <BookOpen className="w-6 h-6" aria-label="Textbook source" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                  Textbook Source
                </span>
                <p className="text-base font-bold text-amber-300">
                  Sindh Textbook Board, Jamshoro
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-slate-200">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Free Student Resource</span>
            </div>
          </div>
        </div>
      </div>

      {/* Textbook Source & App Architecture */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 text-blue-900 font-bold text-lg">
          <Database className="w-6 h-6 text-blue-700" />
          <span>Textbook Source & App Architecture</span>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          All textbook records, titles, subject mappings, covers, and PDF streams in this application are directly indexed from the official portal of the Sindh Textbook Board:
        </p>
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-700 font-mono">
          <p>
            <strong>Official Portal:</strong>{' '}
            <a
              href="https://ebooks.stbb.edu.pk/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 underline font-bold"
            >
              https://ebooks.stbb.edu.pk/
            </a>{' '}
            (portal.stbb.edu.pk/ebooks)
          </p>
          <p><strong>Verified Records:</strong> 178 authentic textbooks across Classes 1–12</p>
          <p><strong>Front Cover Source:</strong> portal.stbb.edu.pk/ebooks/uploads/books_images/</p>
          <p><strong>PDF Stream Source:</strong> portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=&#123;id&#125;</p>
          <p><strong>Download Source:</strong> portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=&#123;id&#125;&download=1</p>
        </div>
      </div>

      {/* Official Disclaimer */}
      <div className="bg-amber-50 rounded-2xl p-6 sm:p-8 border border-amber-200 space-y-3">
        <h3 className="text-base font-bold text-amber-950 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-600" />
          <span>Intellectual Property & Educational Notice</span>
        </h3>
        <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
          All digital textbooks, syllabi, covers, and learning materials remain the intellectual property of the <strong>Sindh Textbook Board (STBB), Jamshoro, Sindh, Pakistan</strong>.
          This independent web application facilitates non-commercial educational access for students, teachers, and parents in Sindh.
        </p>
      </div>

      {/* Project creators */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-950 text-amber-300 flex items-center justify-center border border-amber-400/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Project Creators</p>
            <h3 className="mt-1 text-xl font-black text-slate-900">D&amp;A Brothers</h3>
            <p className="mt-1 text-sm font-semibold text-slate-700">Developed by Dileep Kumar &amp; Ajeet Kumar</p>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              An independent educational project built to make textbook access easier for students.
            </p>
          </div>
        </div>
      </div>

      {/* PWA Install Notice */}
      <div className="p-6 bg-slate-900 text-white rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-sm text-white">Install on Mobile or Tablet</h4>
          <p className="text-xs text-slate-400">Install STBB Books as an app for fast access.</p>
        </div>
        <PWAInstallButton />
      </div>
    </div>
  );
};
