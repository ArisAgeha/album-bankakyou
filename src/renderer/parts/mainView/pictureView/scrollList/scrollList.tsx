import * as React from 'react';
import style from './scrollList.scss';
import { page } from '../../mainView';
import { picture } from '../pictureView';
import LazyLoad from '@arisageha/react-lazyload-fixed';
import * as ReactDOM from 'react-dom';
import { encodeChar, isVideo } from '@/common/utils/businessTools';
import { db } from '@/common/nedb';
import { withTranslation, WithTranslation } from 'react-i18next';
import { openNotification } from '@/renderer/utils/tools';

export type scrollModeDirection = 'TB' | 'BT' | 'LR' | 'RL';

export interface IScrollListState {
    scrollModeDirection: scrollModeDirection;
    isDragging: boolean;
}

export interface IScrollListProps extends WithTranslation {
    page: page;
    currentShowIndex: number;
    isShow: boolean;
}

class ScrollList extends React.PureComponent<IScrollListProps & WithTranslation, IScrollListState> {
    private readonly scrollListRef: React.RefObject<HTMLDivElement>;
    private readonly scaleContainerRef: React.RefObject<HTMLDivElement>;
    private lastDirection: scrollModeDirection = 'LR';

    zoomLevel: number;
    mouseLeft: number;
    mouseTop: number;
    x: number;
    y: number;

    constructor(props: IScrollListProps) {
        super(props);
        this.scrollListRef = React.createRef();
        this.scaleContainerRef = React.createRef();

        this.mouseLeft = 0;
        this.mouseTop = 0;
        this.zoomLevel = 1;
        this.x = 0;
        this.y = 0;

        this.state = {
            scrollModeDirection: 'LR',
            isDragging: false
        };
    }

    async componentDidMount() {
        this.initEvent();
        const urlData: any = await db.directory.findOne({ url: this.props.page.id });
        const scrollModeDirection = urlData?.scrollModeDirection || 'LR';

        this.setState({
            scrollModeDirection,
            isDragging: false
        });
    }

    componentWillUnmount() {
        this.removeEvent();
    }

