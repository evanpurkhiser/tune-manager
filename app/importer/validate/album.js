import { levels, makeValidations, Validations } from './utils';

const validationType = makeValidations({
  EMPTY_WITH_DISC_NUMBER: {
    level: levels.ERROR,
    message: 'A disc number is specified, but no album name',
  },
});

/**
 * Album validation will validate the following rules:
 *
 * 1. ERROR: A disc number is specified, but the album is left empty.
 *
 */
function album(track) {
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
