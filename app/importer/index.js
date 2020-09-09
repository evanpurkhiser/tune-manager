import 'app/scss/app.scss';

import React from 'react';
import * as sortable from 'react-sortable-hoc';
import {Provider, connect} from 'react-redux';
import classNames from 'classnames';
import * as lodash from 'lodash';
import camelize from 'camelize';

import {ImportButton} from 'app/importer/components/Importer';
import {SaveButton, SaveStatus} from 'app/importer/components/Save';
import * as Field from 'app/importer/components/Fields';
import * as actions from 'app/importer/store/actions';
import globalKeys from 'app/importer/globalKeys';
import store from 'app/importer/store';
import FieldHeadings from 'app/importer/components/FieldHeadings';

let TrackItem = p => {
  const fieldProps = {
    track: p.track,
    dispatch: p.dispatch,
  };

  const classes = classNames('track-listing', {'is-saving': p.isSaving});

  return (
    <li className={classes} data-trackid={p.id}>
      <div className="field listing-check">
        <input
          type="checkbox"
          tabIndex="-1"
          onChange={e => p.dispatch(actions.toggleSelect(e.target.checked, [p.id]))}
          checked={p.selected}
        />
      </div>

      <Field.FileName {...fieldProps} />
      <Field.Artwork {...fieldProps} artwork={p.artwork} />
      <Field.Artist {...fieldProps} knownValues={p.knownValues} />
      <Field.Title {...fieldProps} />
      <Field.Remixer {...fieldProps} knownValues={p.knownValues} />
      <Field.Album {...fieldProps} />
      <Field.Publisher {...fieldProps} knownValues={p.knownValues} />
      <Field.Release {...fieldProps} />
      <Field.Year {...fieldProps} />
      <Field.Genre {...fieldProps} knownValues={p.knownValues} />
      <Field.TrackNumber {...fieldProps} />
      <Field.DiscNumber {...fieldProps} />
      <Field.BPM {...fieldProps} />
      <Field.Key {...fieldProps} processes={p.processes} />

      <div className="field actions" />
    </li>
  );
};

const processesDefault = [];

const mapTrackState = (s, props) => ({
  track: s.tracks[props.id],
  artwork: s.artwork,
  selected: s.selectedTracks.includes(props.id),
  processes: s.processes[props.id] || processesDefault,
  isSaving: s.saveProcess.targetTracks.includes(props.id),
  knownValues: s.knownValues,
});

TrackItem = connect(mapTrackState)(TrackItem);

const PathParts = ({parts}) => (
  <ol className="path-parts">
    {parts.map(p => (
      <li key={p}>{p}</li>
    ))}
  </ol>
);

/**
 * Track grouping
 */
let TrackGroup = p => {
  const toggleGroup = toggle => {
    p.dispatch(actions.toggleSelect(toggle, p.tracks));
  };

  const pathParts = p.pathParts[0] === '.' ? [] : p.pathParts;

  const classes = classNames({
    'listing-name': true,
    'root-listing': pathParts.length === 0,
  });

  const GroupHeading = sortable.SortableHandle(_ => (
    <label className={classes}>
      <span className="drag-handle" />
      <input
        type="checkbox"
        tabIndex="-1"
        onChange={e => toggleGroup(e.target.checked)}
        checked={p.allSelected}
      />
      <PathParts parts={pathParts} />
    </label>
  ));

  return (
    <li className="track-group">
      <GroupHeading />
      <ol>
        {p.tracks.map(t => (
          <TrackItem key={t} id={t} />
        ))}
      </ol>
    </li>
  );
};

const mapTrackGroupingState = (s, props) => ({
  allSelected: lodash.difference(props.tracks, s.selectedTracks).length === 0,
});

TrackGroup = connect(mapTrackGroupingState)(TrackGroup);
TrackGroup = sortable.SortableElement(TrackGroup);

/**
 * Track group listings
 */
let TrackGroups = props => (
  <ol className="editor track-groups">
    {props.trackTree.map((g, i) => (
      <TrackGroup index={i} key={g.id} {...g} />
    ))}
  </ol>
);

const mapEditorState = ({trackTree}) => ({trackTree});

TrackGroups = connect(mapEditorState)(TrackGroups);
TrackGroups = sortable.SortableContainer(TrackGroups);

/**
 
 */
class Importer extends React.Component {
  componentDidMount() {
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';

    // Start events listener
    this.socket = new WebSocket(`${protocol}://${window.location.host}/api/events`);
    this.socket.onmessage = m => store.dispatch(camelize(JSON.parse(m.data)));

    // Load known values
    fetch('/api/known-values')
      .then(r => r.json())
      .then(knowns => {
        store.dispatch(actions.replaceKnowns(camelize(knowns)));
      });

    document.body.addEventListener('keydown', globalKeys);
  }

  componentWillUnmount() {
    this.socket.close();
    document.body.removeEventListener('keydown', globalKeys);
  }

  render() {
    const p = this.props;

    return (
      <div className="app">
        <header>
          <nav>
            <SaveButton />
            <ImportButton />
            <button className="action-config" />
            <SaveStatus />
          </nav>
          <FieldHeadings
            onCheck={e => p.dispatch(actions.toggleSelectAll(e.target.checked))}
            checked={p.allSelected}
          />
        </header>
        <TrackGroups
          useDragHandle
          lockToContainerEdges
          lockAxis="y"
          pressDelay={80}
          helperClass="group-reordering"
          onSortEnd={indicies => p.dispatch(actions.reorderGroups(indicies))}
        />
      </div>
    );
  }
}

const mapImporterState = s => ({
  allSelected:
    Object.keys(s.tracks).length > 0 &&
    Object.keys(s.tracks).length === s.selectedTracks.length,
});

const ConnectedImporter = connect(mapImporterState)(Importer);

const ImporterApp = _ => (
  <Provider store={store}>
    <ConnectedImporter />
  </Provider>
);

export default ImporterApp;