    componentDidUpdate() {
        const el = this.scrollListRef.current;
        if (this.state.scrollModeDirection !== this.lastDirection) {
            if (this.state.scrollModeDirection === 'RL') el.scrollLeft = el.scrollWidth;
            else if (this.state.scrollModeDirection === 'LR') el.scrollLeft = 0;
            else if (this.state.scrollModeDirection === 'TB') el.scrollTop = 0;
            else if (this.state.scrollModeDirection === 'BT') el.scrollTop = el.scrollHeight;

            this.lastDirection = this.state.scrollModeDirection;
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
        let scrollModeDirection: scrollModeDirection = this.state.scrollModeDirection;

        if (['2', '4', '6', '8'].includes(e.key)) {
            if (e.key === '2') {
                openNotification(this.props.t('%scrollModeDirection%'), this.props.t('%fromTopToBottom%'));
                scrollModeDirection = 'TB';
            }
            else if (e.key === '8') {
                openNotification(this.props.t('%scrollModeDirection%'), this.props.t('%fromBottomToTop%'));
                scrollModeDirection = 'BT';
            }
            else if (e.key === '4') {
                openNotification(this.props.t('%scrollModeDirection%'), this.props.t('%fromRightToLeft%'));
                scrollModeDirection = 'RL';
            }
            else if (e.key === '6') {
                openNotification(this.props.t('%scrollModeDirection%'), this.props.t('%fromLeftToRight%'));
                scrollModeDirection = 'LR';
            }

            db.directory.update(
                { url: this.props.page.id },
                { $set: { scrollModeDirection } },
                { upsert: true }
            );
        }
        else if (e.key === '+') this.zoomIn();
        else if (e.key === '-') this.zoomOut();

        if (this.state.scrollModeDirection !== scrollModeDirection) {
            this.resetSize();
        }

        this.setState({ scrollModeDirection });
    }

    resetSize = () => {
        this.x = 0;
        this.y = 0;
        this.zoomLevel = 1;
        const el = this.scaleContainerRef.current;
        el.style.transform = `translate(${this.x}px, ${this.y}px) scale(${this.zoomLevel})`;
    }

    handleWheel = (e: WheelEvent) => {
        e.preventDefault();

        this.getMousePosition(e);

        if (e.ctrlKey || e.buttons === 2) {
            if (e.deltaY < 0) this.zoomIn();
            else if (e.deltaY > 0) this.zoomOut();
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

    handleMouseMove = (e: React.MouseEvent) => {
        if (this.state.isDragging) {
            this.scrollListRef.current.scrollTop -= e.movementY * 5;
            this.scrollListRef.current.scrollLeft -= e.movementX * 5;
        }
        this.getMousePosition(e);
    }

    getMousePosition = (e: React.MouseEvent | WheelEvent) => {
        // get the mouse position relative to scaleContainer's parent element
        const pEl = this.scaleContainerRef.current.parentElement;
        const pElRect = pEl.getBoundingClientRect();
        const pElTop = pElRect.y || 0;
        const pElLeft = pElRect.x || 0;

        this.mouseLeft = e.clientX + pEl.scrollLeft - pElLeft;
        this.mouseTop = e.clientY + pEl.scrollTop - pElTop;
    }

    getViewerStyle(): React.CSSProperties {
        const scrollModeDirection = this.state.scrollModeDirection;
        const flexDirection = scrollModeDirection === 'TB' ? 'column' : scrollModeDirection === 'BT' ? 'column-reverse' : scrollModeDirection === 'LR' ? 'row' : 'row-reverse';
        return this.isVertical()
            ? { width: '100%', justifyContent: 'center', flexDirection }
            : { height: '100%', whiteSpace: 'nowrap', flexDirection, justifyContent: scrollModeDirection === 'LR' ? 'flex-start' : 'flex-end' };
    }

    getImgStyle(): React.CSSProperties {
        return this.isVertical() ? { maxWidth: '100%', alignSelf: 'center' } : { maxHeight: '100%' };
    }

    getImgBoxStyle(): React.CSSProperties {
        return this.isVertical() ? { display: 'block' } : { display: 'inline-block', height: '100%' };
    }

    render(): JSX.Element {
        const album = this.props.page.data as picture[];
        const placeholder = <span style={{ display: this.isVertical ? 'block' : 'inline-block', minWidth: '120px', minHeight: '120px' }}></span>;

        const viewerStyle = this.getViewerStyle();
        const imgStyle = this.getImgStyle();
        const imgBoxStyle = this.getImgBoxStyle();

        const Album = album.map(picture =>
            <LazyLoad scrollContainer={`#scrollListContainer`} overflow offset={150} placeholder={placeholder} once key={picture.id} throttle={300}>
                <div className={style.imgBox} style={imgBoxStyle}>
                    {
                        isVideo(picture.url) ?
                            <video src={encodeChar(picture.url)} muted loop autoPlay></video>
                            : <img draggable={false} src={encodeChar(picture.url)} alt='' style={imgStyle} />
                    }
                </div>

            </LazyLoad>
        );

        return <div
            ref={this.scrollListRef}
            className={`${style.scrollListWrapper} large-scrollbar`}
            onMouseDown={(e: React.MouseEvent) => { this.setState({ isDragging: true }); }}
            onMouseMove={this.handleMouseMove}
            style={{ cursor: this.state.isDragging ? 'grabbing' : 'default' }}
            id={`scrollListContainer`}>
            <div className={style.scaleContainer} ref={this.scaleContainerRef}>
                <div className={style.scrollListViewer} style={viewerStyle}>
                    {Album}
                </div>
            </div>
        </div>;
    }

    isHorizontal() {
        return ['LR', 'RL'].includes(this.state.scrollModeDirection);
    }

    isVertical() {
        return ['TB', 'BT'].includes(this.state.scrollModeDirection);
    }

    isReverse() {
        return ['BT', 'RL'].includes(this.state.scrollModeDirection);
    }
}

const scrollList = withTranslation()(ScrollList);
export { scrollList as ScrollList };