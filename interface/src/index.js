import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux'
import * as camelize from 'camelize'

import App from './App';
import store from './store'
import * as actions from './actions'
import registerServiceWorker from './registerServiceWorker';

const socket = new WebSocket('ws://localhost:9000');

socket.onmessage = m => store.dispatch(camelize(JSON.parse(m.data)));

//fetch('http://localhost:5000/known_values').then(r => r.json()).then(knowns => {
//  store.dispatch(actions.replaceKnowns(camelize(knowns)))
//});

const providedApp = <Provider store={store}>
  <App />
</Provider>;

ReactDOM.render(providedApp, document.getElementById('root'));
registerServiceWorker();
