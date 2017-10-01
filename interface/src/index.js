import 'abortcontroller-polyfill';
import * as camelize from 'camelize';
import { Provider } from 'react-redux';
import React from 'react';
import ReactDOM from 'react-dom';

import * as actions from './actions';
import App from './App';
import globalKeys from './globalKeys';
import store from './store';

// Start events listener
const socket = new WebSocket('ws://localhost:8000/events');
socket.onmessage = m => store.dispatch(camelize(JSON.parse(m.data)));

// Load known values
fetch('http://localhost:8000/known-values').then(r => r.json()).then(knowns => {
  store.dispatch(actions.replaceKnowns(camelize(knowns)));
});

document.body.addEventListener('keydown', globalKeys);

const providedApp = <Provider store={store}>
  <App />
</Provider>;

ReactDOM.render(providedApp, document.getElementById('root'));
