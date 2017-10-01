import React from 'react';

const ScrollLockList = p => <ul { ...p }
  onMouseOver={_ => document.body.style.overflow = 'hidden'}
  onMouseOut={_ => document.body.style.overflow = 'auto'}>
  {p.children}
</ul>;

export default ScrollLockList;
