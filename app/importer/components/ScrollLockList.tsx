import React from 'react';
import {useUnmount} from 'react-use';

type Props = React.PropsWithChildren<React.HTMLProps<HTMLUListElement>>;

const ScrollLockList = ({children, ...props}: Props) => {
  const disableScroll = () => (document.body.style.overflow = 'hidden');
  const enableScroll = () => (document.body.style.overflow = 'auto');

  useUnmount(enableScroll);

  return (
    <ul {...props} onMouseOver={disableScroll} onMouseOut={enableScroll}>
      {children}
    </ul>
  );
};

export default ScrollLockList;
