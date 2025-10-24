import OnDeviceAI, { AnalysisResult } from '../onDeviceAiPlugin';

let isInitialized = false;

/**
 * Initializes the on-device AI model via the native plugin.
 * Ensures the model is only initialized once.
 */
export const initializeOnDeviceModel = async (): Promise<void> => {
  if (isInitialized) {
    console.log("On-device model already initialized.");
    return;
  }
  try {
    await OnDeviceAI.initialize();
    isInitialized = true;
    console.log("On-device model successfully initialized.");
  } catch (error) {
    console.error("Failed to initialize on-device model:", error);
    throw new Error("Could not initialize AI model. The app may not function correctly.");
  }
};

/**
 * Analyzes a screenshot using the native on-device model via its file URI.
 * @param uri The native file URI of the screenshot.
 * @returns A promise that resolves to a structured analysis result object.
 */
export const analyzeScreenshotOnDevice = async (uri: string): Promise<AnalysisResult> => {
  if (!isInitialized) {
    throw new Error("AI model is not initialized. Cannot perform analysis.");
  }
  try {
    const result = await OnDeviceAI.analyze({ imageUri: uri });
    return result;
  } catch (error: any) {
    console.error("On-device analysis failed:", error);
    // Return a structured error that conforms to the AnalysisResult interface
    return {
      description: null,
      error: error.message || "An unknown error occurred during analysis."
    };
  }
};