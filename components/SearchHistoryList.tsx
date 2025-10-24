import React from 'react';

interface SearchHistoryListProps {
  history: string[];
  onItemClick: (query: string) => void;
  onItemDelete: (query: string) => void;
  onClearAll: () => void;
}

export const SearchHistoryList: React.FC<SearchHistoryListProps> = ({ history, onItemClick, onItemDelete, onClearAll }) => {
    if (history.length === 0) {
        return null;
    }

    return (
        <div 
            className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-30 overflow-hidden animate-fade-in-down"
            style={{'--animation-duration': '200ms'} as React.CSSProperties}
        >
            <div className="flex justify-between items-center p-2 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 px-2">Recent Searches</h3>
                <button onClick={onClearAll} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded">Clear All</button>
            </div>
            <ul className="py-1 max-h-60 overflow-y-auto">
                {history.map(item => (
                    <li key={item} className="flex items-center justify-between group hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150">
                        <button onClick={() => onItemClick(item)} className="flex items-center w-full text-left px-4 py-2">
                             <svg className="h-4 w-4 mr-3 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm text-gray-700 dark:text-gray-200 truncate">{item}</span>
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onItemDelete(item); }} 
                            className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 mr-2 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            aria-label={`Remove "${item}" from history`}
                        >
                            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </li>
                ))}
            </ul>
            <style>{`
                @keyframes fade-in-down {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-down {
                    animation: fade-in-down var(--animation-duration, 300ms) ease-out;
                }
            `}</style>
        </div>
    );
};
