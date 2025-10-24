import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { saveSearchHistory, loadSearchHistory } from '../services/storageService';
import type { Screenshot } from '../types';
import { SEARCH_HISTORY_LIMIT } from '../config';

interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchHistory: string[];
  aiSearchResults: string[] | null;
  setAiSearchResults: (results: string[] | null) => void;
  filteredScreenshots: Screenshot[];
  updateSearchHistory: (query: string) => void;
  deleteSearchHistoryItem: (item: string) => void;
  clearSearchHistory: () => void;
  // FIX: Add internal function to the context type to resolve type error in useSearch hook.
  _useFilteredScreenshots: (screenshots: Screenshot[]) => Screenshot[];
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [aiSearchResults, setAiSearchResults] = useState<string[] | null>(null);

  // Load initial search history
  useEffect(() => {
    const loadHistory = async () => {
      const storedHistory = await loadSearchHistory();
      setSearchHistory(storedHistory);
    };
    loadHistory();
  }, []);
  
  const updateSearchHistory = useCallback((newQuery: string) => {
    const trimmedQuery = newQuery.trim();
    if (trimmedQuery.length < 3) return;

    setSearchHistory(prevHistory => {
        const updatedHistory = [trimmedQuery, ...prevHistory.filter(h => h.toLowerCase() !== trimmedQuery.toLowerCase())].slice(0, SEARCH_HISTORY_LIMIT);
        saveSearchHistory(updatedHistory);
        return updatedHistory;
    });
  }, []);

  const deleteSearchHistoryItem = useCallback(async (itemToDelete: string) => {
    const updatedHistory = searchHistory.filter(item => item !== itemToDelete);
    setSearchHistory(updatedHistory);
    await saveSearchHistory(updatedHistory);
  }, [searchHistory]);

  const clearSearchHistory = useCallback(async () => {
      setSearchHistory([]);
      await saveSearchHistory([]);
  }, []);

  // This function is passed to useSearch to get the screenshots from the other context.
  // This is a form of dependency injection to keep contexts decoupled.
  const useFilteredScreenshots = (screenshots: Screenshot[]): Screenshot[] => {
    const displayedScreenshots = useMemo(() => {
      const lowercasedQuery = searchQuery.toLowerCase();
      const localResults = searchQuery.trim() === ''
        ? screenshots
        : screenshots.filter(s =>
            s.description.toLowerCase().includes(lowercasedQuery) ||
            (s.text && s.text.toLowerCase().includes(lowercasedQuery)) ||
            s.name.toLowerCase().includes(lowercasedQuery)
          );

      if (!aiSearchResults) {
        return localResults;
      }

      const aiResultOrder = new Map(aiSearchResults.map((id, index) => [id, index]));
      const reRankedResults = [...localResults].sort((a, b) => {
          const aIsInAi = aiResultOrder.has(a.id);
          const bIsInAi = aiResultOrder.has(b.id);
          
          if (aIsInAi && bIsInAi) {
              return aiResultOrder.get(a.id)! - aiResultOrder.get(b.id)!;
          }
          if (aIsInAi) return -1;
          if (bIsInAi) return 1;
          return 0;
      });

      return reRankedResults;
    }, [screenshots, searchQuery, aiSearchResults]);

    const sortedScreenshots = useMemo(() => {
      return [...displayedScreenshots].sort((a, b) => b.creationTime - a.creationTime);
    }, [displayedScreenshots]);

    return sortedScreenshots;
  };
  
  // The value provided by the context will include a function that needs the screenshots array.
  // The consumer hook `useSearch` will be responsible for passing it.
  const value: SearchContextType = {
    searchQuery,
    setSearchQuery,
    searchHistory,
    aiSearchResults,
    setAiSearchResults,
    filteredScreenshots: [] as Screenshot[], // Placeholder, will be replaced in the hook
    updateSearchHistory,
    deleteSearchHistoryItem,
    clearSearchHistory,
    // Expose the filtering logic to the hook
    _useFilteredScreenshots: useFilteredScreenshots
  };

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
};

// Custom hook to consume the context and inject dependencies
export const useSearch = (screenshots?: Screenshot[]): Omit<SearchContextType, '_useFilteredScreenshots'> & { filteredScreenshots: Screenshot[] } => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  
  // The hook receives the screenshots and uses the context's internal logic to compute the filtered list
  const filteredScreenshots = context._useFilteredScreenshots(screenshots || []);

  return { ...context, filteredScreenshots };
};
