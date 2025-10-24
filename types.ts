export interface Screenshot {
  id: string; // Unique identifier, typically the file name
  dataUrl: string;
  description: string;
  name: string;
  creationTime: number; // Unix timestamp (milliseconds)
}
