export type Track = {
  id: string;
  year: string;
  mtime: string;
  filePath: string;
  fileHash: string;
  artworkHash: string;
  artist: string;
  title: string;
  remixer: string;
  album: string;
  release: string;
  publisher: string;
  disc: string;
  track: string;
  genre: string;
  key: string;
  bpm: string;
};

export type Artwork = {
  url: string;
  size: Blob['size'];
  type: Blob['type'];
  dimensions: {height: number; width: number};
};
