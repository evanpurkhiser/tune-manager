import { levels, makeValidations, Validations } from './utils';
import { validateFromKnowns } from './utils';

const validationType = makeValidations({
  KNOWN_PUBLISHER: {
    level:   levels.VALID,
    message: '{value} is a known publisher',
  },

  CASE_INCONSISTENT_PUBLISHER: {
    level:   levels.WARNING,
    message: '{value} is known as {knownValue}',
  },

  SIMILAR_PUBLISHER: {
    level:   levels.WARNING,
    message: '{value} is similar to known publishers: {similarList}',
  },

  NEW_PUBLISHER: {
    level: levels.WARNING,
    message: '{value} is not similar to any known publishers',
  },
});

/**
 * Type mapping for similarity validator.
 */
const typeMapping = {
  KNOWN:   validationType.KNOWN_PUBLISHER,
  CASING:  validationType.CASE_INCONSISTENT_PUBLISHER,
  SIMILAR: validationType.SIMILAR_PUBLISHER,
  UNKNOWN: validationType.NEW_PUBLISHER,
};

/**
 * Publisher validation will validate the following rules:
 *
 * 1. MIXED: Validate the publisher string. See `utils.validateFromKnowns`.
 */
function publisher(track, options = {}) {
  const publisher = track.publisher || '';
  const { knownPublishers } = options;

  if (publisher === '') {
    return new Validations();
  }

  // 1. Validate the publisher from the list of knowns
  return validateFromKnowns(publisher, {
    knowns: knownPublishers,
    typeMapping,
  });
}

export { publisher };
