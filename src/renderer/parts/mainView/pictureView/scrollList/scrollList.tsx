import * as React from 'react';
import style from './scrollList.scss';
import { page } from '../../mainView';
import { picture } from '../pictureView';
import LazyLoad from 'react-lazyload';
import { PictureFilled } from '@ant-design/icons';
import * as ReactDOM from 'react-dom';

export type mode = 'TB' | 'BT' | 'LR' | 'RL';

export interface IScrollListState {
    zoomLevel: number;
    mode: mode;
    isDragging: boolean;
}

export interface IScrollListProps {
    page: page;
    currentShowIndex: number;
    isShow: boolean;
}

export class ScrollList extends React.PureComponent<IScrollListProps, IScrollListState> {
    private readonly scrollListRef: React.RefObject<HTMLDivElement>;
    private lastDirection: mode = 'LR';

    constructor(props: IScrollListProps) {
        super(props);
        this.scrollListRef = React.createRef();

        this.state = {
            zoomLevel: 100,
            mode: 'LR',
            isDragging: false
        };
    }

    componentDidMount() {
        this.initEvent();
    }

    componentWillUnmount() {
        this.removeEvent();
    }

    componentDidUpdate() {
        const el = this.scrollListRef.current;
        if (this.state.mode !== this.lastDirection) {
            if (this.state.mode === 'RL') el.scrollLeft = el.scrollWidth;
            else if (this.state.mode === 'LR') el.scrollLeft = 0;
            else if (this.state.mode === 'TB') el.scrollTop = 0;
            else if (this.state.mode === 'BT') el.scrollTop = el.scrollHeight;

            this.lastDirection = this.state.mode;
        }
    }

    initEvent() {
        document.addEventListener('keydown', this.handleKeydown);
        document.addEventListener('mouseup', this.stopDrag);
        this.scrollListRef.current.addEventListener('wheel', this.handleWheel, { passive: false });
    }

    stopDrag = () => {
        this.setState({
            isDragging: false
        });
    }

    removeEvent() {
        document.removeEventListener('keydown', this.handleKeydown);
        document.removeEventListener('mouseup', this.stopDrag);
        this.scrollListRef.current.removeEventListener('wheel', this.handleWheel);
    }

    handleKeydown = (e: KeyboardEvent) => {
        if (!this.props.isShow) return;
        let mode: mode = this.state.mode;
        let zoomLevel = this.state.zoomLevel;

        if (e.key === '2') mode = 'TB';
        if (e.key === '8') mode = 'BT';
        if (e.key === '4') mode = 'RL';
        if (e.key === '6') mode = 'LR';
        if (e.key === '+') zoomLevel *= Math.sqrt(2);
        if (e.key === '-') zoomLevel /= Math.sqrt(2);

        this.setState({ mode, zoomLevel });
    }

    handleWheel = (e: WheelEvent) => {
        e.preventDefault();

        let zoomLevel = this.state.zoomLevel;

        if (e.ctrlKey || e.buttons === 2) {
            if (e.deltaY < 0) zoomLevel *= Math.sqrt(2);
            else if (e.deltaY > 0) zoomLevel /= Math.sqrt(2);
            this.setState({ zoomLevel });
        }
        else {
            if (this.isHorizontal()) {
                e.shiftKey ?
                    this.scrollListRef.current.scrollTop += e.deltaY
                    : this.scrollListRef.current.scrollLeft += e.deltaY;
            }
            else {
                e.shiftKey
                    ? this.scrollListRef.current.scrollLeft += e.deltaY
                    : this.scrollListRef.current.scrollTop += e.deltaY;
            }
        }
    }

    handleDrag = (e: React.MouseEvent) => {
        if (!this.state.isDragging) return;

        this.scrollListRef.current.scrollTop -= e.movementY * 5;
        this.scrollListRef.current.scrollLeft -= e.movementX * 5;
    }

    getScaleContainerStyle(): React.CSSProperties {
        const albumSize = `${this.state.zoomLevel}%`;
        return this.isVertical() ? { width: albumSize } : { height: albumSize };
    }

    getViewerStyle(): React.CSSProperties {
        const mode = this.state.mode;
        const flexDirection = mode === 'TB' ? 'column' : mode === 'BT' ? 'column-reverse' : mode === 'LR' ? 'row' : 'row-reverse';
        return this.isVertical()
            ? { width: '100%', justifyContent: 'center', flexDirection }
            : { height: '100%', whiteSpace: 'nowrap', flexDirection, justifyContent: mode === 'LR' ? 'flex-start' : 'flex-end' };
    }

    getImgStyle(): React.CSSProperties {
        return this.isVertical() ? { maxWidth: '100%', alignSelf: 'center' } : { maxHeight: '100%', alignSelf: 'flex-end' };
    }

    render(): JSX.Element {
        const album = this.props.page.data as picture[];
        const placeholder = <span style={{ display: 'inline-block', minWidth: '120px', minHeight: '120px' }}></span>;

        const scaleContainerStyle = this.getScaleContainerStyle();
        const viewerStyle = this.getViewerStyle();
        const imgStyle = this.getImgStyle();

        const Album = album.map(picture =>
            <LazyLoad scrollContainer={`#scrollListContainer`} overflow offset={150} placeholder={placeholder} once key={picture.id}>
                <img draggable={false} src={picture.url} alt='' style={imgStyle} />
            </LazyLoad>
        );

        return <div
            ref={this.scrollListRef}
            className={`${style.scrollListWrapper} large-scrollbar`}
            onMouseDown={(e: React.MouseEvent) => { this.setState({ isDragging: true }); }}
            onMouseMove={this.handleDrag}
            style={{ cursor: this.state.isDragging ? 'grabbing' : 'default' }}
            id={`scrollListContainer`}>
            <div className={style.scaleContainer} style={scaleContainerStyle}>
                <div className={style.scrollListViewer} style={viewerStyle}>
                    {Album}
                </div>
            </div>
        </div>;
    }

    isHorizontal() {
        return ['LR', 'RL'].includes(this.state.mode);
    }

    isVertical() {
        return ['TB', 'BT'].includes(this.state.mode);
    }

    isReverse() {
        return ['BT', 'RL'].includes(this.state.mode);
    }
}
