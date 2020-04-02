import * as React from 'react';
import { Event, app, remote } from 'electron';
import 'reflect-metadata';

interface IElectronWorkerState {}

interface IElectronWorkerValue {}

class ElectronWorker extends React.PureComponent<any, IElectronWorkerState> {
    componentDidMount() {
        this.initEvent();
    }

    initEvent() {}

    render(): JSX.Element {
        return <div></div>;
    }
}

export { ElectronWorker };
