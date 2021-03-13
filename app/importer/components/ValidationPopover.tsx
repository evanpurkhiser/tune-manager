import React from 'react';
import {FaCheckCircle, FaExclamationCircle, FaExclamationTriangle} from 'react-icons/fa';
import styled from '@emotion/styled';

import {ValidationLevel} from 'app/importer/validate/types';
import * as validate from 'app/importer/validate/utils';

import Popover from './Popover';

const levelColors = {
  [ValidationLevel.WARNING]: ['#fef2e2', '#ffad7a'],
  [ValidationLevel.ERROR]: ['#ffe4e8', '#f37777'],
  [ValidationLevel.VALID]: ['#d2fbe6', '#6bd4a5'],
};

const LevelIcons = {
  [ValidationLevel.WARNING]: FaExclamationTriangle,
  [ValidationLevel.ERROR]: FaExclamationCircle,
  [ValidationLevel.VALID]: FaCheckCircle,
};

type Props = {
  validations: validate.Validations;
  showValid: boolean;
};

const ValidationPopover = (p: Props) => {
  let {items} = p.validations;

  if (!p.showValid) {
    items = items.filter(i => i.level !== ValidationLevel.VALID);
  }

  if (items.length === 0) {
    return null;
  }

  const validationItems = items.map(validation => {
    const Icon = LevelIcons[validation.level];

    return (
      <Item key={validation.message}>
        <Icon color={levelColors[validation.level][1]} />
        {validation.message}
      </Item>
    );
  });

  return (
    <Container level={p.validations.level()}>
      <ul>{validationItems}</ul>
    </Container>
  );
};

const Container = styled(Popover)<{level?: ValidationLevel}>`
  width: auto;
  font-size: 10px;
  line-height: 16px;
  border-top: 5px solid ${p => (p.level ? levelColors[p.level][0] : '#fff')};
  top: 42px;
  max-width: 300px;
  border-radius: 1px;
  text-align: left;
  margin-right: -1000px;

  ul {
    padding: 0.325rem;
  }
`;

const Item = styled('li')`
  display: flex;
  gap: 0.325rem;
  position: relative;
  align-items: center;
`;

export default ValidationPopover;
