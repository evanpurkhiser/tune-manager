import * as similarity from 'string-similarity';
import format from 'string-format';

import {
  ValidationLevel,
  Validation,
  ValidationAutoFix,
  KnownValidations,
  KnownValues,
} from './types';

/**
 * @deprecated REPLCAE WITH ENUM
 * Validation levels
 */
export const levels = {
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  VALID: 'valid',
} as const;

/**
 * @deprecated REPLCAE WITH ENUM
 * Validation autoFix supports a few different types of autofixers.
 */
export const autoFixTypes = {
  IMMEDIATE: 'immediate',
  POST_EDIT: 'post_edit',
} as const;

/**
 * levelPrecedence specifies the order of validation levels in order of
 * importance.
 */
export const levelPresedence = [
  ValidationLevel.ERROR,
  ValidationLevel.WARNING,
  ValidationLevel.INFO,
  ValidationLevel.VALID,
] as const;

/**
 * Make validation inserts the validation type into each validation object. The
 * type is derived from the validations key.
 */
export function makeValidations<T>(config: { [K in keyof T]: Validation<K> }) {
  for (const type in config) {
    config[type].type = type;
  }

  return config;
}

/**
 * Validations stores a list of validation results performed on a field. Use
 * this object to add validations and retrieve details about the set of
 * validations.
 */
export class Validations {
  items: Validation[] = [];

  /**
   * Add a new item to the list of validations.
   */
  add(
    validation: Validation,
    { fields = {} }: { fields?: Validation['fields'] } = {}
  ) {
    const item = { ...validation, fields };

    if (typeof item.message === 'string') {
      item.message = format(item.message, fields);
    }

    this.items.push(item);

    return this;
  }

  /**
   * Merge another validation object.
   */
  merge(validations: Validations) {
    this.items = this.items.concat(validations.items);

    return this;
  }

  /**
   * Retrieve the most important level identifier, as specified by the
   * levelPresedence.
   */
  level() {
    const levels = this.items.map(v => v.level);
    return levelPresedence.find(l => levels.includes(l));
  }

  /**
   * Execute all automatic validation fixes of the specified type on the
   * provided value.
   *
   * If a automatic fix is able to be applied, the validation will be removed
   * from the list of validations as it's considered to be 'fixed'.
   */
  autoFix(value: string, types = [ValidationAutoFix.IMMEDIATE]) {
    const fixers = this.items
      .filter(v => types.includes(v.autoFix!) && v.fixer !== undefined)
      .map(v => v.fixer!);

    if (fixers.length === 0) {
      return value;
    }

    let newValue = value;

    for (const fixer of fixers) {
      const oldValue = newValue;
      newValue = fixer(newValue);

      // If we were able to apply the validation fix, remove it
      if (newValue !== oldValue) {
        this.items = this.items.filter(v => v.fixer === fixer);
      }
    }

    return newValue;
  }
}

type Options = {
  knowns?: KnownValues;
  typeMapping: KnownValidations;
};

/**
 * Specifies the threshold that the similarity rating of known values must
 * reach to be considered a similar values.
 */
const SIMILARITY_CUTOFF = 0.75;

/**
 * Validate a value given a list of known values.
 *
 * The following validations are ran against the provided value. Should any
 * validation produce positive results, no further checks will be done.
 *
 *  1. VALID: Does the value exist in the list of known values?
 *
 *  2. WARNING: Is the value case-insensitively matched within the list of
 *     known values? This can be fixed, but should not be done automatically.
 *
 *  3. WARNING: Does the value have a similarity match to any known values?
 *
 *  4. WARNING: Does the value not exist in the list of known values.
 *
 * When validations are generate, the following field names will be used. Use
 * these parameters in the validation type messages:
 *
 *   - value:         The value provided.
 *   - knownValue:    The known value for CASING.
 *   - similarList:   The string representation of similar values for SIMILAR.
 *   - similarKnowns: The similar values list for SIMILAR.
 */
export function validateFromKnowns(value: string, options: Options) {
  const { knowns, typeMapping } = options;

  const validations = new Validations();

  if (knowns === undefined) {
    return validations;
  }

  // 1. Does the value already match exactly?
  if (knowns.clean.includes(value)) {
    return validations.add(typeMapping.KNOWN, { fields: { value } });
  }

  // 2. Is the values capitalization incorrect?
  const knownValue = knowns.normal[value.toLowerCase()];

  if (knownValue !== undefined) {
    const fields = { value, knownValue };
    return validations.add(typeMapping.CASING, { fields });
  }

  // 3. Is the value similar to any of the known values.
  let similarKnowns: string[] = [];

  // Do not look for similar values if the list of knowns is empty.
  // Unfortunately similarity.findBestMatch will raise an exception if the list
  // is empty.
  if (knowns.clean.length > 0) {
    const matches = similarity.findBestMatch(value, knowns.clean);

    similarKnowns = matches.ratings
      .filter(m => m.rating > SIMILARITY_CUTOFF)
      .map(m => m.target);
  }

  if (similarKnowns.length > 0) {
    const similarList = similarKnowns.join(', ');
    const fields = { value, similarKnowns, similarList };

    return validations.add(typeMapping.SIMILAR, { fields });
  }

  // 4. This is a value we haven't seen anything like before...
  validations.add(typeMapping.UNKNOWN, { fields: { value } });

  return validations;
}
