import { Filesystem, Directory, FileInfo } from '@capacitor/filesystem';

export interface ScreenshotFile {
  name: string;
  uri: string;
  mtime: number; // Modification timestamp
}

const POTENTIAL_DIRECTORIES = [
  { directory: Directory.External, path: 'Pictures/Screenshots' },
  { directory: Directory.External, path: 'DCIM/Screenshots' },
  { directory: Directory.External, path: 'Pictures/ScreenShots' }, // Different casing
  { directory: Directory.External, path: 'Pictures/ScreenCaptures' },
];

export const readScreenshotDirectory = async (): Promise<ScreenshotFile[]> => {
  try {
    const permissions = await Filesystem.checkPermissions();
    if (permissions.publicStorage !== 'granted') {
        const permissionStatus = await Filesystem.requestPermissions();
        if (permissionStatus.publicStorage !== 'granted') {
            console.error('Permission to read external storage was denied.');
            throw new Error('Storage permission denied.');
        }
    }
    
    for (const dirConfig of POTENTIAL_DIRECTORIES) {
      try {
        const result = await Filesystem.readdir({
          path: dirConfig.path,
          directory: dirConfig.directory,
        });

        console.log(`Found screenshots in: ${dirConfig.directory}/${dirConfig.path}`);
        
        const validFiles = result.files
          .filter(file => file.type === 'file')
          .map((file: FileInfo) => ({
            name: file.name,
            uri: file.uri,
            mtime: file.mtime,
          }));
        
        // This will find the first valid screenshot directory and return its contents
        if (validFiles.length > 0) {
            return validFiles;
        }

      } catch (error: any) {
        if (error.message && error.message.includes('Folder does not exist')) {
          console.log(`Directory not found at ${dirConfig.directory}/${dirConfig.path}, trying next.`);
        } else {
          console.error(`Error reading directory ${dirConfig.directory}/${dirConfig.path}:`, error);
        }
      }
    }

    console.warn("Could not find a valid screenshot directory.");
    return [];

  } catch (error) {
    console.error('A critical error occurred while accessing the filesystem:', error);
    throw error;
  }
};