import React from 'react';
import { useScreenshots } from '../contexts/ScreenshotContext';

export const Header: React.FC = () => {
  const { scanForScreenshots, appStatus } = useScreenshots();
  const isScanning = appStatus === 'SCANNING';

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
                <svg xmlns="http://www.w.org/2000/svg" className="h-8 w-8 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h4l3 3 3-3h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-9 14l-4-4h3V9h2v3h3l-4 4z"/>
                </svg>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    NeuralSS
                </h1>
            </div>
            <button 
                onClick={scanForScreenshots} 
                disabled={isScanning}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Refresh screenshots"
            >
                <svg className={`h-6 w-6 ${isScanning ? 'animate-spin' : ''}`} xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0120.5 11M20 20l-1.5-1.5A9 9 0 003.5 13" />
                </svg>
            </button>
        </div>
      </div>
    </header>
  );
};
