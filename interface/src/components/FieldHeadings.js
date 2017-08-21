import React from 'react';
import PropTypes from 'prop-types';

const FieldHeadings = props => <div className="field-heading">
  <div className="field selector">
    <input type="checkbox"
      checked={props.checked}
      onChange={props.onCheck} />
  </div>
  <div className="field file-name">File Name</div>
  <div className="field artwork">Art</div>
  <div className="field artist">Artist</div>
  <div className="field title">Title</div>
  <div className="field remixer">Remixer</div>
  <div className="field album">Album</div>
  <div className="field publisher">Publisher</div>
  <div className="field release">Release</div>
  <div className="field year">Year</div>
  <div className="field genre">Genre</div>
  <div className="field track">Track</div>
  <div className="field disc">Disc</div>
  <div className="field bpm">BPM</div>
  <div className="field key">Key</div>
  <div className="field actions"></div>
</div>;

FieldHeadings.propTypes = {
  checked: PropTypes.bool,
  onCheck: PropTypes.func,
};

export default FieldHeadings;
