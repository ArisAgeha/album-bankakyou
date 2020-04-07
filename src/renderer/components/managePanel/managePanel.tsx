import React, { CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Modal } from 'antd';

export class ManagePanel extends React.PureComponent<IManagePanelProps> {

    constructor(props: IManagePanelProps) {
        super(props);
        console.log('hi');
    }

    cancel = () => {
        this.props.onCancel();
    }

    componentDidUpdate() {
        console.log(this.props.visible);
    }

    render() {
        return (<Modal
            visible={this.props.visible}
            footer={null}
            onCancel={this.cancel}
            forceRender
            closable={false}
        >
            123213123123
            23213
        </Modal>);
    }
}

interface IManagePanelProps {
    visible: boolean;
    onCancel(): void;
}