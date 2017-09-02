import * as action from '../actions';
import * as path from 'path';
import * as validate from '../validate';
import classNames from 'classnames';
import React, { Component } from 'react';

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
    this.updateLocal(value, { revalidate: true });
  }

  componentDidMount() {
    this.componentWillReceiveProps(this.props);
  }

  updateLocal(value, { revalidate = false } = {}) {
    this.setState({ value }, revalidate ? this.validateField : null);
  }

  validateField() {
    if (!this.props.validator) {
      return;
    }

    const options = this.props.validatorOptions;
    const validations = this.props.validator(this.props.track, options);

    // Excute all automatic fixes
    const value = this.props.track[this.props.name];
    const fixedValue = validations.autoFix(value);

    if (fixedValue !== value) {
      this.setState({ value: fixedValue }, this.updateField);
    }

    this.setState({ validations });
  }

  updateField() {
    const id    = this.props.track.id;
    const name  = this.props.name;
    const value = this.state.value.trim();

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

    return <div className={classes}>
      <input type="text"
        spellCheck="false"
        onBlur={_ => this.blurField()}
        onFocus={_ => this.focusField()}
        onChange={e => this.updateLocal(e.target.value)}
        value={this.state.value || ''} />
    </div>;
  }
}

export const Artist = p => <Field {...p}
  name="artist"
  validator={validate.artist}
  validatorOptions={{ knownArtists: p.knownValues.artists }} />;

export const Title = p => <Field {...p}
  name="title"
  validator={validate.title} />;

export const Remixer = p => <Field {...p}
  name="remixer"
  validator={validate.remixer}
  validatorOptions={{ knownArtists: p.knownValues.artists }} />;

export const Album = p => <Field {...p}
  name="album"
  validator={validate.album} />;

export const Publisher = p => <Field {...p}
  name="publisher"
  validator={validate.publisher}
  validatorOptions={{ knownPublishers: p.knownValues.publishers }} />;

export const Release = p => <Field {...p}
  name="release"
  validator={validate.release} />;

export const Year = p => <Field {...p}
  name="year"
  validator={validate.year} />;

export const Genre = p => <Field {...p}
  name="genre"
  validator={validate.genre}
  validatorOptions={{ knownGenres: p.knownValues.genres }} />;

export const TrackNumber = p => <Field {...p}
  name="track"
  validator={validate.trackNumber} />;

export const DiscNumber = p => <Field {...p}
  name="disc"
  validator={validate.discNumber} />;

export const BPM = p => <Field {...p}
  name="bpm"
  validator={validate.bpm} />;


export const Artwork = p => {
  const artwork = p.track.artwork || [];
  const loading = artwork.length !== p.track.artworkCount;

  const emptyClasses = classNames('empty-artwork', { loading });

  const image = artwork.length > 0
    ? <img src={window.URL.createObjectURL(artwork[0])} />
    : <div className={emptyClasses}></div>;

  return <div className="field artwork">
    {image}
  </div>;
};

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
