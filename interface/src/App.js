import * as lodash from 'lodash';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import classNames from 'classnames';
import { connect } from 'react-redux';
import React from 'react';

import 'app/scss/app.scss';
import * as action      from 'app/store/actions';
import * as Field       from 'app/components/Fields';
import FieldHeadings    from 'app/components/FieldHeadings';
import { ImportButton } from 'app/components/Importer';
import { SaveButton }   from 'app/components/Save';

let TrackItem = p => {
  const fieldProps = {
    track:    p.track,
    dispatch: p.dispatch,
  };

  return <li className="track-listing" data-trackid={p.id}>
    <div className="field listing-check">
      <input type="checkbox"
        tabIndex="-1"
        onChange={e => p.dispatch(action.toggleSelect(e.target.checked, [ p.id ]))}
        checked={p.selected} />
    </div>

    <Field.FileName    { ...fieldProps } />
    <Field.Artwork     { ...fieldProps } artwork={p.artwork} />
    <Field.Artist      { ...fieldProps } knownValues={p.knownValues} />
    <Field.Title       { ...fieldProps } />
    <Field.Remixer     { ...fieldProps } knownValues={p.knownValues} />
    <Field.Album       { ...fieldProps } />
    <Field.Publisher   { ...fieldProps } knownValues={p.knownValues} />
    <Field.Release     { ...fieldProps } />
    <Field.Year        { ...fieldProps } />
    <Field.Genre       { ...fieldProps } knownValues={p.knownValues} />
    <Field.TrackNumber { ...fieldProps } />
    <Field.DiscNumber  { ...fieldProps } />
    <Field.BPM         { ...fieldProps } />
    <Field.Key         { ...fieldProps } processes={p.processes} />

    <div className="field actions"></div>
  </li>;
};

const processesDefault = [];

const mapTrackState = (s, props) => ({
  track:       s.tracks[props.id],
  artwork:     s.artwork,
  selected:    s.selectedTracks.includes(props.id),
  processes:   s.processes[props.id] || processesDefault,
  knownValues: s.knownValues,
});

TrackItem = connect(mapTrackState)(TrackItem);

const PathParts = ({ parts }) => <ol className="path-parts">
  {parts.map(p => <li key={p}>{p}</li>)}
</ol>;

/**
 * Track grouping
 */
let TrackGroup = p => {
  const toggleGroup = toggle => {
    p.dispatch(action.toggleSelect(toggle, p.tracks));
  };

  const pathParts = p.pathParts[0] === '.' ? [] : p.pathParts;

  const classes = classNames({
    'listing-name': true,
    'root-listing': pathParts.length === 0,
  });

  const GroupHeading = SortableHandle(_ => <label className={classes}>
    <span className="drag-handle" />
    <input type="checkbox"
      tabIndex="-1"
      onChange={e => toggleGroup(e.target.checked)}
      checked={p.allSelected} />
    <PathParts parts={pathParts} />
  </label>);

  return <li className="track-group">
    <GroupHeading />
    <ol>
      {p.tracks.map(t => <TrackItem key={t} id={t} />)}
    </ol>
  </li>;
};

const mapTrackGroupingState = (s, props) => ({
  allSelected: lodash.difference(props.tracks, s.selectedTracks).length === 0,
});

TrackGroup = connect(mapTrackGroupingState)(TrackGroup);
TrackGroup = SortableElement(TrackGroup);

/**
 * Track group listings
 */
let TrackGroups = props => <ol className="editor track-groups">
  {props.trackTree.map((g, i) => <TrackGroup index={i} key={g.id} {...g} />)}
</ol>;

const mapEditorState = ({ trackTree }) => ({ trackTree });

TrackGroups = connect(mapEditorState)(TrackGroups);
TrackGroups = SortableContainer(TrackGroups);

/**
 * The main application
 */
const App = p => <div className="app">
  <header>
    <nav>
      <SaveButton />
      <ImportButton />
    </nav>
    <FieldHeadings
      onCheck={e => p.dispatch(action.toggleSelectAll(e.target.checked))}
      checked={p.allSelected} />
  </header>
  <TrackGroups
    useDragHandle={true}
    lockToContainerEdges={true}
    lockAxis="y"
    pressDelay={80}
    helperClass="group-reordering"
    onSortEnd={indicies => p.dispatch(action.reorderGroups(indicies))} />
</div>;

const mapAppState = s => ({
  allSelected: Object.keys(s.tracks).length > 0 &&
               Object.keys(s.tracks).length === s.selectedTracks.length,
});

export default connect(mapAppState)(App);
