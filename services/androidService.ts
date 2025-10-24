import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, FileInfo } from '@capacitor/filesystem';

/**
 * Represents a single screenshot file found on the device's filesystem.
 */
export interface ScreenshotFile {
  name: string; // e.g., "Screenshot_20230101-120000.png"
  uri: string; // Native file path URI
  mtime: number; // Last modification time as a Unix timestamp (milliseconds)
  thumbnailUri?: string; // Optional URI for a smaller thumbnail image
}

/**
 * Reads the default screenshot directory on an Android device.
 * For web/development, it returns an empty array.
 * @returns A promise that resolves to an array of screenshot file metadata.
 */
export const readScreenshotDirectory = async (): Promise<ScreenshotFile[]> => {
  if (Capacitor.getPlatform() === 'web') {
    console.warn('[WEB MOCK] readScreenshotDirectory() called. This is a mock implementation for web development. Returning empty array.');
    // In a web environment, we can't access the native screenshot directory.
    return [];
  }

  // Native Android implementation
  try {
    // On Android, screenshots are typically in Pictures/Screenshots or DCIM/Screenshots
    const potentialPaths = [
        { directory: Directory.Pictures, path: 'Screenshots' },
        { directory: Directory.DCIM, path: 'Screenshots' }
    ];

    let filesInDir: FileInfo[] = [];

    for (const p of potentialPaths) {
        try {
            const result = await Filesystem.readdir({
                path: p.path,
                directory: p.directory,
            });
            filesInDir = result.files;
            // If we found files, break out of the loop
            if (filesInDir.length > 0) break;
        } catch (e) {
            console.log(`Could not read screenshot directory at ${p.directory}/${p.path}, trying next location.`);
        }
    }
    
    if (filesInDir.length === 0) {
        console.log("No screenshot files found in common directories.");
        return [];
    }

    // We have file info, now get full metadata for each
    const filePromises = filesInDir.map(async (file): Promise<ScreenshotFile | null> => {
      try {
        const statResult = await Filesystem.stat({
            path: file.uri, // stat using the full URI from readdir result
        });

        // Filter out directories if any, and only include image files
        if (statResult.type === 'file' && /\.(png|jpg|jpeg)$/i.test(file.name)) {
            return {
              name: file.name,
              uri: statResult.uri,
              mtime: statResult.mtime,
              // Thumbnail generation would be a more complex native task.
              // For now, we'll omit it.
              thumbnailUri: undefined, 
            };
        }
        return null;
      } catch (statError) {
          console.error(`Could not stat file ${file.uri}:`, statError);
          return null;
      }
    });

    const files = (await Promise.all(filePromises)).filter((file): file is ScreenshotFile => file !== null);
    
    // Sort by modification time, newest first
    return files.sort((a, b) => b.mtime - a.mtime);

  } catch (error) {
    // This can happen if permissions are denied.
    console.error('Error reading screenshot directory:', error);
    // You might want to request permissions here if the error indicates a permission issue.
    return [];
  }
};
