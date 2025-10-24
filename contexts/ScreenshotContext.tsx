import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { initializeOnDeviceModel, addToSearchIndex, removeFromSearchIndex, cancelCurrentAnalysis, analyzeScreenshotsInBatch } from '../services/onDeviceAiService';
import { readScreenshotDirectory, deleteScreenshotFile } from '../services/androidService';
import { loadScreenshots, addScreenshots, removeScreenshots } from '../services/storageService';
import type { Screenshot, NativeError } from '../types';
import { isNativeError, isAnalyzed } from '../types';
import { Dialog } from '@capacitor/dialog';
import type { ScreenshotFile } from '../services/androidService';
import { Capacitor } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';
import OnDeviceAI from '../onDeviceAiPlugin';

type AppStatus = 'INITIALIZING' | 'IDLE' | 'SCANNING' | 'ERROR';

interface ScreenshotContextType {
  screenshots: Screenshot[];
  appStatus: AppStatus;
  error: string | null;
  loadingProgress: number;
  loadingTotal: number;
  scanForScreenshots: () => Promise<void>;
  deleteScreenshot: (screenshotId: string) => Promise<void>;
  initializeApp: () => Promise<void>;
}

const ScreenshotContext = createContext<ScreenshotContextType | undefined>(undefined);

// Assume native code will emit these events.
const SCREENSHOT_ADDED_EVENT = 'screenshotAdded';
const SCREENSHOT_DELETED_EVENT = 'screenshotDeleted';

