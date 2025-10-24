
import React from 'react';
import type { Screenshot } from '../types';

interface ScreenshotCardProps {
  screenshot: Screenshot;
}

export const ScreenshotCard: React.FC<ScreenshotCardProps> = ({ screenshot }) => {
  return (
    <div className="group relative aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden shadow-md transform transition-transform duration-300 hover:scale-105 hover:shadow-xl">
      <img src={screenshot.dataUrl} alt={screenshot.name} className="object-contain w-full h-full" />
      <div className="absolute inset-0 bg-black bg-opacity-70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4">
        <p className="text-white text-sm text-center line-clamp-6">{screenshot.description}</p>
      </div>
    </div>
  );
};
