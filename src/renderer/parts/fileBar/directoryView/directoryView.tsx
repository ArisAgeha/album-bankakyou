import React, { Component, SetStateAction, PureComponent } from 'react';
import { remote, ipcMain, ipcRenderer, IpcMain, IpcRendererEvent } from 'electron';
import { ServiceCollection } from '@/common/serviceCollection';
import style from './directoryView.scss';
import { FileService } from '@/main/services/file.service';
import { db } from '@/common/nedb';
import { extractDirUrlFromKey, extractSuffixFromKey } from '@/common/utils/businessTools';
import { command } from '@/common/constant/command.constant';
import { eventConstant } from '@/common/constant/event.constant';
import { EventHub } from '@/common/eventHub';
import { ITreeDataNode, DirectoryTree } from '../../../components/directoryTree/directoryTree';
import { serviceConstant } from '@/common/constant/service.constant';
import { readingDirection, readingMode, pageReAlign } from '../../manageBar/manageBar';

export interface IDirectoryData {
    url: string;
    title: string;
    tag: string[];
    author: string[];
    readingMode: readingMode;
    readingDirection: readingDirection;
    pageReAlign: pageReAlign;
    read_time: number;
    delay_time: number;
}

export interface IDirectoryViewProps {
    initPath?: string;
}

export interface IDirectoryViewState {
    treeData: ITreeDataNode[];
    lastSelectedNode: string;
}

export interface IDirectoryStore {
    url: string;
}

export class DirectoryView extends PureComponent<any, IDirectoryViewState> {
    constructor(props: any) {
        super(props);
    }

    tmpTreeNode: ITreeDataNode = null;

    state: IDirectoryViewState = {
        treeData: [],
        lastSelectedNode: ''
    };

    componentDidMount() {
        this.initIpc();
        this.autoImportDir();
    }

    initIpc() {
        ipcRenderer.on(
            command.OPEN_DIR_BY_IMPORT,
            (event: Electron.IpcRendererEvent, data: { tree: ITreeDataNode }) => {
                this.addDirNodeToTree(data.tree);
            }
        );

        ipcRenderer.on(command.RESPONSE_EXPAND_DIR, this.handleLoadedData);
    }

    async autoImportDir() {
        const dirs: string[] = (await db.directory.find({ auto: true }).exec()).map((item: any) => item.url);
        dirs.forEach(dir => {
            ipcRenderer.send(command.IMPORT_DIR, { dir });
        });
    }

    addDirNodeToTree = (dirNode: ITreeDataNode) => {
        db.directory.update(
            { url: extractDirUrlFromKey(dirNode.key), auto: true },
            { $set: { url: extractDirUrlFromKey(dirNode.key), auto: true } },
            { upsert: true }
        );
        this.setState({
            treeData: this.state.treeData.slice(0).concat(dirNode)
        });
    }

    handleSelect = (
        keys: string[],
        event: {
            event: 'select';
            selected: boolean;
            node: ITreeDataNode;
            selectedNodes: ITreeDataNode[];
            nativeEvent: React.MouseEvent;
        }
    ) => {
        const key: string = keys[0];
        this.setState({ lastSelectedNode: key });

        const url = extractDirUrlFromKey(key);
        EventHub.emit(eventConstant.LOAD_PICTURE_BY_SELECT_DIR, {
            url,
            type: 'NEW'
        });
    }

    handleFold = (treeNode: ITreeDataNode) => {
        // delete treeNode.children;
        // this.setState({
        //     treeData: [...this.state.treeData]
        // });
    }

    onLoadData = async (treeNode: ITreeDataNode): Promise<void> => {
        if (treeNode.children) return;

        const node = treeNode;
        const loadOptions = { level: 1, keySuffix: extractSuffixFromKey(node.key), maxDepth: 2 };
        ipcRenderer.send(command.EXPAND_DIR, {
            url: extractDirUrlFromKey(node.key),
            loadOptions
        });
        this.tmpTreeNode = treeNode;
    }

    handleLoadedData = (event: Electron.IpcRendererEvent, loadedTree: ITreeDataNode) => {
        this.tmpTreeNode.children = loadedTree.children || [];

        this.setState({
            treeData: [...this.state.treeData]
        });
    }

    render(): JSX.Element {
        return (
            <div className={`${style.dirTreeWrapper} medium-scrollbar`}>
                <DirectoryTree
                    className={style.dirTree}
                    onSelect={this.handleSelect}
                    treeData={this.state.treeData}
                    loadData={this.onLoadData}
                    onFold={this.handleFold}
                />
            </div>
        );
    }
}
