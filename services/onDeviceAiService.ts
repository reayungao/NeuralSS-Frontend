import OnDeviceAI, { AnalysisResult } from '../onDeviceAiPlugin';
import type { AnalyzedScreenshot, NativeError } from '../types';
import { isNativeError } from '../types';

let initializationPromise: Promise<void> | null = null;

const formatError = (error: any, defaultMessage: string): NativeError => {
    if (isNativeError(error)) {
        return error;
    }
    return {
        code: 'E_UNKNOWN',
        message: error?.message || defaultMessage
    };
};

/**
 * Initializes the on-device AI model via the native plugin.
 * Uses a promise-based approach to ensure the model is only initialized once
 * and that concurrent calls await the same initialization process.
 */
export const initializeOnDeviceModel = (): Promise<void> => {
  if (initializationPromise) {
    console.log("On-device model initialization already in progress or completed.");
    return initializationPromise;
  }
  
  console.log("Starting on-device model initialization...");
  initializationPromise = new Promise(async (resolve, reject) => {
    try {
      await OnDeviceAI.initialize();
      console.log("On-device model successfully initialized.");
      resolve();
    } catch (error) {
      console.error("Failed to initialize on-device model:", error);
      initializationPromise = null; // Reset on failure to allow retries
      reject(formatError(error, "Could not initialize AI model. The app may not function correctly."));
    }
  });

  return initializationPromise;
};


/**
 * Analyzes a batch of screenshots using the native on-device model via their file URIs.
 * This is the preferred method for performance.
 * @param uris An array of native file URIs of the screenshots.
 * @returns A promise that resolves to an array of structured analysis result objects.
 */
export const analyzeScreenshotsInBatch = async (uris: string[]): Promise<AnalysisResult[]> => {
  if (!initializationPromise) {
    throw { code: 'E_NOT_INITIALIZED', message: "AI model is not initialized. Cannot perform analysis."};
  }
  await initializationPromise; // Ensure initialization is complete before proceeding

  if (uris.length === 0) {
      return [];
  }

  try {
    const results = await OnDeviceAI.analyzeBatch({ imageUris: uris });
    return results;
  } catch (error: any) {
    console.error("On-device batch analysis failed:", error);
    const formattedError = formatError(error, "An unknown error occurred during batch analysis.");
    // Propagate a single error for the whole batch
    throw formattedError;
  }
};


/**
 * Performs a semantic search using the on-device AI model.
 * @param query The user's search query string.
 * @returns A promise that resolves to an array of matching screenshot IDs.
 */
export const performAiSearch = async (query: string): Promise<{ screenshotIds: string[] }> => {
    if (!initializationPromise) {
       throw { code: 'E_NOT_INITIALIZED', message: "AI model is not initialized. Cannot perform search."};
    }
    await initializationPromise; // Ensure initialization is complete

    try {
        const result = await OnDeviceAI.performSearch({ query });
        return result;
    } catch (error: any) {
        console.error("On-device AI search failed:", error);
        throw formatError(error, "An unknown error occurred during AI search.");
    }
};

/**
 * Adds analyzed screenshots to the native search index.
 * @param items An array of analyzed screenshot objects.
 */
export const addToSearchIndex = async (items: AnalyzedScreenshot[]): Promise<void> => {
    if (items.length === 0) return;
    try {
        await OnDeviceAI.addToSearchIndex({ items });
    } catch (error) {
        console.error("Failed to add items to search index:", error);
        // This is a background task, so we log the error but don't throw to avoid UI disruption.
    }
};

/**
 * Removes screenshots from the native search index.
 * @param ids An array of screenshot IDs to remove.
 */
export const removeFromSearchIndex = async (ids: string[]): Promise<void> => {
    if (ids.length === 0) return;
    try {
        await OnDeviceAI.removeFromSearchIndex({ ids });
    } catch (error) {
        console.error("Failed to remove items from search index:", error);
    }
};

/**
 * Requests cancellation of the current native analysis task.
 */
export const cancelCurrentAnalysis = async (): Promise<void> => {
    try {
        await OnDeviceAI.cancelAnalysis();
    } catch(error) {
        console.error("Failed to send cancellation request:", error);
    }
};