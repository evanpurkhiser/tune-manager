import {ApiKnowns, Artwork, ProcessKey, Store, Track, TrackID} from '../types';

// Websocket API events
export const TRACK_DETAILS = 'TRACK_DETAILS' as const;
export const TRACK_REMOVED = 'TRACK_REMOVED' as const;
export const TRACK_PROCESSING = 'TRACK_PROCESSING' as const;
export const TRACK_UPDATE = 'TRACK_UPDATE' as const;
export const TRACK_SAVED = 'TRACK_SAVED' as const;

// Saga responses
export const SET_ARTWORK = 'SET_ARTWORK' as const;
export const REPLACE_KNOWNS = 'REPLACE_KNOWNS' as const;
export const AUTOFIX_FIELDS = 'AUTOFIX_FIELDS' as const;
export const SAVE_PROCESSING = 'SAVE_PROCESSING' as const;

// Interface events
export const TOGGLE_SELECT_ALL = 'TOGGLE_SELECT_ALL' as const;
export const TOGGLE_SELECT = 'TOGGLE_SELECT' as const;
export const CLEAR_SELECTED = 'CLEAR_SELECTED' as const;
export const REORDER_GROUPS = 'REORDER_GROUPS' as const;
export const NUMBER_SELECTED = 'NUMBER_SELECTED' as const;
export const MODIFY_FIELD = 'MODIFY_FIELD' as const;
export const ARTWORK_SELECT = 'ARTWORK_SELECT' as const;
export const ARTWORK_REMOVE = 'ARTWORK_REMOVE' as const;
export const ARTWORK_ADD = 'ARTWORK_ADD' as const;
export const SAVE_TRACKS = 'SAVE_TRACKS' as const;

export const trackDetails = (items: Track[]) => ({
  type: TRACK_DETAILS,
  items,
});

export const trackRemoved = (items: Track[]) => ({
  type: TRACK_REMOVED,
  items,
});

export const trackProcessing = (items: Array<{id: TrackID; process: ProcessKey}>) => ({
  type: TRACK_PROCESSING,
  items,
});

export const trackUpdate = (items: Array<Track & {completedProcess: ProcessKey}>) => ({
  type: TRACK_UPDATE,
  items,
});

export const trackSaved = (items: Array<{id: TrackID}>) => ({
  type: TRACK_SAVED,
  items,
});

export const setArtwork = (items: Store['artwork']) => ({
  type: SET_ARTWORK,
  items,
});

export const replaceKnowns = (knowns: ApiKnowns) => ({
  type: REPLACE_KNOWNS,
  knowns,
});

export const autoFixFields = (items: {[id: string]: Partial<Track>}) => ({
  type: AUTOFIX_FIELDS,
  items,
});

export const saveProcessing = () => ({
  type: SAVE_PROCESSING,
});

export const toggleSelectAll = (toggle: boolean) => ({
  type: TOGGLE_SELECT_ALL,
  toggle,
});

export const toggleSelect = (toggle: boolean, tracks: TrackID[]) => ({
  type: TOGGLE_SELECT,
  toggle,
  tracks,
});

export const clearSelected = () => ({
  type: CLEAR_SELECTED,
});

export const reorderGroups = (indicies: {oldIndex: number; newIndex: number}) => ({
  type: REORDER_GROUPS,
  indicies,
});

export const numberSelected = () => ({
  type: NUMBER_SELECTED,
});

export const modifyField = (
  focusedTrackID: TrackID,
  field: keyof Track,
  value: string
) => ({
  type: MODIFY_FIELD,
  focusedTrackID,
  field,
  value,
});

export const selectArtwork = (focusedTrackID: TrackID, index: number) => ({
  type: ARTWORK_SELECT,
  focusedTrackID,
  index,
});

export const removeArtwork = (focusedTrackID: TrackID, index: number) => ({
  type: ARTWORK_REMOVE,
  focusedTrackID,
  index,
});

export const addArtwork = (focusedTrackID: TrackID, artwork: Artwork) => ({
  type: ARTWORK_ADD,
  focusedTrackID,
  artwork,
});

export const saveTracks = (options = {}) => ({
  type: SAVE_TRACKS,
  options,
});

export type Actions =
  | ReturnType<typeof trackDetails>
  | ReturnType<typeof trackRemoved>
  | ReturnType<typeof trackProcessing>
  | ReturnType<typeof trackUpdate>
  | ReturnType<typeof trackSaved>
  | ReturnType<typeof setArtwork>
  | ReturnType<typeof replaceKnowns>
  | ReturnType<typeof autoFixFields>
  | ReturnType<typeof saveProcessing>
  | ReturnType<typeof toggleSelectAll>
  | ReturnType<typeof toggleSelect>
  | ReturnType<typeof clearSelected>
  | ReturnType<typeof reorderGroups>
  | ReturnType<typeof numberSelected>
  | ReturnType<typeof modifyField>
  | ReturnType<typeof selectArtwork>
  | ReturnType<typeof removeArtwork>
  | ReturnType<typeof addArtwork>
  | ReturnType<typeof saveTracks>;
