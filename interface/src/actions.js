export const REPLACE_TRACKS = 'REPLACE_TRACKS';

export const TOGGLE_ALL_TRACKS   = 'TOGGLE_ALL_TRACKS';
export const TOGGLE_TRACKS       = 'TOGGLE_TRACKS';

export const replaceTracks = tracks => ({
  type:    REPLACE_TRACKS,
  payload: tracks,
});

export const toggleAllTracks = toggle => ({
  type:   TOGGLE_ALL_TRACKS,
  toggle: toggle,
});

export const toggleTracks = (toggle, tracks) => ({
  type:   TOGGLE_TRACKS,
  toggle: toggle,
  tracks: tracks,
});

