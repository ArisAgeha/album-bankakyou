import * as React from 'react';
import style from './doublePage.scss';
import { page } from '../../mainView';
import { picture, ISwitchPageEvent, IPictureViewState } from '../pictureView';

type delta = 1 | 2 | -1 | -2;

interface IImgData {
    firstImgDirection: 'horizontal' | 'vertical';
    lastImgDirection: 'horizontal' | 'vertical';
    moveDirection: 'L' | 'R';
    imgFirst: string;
    imgLast: string;
}

interface IHistoryState {
    imgFirst: string;
    imgLast: string;
    shouldFirstSingleShow: boolean;
    shouldLastSingleShow: boolean;
}

export interface IDoublePageState {
    mode: 'LR' | 'RL';
    imgFirst: string;
    imgLast: string;
    zoomLevel: number;
    shouldFirstSingleShow: boolean;
    shouldLastSingleShow: boolean;
    pageReAlign: boolean;
}

export interface IDoublePageProps {
    page: page;
    currentShowIndex: number;
    onSwitchPage(e: ISwitchPageEvent): void;
}

export class DoublePage extends React.PureComponent<IDoublePageProps, IDoublePageState> {
    prevDirection: 'L' | 'R';
    lastStep: 1 | 2 | -1 | -2 | 0;
    fallback: boolean;

    constructor(props: IDoublePageProps) {
        super(props);

        this.prevDirection = 'R';
        this.lastStep = 0;
        this.fallback = false;

        this.state = {
            mode: 'RL',
            imgFirst: '',
            imgLast: '',
            zoomLevel: -1,
            shouldFirstSingleShow: false,
            shouldLastSingleShow: false,
            pageReAlign: false
        };
    }

    componentDidMount() {
        this.initImgInfo();
        this.initEvent();
    }

