import * as action   from 'app/store/actions';
import { keyMapper } from 'app/util/keyboard';
import store         from 'app/store';

const DIRECTION_UP   = -1;
const DIRECTION_DOWN =  1;

function toggleSelectFocused(e) {
  const track = e.target.closest('.track-listing');
  if (track === null) {
    return;
  }

  const state = track.querySelector('.listing-check input').checked;
  store.dispatch(action.toggleSelect(!state, [ track.dataset.trackid ]));
  return true;
}

function toggleGroupFocused(e) {
  const group = e.target.closest('.track-group');
  if (group === null) {
    return;
  }

  const tracks   = [ ...group.querySelectorAll('.track-listing') ];
  const trackIds = tracks.map(n => n.dataset.trackid);
  const state    = group.querySelector('.listing-name input').checked;

  store.dispatch(action.toggleSelect(!state, trackIds));
  return true;
}

function unselectAll() {
  store.dispatch(action.toggleSelectAll(false));
  return true;
}

function nextInTargetParent(target, direction) {
  const loopAroundSelector = direction > 0
    ? ':scope > :first-child'
    : ':scope > :last-child';

  const nextTarget = direction > 0
    ? target.nextElementSibling
    : target.previousElementSibling;

  // Loop-around if we've reached the last track in the group
  return nextTarget === null
    ? target.parentElement.querySelector(loopAroundSelector)
    : nextTarget;
}

function focusableInTrack(track, fieldIndex) {
  const targetField  = track.children[fieldIndex];
  const inputElement = targetField.querySelector('input');

  return inputElement === null ? targetField : inputElement;
}

function setFocusAndSelection(target) {
  target.focus();

  if (target instanceof HTMLInputElement) {
    target.setSelectionRange(0, target.value.length);
  }
}

function moveTrackFocus(e, direction) {
  const field = e.target.closest('.field');

  if (field === null) {
    return;
  }

  const track = field.closest('.track-listing');
  const fieldIndex = [ ...track.children ].indexOf(field);
  const nextTrack  = nextInTargetParent(track, direction);

  const focusTarget = focusableInTrack(nextTrack, fieldIndex);
  setFocusAndSelection(focusTarget);

  return true;
}

function moveGroupFocus(e, direction) {
  const field = e.target.closest('.field');

  if (field === null) {
    return;
  }

  const group = field.closest('.track-group');
  const track = field.closest('.track-listing');
  const fieldIndex = [ ...track.children ].indexOf(field);

  const nextGroup = nextInTargetParent(group, direction);
  const nextTrack = nextGroup.querySelector('.track-listing');

  const focusTarget = focusableInTrack(nextTrack, fieldIndex);
  setFocusAndSelection(focusTarget);

  return true;
}

function numberSelected() {
  store.dispatch(action.numberSelected());
  return true;
}

export default keyMapper({
  // Selection toggling
  'ctrl+f': toggleSelectFocused,
  'ctrl+g': toggleGroupFocused,
  'ctrl+d': unselectAll,

  // Track navigation
  'ctrl+n': e => moveTrackFocus(e, DIRECTION_DOWN),
  'ctrl+p': e => moveTrackFocus(e, DIRECTION_UP),

  // Group navigation
  'ctrl+alt+n': e => moveGroupFocus(e, DIRECTION_DOWN),
  'ctrl+alt+p': e => moveGroupFocus(e, DIRECTION_UP),

  // Selection actions
  'ctrl+k': numberSelected,
});
