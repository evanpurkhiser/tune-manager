import {Track} from 'app/importer/types';

import {ValidationAutoFix, ValidationLevel} from './types';
import {makeValidations, Validations} from './utils';

const bpmPattern = /^[0-9]{2,}\.[0-9]{2}$/;

const validationType = makeValidations({
  VALID_FORMAT: {
    level: ValidationLevel.VALID,
    message: 'BPM is correctly formatted',
  },

  INVALID_FORMAT: {
    level: ValidationLevel.ERROR,
    message: `BPM should match ${bpmPattern}`,
    autoFix: ValidationAutoFix.POST_EDIT,
    fixer: formatBPM,
  },
});

const BPM_PRECISION = 2;

/**
 * Format the BPM value with floating precison.
 */
function formatBPM(bpm: string) {
  const number = Number.parseFloat(bpm);

  return Number.isNaN(number) ? bpm : number.toFixed(BPM_PRECISION);
}

/**
 * BPM validation will validate the following rules:
 *
 * 1. ERROR: The BPM does not match the `bpmPattern`.
 */
function bpm(track: Track) {
  const bpm = track.bpm ?? '';

  const validations = new Validations();

  if (bpm === '') {
    return validations;
  }

  // 1. BPM must match the bpmPattern
  if (bpm.match(bpmPattern) !== null) {
    return validations.add(validationType.VALID_FORMAT);
  }

  validations.add(validationType.INVALID_FORMAT);

  return validations;
}

bpm.validatesFields = ['bpm'];

export {bpm};
