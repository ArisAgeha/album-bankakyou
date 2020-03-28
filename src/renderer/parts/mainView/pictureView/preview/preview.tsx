import * as React from 'react';
import style from './preview.scss';
import { picture } from '../pictureView';
import { EventHub } from '@/common/eventHub';
import { eventConstant } from '@/common/constant/event.constant';
import LazyLoad from 'react-lazyload';
import { page } from '../../mainView';
import { CompressedImage } from '@/renderer/components/CompressedImage/compressedImageOldVersion';
import { emptyCall } from '@/common/utils';

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
    imageMap: {
        [key: string]: {
            [key: number]: JSX.Element;
        };
    };

    constructor(props: IPreviewProps) {
        super(props);

        this.imageMap = {};

        this.state = {
            zoomLevel: 6
        };
    }

    componentDidMount() {
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

    getImage(dataUrl: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.src = dataUrl;
            image.onload = () => {
                resolve(image);
            };
            image.onerror = (el: any, err: string) => {
                reject(err);
            };
        });
    }

    render(): JSX.Element {
        const album = this.props.album;
        let zoomLevel = this.state.zoomLevel;
        const showTitle: boolean = zoomLevel === 11;

        zoomLevel = zoomLevel === 11 ? 10 : zoomLevel;
        const boxWidth: string = String(100 / this.state.zoomLevel) + '%';
        const boxMaxHeight: number = 2000 / this.state.zoomLevel;

        const scrollContainer = `#pictureViewScrollWrapper${this.props.index}`;

        return (
            <div className={style.preview} onWheel={this.handleWheel}>
                {album.map((picture, index) => {
                    const resolution = boxMaxHeight < 600 ? 600 : 1200;

                    let content: JSX.Element = null;
                    if (picture.url.endsWith('.webm')) {
                        content = <video src={picture.url} autoPlay muted loop></video>;
                    } else {
                        content = (this.imageMap[picture.id] && this.imageMap[picture.id][resolution]) || (
                            <CompressedImage
                                dataUrl={picture.url}
                                imageType={picture.url.slice(picture.url.lastIndexOf('.') + 1)}
                                resolution={resolution}
                                quality={1}
                            />
                        );

                        this.imageMap[picture.id] ? emptyCall() : (this.imageMap[picture.id] = {});
                        this.imageMap[picture.id][resolution] = content;
                    }

                    return (
                        <div
                            onClick={(e: React.MouseEvent) => {
                                this.handleClick(e, picture, index);
                            }}
                            className={style.pictureBox}
                            style={{ width: boxWidth }}
                            key={picture.id}
                        >
                            <div className={style.imgBox}>
                                <LazyLoad height={300} scrollContainer={scrollContainer} overflow offset={150}>
                                    {content}
                                </LazyLoad>
                            </div>
                            <div className={`${style.title} text-ellipsis-2`} style={{ display: showTitle ? '-webkit-box' : 'none' }}>
                                {picture.title}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }
}
