import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { initializeOnDeviceModel } from '../services/onDeviceAiService';
import { readScreenshotDirectory } from '../services/androidService';
import { saveScreenshots, loadScreenshots } from '../services/storageService';
import type { Screenshot } from '../types';
import { Dialog } from '@capacitor/dialog';
import type { ScreenshotFile } from '../services/androidService';

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

export const ScreenshotProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [appStatus, setAppStatus] = useState<AppStatus>('INITIALIZING');
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingTotal, setLoadingTotal] = useState(0);
  const isInitialized = useRef(false);
  const analysisWorkerRef = useRef<Worker | null>(null);
  
  const deleteScreenshot = async (screenshotId: string) => {
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
  };

  const scanForScreenshots = useCallback(async () => {
    if (appStatus === 'SCANNING') return;
    
    setAppStatus('SCANNING');
    setLoadingTotal(0);
    setLoadingProgress(0);
    setError(null);
    
    try {
      const deviceFiles = await readScreenshotDirectory();
      const existingScreenshots = new Map(screenshots.map(s => [s.name, s]));
      const newFilesToProcess = deviceFiles.filter(f => !existingScreenshots.has(f.name));

      if (newFilesToProcess.length === 0) {
        setAppStatus('IDLE');
        return;
      }
      
      setLoadingTotal(newFilesToProcess.length);
      
      // Terminate existing worker if any
      if (analysisWorkerRef.current) {
        analysisWorkerRef.current.terminate();
      }

      // Start Web Worker for analysis
      const worker = new Worker(new URL('../workers/analysis.worker.ts', import.meta.url), { type: 'module' });
      analysisWorkerRef.current = worker;

      worker.onmessage = (event: MessageEvent<{ type: string, data: any }>) => {
        const { type, data } = event.data;
        if (type === 'result') {
          setScreenshots(prev => [...prev, data]);
        } else if (type === 'progress') {
          setLoadingProgress(data.progress);
        } else if (type === 'error') {
          console.error('Worker error:', data.message);
          // Decide how to handle partial errors, maybe collect and show at the end
        } else if (type === 'complete') {
          saveScreenshots(screenshots); // Save after scan is fully complete
          setAppStatus('IDLE');
          worker.terminate();
          analysisWorkerRef.current = null;
        }
      };
      
      worker.onerror = (e) => {
          console.error('Unhandled worker error', e);
          setError('A critical error occurred during analysis.');
          setAppStatus('ERROR');
          worker.terminate();
          analysisWorkerRef.current = null;
      }
      
      worker.postMessage(newFilesToProcess);

    } catch(e: any) {
      setError(e.message || "An error occurred while scanning for screenshots.");
      setAppStatus('ERROR');
    }
  }, [screenshots, appStatus]);
  
  const initializeApp = useCallback(async () => {
    if (isInitialized.current && appStatus !== 'ERROR') return;
    isInitialized.current = true;
    setAppStatus('INITIALIZING');
    setError(null);

    try {
      const storedScreenshots = await loadScreenshots();
      setScreenshots(storedScreenshots);
      await initializeOnDeviceModel();
      setAppStatus('IDLE'); // Set to idle before scan
      await scanForScreenshots(); // This will transition to SCANNING if needed
    } catch (e: any) {
      setError(e.message);
      setAppStatus('ERROR');
    }
  }, [scanForScreenshots, appStatus]);

  useEffect(() => {
    initializeApp();
    
    // Cleanup worker on component unmount
    return () => {
        if (analysisWorkerRef.current) {
            analysisWorkerRef.current.terminate();
        }
    }
  }, [initializeApp]);
  
   // Save screenshots whenever they change after the initial load
  useEffect(() => {
    if (appStatus === 'IDLE') {
        saveScreenshots(screenshots);
    }
  }, [screenshots, appStatus]);


  const value = { 
    screenshots, 
    appStatus, 
    error, 
    loadingProgress, 
    loadingTotal,
    scanForScreenshots,
    deleteScreenshot,
    initializeApp
  };

  return <ScreenshotContext.Provider value={value}>{children}</ScreenshotContext.Provider>;
};

export const useScreenshots = (): ScreenshotContextType => {
  const context = useContext(ScreenshotContext);
  if (context === undefined) {
    throw new Error('useScreenshots must be used within a ScreenshotProvider');
  }
  return context;
};
