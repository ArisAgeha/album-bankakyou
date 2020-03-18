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

export type picture = {
    title: string;
    url: string;
    id: string | number;
};

export interface IPictureViewState {
    viewMode: 'preview' | 'scroll_list' | 'single_page' | 'double_page';
    currentShowIndex: number;
    size: {
        preview: number;
        scroll_list: number;
        double_page: number;
    };
    pageDetail: {
        tags: string[];
        author: string[];
    };
}

export interface IPictureViewProps {
    page: page;
}

export class PictureView extends React.PureComponent<IPictureViewProps, IPictureViewState> {
    constructor(props: IPictureViewProps) {
        super(props);

        this.state = {
            viewMode: 'preview',
            currentShowIndex: 0,
            size: {
                preview: 1 / 6,
                scroll_list: 0.6,
                double_page: 1
            },
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

    handleDoubleClickPreview(e: React.MouseEvent, data: any) {
        const { currentShowIndex } = data;
        this.setState({
            currentShowIndex,
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

        const PageNumber = <h2 className={style.mainTitle}>{page.title}</h2>;

        const Buttons = (
            <div className={style.buttons}>
                <Button className={style.button} type='primary' icon={<ProfileOutlined />}>
                    {t('%scrollMode%')}
                </Button>
                <Button className={style.button} type='primary' icon={<BookOutlined />}>
                    {t('%singlePageMode%')}
                </Button>
                <Button className={style.button} type='primary' icon={<ReadOutlined />}>
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
                Album = (
                    <Preview
                        album={this.props.page.data as picture[]}
                        onDbClick={(e: React.MouseEvent, data: any) => {
                            this.handleDoubleClickPreview(e, data);
                        }}
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

    render(): JSX.Element {
        const PageDetail = this.renderPageDetail.bind(this);
        const Content = this.renderContent.bind(this);

        return (
            <div className={style.pictureViewWrapper}>
                {this.state.viewMode === 'preview' ? <PageDetail /> : ''}
                <Content />
            </div>
        );
    }
}
