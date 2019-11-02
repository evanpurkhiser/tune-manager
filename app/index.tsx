import 'babel-polyfill';
import * as Sentry from '@sentry/browser';
import { Global, css } from '@emotion/core';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import React from 'react';
import ReactDOM from 'react-dom';

import Importer from 'app/importer';
import Catalog from 'app/catalog';

Sentry.init({
  dsn: 'https://208c1692ec594314acbc4e63a3fd775e@sentry.io/1805605',
});

const globalCss = css`
  * {
    box-sizing: border-box;
  }

  ol,
  ul,
  li {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  a:link {
    text-decoration: none;
  }

  body,
  html,
  #root,
  .app {
    margin: 0;
    font-family: 'Roboto', sans-serif;
    font-weight: 500;
    color: #4a585f;
    height: 100%;
  }
`;

const AppRouter = _ => (
  <Router>
    <Global styles={globalCss} />
    <Route path="/importer" component={Importer} />
    <Route path="/catalog" component={Catalog} />
  </Router>
);

ReactDOM.render(<AppRouter />, document.getElementById('root'));
