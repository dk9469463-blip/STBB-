import React, { lazy, Suspense, useState, useEffect } from 'react';
import { Header, NavTab } from './components/Header';
import { HomeView } from './components/HomeView';
import { ClassesView } from './components/ClassesView';
import { SubjectListView } from './components/SubjectListView';
import { SearchView } from './components/SearchView';
import { AIAssistantView } from './components/AIAssistantView';
import { AboutView } from './components/AboutView';
import { Footer } from './components/Footer';
const PDFViewerModal = lazy(() =>
  import('./components/PDFViewerModal').then((module) => ({ default: module.PDFViewerModal }))
);
import { OfflineIndicator } from './components/OfflineIndicator';
import { Book } from './types';
import { getStoredReadingPage } from './utils/readingProgress';
import { recordRecentlyViewedBook } from './utils/recentlyViewed';

const STORAGE_LAST_CLASS_KEY = 'stbb_last_selected_class';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [selectedClassNumber, setSelectedClassNumber] = useState<number | null>(null);
  const [activeBookForModal, setActiveBookForModal] = useState<Book | null>(null);
  const [initialPageForModal, setInitialPageForModal] = useState<number | undefined>(undefined);
  const [readingProgressVersion, setReadingProgressVersion] = useState(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [aiContext, setAiContext] = useState<{
    book?: Book | null;
    pageNumber?: number;
    selectedText?: string;
  }>({});

  // Restore last selected class from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LAST_CLASS_KEY);
      if (saved) {
        const num = parseInt(saved, 10);
        if (!isNaN(num) && num >= 1 && num <= 12) {
          // Keep as last visited
        }
      }
    } catch {
      // localStorage may fail in private mode
    }
  }, []);

  const handleSelectClass = (classNumber: number) => {
    setSelectedClassNumber(classNumber);
    setCurrentTab('classes');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      localStorage.setItem(STORAGE_LAST_CLASS_KEY, classNumber.toString());
    } catch {
      // ignore
    }
  };

  const handleBackToClasses = () => {
    setSelectedClassNumber(null);
    setCurrentTab('classes');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExploreClasses = () => {
    setSelectedClassNumber(null);
    setCurrentTab('classes');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToSearch = (query: string = '') => {
    setSearchQuery(query);
    setCurrentTab('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToAIAssistant = () => {
    setCurrentTab('ai-assistant');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTabChange = (tab: NavTab) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenBook = (book: Book, pageNumber?: number) => {
    recordRecentlyViewedBook(book);
    const savedPage = pageNumber ?? getStoredReadingPage(book.id) ?? 1;
    setInitialPageForModal(savedPage);
    setActiveBookForModal(book);
  };

  const handleOpenAIAssistantFromReader = (book: Book, pageNumber?: number, text?: string) => {
    setAiContext({ book, pageNumber, selectedText: text });
    setActiveBookForModal(null);
    setCurrentTab('ai-assistant');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getLastStoredClass = (): number | null => {
    try {
      const saved = localStorage.getItem(STORAGE_LAST_CLASS_KEY);
      if (saved) {
        const num = parseInt(saved, 10);
        if (!isNaN(num) && num >= 1 && num <= 12) return num;
      }
    } catch {
      // ignore
    }
    return null;
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 selection:bg-amber-400 selection:text-slate-950 font-sans">
      {/* Offline Toast */}
      <OfflineIndicator />

      {/* Sticky Top Header with STBB Books logo on left & Govt of Sindh logo on right */}
      <Header
        currentTab={currentTab}
        onSelectTab={handleTabChange}
        selectedClassNumber={selectedClassNumber}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {currentTab === 'home' && (
          <HomeView
            onExploreClasses={handleExploreClasses}
            onSelectClass={handleSelectClass}
            onGoToSearch={handleGoToSearch}
            onGoToAIAssistant={handleGoToAIAssistant}
            lastSelectedClass={getLastStoredClass()}
            readingProgressVersion={readingProgressVersion}
            onContinueReading={(book, pageNumber) => handleOpenBook(book, pageNumber)}
          />
        )}

        {currentTab === 'classes' && (
          <>
            {selectedClassNumber !== null ? (
              <SubjectListView
                classNumber={selectedClassNumber}
                onBackToClasses={handleBackToClasses}
                onViewBook={(book) => handleOpenBook(book)}
                onSelectAnotherClass={handleSelectClass}
              />
            ) : (
              <ClassesView
                onSelectClass={handleSelectClass}
                lastSelectedClass={getLastStoredClass()}
              />
            )}
          </>
        )}

        {currentTab === 'search' && (
          <SearchView
            initialQuery={searchQuery}
            onViewBook={(book) => handleOpenBook(book)}
            onSelectClass={handleSelectClass}
          />
        )}

        {currentTab === 'ai-assistant' && (
          <AIAssistantView
            initialBook={aiContext.book}
            initialPageNumber={aiContext.pageNumber}
            initialSelectedText={aiContext.selectedText}
            onOpenBookReader={(book, page) => {
              handleOpenBook(book, page);
            }}
          />
        )}

        {currentTab === 'about' && <AboutView />}
      </main>

      {/* Load the heavy PDF.js reader only when the user opens a textbook.
          This keeps the initial library bundle smaller on slow connections. */}
      {activeBookForModal && (
        <Suspense
          fallback={
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-6 text-center text-white"
              role="status"
              aria-live="polite"
            >
              <div className="max-w-sm space-y-3">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-600 border-t-amber-400" />
                <p className="font-bold">Preparing textbook reader…</p>
                <p className="text-xs text-slate-300">{activeBookForModal.title}</p>
              </div>
            </div>
          }
        >
          <PDFViewerModal
            book={activeBookForModal}
            initialPageNumber={initialPageForModal}
            onClose={() => {
              setActiveBookForModal(null);
              setInitialPageForModal(undefined);
              setReadingProgressVersion((version) => version + 1);
            }}
            onOpenUniversalAiAssistant={handleOpenAIAssistantFromReader}
          />
        </Suspense>
      )}

      {/* Professional Footer */}
      <Footer
        onSelectTab={handleTabChange}
        onSelectClass={handleSelectClass}
      />
    </div>
  );
}
