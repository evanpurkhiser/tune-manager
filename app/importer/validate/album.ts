import { Track } from 'app/importer/types';

import { ValidationLevel } from './types';
import { makeValidations, Validations } from './utils';

const validationType = makeValidations({
  EMPTY_WITH_DISC_NUMBER: {
    level: ValidationLevel.ERROR,
    message: 'A disc number is specified, but no album name',
  },
});

/**
 * Album validation will validate the following rules:
 *
 * 1. ERROR: A disc number is specified, but the album is left empty.
 *
 */
function album(track: Track) {
  const album = track.album || '';
  const disc = track.disc || '';

  const validations = new Validations();

  if (album === '' && disc !== '') {
    validations.add(validationType.EMPTY_WITH_DISC_NUMBER);
  }

  return validations;
}

album.validatesFields = ['album', 'disc'];

export { album };
