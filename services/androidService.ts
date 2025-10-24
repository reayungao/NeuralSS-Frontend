import { Filesystem, Directory, FileInfo, StatResult } from '@capacitor/filesystem';

export interface ScreenshotFile {
  name: string;
  dataUrl: string;
  mtime: number; // Modification timestamp
}

const getMimeType = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'png':
            return 'image/png';
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'webp':
            return 'image/webp';
        default:
            return 'application/octet-stream';
    }
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
        
        const filePromises = result.files
            .filter(file => file.type === 'file')
            .map(async (file: FileInfo) => {
                try {
                    const fullPath = `${dirConfig.path}/${file.name}`;
                    const [fileContent, fileStat] = await Promise.all([
                        Filesystem.readFile({ path: fullPath, directory: dirConfig.directory }),
                        Filesystem.stat({ path: fullPath, directory: dirConfig.directory })
                    ]);

                    const mimeType = getMimeType(file.name);
                    const dataUrl = `data:${mimeType};base64,${fileContent.data}`;
                    
                    return {
                      name: file.name,
                      dataUrl: dataUrl,
                      mtime: fileStat.mtime,
                    };
                } catch (readError) {
                    console.error(`Could not process file ${file.name}:`, readError);
                    return null;
                }
            });

        const settledFiles = await Promise.all(filePromises);
        const validFiles = settledFiles.filter((f): f is ScreenshotFile => f !== null);

        return validFiles;

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
