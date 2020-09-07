import moo from 'moo';

import {Filter} from 'app/catalog/types';

const word = {
  match: /[^\s\n:]+:?/,
  type: moo.keywords({filter: Object.values(Filter).map(k => `${k}:`)}),
};

const space = {
  match: /\s+/,
  lineBreaks: true,
};

// Our lexer generates word and space tokens when in it's `main` state. A
// `filter` keyword may be produced by a matching word, in which case we move
// into the `keyValue` state.
//
// A `value` or `boolean` may be matched in the keyValue state, along with
// words and spaces. Any match here will return to the main state.

const lexer = moo.states({
  main: {word, space},
  keyValue: {
    value: {match: /"(?:\\["\\]|[^\n"\\])*"/, pop: 1},
    boolean: {match: /(?:1|0)/, pop: 1},
    word: {...word, pop: 1},
    space: {...space, pop: 1},
  },
});

// NOTE: There is currently no way to push state with moo when a keyword is
// matched [0]. We need to move to the `keyValue` lexer state after matching a
// filter, so we will patch the `next` function to push this state for us.
//
// [0]: https://github.com/no-context/moo/issues/115
const nextFn = lexer.next;

lexer.next = () => {
  const rv = nextFn.apply(lexer);

  if (rv && rv.type === 'filter') {
    // TODO(ts): This method is missing from the type definitions. We can
    // remove the any cast when [0] is merged.
    //
    // [0]: https://github.com/DefinitelyTyped/DefinitelyTyped/pull/43477
    (lexer as any).pushState('keyValue');
  }

  return rv;
};

export default lexer;
