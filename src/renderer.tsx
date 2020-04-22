import * as ReactDOM from 'react-dom';
import { hot } from 'react-hot-loader';
import React, { FC } from 'react';
import { Layout } from './renderer/Layout';
import initI18n from './languages/i18n';
import { remote } from 'electron';
import { ServiceCollection } from './common/serviceCollection';
import { ConfigurationService } from './main/services/configuration.service';
import { processConfig } from './common/constant/config.constant';
import { db } from './common/nedb';
import { serviceConstant } from './common/constant/service.constant';
import { isDev } from './common/utils/functionTools';

bootstrap();

async function bootstrap() {
    // init i18n
    const serviceCollection: ServiceCollection = remote.getGlobal(serviceConstant.SERVICE_COLLECTION);
    const configurationService: ConfigurationService = serviceCollection.get(serviceConstant.CONFIGURATION);
    const languageSetting: string = configurationService.getValue('process', processConfig.LOCALE_LANGUAGE) as string;
    await initI18n(languageSetting);

    //init nedb
    await db.directory.load();
    await db.tag.load();
    await db.collection.load();
    db.directory.ensureIndex({ fieldName: 'url', unique: true });
    initApp();
}

function initApp() {
    // init app
    const App: FC = (): JSX.Element => <Layout />;

    // init hot module if NODE_ENV is in dev
    if (isDev) hot(module)(App);

    ReactDOM.render(<App />, document.getElementById('app'));
}
