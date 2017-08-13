import React, { Component } from 'react';

/**
 * Each track field manages validation and additional functionality to help fill
 * out the field (such as autocompletion). Fields may also modify values when
 * they are given as new props (for example, correcting capitalization on artist
 * names
 *
 * All fields implement the following props:
 *
 *  - track:    The track object this field is a part of.
 *  - onChange: A function that will be called when the value of the field has
 *              been modified. The parameter passed to this will be the
 *              normalized version of the fields value.
 */

export class TrackNumber extends Component {
  render() {
    return <div className="field track">
      <input type="text" value={this.props.track.track} />
    </div>;
  }
}
