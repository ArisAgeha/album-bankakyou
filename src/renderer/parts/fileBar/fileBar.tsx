import React, { Component, SetStateAction, PureComponent } from 'react';
import { remote, ipcMain, ipcRenderer } from 'electron';
import { ServiceCollection } from '@/common/serviceCollection';
import style from './FileBar.scss';
import { Tree } from 'antd';
import { EventDataNode, DataNode } from 'rc-tree/lib/interface';
import { TreeNodeNormal } from 'antd/lib/tree/Tree';
import { FileService } from '@/main/services/file.service';
import { isArray } from '@/common/types';
import { resolveOnChange } from 'antd/lib/input/Input';
import { DirectoryView } from './directoryView/directoryView';
import { TagView } from './tagView/tagView';
import { CollectionView } from './collectionView/collectionView';

const { DirectoryTree } = Tree;

export class FileBar extends PureComponent<IFileBarProps, IFileBarState> {
    constructor(props: IFileBarProps) {
        super(props);
    }

    state: IFileBarState = {
        treeData: []
    };

    render(): JSX.Element {
        const showDirView = this.props.showView === 'directory' ? 'block' : 'none';
        const showCollectionView = this.props.showView === 'collection' ? 'block' : 'none';
        const showTagView = this.props.showView === 'tag' ? 'block' : 'none';

        return (
            <div className={style.fileBar}>
                <div className={style.viewWrapper} style={{ display: showDirView }}>
                    <DirectoryView></DirectoryView>
                </div>
                <div className={style.viewWrapper} style={{ display: showCollectionView }}>
                    <CollectionView></CollectionView>
                </div>
                <div className={style.viewWrapper} style={{ display: showTagView }}>
                    <TagView></TagView>
                </div>
            </div>
        );
    }
}

export interface IFileBarProps {
    showView: fileBarViewType;
}

export interface IFileBarState {}

export type fileBarViewType = 'directory' | 'collection' | 'tag';
