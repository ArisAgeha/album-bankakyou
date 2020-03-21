import * as React from 'react';
import style from './preview.scss';
import { picture } from '../pictureView';
import { EventHub } from '@/common/eventHub';
import { eventConstant } from '@/common/constant/event.constant';
import LazyLoad from 'react-lazyload';
import { page } from '../../mainView';

export interface IPreviewState {
    zoomLevel: number;
}

export type zoomEvent = 'ZOOM_IN' | 'ZOOM_OUT';

export interface IPreviewProps {
    album: picture[];
    onClickPage(e: React.MouseEvent, data: { targetIndex: number; picture: picture }): void;
    index: number;
    isShow: boolean;
}

export class Preview extends React.PureComponent<IPreviewProps, IPreviewState> {
    constructor(props: IPreviewProps) {
        super(props);

        this.state = {
            zoomLevel: 6
        };
        this.initEvent();
    }

    componentWillUnmount() {
        this.removeEvent();
    }

    initEvent() {
        window.addEventListener('keydown', this.handleKeyDown);
    }

    removeEvent() {
        window.removeEventListener('keydown', this.handleKeyDown);
    }

    handleClick(e: React.MouseEvent, picture: picture, index: number) {
        this.props.onClickPage(e, { targetIndex: index, picture });
    }

    handleKeyDown = (e: KeyboardEvent) => {
        if (!this.props.isShow) return;

        let zoom: zoomEvent = null;
        if (e.key === '+') zoom = 'ZOOM_IN';
        else if (e.key === '-') zoom = 'ZOOM_OUT';
        if (zoom) this.handleZoom(zoom);
    }

    handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey) {
            let zoom: zoomEvent = null;
            if (e.deltaY < 0) zoom = 'ZOOM_IN';
            else if (e.deltaY > 0) zoom = 'ZOOM_OUT';
            if (zoom) this.handleZoom(zoom);
        }
    }

    handleZoom = (zoom: zoomEvent) => {
        let zoomLevel = this.state.zoomLevel;
        if (zoom === 'ZOOM_OUT') zoomLevel = zoomLevel >= 11 ? 11 : zoomLevel + 1;
        else zoomLevel = zoomLevel <= 1 ? 1 : zoomLevel - 1;

        this.setState({
            zoomLevel
        });
    }

    render(): JSX.Element {
        const album = this.props.album;
        let zoomLevel = this.state.zoomLevel;
        const showTitle: boolean = zoomLevel === 11;

        zoomLevel = zoomLevel === 11 ? 10 : zoomLevel;
        const boxWidth: string = String(100 / this.state.zoomLevel) + '%';
        const boxMaxHeight: string = String(2000 / this.state.zoomLevel) + 'px';

        const scrollContainer = `#pictureViewScrollWrapper${this.props.index}`;

        return (
            <div
                className={style.preview}
                onWheel={this.handleWheel}
            >
                {album.map((picture, index) => (
                    <div
                        onClick={(e: React.MouseEvent) => {
                            this.handleClick(e, picture, index);
                        }}
                        className={style.pictureBox}
                        style={{ width: boxWidth }}
                        key={picture.title}
                    >
                        <div className={style.imgBox} >
                            <LazyLoad height={300} scrollContainer={scrollContainer} overflow offset={150}>
                                {picture.url.endsWith('.webm') ? (
                                    <video src={picture.url} autoPlay muted loop></video>
                                ) : (
                                        <img src={picture.url} alt='' style={{ maxHeight: boxMaxHeight }} />
                                    )}
                            </LazyLoad>
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
