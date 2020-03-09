import React, { Component, SetStateAction } from 'react';
import { remote, ipcMain, ipcRenderer } from 'electron';
import { ServiceCollection } from '@/common/serviceCollection';
import style from './tagView.scss';
import { Tree } from 'antd';
import { EventDataNode, DataNode } from 'rc-tree/lib/interface';
import { FileService } from '@/main/services/file.service';

export interface ITagViewProps {
    initPath?: string;
}

export interface ITagViewState {}

export class TagView extends Component<any, ITagViewState> {
    constructor(props: any) {
        super(props);
    }

    state: ITagViewState = {
        treeData: []
    };

    render(): JSX.Element {
        return <div className={`${style.dirTreeWrapper} medium-scrollbar text-ellipsis-1`}></div>;
    }
}