    initEvent() {
        document.addEventListener('keydown', this.handleKeydown);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeydown);
    }

    handleKeydown = (e: KeyboardEvent) => {
        const isSingleShow = this.state.shouldFirstSingleShow || this.state.shouldLastSingleShow;
        if (e.key === 'ArrowRight') {
            this.prevDirection = 'R';
            const delta = isSingleShow ? 1 : 2;
            this.props.onSwitchPage({ delta });
            this.resetSize();
        }
        else if (e.key === 'ArrowLeft') {
            this.prevDirection = 'L';
            const delta = this.state.shouldFirstSingleShow ? -1 : -2;
            this.props.onSwitchPage({ delta });
            this.resetSize();
        }
        else if (e.key === '+') {
            const zoomLevel = this.state.zoomLevel + 1;
            this.setState({
                zoomLevel
            });
        }
        else if (e.key === '-') {
            const zoomLevel = this.state.zoomLevel - 1;
            this.setState({
                zoomLevel
            });
        }
        else if (e.key === '0') {
            const delta = this.state.pageReAlign ? 1 : -1;
            this.setState({
                pageReAlign: !this.state.pageReAlign
            });
            this.props.onSwitchPage({ delta });
        }
        else if (e.key === '5') {
            const mode = this.state.mode === 'RL' ? 'LR' : 'RL';
            this.setState({
                mode
            });
        }
    }

    componentDidUpdate(prevProps: any, prevState: any) {
        const historyState: IHistoryState = {
            imgFirst: prevState.imgFirst,
            imgLast: prevState.imgLast,
            shouldFirstSingleShow: prevState.shouldFirstSingleShow,
            shouldLastSingleShow: prevState.shouldLastSingleShow
        };
        if (prevState.currentShowIndex !== this.props.currentShowIndex) {
            this.initImgInfo(historyState);
        }
    }

    initImgInfo = (historyState?: IHistoryState) => {
        if (this.fallback && historyState) {
            this.setState({
                shouldFirstSingleShow: historyState.shouldFirstSingleShow,
                shouldLastSingleShow: historyState.shouldLastSingleShow,
                imgFirst: historyState.imgFirst,
                imgLast: historyState.imgLast
            });
            return;
        }

        const urlFirst = (this.props.page.data as picture[])[this.props.currentShowIndex]?.url;
        const urlLast = (this.props.page.data as picture[])[this.props.currentShowIndex + 1]?.url;

        const imgFirst = new Image();
        const imgLast = new Image();
        imgFirst.src = urlFirst;
        imgLast.src = urlLast;

        let isloadCount = 0;

        const imgData: IImgData = {
            firstImgDirection: null,
            lastImgDirection: null,
            moveDirection: this.prevDirection,
            imgFirst: null,
            imgLast: null
        };

        imgFirst.onload = (ev: any) => {
            const firstImgDirection = ev.target.width > ev.target.height ? 'horizontal' : 'vertical';
            imgData.imgFirst = urlFirst;
            imgData.firstImgDirection = firstImgDirection;
            isloadCount++;
            if (isloadCount === 2) this.handleOnLoad(imgData);
        };

        imgLast.onload = (ev: any) => {
            const lastImgDirection = ev.target.width > ev.target.height ? 'horizontal' : 'vertical';
            imgData.imgLast = urlLast;
            imgData.lastImgDirection = lastImgDirection;
            isloadCount++;
            if (isloadCount === 2) this.handleOnLoad(imgData);
        };

        imgFirst.onerror = () => {
            isloadCount++;
            if (isloadCount === 2) this.handleOnLoad(imgData);
        };

        imgLast.onerror = () => {
            isloadCount++;
            if (isloadCount === 2) this.handleOnLoad(imgData);
        };
    }

    handleOnLoad(imgData: IImgData) {
        const newState = {
            imgFirst: imgData.imgFirst,
            imgLast: imgData.imgLast,
            shouldFirstSingleShow: false,
            shouldLastSingleShow: false
        };

        if (imgData.moveDirection === 'R') {
            if (imgData.firstImgDirection === 'vertical' && imgData.lastImgDirection === 'vertical') {
                newState.shouldFirstSingleShow = true;
                newState.shouldLastSingleShow = true;
            }
            else {
                newState.shouldFirstSingleShow = true;
                newState.shouldLastSingleShow = false;
            }
        }
        else {
            if (imgData.firstImgDirection === 'vertical' && imgData.lastImgDirection === 'vertical') {
                newState.shouldFirstSingleShow = true;
                newState.shouldLastSingleShow = true;
            }
            else {
                newState.shouldFirstSingleShow = false;
                newState.shouldLastSingleShow = true;
            }
        }

        this.setState(newState);
    }

    resetSize = () => {
        this.setState({
            zoomLevel: -1
        });
    }

    handleWheel = (e: React.WheelEvent) => {
        if (e.deltaY > 0) {
            if (e.ctrlKey) {
                const zoomLevel = this.state.zoomLevel - 1;
                this.setState({
                    zoomLevel
                });
            }
            else {
                let delta: delta = 1;
                if (this.prevDirection === 'L' && this.lastStep) {
                    this.fallback = true;
                    delta = (-this.lastStep as delta);
                }
                else {
                    this.fallback = false;
                    if (this.state.shouldFirstSingleShow && this.state.shouldLastSingleShow) delta = 2;
                    else if (this.state.shouldFirstSingleShow) delta = 1;
                    else if (this.state.shouldLastSingleShow) delta = 2;
                }
                this.prevDirection = 'R';
                this.lastStep = delta;
                this.props.onSwitchPage({ delta });
                this.resetSize();
            }
        }
        else if (e.deltaY < 0) {
            if (e.ctrlKey) {
                const zoomLevel = this.state.zoomLevel + 1;
                this.setState({
                    zoomLevel
                });
            }
            else {
                let delta: delta = -1;
                if (this.prevDirection === 'R' && this.lastStep) {
                    this.fallback = true;
                    delta = (-this.lastStep as delta);
                }
                else {
                    this.fallback = false;
                    if (this.state.shouldFirstSingleShow && this.state.shouldLastSingleShow) delta = -2;
                    else if (this.state.shouldLastSingleShow) delta = -2;
                    else if (this.state.shouldFirstSingleShow) delta = -1;
                }
                this.prevDirection = 'L';
                this.lastStep = delta;
                this.props.onSwitchPage({ delta });
                this.resetSize();
            }
        }
    }

    render(): JSX.Element {
        let imgLeft = this.state.imgLast;
        let imgRight = this.state.imgFirst;

        if (this.state.mode === 'LR') [imgLeft, imgRight] = [imgRight, imgLeft];

        // get scale ratio
        const zoomLevel = this.state.zoomLevel;
        let imgZoom = Math.sqrt((2 ** (zoomLevel - 1))) * 2;
        imgZoom = imgZoom <= 0 ? 0 : imgZoom;

        // if one of img's `width` > `height`, show single img.
        let singleImg = '';
        if (this.prevDirection === 'L') singleImg = this.state.imgLast ? this.state.imgLast : this.state.imgFirst;
        else singleImg = this.state.imgFirst ? this.state.imgFirst : this.state.imgLast;

        const MainContainer = <div className={style.mainContainer}>
            <img src={singleImg} alt='' />
        </div>;

        // otherwise, show double img.
        const DoublePageContainer = (
            <React.Fragment>
                <div className={style.leftContainer}>
                    <img src={imgLeft} alt='' draggable={false} />
                </div>
                <div className={style.rightContainer}>
                    <img src={imgRight} alt='' draggable={false} />
                </div>
            </React.Fragment>
        );

        return <div className={style.doublePageWrapper} onWheel={this.handleWheel}>
            <div className={style.scaleContainer} style={{ transform: `scale(${imgZoom})` }}>
                {this.state.shouldFirstSingleShow && this.state.shouldLastSingleShow ? DoublePageContainer : MainContainer}
            </div>
            <div className={style.clickModal}>
                <div className={style.left}></div>
                <div className={style.right}></div>
            </div>
        </div>;
    }
}
