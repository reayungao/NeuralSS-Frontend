import { registerPlugin, WebPlugin, PluginListenerHandle } from '@capacitor/core';
import type { AnalyzedScreenshot } from './types';

export interface ExtractedEntities {
  urls: string[];
  emails: string[];
  phoneNumbers: string[];
}

/**
 * V3: A structured response for analysis, allowing for robust error handling and rich data extraction.
 */
export interface AnalysisResult {
  description: string | null;
  text?: string | null; // Full text from OCR
  entities?: ExtractedEntities | null;
  category?: string | null;
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
   * Analyzes a batch of screenshot images from their native file URIs.
   * @param options - An object containing an array of native file URIs.
   * @returns A promise that resolves with an array of structured analysis results. The order of results should match the order of input URIs.
   */
  analyzeBatch(options: { imageUris: string[] }): Promise<AnalysisResult[]>;

  /**
   * Performs a semantic search across the screenshot database using an AI model.
   * The implementation of this should be on the native side.
   * @param options - An object containing the user's search query.
   * @returns A promise that resolves with an array of screenshot IDs that match the query.
   */
  performSearch(options: { query: string }): Promise<{ screenshotIds: string[] }>;

  /**
   * Adds a batch of analyzed screenshots to the native search index.
   * @param options - An object containing an array of fully analyzed screenshot objects.
   * @returns A promise that resolves when the items have been added.
   */
  addToSearchIndex(options: { items: AnalyzedScreenshot[] }): Promise<void>;

  /**
   * Removes a batch of screenshots from the native search index by their IDs.
   * @param options - An object containing an array of screenshot IDs.
   * @returns A promise that resolves when the items have been removed.
   */
  removeFromSearchIndex(options: { ids: string[] }): Promise<void>;

  /**
   * Cancels any ongoing analysis tasks in the native layer.
   * @returns A promise that resolves when the cancellation command has been acknowledged.
   */
  cancelAnalysis(): Promise<void>;

  /**
   * Attaches a listener to the plugin for native events.
   * @param eventName The name of the event to listen for (e.g., 'screenshotAdded').
   * @param listenerFunc The function to execute when the event is emitted.
   * @returns A promise that resolves to a handle that can be used to remove the listener.
   */
  addListener(eventName: string, listenerFunc: (...args: any[]) => any): Promise<PluginListenerHandle>;
}

// Web implementation (mock for V3)
class OnDeviceAIWeb extends WebPlugin implements OnDeviceAIPlugin {
  private screenshots: { id: string, description: string }[] = [];
  private isAnalyzing = false;

  async initialize(): Promise<void> {
    console.warn('[WEB MOCK] OnDeviceAI.initialize() called. This is a mock implementation for web development.');
    return Promise.resolve();
  }
  
  async analyze(options: { imageUri: string }): Promise<AnalysisResult> {
      console.warn(`[WEB MOCK] OnDeviceAI.analyze() called for image URI: ${options.imageUri}. Returning dummy data.`);
      const mockDescription = `This is a mock analysis that simulates identifying content in a screenshot of a travel booking. The real AI analysis only runs on a native Android device.`;
      const mockText = `Booking Confirmation\nFlight to London\nCheck flight status at https://example.com/flights/123\nContact support@example.com for help.`;
      const mockEntities: ExtractedEntities = {
          urls: ['https://example.com/flights/123'],
          emails: ['support@example.com'],
          phoneNumbers: [],
      };
      
      const id = options.imageUri.split('/').pop()!;
      // Avoid duplicates in mock search
      if (!this.screenshots.some(s => s.id === id)) {
        this.screenshots.push({ id, description: mockDescription });
      }

      return Promise.resolve({ 
          description: mockDescription, 
          text: mockText,
          entities: mockEntities,
          category: 'Travel',
          error: null 
      });
  }

  async analyzeBatch(options: { imageUris: string[] }): Promise<AnalysisResult[]> {
    console.warn(`[WEB MOCK] OnDeviceAI.analyzeBatch() called for ${options.imageUris.length} images. Returning dummy data.`);
    this.isAnalyzing = true;
    const results: AnalysisResult[] = [];
    for (const uri of options.imageUris) {
        if (!this.isAnalyzing) {
            console.warn('[WEB MOCK] Analysis was cancelled.');
            throw { code: 'E_CANCELLED', message: 'The analysis was cancelled by the user.' };
        }
        await new Promise(resolve => setTimeout(resolve, 150)); // Simulate work
        const result = await this.analyze({ imageUri: uri });
        results.push(result);
    }
    this.isAnalyzing = false;
    return results;
  }

  async performSearch(options: { query: string }): Promise<{ screenshotIds: string[] }> {
    console.warn(`[WEB MOCK] OnDeviceAI.performSearch() called with query: "${options.query}". Returning mock results.`);
    const queryWords = options.query.toLowerCase().split(' ');
    const matchingIds = this.screenshots
        .filter(s => queryWords.some(word => s.description.toLowerCase().includes(word)))
        .map(s => s.id);
    
    return Promise.resolve({ screenshotIds: matchingIds.slice(0, 10) });
  }
  
  async addToSearchIndex(options: { items: AnalyzedScreenshot[] }): Promise<void> {
      console.warn(`[WEB MOCK] Adding ${options.items.length} items to the search index.`);
      // Mock implementation can just log, actual logic is native
      return Promise.resolve();
  }
  
  async removeFromSearchIndex(options: { ids: string[] }): Promise<void> {
      console.warn(`[WEB MOCK] Removing ${options.ids.length} items from the search index.`);
      // Mock implementation can just log
      return Promise.resolve();
  }

  async cancelAnalysis(): Promise<void> {
      console.warn('[WEB MOCK] cancelAnalysis() called.');
      this.isAnalyzing = false;
      return Promise.resolve();
  }

  async addListener(eventName: string, listenerFunc: (...args: any[]) => any): Promise<PluginListenerHandle> {
    console.warn(`[WEB MOCK] OnDeviceAI.addListener called for event: ${eventName}. Web does not emit native events.`);
    return super.addListener(eventName, listenerFunc);
  }
}

const OnDeviceAI = registerPlugin<OnDeviceAIPlugin>('OnDeviceAI', {
  web: () => new OnDeviceAIWeb(),
});

export default OnDeviceAI;