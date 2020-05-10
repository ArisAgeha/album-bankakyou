import * as React from 'react';
import style from './pictureView.scss';
import LazyLoad from '@arisageha/react-lazyload-fixed';
import { ScrollList } from './scrollList/scrollList';
import { Preview } from './preview/preview';
import { SinglePage } from './singlePage/singlePage';
import { DoublePage } from './doublePage/doublePage';
import { EventHub } from '@/common/eventHub';
import { eventConstant } from '@/common/constant/event.constant';
import { page } from '../mainView';
import { useTranslation, WithTranslation, withTranslation } from 'react-i18next';
import { db } from '@/common/nedb';
import { IDirectoryData } from '../../fileBar/directoryView/directoryView';
import { Button } from 'antd';
import { BarsOutlined, BookOutlined, ReadOutlined, ProfileOutlined } from '@ant-design/icons';
import { isNumber, isUndefinedOrNull } from '@/common/utils/types';
import bgimg from '@/renderer/static/image/background02.jpg';
import { isVideo, encodeChar, extractDirUrlFromKey } from '@/common/utils/businessTools';
import { ipcRenderer } from 'electron';
import { command } from '@/common/constant/command.constant';
import { openNotification } from '@/renderer/utils/tools';

export interface ISwitchPageEvent {
    delta?: number;
    goto?: number;
}

export type picture = {
    title: string;
    url: string;
    id: string | number;
};

export type viewMode = 'preview' | 'scroll' | 'single_page' | 'double_page';

export interface IPictureViewState {
    viewMode: viewMode;
    singlePageShowIndex: number;
    pageDetail: {
        tags: IDirectoryData['tag'];
        author: string[];
    };
    fullScreen: boolean;
}

export interface IPictureViewProps extends WithTranslation {
    page: page;
    isShow: boolean;
    index: number;
}

class PictureView extends React.PureComponent<IPictureViewProps & WithTranslation, IPictureViewState> {
    defaultReadingMode: 'double_page' | 'scroll' | 'single_page' = 'double_page';
    previewRef: React.RefObject<Preview>;
    scrollRef: React.RefObject<HTMLDivElement>;

    constructor(props: IPictureViewProps) {
        super(props);
        this.previewRef = React.createRef();
        this.scrollRef = React.createRef();

        this.state = {
            viewMode: 'preview',
            singlePageShowIndex: 0,
            pageDetail: {
                tags: [],
                author: []
            },
            fullScreen: false
        };
    }

    componentDidMount() {
        this.initEvent();
        this.fetchPageDetail();
        this.fetchUserHabbit();
    }

    componentWillUnmount() {
        this.removeEvent();
    }

    fetchUserHabbit = async () => {
        const urlData: any = await db.directory.findOne({ url: this.props.page.id });
        if (urlData?.readingMode) {
            this.defaultReadingMode = urlData.readingMode;
        }
    }

    async fetchPageDetail() {
        const url = this.props.page.id;
        const dir: IDirectoryData = await db.directory.findOne({ url });
        const tags = dir?.tag || [];
        const author = dir?.author || [];
        this.setState({
            pageDetail: {
                tags,
                author
            }
        });
    }

    initEvent() {
        // EventHub.on(eventConstant.SWITCH_PICTURE_MODE, this.switchPictureMode);
    }

    removeEvent() {
        // EventHub.cancel(eventConstant.SWITCH_PICTURE_MODE, this.switchPictureMode);
    }

    switchPictureMode = (mode: IPictureViewState['viewMode']) => {
        if (mode === 'double_page' && this.props.page.data.length > 200) {
            const t = this.props.t;
            openNotification(t('%openingDoublePage%'), t('%openingDoublePageHint%'), { duration: 4.5, closeOtherNotification: true });
            setTimeout(() => {
                this.setState({
                    viewMode: mode
                });
            }, 200);
        }
        else {
            this.setState({
                viewMode: mode
            });
        }
    }

    handleClickPage(e: React.MouseEvent, data: { targetIndex: number }) {
        const { targetIndex } = data;

        if (this.defaultReadingMode === 'double_page' && this.props.page.data.length > 200) {
            const t = this.props.t;
            openNotification(t('%openingDoublePage%'), t('%openingDoublePageHint%'), { duration: 4.5, closeOtherNotification: true });
            setTimeout(() => {
                this.setState({
                    singlePageShowIndex: targetIndex,
                    viewMode: this.defaultReadingMode
                });
            }, 200);
        }
        else {
            this.setState({
                singlePageShowIndex: targetIndex,
                viewMode: this.defaultReadingMode
            });
        }
    }

    setDefaultReadingMode = (val: 'scroll' | 'double_page' | 'single_page') => {
        const url = this.props.page.id;
        db.directory.update(
            { url },
            { $set: { readingMode: val } },
            { upsert: true }
        );
        this.defaultReadingMode = val;
    }

