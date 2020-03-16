import * as React from 'react';
import style from './pictureView.scss';
import { picture } from '../pictureView';

export interface IPreviewState {}

export interface IPreviewProps {
    album: picture[];
    onDbClick(e: React.MouseEvent, data: any): void;
}

export class Preview extends React.PureComponent<IPreviewProps, IPreviewState> {
    constructor(props: IPreviewProps) {
        super(props);

        this.state = {};
    }

    render(): JSX.Element {
        return <div></div>;
    }
}
