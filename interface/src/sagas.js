import { all, call, flush, fork, put, takeEvery } from 'redux-saga/effects';
import { buffers, channel, delay, END } from 'redux-saga';
import format from 'string-format';
import lodash from 'lodash';

import * as action   from './actions';
import * as validate from './validate';
import { buildImageObject } from './util/image';
import store from './store';

const ARTWORK_URL = 'http://localhost:8000/artwork/{}';

/**
 * Download and store an artwork item. Artwork will not be downloaded twice.
 */
function* loadArtwork(key, completed) {
  const existingArt = store.getState().artwork;

  // Has this artwork already been downloaded?
  if (existingArt[key] !== undefined) {
    return;
  }

  const res  = yield fetch(format(ARTWORK_URL, key));
  const blob = yield res.blob();
  const art  = yield buildImageObject(blob);

  yield completed.put({ [key]: art });
}

function* loadAllArtwork(artKeys, completed) {
  yield all(artKeys.map(k => loadArtwork(k, completed)));
  yield completed.close();
}

/**
 * Request all artwork BLOBs from the server.
 *
 * SET_ARTWORK actions will be dispatched to redux. However, actions will be
 * batched so that we do not fire many SET_ARTWORK actions all at once.
 */
function* requestArtwork(payload) {
  const BUFFER_SIZE   = 10;
  const DEBOUNCE_TIME = 100;

  const artKeys   = payload.items.reduce((s, t) => s.concat(t.artwork), []);
  const uniqueArt = lodash.uniq(artKeys);
  const completed = yield channel(buffers.expanding(BUFFER_SIZE));

  yield fork(loadAllArtwork, uniqueArt, completed);

  while (true) {
    yield call(delay, DEBOUNCE_TIME);
    const results = yield flush(completed);

    if (results === END) {
      break;
    }

    if (results.length > 0) {
      yield put(action.setArtwork(Object.assign(...results)));
    }
  }
}

/**
 * Execute all validator autoFixes on a given track.
 */
function autoFixTrack(t) {
  const fixTypes = Object.values(validate.autoFixTypes);

  // NB: We're mapping field names in the payload to the validate functions
  // pretty heavily here. Important to note this translation.
  const pairs = Object.keys(t)
    .filter(f => validate[f] !== undefined)
    .map(f => [ f, validate[f](t).autoFix(t[f], fixTypes) ])
    .filter(([ f, v ]) => t[f] !== v);

  // Nothing was auto fixed
  if (pairs.length === 0) {
    return;
  }

  return [ t.id, lodash.fromPairs(pairs) ];
}

/**
 * Process track detail items through all validators and execute all automatic
 * fixes on the values.
 */
function* autoFix(payload) {
  const fixedPairs = payload.items.map(autoFixTrack).filter(t => t);
  const fixedItems = lodash.fromPairs(fixedPairs);

  yield put(action.autoFixFields(fixedItems));
}

export default function* appSaga() {
  yield takeEvery(action.TRACK_DETAILS, autoFix);
  yield takeEvery(action.TRACK_DETAILS, requestArtwork);
}
