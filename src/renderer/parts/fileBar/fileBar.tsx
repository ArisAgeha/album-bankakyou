import React, { Component, SetStateAction } from 'react';
import { remote } from 'electron';
import { ServiceCollection } from '@/common/serviceCollection';
import style from './FileBar.scss';
import { Tree } from 'antd';
import { EventDataNode, DataNode } from 'rc-tree/lib/interface';

const serviceCollection: ServiceCollection = (remote.app as any).serviceCollection;

const { DirectoryTree } = Tree;
const treeData = [
    {
        title: 'parent 0',
        key: '0-0',
        children: [
            { title: 'leaf 0-0', key: '0-0-0', isLeaf: true },
            { title: 'leaf 0-1', key: '0-0-1', isLeaf: true }
        ]
    },
    {
        title: 'parent 1',
        key: '0-1',
        children: [
            { title: 'leaf 1-0', key: '0-1-0', isLeaf: true },
            { title: 'leaf 1-1', key: '0-1-1', isLeaf: true }
        ]
    }
];

export class FileBar extends Component<IFileBarProps, IFileBarState> {
    state: IFileBarState = {
        directory: {},
        expendedNodes: []
    };

    onSelect(
        keys: React.ReactText[],
        event: {
            event: 'select';
            selected: boolean;
            node: EventDataNode;
            selectedNodes: DataNode[];
            nativeEvent: MouseEvent;
        }
    ) {
        console.log('Trigger Select', keys, event);
    }

    onExpand() {
        console.log('Trigger Expand');
    }

    render(): JSX.Element {
        return (
            <div className={style.fileBar}>
                <div className={style.dirTreeWrapper}>
                    <DirectoryTree multiple defaultExpandAll onSelect={this.onSelect} onExpand={this.onExpand} treeData={treeData} />
                </div>
            </div>
        );
    }
}

export interface IFileBarProps {
    initPath?: string;
}

export interface IFileBarState {
    directory: {
        [key: string]: string;
    };
    expendedNodes: string[];
}
