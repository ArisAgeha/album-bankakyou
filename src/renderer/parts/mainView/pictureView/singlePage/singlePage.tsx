import * as React from 'react';
import style from './singlePage.scss';
import { page } from '../../mainView';
import { picture, ISwitchPageEvent } from '../pictureView';
import { isNumber } from '@/common/utils/types';
import { isVideo } from '@/common/utils/tools';

export interface ISinglePageState {
    x: number;
    y: number;
    zoomLevel: number;
    isDragging: boolean;
}

export interface ISinglePageProps {
    page: page;
    currentShowIndex: number;
    onSwitchPage(e: ISwitchPageEvent): void;
    isShow: boolean;
}

export class SinglePage extends React.PureComponent<ISinglePageProps, ISinglePageState> {
    input: string;

    constructor(props: ISinglePageProps) {
        super(props);

        this.state = {
            x: 0,
            y: 0,
            zoomLevel: -1,
            isDragging: false
        };
        this.input = '';
    }

    componentDidMount() {
        this.initEvent();
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

    resetSize = () => {
        this.setState({
            x: 0,
            y: 0,
            zoomLevel: -1
        });
    }

    handleWheel = (e: React.WheelEvent) => {
        if (e.deltaY > 0) {
            if (e.ctrlKey || e.buttons === 2) {
                const zoomLevel = this.state.zoomLevel - 1;
                this.setState({
                    zoomLevel
                });
            } else {
                this.props.onSwitchPage({ delta: 1 });
                this.resetSize();
            }
        } else if (e.deltaY < 0) {
            if (e.ctrlKey || e.buttons === 2) {
                const zoomLevel = this.state.zoomLevel + 1;
                this.setState({
                    zoomLevel
                });
            } else {
                this.props.onSwitchPage({ delta: -1 });
                this.resetSize();
            }
        }
    }

    handleKeydown = (e: KeyboardEvent) => {
        if (!this.props.isShow) return;

        if ([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].includes(Number(e.key))) {
            this.input += e.key;
        } else if (e.key === 'ArrowRight') {
            this.props.onSwitchPage({ delta: 1 });
            this.resetSize();
        } else if (e.key === 'ArrowLeft') {
            this.props.onSwitchPage({ delta: -1 });
            this.resetSize();
        } else if (e.key === 'Enter') {
            const nextPage = parseInt(this.input);
            if (!isNumber(nextPage)) return;
            this.input = '';
            this.props.onSwitchPage({ goto: nextPage });
            this.resetSize();
        } else if (e.key === '+') {
            const zoomLevel = this.state.zoomLevel + 1;
            this.setState({
                zoomLevel
            });
        } else if (e.key === '-') {
            const zoomLevel = this.state.zoomLevel - 1;
            this.setState({
                zoomLevel
            });
        }
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

    handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 0) this.setState({ isDragging: true });
    }

    render(): JSX.Element {
        const imgSrc = (this.props.page.data as picture[])[this.props.currentShowIndex].url;
        const zoomLevel = this.state.zoomLevel;
        let imgZoom = Math.sqrt(2 ** (zoomLevel - 1)) * 2;
        imgZoom = imgZoom <= 0 ? 0 : imgZoom;

        return (
            <div
                className={style.singlePageWrapper}
                style={{ cursor: this.state.isDragging ? 'grabbing' : 'default' }}
                onMouseDown={this.handleMouseDown}
                onMouseMove={this.handleMouseMove}
                onWheel={this.handleWheel}
            >
                {
                    isVideo(imgSrc)
                        ? <video src={imgSrc} loop autoPlay muted></video>
                        : (<img
                            src={imgSrc}
                            alt=''
                            draggable={false}
                            style={{ transform: `translate(${this.state.x}px, ${this.state.y}px) scale(${imgZoom})` }}
                        />)
                }
            </div>
        );
    }
}
