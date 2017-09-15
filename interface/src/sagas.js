import * as camelize from 'camelize';
import { all, put, takeEvery } from 'redux-saga/effects';
import format from 'string-format';
import lodash from 'lodash';

import * as action from './actions';
import * as validate from './validate';
import { buildImageObject } from './util/image';

const ARTWORK_URL = 'http://localhost:8000/artwork/{}@{}';

function* getTrackArtwork(track) {
  const promises = lodash
    .times(track.artworkCount, i => format(ARTWORK_URL, i, track.id))
    .map(u => fetch(u));

  const reses = yield all(promises);
  const blobs = yield all(reses.map(r => r.blob()));

  const objects = yield all(blobs.map(b => buildImageObject(b)));

  return [ track.id, objects ];
}

/**
 * Request all artwork BLOBs from the server.
 */
function* requestArtwork(payload) {
  const tracks  = payload.items.filter(i => i.artworkCount > 0);
  const artwork = yield all(tracks.map(t => getTrackArtwork(t)));

  const items = lodash.fromPairs(artwork);

  yield put(action.setArtwork(items));
}

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
