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
 * Helper to get metadata for a list of FileInfo objects.
 */
const getFilesMetadata = async (filesInDir: FileInfo[]): Promise<ScreenshotFile[]> => {
    const filePromises = filesInDir.map(async (file): Promise<ScreenshotFile | null> => {
        try {
            const statResult = await Filesystem.stat({ path: file.uri });
            if (statResult.type === 'file' && /\.(png|jpg|jpeg)$/i.test(file.name)) {
                return {
                    name: file.name,
                    uri: statResult.uri,
                    mtime: statResult.mtime,
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
    return files.sort((a, b) => b.mtime - a.mtime);
};


/**
 * Reads the default screenshot directory on an Android device with improved reliability.
 * It checks common paths first, then falls back to a shallow search in primary media directories.
 * For web/development, it returns an empty array.
 * @returns A promise that resolves to an array of screenshot file metadata.
 */
export const readScreenshotDirectory = async (): Promise<ScreenshotFile[]> => {
  if (Capacitor.getPlatform() === 'web') {
    console.warn('[WEB MOCK] readScreenshotDirectory() called. This is a mock implementation for web development. Returning empty array.');
    return [];
  }

  // Stage 1: Check common, hardcoded paths for a quick result.
  // FIX: Replaced non-existent Directory.Pictures and Directory.DCIM with Directory.ExternalStorage and full paths.
  const commonPaths = [
    { directory: Directory.ExternalStorage, path: 'Pictures/Screenshots' },
    { directory: Directory.ExternalStorage, path: 'DCIM/Screenshots' },
    { directory: Directory.ExternalStorage, path: 'DCIM/ScreenCaptures' },
  ];

  for (const p of commonPaths) {
    try {
      const result = await Filesystem.readdir({ path: p.path, directory: p.directory });
      if (result.files.length > 0) {
        console.log(`Found screenshots in primary location: ${p.path}`);
        return await getFilesMetadata(result.files);
      }
    } catch (e) {
      // Directory doesn't exist or can't be read, which is normal. Continue to the next path.
    }
  }

  // Stage 2: If common paths fail, perform a shallow search in Pictures and DCIM.
  console.log("Common screenshot directories not found or empty. Starting fallback search...");
  // FIX: Replaced non-existent Directory enums with string paths to search within Directory.ExternalStorage.
  const searchRoots = ['Pictures', 'DCIM'];
  for (const rootDir of searchRoots) {
      try {
          const dirContents = await Filesystem.readdir({ path: rootDir, directory: Directory.ExternalStorage });
          for (const item of dirContents.files) {
              // Check if the item is a directory and its name suggests it's for screenshots.
              const isScreenshotDir = item.type === 'directory' && /screenshots|screen_captures/i.test(item.name);
              if (isScreenshotDir) {
                   const result = await Filesystem.readdir({ path: item.uri }); // Read using the full URI
                   if (result.files.length > 0) {
                       console.log(`Found screenshots in fallback location: ${item.uri}`);
                       return await getFilesMetadata(result.files);
                   }
              }
          }
      } catch(e) {
          console.error(`Could not perform fallback search in ${rootDir}:`, e);
      }
  }
  
  console.log("No screenshot files found after full search.");
  return [];
};


/**
 * Deletes a screenshot file from the device's filesystem.
 * @param uri The native file URI of the screenshot to delete.
 */
export const deleteScreenshotFile = async (uri: string): Promise<void> => {
    if (Capacitor.getPlatform() === 'web') {
        console.warn(`[WEB MOCK] deleteScreenshotFile(${uri}) called. No file deleted.`);
        return;
    }
    try {
        await Filesystem.deleteFile({ path: uri });
        console.log(`Successfully deleted file: ${uri}`);
    } catch (error) {
        console.error(`Failed to delete file at ${uri}:`, error);
        throw new Error("Could not delete the screenshot file from the device.");
    }
};
