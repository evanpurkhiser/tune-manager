import * as action from '../../actions';
import * as path from 'path';
import * as validate from '../../validate';
import { splitOn } from '../../util/artistMatch';
import classNames from 'classnames';
import React, { Component } from 'react';
import TypeaheadInput from '../TypeaheadInput';

export function FileName(props) {
  const filename = path.basename(props.track.filePath);

  return <div className="field file-name">
    <div className="fixed">{filename}</div>
    <div className="full">{filename}</div>
  </div>;
}

/**
 * Generic track Field
 */
class Field extends Component {
  constructor() {
    super();

    this.state = {
      value: '',
      validations: new validate.Validations(),
    };
  }

  componentWillReceiveProps(nextProps) {
    const value = nextProps.track[nextProps.name] || '';
    const validations = this.getValidations(nextProps, value);

    this.setState({ validations, value });
  }

  onChange(value) {
    const validations = this.getValidations(this.props, value);
    const fixedValue  = validations.autoFix(value);

    this.setState({ validations, value: fixedValue });
  }

  getValidations(props, value) {
    if (!props.validator) {
      return new validate.Validations();
    }

    // Validate the track with the current state of the field
    const { track, name } = props;
    const newTrack = { ...track, [name]: value };

    return props.validator(newTrack, props.validatorOptions);
  }

  updateField() {
    const id    = this.props.track.id;
    const name  = this.props.name;
    let value   = this.state.value.trim();

    // Execute post-edit auto fixes
    value = this.state.validations.autoFix(value, [
      validate.autoFixTypes.POST_EDIT,
    ]);

    // Do not update if nothing has changed. Bluring an unedited field while
    // multiple tracks are selected will update all tracks.
    if (value === this.props.track[name]) {
      return;
    }

    this.props.dispatch(action.modifyField(id, name, value));
  }

  blurField() {
    this.updateField();
    this.setState({ focused: false });
  }

  focusField() {
    this.setState({ focused: true });
  }

  render() {
    const classes = classNames([
      'field marked',
      this.props.name,
      this.state.validations.level(),
      { 'recently-edited': this.state.recentlyEdited },
    ]);

    const props = {
      onBlur:   _ => this.blurField(),
      onFocus:  _ => this.focusField(),
      onChange: e => this.onChange(e.target.value),
      value:    this.state.value || '',
    };

    const input = this.props.typeahead
      ? <TypeaheadInput { ...this.props.typeahead } { ...props } />
      : <input type="text" spellCheck="false" { ...props } />;

    return <div className={classes}>
      {input}
    </div>;
  }
}

export const Artist = p => <Field {...p}
  name="artist"
  validator={validate.artist}
  validatorOptions={{ knownArtists: p.knownValues.artists }}
  typeahead={{ source: p.knownValues.artists.clean, splitter: splitOn }} />;

export const Title = p => <Field {...p}
  name="title"
  validator={validate.title} />;

export const Remixer = p => <Field {...p}
  name="remixer"
  validator={validate.remixer}
  validatorOptions={{ knownArtists: p.knownValues.artists }}
  typeahead={{ source: p.knownValues.artists.clean, splitter: splitOn }} />;

export const Album = p => <Field {...p}
  name="album"
  validator={validate.album} />;

export const Publisher = p => <Field {...p}
  name="publisher"
  validator={validate.publisher}
  validatorOptions={{ knownPublishers: p.knownValues.publishers }}
  typeahead={{ source: p.knownValues.publishers.clean }} />;

export const Release = p => <Field {...p}
  name="release"
  validator={validate.release} />;

export const Year = p => <Field {...p}
  name="year"
  validator={validate.year} />;

export const Genre = p => <Field {...p}
  name="genre"
  validator={validate.genre}
  validatorOptions={{ knownGenres: p.knownValues.genres }}
  typeahead={{ source: p.knownValues.genres.clean }} />;

export const TrackNumber = p => <Field {...p}
  name="track"
  validator={validate.trackNumber} />;

export const DiscNumber = p => <Field {...p}
  name="disc"
  validator={validate.discNumber} />;

export const BPM = p => <Field {...p}
  name="bpm"
  validator={validate.bpm} />;

export const Key = p => {
  const isComputing = p.keyfinding.includes(p.track.id);

  const classes = classNames({
    field: true,
    key:   true,
    computing: isComputing,
  });

  return <div className={classes}>
    {p.track.key}
  </div>;
};

export { Artwork } from './Artwork';
