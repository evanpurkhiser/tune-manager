const keyMapper = map => e => {
  const fn = map[e.keyCode];

  if (fn === undefined) {
    return;
  }

  const success = fn(e);

  if (success === true) {
    e.preventDefault();
  }
};

export { keyMapper };
