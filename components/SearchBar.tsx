import React, { useState } from 'react';
import { SearchHistoryList } from './SearchHistoryList';
import { useSearch } from '../contexts/SearchContext';
import { useDebouncedAiSearch } from '../hooks/useDebouncedAiSearch';

interface SearchBarProps {
  disabled: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ disabled }) => {
  const { 
    searchQuery, 
    setSearchQuery, 
    searchHistory, 
    clearSearchHistory, 
    deleteSearchHistoryItem, 
    updateSearchHistory 
  } = useSearch();
  
  const [isFocused, setIsFocused] = useState(false);

  const { isAiSearching, error: searchError } = useDebouncedAiSearch({
    searchQuery,
    onSearchStart: updateSearchHistory,
  });

  const handleClearInput = () => {
    setSearchQuery('');
  };
  
  const handleHistorySelection = (query: string) => {
    setSearchQuery(query);
    setIsFocused(false); // Hide history after selection
  };

  const handleBlur = () => {
    // Delay hiding the history to allow click events on the list to register
    setTimeout(() => {
        setIsFocused(false);
    }, 200);
  };

  const showHistory = isFocused && searchQuery.length === 0 && searchHistory.length > 0;

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
        </svg>
      </div>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder="Search with AI..."
        className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
      />
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center space-x-2">
        {isAiSearching && (
           <svg className="h-5 w-5 animate-spin text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        )}
        {searchQuery && !isAiSearching && (
          <button
            type="button"
            onClick={handleClearInput}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Clear search"
          >
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
       {searchError && (
              <div className="absolute top-full mt-2 text-xs text-red-600 dark:text-red-400" role="alert">
                  {searchError}
              </div>
        )}

      {showHistory && (
        <SearchHistoryList
          history={searchHistory}
          onItemClick={handleHistorySelection}
          onItemDelete={deleteSearchHistoryItem}
          onClearAll={clearSearchHistory}
        />
      )}
    </div>
  );
};
