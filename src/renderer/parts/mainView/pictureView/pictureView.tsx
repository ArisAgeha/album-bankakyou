import * as React from 'react';
import style from './pictureView.scss';
import LazyLoad from 'react-lazyload';
import { ScrollList } from './scrollList/scrollList';
import { Preview } from './preview/preview';
import { SinglePage } from './singlePage/singlePage';
import { DoublePage } from './doublePage/doublePage';
import { EventHub } from '@/common/eventHub';
import { eventConstant } from '@/common/constant/event.constant';
import { page } from '../mainView';
import { useTranslation } from 'react-i18next';
import { db } from '@/common/nedb';
import { IDirectoryData } from '../../fileBar/directoryView/directoryView';
import { Button } from 'antd';
import { BarsOutlined, BookOutlined, ReadOutlined, ProfileOutlined } from '@ant-design/icons';
import { isNumber, isUndefinedOrNull } from '@/common/utils/types';
import bgimg from '@/renderer/static/image/background02.jpg';
import { isVideo } from '@/common/utils/tools';

export interface ISwitchPageEvent {
    delta?: number;
    goto?: number;
}

export type picture = {
    title: string;
    url: string;
    id: string | number;
};

export interface IPictureViewState {
    viewMode: 'preview' | 'scroll_list' | 'single_page' | 'double_page';
    singlePageShowIndex: number;
    doublePageShowIndex: number;
    scrollList: number;
    doublePage: number;
    pageDetail: {
        tags: string[];
        author: string[];
    };
    fullScreen: boolean;
}

export interface IPictureViewProps {
    page: page;
    isShow: boolean;
    index: number;
}

export class PictureView extends React.PureComponent<IPictureViewProps, IPictureViewState> {
    constructor(props: IPictureViewProps) {
        super(props);

        this.state = {
            viewMode: 'preview',
            singlePageShowIndex: 0,
            doublePageShowIndex: 0,
            scrollList: 0.6,
            doublePage: 1,
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
    }

    componentWillUnmount() {
        this.removeEvent();
    }

    async fetchPageDetail() {
        const url = this.props.page.id;
        const dir: IDirectoryData = await db.directory.findOne({ url });
        const tags = dir?.tags || ['test', 'aaa', 'bbb', 'ddd', 'eee', 'fff', 'gggggggggg', 'wefewfewfwef', 'dfdsfsdfdsf', 'dsfdsfsdfsdfsdfds'];
        const author = dir?.author || ['test', 'aaa', 'bbb', 'ddd'];
        this.setState({
            pageDetail: {
                tags,
                author
            }
        });
    }

    initEvent() {
        EventHub.on(eventConstant.SWITCH_PICTURE_MODE, this.switchPictureMode);
    }

    removeEvent() {
        EventHub.cancel(eventConstant.SWITCH_PICTURE_MODE, this.switchPictureMode);
    }

    switchPictureMode = (mode: IPictureViewState['viewMode']) => {
        this.setState({
            viewMode: mode
        });
    }

    handleClickPage(e: React.MouseEvent, data: { targetIndex: number }) {
        const { targetIndex } = data;
        this.setState({
            singlePageShowIndex: targetIndex,
            viewMode: 'double_page'
        });
    }

    renderPageDetail = () => {
        const { t, i18n } = useTranslation();
        const page = this.props.page;
        const album: picture[] = this.props.page.data as picture[];
        const tags = this.state.pageDetail.tags;
        const author = this.state.pageDetail.author;

        const CoverBox = (
            <div className={style.coverBox}>
                {
                    isVideo(album[0].url)
                        ? <video autoPlay draggable={false} muted loop src={album[0].url}></video>
                        : <img draggable={false} src={album[0].url} alt='' />
                }
            </div>
        );

        const Title = <h2 className={style.mainTitle}>{page.title}</h2>;

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
                        this.switchPictureMode('scroll_list');
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
            case 'scroll_list':
                Album = <ScrollList page={this.props.page} currentShowIndex={this.state.singlePageShowIndex} isShow={this.props.isShow} />;
                break;

            case 'single_page':
                Album = (
                    <SinglePage page={this.props.page} currentShowIndex={this.state.singlePageShowIndex} onSwitchPage={this.handleSwitchSinglePage} isShow={this.props.isShow} />
                );
                break;

            case 'double_page':
                Album = <DoublePage curPage={this.state.singlePageShowIndex} page={this.props.page} isShow={this.props.isShow} />;
        }

        return Album;
    }

    switchFullScreen = (e: React.MouseEvent) => {
        e.preventDefault();
        if (e.button === 1) {
            const fullScreen = !this.state.fullScreen;
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

    render(): JSX.Element {
        const PageDetail = this.renderPageDetail;
        const Content = this.renderContent;

        return (
            <div
                id={`pictureViewScrollWrapper${this.props.index}`}
                className={`${style.pictureViewWrapper} medium-scrollbar`}
                style={{ display: this.props.isShow ? 'block' : 'none' }}
            >
                <PageDetail />
                <Preview
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
