import React, { Component } from 'react';
import classNames from 'classnames';
import prettyBytes from 'pretty-bytes';
import PropTypes from 'prop-types';

import * as action from 'app/store/actions';
import * as validateArt from 'app/validate/artwork';
import { buildImageObject } from 'app/util/image';
import { KeyboardNavigatable } from 'app/util/keyboard';

const MIME_MAPPING = {
  'image/png': 'PNG',
  'image/jpeg': 'JPEG',
  'image/gif': 'GIF',
  'image/tiff': 'TIFF',
};

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png'].join(',');

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

  const validations = validateArt.individualArtwork(p.artwork);
  const dimensionClasses = classNames(validations.level());

  const itemClasses = classNames({ selected: p.isSelected });

  return (
    <li onClick={p.onSelect} className={itemClasses}>
      <ul className="actions">
        <li onClick={p.onRemove} className="remove" />
        <li onClick={p.onMaximize} className="maximize" />
      </ul>
      <img src={p.artwork.url} alt="Album Artwork" />
      <ul className="details">
        <li>
          {type} – {size}
        </li>
        <li className={dimensionClasses}>{dimensionText}</li>
      </ul>
    </li>
  );
};

ArtworkEntry.propTypes = {
  artwork: PropTypes.object.isRequired,
  isSelected: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onMaximize: PropTypes.func.isRequired,
};

/**
 * ArtworkUploader is a artwory entry that is used to select a new artwork
 * file.
 */
const ArtworkUploader = p => (
  <li className={classNames('uploader', { selected: p.isSelected })}>
    <label>
      <ul className="details">
        <li>PNG or JPEG</li>
        <li>Min 500 × 500</li>
      </ul>
      <input
        type="file"
        accept={ALLOWED_EXTENSIONS}
        onChange={e => p.onFileSelect(e.target.files[0])}
      />
    </label>
  </li>
);

ArtworkUploader.propTypes = {
  onFileSelect: PropTypes.func,
  isSelected: PropTypes.bool,
};

/**
 * ArtworkPopover renders a list of artwork items and a artwork uploader.
 */
const ArtworkPopover = p => {
  const fireAction = (action, ...params) => e => {
    e.stopPropagation();
    action(...params);
  };

  const items = p.artwork
    .filter(x => x)
    .map((a, i) => (
      <ArtworkEntry
        isSelected={p.selected === i}
        onSelect={fireAction(p.onSelect, i)}
        onRemove={fireAction(p.onRemove, i)}
        onMaximize={fireAction(p.onMaximize, i)}
        artwork={a}
        key={i}
      />
    ));

  return (
    <ul className="artwork-popover">
      {items}
      <ArtworkUploader
        onFileSelect={p.onFileSelect}
        isSelected={p.selected === p.artwork.length}
      />
    </ul>
  );
};

ArtworkPopover.propTypes = {
  artwork: PropTypes.arrayOf(PropTypes.object).isRequired,
  shown: PropTypes.bool,
  selected: PropTypes.number,
  onSelect: PropTypes.func.isRequired,
  onMaximize: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onFileSelect: PropTypes.func.isRequired,
};

const ArtworkFullscreen = p => (
  <div className="fullscreen-artwork" onClick={p.onExit}>
    <img
      alt="Full size Album Artwork"
      src={p.artwork.url}
      onClick={e => e.stopPropagation()}
    />
  </div>
);

ArtworkPopover.propTypes = {
  artwork: PropTypes.arrayOf(PropTypes.object).isRequired,
  onExit: PropTypes.func,
};

class Artwork extends Component {
  constructor() {
    super();

    this.keyboardMapping = {
      enter: _ => this.keyboardEvent(this.onSelectOrUpload),
      space: _ => this.keyboardEvent(this.onMaximize),
      backspace: _ => this.keyboardEvent(this.onRemove),
      delete: _ => this.keyboardEvent(this.onRemove),
      escape: _ => this.onMinimize(),
    };

    this.DOMNode = undefined;
    this.state = { active: false, focused: null, maximized: false };
  }

  keyboardEvent(action) {
    const focusedIndex =
      this.state.focused === null
        ? this.props.track.artworkSelected
        : this.state.focused;

    action.call(this, focusedIndex);

    return true;
  }

  onFocused(index) {
    this.setState({ focused: index });
  }

  onSelectOrUpload(index) {
    const action =
      index < this.props.track.artwork.length
        ? this.onSelect
        : this.onOpenFileSelector;

    action.call(this, index);
  }

  onSelect(index) {
    this.props.dispatch(action.selectArtwork(this.props.track.id, index));
    this.onMinimize();
  }

  onRemove(index) {
    this.props.dispatch(action.removeArtwork(this.props.track.id, index));
  }

  onMaximize(index) {
    this.setState({ focused: index, maximized: !this.state.maximized });
  }

  onMinimize() {
    this.setState({ maximized: false });
  }

  onOpenFileSelector() {
    this.DOMNode.querySelector('input[type=file]').click();
  }

  onFileSelect(file) {
    const dispatch = this.props.dispatch;
    const artPromise = buildImageObject(file);

    artPromise.then(a => dispatch(action.addArtwork(this.props.track.id, a)));
  }

  blur() {
    const active = document.activeElement === this.DOMNode;
    this.setState({ active, maximized: false, focused: null });
  }

  render() {
    const track = this.props.track;

    const trackArt = track.artwork || [];
    const artwork = trackArt.map(k => this.props.artwork[k]);

    const selectedIndex = track.artworkSelected;
    const selectedArt = artwork[selectedIndex];

    const focusedIndex =
      this.state.focused === null ? selectedIndex : this.state.focused;

    const loading = trackArt.length > 0 && selectedIndex !== null;
    const emptyClasses = classNames('empty-artwork', { loading });

    const element = selectedArt ? (
      <img src={selectedArt.url} alt="" />
    ) : (
      <div className={emptyClasses} />
    );

    const maximizedArt =
      !this.state.maximized || focusedIndex === artwork.length ? null : (
        <ArtworkFullscreen
          artwork={artwork[this.state.focused]}
          onExit={_ => this.onMinimize()}
        />
      );

    const popover =
      this.state.active === false ? null : (
        <ArtworkPopover
          artwork={artwork}
          selected={focusedIndex}
          onSelect={i => this.onSelect(i)}
          onRemove={i => this.onRemove(i)}
          onMaximize={i => this.onMaximize(i)}
          onFileSelect={f => this.onFileSelect(f)}
        />
      );

    const validations = validateArt.individualArtwork(selectedArt);
    const classes = classNames('field marked artwork', validations.level());

    return (
      <KeyboardNavigatable
        count={artwork.length + 1}
        index={focusedIndex}
        onMoveFocus={i => this.onFocused(i)}
        extraKeys={this.keyboardMapping}
        className={classes}
        tabIndex={0}
        elementRef={e => (this.DOMNode = e)}
        onFocus={_ => this.setState({ active: true })}
        onBlur={_ => this.blur()}>
        {element}
        {popover}
        {maximizedArt}
      </KeyboardNavigatable>
    );
  }
}

export { Artwork };
