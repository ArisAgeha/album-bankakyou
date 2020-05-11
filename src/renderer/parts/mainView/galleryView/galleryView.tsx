import * as React from 'react';
import style from './galleryView.scss';
import { page } from '../mainView';
import { FileService } from '@/main/services/file.service';
import { ServiceCollection } from '@/common/serviceCollection';
import { remote } from 'electron';
import { serviceConstant } from '@/common/constant/service.constant';
import { isVideo, encodeChar } from '@/common/utils/businessTools';
import { EventHub } from '@/common/eventHub';
import { eventConstant } from '@/common/constant/event.constant';
import { naturalCompare, isSubArray } from '@/common/utils/functionTools';
import { useTranslation, WithTranslation, withTranslation } from 'react-i18next';
import { SortAscendingOutlined, SortDescendingOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { throttle } from '@/common/decorator/decorator';
import 'reflect-metadata';
import { Select } from '@/renderer/components/select/select';
import { hintMainText } from '@/renderer/utils/tools';
import { zoomEvent } from '../pictureView/preview/preview';
const { Option } = Select;

export type album = {
    id: string;
    url: any;
    title: string;
    authors: string[];
    tags: string[];
    cover?: string;
};

export interface IGalleryViewState {
    gallery: album[];
    searchWord: string;
    sortMode: SortMode;
    filterAuthor: string[];
    filterTag: string[];
    zoomLevel: number;
    selectedIndexs: number[];
    lastSelectedIndex: number;
    lastSelectedIndexs: number[];
}

export interface IGalleryViewProps extends WithTranslation {
    page: page;
    isShow: boolean;
    index: number;
}

type SortMode = 'time' | 'timeDesc' | 'name' | 'nameDesc';

class GalleryView extends React.PureComponent<IGalleryViewProps & WithTranslation, IGalleryViewState> {

    private readonly galleryRef: React.RefObject<HTMLDivElement>;
    private readonly fileService: FileService;
    private loading: boolean;
    private curLength: number;
    private sortedGallery: album[];
    private authors: string[];
    private tags: string[];

    constructor(props: IGalleryViewProps) {
        super(props);

        const serviceCollection: ServiceCollection = remote.getGlobal(serviceConstant.SERVICE_COLLECTION);
        this.fileService = serviceCollection.get(serviceConstant.FILE);

        this.loading = false;
        this.galleryRef = React.createRef();
        this.curLength = 0;
        this.sortedGallery = [];
        this.authors = [];
        this.tags = [];

        this.state = {
            gallery: [],
            searchWord: '',
            sortMode: 'timeDesc',
            filterAuthor: [],
            filterTag: [],
            zoomLevel: 6,
            selectedIndexs: [],
            lastSelectedIndex: 0,
            lastSelectedIndexs: []
        };
    }

    componentDidMount() {
        this.initEvent();
        this.getAllAuthorsAndTags();
        this.getSortedGallery();
        this.fetchAlbumData();
    }

    componentWillUnmount() {
        this.removeEvent();
        this.stopLoadingResourcesFromFs();
    }

    getAllAuthorsAndTags = () => {
        const gallery = this.props.page.data as album[];

        const tagsMap: { [key: string]: boolean } = {};
        const authorsMap: { [key: string]: boolean } = {};

        gallery.forEach(album => {
            album.tags?.forEach(tag => tagsMap[tag] = true);
            album.authors?.forEach(author => authorsMap[author] = true);
        });

        const tags = Object.keys(tagsMap);
        const authors = Object.keys(authorsMap);

        this.tags = tags;
        this.authors = authors;
    }

    getSortedGallery = () => {
        const { sortMode, searchWord, filterAuthor, filterTag } = this.state;

        let sortedGallery = [...this.props.page.data as album[]];

        if (searchWord !== '') sortedGallery = sortedGallery.filter(album => album.title.includes(searchWord));
        if (filterAuthor.length !== 0) sortedGallery = sortedGallery.filter(album => isSubArray(album.authors, filterAuthor));
        if (filterTag.length !== 0) sortedGallery = sortedGallery.filter(album => isSubArray(album.tags, filterTag));

        switch (sortMode) {
            case 'nameDesc':
                sortedGallery.sort((a, b) => naturalCompare(a.title, b.title));
                break;

            case 'name':
                sortedGallery.sort((a, b) => naturalCompare(b.title, a.title));
                break;

            case 'time':
                sortedGallery.reverse();
        }

        this.sortedGallery = sortedGallery;
    }

    stopLoadingResourcesFromFs = () => {
        const imgs = this.galleryRef.current.querySelectorAll('img');
        const videos = this.galleryRef.current.querySelectorAll('video');

        imgs.forEach(img => {
            img.src = '';
        });

        videos.forEach(video => {
            video.src = '';
        });
    }

    async fetchAlbumData() {
        const APPEND_LENGTH = 30;
        const curLength = this.curLength;
        const totalLength = this.sortedGallery.length;

        if (totalLength === 0) {
            this.setState({
                gallery: []
            });
        } else if (curLength < totalLength) {
            let appendAlbum = this.sortedGallery.slice(curLength, curLength + APPEND_LENGTH);
            const urls = appendAlbum.map(album => album.url);
            const covers = await this.fileService.getCovers(urls);

            appendAlbum.forEach((album, index) => {
                album.cover = covers[index];
            });

            appendAlbum = appendAlbum.filter((album) => album.cover);

            this.setState({
                gallery: [...this.state.gallery.slice(0, this.curLength), ...appendAlbum]
            });

            this.curLength = curLength + APPEND_LENGTH;
        }

        setTimeout(() => {
            this.loading = false;
        });
    }

    initEvent() { }

    removeEvent() { }

    handleClick = (e: React.MouseEvent, album: album, index: number) => {
        const url = album.url;

        EventHub.emit(eventConstant.LOAD_PICTURE_BY_SELECT_DIR, {
            url,
            type: 'NEW'
        });
    }

    handleWheel = (e: React.WheelEvent) => {
        this.checkShouldLoadAlbum();

        if (e.ctrlKey || e.buttons === 2) {
            let zoom: zoomEvent = null;
            if (e.deltaY < 0) zoom = 'ZOOM_IN';
            else if (e.deltaY > 0) zoom = 'ZOOM_OUT';
            if (zoom) this.handleZoom(zoom);
        }
    }

    handleZoom = (zoom: zoomEvent) => {
        let zoomLevel = this.state.zoomLevel;
        if (zoom === 'ZOOM_OUT') zoomLevel = zoomLevel >= 11 ? 11 : zoomLevel + 1;
        else zoomLevel = zoomLevel <= 1 ? 1 : zoomLevel - 1;

        zoomLevel = zoomLevel === 11 ? 10 : zoomLevel;

        this.setState({
            zoomLevel
        });
    }

    handleScroll = () => {
        this.checkShouldLoadAlbum();
    }

    checkShouldLoadAlbum = () => {
        if (!this.props.isShow) return;

        const el = this.galleryRef.current;

        if ((el.scrollTop + el.clientHeight > el.scrollHeight - 800) && !this.loading) {
            this.loading = true;
            this.fetchAlbumData();
        }
    }

    switchSortMode = () => {
        const sortMode: SortMode[] = ['timeDesc', 'time', 'nameDesc', 'name'];
        const nextModeIndex = (sortMode.indexOf(this.state.sortMode) + 1) % sortMode.length;

        this.setState({
            sortMode: sortMode[nextModeIndex]
        });

        setTimeout(() => {
            this.reFetchAlbum();
        }, 0);
    }

    handleSearchWordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ searchWord: e.target.value });

        setTimeout(() => {
            this.reFetchAlbum();
        }, 0);
    }

    @throttle(200)
    reFetchAlbum() {
        this.curLength = 0;
        this.getSortedGallery();
        this.fetchAlbumData();
    }

    selectTags = (tags: string[]) => {
        this.setState({
            filterTag: tags
        });
        setTimeout(() => {
            this.reFetchAlbum();
        }, 0);
    }

    selectAuthors = (authors: string[]) => {
        this.setState({
            filterAuthor: authors
        });
        setTimeout(() => {
            this.reFetchAlbum();
        }, 0);
    }

    renderSearchBar = () => {
        const { t } = useTranslation();
        let orderFieldName: string = '';
        if (this.state.sortMode.includes('time')) orderFieldName = t('%orderByTime%');
        else if (this.state.sortMode.includes('name')) orderFieldName = t('%orderByName%');

        return (
            <div className={style.filterWrapper}>
                <Button
                    className={`theme`}
                    type='primary'
                    icon={this.state.sortMode.toLowerCase().includes('desc') ? <SortAscendingOutlined /> : <SortDescendingOutlined />}
                    tabIndex={-1}
                    onClick={this.switchSortMode}
                >
                    {orderFieldName}
                </Button>

                <div className={style.selectWrapper} style={{ display: this.authors.length > 0 ? 'block' : 'none' }}>
                    <Select
                        value={this.state.filterAuthor}
                        onChange={this.selectAuthors}
                        placeholder={t('%authorFilter%')}>
                        {this.authors.map(author => <Option value={author} key={author}>{author}</Option>)}
                    </Select>
                </div>

                <div className={style.selectWrapper} style={{ display: this.tags.length > 0 ? 'block' : 'none' }}>
                    <Select
                        value={this.state.filterTag}
                        onChange={this.selectTags}
                        placeholder={t('%tagFilter%')}>
                        {this.tags.map(tag => <Option value={tag} key={tag}>{tag}</Option>)}
                    </Select>
                </div>

                <div className={style.searchInput}>
                    <input
                        type='text'
                        onChange={this.handleSearchWordChange}
                        value={this.state.searchWord}
                        placeholder={t('%searchTitle%')}
                    />
                </div>
            </div>
        );
    }

    renderGallery = () => {
        const zoomLevel = this.state.zoomLevel;
        const boxWidth: string = String(100 / this.state.zoomLevel) + '%';

        return (
            <div className={style.gallery}>
                {
                    this.state.gallery.map((album, index) => {
                        const cover = album.cover;
                        let content: JSX.Element = null;
                        if (isVideo(cover)) {
                            content = <video src={encodeChar(cover)} autoPlay muted loop></video>;
                        } else {
                            content = <img draggable={false} src={encodeChar(cover)} />;
                        }

                        return (<div
                            className={style.pictureBox}
                            style={{ width: boxWidth, maxHeight: `${(11 - zoomLevel) * 150}px` }}
                            key={album.id}
                            onMouseEnter={(e: React.MouseEvent) => { e.stopPropagation(); hintMainText(album.title); }}
                        >
                            <div className={style.innerBox} onClick={(e: React.MouseEvent) => { this.handleClick(e, album, index); }}>
                                <div className={style.imgBox}>
                                    {content}
                                </div>
                                <div className={`${style.title} text-ellipsis-2`}>
                                    {album.title}
                                </div>
                            </div>
                        </div>);
                    })
                }
            </div>
        );
    }

    render(): JSX.Element {
        const SearchBar = this.renderSearchBar;
        const Gallery = this.renderGallery;

        return (
            <div
                id={`galleryViewScrollWrapper${this.props.index}`}
                className={`${style.galleryViewWrapper} medium-scrollbar`}
                style={{ display: this.props.isShow ? 'block' : 'none' }}
                onScroll={this.handleScroll}
                onWheel={this.handleWheel}
                ref={this.galleryRef}
            >
                <SearchBar />
                <Gallery />
            </div>
        );
    }
}

const galleryView = withTranslation()(GalleryView);

export { galleryView as GalleryView };