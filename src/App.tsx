import React, { useState, useEffect } from 'react';
import { Header, NavTab } from './components/Header';
import { HomeView } from './components/HomeView';
import { ClassesView } from './components/ClassesView';
import { SubjectListView } from './components/SubjectListView';
import { SearchView } from './components/SearchView';
import { AIAssistantView } from './components/AIAssistantView';
import { AboutView } from './components/AboutView';
import { Footer } from './components/Footer';
import { PDFViewerModal } from './components/PDFViewerModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Book } from './types';

const STORAGE_LAST_CLASS_KEY = 'stbb_last_selected_class';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [selectedClassNumber, setSelectedClassNumber] = useState<number | null>(null);
  const [activeBookForModal, setActiveBookForModal] = useState<Book | null>(null);
  const [initialPageForModal, setInitialPageForModal] = useState<number | undefined>(undefined);
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
    setInitialPageForModal(pageNumber);
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

      {/* In-App PDF Reader Modal */}
      <PDFViewerModal
        book={activeBookForModal}
        initialPageNumber={initialPageForModal}
        onClose={() => {
          setActiveBookForModal(null);
          setInitialPageForModal(undefined);
        }}
        onOpenUniversalAiAssistant={handleOpenAIAssistantFromReader}
      />

      {/* Professional Footer */}
      <Footer
        onSelectTab={handleTabChange}
        onSelectClass={handleSelectClass}
      />
    </div>
  );
}
