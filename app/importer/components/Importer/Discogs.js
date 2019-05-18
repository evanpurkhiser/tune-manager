import * as lodash from 'lodash';
import camelize from 'camelize';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import * as discogs from 'app/importer/util/discogs';
import { buildImageObject } from 'app/importer/util/image';
import ScrollLockList from 'app/importer/components/ScrollLockList';

const mappableTrackShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  filePath: PropTypes.string.isRequired,
});

const releaseObjectShape = {
  resourceUrl: PropTypes.string,
  catno: PropTypes.string,
  country: PropTypes.string,
  label: PropTypes.arrayOf(PropTypes.string),
  thumb: PropTypes.string,
  title: PropTypes.string,
  year: PropTypes.string,
};

const releaseShape = PropTypes.shape(releaseObjectShape);

const ReleaseItem = p => (
  <div className="importable-release">
    {p.thumb ? (
      <img src={p.thumb} alt={p.title} />
    ) : (
      <div className="empty-artwork" />
    )}
    <div className="details">
      <div className="title">{p.title}</div>
      <div className="sub-details">
        <span>{p.catno}</span>
        <span>{p.label.join(', ')}</span>
      </div>
      <div className="sub-details">
        <span>{p.country}</span>
        <span>{p.year}</span>
      </div>
    </div>
  </div>
);

ReleaseItem.propTypes = releaseObjectShape;

const ReleaseSet = p => (
  <ScrollLockList className="result-list">
    {p.results.map(r => (
      <li key={r.id} onClick={_ => p.onSelect(r)}>
        <ReleaseItem {...r} />
      </li>
    ))}
  </ScrollLockList>
);

ReleaseSet.propTypes = {
  results: PropTypes.arrayOf(releaseShape),
  onSelect: PropTypes.func,
};

const STATUS_MESSAGES = {
  initial: 'Type in a release to import',
  empty: 'No results found for your query',
  error: 'Failed to query API. Requests may be rated limited.',
};

const StatusMessage = p => (
  <p className={classNames('status-message', p.type)}>
    {STATUS_MESSAGES[p.type]}
  </p>
);

StatusMessage.propTypes = {
  type: PropTypes.oneOf(Object.keys(STATUS_MESSAGES)),
};

class Search extends Component {
  constructor() {
    super();

    this.state = {
      results: [],
      isBlank: true,
      isQuerying: false,
      queryFailed: false,
    };

    this.onSelected = this.onSelected.bind(this);

    const DEBOUNCE_TIME = 300;

    const query = this.queryResults.bind(this);
    this.throttledQuery = lodash.debounce(query, DEBOUNCE_TIME);
    this.activeRequest = null;
  }

  componentDidMount() {
    this.inputElement.focus();
  }

  queryResults(value) {
    if (this.activeRequest !== null) {
      this.activeRequest.abort();
    }

    if (value === '') {
      return;
    }

    this.activeRequest = new AbortController(); // eslint-disable-line no-undef

    const query = encodeURIComponent(value);
    const url = discogs.url(discogs.SEARCH_URL, { query });

    this.setState({ isQuerying: true, willQuery: false });

    let request = fetch(url, { signal: this.activeRequest.signal });

    request = request
      .then(r => r.json())
      .then(json =>
        this.setState({
          results: camelize(json.results),
          isQuerying: false,
          queryFailed: false,
        })
      );

    request.catch(e =>
      this.setState({
        results: [],
        isQuerying: false,
        queryFailed: e.name !== 'AbortError',
      })
    );
  }

  onChange(e) {
    const value = e.target.value;
    const isBlank = value === '';
    const results = isBlank ? [] : this.state.results;

    this.setState({ isBlank, results, willQuery: true });
    this.throttledQuery(value);
  }

  onSelected(release) {
    this.props.onSelected(release);
  }

  getStatusMessage() {
    const s = this.state;

    const isInitial = s.results.length === 0 && (s.willQuery || s.isQuerying);

    if (s.isBlank || isInitial) {
      return <StatusMessage type="initial" />;
    }

    if (s.queryFailed === true) {
      return <StatusMessage type="error" />;
    }

    if (s.results.length === 0) {
      return <StatusMessage type="empty" />;
    }

    return null;
  }

  render() {
    const releaseList =
      this.state.results.length > 0 ? (
        <ReleaseSet results={this.state.results} onSelect={this.onSelected} />
      ) : null;

    const statusMessage = this.getStatusMessage();

    const classes = classNames('discogs-search', {
      querying: this.state.isQuerying,
    });

    return (
      <div className={classes}>
        <input
          type="text"
          ref={e => (this.inputElement = e)}
          defaultValue={this.props.presetSearch}
          spellCheck={false}
          placeholder="Enter a release name"
          onChange={e => this.onChange(e)}
        />
        {statusMessage}
        {releaseList}
      </div>
    );
  }
}

Search.propTypes = {
  onSelected: PropTypes.func.isRequired,
  presetSearch: PropTypes.string,
};

const ImportTrackMapping = p => {
  const numberRegex = /[0-9]+(?=\/)/;
  const disc = p.disc.match(numberRegex)[0];
  const track = p.track.match(numberRegex)[0];

  const mappingName = p.mappedFile || 'unmapped';

  const classes = classNames({
    unselected: p.selected === false,
    unmapped: p.mappedFile === undefined,
  });

  return (
    <li
      className={classes}
      onClick={p.onClick}
      data-position={`${disc}-${track}`}>
      <div className="title">
        {p.artist} - {p.title}
      </div>
      <div className="mapping">{mappingName}</div>
    </li>
  );
};

