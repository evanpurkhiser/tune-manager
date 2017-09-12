import { autoFixTypes, levels, makeValidations, Validations } from './utils';
import { splitArtists, splitOn, strictSplitOn } from '../util/artistMatch';
import { validateFromKnowns } from './utils';

const validationType = makeValidations({
  EMPTY: {
    level:   levels.ERROR,
    message: 'Artist must not be left empty',
  },

  NOT_EMPTY: {
    level:   levels.VALID,
    message: 'Artist is not empty',
  },

  KNOWN_ARTIST: {
    level:   levels.VALID,
    message: '{value} is a known artist',
  },

  CASE_INCONSISTENT_ARTIST: {
    level:   levels.WARNING,
    message: '{value} is known as {knownValue}',
  },

  SIMILAR_ARTIST: {
    level:   levels.WARNING,
    message: '{value} is similar to known artists: {similarList}',
  },

  NEW_ARTIST: {
    level: levels.WARNING,
    message: '{value} is not similar to any known artists',
  },

  BAD_CONNECTORS: {
    level:   levels.ERROR,
    fixer:   fixConnectors,
    autoFix: autoFixTypes.IMMEDIATE,
  },
});

/**
 * This list is used to transform the fuzzy pattern of a specific artist
 * connector into it's canonical value.
 */
const connectorTransforms = [
  [ 'vs\\.?', 'vs' ],
  [ 'and', '&' ],
  [ 'f(?:ea)?t(?:uring)?\\.?', 'Ft.' ],
];

/**
 * Replace invalid artist connectors within an artist string.
 */
function fixConnectors(artistsString) {
  let str = artistsString;

  for (const item of connectorTransforms) {
    const [ pattern, replace ] = item;
    str = str.replace(new RegExp(` ${pattern} `, 'gi'), ` ${replace} `);
  }

  return str;
}

/**
 * typeMapping used for similarity validations.
 */
const typeMapping = {
  KNOWN:   validationType.KNOWN_ARTIST,
  CASING:  validationType.CASE_INCONSISTENT_ARTIST,
  SIMILAR: validationType.SIMILAR_ARTIST,
  UNKNOWN: validationType.NEW_ARTIST,
};

/**
 * Validate a single artist name. See `utils.validateFromKnowns`.
 */
function validateOneArtist(artist, validations, knowns) {
  const similarValidations = validateFromKnowns(artist, {
    knowns,
    typeMapping,
  });

  validations.merge(similarValidations);
}

/**
 * Validate an artists strings connectors.
 *
 * ERROR: Artist separators should match the defined strict format. This can
 * be automatically fixed.
 */
function validateConnectors(artistsString, validations) {
  const fuzzy = artistsString.match(splitOn);

  // There are no detectable artist connectors
  if (fuzzy === null) {
    return;
  }

  const strict = artistsString.match(strictSplitOn);

  if (strict !== null && strict.length === fuzzy.length) {
    return;
  }

  validations.add(validationType.BAD_CONNECTORS);
}

/**
 * Validate a given artist string.
 *
 * 1. MIXED: Validate each individual artist. See `validateOneArtist`.
 * 2. ERROR: Validate the artists connectors. See `validateConnectors`.
 */
function validateArtistsString(artistsString, options = {}, validations) {
  const { knownArtists } = options;

  // 1. Check split artist names
  for (const artist of splitArtists(artistsString)) {
    validateOneArtist(artist, validations, knownArtists);
  }

  // 2. Do we have invalid separators
  validateConnectors(artistsString, validations);
}

/**
 * Artist validation will validate the following rules:
 *
 * 1. ERROR: The artist field must not be left empty.
 * 2. MIXED: Validate the artist string. See `validateArtistsString`.
 */
function artist(track, options) {
  const artistsString = track.artist || '';

  const validations = new Validations();

  // 1. Artist must not be empty
  if (artistsString === '') {
    return validations.add(validationType.EMPTY);
  }

  validations.add(validationType.NOT_EMPTY);

  // 2. Validate the entire artists string
  validateArtistsString(artistsString, options, validations);

  return validations;
}

export { artist, validateArtistsString };
