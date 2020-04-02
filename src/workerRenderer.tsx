import * as ReactDOM from 'react-dom';
import React, { FC } from 'react';
import { ElectronWorker } from './workerRenderer/electronWorker';

bootstrap();

async function bootstrap() {
    const App: FC = (): JSX.Element => <ElectronWorker />;
    ReactDOM.render(<App />, document.getElementById('app'));
}
