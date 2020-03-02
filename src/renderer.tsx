import * as ReactDOM from 'react-dom';
import { hot } from 'react-hot-loader';
import React, { FC } from 'react';
import { Layout } from './renderer/Layout';
import initI18n from './languages/i18n';
import { remote } from 'electron';
import { ServiceCollection } from './common/serviceCollection';
import { ConfigurationService } from './main/services/configuration.service';
import { processConfig } from './common/constant/config.constant';

async function bootstrap() {
    const serviceCollection: ServiceCollection = (remote.app as any).serviceCollection;
    const configurationService: ConfigurationService = serviceCollection.get('configurationService');
    const languageSetting: string = configurationService.getValue('process', processConfig.LOCALE_LANGUAGE) as string;

    await initI18n(languageSetting);
    const App: FC = (): JSX.Element => <Layout></Layout>;
    hot(module)(App);

    ReactDOM.render(<App />, document.getElementById('app'));
}

bootstrap();
