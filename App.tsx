import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { analyzeScreenshotOnDevice, initializeOnDeviceModel } from './services/onDeviceAiService';
import { readScreenshotDirectory, ScreenshotFile } from './services/androidService';
import { saveScreenshots, loadScreenshots } from './services/storageService';
import type { Screenshot } from './types';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { ScreenshotGrid } from './components/ScreenshotGrid';
import { EmptyState } from './components/EmptyState';
import { Loader } from './components/Loader';
import { ScreenshotDetailModal } from './components/ScreenshotDetailModal';
import { Dialog } from '@capacitor/dialog';

const App: React.FC = () => {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Start loading on boot
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingTotal, setLoadingTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState<Screenshot | null>(null);
  
  const isScanning = useRef(false);
  const isInitialized = useRef(false);

  const handleDeleteScreenshot = async (screenshotId: string) => {
    const { value } = await Dialog.confirm({
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this analyzed screenshot? This action cannot be undone.',
      okButtonTitle: 'Delete',
      cancelButtonTitle: 'Cancel',
    });

    if (!value) return;

    const updatedScreenshots = screenshots.filter(s => s.id !== screenshotId);
    setScreenshots(updatedScreenshots);
    await saveScreenshots(updatedScreenshots);
    setSelectedScreenshot(null); // Close modal after deletion
  };
  
  const scanForScreenshots = useCallback(async () => {
    if (isScanning.current) {
      console.log("Scan already in progress.");
      return;
    }

    console.log("Starting screenshot scan...");
    isScanning.current = true;
    setIsLoading(true);
    setLoadingTotal(0);
    setLoadingProgress(0);
    setError(null);

    try {
      const deviceFiles = await readScreenshotDirectory();
      const existingScreenshots = new Map(screenshots.map(s => [s.name, s]));
      const newFilesToProcess = deviceFiles.filter(f => !existingScreenshots.has(f.name));

      if (newFilesToProcess.length === 0) {
        console.log("No new screenshots found.");
        setIsLoading(false);
        isScanning.current = false;
        return;
      }

      console.log(`Found ${newFilesToProcess.length} new screenshots to analyze.`);
      setLoadingTotal(newFilesToProcess.length);
      const analyzedScreenshots: Screenshot[] = [];

      for (let i = 0; i < newFilesToProcess.length; i++) {
        const file = newFilesToProcess[i];
        const description = await analyzeScreenshotOnDevice(file.dataUrl);
        analyzedScreenshots.push({
          id: file.name,
          dataUrl: file.dataUrl,
          description,
          name: file.name,
          creationTime: file.mtime,
        });
        setLoadingProgress(i + 1);
      }
      
      const updatedScreenshots = [...screenshots, ...analyzedScreenshots];
      setScreenshots(updatedScreenshots);
      await saveScreenshots(updatedScreenshots);

    } catch(e: any) {
      console.error("Error during scan process:", e);
      setError(e.message || "An error occurred while scanning for screenshots.");
    } finally {
      setIsLoading(false);
      isScanning.current = false;
      console.log("Screenshot scan finished.");
    }
  }, [screenshots]);

  useEffect(() => {
    const initializeApp = async () => {
      if (isInitialized.current) return;
      isInitialized.current = true;

      setIsLoading(true);
      try {
        // Load existing data first for a fast startup
        const storedScreenshots = await loadScreenshots();
        setScreenshots(storedScreenshots);
        
        // Initialize the AI model
        await initializeOnDeviceModel();
        
        // Then, scan for any new screenshots
        await scanForScreenshots();

      } catch (e: any) {
        setError(e.message);
        console.error("Initialization failed:", e);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [scanForScreenshots]);

  const filteredScreenshots = useMemo(() => {
    if (!searchQuery) {
      return screenshots;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return screenshots.filter(s =>
      s.description.toLowerCase().includes(lowercasedQuery) ||
      s.name.toLowerCase().includes(lowercasedQuery)
    );
  }, [screenshots, searchQuery]);
  
  const groupedScreenshots = useMemo(() => {
    const groups: { [key: string]: Screenshot[] } = {};
    const sorted = [...filteredScreenshots].sort((a, b) => b.creationTime - a.creationTime);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    sorted.forEach(s => {
        const date = new Date(s.creationTime);
        let groupName = date.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });

        if (date >= today) groupName = 'Today';
        else if (date >= yesterday) groupName = 'Yesterday';
        else if (date >= lastWeek) groupName = 'Last 7 Days';
        
        if (!groups[groupName]) {
            groups[groupName] = [];
        }
        groups[groupName].push(s);
    });
    return groups;
  }, [filteredScreenshots]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {isLoading && loadingTotal > 0 && <Loader progress={loadingProgress} total={loadingTotal} />}
      <Header onRefresh={scanForScreenshots} isScanning={isScanning.current} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {screenshots.length > 0 && (
          <div className="mb-8">
            <SearchBar 
                searchQuery={searchQuery} 
                setSearchQuery={setSearchQuery} 
                disabled={isLoading} 
            />
          </div>
        )}
        
        {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        )}

        {screenshots.length === 0 && !isLoading && !error ? (
          <EmptyState />
        ) : (
          <ScreenshotGrid screenshotsByGroup={groupedScreenshots} onScreenshotClick={setSelectedScreenshot} />
        )}
      </main>
      
      {selectedScreenshot && (
        <ScreenshotDetailModal 
            screenshot={selectedScreenshot} 
            onClose={() => setSelectedScreenshot(null)}
            onDelete={handleDeleteScreenshot}
        />
      )}
    </div>
  );
};

export default App;
