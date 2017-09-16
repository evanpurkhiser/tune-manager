import * as lodash from 'lodash';
import * as md5 from 'md5';
import * as path from 'path';
import { applyMiddleware, compose, createStore } from 'redux';
import { arrayMove } from 'react-sortable-hoc';
import createSagaMiddleware from 'redux-saga';

import * as actions from './actions';
import appSaga from './sagas';

const initialState = {
  // tracks is a mapping of the unique track ID to the track object.
  tracks: {},

  // tracksPristine is the same structure as tracks, however the state will
  // only be modified when tracks are loaded / removed from the server.
  tracksPristine: {},

  // processes contains a map of track IDs with a list of the current
  // processing events occuring for the track.
  processes: [],

  // trackTree is a list of objects that represent each grouping of tracks.
  // Track grouping logic is based on the directory path of the track within
  // the import root.
  //
  // Objects in the list will have the form:
  //
  //   {
  //     id:        'hashed value of path',
  //     pathParts: [ 'DJ Tools Vol 5', 'Disc 1' ],
  //     tracks:    [ ... list of track IDs ],
  //   }
  //
  // Ordering is important in the track tree as it determines how the tree
  // will be rendered in the interface and will affect certain operations.
  // For example, automatic track numbering will be done based on the order
  // of tracks here, not the order they were selected in.
  trackTree: [],

  // Selected tracks is a list of track IDs that are currently selected in
  // the interface. Order should not be considered important here.
  selectedTracks: [],

  // knownValues contains various lists of known values of fields that exist
  // in the current library database. We also keep a cached normalized mapping
  // of their normal form (lower case) to the actual value.
  knownValues: {
    artists:    { clean: [], normal: {} },
    publishers: { clean: [], normal: {} },
    genres:     { clean: [], normal: {} },
  },
};

