import * as React from 'react';
import style from './pictureView.scss';

export interface IDoublePageState {}

export interface IDoublePageProps {}

export class DoublePage extends React.PureComponent<IDoublePageProps, IDoublePageState> {
    constructor(props: IDoublePageProps) {
        super(props);

        this.state = {};
    }

    render(): JSX.Element {
        return <div></div>;
    }
}
