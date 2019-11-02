import { cloneDeep, groupBy, mapValues } from 'lodash';
import format from 'string-format';
import md5 from 'md5';

import * as validate from 'app/importer/validate';
import { formatTrackNumbers } from './format';
import { remixPattern } from './artistMatch';
import { Track } from 'app/importer/types';

type DiscogsArtist = {
  name: string;
  anv: string;
  join: string;
};

type DiscogsTrack = {
  type: 'track' | 'heading';
  title: string;
  position: string;
  artists: DiscogsArtist[];
};

type DiscogsLabel = {
  catno: string;
  name: string;
};

type DiscogsRelease = {
  title: string;
  year: number;
  artists: DiscogsArtist[];
  tracklist: DiscogsTrack[];
  labels: DiscogsLabel[];
};

const PROXY_URL = '/api/discogs-proxy/';
const SEARCH_URL =
  'https://api.discogs.com/database/search?type=release&q={query}';

/**
 * Construct a discogs API request URL.
 */
function url(url: string, ...args: Parameters<typeof format>[1][]) {
  const queryURL = encodeURIComponent(format(url, ...args));

  return `${PROXY_URL}?url=${queryURL}`;
}

/**
 * Regex used to remove the trailing discogs 'unique identifier' on artists /
 * labels who have multiple entries in the discogs database.
 */
const differentiatorRegex = / \([0-9]+\)$/;

/**
 * Used to match the track postion string in a discogs track.
 */
const positionRegex = /(?:([0-9]+)-)?([0-9]+)/;

/**
 * Join the discogs artists object using the provided joiner.
 */
function buildArtistString(artistsList: DiscogsArtist[]) {
  const artists = cloneDeep(artistsList);

  // Use the ANV (artist name variation) if provided
  artists.forEach(a => {
    a.name = a.anv === '' ? a.name : a.anv;
    a.name = a.name.replace(differentiatorRegex, '');
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
function mapTracks(release: DiscogsRelease) {
  const tracks = release.tracklist;
  const label = release.labels.pop()! || {};

  // Compute total tracks and discs
  const positionMatches = tracks
    .filter(t => t.type === 'track')
    .map(t => t.position)
    .filter(p => p !== undefined)
    .map(p => p.match(positionRegex))
    .filter(p => p !== null);

  const discGroups = groupBy(positionMatches, p => (p && p[1]) || '1');

  const totalDiscs = Object.keys(discGroups).pop() || '1';
  const totalTracks = mapValues(discGroups, p => p.pop()![2]);

  // Tracks are grouped into heading keys
  let currentHeading = '';
  let currentTrackGroup: Partial<Track>[] = [];
  const mappedTracks = [{ name: '', tracks: currentTrackGroup }];

  for (const t of tracks) {
    if (t.type === 'heading') {
      currentHeading = t.title;
      currentTrackGroup = [];
      mappedTracks.push({ name: t.title, tracks: currentTrackGroup });
      continue;
    }

    const artists = t.artists || release.artists || [];

    const track: Partial<Track> = {
      artist: buildArtistString(artists),
      title: t.title,
      album: release.title,
      release: label.catno,
      publisher: label.name.replace(differentiatorRegex, ''),
      year: String(release.year),
    };

    track.id = md5(currentHeading + track.artist + track.title);

    const remixerMatch = t.title.match(remixPattern);
    track.remixer = remixerMatch ? remixerMatch[1] : '';

    // Add disc and tracks /if/ we have multiple tracks.
    const positionMatch = t.position.match(positionRegex);
    if (positionMatch !== null && parseInt(totalTracks[1], 10) > 1) {
      const discNum = positionMatch[1] || '1';
      const trackNum = positionMatch[2];

      track.track = formatTrackNumbers(trackNum, totalTracks[discNum]);
      track.disc = formatTrackNumbers(discNum, totalDiscs);
    }

    // Execute validation autofixes
    const fixTypes = Object.values(validate.autoFixTypes);

    Object.keys(track)
      .filter(f => validate[f] !== undefined)
      .forEach(
        f => (track[f] = validate[f](track).autoFix(track[f], fixTypes))
      );

    currentTrackGroup.push(track);
  }

  return mappedTracks;
}

export { SEARCH_URL, url, mapTracks };
