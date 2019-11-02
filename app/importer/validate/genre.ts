import { Track } from 'app/importer/types';

import { ValidationLevel, KnownValues } from './types';
import { makeValidations, validateFromKnowns, Validations } from './utils';

const validationType = makeValidations({
  NOT_EMPTY: {
    level: ValidationLevel.ERROR,
    message: 'Genre must be specified',
  },

  KNOWN_GENRE: {
    level: ValidationLevel.VALID,
    message: '{value} is a known genre',
  },

  CASE_INCONSISTENT_GENRE: {
    level: ValidationLevel.WARNING,
    message: '{value} is known as {knownValue}',
  },

  SIMILAR_GENRE: {
    level: ValidationLevel.WARNING,
    message: '{value} is similar to known genres: {similarList}',
  },

  NEW_GENRE: {
    level: ValidationLevel.WARNING,
    message: '{value} is not similar to any known genres',
  },
});

/**
 * Type mapping for similarity validator.
 */
const typeMapping = {
  KNOWN: validationType.KNOWN_GENRE,
  CASING: validationType.CASE_INCONSISTENT_GENRE,
  SIMILAR: validationType.SIMILAR_GENRE,
  UNKNOWN: validationType.NEW_GENRE,
};

type Options = {
  knownGenres?: KnownValues;
};

/**
 * Genre validation will validate the following rules:
 *
 * 1. ERROR: Genre must not be left blank.
 * 1. MIXED: Validate the genre string. See `utils.validateFromKnowns`.
 */
function genre(track: Track, options: Options = {}) {
  const genre = track.genre || '';
  const { knownGenres } = options;

  const validations = new Validations();

  // 1. The genre must not be empty
  if (genre === '') {
    return validations.add(validationType.NOT_EMPTY);
  }

  // 2. Validate the genre from the list of knowns
  return validateFromKnowns(genre, {
    knowns: knownGenres,
    typeMapping,
  });
}

genre.validatesFields = ['genre'];

export { genre };