function reducer(oldState = initialState, action) {
  const state = { ...oldState };

  switch (action.type) {
  case actions.TRACK_DETAILS: {
    const newTracks = lodash.keyBy(action.items, t => t.id);
    state.tracks = { ...state.tracks, ...newTracks };
    state.trackTree = computeTrackTree(state.tracks);
    state.tracksPristine = { ...state.tracksPristine, ...newTracks };
    break;
  }

  case actions.TRACK_REMOVED: {
    state.tracks = { ...state.tracks };
    action.items.map(i => i.id).forEach(k => delete state.tracks[k]);
    state.trackTree = computeTrackTree(state.tracks);
    break;
  }

  case actions.TRACK_PROCESSING: {
    state.processes = { ...state.processes };
    for (const item of action.items) {
      const trackId = item.id;
      const current = state.processes[trackId] || [];
      state.processes[trackId] = [ ...current, item.process ];
    }
    break;
  }

  case actions.TRACK_UPDATE: {
    state.tracks = { ...state.tracks };
    state.processes = { ...state.processes };

    for (const trackItem of action.items) {
      const { completedProcess, ...track } = trackItem;

      // Update the track with the partial fields
      state.tracks[track.id] = { ...state.tracks[track.id], ...track };

      if (state.processes[track.id] === undefined) {
        continue;
      }

      // Remove the completed process for this track
      const processes = [ ...state.processes[track.id] ] || [];
      processes.splice(processes.indexOf(completedProcess), 1);
      state.processes[track.id] = processes;

      if (processes.length === 0) {
        delete state.processes[track.id];
      }
    }
    break;
  }

  case actions.SET_ARTWORK: {
    for (const trackId in action.items) {
      const artwork = action.items[trackId];
      state.tracks = { ...state.tracks };
      state.tracks[trackId] = { ...state.tracks[trackId], artwork };

      // Remove the artworkCount. This field was used to indicate how many
      // artwork items there are to download for a track, and is used by the
      // interface as a marker to indicate that artwok is being downloaded.
      state.tracks[trackId].artworkCount = undefined;
    }
    break;
  }

  case actions.AUTOFIX_FIELDS: {
    state.tracks = { ...state.tracks };

    for (const trackId in action.items) {
      const fixedFields = action.items[trackId];
      state.tracks[trackId] = { ...state.tracks[trackId], ...fixedFields };
    }
    break;
  }

  case actions.REPLACE_KNOWNS: {
    state.knownValues = normalizeKnownValues(action.knowns);
    break;
  }

  case actions.TOGGLE_SELECT_ALL: {
    state.selectedTracks = action.toggle ? Object.keys(state.tracks) : [];
    break;
  }

  case actions.TOGGLE_SELECT: {
    state.selectedTracks = action.toggle
      ? lodash.union(state.selectedTracks, action.tracks)
      : lodash.difference(state.selectedTracks, action.tracks);
    break;
  }

  case actions.REORDER_GROUPS: {
    const { oldIndex, newIndex } = action.indicies;
    state.trackTree = arrayMove(state.trackTree, oldIndex, newIndex);
    break;
  }

  case actions.MODIFY_FIELD: {
    const { focusedTrackID, field, value } = action;
    state.tracks = { ...state.tracks };

    onSelectedTracks(state, focusedTrackID, id => {
      state.tracks[id] = { ...state.tracks[id], [field]: value };
    });
    break;
  }

  case actions.ARTWORK_SELECT: {
    const { focusedTrackID, index } = action;
    state.tracks = { ...state.tracks };
    state.tracks[focusedTrackID] = { ...state.tracks[focusedTrackID] };
    state.tracks[focusedTrackID].artworkSelected = index;
    break;
  }

  case actions.ARTWORK_REMOVE: {
    const { focusedTrackID, index } = action;
    const track = { ...state.tracks[focusedTrackID] };
    const currIndex = track.artworkSelected;

    // Remove artwork and offset the artworkSelected index if necessary
    track.artwork = [ ...track.artwork ];
    track.artwork.splice(index, 1);
    track.artworkSelected = currIndex === index
      ? null
      : currIndex <= index ? currIndex : currIndex - 1;

    state.tracks = { ...state.tracks, [focusedTrackID]: track };
    break;
  }

  case actions.ARTWORK_ADD: {
    const { focusedTrackID, artwork } = action;
    state.tracks = { ...state.tracks };

    onSelectedTracks(state, focusedTrackID, id => {
      const track = { ...state.tracks[id] };
      const existing = track.artwork || [];
      track.artwork = [ ...existing, artwork ];
      track.artworkSelected = existing.length;
      state.tracks[id] = track;
    });
    break;
  }
  default:
  }

  return state;
}

function onSelectedTracks(state, focusedTrack, fn) {
  lodash.union(state.selectedTracks, [ focusedTrack ]).forEach(fn);
}

function computeTrackTree(trackMap) {
  const tracks = Object.values(trackMap);
  const sortedTracks = tracks.sort((a, b) => a.filePath.localeCompare(b.filePath));

  const paths = lodash.uniq(tracks.map(t => path.dirname(t.filePath)));
  const grouped = lodash.groupBy(sortedTracks, t => path.dirname(t.filePath));

  return paths.map(p => ({
    id:        md5(p),
    pathParts: p.split('/'),
    tracks:    grouped[p].map(t => t.id),
  }));
}

/**
 * Normalize a known values object where each value list is transformed into a
 * map of the normalized lowercase of the item mapping to the cased version.
 *
 *   const knowns = { artists: [ 'DJ Sy' ] };
 *   normalizeKnownValues(known)
 *
 *   => {
 *        clean:  { artists: [ 'DJ Sy' ] },
 *        normal: { artists: { 'dj sy': 'DJ Sy' } },
 *      }
 */
function normalizeKnownValues(knowns) {
  return lodash.mapValues(knowns, k => ({
    clean:  k,
    normal: lodash.keyBy(k, v => v.toLowerCase()),
  }));
}

const devTools = '__REDUX_DEVTOOLS_EXTENSION__';
const sagaMiddleware = createSagaMiddleware();

const middleware = compose(
  applyMiddleware(sagaMiddleware),
  window[devTools] ? window[devTools]() : lodash.identity
);

const store = createStore(reducer, middleware);
sagaMiddleware.run(appSaga);

export default store;
