import './index.css';
import * as React from 'react';
import { HashRouter, Route, Switch } from 'react-router-dom';
import * as ReactDOM from 'react-dom';

const App: JSX.Element = (
  <HashRouter>
    <Switch></Switch>
  </HashRouter>
);

ReactDOM.render(App, document.getElementById('app'));
