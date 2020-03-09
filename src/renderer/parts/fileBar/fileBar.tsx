import React, { Component, SetStateAction } from 'react';
import { remote, ipcMain, ipcRenderer } from 'electron';
import { ServiceCollection } from '@/common/serviceCollection';
import style from './FileBar.scss';
import { Tree } from 'antd';
import { EventDataNode, DataNode } from 'rc-tree/lib/interface';
import { TreeNodeNormal } from 'antd/lib/tree/Tree';
import { FileService } from '@/main/services/file.service';
import { isArray } from '@/common/types';
import { resolveOnChange } from 'antd/lib/input/Input';

const { DirectoryTree } = Tree;

export class FileBar extends Component<IFileBarProps, IFileBarState> {
    constructor(props: IFileBarProps) {
        super(props);
    }

    state: IFileBarState = {
        treeData: []
    };

    componentDidMount() {
        this.initIpc();
    }

    initIpc() {
        ipcRenderer.on('open-dir-by-importer', (event: Electron.IpcRendererEvent, val: TreeNodeNormal) => {
            console.log(val);
            this.setState({
                treeData: this.state.treeData.slice(0).concat(val)
            });
        });
    }

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
        // console.log('Trigger Select', keys, event);
    }

    async onLoadData(treeNode: any): Promise<void> {
        return new Promise(resolve => {
            if (treeNode.props.data.children) {
                resolve();
                return;
            }
            const node = treeNode.props;
            const serviceCollection: ServiceCollection = (remote.app as any).serviceCollection;
            const fileService: FileService = serviceCollection.get('fileService');

            const loadedTree = fileService.recurseDir(node.data.key, 1);

            treeNode.props.data.children = loadedTree.children;

            this.setState({
                treeData: [...this.state.treeData]
            });
            resolve();
        });
    }

    render(): JSX.Element {
        return (
            <div className={style.fileBar}>
                <div className={`${style.dirTreeWrapper} medium-scrollbar text-ellipsis-1`}>
                    <DirectoryTree
                        className={style.dirTree}
                        multiple
                        defaultExpandAll
                        onSelect={this.onSelect}
                        treeData={this.state.treeData}
                        blockNode={true}
                        draggable={true}
                        showIcon={false}
                        loadData={this.onLoadData.bind(this) as (treeNode: EventDataNode) => Promise<void>}
                    />
                </div>
            </div>
        );
    }
}

export interface IFileBarProps {
    initPath?: string;
}

export interface IFileBarState {
    treeData: TreeNodeNormal[];
}
