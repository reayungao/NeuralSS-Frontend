import { Preferences } from '@capacitor/preferences';
import type { Screenshot } from '../types';

const SCREENSHOTS_STORAGE_KEY = 'analyzed_screenshots';

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
