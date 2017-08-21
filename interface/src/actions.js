export const REPLACE_TRACKS = 'REPLACE_TRACKS';

export const TOGGLE_ALL_TRACKS = 'TOGGLE_ALL_TRACKS';
export const TOGGLE_TRACKS     = 'TOGGLE_TRACKS';
export const REORDER_GROUPS    = 'REORDER_GROUPS';

export const replaceTracks = tracks => ({
  type:    REPLACE_TRACKS,
  tracks,
});

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
