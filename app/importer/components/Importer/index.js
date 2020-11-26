import React, {Component} from 'react';
import {connect} from 'react-redux';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import * as actions from 'app/importer/store/actions';
import {keyMapper} from 'app/importer/util/keyboard';

import * as Discogs from './Discogs';

class Importer extends Component {
  constructor() {
    super();
    this.state = {
      selectedRelease: undefined,
      showMapper: false,
    };

    this.releaseSelected = this.releaseSelected.bind(this);
    this.onImport = this.onImport.bind(this);
  }

  releaseSelected(release) {
    this.setState({selectedRelease: release, showMapper: true});
  }

  onImport(tracks, artwork = []) {
    this.props.dispatch(actions.trackUpdate(tracks));
    this.props.dispatch(
      actions.addArtwork(
        tracks.map(t => t.id),
        artwork
      )
    );
    this.props.onComplete();
  }

  render() {
    const classes = classNames('importer', {
      'with-search': this.state.showMapper === false,
      'with-mapper': this.state.showMapper,
    });

    return (
      <div className={classes}>
        <Discogs.Search
          presetSearch={this.props.presetSearch}
          onSelected={this.releaseSelected}
        />
        <Discogs.Mapper
          mappingTracks={this.props.tracks}
          onImport={this.onImport}
          onCancel={_ => this.setState({showMapper: false})}
          release={this.state.selectedRelease}
        />
      </div>
    );
  }
}

Importer.propTypes = {
  presetSearch: PropTypes.string,
  onComplete: PropTypes.func,
  tracks: PropTypes.arrayOf(Discogs.mappableTrackShape),
};

Importer.defaultProps = {
  onComplete: _ => {
    /* noop */
  },
};

const mapImporterProps = s => ({
  tracks: s.selectedTracks.map(id => s.tracks[id]),
});

const LinkedImporter = connect(mapImporterProps)(Importer);

class ImportButton extends Component {
  constructor() {
    super();
    this.state = {active: false};

    this.keyMapper = keyMapper({
      escape: _ => this.toggleActive(false),
    });

    this.toggleActive = this.toggleActive.bind(this);
  }

  toggleActive(state = null) {
    this.setState({active: state === null ? !this.state.active : state});
  }

  render() {
    const classes = classNames('main-importer', {
      active: this.state.active,
    });

    const importer = this.state.active ? (
      <LinkedImporter onComplete={_ => this.toggleActive(false)} />
    ) : null;

    return (
      <div className={classes} onKeyDown={this.keyMapper}>
        <button className="action-import" onClick={_ => this.toggleActive()} />
        {importer}
      </div>
    );
  }
}

export {ImportButton, Importer};
