import * as ReactDOM from 'react-dom';
import { hot } from 'react-hot-loader';
import React, { FC } from 'react';
import { Layout } from './renderer/Layout';

const App: FC = (): JSX.Element => <Layout></Layout>;
hot(module)(App);

ReactDOM.render(<App />, document.getElementById('app'));
