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
    key={i}
    match={m}
    isFocused={i === p.focused} />)}
</ul>;

MatchesPopover.propTypes = {
  matches: PropTypes.arrayOf(matchShape).isRequired,
};

/**
 * TypeheadShadow renders the shadow text of the focused match if the current
 * value ends overlapping the matched value.
 */
const TypeaheadShadow = p => {
  if (p.match.indices[0][0] !== 0) {
    return null;
  }

  const endIndex = p.match.indices[0][1] + 1;
  const shadowHead = p.match.value
    .slice(0, endIndex)
    .toLowerCase();

  if (!p.value.toLowerCase().endsWith(shadowHead)) {
    return null;
  }

  return <div className="typeahead-shadow">
    <span className="hidden">{p.value}</span>
    <span className="shadow">{p.match.value.slice(endIndex)}</span>
  </div>;
};

TypeaheadShadow.propTypes = {
  value: PropTypes.string.isRequired,
  match: matchShape.isRequired,
};

class TypeaheadInput extends Component {
  constructor() {
    super();

    this.fuseIndex = null;
    this.state = { matches: [], focused: 0, range: [ 0, 0 ] };
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

    const value = e.target.value;
    const range = [ 0, e.target.selectionStart ];

    let partial = value.slice(...range);

    // Recompute the partial string and range when a splitter regex is provided
    // to do matching only on a portion of the value.
    if (this.props.splitter !== undefined) {
      const splitters = partial.match(this.props.splitter) || [];
      const lastSplit = splitters.pop();

      range[0] = lastSplit === undefined
        ? 0
        : partial.lastIndexOf(lastSplit) + lastSplit.length;

      partial = value.slice(...range);
    }

    // Compute new matches for the vlaue. Note that since we are only indexing
    // on a list of strings, Fuse will not return multiple matched fields, so
    // we can just map to the only matched field.
    const matches = this.fuseIndex
      .search(partial)
      .slice(0, this.props.numSuggestions)
      .map(m => m.matches[0]);

    const focused = matches.length < this.state.focused
      ? matches.length
      : this.state.focused;

    this.setState({ value, range, matches, focused });
  }

  render() {
    const { matches, focused, value, range } = this.state;
    const props = lodash.omit(this.props, [ 'source', 'onChange' ]);

    // Render the typeahead shadow if we have a match and we're typing at the
    // tail of the input
    const shadow = matches.length > 0 && range[1] === value.length
      ? <TypeaheadShadow match={matches[focused]} value={value} />
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

TypeaheadInput.defaultProps = {
  numSuggestions: 5,
};

export default TypeaheadInput;
