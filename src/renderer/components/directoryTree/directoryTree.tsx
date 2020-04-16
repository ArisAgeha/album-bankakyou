import React, { Component, PureComponent } from 'react';
import { FileImageOutlined, RightOutlined, DownOutlined, LoadingOutlined } from '@ant-design/icons';
import { isUndefinedOrNull, isArray } from '@/common/utils/types';
import style from './directoryTree.scss';
import { extractDirUrlFromKey } from '@/common/utils/tools';
import { EventHub } from '@/common/eventHub';
import { eventConstant } from '@/common/constant/event.constant';

export class DirectoryTree extends PureComponent<IDirectoryTreeProps, IDirectoryTreeState> {
    test: any = {};
    constructor(props: IDirectoryTreeProps) {
        super(props);
        this.state = {
            expandedKeys: [],
            selectedNodes: [],
            loadingKeys: [],
            lastSelectedNode: null,
            selectedNodesHistory: []
        };

    }

    componentDidMount() {
        this.initEvent();
    }

    initEvent = () => {
        window.addEventListener('mousedown', (downEvent: MouseEvent) => {
            let deltaX = 0;
            let deltaY = 0;

            const onMove = (moveEvent: MouseEvent) => {
                deltaX += moveEvent.movementX;
                deltaY += moveEvent.movementY;
            };

            if (downEvent.buttons === 3) {
                window.addEventListener('mousemove', onMove);
                window.addEventListener('mouseup', (upEvent: MouseEvent) => {
                    window.removeEventListener('mousemove', onMove);
                    this.checkOpenModal(deltaX, deltaY);
                }, { once: true });
            }
        });
    }

    checkOpenModal(x: number, y: number) {
        if (x > 300 && Math.abs(x / y) > 3) {
            const selectedKeys = this.state.selectedNodes.map(node => node.key);
            EventHub.emit(eventConstant.SHOW_MANAGE_BAR, selectedKeys);
        }
    }

    handleCloseManagePanel = () => {
        EventHub.emit(eventConstant.HIDDEN_MANAGE_BAR);
    }

    async handleClickNode(event: React.MouseEvent, node: ITreeDataNode) {
        event.stopPropagation();
        if ((event.shiftKey || event.buttons === 2) && this.state.lastSelectedNode) this.multiSelectDir(event, node);
        else if (event.ctrlKey || event.buttons === 2) this.selectDir(event, node);
        else this.openDir(event, node);
    }

    multiSelectDir = (event: React.MouseEvent, targetNodes: ITreeDataNode) => {
        const lastSelectedNode = this.state.lastSelectedNode;
        const treeData = this.props.treeData;
        const treeNodesMap = this.buildTreeNodesMap(treeData, []);

        // traverse all node and push the node which should be selected into `selectedArea`
        const selectedArea: ITreeDataNode[] = [];
        let startFlags = false;
        let endFlags = false;
        for (let i = 0; i < treeNodesMap.length; i++) {
            const node = treeNodesMap[i];
            if (node.key === lastSelectedNode.key) startFlags = true;
            if (node.key === targetNodes.key) endFlags = true;
            if (startFlags || endFlags) selectedArea.push(node);
            if (startFlags && endFlags) break;
        }

        const operationNodesArray = this.state.selectedNodesHistory.length === 0 ? this.state.selectedNodes : this.state.selectedNodesHistory;
        let newSelectedNodes = null;
        newSelectedNodes = Array.from(new Set([...operationNodesArray, ...selectedArea]));

        this.setState({
            selectedNodes: newSelectedNodes,
            selectedNodesHistory: operationNodesArray
        });
    }

    buildTreeNodesMap = (nodes: ITreeDataNode[], nodesMap: ITreeDataNode[]) => {
        nodes.forEach(node => {
            const { children, ...newNode } = node;
            nodesMap.push(newNode);
            if (node.children) this.buildTreeNodesMap(node.children, nodesMap);
        });
        return nodesMap;
    }

    selectDir(event: React.MouseEvent, node: ITreeDataNode) {
        const selectedNodes = this.state.selectedNodes.filter(n => n.key !== node.key);
        if (selectedNodes.length === this.state.selectedNodes.length) selectedNodes.push(node);
        this.setState({ selectedNodes, lastSelectedNode: node, selectedNodesHistory: [] });
    }

