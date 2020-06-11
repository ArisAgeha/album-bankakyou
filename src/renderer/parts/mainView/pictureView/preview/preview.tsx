import * as React from 'react';
import style from './preview.scss';
import { picture } from '../pictureView';
import LazyLoad from '@arisageha/react-lazyload-fixed';
import { isVideo, encodeChar } from '@/common/utils/businessTools';
import { emptyCall } from '@/common/utils/functionTools';
import { hintText } from '@/renderer/utils/tools';
import { throttle } from '@/common/decorator/decorator';

export interface IPreviewState {
    zoomLevel: number;
    loadedIndex: number;
    album: picture[];
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
    loadLock: boolean = false;

    imageMap: {
        [key: string]: JSX.Element;
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
            album: this.props.album.slice(0, 20),
            zoomLevel: 6,
            loadedIndex: -1
        };

        this.startLoad();
    }

    startLoad() {
        this.loadLock = true;

        const album = this.state.album;
        const nextIndex = this.state.loadedIndex + 1;
        console.log(nextIndex);
        console.log(this.state.album[nextIndex]);
        const url = this.state.album[nextIndex].url;
        const image = new Image();
        const onloadFunc = () => {
            this.setState({
                loadedIndex: nextIndex
            });
            setTimeout(() => {
                if (album.length > nextIndex + 1) this.startLoad();
                else this.loadLock = false;
            }, 0);
        };
        image.onload = onloadFunc;
        image.onerror = onloadFunc;
        image.src = url;
    }

    componentDidMount() {
        this.initEvent();
    }

    componentWillUnmount() {
        this.removeEvent();
        this.abortRequestPicture();
    }

    componentDidUpdate() {
        const boxWidth: string = String(100 / this.state.zoomLevel) + '%';

        Object.values(this.pictureBoxRefs).forEach(ref => {
            ref.style.width = boxWidth;
        });
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

    appendAlbum = () => {
        this.appendAlbumWithThrottle.call(this);
    }

    appendAlbumWithThrottle() {
        if (this.loadLock) return;
        const curLength = this.state.album.length;
        if (this.state.album.length < this.props.album.length) {
            const album = this.props.album.slice(0, curLength + 10);
            this.setState({ album });
            setTimeout(() => {
                this.startLoad();
            }, 0);
        }
    }

    render(): JSX.Element {
        const album = this.state.album.slice(0, this.state.loadedIndex + 1);
        const zoomLevel = this.state.zoomLevel;
        const showTitle: boolean = zoomLevel === 11;

        return (
            <div
                className={style.preview}
                ref={this.previewRef}
                onWheel={this.handleWheel}
                style={{ opacity: this.props.isShow ? 1 : 0 }}>
                {album.map((picture, index) => {
                    let content: JSX.Element = null;
                    if (isVideo(picture.url)) {
                        content = <video src={encodeChar(picture.url)} autoPlay muted loop></video>;
                    } else {
                        content = (this.imageMap[picture.id] && this.imageMap[picture.id]) || <img draggable={false} src={encodeChar(picture.url)} />;
                        this.imageMap[picture.id] = content;
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
                                {content}
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
