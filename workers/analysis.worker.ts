import { analyzeScreenshotOnDevice } from '../services/onDeviceAiService';
import type { ScreenshotFile } from '../services/androidService';
import type { Screenshot } from '../types';
import { Capacitor } from '@capacitor/core';

self.onmessage = async (event: MessageEvent<ScreenshotFile[]>) => {
  const filesToProcess = event.data;
  const total = filesToProcess.length;

  for (let i = 0; i < total; i++) {
    const file = filesToProcess[i];
    try {
      const result = await analyzeScreenshotOnDevice(file.uri);
      if (result.error || !result.description) {
        console.error(`Failed to analyze ${file.name}: ${result.error}`);
        // Optionally post an error message back for this specific file
        self.postMessage({ type: 'progress', data: { progress: i + 1, total } });
        continue;
      }
      
      const analyzedScreenshot: Screenshot = {
        id: file.name,
        uri: file.uri,
        webPath: Capacitor.convertFileSrc(file.uri),
        thumbnailWebPath: file.thumbnailUri ? Capacitor.convertFileSrc(file.thumbnailUri) : undefined,
        description: result.description,
        text: result.text,
        entities: result.entities,
        category: result.category,
        name: file.name,
        creationTime: file.mtime,
      };
      
      self.postMessage({ type: 'result', data: analyzedScreenshot });

    } catch (e: any) {
      console.error(`Critical error analyzing ${file.name}:`, e);
      self.postMessage({ type: 'error', data: { message: `Failed to process ${file.name}: ${e.message}` } });
    } finally {
       self.postMessage({ type: 'progress', data: { progress: i + 1, total } });
    }
  }

  self.postMessage({ type: 'complete' });
};
