import React, { Component } from 'react';
import { connect } from 'react-redux'
import classNames from 'classnames'
import * as lodash from 'lodash';

import './App.css';
import FieldHeadings from './components/FieldHeadings'
import * as Field from './Fields'
import * as action from './actions';

let TrackItem = p => {



  return <li className="track-listing">
    <div className="field selector">
      <input type="checkbox"
        onChange={e => p.dispatch(action.toggleTracks(e.target.checked, [p.id]))}
        checked={p.selected} />
    </div>


    <div className="field file-path">
      {p.track.file_path}
    </div>

    <div className="field artwork">
      <div className="empty-artwork"></div>
    </div>

    <div className="field marked artist">
    </div>


    <div className="field marked title">28 Days Later</div>
    <div className="field marked remixer">N/A</div>
    <div className="field marked album">Hardcore Underground EP Vol. 4</div>
    <div className="field marked publisher">Hardcore Underground</div>
    <div className="field marked release">HULTDCD007</div>
    <div className="field marked year">2013</div>
    <div className="field marked genre">Hardcore</div>

    <Field.TrackNumber track={p.track} />


    <div className="field marked disc">1/1</div>
    <div className="field marked bpm">170.00</div>
    <div className="field key">10A</div>
    <div className="field actions"></div>
  </li>;
}


const mapTrackState = (s, props) => ({
  track:    s.tracks[props.id],
  selected: s.selectedTracks.includes(props.id)

});

TrackItem = connect(mapTrackState)(TrackItem);



const PathParts = ({ parts }) => <ol className="path-parts">
  {parts.map(p => <li key={p}>{p}</li>)}
</ol>;

/**
 * Track grouping
 */
let TrackGrouping = p => {
  let toggleGroup = toggle => {
    p.dispatch(action.toggleTracks(toggle, p.tracks));
  }

  const pathParts = p.pathParts[0] !== '.' ? p.pathParts : []; 

  const classes = classNames({
    'listing-name': true,
    'root-listing': pathParts.length === 0,
  })

  return <li>
    <label className={classes}>
      <input type="checkbox"
        onChange={e => toggleGroup(e.target.checked)}
        checked={p.allSelected} />
      <PathParts parts={pathParts} />
    </label>
    <ol>
      {p.tracks.map(t => <TrackItem key={t} id={t} />)}
    </ol>
  </li>;
}

const mapTrackGroupingState = (s, props) => ({
  allSelected: lodash.difference(props.tracks, s.selectedTracks).length === 0,
});

TrackGrouping = connect(mapTrackGroupingState)(TrackGrouping);

/**
 * Editor
 */
let Editor = props => <ol className="editor track-groups">
  {props.trackTree.map(g => <TrackGrouping key={g.id} {...g} />)}
</ol>;

const mapEditorState = ({ trackTree }) => ({ trackTree });
Editor = connect(mapEditorState)(Editor);

/**
 * The main application
 */
let App = p => <div className="app">
  <header>
    <h1>Tunes Importing Tools</h1>
    <small>
      Use the interface below to normalize, tag, and import new music
    </small>
    <FieldHeadings
      onCheck={e => p.dispatch(action.toggleAllTracks(e.target.checked))}
      checked={p.allSelected} />
  </header>
  <Editor />
</div>;

const mapAppState = s => ({
  allSelected: Object.keys(s.tracks).length > 0 &&
               Object.keys(s.tracks).length === s.selectedTracks.length,
});

export default connect(mapAppState)(App);
