import * as ReactDOM from 'react-dom';
import { hot } from 'react-hot-loader';
import React, { FC } from 'react';
import { Layout } from './renderer/Layout';
import initI18n from './languages/i18n';

async function bootstrap() {
    await initI18n('zh-cn');
    const App: FC = (): JSX.Element => <Layout></Layout>;
    hot(module)(App);

    ReactDOM.render(<App />, document.getElementById('app'));
}

bootstrap();
