import React from 'react';
import type { Screenshot } from '../types';
import { isAnalyzed } from '../types';
import { Share } from '@capacitor/share';
import { Browser } from '@capacitor/browser';
import { Dialog } from '@capacitor/dialog';

interface ScreenshotDetailModalProps {
  screenshot: Screenshot;
  onClose: () => void;
  onDelete: (id: string) => void;
}

const ActionableLink: React.FC<{ url: string }> = ({ url }) => {
    const handleClick = () => {
        Browser.open({ url });
    };
    return (
        <a 
            href={url}
            onClick={(e) => { e.preventDefault(); handleClick(); }} 
            className="flex items-center space-x-2 p-2 bg-indigo-50 dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-gray-600 rounded-md transition-colors duration-200"
            target="_blank"
            rel="noopener noreferrer"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 dark:text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-indigo-700 dark:text-indigo-300 truncate">{url}</span>
        </a>
    );
}

const copyToClipboard = async (text: string) => {
    try {
        await navigator.clipboard.writeText(text);
        await Dialog.alert({
            title: 'Copied',
            message: 'Text copied to clipboard.',
        });
    } catch (err) {
        console.error('Failed to copy text: ', err);
        await Dialog.alert({
            title: 'Error',
            message: 'Could not copy text to clipboard.',
        });
    }
};

export const ScreenshotDetailModal: React.FC<ScreenshotDetailModalProps> = ({ screenshot, onClose, onDelete }) => {
    const handleShare = async () => {
        try {
            await Share.share({
                title: 'Share Screenshot',
                text: `Check out this screenshot: ${screenshot.description}`,
                url: screenshot.uri, // Use the native file URI for sharing
            });
        } catch (error) {
            console.error('Error sharing screenshot:', error);
        }
    };
    
    const isScreenshotAnalyzed = isAnalyzed(screenshot);

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
                <div className="md:w-1/3 p-6 flex flex-col overflow-hidden">
                    <div className="flex-grow overflow-y-auto pr-2 space-y-6">
                        {/* AI Summary Section */}
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">AI Summary</h2>
                            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{screenshot.description}</p>
                        </div>
                        
                        {/* Actionable Links Section - Renders only if entities exist */}
                        {isScreenshotAnalyzed && screenshot.entities.urls.length > 0 && (
                            <div>
                                <h3 className="text-md font-bold text-gray-800 dark:text-gray-200 mb-2">Actionable Links</h3>
                                <div className="space-y-2">
                                    {screenshot.entities.urls.map((url, index) => <ActionableLink key={index} url={url} />)}
                                </div>
                            </div>
                        )}

                        {/* Extracted Text Section - Renders only if text exists */}
                        {isScreenshotAnalyzed && screenshot.text.trim().length > 0 && (
                             <div>
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-md font-bold text-gray-800 dark:text-gray-200">Extracted Text</h3>
                                    <button 
                                        onClick={() => copyToClipboard(screenshot.text)}
                                        className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        aria-label="Copy extracted text"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="max-h-48 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md border border-gray-200 dark:border-gray-700">
                                     <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-pre-wrap">{screenshot.text}</p>
                                </div>
                            </div>
                        )}
                    </div>
                   
                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex space-x-2">
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
