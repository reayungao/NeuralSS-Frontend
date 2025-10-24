import OnDeviceAI from '../onDeviceAiPlugin';

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
 * Analyzes a screenshot using the native on-device model.
 * @param dataUrl The base64 data URL of the screenshot.
 * @returns A promise that resolves to the AI-generated description.
 */
export const analyzeScreenshotOnDevice = async (dataUrl: string): Promise<string> => {
  if (!isInitialized) {
    throw new Error("AI model is not initialized. Cannot perform analysis.");
  }
  try {
    const result = await OnDeviceAI.analyze({ imageDataUrl: dataUrl });
    return result.description;
  } catch (error) {
    console.error("On-device analysis failed:", error);
    // Return a user-friendly error description
    return "AI analysis failed for this image.";
  }
};
