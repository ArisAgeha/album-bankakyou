import * as React from 'react';
import style from './pictureView.scss';

export interface IScrollListState {}

export interface IScrollListProps {}

export class ScrollList extends React.PureComponent<IScrollListProps, IScrollListState> {
    constructor(props: IScrollListProps) {
        super(props);

        this.state = {};
    }

    render(): JSX.Element {
        return <div></div>;
    }
}
