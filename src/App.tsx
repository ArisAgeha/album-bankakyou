import { hot } from 'react-hot-loader';
import React, { FC } from 'react';
import { HashRouter, Route, Switch } from 'react-router-dom';

import { Layout } from './workbench/Layout';

const App: FC = (): JSX.Element => (
  <HashRouter>
    <Switch>
      <Route path='/'>
        <Layout></Layout>
      </Route>
    </Switch>
  </HashRouter>
);

export default hot(module)(App);
