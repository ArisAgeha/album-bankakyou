import * as React from 'react';
import style from './preview.scss';
import { picture } from '../pictureView';
import { EventHub } from '@/common/eventHub';
import { eventConstant } from '@/common/constant/event.constant';
import LazyLoad from 'react-lazyload';
import { page } from '../../mainView';

export interface IPreviewState { }

export interface IPreviewProps {
    album: picture[];
    onClickPage(e: React.MouseEvent, data: { targetIndex: number; picture: picture }): void;
    zoomLevel: number;
    index: number;
}

export class Preview extends React.PureComponent<IPreviewProps, IPreviewState> {
    constructor(props: IPreviewProps) {
        super(props);

        this.state = {};
    }

    handleClick(e: React.MouseEvent, picture: picture, index: number) {
        // this.props.onClickPage(e, { targetIndex: index, picture });
    }

    render(): JSX.Element {
        const album = this.props.album;
        let zoomLevel = this.props.zoomLevel;
        const showTitle: boolean = zoomLevel === 11;

        zoomLevel = zoomLevel === 11 ? 10 : zoomLevel;
        const boxWidth: string = String(100 / this.props.zoomLevel) + '%';
        const boxMaxHeight: string = String(2000 / this.props.zoomLevel) + 'px';

        const scrollContainer = `#pictureViewScrollWrapper${this.props.index}`;

        return (
            <div className={style.preview} >
                {album.map((picture, index) => (
                    <div className={style.pictureBox} style={{ width: boxWidth }} key={picture.title}>
                        <div
                            className={style.imgBox}
                            onClick={(e: React.MouseEvent) => {
                                this.handleClick(e, picture, index);
                            }}
                        >
                            {/* <LazyLoad height={150} scrollContainer={scrollContainer}> */}
                            {picture.url.endsWith('.webm') ? (
                                <video src={picture.url} autoPlay muted loop></video>
                            ) : (
                                    <img src={picture.url} alt='' style={{ maxHeight: boxMaxHeight }} />
                                )}
                            {/* </LazyLoad> */}
                        </div>
                        <div className={`${style.title} text-ellipsis-2`} style={{ display: showTitle ? '-webkit-box' : 'none' }}>
                            {picture.title}
                        </div>
                    </div>
                ))}
            </div>
        );
    }
}