ImportTrackMapping.propTypes = {
  artist: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  disc: PropTypes.string,
  track: PropTypes.string,
  selected: PropTypes.bool,
  mappedFile: PropTypes.string,
};

ImportTrackMapping.defaultProps = {
  track: '0/0',
  disc: '0/0',
};

const ImportActions = p => (
  <div className="import-actions">
    <button className="accept" onClick={p.onImport}>
      Import Tracks
    </button>
    <button className="return" onClick={p.onCancel}>
      Back to search
    </button>
    <div className="stats">
      {p.numSelected} Selected → {p.numFiles} Files
    </div>
  </div>
);

ImportActions.propTypes = {
  onImport: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  numSelected: PropTypes.number.isRequired,
  numFiles: PropTypes.number.isRequired,
};

class Mapper extends Component {
  constructor() {
    super();

    this.state = {
      fullRelease: {},
      newTracks: [],
      selected: [],
      isQuerying: false,
      isImporting: false,
    };

    this.recieveNewTracks = this.recieveNewTracks.bind(this);
    this.onImport = this.onImport.bind(this);
  }

  componentWillUpdate(nextProps) {
    if (nextProps.release !== this.props.release) {
      this.queryRelease(nextProps.release);
    }
  }

  queryRelease(release) {
    if (release === undefined) {
      return;
    }

    fetch(discogs.url(release.resourceUrl))
      .then(r => r.json())
      .then(this.recieveNewTracks);

    this.setState({ isQuerying: true, newTracks: [] });
  }

  recieveNewTracks(json) {
    const fullRelease = camelize(json);
    const newTracks = discogs.mapTracks(fullRelease);

    const selected = newTracks
      .reduce((tracks, g) => [...tracks, ...g.tracks], [])
      .map(t => t.id);

    this.setState({ fullRelease, newTracks, selected, isQuerying: false });
  }

  onToggleHeading(index) {
    const trackIds = this.state.newTracks[index].tracks.map(t => t.id);
    const included = lodash.intersection(this.state.selected, trackIds);

    const selected =
      included.length > 0
        ? lodash.difference(this.state.selected, trackIds)
        : lodash.union(this.state.selected, trackIds);

    this.setState({ selected });
  }

  onToggleTrack(id) {
    const selected = [...this.state.selected];

    if (selected.includes(id)) {
      selected.splice(selected.indexOf(id), 1);
    } else {
      selected.push(id);
    }

    this.setState({ selected });
  }

  onImport() {
    const mappingTracks = [...this.props.mappingTracks];

    const importTracks = this.state.newTracks
      .reduce((tracks, g) => [...tracks, ...g.tracks], [])
      .filter(t => this.state.selected.includes(t.id))
      .slice(0, mappingTracks.length)
      .map(t => ({ ...t, id: mappingTracks.shift().id }));

    if (this.state.fullRelease.images.length === 0) {
      this.props.onImport(importTracks);
    }

    const imageUrl = this.state.fullRelease.images[0].resourceUrl;

    this.setState({ isImporting: true });

    fetch(discogs.url(imageUrl))
      .then(res => res.blob())
      .then(buildImageObject)
      .then(artwork => {
        importTracks.forEach(t => (t.artworkSelected = 0));
        importTracks.forEach(t => (t.artwork = []));
        this.setState({ isImporting: false });
        this.props.onImport(importTracks, artwork);
      });
  }

  buildTrackList() {
    const tracks = this.state.newTracks || [];
    const mappingTracks = [...this.props.mappingTracks];

    const mapTracks = t => {
      const isSelected = this.state.selected.includes(t.id);
      const mappedTrack = isSelected ? mappingTracks.shift() || {} : {};

      return (
        <ImportTrackMapping
          {...t}
          key={t.id}
          onClick={_ => this.onToggleTrack(t.id)}
          mappedFile={mappedTrack.filePath}
          selected={isSelected}
        />
      );
    };

    return tracks.map((g, index) => {
      const heading = (
        <li
          key={index}
          onClick={_ => this.onToggleHeading(index)}
          className="heading">
          {g.name}
        </li>
      );

      return [g.name === '' ? null : heading, ...g.tracks.map(mapTracks)];
    });
  }

  render() {
    if (this.props.release === undefined) {
      return <div className="discogs-mapper" />;
    }

    const classes = classNames('discogs-mapper', {
      importing: this.state.isImporting,
    });

    return (
      <div className={classes}>
        <ReleaseItem {...this.props.release} />
        <ImportActions
          onImport={this.onImport}
          onCancel={_ => this.props.onCancel()}
          numSelected={this.state.selected.length}
          numFiles={this.props.mappingTracks.length}
        />
        <ScrollLockList className="import-tracks">
          {this.buildTrackList()}
        </ScrollLockList>
      </div>
    );
  }
}

Mapper.propTypes = {
  onImport: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  release: PropTypes.shape(releaseObjectShape),
  mappingTracks: PropTypes.arrayOf(mappableTrackShape),
};

Mapper.defaultProps = {
  mappingTracks: [],
};

export { Search, Mapper, mappableTrackShape };
