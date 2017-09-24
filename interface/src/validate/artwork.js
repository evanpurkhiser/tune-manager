import { levels, makeValidations, Validations } from './utils';

const validationType = makeValidations({
  NOT_SQUARE: {
    level:   levels.ERROR,
    message: 'Artwork must be square',
  },

  TOO_SMALL: {
    level:   levels.ERROR,
    message: 'Artwork should be a minimum of 500x500',
  },
});

const MIN_SIZE = 500;

/**
 * This will validate an individule artwork object for the following:
 *
 * 1. ERROR: The demensions must be square.
 * 2. ERROR: The artwork must be larger than MIN_SIZE x MIN_SIZE.
 */
function individualArtwork(artwork) {
  const validations = new Validations();
  const { height, width } = artwork.dimensions;

  if (height !== width) {
    validations.add(validationType.NOT_SQUARE);
  }

  if (height < MIN_SIZE || width < MIN_SIZE) {
    validations.add(validationType.TOO_SMALL);
  }

  return validations;
}

/**
 * Validates the currently selected artwork.
 */
function artwork(track) {
  const artwork = track.artwork || [];
  const artSelected = artwork[track.artworkSelected];

  if (artSelected === undefined) {
    return new Validations();
  }

  return individualArtwork(artSelected);
}

export { artwork, individualArtwork };
