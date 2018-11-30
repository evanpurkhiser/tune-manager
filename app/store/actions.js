// Websocket API events
export const TRACK_DETAILS = 'TRACK_DETAILS';
export const TRACK_REMOVED = 'TRACK_REMOVED';
export const TRACK_PROCESSING = 'TRACK_PROCESSING';
export const TRACK_UPDATE = 'TRACK_UPDATE';
export const TRACK_SAVED = 'TRACK_SAVED';

export const trackUpdate = items => ({
  type: TRACK_UPDATE,
  items,
});

// Saga responses
export const SET_ARTWORK = 'SET_ARTWORK';
export const REPLACE_KNOWNS = 'REPLACE_KNOWNS';
export const AUTOFIX_FIELDS = 'AUTOFIX_FIELDS';
export const SAVE_PROCESSING = 'SAVE_PROCESSING';

export const setArtwork = items => ({
  type: SET_ARTWORK,
  items,
});

export const replaceKnowns = knowns => ({
  type: REPLACE_KNOWNS,
  knowns,
});

export const autoFixFields = items => ({
  type: AUTOFIX_FIELDS,
  items,
});

export const saveProcessing = total => ({
  type: SAVE_PROCESSING,
  total,
});

// Interface events
export const TOGGLE_SELECT_ALL = 'TOGGLE_SELECT_ALL';
export const TOGGLE_SELECT = 'TOGGLE_SELECT';
export const CLEAR_SELECTED = 'CLEAR_SELECTED';
export const REORDER_GROUPS = 'REORDER_GROUPS';
export const NUMBER_SELECTED = 'NUMBER_SELECTED';
export const MODIFY_FIELD = 'MODIFY_FIELD';
export const ARTWORK_SELECT = 'ARTWORK_SELECT';
export const ARTWORK_REMOVE = 'ARTWORK_REMOVE';
export const ARTWORK_ADD = 'ARTWORK_ADD';
export const SAVE_TRACKS = 'SAVE_TRACKS';

export const toggleSelectAll = toggle => ({
  type: TOGGLE_SELECT_ALL,
  toggle,
});

export const toggleSelect = (toggle, tracks) => ({
  type: TOGGLE_SELECT,
  toggle,
  tracks,
});

export const clearSelected = _ => ({
  type: CLEAR_SELECTED,
});

export const reorderGroups = indicies => ({
  type: REORDER_GROUPS,
  indicies,
});

export const numberSelected = _ => ({
  type: NUMBER_SELECTED,
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

export const saveTracks = options => ({
  type: SAVE_TRACKS,
  options,
});
