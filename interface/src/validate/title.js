import { autoFixTypes, levels, makeValidations, Validations } from './utils';

const validationType = makeValidations({
  EMPTY: {
    level:   levels.ERROR,
    message: 'Title must not be left empty',
  },

  NOT_EMPTY: {
    level:   levels.VALID,
    message: 'Title is not empty',
  },

  NO_ORIGINAL_MIX: {
    level:   levels.ERROR,
    fixer:   removeOriginalMix,
    autoFix: autoFixTypes.POST_EDIT,
  },

  NO_FEATURING: {
    level: levels.ERROR,
    message: 'Title should not include featuring artist',
  },

  REMIX_MATCHED: {
    level: levels.VALID,
    message: 'Remix note matches remixer field',
  },

  REMIX_NOTE_MISSING: {
    level: levels.ERROR,
    message: 'Remix field set, but title is missing remix note',
  },

  REMIX_MISMATCH: {
    level: levels.ERROR,
    message: 'Remix field set, but title artists are different',
  },

  BAD_REMIX_FORMAT: {
    level:   levels.ERROR,
    fixer:   fixRemixCasing,
    autoFix: autoFixTypes.IMMEDIATE,
  },
});

/**
 * For titles that follow the usual 'Track name (Artist Remix)' style, this
 * pattern can be used to detect the artist name and remix wording.
 */
const remixPattern = /\((.*) (re?mi?x)\)/i;

/**
 * Correct the format of tracks matching the remixPattern.
 */
function fixRemixCasing(title) {
  const match = title.match(remixPattern);

  if (match === null) {
    return title;
  }

  return title.replace(remixPattern, `(${match[1]} Remix)`);
}

const originalMixPattern = / ?\(original mix\)/i;

/**
 * Remove the '(Original Mix)' string from the title.
 */
function removeOriginalMix(title) {
  return title.replace(originalMixPattern, '');
}

const featPattern = /[ [(]f(?:ea)?t\.?/i;

/**
 * Title validation will validate the following rules:
 *
 * 1. ERROR: The title field must not be left empty.
 *
 * 2. ERROR: Title should not contain '(original mix)'.
 *
 * 3. ERROR: Title should not include a featuring artist note.
 *
 * 4. ERROR: The title contains what looks like a remix note, but it is not
 *    strictly '(<artist> Remix)'. Can be automatically fixed.
 *
 * 5. MIXED: When a remixer is specified on the track this must match within
 *    the title, should any checks produce positive results no further checks
 *    will be done:
 *
 *    a. VALID: The title contains the pattern '(<remix field> .*)'
 *
 *    b. ERROR: The title contains something that looks like a remixer (the
 *       remixPattern), but the artist does not match the remixer field.
 *
 *    c. ERROR: The title doesn't container anything that looks like a remix
 *       note.
 */
function title(track) {
  const title   = track.title   || '';
  const remixer = track.remixer || '';

  const validations = new Validations();

  // 1. Title must not be empty
  if (title === '') {
    return validations.add(validationType.EMPTY);
  }

  validations.add(validationType.NOT_EMPTY);

  // 2. Title should not contain '(original mix)'
  if (title.match(originalMixPattern) !== null) {
    validations.add(validationType.NO_ORIGINAL_MIX);
  }

  // 3. Title should not contain a feauturing note
  if (title.match(featPattern) !== null) {
    validations.add(validationType.NO_FEATURING);
  }

  // 4. Title's with a remix note match should be '(<artist> Remix)'
  const remixMatch = title.match(remixPattern);

  if (remixMatch !== null && remixMatch[2] !== 'Remix') {
    validations.add(validationType.BAD_REMIX_FORMAT);
  }

  // 5. Validate tracks with remixer details
  if (remixer === '') {
    return validations;
  }

  // 5a. Valid remixer if we can match (<artist>.*).
  const safeRemixer = remixer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const specificRemixer = new RegExp(`.*\\(${safeRemixer}.*\\)`);

  if (title.match(specificRemixer) !== null) {
    return validations.add(validationType.REMIX_MATCHED);
  }

  // 5b. No exact match, but we may still have something that looks like a
  // remixer tag.
  if (remixMatch !== null) {
    return validations.add(validationType.REMIX_MISMATCH);
  }

  // 5c. Remixer note is completely missing
  validations.add(validationType.REMIX_NOTE_MISSING);

  return validations;
}

title.validatesFields = [ 'title', 'remixer' ];

export { title, remixPattern };
