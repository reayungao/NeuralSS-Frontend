import { registerPlugin, WebPlugin } from '@capacitor/core';

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
   * Analyzes a single screenshot image from a native file URI.
   * This is the preferred method for performance and memory efficiency.
   * @param options - An object containing the native file URI of the image.
   * @returns A promise that resolves with a structured analysis result.
   */
  analyze(options: { imageUri: string }): Promise<AnalysisResult>;

  /**
   * Performs a semantic search across the screenshot database using an AI model.
   * The implementation of this should be on the native side.
   * @param options - An object containing the user's search query.
   * @returns A promise that resolves with an array of screenshot IDs that match the query.
   */
  performSearch(options: { query: string }): Promise<{ screenshotIds: string[] }>;
}

// Web implementation (mock for V3)
class OnDeviceAIWeb extends WebPlugin implements OnDeviceAIPlugin {
  private screenshots: { id: string, description: string }[] = [];

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

    // Store a reference for mock search
    this.screenshots.push({ id: options.imageUri.split('/').pop()!, description: mockDescription });

    return Promise.resolve({ 
        description: mockDescription, 
        text: mockText,
        entities: mockEntities,
        category: 'Travel',
        error: null 
    });
  }

  async performSearch(options: { query: string }): Promise<{ screenshotIds: string[] }> {
    console.warn(`[WEB MOCK] OnDeviceAI.performSearch() called with query: "${options.query}". Returning mock results.`);
    // A very simple mock search: returns any screenshot whose description contains a word from the query.
    const queryWords = options.query.toLowerCase().split(' ');
    const matchingIds = this.screenshots
        .filter(s => queryWords.some(word => s.description.toLowerCase().includes(word)))
        .map(s => s.id);
    
    // In a real scenario, this would return all IDs if the query is broad.
    // Here we'll just return a subset to make the mock feel more realistic.
    return Promise.resolve({ screenshotIds: matchingIds.slice(0, 5) });
  }
}

const OnDeviceAI = registerPlugin<OnDeviceAIPlugin>('OnDeviceAI', {
  web: () => new OnDeviceAIWeb(),
});

export default OnDeviceAI;