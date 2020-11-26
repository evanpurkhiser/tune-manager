import {Track} from 'app/importer/types';

import {ValidationAutoFix, ValidationLevel} from './types';
import {makeValidations, Validations} from './utils';

const yearPattern = /^[0-9]{4}$/;

const validationType = makeValidations({
  EMPTY: {
    level: ValidationLevel.ERROR,
    message: 'A release year must be specified',
  },

  NOT_EMPTY: {
    level: ValidationLevel.VALID,
    message: 'The year is set',
  },

  INVALID_FORMAT: {
    level: ValidationLevel.ERROR,
    message: `The year must match the format ${yearPattern}`,
    autoFix: ValidationAutoFix.POST_EDIT,
    fixer: reformatYear,
  },
});

const fuzzyYearPattern = /[0-9]{4}/;

/**
 * Attempt to reformat the year into a valid format. This simply looks for a 4
 * digit string within the year and assumes that is the year.
 */
function reformatYear(year: string) {
  const possibleYear = year.match(fuzzyYearPattern);

  if (possibleYear !== null) {
    return possibleYear[0];
  }

  return year;
}

/**
 * Year validation will validate the following rules:
 *
 * 1. ERROR: The year must be specified.
 * 2. ERROR: The year must match the `yearPattern`.
 */
function year(track: Track) {
  const year = track.year ?? '';

  const validations = new Validations();

  // 1. The year must not be empty
  if (year === '') {
    return validations.add(validationType.EMPTY);
  }

  validations.add(validationType.NOT_EMPTY);

  if (year.match(yearPattern) === null) {
    validations.add(validationType.INVALID_FORMAT);
  }

  return validations;
}

year.validatesFields = ['year'];

export {year};
