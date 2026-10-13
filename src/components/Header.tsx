import React, { useState } from 'react';
import {
  Menu,
  X,
  Search,
  Layers,
  Home,
  Info,
  Sparkles,
  Bot,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

export type NavTab = 'home' | 'classes' | 'search' | 'ai-assistant' | 'about';

interface HeaderProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  selectedClassNumber?: number | null;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  selectedClassNumber,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (tab: NavTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-3">
          {/* LEFT: STBB BOOKS Brand Logo & Title */}
          <div
            onClick={() => handleNav('home')}
            className="flex items-center gap-3 cursor-pointer group py-2 shrink-0 select-none"
          >
            {/* Updated Official STBB Books Emblem */}
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center group-hover:scale-105 transition-transform">
              <img
                src="/logo.svg"
                alt="STBB Books Official Logo"
                className="w-11 h-11 sm:w-12 sm:h-12 object-contain drop-shadow-md"
              />
            </div>

            {/* Brand Title and Tagline (Strictly Zero Developer Credit) */}
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black tracking-wider text-white group-hover:text-amber-300 transition-colors leading-none">
                STBB BOOKS
              </span>
              <span className="text-[11px] sm:text-xs font-semibold text-amber-400/90 tracking-wide mt-1">
                Every Class, Every Book, One Library.
              </span>
            </div>
          </div>

          {/* CENTER: Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            <button
              onClick={() => handleNav('home')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                currentTab === 'home'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>

            <button
              onClick={() => handleNav('classes')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                currentTab === 'classes'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Classes</span>
              {selectedClassNumber && (
                <span className="px-1.5 py-0.2 rounded-md bg-amber-400 text-slate-950 text-xs font-bold">
                  {selectedClassNumber}
                </span>
              )}
            </button>

            <button
              onClick={() => handleNav('search')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                currentTab === 'search'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>

            {/* PROMINENT AI STUDY ASSISTANT NAVIGATION BUTTON */}
            <button
              onClick={() => handleNav('ai-assistant')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                currentTab === 'ai-assistant'
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md ring-2 ring-amber-300'
                  : 'bg-amber-500/15 border border-amber-400/30 text-amber-300 hover:bg-amber-500/25 hover:text-amber-200'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400 fill-current" />
              <span>AI Study Assistant</span>
            </button>

            <button
              onClick={() => handleNav('about')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                currentTab === 'about'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Info className="w-4 h-4" />
              <span>About</span>
            </button>

            {/* PWA In-App Install Button */}
            <div className="ml-1 pl-2 border-l border-slate-800">
              <PWAInstallButton />
            </div>
          </nav>

          {/* RIGHT: Verified Official Government of Sindh Logo */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Government of Sindh Official Emblem on Right */}
            <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-slate-800 text-right">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-200 leading-tight">
                  Government of Sindh
                </span>
                <span className="text-[10px] text-emerald-400 font-medium">
                  School Education Department
                </span>
              </div>
              <img
                src="/government-sindh-logo.svg"
                alt="Government of Sindh Official Seal"
                className="w-10 h-10 object-contain drop-shadow-md rounded-full bg-white/5 p-0.5"
                title="Verified Government of Sindh Educational Portal Standards"
              />
            </div>

            {/* Mobile Official Government Logo Icon */}
            <div className="sm:hidden flex items-center">
              <img
                src="/government-sindh-logo.svg"
                alt="Government of Sindh Logo"
                className="w-9 h-9 object-contain drop-shadow-md"
              />
            </div>

            {/* Mobile Hamburger Menu Toggle */}
            <div className="lg:hidden flex items-center gap-1.5">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition cursor-pointer"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800 py-4 px-2 space-y-2 bg-slate-900/98 backdrop-blur-xl animate-in slide-in-from-top-3 duration-200">
            <button
              onClick={() => handleNav('home')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-base font-semibold transition ${
                currentTab === 'home'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Home className="w-5 h-5 text-blue-400" />
              <span>Home Library</span>
            </button>

            <button
              onClick={() => handleNav('classes')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-base font-semibold transition ${
                currentTab === 'classes'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-amber-400" />
                <span>All Classes (1 to 12)</span>
              </div>
              {selectedClassNumber && (
                <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 text-xs font-bold">
                  Class {selectedClassNumber}
                </span>
              )}
            </button>

            <button
              onClick={() => handleNav('search')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-base font-semibold transition ${
                currentTab === 'search'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Search className="w-5 h-5 text-blue-400" />
              <span>Search Textbooks</span>
            </button>

            {/* Mobile Prominent AI Study Assistant */}
            <button
              onClick={() => handleNav('ai-assistant')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-base font-bold transition ${
                currentTab === 'ai-assistant'
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black'
                  : 'bg-amber-500/15 border border-amber-400/30 text-amber-300 hover:bg-amber-500/25'
              }`}
            >
              <Sparkles className="w-5 h-5 text-amber-400 fill-current" />
              <span>AI Study Assistant (Tutor)</span>
            </button>

            <button
              onClick={() => handleNav('about')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-base font-semibold transition ${
                currentTab === 'about'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Info className="w-5 h-5 text-slate-400" />
              <span>About STBB Books</span>
            </button>

            <div className="pt-2 px-3 border-t border-slate-800/80 flex items-center justify-between">
              <PWAInstallButton />
              <div className="flex items-center gap-2">
                <img
                  src="/government-sindh-logo.svg"
                  alt="Sindh Logo"
                  className="w-7 h-7 object-contain"
                />
                <span className="text-[10px] text-slate-400">Official Curriculum Standards</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
