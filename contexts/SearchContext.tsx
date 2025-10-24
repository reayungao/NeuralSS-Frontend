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
  updateSearchHistory: (query: string) => void;
  deleteSearchHistoryItem: (item: string) => void;
  clearSearchHistory: () => void;
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

  const value: SearchContextType = {
    searchQuery,
    setSearchQuery,
    searchHistory,
    aiSearchResults,
    setAiSearchResults,
    updateSearchHistory,
    deleteSearchHistoryItem,
    clearSearchHistory,
  };

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
};

// Custom hook to consume the context and perform filtering
export const useSearch = (screenshots: Screenshot[] = []): SearchContextType & { filteredScreenshots: Screenshot[] } => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  
  const { searchQuery, aiSearchResults } = context;

  // The filtering logic is now correctly placed inside this custom hook.
  const filteredScreenshots = useMemo(() => {
    const lowercasedQuery = searchQuery.toLowerCase().trim();
    
    // Start with all screenshots if no query, or apply local text search
    const localResults = lowercasedQuery === ''
      ? screenshots
      : screenshots.filter(s =>
          s.description.toLowerCase().includes(lowercasedQuery) ||
          (s.text && s.text.toLowerCase().includes(lowercasedQuery)) ||
          s.name.toLowerCase().includes(lowercasedQuery)
        );

    // If there are no AI results, return locally filtered and sorted results
    if (!aiSearchResults) {
      return [...localResults].sort((a, b) => b.creationTime - a.creationTime);
    }

    // If there are AI results, re-rank the locally filtered results
    const aiResultOrder = new Map(aiSearchResults.map((id, index) => [id, index]));
    const reRankedResults = [...localResults].sort((a, b) => {
        const aIsInAi = aiResultOrder.has(a.id);
        const bIsInAi = aiResultOrder.has(b.id);
        
        // Primary sort: AI ranked items first, in their ranked order
        if (aIsInAi && bIsInAi) {
            return aiResultOrder.get(a.id)! - aiResultOrder.get(b.id)!;
        }
        if (aIsInAi) return -1; // a comes first
        if (bIsInAi) return 1;  // b comes first

        // Secondary sort: for items not in AI results, sort by creation time
        return b.creationTime - a.creationTime;
    });

    return reRankedResults;
  }, [screenshots, searchQuery, aiSearchResults]);

  return { ...context, filteredScreenshots };
};