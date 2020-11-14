import {css} from '@emotion/core';

export const tagHover = (color: string) => css`
  position: relative;
  cursor: pointer;
  display: inline-block;
  transition: color 50ms ease-in-out;
  z-index: 1;

  &:before {
    content: '';
    position: absolute;
    top: -2px;
    left: -4px;
    right: -4px;
    bottom: -2px;
    background: ${color};
    transform-origin: 0 0;
    transform: scaleX(0);
    transition: transform 75ms ease-in-out;
    border-radius: 2px;
    z-index: -1;
  }

  &:hover:after {
    content: '';
    display: block;
    position: absolute;
    top: -10px;
    left: -10px;
    right: -10px;
    bottom: -10px;
  }

  &:hover {
    color: #fff;
  }

  &:hover:before {
    transform: scaleX(1);
  }
`;
