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

export type zoomEvent = 'ZOOM_IN' | 'ZOOM_OUT';

export type picture = {
    title: string;
    url: string;
    id: string | number;
};

export interface IPictureViewState {
    viewMode: 'preview' | 'scroll_list' | 'single_page' | 'double_page';
    currentShowIndex: number;
    preview: {
        zoomLevel: number;
    };
    scrollList: number;
    doublePage: number;
    pageDetail: {
        tags: string[];
        author: string[];
    };
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
            currentShowIndex: 0,
            preview: {
                zoomLevel: 6
            },
            scrollList: 0.6,
            doublePage: 1,
            pageDetail: {
                tags: [],
                author: []
            }
        };

        this.initEvent();
    }

    initEvent() {
        EventHub.on(eventConstant.SWITCH_PICTURE_MODE, (mode: IPictureViewState['viewMode']) => {
            this.setState({
                viewMode: mode
            });
        });
    }

    handleClickPage(e: React.MouseEvent, data: { targetIndex: number }) {
        const { targetIndex } = data;
        this.setState({
            currentShowIndex: targetIndex,
            viewMode: 'single_page'
        });
    }

    async componentDidMount() {
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

    renderPageDetail() {
        const { t, i18n } = useTranslation();
        const page = this.props.page;
        const album: picture[] = this.props.page.data as picture[];
        const tags = this.state.pageDetail.tags;
        const author = this.state.pageDetail.author;

        const CoverBox = (
            <div className={style.coverBox}>
                <img src={album[0].url} alt='' />
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
                <Button className={style.button} type='primary' icon={<ProfileOutlined />} tabIndex={-1}>
                    {t('%scrollMode%')}
                </Button>
                <Button className={style.button} type='primary' icon={<BookOutlined />} tabIndex={-1}>
                    {t('%singlePageMode%')}
                </Button>
                <Button className={style.button} type='primary' icon={<ReadOutlined />} tabIndex={-1}>
                    {t('%doublePageMode%')}
                </Button>
            </div>
        );

        return (
            <div className={style.pageDetail}>
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

    renderContent() {
        let Album = null;

        switch (this.state.viewMode) {
            case 'preview':
                const r = Math.random();
                Album = (
                    <Preview
                        index={this.props.index}
                        album={this.props.page.data as picture[]}
                        onClickPage={(e: React.MouseEvent, data: { targetIndex: number; picture: picture }) => {
                            this.handleClickPage(e, data);
                        }}
                        zoomLevel={this.state.preview.zoomLevel}
                    />
                );
                break;

            case 'scroll_list':
                Album = <ScrollList />;
                break;

            case 'single_page':
                Album = <SinglePage />;
                break;

            case 'double_page':
                Album = <DoublePage />;
                break;

            default:
                Album = <ScrollList />;
        }

        return Album;
    }

    handleKeyDown(e: React.KeyboardEvent) {
        if (e.ctrlKey) {
            let zoom: zoomEvent = null;
            if (e.keyCode === 38) zoom = 'ZOOM_IN';
            else if (e.keyCode === 40) zoom = 'ZOOM_OUT';
            if (zoom) this.handleZoom(zoom);
        }
    }

    handleWheel(e: React.WheelEvent) {
        if (e.ctrlKey) {
            let zoom: zoomEvent = null;
            if (e.deltaY < 0) zoom = 'ZOOM_IN';
            else if (e.deltaY > 0) zoom = 'ZOOM_OUT';
            if (zoom) this.handleZoom(zoom);
        }
    }

    handleZoom(zoom: zoomEvent) {
        if (this.state.viewMode === 'preview') {
            let zoomLevel = this.state.preview.zoomLevel;
            if (zoom === 'ZOOM_OUT') zoomLevel = zoomLevel >= 11 ? 11 : zoomLevel + 1;
            else zoomLevel = zoomLevel <= 1 ? 1 : zoomLevel - 1;

            this.setState({
                preview: {
                    zoomLevel
                }
            });
        }
    }

    render(): JSX.Element {
        const PageDetail = this.renderPageDetail.bind(this);
        const Content = this.renderContent.bind(this);

        return (
            <div
                id={`pictureViewScrollWrapper${this.props.index}`}
                className={`${style.pictureViewWrapper} medium-scrollbar`}
                style={{ display: this.props.isShow ? 'block' : 'none' }}
                tabIndex={1}
                onKeyDown={this.handleKeyDown.bind(this)}
                onWheel={this.handleWheel.bind(this)}
            >
                {this.state.viewMode === 'preview' ? <PageDetail /> : ''}
                <Content />
            </div>
        );
    }
}
