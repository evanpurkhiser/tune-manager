export enum ValidationLevel {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  VALID = 'valid',
}

export enum ValidationAutoFix {
  /**
   * Execute the aotmated `fixer` immediately after the field has been
   * validated.
   */
  IMMEDIATE = 'immediate',
  /**
   * Execute the automated `fixer` only after the field has been edited.
   */
  POST_EDIT = 'post_edit',
}

/**
 * A Validation object represents the descriptor of a validation result.
 */
export type Validation<T = string> = {
  /**
   * The validation type key
   */
  type?: T;
  /**
   * Fields used in the message string
   */
  fields?: {[k: string]: any};
  /**
   * The validation error message
   */
  readonly message: string;
  /**
   * The validation severity
   */
  readonly level: ValidationLevel;
  /**
   * Should the validation be automatically fixed when invalid
   */
  readonly autoFix?: ValidationAutoFix;
  /**
   * The fixer for the validation
   */
  readonly fixer?: (s: string) => string;
};

/**
 * Mappings for validating a value against a set of known values
 */
export type KnownValidations = {
  /**
   * The validate to use when the value is part of the known list.
   */
  KNOWN: Validation;
  /**
   * The validation to use when the value is within the knowns, but does not
   * match the casing.
   */
  CASING: Validation;
  /**
   * The validation to use when the value is very similar to some items in the
   * knnwns list.
   */
  SIMILAR: Validation;
  /**
   * The validation to use when the value is not known.
   */
  UNKNOWN: Validation;
};

/**
 * A set of known values
 */
export type KnownValues = {
  /**
   * Clean knowns are the exact known values
   */
  clean: string[];
  /**
   * Normal knowns have been normalized to a case insenstive string, with a
   * mapping to the true clean known value.
   */
  normal: {[k: string]: string};
};
