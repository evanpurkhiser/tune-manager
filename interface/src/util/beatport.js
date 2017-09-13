import { formatNumber } from '../validate/track';

/**
 * Beatports Genre mappings are pretty poor. For now, since I purchase *mostly
 * hardcore* remap a few genres automatically.
 */
const genreRemapping = {
  'Hardcore / Hard Techno': 'Hardcore',
  'Hard Dance': 'Hardcore',
};

/**
 * Beatport files contain the beatport ID as the prefix of the file name. We
 * make the assumption here that the ID will always be at least 6 characters
 * long, to help with identification.
 */
const IdRegex = /^[0-9]{5,}(?=_)/;

/**
 * Identify the Beatport ID of a track.
 */
export function identifyId(track) {
  const match = track.filePath.match(IdRegex);

  return match === null ? false : match[0];
}

/**
 * Transform track details to conform to standards when given a beatport
 * details object, including the release and number of tracks.
 */
export function getPartialTrack(origTrack, beatportDetails) {
  const { totalTracks, release } = beatportDetails;
  const track = {};

  track.release = release;

  if (totalTracks === 1) {
    track.album = '';
    track.track = '';
    track.disc  = '';
  }

  if (totalTracks > 1) {
    const trackNumber = origTrack.track.match(/^[0-9]+/);

    // Beatport does not have 'multi-disc' releases as far as I know
    track.disc  = '1/1';
    track.track = formatNumber(`${trackNumber}/${totalTracks}`);
  }

  if (genreRemapping[origTrack.genre] !== undefined) {
    track.genre = genreRemapping[origTrack.genre];
  }

  return track;
}
