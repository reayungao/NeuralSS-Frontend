import React, { useState, Suspense } from 'react';
import { useScreenshots } from './contexts/ScreenshotContext';
import { useSearch } from './contexts/SearchContext';
import type { Screenshot } from './types';

import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { ScreenshotGrid } from './components/ScreenshotGrid';
import { EmptyState } from './components/EmptyState';
import { Loader } from './components/Loader';
import { StartupLoader } from './components/StartupLoader';
import { ErrorState } from './components/ErrorState';
import { PullToRefreshIndicator } from './components/PullToRefreshIndicator';
import { usePullToRefresh } from './hooks/usePullToRefresh';

// Lazy load the modal for better initial performance
// FIX: Handle named export for React.lazy
const ScreenshotDetailModal = React.lazy(() => import('./components/ScreenshotDetailModal').then(module => ({ default: module.ScreenshotDetailModal })));

const App: React.FC = () => {
  const [selectedScreenshot, setSelectedScreenshot] = useState<Screenshot | null>(null);
  const mainContentRef = React.useRef<HTMLElement>(null);

  const { 
    appStatus, 
    error, 
    screenshots, 
    loadingProgress, 
    loadingTotal,
    scanForScreenshots,
    deleteScreenshot,
    initializeApp
  } = useScreenshots();
  
  const { filteredScreenshots } = useSearch(screenshots);

  const isScanning = appStatus === 'SCANNING';

  const { containerProps, contentTransform, pullDistance } = usePullToRefresh({
    onRefresh: scanForScreenshots,
    isRefreshing: isScanning,
    mainContentRef,
  });

  const handleDelete = async (screenshotId: string) => {
    await deleteScreenshot(screenshotId);
    setSelectedScreenshot(null); // Close modal after deletion
  };
  
  if (appStatus === 'INITIALIZING') {
    return <StartupLoader />;
  }
  
  if (appStatus === 'ERROR' && error) {
    return <ErrorState message={error} onRetry={initializeApp} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 overflow-hidden">
      {isScanning && loadingTotal > 0 && <Loader progress={loadingProgress} total={loadingTotal} />}
      <Header />
      <main 
        ref={mainContentRef}
        {...containerProps}
        className="max-w-7xl h-[calc(100vh-4rem)] overflow-y-auto mx-auto px-4 sm:px-6 lg:px-8 py-8 relative"
      >
        <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isScanning} />
        <div style={contentTransform}>
          <div className="mb-8">
            <SearchBar disabled={isScanning} />
          </div>

          {screenshots.length === 0 && appStatus === 'IDLE' ? (
            <EmptyState />
          ) : (
            <ScreenshotGrid 
                screenshots={filteredScreenshots}
                onScreenshotClick={setSelectedScreenshot} 
                isScanning={isScanning}
                parentRef={mainContentRef}
            />
          )}
        </div>
      </main>
      
      <Suspense fallback={null}>
        {selectedScreenshot && (
          <ScreenshotDetailModal 
              screenshot={selectedScreenshot} 
              onClose={() => setSelectedScreenshot(null)}
              onDelete={handleDelete}
          />
        )}
      </Suspense>
    </div>
  );
};

export default App;
