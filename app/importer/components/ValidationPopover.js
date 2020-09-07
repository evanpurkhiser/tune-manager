import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import * as validate from 'app/importer/validate/utils';

const ValidationPopover = p => {
  let {items} = p.validations;

  if (!p.showValid) {
    items = items.filter(i => i.level !== validate.levels.VALID);
  }

  if (items.length === 0) {
    return null;
  }

  const level = p.validations.level();
  const tooltipStyles = classNames('validation-popover', level);

  const validationItems = items.map(i => {
    return <li className={i.level}>{i.message}</li>;
  });

  return (
    <div className={tooltipStyles}>
      <ul>{validationItems}</ul>
    </div>
  );
};

ValidationPopover.propTypes = {
  validations: PropTypes.instanceOf(validate.Validations).isRequired,
  showValid: PropTypes.bool,
};

export default ValidationPopover;
