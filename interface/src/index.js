import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux'
import * as camelize from 'camelize'

import App from './App';
import store from './store'
import * as actions from './actions'
import registerServiceWorker from './registerServiceWorker';

fetch('http://localhost:5000/listing').then(r => r.json()).then(tracks => {
  store.dispatch(actions.replaceTracks(camelize(tracks)))
});

const providedApp = <Provider store={store}>
  <App />
</Provider>;

ReactDOM.render(providedApp, document.getElementById('root'));
registerServiceWorker();
