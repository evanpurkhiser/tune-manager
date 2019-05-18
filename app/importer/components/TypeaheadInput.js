import * as lodash from 'lodash';
import React, { Component } from 'react';
import classNames from 'classnames';
import Fuse from 'fuse.js';
import PropTypes from 'prop-types';

import { keyMapper } from 'app/importer/util/keyboard';

// After completion the caret will be moved to just after the completion. Due
// to react rendering considerations we must wait before moving the caret, or
// the value of the input will update and cause it to move again. This is the
// duration we will wait.
const CARET_TIMEOUT = 10;

const FUSE_OPTIONS = {
  shouldSort: true,
  includeMatches: true,
  threshold: 0.6,
  distance: 100,
  maxPatternLength: 32,
};

const matchShape = PropTypes.shape({
  value: PropTypes.string,
  indices: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
});

/**
 * Match represents a single listed matched item.
 *
 * This includes logic to wrap the matched indices of the match given an
 * indices list.
 */
const Match = p => {
  const { value, indices } = p.match;

  const matchParts = [];

  if (indices[0][0] !== 0) {
    matchParts.push(value.slice(0, indices[0][0]));
  }

  for (let i = 0; i < indices.length; ++i) {
    const indice = indices[i];
    const next = indices[i + 1] || [value.length];

    const part = value.slice(indice[0], indice[1] + 1);

    matchParts.push(
      <span key={i} className="matched-part">
        {part}
      </span>
    );
    matchParts.push(value.slice(indice[1] + 1, next[0]));
  }

  const classes = classNames({ focused: p.isFocused });

  return <li className={classes}>{matchParts}</li>;
};

Match.propTypes = {
  match: matchShape.isRequired,
  isFocused: PropTypes.bool,
};

/**
 * MatchesPopover renders the list of possible matches
 */
const MatchesPopover = p => (
  <ul className="typeahead-popover">
    {p.matches.map((m, i) => (
      <Match key={i} match={m} isFocused={i === p.focused} />
    ))}
  </ul>
);

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
  const shadowHead = p.match.value.slice(0, endIndex).toLowerCase();

  if (!p.value.toLowerCase().endsWith(shadowHead)) {
    return null;
  }

  return (
    <div className="typeahead-shadow">
      <span className="hidden">{p.value}</span>
      <span className="shadow">{p.match.value.slice(endIndex)}</span>
    </div>
  );
};

TypeaheadShadow.propTypes = {
  value: PropTypes.string.isRequired,
  match: matchShape.isRequired,
};

class TypeaheadInput extends Component {
  constructor() {
    super();

    this.keyMapper = keyMapper({
      escape: _ => this.resetState(),
      enter: e => this.complete(e.target),
      tab: e => this.complete(e.target),
      up: _ => this.moveFocus(-1),
      down: _ => this.moveFocus(+1),
    });

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onBlur = this.onBlur.bind(this);

    this.fuseIndex = null;
    this.state = { matches: [], focused: 0, range: [0, 0] };
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

  resetState() {
    this.setState({ matches: [], range: [0, 0], focused: 0 });
  }

  onChange(e) {
    this.props.onChange(e);

    const value = e.target.value;
    const range = [0, e.target.selectionStart];

    let partial = value.slice(...range);

    // Recompute the partial string and range when a splitter regex is provided
    // to do matching only on a portion of the value.
    if (this.props.splitter !== undefined) {
      const splitters = partial.match(this.props.splitter) || [];
      const lastSplit = splitters.pop();

      range[0] =
        lastSplit === undefined
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

    const focused =
      matches.length < this.state.focused
        ? Math.max(0, matches.length - 1)
        : this.state.focused;

    this.setState({ value, range, matches, focused });
  }

  onBlur(e) {
    this.props.onBlur(e);
    this.resetState();
  }

  moveFocus(direction) {
    const matchCount = this.state.matches.length || 1;
    const focused =
      this.state.focused + direction < 0
        ? matchCount - 1
        : (this.state.focused + direction) % matchCount;

    this.setState({ focused });

    return true;
  }

  complete(target) {
    if (this.state.matches.length === 0) {
      return false;
    }

    const before = this.state.value.slice(0, this.state.range[0]);
    const after = this.state.value.slice(this.state.range[1]);

    let completedValue = this.state.matches[this.state.focused].value;

    // If we're completing in the middle of a word, add a trailing space
    if (after.length > 0 && after[0] !== ' ') {
      completedValue += ' ';
    }

    const value = before + completedValue + after;

    // Compute the caret position just after completion. Since a full re-render
    // cycle must happen, lets hack around it a bit to make this work for now.
    const pos = value.length - after.length;
    setTimeout(_ => target.setSelectionRange(pos, pos), CARET_TIMEOUT);

    this.props.onChange({ target: { value } });
    this.resetState();

    return true;
  }

  onKeyDown(e) {
    const keyOk = this.keyMapper(e);

    if (this.props.onKeyDown !== undefined) {
      this.props.onKeyDown(e);
    }

    return keyOk;
  }

  render() {
    const { matches, focused, value, range } = this.state;

    // Render the typeahead shadow if we have a match and we're typing at the
    // tail of the input
    const shadow =
      matches.length > 0 && range[1] === value.length ? (
        <TypeaheadShadow match={matches[focused]} value={value} />
      ) : null;

    // Render the matches popover when we have matches.
    const matchesPopover =
      matches.length > 0 ? (
        <MatchesPopover focused={focused} matches={matches} />
      ) : null;

    // Extract input props
    const reservedProps = Object.keys(TypeaheadInput.propTypes);
    const inputProps = lodash.omit(this.props, reservedProps);

    return (
      <div className="typeahead">
        <input
          {...inputProps}
          type="text"
          spellCheck="false"
          onChange={this.onChange}
          onBlur={this.onBlur}
          onKeyDown={this.onKeyDown}
        />
        {shadow}
        {matchesPopover}
      </div>
    );
  }
}

TypeaheadInput.propTypes = {
  numSuggestions: PropTypes.number,
  source: PropTypes.arrayOf(PropTypes.string),
  splitter: PropTypes.instanceOf(RegExp),
  onChange: PropTypes.func,
};

TypeaheadInput.defaultProps = {
  numSuggestions: 5,
};

export default TypeaheadInput;
