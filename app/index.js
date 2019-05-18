import 'babel-polyfill';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import React from 'react';
import ReactDOM from 'react-dom';

import Importer from 'app/importer';

const AppRouter = _ => (
  <Router>
    <Route path="/importer" component={Importer} />
  </Router>
);

ReactDOM.render(<AppRouter />, document.getElementById('root'));
