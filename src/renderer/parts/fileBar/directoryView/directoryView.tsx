import React, { Component, SetStateAction } from 'react';
import { remote, ipcMain, ipcRenderer } from 'electron';
import { ServiceCollection } from '@/common/serviceCollection';
import style from './directoryView.scss';
import { Tree } from 'antd';
import { EventDataNode, DataNode } from 'rc-tree/lib/interface';
import { TreeNodeNormal } from 'antd/lib/tree/Tree';
import { FileService } from '@/main/services/file.service';
import { db } from '@/common/nedb';
import { extractDirUrlFromKey, extractSuffixFromKey } from '@/common/utils';

const { DirectoryTree } = Tree;

export interface IDirectoryViewProps {
    initPath?: string;
}

export interface IDirectoryViewState {
    treeData: TreeNodeNormal[];
}

export interface IDirectoryStore {
    url: string;
}

export class DirectoryView extends Component<any, IDirectoryViewState> {
    constructor(props: any) {
        super(props);
    }

    state: IDirectoryViewState = {
        treeData: []
    };

    componentDidMount() {
        this.initIpc();
        this.autoImportDir();
    }

    initIpc() {
        ipcRenderer.on('open-dir-by-import', (event: Electron.IpcRendererEvent, data: { autoImport: boolean; tree: TreeNodeNormal }) => {
            if (!data.autoImport) db.directory.insert({ url: extractDirUrlFromKey(data.tree.key) });
            this.setState({
                treeData: this.state.treeData.slice(0).concat(data.tree)
            });
        });
    }

    async autoImportDir() {
        const serviceCollection: ServiceCollection = (remote.app as any).serviceCollection;
        const fileService: FileService = serviceCollection.get('fileService');

        const dirs: string[] = (await db.directory.find({}).exec()).map((item: any) => item.url);
        dirs.forEach(dir => {
            fileService.openDirByImport(dir, true);
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

            fileService
                .loadDir(extractDirUrlFromKey(node.data.key), { level: 1, keySuffix: extractSuffixFromKey(node.data.key) })
                .then(loadedTree => {
                    treeNode.props.data.children = loadedTree.children;

                    this.setState({
                        treeData: [...this.state.treeData]
                    });
                    resolve();
                });
        });
    }

    render(): JSX.Element {
        return (
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
        );
    }
}
