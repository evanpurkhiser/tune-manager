import {KnownValues} from './validate/types';

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
  /**
   * Index of the artwork that is the 'primary' art.
   */
  artworkSelected?: null | number;
  /**
   * List of artwork keys
   */
  artwork?: string[];
};

export type Artwork = {
  url: string;
  size: Blob['size'];
  type: Blob['type'];
  dimensions: {height: number; width: number};
};

/**
 * The fields which have known values reported for them
 */
export type KnownFields = 'artists' | 'genres' | 'publishers';

export type ApiKnowns = {[k in KnownFields]: string[]};

export type TrackID = string;

export type ProcessKey = 'CONVERTING' | 'KEY_COMPUTING' | 'BEATPORT_IMPORT';

export type TrackTreeNode = {
  /**
   * Hashed value of the path
   */
  id: string;
  /**
   * List of path entries
   */
  pathParts: string[];
  /**
   * List of tracks in this tree node
   */
  tracks: TrackID[];
};

export type Store = {
  /**
   * tracks is a mapping of the unique track ID to the track object.
   */
  tracks: {[id: string]: Track};
  /**
   * tracksPristine is the same structure as tracks, however the state will
   * only be modified when tracks are loaded / removed from the server.
   */
  tracksPristine: {[id: string]: Track};
  /**
   * processes contains a map of track IDs with a list of the current
   * processing events occurring for the track.
   */
  processes: {[id: string]: ProcessKey[]};
  /**
   * artwork contains a map of artwork keys to the objects created using the
   * util/images.buildImageObject function.
   */
  artwork: {[id: string]: Artwork};
  /**
   * trackTree is a list of objects that represent each grouping of tracks.
   * Track grouping logic is based on the directory path of the track within
   * the import root.
   *
   * Objects in the list will have the form:
   *
   *   {
   *     id:        'hashed value of path',
   *     pathParts: [ 'DJ Tools Vol 5', 'Disc 1' ],
   *     tracks:    [ ... list of track IDs ],
   *   }
   *
   * Ordering is important in the track tree as it determines how the tree
   * will be rendered in the interface and will affect certain operations.
   * For example, automatic track numbering will be done based on the order
   * of tracks here, not the order they were selected in.
   */
  trackTree: TrackTreeNode[];
  /**
   * Selected tracks is a list of track IDs that are currently selected in the
   * interface. Order should not be considered important here.
   */
  selectedTracks: TrackID[];
  /**
   * saveProcess contains the current state of the global saving process.
   */
  saveProcess: {
    preparing: boolean;
    targetTracks: TrackID[];
    total: null | number;
  };
  /**
   * knownValues contains various lists of known values of fields that exist in
   * the current library database. We also keep a cached normalized mapping of
   * their normal form (lower case) to the actual value.
   */
  knownValues: {
    [k in KnownFields]: KnownValues;
  };
};
