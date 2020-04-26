import * as React from 'react';
import style from './doublePage.scss';
import { page } from '../../mainView';
import { picture, ISwitchPageEvent, IPictureViewState } from '../pictureView';
import { isVideo, encodeChar } from '@/common/utils/businessTools';
import { db } from '@/common/nedb';
const sizeOf = require('image-size');

type dimension = {
    width: number;
    height: number;
    url: string;
    [key: string]: any;
};

type DoublePicture = string[];

export type readingDirection = 'LR' | 'RL';

export interface IDoublePageState {
    zoomLevel: number;
    doublePageAlbum: DoublePicture[];
    currentShowIndex: number;
    isDragging: boolean;
    x: number;
    y: number;
}

export interface IDoublePageProps {
    page: page;
    curPage: number;
    isShow: boolean;
}

export class DoublePage extends React.PureComponent<IDoublePageProps, IDoublePageState> {
    pageReAlign: boolean;
    readingDirection: 'LR' | 'RL';
    curPage: number;
    hasBeenLoadIndex: {
        [key: number]: boolean;
    };

    constructor(props: IDoublePageProps) {
        super(props);

        this.pageReAlign = false;
        this.readingDirection = 'LR';
        this.hasBeenLoadIndex = [];
        this.curPage = this.props.curPage;

        this.state = {
            doublePageAlbum: [],
            zoomLevel: -1,
            currentShowIndex: 0,
            isDragging: false,
            x: 0,
            y: 0
        };
    }

    async componentDidMount() {
        await this.loadUserHabbits();
        this.initImgOrVideoInfo();
        setTimeout(() => {
            this.jumpPage();
        }, 0);
        this.initEvent();
    }

    loadUserHabbits = async () => {
        const urlData: any = await db.directory.findOne({ url: this.props.page.id });
        if (urlData) {
            const { pageReAlign, readingDirection } = urlData;
            if (pageReAlign) this.pageReAlign = pageReAlign;
            if (readingDirection) this.readingDirection = readingDirection;
        }
    }

