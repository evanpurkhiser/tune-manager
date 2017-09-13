import * as lodash from 'lodash';
import keycomb from 'keycomb';

/**
 * actionHandler is a function factory that given a map will produce a keyboard
 * event handler function that will lookup an action the keyboard event and
 * execute the action.
 */
const actionHandler = map => e => {
  const item = map.filter(i => lodash.isMatch(e, i.keys))[0];

  if (item === undefined) {
    return;
  }

  const success = item.action(e);

  if (success === true) {
    e.preventDefault();
  }
};

/**
 * Given a keymap in the form of
 *
 *  { 'ctrl+a': doSomething }
 *
 * Transform this into a list of objects that conform to the following object
 * structure, which can be used to match against key events.
 *
 *  { keys: { keyCode: 64, ctrlKey: true }, action: doSomething }
 */
const transformMap = map => lodash.map(map, (fn, s) => {
  const keyObject = keycomb(s);

  // keycomb supports multiple non-modifier keys, thus makes the keyCode
  // property an array. Flatten this to the first object since we will be
  // matching against keyboard events that *do not* have multiple key codes.
  keyObject.keyCode = keyObject.keyCode.shift();

  return { keys: keyObject, action: fn };
});

/**
 * keyMapper is a factory function which given a map of the shape:
 *
 *   { 'up': goUpAction, 'down': goDownAction }
 *
 * Will return a event handler function that maps the key strings against the
 * events passed when the returned method is triggered.
 */
const keyMapper = map => actionHandler(transformMap(map));

export { keyMapper };
