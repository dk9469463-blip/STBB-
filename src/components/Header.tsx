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
  Settings2,
  Moon,
  Sun,
  Wifi,
  WifiOff,
  Gauge,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { useAppPreferences } from '../utils/appPreferences';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { preferences, setPreference } = useAppPreferences();
  const isOnline = useOnlineStatus();

  const handleNav = (tab: NavTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-lg">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

            {/* Quick Dark Mode toggle: available without opening settings */}
            <button
              type="button"
              onClick={() => setPreference('darkMode', !preferences.darkMode)}
              className="hidden sm:flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-slate-800 text-amber-300 hover:bg-slate-700 hover:text-amber-200 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              aria-label={preferences.darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-pressed={preferences.darkMode}
              title={preferences.darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {preferences.darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Quick Low Internet Mode toggle for slow or limited connections */}
            <button
              type="button"
              onClick={() => setPreference('lowDataMode', !preferences.lowDataMode)}
              className={`hidden sm:flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${preferences.lowDataMode ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30' : 'bg-slate-800 text-sky-300 hover:bg-slate-700'}`}
              aria-label={preferences.lowDataMode ? 'Turn off Low Internet Mode' : 'Turn on Low Internet Mode'}
              aria-pressed={preferences.lowDataMode}
              title={preferences.lowDataMode ? 'Low Internet Mode is ON' : 'Turn on Low Internet Mode'}
            >
              <Gauge className="h-5 w-5" />
            </button>

            {/* Display and connection settings */}
            <button
              onClick={() => setSettingsOpen((open) => !open)}
              className="p-2 rounded-xl bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition cursor-pointer"
              aria-label="Display and network settings"
              aria-expanded={settingsOpen}
              title="Display and network settings"
            >
              <Settings2 className="w-5 h-5" />
            </button>

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

        {/* Settings panel: preferences persist on this device. */}
        {settingsOpen && (
          <section
            className="absolute right-3 top-[4.5rem] z-[60] w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border border-slate-700 bg-slate-950 p-4 text-white shadow-2xl"
            aria-label="Display and network settings"
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold">Display & Network</h2>
                <p className="mt-0.5 text-xs text-slate-400">Saved on this device</p>
              </div>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${isOnline ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'}`}>
                {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            <div className="sm:hidden">
              <button
                type="button"
                role="switch"
                aria-checked={preferences.darkMode}
                onClick={() => setPreference('darkMode', !preferences.darkMode)}
                className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-slate-800"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300">
                    {preferences.darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  </span>
                  <span>
                    <span className="block text-sm font-bold">Dark mode</span>
                    <span className="mt-0.5 block text-xs text-slate-400">Change the whole library appearance</span>
                  </span>
                </span>
                <span className={`relative h-5 w-9 shrink-0 rounded-full transition ${preferences.darkMode ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${preferences.darkMode ? 'left-[1.125rem]' : 'left-0.5'}`} />
                </span>
              </button>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={preferences.lowDataMode}
              onClick={() => setPreference('lowDataMode', !preferences.lowDataMode)}
              className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-slate-800"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">
                  <Gauge className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-bold">Low Internet Mode</span>
                  <span className="mt-0.5 block text-xs text-slate-400">Skip covers, use smaller PDF chunks and lighter rendering</span>
                </span>
              </span>
              <span className={`relative h-5 w-9 shrink-0 rounded-full transition ${preferences.lowDataMode ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${preferences.lowDataMode ? 'left-[1.125rem]' : 'left-0.5'}`} />
              </span>
            </button>

            <div className="mt-2 rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-xs leading-relaxed text-slate-300">
              <p className="font-bold text-slate-200">
                {isOnline ? 'Connection status: online' : 'You are offline'}
              </p>
              <p className="mt-1">
                {isOnline
                  ? 'The app shell can be cached after install. Textbook PDFs normally need internet unless you have downloaded them to your device.'
                  : 'Cached app pages may still work. Online PDF sources and AI assistance may not load without a connection.'}
              </p>
              <div className="mt-3 border-t border-slate-800 pt-3">
                <PWAInstallButton compact />
              </div>
            </div>
          </section>
        )}

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
