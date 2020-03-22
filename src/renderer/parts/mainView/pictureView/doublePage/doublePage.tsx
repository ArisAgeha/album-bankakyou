import * as React from 'react';
import style from './doublePage.scss';
import { page } from '../../mainView';
import { picture, ISwitchPageEvent } from '../pictureView';

export interface IDoublePageState {
    mode: 'LR' | 'RL';
    imgFirst: string;
    imgLast: string;
    zoomLevel: number;
    shouldFirstSingleShow: boolean;
    shouldLastSingleShow: boolean;
}

export interface IDoublePageProps {
    page: page;
    currentShowIndex: number;
    onSwitchPage(e: ISwitchPageEvent): void;
}

export class DoublePage extends React.PureComponent<IDoublePageProps, IDoublePageState> {
    constructor(props: IDoublePageProps) {
        super(props);

        this.state = {
            mode: 'RL',
            imgFirst: '',
            imgLast: '',
            zoomLevel: -1,
            shouldFirstSingleShow: false,
            shouldLastSingleShow: false
        };
    }

    componentDidMount() {
        this.initImgInfo();
    }

    componentDidUpdate(prev: any) {
        if (prev.currentShowIndex !== this.props.currentShowIndex) {
            console.log(prev);
            this.initImgInfo();
        }
    }

    initImgInfo = () => {
        const urlFirst = (this.props.page.data as picture[])[this.props.currentShowIndex]?.url;
        const urlLast = (this.props.page.data as picture[])[this.props.currentShowIndex + 1]?.url;

        const imgFirst = new Image();
        const imgLast = new Image();
        imgFirst.src = urlFirst;
        imgLast.src = urlLast;

        imgFirst.onload = (ev: any) => {
            const shouldFirstSingleShow = (ev.target.width > ev.target.height) || (this.props.currentShowIndex + 1 >= this.props.page.data.length);

            this.setState({
                imgFirst: urlFirst,
                shouldFirstSingleShow
            });
        };

        imgLast.onload = (ev: any) => {
            const shouldLastSingleShow = (ev.target.width > ev.target.height) || (this.props.currentShowIndex + 1 >= this.props.page.data.length);

            this.setState({
                imgLast: urlLast,
                shouldLastSingleShow
            });
        };
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
                const delta = this.state.shouldFirstSingleShow || this.state.shouldLastSingleShow ? 1 : 2;
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
                const delta = this.state.shouldFirstSingleShow || this.state.shouldLastSingleShow ? -1 : -2;
                this.props.onSwitchPage({ delta });
                this.resetSize();
            }
        }
    }

    handleKeydown = (e: React.KeyboardEvent) => {
        const isSingleShow = this.state.shouldFirstSingleShow || this.state.shouldLastSingleShow;
        if (e.key === 'ArrowRight') {
            const delta = isSingleShow ? 1 : 2;
            this.props.onSwitchPage({ delta });
            this.resetSize();
        }
        else if (e.key === 'ArrowLeft') {
            const delta = isSingleShow ? -1 : -2;
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
        const MainContainer = <div className={style.mainContainer}>
            <img src={this.state.imgFirst} alt='' />
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

        return <div className={style.doublePageWrapper}
            onWheel={this.handleWheel}
            onKeyDown={this.handleKeydown}
            tabIndex={4}
        >
            <div className={style.scaleContainer} style={{ transform: `scale(${imgZoom})` }}>
                {this.state.shouldFirstSingleShow || this.state.shouldLastSingleShow ? MainContainer : DoublePageContainer}
            </div>
            <div className={style.clickModal}>
                <div className={style.left}></div>
                <div className={style.right}></div>
            </div>
        </div>;
    }
}
