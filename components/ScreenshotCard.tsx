import React, { useState } from 'react';
import type { Screenshot } from '../types';

interface ScreenshotCardProps {
  screenshot: Screenshot;
}

export const ScreenshotCard: React.FC<ScreenshotCardProps> = ({ screenshot }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleImageLoad = () => setIsLoaded(true);
  const handleImageError = () => {
    setIsLoaded(true); // Treat error as "loaded" to stop showing skeleton
    setHasError(true);
  };

  // Prioritize the thumbnail for the grid view for performance, fall back to full image.
  const imageUrl = screenshot.thumbnailWebPath || screenshot.webPath;

  return (
    <div className="group relative aspect-[9/16] bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden shadow-md transform transition-transform duration-300 hover:scale-105 hover:shadow-xl">
      
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 animate-pulse bg-gray-300 dark:bg-gray-600"></div>
      )}

      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs mt-2">Not Found</span>
        </div>
      ) : (
        <img 
          src={imageUrl} 
          alt={screenshot.name} 
          className={`object-cover w-full h-full transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
          decoding="async"
        />
      )}
      
      <div className="absolute inset-0 bg-black bg-opacity-70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4">
        <p className="text-white text-sm text-center line-clamp-6">{screenshot.description}</p>
      </div>
    </div>
  );
};