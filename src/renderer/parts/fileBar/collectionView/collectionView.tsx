import React, { Component, SetStateAction, PureComponent } from 'react';
import { remote, ipcMain, ipcRenderer } from 'electron';
import { ServiceCollection } from '@/common/serviceCollection';
import style from './collectionView.scss';
import { Tree } from 'antd';
import { FileService } from '@/main/services/file.service';

export interface ICollectionViewProps {}

export interface ICollectionViewState {}

export class CollectionView extends PureComponent<any, ICollectionViewState> {
    constructor(props: any) {
        super(props);
    }

    state: ICollectionViewState = {
        treeData: []
    };

    render(): JSX.Element {
        return <div className={`${style.dirTreeWrapper} medium-scrollbar text-ellipsis-1`}></div>;
    }
}
