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
import { readingMode, pageReAlign } from '../../manageBar/manageBar';
import { scrollModeDirection } from '../../mainView/pictureView/scrollList/scrollList';
import { readingDirection } from '../../mainView/pictureView/doublePage/doublePage';
import { WithTranslation, withTranslation } from 'react-i18next';
import { openNotification, hintMainText } from '@/renderer/utils/tools';
import { SyncOutlined } from '@ant-design/icons';
import { isArray } from '@/common/utils/types';

export interface IDirectoryData {
    url: string;
    title: string;
    tag: string[];
    author: string[];
    readingMode: readingMode;
    readingDirection: readingDirection;
    scrollModeDirection: scrollModeDirection;
    pageReAlign: pageReAlign;
    read_time: number;
    delay_time: number;
}

export interface IDirectoryViewProps extends WithTranslation {
    initPath?: string;
}

export interface IDirectoryViewState {
    treeData: ITreeDataNode[];
    lastSelectedNode: string;
}

export interface IDirectoryStore {
    url: string;
}

class DirectoryView extends PureComponent<IDirectoryViewProps & WithTranslation, IDirectoryViewState> {
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
                const tree = data.tree;
                this.linkTreeParent(tree, null);
                this.addDirNodeToTree(tree);
            }
        );

        ipcRenderer.on(command.RESPONSE_EXPAND_DIR, this.handleLoadedData);
    }

    linkTreeParent(node: ITreeDataNode, parent: ITreeDataNode | null) {
        node.parent = parent;
        const children = node.children;

        if (isArray(children)) {
            children.forEach((childNode) => {
                this.linkTreeParent(childNode, node);
            });
        }
    }

    async autoImportDir() {
        const dirs: string[] = (await db.directory.find({ auto: true }).exec()).map((item: any) => item.url);
        const t = this.props.t;
        dirs.forEach(dir => {
            openNotification(t('%importingDir%'), dir, { duration: 2, closeOtherNotification: false });
            ipcRenderer.send(command.IMPORT_DIR, { dir });
        });
    }

    addDirNodeToTree = (dirNode: ITreeDataNode) => {
        db.directory.update(
            { url: extractDirUrlFromKey(dirNode.key) },
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

    handleDeleteUrl = async (key: string) => {
        const url = extractDirUrlFromKey(key);
        const closeIndex = this.state.treeData.findIndex((data) => data.key === key);
        const newTreeData = [...this.state.treeData];
        newTreeData.splice(closeIndex, 1);
        this.setState({ treeData: newTreeData });

        await db.directory.update({ url }, { $set: { auto: false } });
    }

    syncDirTree = () => {
        this.setState({
            treeData: []
        });
        setTimeout(() => {
            this.autoImportDir();
        });
    }

    render(): JSX.Element {
        const t = this.props.t;

        return (
            <DirectoryTree
                onSyncData={this.syncDirTree}
                className={style.dirTree}
                onSelect={this.handleSelect}
                treeData={this.state.treeData}
                loadData={this.onLoadData}
                onFold={this.handleFold}
                onDeleteUrl={this.handleDeleteUrl}
            />
        );
    }
}

const directoryView = withTranslation()(DirectoryView);
export { directoryView as DirectoryView };