    initEvent() {
        document.addEventListener('keydown', this.handleKeydown);
        document.addEventListener('mouseup', this.stopDrag);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeydown);
        document.removeEventListener('mouseup', this.stopDrag);
    }

    stopDrag = () => {
        this.setState({
            isDragging: false
        });
    }

    jumpPage = () => {
        const curPage = this.props.curPage;
        const album = this.props.page.data as picture[];
        const url = album[curPage].url;
        const jumpIndex = this.state.doublePageAlbum.findIndex(page => page.some(picture => picture === url));
        this.setState({
            currentShowIndex: jumpIndex
        });
    }

    initImgOrVideoInfo = (options: { reverse: boolean } = { reverse: false }) => {
        const insert = (target: any[], data: any) => (this.readingDirection === 'LR' ? target.push(data) : target.unshift(data));
        const dimensions = this.getImgOrVideoDimensions();
        const album: DoublePicture[] = [];

        const shouldReAlign = this.pageReAlign;
        let hasReAlign = false;

        const pages: DoublePicture = [];
        for (const data of dimensions) {
            if (data.width > data.height) {
                if (pages.length !== 0) insert(album, [...pages]);
                insert(album, [data.url]);
                pages.length = 0;
                hasReAlign = false;
            } else {
                if (shouldReAlign && !hasReAlign) {
                    insert(album, [data.url]);
                    hasReAlign = true;
                } else if (pages.length === 0) {
                    insert(pages, data.url);
                }
                else {
                    insert(pages, data.url);
                    insert(album, [...pages]);
                    pages.length = 0;
                }
            }
        }
        if (pages.length > 0) insert(album, pages);

        const jumpIndex = options.reverse ? album.length - this.state.currentShowIndex - 1 : this.state.currentShowIndex;

        this.setState({
            doublePageAlbum: album,
            currentShowIndex: jumpIndex
        });
    }

    getImgOrVideoDimensions(): dimension[] {
        const data = this.props.page.data as picture[];
        const imgUrls = data.map(picture => picture.url);
        const imgDimensions: dimension[] = [];
        for (const url of imgUrls) {
            if (isVideo(url)) {
                imgDimensions.push({
                    width: 1,
                    height: 0,
                    url
                });
            } else {
                const dimension = sizeOf(url);
                dimension.url = url;
                imgDimensions.push(dimension);
            }
        }
        return imgDimensions;
    }

    resetSize = () => {
        this.setState({
            zoomLevel: -1,
            x: 0,
            y: 0
        });
    }

    handleKeydown = (e: KeyboardEvent) => {
        if (!this.props.isShow) return;
        if (e.key === 'ArrowRight') this.gotoRightPage();
        else if (e.key === 'ArrowLeft') this.gotoLeftPage();
        else if (e.key === '+') this.zoomIn();
        else if (e.key === '-') this.zoomOut();
        else if (e.key === '0') {
            this.pageReAlign = !this.pageReAlign;

            // save user habbit to database
            const url = this.props.page.id;
            db.directory.update(
                { url },
                { $set: { pageReAlign: this.pageReAlign } },
                { upsert: true }
            );

            this.initImgOrVideoInfo();
        }
        else if (e.key === '5') {
            this.readingDirection = this.readingDirection === 'RL' ? 'LR' : 'RL';

            // save user habbit to database
            const url = this.props.page.id;
            db.directory.update(
                { url },
                { $set: { readingDirection: this.readingDirection } },
                { upsert: true }
            );

            this.initImgOrVideoInfo({ reverse: true });
        }
    }

    handleWheel = (e: React.WheelEvent) => {
        if (e.deltaY > 0) {
            if (e.ctrlKey || e.buttons === 2) this.zoomOut();
            else this.readingDirection === 'LR' ? this.gotoRightPage() : this.gotoLeftPage();

        } else if (e.deltaY < 0) {
            if (e.ctrlKey || e.buttons === 2) this.zoomIn();
            else this.readingDirection === 'LR' ? this.gotoLeftPage() : this.gotoRightPage();
        }
    }

    gotoLeftPage = () => {
        const currentShowIndex = this.state.currentShowIndex - 1 < 0 ? this.state.doublePageAlbum.length - 1 : this.state.currentShowIndex - 1;
        this.setState({
            currentShowIndex
        });
        this.resetSize();
    }

    gotoRightPage = () => {
        const currentShowIndex = (this.state.currentShowIndex + 1) % this.state.doublePageAlbum.length;
        this.setState({
            currentShowIndex
        });
        this.resetSize();
    }

    zoomIn = () => {
        const zoomLevel = this.state.zoomLevel + 1;
        this.setState({
            zoomLevel
        });
    }

    zoomOut = () => {
        const zoomLevel = this.state.zoomLevel - 1;
        this.setState({
            zoomLevel
        });
    }

    handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 0) this.setState({ isDragging: true });
    }

    handleMouseMove = (e: React.MouseEvent) => {
        if (this.state.isDragging) {
            const newX = this.state.x + e.movementX;
            const newY = this.state.y + e.movementY;

            this.setState({
                x: newX,
                y: newY
            });
        }
    }

    singlePageContainer = (props: { url: string }): JSX.Element => (
        <div className={style.mainContainer}>
            {isVideo(props.url) ? (
                <div className={style.mainContainer}>
                    <video src={encodeChar(props.url)} autoPlay loop muted> </video>
                </div>
            ) : (
                    <div className={style.mainContainer}>
                        <img draggable={false} src={encodeChar(props.url)} alt='' />
                    </div>
                )}
        </div>
    )

    doublePageContainer = (props: { urls: string[] }): JSX.Element => {
        const urlLeft = props.urls[0];
        const urlRight = props.urls[1];

        return (
            <React.Fragment>
                <div className={style.leftContainer}>
                    {isVideo(urlLeft) ? <video src={encodeChar(urlLeft)} autoPlay loop muted></video> : <img src={encodeChar(urlLeft)} alt='' draggable={false} />}
                </div>
                <div className={style.rightContainer}>
                    {isVideo(urlRight) ? <video src={encodeChar(urlRight)} autoPlay loop muted></video> : <img src={encodeChar(urlRight)} alt='' draggable={false} />}
                </div>
            </React.Fragment>
        );
    }

    render(): JSX.Element {
        // get scale ratio
        const zoomLevel = this.state.zoomLevel;
        let imgZoom = Math.sqrt(2 ** (zoomLevel - 1)) * 2;
        imgZoom = imgZoom <= 0 ? 0 : imgZoom;
        const album = this.state.doublePageAlbum;

        return (
            <div
                onMouseMove={this.handleMouseMove}
                className={style.doublePageWrapper}
                onMouseDown={this.handleMouseDown}
                onWheel={this.handleWheel}>
                <ul className={style.scaleContainer} style={{ transform: `translate(${this.state.x}px, ${this.state.y}px) scale(${imgZoom})` }}>
                    {album.map((dbpic, index) => {
                        const SinglePageContainer = this.singlePageContainer;
                        const DoublePageContainer = this.doublePageContainer;

                        const currentShowIndex = this.state.currentShowIndex;
                        const nextIndex = (currentShowIndex + 1) % album.length;
                        const prevIndex = currentShowIndex - 1 < 0 ? album.length - 1 : currentShowIndex - 1;
                        const shouldLoad = [currentShowIndex, nextIndex, prevIndex].includes(index) || this.hasBeenLoadIndex[index];
                        if (shouldLoad) this.hasBeenLoadIndex[index] = true;
                        const shouldShow = index === currentShowIndex;

                        return (
                            <li key={dbpic[0]} className={`${style.imgContainer} ${shouldShow ? '' : style.isHidden}`}>
                                {dbpic.length === 1 ? (
                                    shouldLoad ? (
                                        <SinglePageContainer url={dbpic[0]} />
                                    ) : (
                                            ''
                                        )
                                ) : shouldLoad ? (
                                    <DoublePageContainer urls={dbpic} />
                                ) : (
                                            ''
                                        )}
                            </li>
                        );
                    })}
                    {/* {currentPage && (currentPage.length === 1 ? <SinglePageContainer url={currentPage[0]} /> : <DoublePageContainer urls={currentPage} />)} */}
                </ul>
                <div className={style.clickModal}>
                    <div className={style.left}></div>
                    <div className={style.right}></div>
                </div>
            </div>
        );
    }
}
