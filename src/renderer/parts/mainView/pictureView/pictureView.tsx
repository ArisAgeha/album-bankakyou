import * as React from 'react';

export type picture = {
    title: string;
    data: any;
};

export interface IPictureViewState {
    currentSelected: number;
}

export interface IPictureViewProps {
    album: picture[];
}

export class PictureView extends React.PureComponent<IPictureViewProps, IPictureViewState> {
    constructor(props: IPictureViewProps) {
        super(props);

        this.state = {
            currentSelected: -1
        };
    }

    render(): JSX.Element {
        const Album = this.props.album.map(picture => <img src={`data:image/jpg;base64,${picture.data}`} alt='' />);
        return <div>{Album}</div>;
    }
}
