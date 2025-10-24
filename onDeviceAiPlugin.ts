import { registerPlugin, WebPlugin } from '@capacitor/core';

/**
 * V2: A structured response for analysis, allowing for robust error handling.
 */
export interface AnalysisResult {
  description: string | null;
  error: string | null; // e.g., "FileReadError", "InferenceFailed", "ModelNotInitialized"
}

export interface OnDeviceAIPlugin {
  /**
   * Initializes the on-device AI model.
   * This should be called once when the app starts.
   * It handles downloading and preparing the model for inference.
   * @returns A promise that resolves when the model is ready.
   */
  initialize(): Promise<void>;

  /**
   * Analyzes a single screenshot image from a native file URI.
   * This is the preferred method for performance and memory efficiency.
   * @param options - An object containing the native file URI of the image.
   * @returns A promise that resolves with a structured analysis result.
   */
  analyze(options: { imageUri: string }): Promise<AnalysisResult>;
}

// Web implementation (mock for V2)
class OnDeviceAIWeb extends WebPlugin implements OnDeviceAIPlugin {
  async initialize(): Promise<void> {
    console.warn('[WEB MOCK] OnDeviceAI.initialize() called. This is a mock implementation for web development.');
    return Promise.resolve();
  }

  async analyze(options: { imageUri: string }): Promise<AnalysisResult> {
    console.warn(`[WEB MOCK] OnDeviceAI.analyze() called for image URI: ${options.imageUri}. Returning dummy data.`);
    const mockDescription = `This is a mock analysis for the web. The real AI analysis only runs on a native Android device.`;
    // On success, the error is null.
    return Promise.resolve({ description: mockDescription, error: null });
  }
}

const OnDeviceAI = registerPlugin<OnDeviceAIPlugin>('OnDeviceAI', {
  web: () => new OnDeviceAIWeb(),
});

export default OnDeviceAI;