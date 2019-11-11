import { Track } from 'app/importer/types';
import {
  splitArtists,
  splitOn,
  strictSplitOn,
} from 'app/importer/util/artistMatch';

import { ValidationLevel, ValidationAutoFix, KnownValues } from './types';
import { validateFromKnowns, makeValidations, Validations } from './utils';

const validationType = makeValidations({
  EMPTY: {
    level: ValidationLevel.ERROR,
    message: 'Artist must not be left empty',
  },

  NOT_EMPTY: {
    level: ValidationLevel.VALID,
    message: 'Artist is not empty',
  },

  KNOWN_ARTIST: {
    level: ValidationLevel.VALID,
    message: '{value} is a known artist',
  },

  CASE_INCONSISTENT_ARTIST: {
    level: ValidationLevel.WARNING,
    message: '{value} is known as {knownValue}',
  },

  SIMILAR_ARTIST: {
    level: ValidationLevel.WARNING,
    message: '{value} is similar to known artists: {similarList}',
  },

  NEW_ARTIST: {
    level: ValidationLevel.WARNING,
    message: '{value} is not similar to any known artists',
  },

  BAD_CONNECTORS: {
    level: ValidationLevel.ERROR,
    fixer: fixConnectors,
    autoFix: ValidationAutoFix.IMMEDIATE,
    message: 'Invalid connectors',
  },

  SINGLE_AMPERSAND: {
    level: ValidationLevel.ERROR,
    fixer: fixAmpersand,
    autoFix: ValidationAutoFix.IMMEDIATE,
    message: 'Use ampersands with two artists',
  },
});

/**
 * This list is used to transform the fuzzy pattern of a specific artist
 * connector into it's canonical value.
 */
const connectorTransforms = [
  ['vs\\.?', 'vs'],
  ['and', '&'],
  ["f(?:ea)?t(?:uring)?[.']?", 'Ft.'],
] as const;

/**
 * Replace invalid artist connectors within an artist string.
 */
function fixConnectors(artistsString: string) {
  let str = artistsString;

  for (const item of connectorTransforms) {
    const [pattern, replace] = item;
    str = str.replace(new RegExp(` ${pattern} `, 'gi'), ` ${replace} `);
  }

  return str;
}

/**
 * Fix an artist with one comma separator by replacing the comma with an
 * ampersand.
 */
function fixAmpersand(artistsString: string) {
  return artistsString.replace(', ', ' & ');
}

/**
 * typeMapping used for similarity validations.
 */
const typeMapping = {
  KNOWN: validationType.KNOWN_ARTIST,
  CASING: validationType.CASE_INCONSISTENT_ARTIST,
  SIMILAR: validationType.SIMILAR_ARTIST,
  UNKNOWN: validationType.NEW_ARTIST,
} as const;

/**
 * Validate a single artist name. See `utils.validateFromKnowns`.
 */
function validateOneArtist(
  artist: string,
  validations: Validations,
  knowns: KnownValues
) {
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
function validateConnectors(artistsString: string, validations: Validations) {
  const fuzzy = artistsString.match(splitOn);

  // There are no detectable artist connectors
  if (fuzzy === null) {
    return;
  }

  // If the connector is just a single comma, replace that with an ampersand
  if (fuzzy.length === 1 && fuzzy[0] === ', ') {
    validations.add(validationType.SINGLE_AMPERSAND);
  }

  const strict = artistsString.match(strictSplitOn);

  if (strict !== null && strict.length === fuzzy.length) {
    return;
  }

  validations.add(validationType.BAD_CONNECTORS);
}

type Options = { knownArtists: KnownValues };

/**
 * Validate a given artist string.
 *
 * 1. MIXED: Validate each individual artist. See `validateOneArtist`.
 * 2. ERROR: Validate the artists connectors. See `validateConnectors`.
 */
function validateArtistsString(
  artistsString: string,
  options: Options,
  validations: Validations
) {
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
function artist(track: Track, options?: Options) {
  const artistsString = track.artist || '';

  const validations = new Validations();

  // 1. Artist must not be empty
  if (artistsString === '') {
    return validations.add(validationType.EMPTY);
  }

  validations.add(validationType.NOT_EMPTY);

  if (options === undefined) {
    options = { knownArtists: { clean: [], normal: {} } };
  }

  // 2. Validate the entire artists string
  validateArtistsString(artistsString, options, validations);

  return validations;
}

artist.validatesFields = ['artist'];

export { artist, validateArtistsString };
