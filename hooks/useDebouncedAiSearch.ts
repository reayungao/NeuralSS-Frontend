import { useState, useEffect } from 'react';
import { performAiSearch } from '../services/onDeviceAiService';
import { useSearch } from '../contexts/SearchContext';
import { SEARCH_DEBOUNCE_MS } from '../config';

interface UseDebouncedAiSearchOptions {
  searchQuery: string;
  onSearchStart: (query: string) => void;
}

export const useDebouncedAiSearch = ({ searchQuery, onSearchStart }: UseDebouncedAiSearchOptions) => {
  const { setAiSearchResults } = useSearch();
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    const query = searchQuery.trim();

    if (!query) {
      setAiSearchResults(null);
      setIsAiSearching(false);
      setError(null);
      return;
    }

    setIsAiSearching(true);
    setError(null);
    setAiSearchResults(null); // Clear previous results to fall back to local search initially

    const timeoutId = setTimeout(async () => {
      onSearchStart(query); // Callback to update search history
      try {
        const result = await performAiSearch(query);
        if (!isCancelled) {
          setAiSearchResults(result.screenshotIds);
        }
      } catch (e: any) {
        if (!isCancelled) {
          setError(e.message || "AI search failed.");
          setAiSearchResults(null); // Ensure fallback to local on error
        }
      } finally {
        if (!isCancelled) {
          setIsAiSearching(false);
        }
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
      isCancelled = true;
    };
  }, [searchQuery, onSearchStart, setAiSearchResults]);

  return { isAiSearching, error };
};
