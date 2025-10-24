
import React from 'react';

interface LoaderProps {
  progress: number;
  total: number;
}

export const Loader: React.FC<LoaderProps> = ({ progress, total }) => {
  const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex flex-col items-center justify-center z-50">
      <div className="flex items-center space-x-3 text-white text-xl mb-4">
        <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Analyzing screenshots...</span>
      </div>
      {total > 0 && (
        <div className="w-1/3 bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
        </div>
      )}
      <p className="text-white mt-2">{`Processing ${progress} of ${total}`}</p>
    </div>
  );
};
