import { Track } from 'app/importer/types';

import { ValidationLevel, KnownValues } from './types';
import { makeValidations, Validations } from './utils';
import { remixPattern } from './title';
import { validateArtistsString } from './artist';

const validationType = makeValidations({
  TITLE_HAS_REMIXER: {
    level: ValidationLevel.WARNING,
    message: 'Title has remixer, but remixer field missing',
  },
});

type Options = { knownArtists: KnownValues };

/**
 * Remixer validation will validate the following rules:
 *
 * 1. ERROR: The title appears to have a remixer note, but the remixer field is
 *    not specified.
 *
 * 2. MIXED: Validate the artists
 */
function remixer(track: Track, options: Options) {
  const remixer = track.remixer || '';
  const title = track.title || '';

  const validations = new Validations();

  // 1. Does the title appear to have some type of remixer note?
  if (remixer === '' && title.match(remixPattern) !== null) {
    return validations.add(validationType.TITLE_HAS_REMIXER);
  }

  if (remixer === '') {
    return validations;
  }

  // 2. Validate artist names
  validateArtistsString(remixer, options, validations);

  return validations;
}

remixer.validatesFields = ['remixer', 'title'];

export { remixer };
