import React, { Component, SetStateAction } from 'react';
import { remote } from 'electron';
import { ServiceCollection } from '@/common/serviceCollection';

const serviceCollection: ServiceCollection = (remote.app as any).serviceCollection;

export interface IFileBarProps {
    initPath?: string;
}

export interface IFileBarState {
    directory: {
        [key: string]: string;
    };
    expendedNodes: string[];
}

export class FileBar extends Component<IFileBarProps, IFileBarState> {
    state: IFileBarState = {
        directory: {},
        expendedNodes: []
    };

    render(): JSX.Element {
        return <div style={{ height: '50%', width: '50%' }}></div>;
    }
}
