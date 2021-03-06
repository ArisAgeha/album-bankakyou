import * as React from 'react';
import style from './doublePage.scss';
import { page } from '../../mainView';
import { picture, ISwitchPageEvent, IPictureViewState } from '../pictureView';
import { isVideo, encodeChar } from '@/common/utils/businessTools';
import { db } from '@/common/nedb';
import { withTranslation, WithTranslation } from 'react-i18next';
import { openNotification, hintMainText, hintText } from '@/renderer/utils/tools';
import { throttle } from '@/common/decorator/decorator';
import { SyncOutlined } from '@ant-design/icons';
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
    doublePageAlbum: DoublePicture[];
    currentShowIndex: number;
    isDragging: boolean;
    lockRatio: boolean;
    lockPosition: boolean;
}

export interface IDoublePageProps extends WithTranslation {
    page: page;
    curPage: number;
    isShow: boolean;
    isFullscreen: boolean;
}

class DoublePage extends React.PureComponent<IDoublePageProps & WithTranslation, IDoublePageState> {
    private readonly scaleContainerRef: React.RefObject<HTMLUListElement>;
    pageReAlign: boolean;
    readingDirection: 'LR' | 'RL';
    curPage: number;
    hasBeenLoadIndex: {
        [key: number]: boolean;
    };
    zoomLevel: number;
    mouseLeft: number;
    mouseTop: number;
    x: number;
    y: number;
    buffer: any[];

    constructor(props: IDoublePageProps) {
        super(props);

        this.pageReAlign = false;
        this.readingDirection = 'LR';
        this.hasBeenLoadIndex = [];
        this.curPage = this.props.curPage;
        this.scaleContainerRef = React.createRef();
        this.zoomLevel = 1;
        this.x = 0;
        this.y = 0;
        this.mouseLeft = 0;
        this.mouseTop = 0;

        this.state = {
            doublePageAlbum: [],
            currentShowIndex: 0,
            isDragging: false,
            lockRatio: false,
            lockPosition: false
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

    componentDidUpdate(prevProps: any, prevState: IDoublePageState) {
        const t = this.props.t;

        this.hintText();
        const pageNum = this.state.doublePageAlbum.length;
        const curPage = this.state.currentShowIndex;

        if (prevState.currentShowIndex === pageNum - 1 && curPage === 0) {
            if (this.readingDirection === 'LR') openNotification(t('%isLastPage%'));
            else openNotification(t('%isFirstPage%'));
        }
        else if (prevState.currentShowIndex === 0 && curPage === pageNum - 1) {
            if (this.readingDirection === 'LR') openNotification(t('%isFirstPage%'));
            else openNotification(t('%isLastPage%'));
        }

        if (prevState.lockRatio !== this.state.lockRatio) {
            openNotification(this.state.lockRatio ? t('%scaleRatioIsLock%') : t('%scaleRatioIsRelease%'), '', { closeOtherNotification: false });
        }

        if (prevState.lockPosition !== this.state.lockPosition) {
            openNotification(this.state.lockPosition ? t('%positionIsLock%') : t('%positionIsRelease%'), '', { closeOtherNotification: false });
        }

        if (prevState.currentShowIndex !== this.state.currentShowIndex) {
            this.startPreLoad();
        }
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
                try {
                    const dimension = sizeOf(url);
                    dimension.url = url;
                    imgDimensions.push(dimension);
                }
                catch (err) {
                    imgDimensions.push({
                        width: 1,
                        height: 0,
                        url
                    });
                }
            }
        }
        return imgDimensions;
    }

    resetSize = () => {
        if (!this.state.lockRatio) this.zoomLevel = 1;

        if (!this.state.lockPosition) {
            this.x = 0;
            this.y = 0;
        }

        const el = this.scaleContainerRef.current;
        el.style.transform = `translate(${this.x}px, ${this.y}px) scale(${this.zoomLevel})`;
    }

