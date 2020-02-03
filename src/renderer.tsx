import './index.css';
import * as React from 'react';
import { HashRouter, Route, Switch } from 'react-router-dom';
import * as ReactDOM from 'react-dom';
import { HomePage } from './renderer/pages/HomePage';

const App: JSX.Element = (
  <HashRouter>
    <Switch>
      <Route path='/'>
        <HomePage></HomePage>
      </Route>

      <Route path='/show-pic'></Route>
    </Switch>
  </HashRouter>
);

ReactDOM.render(App, document.getElementById('app'));
