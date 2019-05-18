/**
 * This is a fuzzy pattern used to split artists apart from their connectors.
 * This pattern does *not* strictly check for connectors in my defined format.
 */
const splitOn = /(?:,| vs.?| &| and| f(?:ea)?t(?:uring)?[.']?) /gi;

/**
 * This is the strict version of the splitOn pattern that only matches the exact
 * connectors I've defined.
 */
const strictSplitOn = /(?:,| vs| &| Ft\.) /g;

/**
 * For titles that follow the usual 'Track name (Artist Remix)' style, this
 * pattern can be used to detect the artist name and remix wording.
 */
const remixPattern = /\((.*) (re?mi?x)\)/i;

/**
 * Split an artists string on common separators into a list of individual
 * artists.
 */
function splitArtists(artistString) {
  return artistString.split(splitOn).filter(x => x);
}

export { splitArtists, splitOn, strictSplitOn, remixPattern };
