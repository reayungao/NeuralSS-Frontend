import { Preferences } from '@capacitor/preferences';
import type { Screenshot } from '../types';

const SCREENSHOTS_STORAGE_KEY = 'analyzed_screenshots';
const SEARCH_HISTORY_KEY = 'search_history';

/**
 * Saves the entire list of analyzed screenshots to the device's persistent storage.
 * @param screenshots - The array of Screenshot objects to save.
 */
export const saveScreenshots = async (screenshots: Screenshot[]): Promise<void> => {
  try {
    await Preferences.set({
      key: SCREENSHOTS_STORAGE_KEY,
      value: JSON.stringify(screenshots),
    });
  } catch (error) {
    console.error('Failed to save screenshots to storage:', error);
  }
};

/**
 * Loads the list of analyzed screenshots from the device's persistent storage.
 * @returns A promise that resolves to an array of Screenshot objects, or an empty array if none are found or an error occurs.
 */
export const loadScreenshots = async (): Promise<Screenshot[]> => {
  try {
    const { value } = await Preferences.get({ key: SCREENSHOTS_STORAGE_KEY });
    if (value) {
      const screenshots: Screenshot[] = JSON.parse(value);
      // Ensure all screenshots have a creationTime for backward compatibility
      return screenshots.map(s => ({ ...s, creationTime: s.creationTime || 0 }));
    }
    return [];
  } catch (error) {
    console.error('Failed to load screenshots from storage:', error);
    return [];
  }
};

/**
 * Saves the user's search history to persistent storage.
 * @param history - An array of search query strings.
 */
export const saveSearchHistory = async (history: string[]): Promise<void> => {
    try {
        await Preferences.set({
            key: SEARCH_HISTORY_KEY,
            value: JSON.stringify(history),
        });
    } catch (error) {
        console.error('Failed to save search history:', error);
    }
};

/**
 * Loads the user's search history from persistent storage.
 * @returns A promise that resolves to an array of search query strings.
 */
export const loadSearchHistory = async (): Promise<string[]> => {
    try {
        const { value } = await Preferences.get({ key: SEARCH_HISTORY_KEY });
        return value ? JSON.parse(value) : [];
    } catch (error) {
        console.error('Failed to load search history:', error);
        return [];
    }
};
