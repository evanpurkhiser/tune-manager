import { createStore } from 'redux';

import * as lodash from 'lodash';
import * as path from 'path';
import * as md5 from 'md5';

import * as actions from './actions';

const initialState = {
  // tracks is a mapping of the unique track ID to the track object.
  tracks: {},

  // tracksPristine is the same structure as tracks, however the state will
  // only be modified when tracks are loaded / removed from the server.
  tracksPristine: {},

  // Artwork is a mapping of the md5 sum of an artwork to the in BLOB object.
  artwork: {},

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
  // in the current library database.
  knownValues: {
    artists:    [],
    publishers: [],
    genres:     [],
  },
};

function reducer(oldState = initialState, action) {
  const state = { ...oldState };

  switch (action.type) {
  case actions.REPLACE_TRACKS: {
    state.tracks = lodash.keyBy(action.payload, t => t.id)
    state.tracksPristine = { ...state.tracks };
    state.trackTree = computeTrackTree(action.payload);
    break;
  }

  case actions.TOGGLE_ALL_TRACKS: {
    state.selectedTracks = action.toggle ? Object.keys(state.tracks) : [];
    break;
  }

  case actions.TOGGLE_TRACKS: {
    state.selectedTracks = action.toggle
      ? lodash.union(state.selectedTracks, action.tracks)
      : lodash.difference(state.selectedTracks, action.tracks);
    break;
  }



  }

  return state;
}

function computeTrackTree(tracks) {
  const sortedTracks = tracks.sort((a, b) => a.file_path.localeCompare(b.file_path));

  const paths = lodash.uniq(tracks.map(t => path.dirname(t.file_path)))
  const grouped = lodash.groupBy(sortedTracks, t => path.dirname(t.file_path));

  return paths.map(p => ({
    id:        md5(p),
    pathParts: p.split('/'),
    tracks:    grouped[p].map(t => t.id),
  }));
}



const reduxDevtools = window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__();

const store = createStore(reducer, reduxDevtools);

export default store;
