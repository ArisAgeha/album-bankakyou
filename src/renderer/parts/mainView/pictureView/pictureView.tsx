import * as React from 'react';
import style from './pictureView.scss';

export type picture = {
    title: string;
    data: any;
};

export interface IPictureViewState {
    currentSelected: number;
    viewMode: 'preview' | 'scroll_list' | 'single_page' | 'double_page';
    currentShowIndex: number;
    size: {
        preview: number;
        scroll_list: number;
        double_page: number;
    };
}

export interface IPictureViewProps {
    album: picture[];
}

export class PictureView extends React.PureComponent<IPictureViewProps, IPictureViewState> {
    constructor(props: IPictureViewProps) {
        super(props);

        this.state = {
            currentSelected: -1,
            viewMode: 'preview',
            currentShowIndex: 0,
            size: {
                preview: 1 / 6,
                scroll_list: 0.6,
                double_page: 1
            }
        };
    }

    render(): JSX.Element {
        const Album = this.props.album.map(picture => (
            <div className={style.imgBox}>
                <img draggable={false} src={`data:image/jpg;base64,${picture.data}`} alt='' />
            </div>
        ));
        return <div className={style.pictureViewWrapper}>{Album}</div>;
    }
}
