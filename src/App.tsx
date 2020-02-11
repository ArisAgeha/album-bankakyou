import { hot } from 'react-hot-loader';
import React, { FC } from 'react';

import { Layout } from './workbench/Layout';

const App: FC = (): JSX.Element => <Layout></Layout>;

export default hot(module)(App);
