import * as action from './actions';
import { all, put, takeEvery } from 'redux-saga/effects';
import format from 'string-format';
import lodash from 'lodash';
import { computeImageSize } from './util/image';

const ARTWORK_URL = 'http://localhost:8000/artwork/{}@{}';

/**
 * Compute and attach image dimensions to all given blob objects.
 */
function* attachImageSize(blobs) {
  const dimensions = yield all(blobs.map(b => computeImageSize(b)));
  blobs.forEach((b, i) => b.dimensions = dimensions[i]);
}

function* getTrackArtwork(track) {
  const promises = lodash
    .times(track.artworkCount, i => format(ARTWORK_URL, i, track.id))
    .map(u => fetch(u));

  const reses = yield all(promises);
  const blobs = yield all(reses.map(r => r.blob()));

  // compute and store the image size on each individual blob. We do this here
  // so we can avoid recomputing this over and over.
  yield attachImageSize(blobs)

  return [ track.id, blobs ];
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
