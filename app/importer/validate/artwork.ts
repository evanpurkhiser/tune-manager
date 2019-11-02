import { Artwork } from 'app/importer/types';

import { ValidationLevel } from './types';
import { makeValidations, Validations } from './utils';

const validationType = makeValidations({
  NOT_SQUARE: {
    level: ValidationLevel.ERROR,
    message: 'Artwork must be square',
  },

  TOO_SMALL: {
    level: ValidationLevel.ERROR,
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
function individualArtwork(artwork: Artwork) {
  const validations = new Validations();

  if (artwork === undefined) {
    return validations;
  }

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
function artwork() {
  // TODO: For now this is noop. This becoems a little tricky to implement in
  //       such a way where the track is all that's required for validation.
  return new Validations();
}

export { artwork, individualArtwork };
