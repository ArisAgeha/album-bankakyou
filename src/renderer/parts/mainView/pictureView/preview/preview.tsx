import * as React from 'react';
import style from './preview.scss';
import { picture } from '../pictureView';
import LazyLoad from '@arisageha/react-lazyload-fixed';
import { isVideo, encodeChar } from '@/common/utils/businessTools';
import { emptyCall } from '@/common/utils/functionTools';

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
    private readonly previewRef: React.RefObject<HTMLDivElement>;

    imageMap: {
        [key: string]: {
            [key: number]: JSX.Element;
        };
    };

    private readonly pictureBoxRefs: {
        [key: string]: HTMLDivElement;
    };

    constructor(props: IPreviewProps) {
        super(props);

        this.pictureBoxRefs = {};
        this.previewRef = React.createRef();

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
        this.abortRequestPicture();
    }

    initEvent() {
        window.addEventListener('keydown', this.handleKeyDown);
    }

    removeEvent() {
        window.removeEventListener('keydown', this.handleKeyDown);
    }

    abortRequestPicture = () => {
        const imgs = this.previewRef.current.querySelectorAll('img');
        const videos = this.previewRef.current.querySelectorAll('video');

        imgs.forEach(img => {
            img.src = '';
        });

        videos.forEach(video => {
            video.src = '';
        });
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
        if (e.ctrlKey || e.buttons === 2) {
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

        zoomLevel = zoomLevel === 11 ? 10 : zoomLevel;
        const boxWidth: string = String(100 / zoomLevel) + '%';

        Object.values(this.pictureBoxRefs).forEach(ref => {
            ref.style.width = boxWidth;
        });
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
        const zoomLevel = this.state.zoomLevel;
        const showTitle: boolean = zoomLevel === 11;

        const scrollContainer = `#pictureViewScrollWrapper${this.props.index}`;

        return (
            <div className={style.preview} ref={this.previewRef} onWheel={this.handleWheel} style={{ opacity: this.props.isShow ? 1 : 0 }}>
                {album.map((picture, index) => {
                    const resolution = 1200;

                    let content: JSX.Element = null;
                    if (isVideo(picture.url)) {
                        content = <video src={encodeChar(picture.url)} autoPlay muted loop></video>;
                    } else {
                        content = (this.imageMap[picture.id] && this.imageMap[picture.id][resolution]) || <img draggable={false} src={encodeChar(picture.url)} />;
                        this.imageMap[picture.id] ? emptyCall() : (this.imageMap[picture.id] = {});
                        this.imageMap[picture.id][resolution] = content;
                    }

                    return (
                        <div
                            onClick={(e: React.MouseEvent) => {
                                this.handleClick(e, picture, index);
                            }}
                            className={style.pictureBox}
                            key={picture.id}
                            ref={instance => {
                                this.pictureBoxRefs[picture.id] = instance;
                            }}
                        >
                            <div className={style.imgBox}>
                                <LazyLoad height={300} scrollContainer={scrollContainer} overflow offset={50} once>
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
