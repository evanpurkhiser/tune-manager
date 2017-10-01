import classNames    from 'classnames';
import PropTypes     from 'prop-types';
import React, { Component } from 'react';

import * as actions from '../../actions';
import * as Discogs from './Discogs';

const mappableTrackShape = PropTypes.shape({
  id:       PropTypes.string.isRequired,
  filePath: PropTypes.string.isRequired,
});

class Importer extends Component {
  constructor() {
    super();
    this.state = {
      selectedRelease: undefined,
      showMapper:      false,
    };

    this.releaseSelected = this.releaseSelected.bind(this);
    this.onImport = this.onImport.bind(this);
  }

  releaseSelected(release) {
    this.setState({ selectedRelease: release, showMapper: true });
  }

  onImport(tracks) {
    this.props.dispatch(actions.trackUpdate(tracks));
  }

  render() {
    const classes = classNames('importer', {
      'with-search': this.state.showMapper === false,
      'with-mapper': this.state.showMapper,
    });

    return <div className={classes}>
      <Discogs.Search
        presetSearch={this.props.presetSearch}
        onSelected={this.releaseSelected} />
      <Discogs.Mapper
        mappingTracks={this.props.tracks}
        onImport={this.onImport}
        onCancel={_ => this.setState({ showMapper: false })}
        release={this.state.selectedRelease} />
    </div>;
  }
}

Importer.propTypes = {
  presetSearch: PropTypes.string,
  tracks: PropTypes.arrayOf(mappableTrackShape),
};

export { Importer, mappableTrackShape };
