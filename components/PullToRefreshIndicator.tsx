import React from 'react';
import { PULL_TO_REFRESH_THRESHOLD } from '../config';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
}

export const PullToRefreshIndicator: React.FC<PullToRefreshIndicatorProps> = ({ pullDistance, isRefreshing }) => {
  const isReadyToRefresh = pullDistance > PULL_TO_REFRESH_THRESHOLD;
  const opacity = isRefreshing ? 1 : Math.min(pullDistance / PULL_TO_REFRESH_THRESHOLD, 1);
  const indicatorRotation = isReadyToRefresh ? 'rotate-180' : 'rotate-0';

  return (
    <div
      className="absolute top-0 left-0 right-0 flex items-center justify-center pt-4 pb-12 text-gray-500 dark:text-gray-400"
      style={{ 
        opacity,
        transform: `translateY(-100%)`
      }}
      aria-hidden="true"
    >
      <div className="relative h-8 w-8">
        {isRefreshing ? (
          <svg className="absolute inset-0 animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg className={`absolute inset-0 h-8 w-8 transform transition-transform duration-200 ${indicatorRotation}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        )}
      </div>
    </div>
  );
};
