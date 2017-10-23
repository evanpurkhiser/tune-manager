import classNames  from 'classnames';
import { connect } from 'react-redux';
import React       from 'react';

import * as action   from 'app/store/actions';

const mapSaveButton = s => ({
  inProgress: s.saveProcess.targetTracks.length > 0,
});

const SaveButton = connect(mapSaveButton)(p => <button
  className="action-save"
  onClick={_ => p.dispatch(action.saveTracks())}>Save Tracks</button>);

const mapSaveStatus = s => ({
  isPreparing: s.saveProcess.preparing,
  total:       s.saveProcess.total,
  incomplete:  s.saveProcess.targetTracks.length,
});

const SaveStatus = connect(mapSaveStatus)(p => {
  if (p.incomplete === 0) {
    return null;
  }

  const progress = <progress
    max={p.total}
    value={p.total - p.incomplete} />;

  return progress;
});

export { SaveButton, SaveStatus };