    openDir = async (event: React.MouseEvent, node: ITreeDataNode) => {
        const keyPosInRecord = this.state.expandedKeys.indexOf(node.key);
        const loadDataCb = this.props.loadData;
        const onSelectCb = this.props.onSelect;
        const onFold = this.props.onFold;
        const shouldInvokeLoadData = loadDataCb && !node.children;
        const shouldFoldNode = this.state.expandedKeys.includes(node.key) && onFold && node.children;
        const selectedNodes = [node];
        const selectedKeys = selectedNodes.map(node => node.key);

        // 1. expand/fold root node
        // 2. select node
        // 3. set node to loading status
        let expandedKeys;
        if (keyPosInRecord === -1) {
            expandedKeys = [...this.state.expandedKeys, node.key];
            this.setState({ expandedKeys, selectedNodes, lastSelectedNode: node, selectedNodesHistory: [] });
        } else {
            expandedKeys = [...this.state.expandedKeys];
            expandedKeys.splice(keyPosInRecord, 1);
            this.setState({ expandedKeys, selectedNodes, lastSelectedNode: node, selectedNodesHistory: [] });
        }

        // invoke loadData callback function.
        if (shouldInvokeLoadData) {
            if (onSelectCb && this.props.selectAwaitLoad) await loadDataCb(node);
            else loadDataCb(node);
        }

        if (shouldFoldNode) {
            onFold(node);
            const key = extractDirUrlFromKey(node.key);
            const keySuffix = node.key.slice(node.key.indexOf('|'));
            const shouldSaveKeys = expandedKeys.filter((expdKey) => {
                if (expdKey.startsWith(key) && expdKey.endsWith(keySuffix)) return false;
                return true;
            });
            this.setState({
                expandedKeys: shouldSaveKeys
            });
        }

        //  invoke onSelect callback function.
        if (onSelectCb) {
            onSelectCb(selectedKeys, {
                event: 'select',
                selected: keyPosInRecord === -1,
                node,
                selectedNodes: this.state.selectedNodes,
                nativeEvent: event
            });
        }
    }

    handleClickRoot = (event: React.MouseEvent) => {
        this.setState({
            selectedNodes: []
        });
    }

    renderLeaf(node: ITreeDataNode) {
        const res = (
            <div className={style.nodeLeaf} key={node.key}>
                <div className={style.icon}>
                    <FileImageOutlined />
                </div>
                <div className={`${style.title} text-ellipsis-1`}>{!isUndefinedOrNull(node.title) ? node.title : node.key}</div>
            </div>
        );
        return res;
    }

    renderRoot(node: ITreeDataNode) {
        const isExpanded: boolean = this.state.expandedKeys.includes(node.key);

        const NodeChildren = (
            <div className={style.nodeRootChildren}>
                {isArray(node.children) ? node.children.map(node => (node.isLeaf ? this.renderLeaf(node) : this.renderRoot(node))) : ''}
            </div>
        );

        const isSelected = this.state.selectedNodes.findIndex(nodeInState => nodeInState.key === node.key) !== -1;

        const res = (
            <div className={style.nodeRoot} key={node.key}>
                <div
                    className={`${style.nodeRootTitleWrapper} ${isSelected ? style.selected : ''}`}
                    onClick={(e: React.MouseEvent) => {
                        this.handleClickNode(e, node);
                    }}
                >
                    <div className={style.icon}>
                        {isExpanded ? <DownOutlined /> : <RightOutlined />}
                    </div>
                    <div className={`${style.nodeRootTitle}`}>{!isUndefinedOrNull(node.title) ? node.title : node.key}</div>
                </div>
                {isExpanded ? NodeChildren : ''}
            </div>
        );
        this.test[node.key] ? this.test[node.key]++ : this.test[node.key] = 1;
        return res;
    }

    render() {
        const treeData = this.props.treeData;
        const res = (
            <div className={style.treeRootWrapper} onClick={this.handleClickRoot}>
                <div className={style.treeRoot}>
                    {treeData.map(node => (node.isLeaf ? this.renderLeaf(node) : this.renderRoot(node)))}
                </div>
            </div>
        );
        return res;
    }
}

export interface IDirectoryTreeState {
    expandedKeys: string[];
    selectedNodes: ITreeDataNode[];
    loadingKeys: string[];
    lastSelectedNode: ITreeDataNode;
    selectedNodesHistory: ITreeDataNode[];
}

export interface IDirectoryTreeProps {
    className: any;
    treeData: ITreeDataNode[];
    onSelect?(
        keys: string[],
        event: {
            event: 'select';
            selected: boolean;
            node: ITreeDataNode;
            selectedNodes: ITreeDataNode[];
            nativeEvent: React.MouseEvent;
        }
    ): void;
    loadData?(treeNode: ITreeDataNode): Promise<void>;
    onFold?(treeNode: ITreeDataNode): void;
    selectAwaitLoad?: boolean;
}

export interface ITreeDataNode {
    key: string;
    title?: string;
    data?: any;
    children?: ITreeDataNode[];
    isLeaf?: boolean;
}
