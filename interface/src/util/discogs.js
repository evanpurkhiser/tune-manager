import * as lodash   from 'lodash';

import { formatTrackNumbers } from './format';
import { remixPattern }       from './artistMatch';

/**
 * Regex used to remove the trailing discogs 'unique identifier' on artists who
 * have multiple entries in the discogs database.
 */
const artistDifferentiatorRegex = / \([0-9]+\)$/;

/**
 * Used to match the track postion string in a discogs track.
 */
const positionRegex = /(?:([0-9]+)-)?([0-9]+)/;

/**
 * Join the discogs artists object using the provided joiner.
 */
function buildArtistString(artistsList) {
  const artists = lodash.cloneDeep(artistsList);

  // Use the ANV (artist name variation) if provided
  artists.forEach(a => {
    a.name = a.anv === '' ? a.name : a.anv;
    a.name = a.name.replace(artistDifferentiatorRegex, '');
  });

  const lastArtist = artists.pop();
  const artist = artists.map(a => {
    return a.name + (a.join === ',' ? ', ' : ` ${a.join} `);
  });

  if (lastArtist !== undefined) {
    artist.push(lastArtist.name);
  }

  return artist.join('');
}

/**
 * Given a Discogs release JSON object, map the tracks into our track format.
 */
function mapTracks(release) {
  const label = release.labels.pop();

  const tracks = release.tracklist.filter(t => t.type === 'track');

  // Compute total tracks and discs
  const positionMatches = tracks
    .map(t => t.position)
    .filter(p => p !== undefined)
    .map(p => p.match(positionRegex))
    .filter(p => p !== null);

  const discGroups = lodash.groupBy(positionMatches, p => p[1] || '1');

  const totalDiscs  = Object.keys(discGroups).pop() || '1';
  const totalTracks = lodash.mapValues(discGroups, p => p.pop()[2]);

  return tracks.map(t => {
    const artists = t.artists || release.artists || [];

    const track = {
      'artist':    buildArtistString(artists),
      'title':     t.title,
      'album':     release.title,
      'release':   label.catno,
      'publisher': label.name,
      'year':      String(release.year),
    };

    // Add remixer /if/ we find what looks like a remixer in the title.
    const remixerMatch = t.title.match(remixPattern);
    if (remixerMatch !== null) {
      track.remixer = remixerMatch[1];
    }

    // Add disc and tracks /if/ we have multiple tracks.
    const positionMatch = t.position.match(positionRegex);
    if (positionMatch !== null && totalTracks[1] > 1) {
      const discNum  = positionMatch[1] || '1';
      const trackNum = positionMatch[2];

      track.track = formatTrackNumbers(trackNum, totalTracks[discNum]);
      track.disc  = formatTrackNumbers(discNum, totalDiscs);
    }

    return track;
  });
}

export { mapTracks };
