import { Preferences } from '@capacitor/preferences';
import type { Screenshot } from '../types';

// V2 Storage Keys
const INDEX_KEY = 'ssmeta_index_v2';
const META_PREFIX = 'ssmeta_';

// V1 (Legacy) Storage Key for migration
const LEGACY_SCREENSHOTS_KEY = 'analyzed_screenshots';

const SEARCH_HISTORY_KEY = 'search_history';


/**
 * Performs a one-time migration from the old, single-JSON storage format
 * to the new, granular key-value format.
 */
const migrateV1Storage = async (): Promise<Screenshot[] | null> => {
    const { value } = await Preferences.get({ key: LEGACY_SCREENSHOTS_KEY });
    if (!value) {
        return null; // No old data to migrate
    }

    console.log("Migrating legacy screenshot storage...");
    try {
        const screenshots: Screenshot[] = JSON.parse(value);
        if (Array.isArray(screenshots) && screenshots.length > 0) {
            const ids = screenshots.map(s => s.id);
            const multiSetPromises = screenshots.map(s => 
                Preferences.set({
                    key: `${META_PREFIX}${s.id}`,
                    value: JSON.stringify(s)
                })
            );
            await Promise.all(multiSetPromises);

            await Preferences.set({ key: INDEX_KEY, value: JSON.stringify(ids) });
            await Preferences.remove({ key: LEGACY_SCREENSHOTS_KEY });

            console.log(`Migration successful. Migrated ${screenshots.length} screenshots.`);
            return screenshots;
        } else {
             // If data is invalid, just remove it.
             await Preferences.remove({ key: LEGACY_SCREENSHOTS_KEY });
             return [];
        }
    } catch (error) {
        console.error("Failed to migrate legacy storage, data may be lost.", error);
        await Preferences.remove({ key: LEGACY_SCREENSHOTS_KEY });
        return [];
    }
};

/**
 * Loads the list of analyzed screenshots from the device's persistent storage.
 * Uses a granular key-per-screenshot approach for performance.
 * @returns A promise that resolves to an array of Screenshot objects.
 */
export const loadScreenshots = async (): Promise<Screenshot[]> => {
    // First, check if migration is needed.
    const migratedData = await migrateV1Storage();
    if (migratedData !== null) {
        // Ensure all screenshots have a creationTime for backward compatibility
        return migratedData.map(s => ({ ...s, creationTime: s.creationTime || 0 }));
    }

    try {
        const { value: indexValue } = await Preferences.get({ key: INDEX_KEY });
        if (!indexValue) {
            return [];
        }

        const ids: string[] = JSON.parse(indexValue);
        if (ids.length === 0) {
            return [];
        }

        const screenshots: Screenshot[] = [];
        for (const id of ids) {
            const { value } = await Preferences.get({ key: `${META_PREFIX}${id}` });
            if (value) {
                const screenshot = JSON.parse(value);
                // Ensure all screenshots have a creationTime for backward compatibility
                screenshots.push({ ...screenshot, creationTime: screenshot.creationTime || 0 });
            }
        }
        
        return screenshots;
    } catch (error) {
        console.error('Failed to load screenshots from storage:', error);
        return [];
    }
};

/**
 * Adds or updates a list of screenshots in storage.
 * @param screenshots - The array of Screenshot objects to add/update.
 */
export const addScreenshots = async (screenshots: Screenshot[]): Promise<void> => {
  if (screenshots.length === 0) return;

  try {
    const { value: indexValue } = await Preferences.get({ key: INDEX_KEY });
    const ids: string[] = indexValue ? JSON.parse(indexValue) : [];
    const idSet = new Set(ids);

    const newIds = screenshots.map(s => s.id).filter(id => !idSet.has(id));

    const multiSetPromises = screenshots.map(s => 
        Preferences.set({
            key: `${META_PREFIX}${s.id}`,
            value: JSON.stringify(s)
        })
    );
    await Promise.all(multiSetPromises);
    
    if (newIds.length > 0) {
        const newIndex = [...ids, ...newIds];
        await Preferences.set({ key: INDEX_KEY, value: JSON.stringify(newIndex) });
    }

  } catch (error) {
    console.error('Failed to add screenshots to storage:', error);
  }
};

/**
 * Removes a list of screenshots from storage by their IDs.
 * @param ids - The array of screenshot IDs to remove.
 */
export const removeScreenshots = async (idsToRemove: string[]): Promise<void> => {
    if (idsToRemove.length === 0) return;

    try {
        const { value: indexValue } = await Preferences.get({ key: INDEX_KEY });
        if (!indexValue) return;

        const ids: string[] = JSON.parse(indexValue);
        const newIndex = ids.filter(id => !idsToRemove.includes(id));
        
        const multiRemovePromises = idsToRemove.map(id =>
            Preferences.remove({ key: `${META_PREFIX}${id}` })
        );
        await Promise.all(multiRemovePromises);

        await Preferences.set({ key: INDEX_KEY, value: JSON.stringify(newIndex) });

    } catch (error) {
        console.error('Failed to remove screenshots from storage:', error);
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