export const ScreenshotProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [appStatus, setAppStatus] = useState<AppStatus>('INITIALIZING');
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingTotal, setLoadingTotal] = useState(0);
  const isInitialized = useRef(false);

  // Refs to provide stable access to the latest state within callbacks, preventing re-runs of useEffect.
  const screenshotsRef = useRef(screenshots);
  useEffect(() => { screenshotsRef.current = screenshots; }, [screenshots]);
  
  const appStatusRef = useRef(appStatus);
  useEffect(() => { appStatusRef.current = appStatus; }, [appStatus]);
  
  const deleteScreenshot = async (screenshotId: string) => {
    const screenshotToDelete = screenshots.find(s => s.id === screenshotId);
    if (!screenshotToDelete) {
        console.error("Attempted to delete a screenshot that does not exist in state.");
        return;
    }

    const { value } = await Dialog.confirm({
      title: 'Confirm Delete',
      message: 'Are you sure you want to permanently delete this screenshot from your device?',
      okButtonTitle: 'Delete',
      cancelButtonTitle: 'Cancel',
    });

    if (!value) return;

    try {
        await deleteScreenshotFile(screenshotToDelete.uri);
        await removeFromSearchIndex([screenshotToDelete.id]);
        const updatedScreenshots = screenshots.filter(s => s.id !== screenshotId);
        setScreenshots(updatedScreenshots);
        await removeScreenshots([screenshotId]);
    } catch (e: any) {
        console.error("Failed to delete screenshot:", e);
        const formattedError = isNativeError(e) ? e : { message: e.message || "An unknown error occurred." };
        await Dialog.alert({
            title: 'Deletion Failed',
            message: formattedError.message || "Could not delete the screenshot. Please try again.",
        });
    }
  };
  
  const processNewFiles = useCallback(async (filesToProcess: ScreenshotFile[]) => {
      if (filesToProcess.length === 0) {
          setAppStatus('IDLE');
          setLoadingProgress(0);
          setLoadingTotal(0);
          return;
      }

      setAppStatus('SCANNING');
      setLoadingProgress(0);
      setLoadingTotal(filesToProcess.length);

      try {
          const uris = filesToProcess.map(f => f.uri);
          const results = await analyzeScreenshotsInBatch(uris);

          const newScreenshots: Screenshot[] = [];

          for (let i = 0; i < filesToProcess.length; i++) {
              const file = filesToProcess[i];
              const result = results[i];
              
              setLoadingProgress(i + 1);

              if (result && result.error) {
                  console.error(`Skipping ${file.name} due to analysis error: ${result.error}`);
                  continue; // Skip this file
              }

              if (result && result.description) {
                  const newScreenshot: Screenshot = {
                      id: file.name,
                      uri: file.uri,
                      webPath: Capacitor.convertFileSrc(file.uri),
                      thumbnailWebPath: file.thumbnailUri ? Capacitor.convertFileSrc(file.thumbnailUri) : undefined,
                      name: file.name,
                      description: result.description,
                      text: result.text || null,
                      entities: result.entities || null,
                      category: result.category || null,
                      creationTime: file.mtime,
                  };
                  newScreenshots.push(newScreenshot);
              }
          }

          if (newScreenshots.length > 0) {
              setScreenshots(prev => [...newScreenshots, ...prev].sort((a, b) => b.creationTime - a.creationTime));
              await addScreenshots(newScreenshots);
              const analyzedForIndex = newScreenshots.filter(isAnalyzed);
              if (analyzedForIndex.length > 0) {
                  await addToSearchIndex(analyzedForIndex);
              }
          }

      } catch (e: any) {
          console.error('A critical error occurred during batch analysis:', e);
          const isCancellation = isNativeError(e) && e.code === 'E_CANCELLED';
          if (!isCancellation) {
              const errorMessage = isNativeError(e) ? e.message : 'Analysis failed unexpectedly.';
              setError(errorMessage);
              setAppStatus('ERROR'); // Persist error state until user retries.
          }
      } finally {
        if (appStatusRef.current !== 'ERROR') {
             setAppStatus('IDLE');
        }
        setLoadingProgress(0);
        setLoadingTotal(0);
      }
  }, []);

  const scanForScreenshots = useCallback(async () => {
    if (appStatusRef.current === 'SCANNING') {
        console.log("Scan already in progress.");
        return;
    }

    setAppStatus('SCANNING');
    setError(null);

    try {
        const deviceFiles = await readScreenshotDirectory();
        const currentScreenshotsMap = new Map(screenshotsRef.current.map(s => [s.id, s]));
        
        const newFilesToProcess = deviceFiles.filter(file => !currentScreenshotsMap.has(file.name));

        const deviceFileSet = new Set(deviceFiles.map(f => f.name));
        const deletedScreenshots = screenshotsRef.current.filter(s => !deviceFileSet.has(s.id));
        
        if (deletedScreenshots.length > 0) {
            const idsToRemove = deletedScreenshots.map(s => s.id);
            console.log(`Removing ${idsToRemove.length} deleted screenshots from the app.`);
            setScreenshots(prev => prev.filter(s => !idsToRemove.includes(s.id)));
            await removeScreenshots(idsToRemove);
            await removeFromSearchIndex(idsToRemove);
        }

        await processNewFiles(newFilesToProcess);

    } catch (e: any) {
        console.error("Failed to scan for screenshots:", e);
        const errorMessage = isNativeError(e) ? e.message : 'Could not read screenshot directory.';
        setError(errorMessage);
        setAppStatus('ERROR');
    }
  }, [processNewFiles]);

  const initializeApp = useCallback(async () => {
    isInitialized.current = false;
    setAppStatus('INITIALIZING');
    setError(null);

    try {
        await initializeOnDeviceModel();
        const storedScreenshots = await loadScreenshots();
        setScreenshots(storedScreenshots.sort((a, b) => b.creationTime - a.creationTime));
        isInitialized.current = true;
        await scanForScreenshots();
    } catch (e: any) {
        console.error("App initialization failed:", e);
        const errorMessage = isNativeError(e) ? e.message : 'A critical error occurred on startup.';
        setError(errorMessage);
        setAppStatus('ERROR');
    }
  }, [scanForScreenshots]);

  useEffect(() => {
    if (!isInitialized.current) {
      initializeApp();
    }
    
    let addListenerHandle: PluginListenerHandle | undefined;
    let deleteListenerHandle: PluginListenerHandle | undefined;

    const setupListeners = async () => {
        addListenerHandle = await OnDeviceAI.addListener(SCREENSHOT_ADDED_EVENT, (info: { fileName: string }) => {
            console.log(`Native event received: ${SCREENSHOT_ADDED_EVENT}`, info);
            if (appStatusRef.current !== 'SCANNING') {
                scanForScreenshots();
            }
        });
        
        deleteListenerHandle = await OnDeviceAI.addListener(SCREENSHOT_DELETED_EVENT, (info: { fileName: string }) => {
            console.log(`Native event received: ${SCREENSHOT_DELETED_EVENT}`, info);
            if (info.fileName) {
                 const idToRemove = info.fileName;
                 setScreenshots(prev => prev.filter(s => s.id !== idToRemove));
                 removeScreenshots([idToRemove]);
                 removeFromSearchIndex([idToRemove]);
            }
        });
    };

    if (Capacitor.getPlatform() !== 'web') {
        setupListeners();
    }

    return () => {
      addListenerHandle?.remove();
      deleteListenerHandle?.remove();
    };
  }, [initializeApp, scanForScreenshots]);

  const value = {
    screenshots,
    appStatus,
    error,
    loadingProgress,
    loadingTotal,
    scanForScreenshots,
    deleteScreenshot,
    initializeApp,
  };

  return (
    <ScreenshotContext.Provider value={value}>
      {children}
    </ScreenshotContext.Provider>
  );
};

export const useScreenshots = (): ScreenshotContextType => {
  const context = useContext(ScreenshotContext);
  if (context === undefined) {
    throw new Error('useScreenshots must be used within a ScreenshotProvider');
  }
  return context;
};
