import { Component } from 'react';

export interface selecteInfo {
    event: 'select';
    selected: boolean;
    // node: EventDataNode;
    // selectedNodes: DataNode[];
    nativeEvent: MouseEvent;
}

export interface IDirectoryProps {
    multiple: boolean;
    className: string;
    defaultExpandAll: boolean;
    onSelect(selectedKey: string[], info: { event: 'select' }): {};
}

export class DirectoryTree extends Component<any, any> {
    constructor(props: any) {
        super(props);
    }
}
