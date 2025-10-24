import React from 'react';
import type { Screenshot } from '../types';
import { Share } from '@capacitor/share';

interface ScreenshotDetailModalProps {
  screenshot: Screenshot;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export const ScreenshotDetailModal: React.FC<ScreenshotDetailModalProps> = ({ screenshot, onClose, onDelete }) => {
    const handleShare = async () => {
        try {
            await Share.share({
                title: 'Share Screenshot',
                text: `Check out this screenshot: ${screenshot.description}`,
                // Use the native file URI for sharing
                url: screenshot.uri,
            });
        } catch (error) {
            console.error('Error sharing screenshot:', error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center" aria-modal="true" role="dialog">
            <div 
                className="absolute inset-0" 
                onClick={onClose}
                aria-hidden="true"
            ></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl m-4 max-w-4xl w-full max-h-[90vh] flex flex-col md:flex-row overflow-hidden">
                {/* Image Panel */}
                <div className="md:w-2/3 bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
                    <img src={screenshot.webPath} alt={screenshot.name} className="max-w-full max-h-[80vh] object-contain" />
                </div>

                {/* Info Panel */}
                <div className="md:w-1/3 p-6 flex flex-col">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">AI Analysis</h2>
                    <div className="flex-grow overflow-y-auto mb-4 pr-2">
                         <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{screenshot.description}</p>
                    </div>
                   
                    <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700 flex space-x-2">
                         <button onClick={handleShare} className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Share
                        </button>
                        <button onClick={() => onDelete(screenshot.id)} className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Delete
                        </button>
                    </div>
                </div>

                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};