    renderPageDetail = () => {
        const { t, i18n } = useTranslation();
        const page = this.props.page;
        const album: picture[] = this.props.page.data as picture[];
        const tags = this.state.pageDetail.tags;
        const author = this.state.pageDetail.author;
        const titleI18nModel = '%multipleSources%';

        const CoverBox = (
            <div className={style.coverBox}>
                {
                    isVideo(album[0].url)
                        ? <video autoPlay draggable={false} muted loop src={encodeChar(album[0].url)}></video>
                        : <img draggable={false} src={encodeChar(album[0].url)} alt='' />
                }
            </div>
        );

        const Title = <h2 className={style.mainTitle}>{page.title === '%multipleSources%' ? t(titleI18nModel) : page.title}</h2>;

        const Tag = (
            <div className={style.group}>
                <h4 className={style.groupTitle}>{t('%tag%')}</h4>
                <div className={style.groupTag}>
                    {tags.map(tag => (
                        <div className={style.tag} key={tag}>
                            {tag}
                        </div>
                    ))}
                </div>
            </div>
        );

        const Author = (
            <div className={style.group}>
                <h4 className={style.groupTitle}>{t('%author%')}</h4>
                <div className={style.groupTag}>
                    {author.map(author => (
                        <div className={style.tag} key={author}>
                            {author}
                        </div>
                    ))}
                </div>
            </div>
        );

        const PageNumber = <h4>{`${t('%pageNumberTotal%')} ${album.length.toString()} ${t('%pageNumberPage%')}`}</h4>;

        const Buttons = (
            <div className={style.buttons}>
                <Button
                    className={style.button}
                    type='primary'
                    icon={<ProfileOutlined />}
                    tabIndex={-1}
                    onClick={() => {
                        this.setDefaultReadingMode('scroll');
                        this.switchPictureMode('scroll');
                    }}
                >
                    {t('%scrollMode%')}
                </Button>
                <Button
                    className={style.button}
                    type='primary'
                    icon={<BookOutlined />}
                    tabIndex={-1}
                    onClick={() => {
                        this.setDefaultReadingMode('single_page');
                        this.switchPictureMode('single_page');
                    }}
                >
                    {t('%singlePageMode%')}
                </Button>
                <Button
                    className={style.button}
                    type='primary'
                    icon={<ReadOutlined />}
                    tabIndex={-1}
                    onClick={() => {
                        this.setDefaultReadingMode('double_page');
                        this.switchPictureMode('double_page');
                    }}
                >
                    {t('%doublePageMode%')}
                </Button>
            </div>
        );

        return (
            <div className={style.pageDetail} style={{ opacity: this.state.viewMode === 'preview' ? 1 : 0 }}>
                <div className={style.left}>{CoverBox}</div>
                <div className={style.right}>
                    <div className={style.top}>
                        {Title}
                        {Tag}
                        {Author}
                        {PageNumber}
                    </div>
                    <div className={style.bottom}>{Buttons}</div>
                </div>
            </div>
        );
    }

    handleSwitchSinglePage: (e: ISwitchPageEvent) => void = e => {
        const nextIndex = this.calculateNextIndex(e, this.state.singlePageShowIndex);
        this.setState({
            singlePageShowIndex: nextIndex
        });
    }

    calculateNextIndex(e: ISwitchPageEvent, prevIndex: number) {
        const pageNum = this.props.page.data.length;
        let nextIndex = prevIndex;

        if (e.delta) {
            nextIndex += e.delta;
            if (nextIndex > pageNum - 1) nextIndex = 0;
            if (nextIndex < 0) nextIndex = pageNum - 1;
        } else if (isNumber(e.goto)) {
            nextIndex = e.goto;
            if (nextIndex > pageNum - 1) nextIndex = pageNum - 1;
            if (nextIndex < 0) nextIndex = 0;
        }

        return nextIndex;
    }

    renderContent = () => {
        let Album = null;

        switch (this.state.viewMode) {
            case 'scroll':
                Album = <ScrollList page={this.props.page} currentShowIndex={this.state.singlePageShowIndex} isShow={this.props.isShow} />;
                break;

            case 'single_page':
                Album = (
                    <SinglePage page={this.props.page} currentShowIndex={this.state.singlePageShowIndex} onSwitchPage={this.handleSwitchSinglePage} isShow={this.props.isShow} />
                );
                break;

            case 'double_page':
                Album = <DoublePage isFullscreen={this.state.fullScreen} curPage={this.state.singlePageShowIndex} page={this.props.page} isShow={this.props.isShow} />;
        }

        return Album;
    }

    switchFullScreen = (e: React.MouseEvent) => {
        e.preventDefault();
        if (e.button === 1) {
            const fullScreen = !this.state.fullScreen;
            ipcRenderer.send(command.TOGGLE_FULLSCREEN, !this.state.fullScreen);
            this.setState({
                fullScreen
            });
        }
    }

    exitViewer = () => {
        this.setState({
            viewMode: 'preview'
        });
    }

    handleScroll = (e: React.UIEvent) => {
        const el = this.scrollRef.current;

        if (el.scrollTop >= el.scrollHeight - el.clientHeight - 200) {
            const preview = this.previewRef.current;
            preview.appendAlbum();
        }
    }

    render(): JSX.Element {
        const PageDetail = this.renderPageDetail;
        const Content = this.renderContent;

        return (
            <div
                id={`pictureViewScrollWrapper${this.props.index}`}
                className={`${style.pictureViewWrapper} medium-scrollbar`}
                style={{ display: this.props.isShow ? 'block' : 'none' }}
                onScroll={this.handleScroll}
                ref={this.scrollRef}
            >
                <PageDetail />
                <Preview
                    ref={this.previewRef}
                    isShow={this.props.isShow && this.state.viewMode === 'preview'}
                    index={this.props.index}
                    album={this.props.page.data as picture[]}
                    onClickPage={(e: React.MouseEvent, data: { targetIndex: number; picture: picture }) => {
                        this.handleClickPage(e, data);
                    }}
                />
                {this.state.viewMode !== 'preview' && (
                    <div
                        className={style.contentWrapper}
                        style={{ position: this.state.fullScreen ? 'fixed' : 'absolute', backgroundImage: `url(${bgimg})` }}
                        onMouseDown={this.switchFullScreen}
                        onDoubleClick={this.exitViewer}
                    >
                        <Content />
                    </div>
                )}
            </div>
        );
    }
}

const pictureView = withTranslation()(PictureView);
export { pictureView as PictureView };