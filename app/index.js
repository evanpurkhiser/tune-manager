import 'babel-polyfill';
import 'abortcontroller-polyfill';
import camelize from 'camelize';
import { Provider } from 'react-redux';
import React from 'react';
import ReactDOM from 'react-dom';

import * as actions from 'app/store/actions';
import App from 'app/App';
import globalKeys from 'app/globalKeys';
import store from 'app/store';

// Start events listener
const socket = new WebSocket(`ws://${window.location.host}/api/events`);
socket.onmessage = m => store.dispatch(camelize(JSON.parse(m.data)));

// Load known values
fetch('/api/known-values')
  .then(r => r.json())
  .then(knowns => {
    store.dispatch(actions.replaceKnowns(camelize(knowns)));
  });

document.body.addEventListener('keydown', globalKeys);

const providedApp = (
  <Provider store={store}>
    <App />
  </Provider>
);

ReactDOM.render(providedApp, document.getElementById('root'));