    handleKeydown = (e: KeyboardEvent) => {
        const t = this.props.t;

        if (!this.props.isShow) return;
        if (e.key === 'ArrowRight') this.gotoRightPage();
        else if (e.key === 'ArrowLeft') this.gotoLeftPage();
        else if (e.key === '+') this.zoomIn();
        else if (e.key === '-') this.zoomOut();
        else if (e.key === '*') this.setState({ lockRatio: !this.state.lockRatio });
        else if (e.key === '/') this.setState({ lockPosition: !this.state.lockPosition });
        else if (e.key === '0') {
            openNotification(t('%pageReAlign%'), t(`${this.pageReAlign ? '%no%' : '%yes%'}`));

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
            openNotification(t('%readingDirection%'), t(`${this.readingDirection === 'LR' ? '%fromLeftToRight%' : '%fromRightToLeft%'}`));

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

    isLastPage = () => this.state.currentShowIndex === this.state.doublePageAlbum.length - 1;

    isFirstPage = () => this.state.currentShowIndex === 0;

    handleWheel = (e: React.WheelEvent) => {
        const t = this.props.t;
        this.getMousePosition(e);
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
        const newZoomLevel = this.zoomLevel * Math.sqrt(2);
        this.zoom(newZoomLevel);
    }

    zoomOut = () => {
        const newZoomLevel = this.zoomLevel / Math.sqrt(2);
        this.zoom(newZoomLevel);
    }

    zoom = (newZoomLevel: number) => {
        const el = this.scaleContainerRef.current;
        const elRect = this.scaleContainerRef.current.getBoundingClientRect();
        const elHeight = elRect.height;
        const elWidth = elRect.width;

        // get scale ratio
        const xScale = (this.mouseLeft - this.x) / elWidth;
        const yScale = (this.mouseTop - this.y) / elHeight;

        // the init width/height of scaleContainer
        const initWidth = elWidth / this.zoomLevel;
        const initHeight = elHeight / this.zoomLevel;

        // the width/height of scaleContainer after zoomIn/zoomOut
        const ampWidth = initWidth * newZoomLevel;
        const ampHeight = initHeight * newZoomLevel;

        // compute translate distance
        const x = xScale * (ampWidth - elWidth);
        const y = yScale * (ampHeight - elHeight);

        el.style.transform = `translate(${this.x - x}px, ${this.y - y}px) scale(${newZoomLevel})`;

        this.x -= x;
        this.y -= y;
        this.zoomLevel = newZoomLevel;
    }

    handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 0) this.setState({ isDragging: true });
    }

    handleMouseMove = (e: React.MouseEvent) => {
        if (this.state.isDragging && e.buttons === 1) {
            const newX = this.x + e.movementX;
            const newY = this.y + e.movementY;
            this.x = newX;
            this.y = newY;

            const el = this.scaleContainerRef.current;
            el.style.transform = `translate(${this.x}px, ${this.y}px) scale(${this.zoomLevel})`;
        }
        this.getMousePosition(e);
    }

    getMousePosition = (e: React.MouseEvent | React.WheelEvent) => {
        // get the mouse position relative to scaleContainer's parent element
        const pEl = this.scaleContainerRef.current.parentElement;
        const pElRect = pEl.getBoundingClientRect();
        const pElTop = pElRect.y || 0;
        const pElLeft = pElRect.x || 0;

        this.mouseLeft = e.clientX - pElLeft;
        this.mouseTop = e.clientY - pElTop;
    }

    hintText = () => {
        hintText(this.getHintText());
    }

