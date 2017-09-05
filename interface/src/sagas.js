import * as action from './actions';
import { all, put, takeEvery } from 'redux-saga/effects';
import { buildImageObject } from './util/image';
import format from 'string-format';
import lodash from 'lodash';

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

function* requestArtwork(payload) {
  const tracks  = payload.items.filter(i => i.artworkCount > 0);
  const artwork = yield all(tracks.map(t => getTrackArtwork(t)));

  const items = lodash.fromPairs(artwork);

  yield put(action.setArtwork(items));
}

export default function* appSaga() {
  yield takeEvery(action.TRACK_DETAILS, requestArtwork);
}
