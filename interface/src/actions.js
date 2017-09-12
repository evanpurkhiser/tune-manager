// Websocket API events
export const TRACK_CONVERTING = 'TRACK_CONVERTING';
export const TRACK_DETAILS    = 'TRACK_DETAILS';
export const TRACK_REMOVED    = 'TRACK_REMOVED';
export const KEY_COMPUTING    = 'KEY_COMPUTING';
export const KEY_COMPUTED     = 'KEY_COMPUTED';

// Saga responses
export const SET_ARTWORK    = 'SET_ARTWORK';
export const REPLACE_KNOWNS = 'REPLACE_KNOWNS';
export const AUTOFIX_FIELDS = 'AUTOFIX_FIELDS';

export const setArtwork = items => ({
  type: SET_ARTWORK,
  items,
});

export const replaceKnowns = tracks => ({
  type:    REPLACE_KNOWNS,
  knowns: tracks,
});

export const autoFixFields = items => ({
  type: AUTOFIX_FIELDS,
  items,
});

// Interface events
export const TOGGLE_ALL_TRACKS = 'TOGGLE_ALL_TRACKS';
export const TOGGLE_TRACKS     = 'TOGGLE_TRACKS';
export const REORDER_GROUPS    = 'REORDER_GROUPS';
export const MODIFY_FIELD      = 'MODIFY_FIELD';
export const ARTWORK_SELECT    = 'ARTWORK_SELECT';
export const ARTWORK_REMOVE    = 'ARTWORK_REMOVE';
export const ARTWORK_ADD       = 'ARTWORK_ADD';

export const toggleAllTracks = toggle => ({
  type: TOGGLE_ALL_TRACKS,
  toggle,
});

export const toggleTracks = (toggle, tracks) => ({
  type: TOGGLE_TRACKS,
  toggle,
  tracks,
});

export const reorderGroups = indicies => ({
  type: REORDER_GROUPS,
  indicies,
});

export const modifyField = (focusedTrackID, field, value) => ({
  type: MODIFY_FIELD,
  focusedTrackID,
  field,
  value,
});

export const selectArtwork = (focusedTrackID, index) => ({
  type: ARTWORK_SELECT,
  focusedTrackID,
  index,
});

export const removeArtwork = (focusedTrackID, index) => ({
  type: ARTWORK_REMOVE,
  focusedTrackID,
  index,
});

export const addArtwork = (focusedTrackID, artwork) => ({
  type: ARTWORK_ADD,
  focusedTrackID,
  artwork,
});