    getHintText = () => {
        const t = this.props.t;
        const curPage = this.state.currentShowIndex + 1;
        const totalPage = this.state.doublePageAlbum.length;

        return [
            {
                text: `/ ${t('%or%')} *`,
                color: 'rgb(255, 0, 200)',
                margin: 4
            },
            {
                text: t('锁定图片位置或缩放比例'),
                margin: 24
            },
            {
                text: t('%wheelClick%'),
                color: 'rgb(255, 0, 200)',
                margin: 4
            },
            {
                text: t('%fullscreenAndSwitchUI%'),
                margin: 24
            },
            {
                text: t('%zoomKey%'),
                color: 'rgb(255, 0, 200)',
                margin: 4
            },
            {
                text: t('%zoom%'),
                margin: 24
            },
            {
                text: t('%numberKey%') + ' 5',
                color: 'rgb(255, 0, 200)',
                margin: 4
            },
            {
                text: t('%switchReadingDirection%'),
                margin: 24
            },
            {
                text: t('%numberKey%') + ' 0',
                color: 'rgb(255, 0, 200)',
                margin: 4
            },
            {
                text: t('%reAlign%'),
                margin: 24
            },
            {
                text: `${curPage} / ${totalPage}`
            }
        ];
    }

    startPreLoad = async () => {
        const album = this.state.doublePageAlbum;
        if (album.length <= 0) return;

        const preloadLength = 3;

        const pictureUrls: string[] = [];

        const curIndex = this.state.currentShowIndex;
        const curPage = album[curIndex];
        pictureUrls.push(...curPage);

        let prevIndex = curIndex === 0 ? album.length - 1 : (curIndex - 1) % album.length;
        let nextIndex = (curIndex + 1) % album.length;

        for (let i = 0; i < preloadLength - 1; i++) {
            const nextPage = album[nextIndex];
            const prevPage = album[prevIndex];
            pictureUrls.push(...nextPage);
            pictureUrls.push(...prevPage);

            prevIndex = prevIndex === 0 ? album.length - 1 : (prevIndex - 1) % album.length;
            nextIndex = (nextIndex + 1) % album.length;
        }
        const buffer: any[] = [];
        for (const url of pictureUrls) {
            buffer.push(await this.preloadImg(url));
        }
        this.buffer = buffer;
    }

    preloadImg = (url: string) =>
        new Promise((res) => {
            const img = new Image();
            img.src = encodeChar(url);
            const onloadFunc = () => {
                res(img);
            };
            img.onload = onloadFunc;
            img.onerror = onloadFunc;
        })

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
                    {isVideo(urlLeft)
                        ? <video src={encodeChar(urlLeft)} autoPlay loop muted></video>
                        : <img src={encodeChar(urlLeft)} alt='' draggable={false} />}
                </div>
                <div className={style.rightContainer}>
                    {isVideo(urlRight)
                        ? <video src={encodeChar(urlRight)} autoPlay loop muted></video>
                        : <img src={encodeChar(urlRight)} alt='' draggable={false} />}
                </div>
            </React.Fragment>
        );
    }

    render(): JSX.Element {
        // get scale ratio
        const album = this.state.doublePageAlbum;
        const t = this.props.t;

        return (
            <div
                onMouseMove={this.handleMouseMove}
                className={`${style.doublePageWrapper} ${this.state.isDragging ? style.dragging : ''}`}
                onMouseDown={this.handleMouseDown}
                onMouseEnter={this.hintText}
                onMouseLeave={() => { hintText([{ text: t('%openSettingDesc%'), color: 'rgb(255, 0, 200)', margin: 4 }, { text: t('%openSetting%') }]); }}
                onWheel={this.handleWheel}>

                <ul className={style.scaleContainer} ref={this.scaleContainerRef}>
                    {album.map((dbpic, index) => {
                        const SinglePageContainer = this.singlePageContainer;
                        const DoublePageContainer = this.doublePageContainer;

                        const currentShowIndex = this.state.currentShowIndex;
                        const nextIndex = (currentShowIndex + 1) % album.length;
                        const prevIndex = currentShowIndex - 1 < 0 ? album.length - 1 : currentShowIndex - 1;
                        // const shouldLoad = [currentShowIndex, nextIndex, prevIndex].includes(index) || this.hasBeenLoadIndex[index];
                        const shouldLoad = [currentShowIndex].includes(index) || this.hasBeenLoadIndex[index];
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

const doublePage = withTranslation()(DoublePage);
export { doublePage as DoublePage };