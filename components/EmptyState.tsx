import React from 'react';

export const EmptyState: React.FC = () => {
  return (
    <div className="text-center flex flex-col items-center justify-center py-20 px-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">Your gallery is empty</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Take a screenshot, and it will appear here ready for AI analysis.</p>
    </div>
  );
};
