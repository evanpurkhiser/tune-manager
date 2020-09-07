import {Track} from 'app/importer/types';

import {ValidationLevel} from './types';
import {makeValidations, Validations} from './utils';

const formatPattern = /^[A-Z0-9-]{4,}$/;

const validationType = makeValidations({
  INVALID_FORMAT: {
    level: ValidationLevel.ERROR,
    message: `Releases must match ${formatPattern}`,
  },

  VALID_FORMAT: {
    level: ValidationLevel.VALID,
    message: 'Release identifier is in a valid format',
  },
});

/**
 * Release validation will validate the following rules:
 *
 * 1. ERROR: The release field should conform to the `formatPattern`.
 */
function release(track: Track) {
  const release = track.release ?? '';

  const validations = new Validations();

  if (release === '') {
    return validations;
  }

  // 1. The release field must conform to the `formatPattern`.
  if (release.match(formatPattern) !== null) {
    return validations.add(validationType.VALID_FORMAT);
  }

  validations.add(validationType.INVALID_FORMAT);

  return validations;
}

release.validatesFields = ['release'];

export {release};
