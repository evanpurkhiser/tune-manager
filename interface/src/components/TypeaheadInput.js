import * as lodash from 'lodash';
import React, { Component } from 'react';
import classNames from 'classnames';
import Fuse from 'fuse.js';
import PropTypes from 'prop-types';

const FUSE_OPTIONS = {
  shouldSort:         true,
  includeMatches:     true,
  threshold:          0.6,
  distance:           100,
  maxPatternLength:   32,
};

const matchShape = PropTypes.shape({
  value:   PropTypes.string,
  indices: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
});

/**
 * Match represents a single listed matched item.
 *
 * This includes logic to wrap the matched indicies of the match given an
 * indicies list.
 */
const Match = p => {
  const { value, indices } = p.match;

  const matchParts = [];

  if (indices[0][0] !== 0) {
    matchParts.push(value.slice(0, indices[0][0]));
  }

  for (let i = 0; i < indices.length; ++i) {
    const indice = indices[i];
    const next   = indices[i + 1] || [ value.length ];

    const part = value.slice(indice[0], indice[1] + 1);

    matchParts.push(<span key={i} className="matched-part">{part}</span>);
    matchParts.push(value.slice(indice[1] + 1, next[0]));
  }

  const classes = classNames({ focused: p.isFocused });

  return <li className={classes}>{matchParts}</li>;
};

Match.propTypes = {
  match:     matchShape.isRequired,
  isFocused: PropTypes.bool,
};

/**
 * MatchesPopover renders the list of possible matches
 */
const MatchesPopover = p => <ul className="typeahead-popover">
  {p.matches.map((m, i) => <Match
    key={m.item}
    match={m.matches[0]}
    isFocused={i === p.focused} />)}
</ul>;

MatchesPopover.propTypes = {
  matches: PropTypes.arrayOf(matchShape).isRequired,
};

/**
 * TypeheadShadow renders the shadow text of the focused match if the current
 * value is a ^substring of it
 */
const TypeaheadShadow = p => {
  if (!p.match.value.toLowerCase().startsWith(p.value.toLowerCase())) {
    return null;
  }

  const shadow = p.match.value.substring(p.value.length);

  return <div className="typeahead-shadow">
    <span className="hidden">{p.value}</span>
    <span className="shadow">{shadow}</span>
  </div>;
};

TypeaheadShadow.propTypes = {
  value: PropTypes.string.isRequired,
  match: matchShape,
};

class TypeaheadInput extends Component {
  constructor() {
    super();

    this.fuseIndex = null;
    this.state = { matches: [], focused: 0 };
  }

  rebuildIndex(source) {
    this.fuseIndex = new Fuse(source, FUSE_OPTIONS);
  }

  componentDidMount() {
    this.rebuildIndex(this.props.source);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.source !== this.props.source) {
      this.rebuildIndex(nextProps.source);
    }
  }

  onChange(e) {
    this.props.onChange(e);

    const position = e.target.selectionStart;
    const value = e.target.value;
    const partial = value.slice(0, position);

    const matches = this.fuseIndex.search(partial).slice(0, 5);
    const focused = matches.length < this.state.focused
      ? matches.length
      : this.state.focused;

    this.setState({ value, position, matches, focused });
  }

  render() {
    const { matches, focused, value, position } = this.state;
    const props = lodash.omit(this.props, [ 'source', 'onChange' ]);

    // Render the typeahead shadow if we have a match and we're typing at the
    // tail of the input
    const shadow = matches.length > 0 && position === value.length
      ? <TypeaheadShadow match={matches[focused].matches[0]} value={value} />
      : null;

    // Render the matches popover when we have matches.
    const matchesPopover = matches.length > 0
      ? <MatchesPopover focused={focused} matches={matches} />
      : null;

    return <div className="typeahead">
      <input
        type="text"
        spellCheck="false"
        onChange={e => this.onChange(e)}
        {...props} />
      {shadow}
      {matchesPopover}
    </div>;
  }
}

export default TypeaheadInput;
