import { formatTrackNumbers } from 'app/importer/util/format';

import { makeValidations, Validations } from './utils';
import { ValidationLevel, ValidationAutoFix } from './types';
import { Track } from 'app/importer/types';

const numberPattern = /^([0-9]{1,3})\/([0-9]{1,3})$/;

const validationType = makeValidations({
  VALID_NUMBER: {
    level: ValidationLevel.VALID,
    message: 'Formatting is correct',
  },

  INVALID_FORMAT: {
    level: ValidationLevel.ERROR,
    message: `Format should match ${numberPattern}`,
    autoFix: ValidationAutoFix.POST_EDIT,
    fixer: formatNumber,
  },

  HAS_ALBUM: {
    level: ValidationLevel.ERROR,
    message: 'Has album, but no disc number set',
  },

  HAS_DISC_NUMBER: {
    level: ValidationLevel.ERROR,
    message: 'Disc number set, but track is blank',
  },

  HAS_TRACK_NUMBER: {
    level: ValidationLevel.ERROR,
    message: 'Track number set, but disc is blank',
  },
});

/**
 * This pattern will match a few different formats of numbers.
 */
const fuzzyNumberPattern = /^([0-9]{1,3})( ?\/ ?([0-9]{1,3}))?$/;

/**
 * Attempt to coerce a track or disc number into our format.
 */
export function formatNumber(number: string) {
  const numberMatch = number.match(fuzzyNumberPattern);

  if (numberMatch === null) {
    return number;
  }

  const [, first, , second] = numberMatch;

  if (second === undefined) {
    return number;
  }

  return formatTrackNumbers(first, second);
}

/**
 * Validates the number format.
 *
 *  - The number string matches `numbeerPattern`.
 *  - The first number matches the string length of the total.
 *  - The first number is not larger than the total.
 */
function validateNumber(numberString: string, validations: Validations) {
  if (numberString === '') {
    return;
  }

  const match = numberString.match(numberPattern);

  if (match === null) {
    return validations.add(validationType.INVALID_FORMAT);
  }

  const [, first, second] = match;

  if (first.length !== second.length) {
    return validations.add(validationType.INVALID_FORMAT);
  }

  if (Number.parseInt(first, 10) > Number.parseInt(second, 10)) {
    return validations.add(validationType.INVALID_FORMAT);
  }

  return validations.add(validationType.VALID_NUMBER);
}

/**
 * Track number validation will validate the following rules:
 *
 * 1. ERROR: A disc number is set, but the track number is empty.
 * 2. MIXED: The number does not match the `numberPattern`.
 */
function track(track: Track) {
  const trackNumber = track.track || '';
  const discNumber = track.disc || '';

  const validations = new Validations();

  // 1. The disc number is set, but not the track number.
  if (discNumber !== '' && trackNumber === '') {
    return validations.add(validationType.HAS_DISC_NUMBER);
  }

  // 2. The track number must validate
  validateNumber(trackNumber, validations);

  return validations;
}

track.validatesFields = ['track', 'disc'] as const;

/**
 * Disc number validation will validate the following rules:
 *
 * 1. ERROR: The album feild has a value, but the disc is empty.
 * 2. ERROR: A track number is set, but the disc number is blank.
 * 3. MIXED: The number does not match the `numberPattern`.
 */
function disc(track: Track) {
  const discNumber = track.disc || '';
  const trackNumber = track.track || '';
  const album = track.album || '';

  const validations = new Validations();

  // 1. The album is set, but the disc number is missing
  if (album !== '' && discNumber === '') {
    return validations.add(validationType.HAS_ALBUM);
  }

  // 2. The track number is set, but not the disc number.
  if (trackNumber !== '' && discNumber === '') {
    return validations.add(validationType.HAS_TRACK_NUMBER);
  }

  // 3. The disc number must validate
  validateNumber(discNumber, validations);

  return validations;
}

disc.validatesFields = ['track', 'disc', 'album'] as const;

export { track, disc };
