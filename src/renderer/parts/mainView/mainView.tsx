import * as React from 'react';
import { album, GalleryView } from './galleryView/galleryView';
import { picture, PictureView } from './pictureView/pictureView';
import { CloseOutlined } from '@ant-design/icons';
import style from './mainView.scss';
import { EventHub } from '@/common/eventHub';
import { eventConstant } from '@/common/constant/event.constant';
import { ServiceCollection } from '@/common/serviceCollection';
import { remote, ipcRenderer } from 'electron';
import { serviceConstant } from '@/common/constant/service.constant';
import { FileService } from '@/main/services/file.service';
import { extractDirNameFromUrl } from '@/common/utils/tools';
import { command } from '@/common/constant/command.constant';
import { isUndefinedOrNull, isObject } from '@/common/utils/types';
import { useTranslation } from 'react-i18next';

export interface IMainViewProps { }

export interface IMainViewState {
    pages: page[];
    currentPage: page['id'];
}

export type page = {
    id: string;
    title: string;
    type: 'gallery' | 'picture';
    data: album[] | picture[];
};

export type LoadPictureRequest = {
    id: string;
    urls: string[];
    title: string;
    recursiveDepth?: number;
};

export class MainView extends React.PureComponent<IMainViewProps, IMainViewState> {
    private readonly tabRef: React.RefObject<HTMLDivElement>;

    constructor(props: IMainViewProps) {
        super(props);

        this.tabRef = React.createRef();
        this.state = {
            pages: [],
            currentPage: null
        };
    }

    componentDidMount() {
        this.initIpc();
        this.initEvent();
    }

    initIpc() {
        ipcRenderer.on(command.RECEIVE_PICTURE, (event, page: page) => {
            if (page.data.length === 0) return;

            console.log(page);
            let newPages;
            const targetPage = this.state.pages.find(p => p.id === page.id);
            if (targetPage) {
                newPages = this.state.pages;
                targetPage.data = (targetPage.data as picture[]).concat(page.data as picture[]);
            }
            else {
                newPages = [...this.state.pages, page];

                this.setState({
                    pages: newPages,
                    currentPage: page.id
                });
            }
        });
    }

    initEvent() {
        EventHub.on(eventConstant.LOAD_PICTURE_BY_SELECT_DIR, this.loadPictureBySelectSingleDir);
        window.addEventListener('keydown', this.handleKeyDown);
    }

    componentWillUnmount() {
        EventHub.cancel(eventConstant.LOAD_PICTURE_BY_SELECT_DIR, this.loadPictureBySelectSingleDir);
        window.removeEventListener('keydown', this.handleKeyDown);
    }

    loadPictureBySelectSingleDir = (data: { url: string; type: 'NEW' | 'REPLACE' }) => {
        const { url, type } = data;
        if (type === 'NEW') {
            const targetPage = this.state.pages.find(pageInState => pageInState.id === url);
            if (isObject(targetPage)) {
                this.setState({
                    currentPage: targetPage.id
                });
                return;
            }

            const newTabData: LoadPictureRequest = {
                id: url,
                urls: [url],
                title: extractDirNameFromUrl(url)
            };

            ipcRenderer.send(command.SELECT_DIR_IN_TREE, newTabData);
        }
    }

    loadPictureBySelectMultipleDir = (urls: string[]) => {
        const newTabData: LoadPictureRequest = {
            id: Math.random().toString().slice(2),
            urls,
            title: '%multipleSources%',
            recursiveDepth: 10
        };
        ipcRenderer.send(command.SELECT_DIR_IN_TREE, newTabData);
    }

    handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Tab' && e.ctrlKey) {
            if (!this.state.currentPage) return;
            const currentPageIndex = this.state.pages.findIndex(page => page.id === this.state.currentPage);
            const nextPageIndex = currentPageIndex >= this.state.pages.length - 1 ? 0 : currentPageIndex + 1;
            const nextPageId = this.state.pages[nextPageIndex].id;
            this.switchToTab(nextPageId);
        }

        if (e.ctrlKey && e.key.toLowerCase() === 'w') {
            if (!this.state.currentPage) return;
            this.closeTab(this.state.currentPage);
        }
    }

    switchToTab(id: string) {
        this.setState({ currentPage: id });
    }

    closeTab(id: string, event?: React.MouseEvent) {
        if (event) event.stopPropagation();

        let currentPage = this.state.currentPage;
        const closeIndex = this.state.pages.findIndex(page => page.id === id);
        if (this.state.pages[closeIndex].id === currentPage) {
            if (this.state.pages.length === 1) currentPage = null;
            else if (this.state.pages.length > 1 && closeIndex >= 1) currentPage = this.state.pages[closeIndex - 1].id;
            else currentPage = this.state.pages[closeIndex + 1].id;
        }

        const newPages = [...this.state.pages];
        newPages.splice(closeIndex, 1);

        this.setState({
            pages: newPages,
            currentPage
        });
    }

    handleWheelMoveOnTabBar = (event: React.WheelEvent) => {
        this.tabRef.current.scrollLeft += event.deltaY;
    }

    handleMouseUp(e: React.MouseEvent, id: string) {
        e.preventDefault();
        if (e.button === 1) this.closeTab(id, e);
    }

    handleDrop = (e: React.DragEvent) => {
        const urls = e.dataTransfer.getData('urls').split('?|?');
        this.loadPictureBySelectMultipleDir(urls);
    }

    handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        const dt = e.dataTransfer;
        dt.dropEffect = 'copy';
    }

    renderTab = (props: { page: page }) => {
        const { page } = props;
        const { t } = useTranslation();
        const isSelected = this.state.currentPage === page.id;
        const titleI18nModel = '%multipleSources%';

        return (
            <div
                onClick={() => this.switchToTab(page.id)}
                onWheel={this.handleWheelMoveOnTabBar}
                className={`${style.tabsItem} ${isSelected ? style.isSelected : ''}`}
                key={page.id}
                onMouseUp={(e: React.MouseEvent) => {
                    this.handleMouseUp(e, page.id);
                }}
            >
                <div className={`${style.left} text-ellipsis-1`}>{page.title === '%multipleSources%' ? t(titleI18nModel) : page.title}</div>
                <div className={style.right} onClick={e => this.closeTab(page.id, e)}>
                    <div className={style.closeWrapper}>
                        <CloseOutlined />
                    </div>
                </div>
            </div>
        );
    }

    render(): JSX.Element {
        const Tab = this.renderTab;
        const currentPageId = this.state.pages.find(page => page.id === this.state.currentPage)?.id;

        const pages = this.state.pages;

        const Pages = pages.map(
            (page, index) =>
                page?.data &&
                (page?.type === 'gallery' ? (
                    <GalleryView />
                ) : (
                        <PictureView key={page.id} page={page} isShow={currentPageId === page.id} index={index} />
                    ))
        );

        return (
            <div className={`${style.mainView}`} onDrop={this.handleDrop} onDragOver={this.handleDragOver}>
                <div className={`${style.tabsWrapper} no-scrollbar`} ref={this.tabRef} style={{ display: this.state.pages.length > 0 ? 'flex' : 'none' }}>
                    {this.state.pages.map(page => <Tab key={page.id} page={page} />)}
                </div>
                <div className={`${style.displayArea}`}> {Pages}</div>
            </div>
        );
    }
}
