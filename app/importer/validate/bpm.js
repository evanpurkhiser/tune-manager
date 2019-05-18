import { autoFixTypes, levels, makeValidations, Validations } from './utils';

const bpmPattern = /^[0-9]{2,}\.[0-9]{2}$/;

const validationType = makeValidations({
  VALID_FORMAT: {
    level: levels.VALID,
    message: 'BPM is correctly formatted',
  },

  INVALID_FORMAT: {
    level: levels.ERROR,
    message: `BPM should match ${bpmPattern}`,
    autoFix: autoFixTypes.POST_EDIT,
    fixer: formatBPM,
  },
});

const BPM_PRECISION = 2;

/**
 * Format the BPM value with floating precison.
 */
function formatBPM(bpm) {
  const number = Number.parseFloat(bpm);

  return Number.isNaN(number) ? bpm : number.toFixed(BPM_PRECISION);
}

/**
 * BPM validation will validate the following rules:
 *
 * 1. ERROR: The BPM does not match the `bpmPattern`.
 */
function bpm(track) {
  const bpm = track.bpm || '';

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

export { bpm };
