import { registerPlugin, WebPlugin } from '@capacitor/core';

export interface OnDeviceAIPlugin {
  /**
   * Initializes the on-device AI model.
   * This should be called once when the app starts.
   * It handles downloading and preparing the model for inference.
   * @returns A promise that resolves when the model is ready.
   */
  initialize(): Promise<void>;

  /**
   * Analyzes a single screenshot image.
   * @param options - An object containing the base64 data URL of the image.
   * @returns A promise that resolves with the AI-generated description string.
   */
  analyze(options: { imageDataUrl: string }): Promise<{ description: string }>;
}

// Web implementation (mock)
class OnDeviceAIWeb extends WebPlugin implements OnDeviceAIPlugin {
  async initialize(): Promise<void> {
    console.warn('[WEB MOCK] OnDeviceAI.initialize() called. This is a mock implementation for web development.');
    return Promise.resolve();
  }

  async analyze(options: { imageDataUrl: string }): Promise<{ description: string }> {
    console.warn(`[WEB MOCK] OnDeviceAI.analyze() called for image. Returning dummy data.`);
    const mockDescription = `This is a mock analysis for the web. The real AI analysis only runs on a native Android device.`;
    return Promise.resolve({ description: mockDescription });
  }
}

const OnDeviceAI = registerPlugin<OnDeviceAIPlugin>('OnDeviceAI', {
  web: () => new OnDeviceAIWeb(),
});

export default OnDeviceAI;
