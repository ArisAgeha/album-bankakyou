import * as React from 'react';
import style from './pictureView.scss';

export interface ISinglePageState {}

export interface ISinglePageProps {}

export class SinglePage extends React.PureComponent<ISinglePageProps, ISinglePageState> {
    constructor(props: ISinglePageProps) {
        super(props);

        this.state = {};
    }

    render(): JSX.Element {
        return <div></div>;
    }
}
