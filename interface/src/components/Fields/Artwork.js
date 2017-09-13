import * as action from '../../actions';
import React, { Component } from 'react';
import { buildImageObject } from '../../util/image';
import classNames from 'classnames';
import prettyBytes from 'pretty-bytes';
import PropTypes from 'prop-types';

const MIME_MAPPING = {
  'image/png':  'PNG',
  'image/jpeg': 'JPEG',
  'image/gif':  'GIF',
  'image/tiff': 'TIFF',
};

const ALLOWED_EXTENSIONS = [ '.jpg', '.jpeg', '.png' ].join(',');

/**
 * ArtworkEntry renders a single list item in the list of artwork. This
 * includes details of the size and type of artwork.
 */
const ArtworkEntry = p => {
  const type = MIME_MAPPING[p.artwork.type];
  const size = prettyBytes(p.artwork.size);
  const dimensions = p.artwork.dimensions;

  const dimensionText = dimensions
    ? `${dimensions.height} × ${dimensions.width}`
    : 'Unknown Size';

  const itemClasses = classNames({ selected: p.isSelected });

  return <li onClick={p.onSelect} className={itemClasses}>
    <ul className="actions">
      <li onClick={p.onRemove} className="remove" />
      <li onClick={p.onMaximize} className="maximize" />
    </ul>
    <img src={p.artwork.url} alt="Album Artwork" />
    <ul className="details">
      <li>{type} – {size}</li>
      <li>{dimensionText}</li>
    </ul>
  </li>;
};

ArtworkEntry.propTypes = {
  artwork:    PropTypes.object.isRequired,
  isSelected: PropTypes.bool,
  onSelect:   PropTypes.func.isRequired,
  onRemove:   PropTypes.func.isRequired,
  onMaximize: PropTypes.func.isRequired,
};

/**
 * ArtworkUploader is a artwory entry that is used to select a new artwork
 * file.
 */
const ArtworkUploader = p => <li className="uploader">
  <label>
    <ul className="details">
      <li>PNG or JPEG</li>
      <li>Min 500 × 500</li>
    </ul>
    <input
      type="file"
      accept={ALLOWED_EXTENSIONS}
      onChange={e => p.onFileSelect(e.target.files[0])} />
  </label>
</li>;

ArtworkUploader.propTypes = {
  onFileSelect: PropTypes.func,
};

/**
 * ArtworkPopover renders a list of artwork items and a artwork uploader.
 */
const ArtworkPopover = p => {
  const fireAction = (action, ...params) => e => {
    e.stopPropagation();
    action(...params);
  };

  const items = p.artwork.map((a, i) => <ArtworkEntry
    isSelected={p.selected === i}
    onSelect={fireAction(p.onSelect, i)}
    onRemove={fireAction(p.onRemove, i)}
    onMaximize={fireAction(p.onMaximize, i)}
    artwork={a}
    key={i} />);

  return <ul className="artwork-popover">
    {items}
    <ArtworkUploader onFileSelect={p.onFileSelect} />
  </ul>;
};

ArtworkPopover.propTypes = {
  artwork:      PropTypes.arrayOf(PropTypes.object).isRequired,
  shown:        PropTypes.bool,
  selected:     PropTypes.number,
  onSelect:     PropTypes.func.isRequired,
  onMaximize:   PropTypes.func.isRequired,
  onRemove:     PropTypes.func.isRequired,
  onFileSelect: PropTypes.func.isRequired,
};

const ArtworkFullscreen = p => <div
  className="fullscreen-artwork"
  onClick={p.onExit}>
  <img alt="Full size Album Artwork"
    src={p.artwork.url}
    onClick={e => e.stopPropagation()} />
</div>;

ArtworkPopover.propTypes = {
  artwork: PropTypes.arrayOf(PropTypes.object).isRequired,
  onExit: PropTypes.func,
};

class Artwork extends Component {
  constructor() {
    super();

    this.DOMNode = undefined;
    this.state = { focused: false, maximizedArt: null };
  }

  onSelect(index) {
    this.props.dispatch(action.selectArtwork(this.props.track.id, index));
  }

  onRemove(index) {
    this.props.dispatch(action.removeArtwork(this.props.track.id, index));
  }

  onMaximize(index) {
    this.setState({ maximizedArt: index });
  }

  onFileSelect(file) {
    const dispatch = this.props.dispatch;
    const artPromise = buildImageObject(file);

    artPromise.then(a => dispatch(action.addArtwork(this.props.track.id, a)));
  }

  blur() {
    const focused = document.activeElement === this.DOMNode;
    this.setState({ focused });
  }

  render() {
    const track = this.props.track;

    const artwork = track.artwork || [];
    const selectedArt = track.artworkSelected;
    const loading = track.artworkCount > 0;

    const emptyClasses = classNames('empty-artwork', { loading });

    const element = artwork[selectedArt]
      ? <img src={artwork[selectedArt].url} alt="" />
      : <div className={emptyClasses}></div>;

    const maximizedArt = this.state.maximizedArt === null
      ? null
      : <ArtworkFullscreen
        artwork={artwork[this.state.maximizedArt]}
        onExit={_ => this.setState({ maximizedArt: null })} />;

    const popover = this.state.focused === false
      ? null
      : <ArtworkPopover
        artwork={artwork}
        selected={selectedArt}
        onSelect={i => this.onSelect(i)}
        onRemove={i => this.onRemove(i)}
        onMaximize={i => this.onMaximize(i)}
        onFileSelect={f => this.onFileSelect(f)} />;

    return <div className="field marked artwork"
      tabIndex="0"
      ref={e => this.DOMNode = e}
      onFocus={_ => this.setState({ focused: true })}
      onBlur={_ => this.blur()}>
      {element}
      {popover}
      {maximizedArt}
    </div>;
  }
}

export { Artwork };
