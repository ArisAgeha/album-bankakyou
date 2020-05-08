import * as React from 'react';
import { EventHub } from '@/common/eventHub';
import { eventConstant } from '@/common/constant/event.constant';
import style from './manageBar.scss';
import { useTranslation, withTranslation } from 'react-i18next';
import bgimg from '@/renderer/static/image/background02.jpg';
import { Select } from '@/renderer/components/select/select';
import { TagSelector } from '@/renderer/components/tagSelector/tagSelector';
import { isArray, isUndefinedOrNull, isString, isNumber } from '@/common/utils/types';
import { db } from '@/common/nedb';
import { ipcRenderer, IpcRendererEvent } from 'electron';
import { command } from '@/common/constant/command.constant';
import { Button } from 'antd';
import { ApartmentOutlined, SyncOutlined, LoadingOutlined } from '@ant-design/icons';
import { upsertMany } from '@/common/utils/dbHelper';
import { IDirectoryData } from '../fileBar/directoryView/directoryView';
import { deepEqual, primitiveArrayDeepEqual } from '@/common/utils/functionTools';
import { extractDirUrlFromKey } from '@/common/utils/businessTools';
import { AuthorSelector } from '@/renderer/components/tagSelector/authorSelector';
import { scrollModeDirection } from '../mainView/pictureView/scrollList/scrollList';
import { readingDirection } from '../mainView/pictureView/doublePage/doublePage';
const { Option } = Select;

export type readingMode = 'scroll' | 'double_page' | 'single_page' | '_different';
export type pageReAlign = boolean | '_different';
export type manageData = {
    tags: IDirectoryData['tag'] | '_different';
    authors: string[] | '_different';
    readingMode: readingMode;
    readingDirection: readingDirection | '_different';
    scrollModeDirection: scrollModeDirection | '_different';
    pageReAlign: pageReAlign;
};

export interface IManageBarState {
    normalModeLoading: false | 'saving' | 'loading';
    deepModeLoading: false | 'saving' | 'loading';
    deepMode: boolean;
    urls: string[];
    selectedUrls: string[];
    deepData: manageData;
    normalData: manageData;
    historyState: {
        readingMode: readingMode;
        readingDirection: readingDirection;
        pageReAlign: pageReAlign;
    };
    tagSelectorIsShow: boolean;
    authorSelectorIsShow: boolean;
}

export class ManageBar extends React.PureComponent<{}, IManageBarState> {

    MAX_MESSAGE_LENGTH: number = 10;
    SYNC_FLAGS: number = 0;

    constructor(props: {}) {
        super(props);

        this.state = {
            normalModeLoading: false,
            deepModeLoading: false,
            deepMode: false,
            selectedUrls: [],
            urls: [],
            deepData: {
                tags: null,
                authors: null,
                readingMode: null,
                readingDirection: null,
                scrollModeDirection: null,
                pageReAlign: null
            },
            normalData: {
                tags: null,
                authors: null,
                readingMode: null,
                readingDirection: null,
                scrollModeDirection: null,
                pageReAlign: null
            },
            historyState: {
                readingMode: 'double_page',
                readingDirection: 'LR',
                pageReAlign: false
            },
            tagSelectorIsShow: false,
            authorSelectorIsShow: false
        };
    }

    componentDidMount() {
        this.initEvent();
        this.initIpc();
    }

    componentWillUnmount() {
        this.removeEvent();
    }

    initIpc() {
        ipcRenderer.on(command.REPLY_LOAD_SUB_DIRECTORY_INFO, (event: IpcRendererEvent, data: { urls: string[]; flag: number }) => {
            const { urls, flag } = data;
            if (flag === this.SYNC_FLAGS) this.handleRecieveUrlsFromService(urls);
        });
    }

    handleRecieveUrlsFromService = (urlsWithSubDirs: string[]) => {
        this.setState({ urls: urlsWithSubDirs });
        this.loadPreference(urlsWithSubDirs, 'deep');
    }

    checkArrayIsInSameValue(arr: any[], ...path: string[]) {
        let standardItem = arr[0];
        path.forEach(p => {
            standardItem = standardItem[p];
        });
        return arr.every(item => {
            let checkItem = item;
            path.forEach(p => {
                checkItem = checkItem[p];
            });
            if (Array.isArray(checkItem) && Array.isArray(standardItem)) {
                return checkItem.every((ci, index) => ci === standardItem[index]);
            }
            else {
                return checkItem === standardItem;
            }
        });
    }

    initEvent() {
        EventHub.on(eventConstant.SHOW_MANAGE_BAR, this.loadPreferenceAndSubUrls);
    }

    removeEvent() {
        EventHub.cancel(eventConstant.SHOW_MANAGE_BAR, this.loadPreferenceAndSubUrls);
    }

    loadPreferenceAndSubUrls = (data: string[]) => {
        const selectedUrls = data.map(extractDirUrlFromKey);
        this.setState({ selectedUrls, normalModeLoading: 'loading', deepModeLoading: 'loading' });
        this.loadPreference(selectedUrls, 'normal');
        this.SYNC_FLAGS++;
        ipcRenderer.send(command.LOAD_SUB_DIRECTORY_INFO, { urls: selectedUrls, flag: this.SYNC_FLAGS });
    }

    loadPreference = async (urls: string[], mode: 'deep' | 'normal') => {
        let readingMode: readingMode = null;
        let readingDirection: manageData['readingDirection'] = null;
        let scrollModeDirection: manageData['scrollModeDirection'] = null;
        let pageReAlign: pageReAlign = null;
        let tag: manageData['tags'] = null;
        let author: manageData['authors'] = null;

        const querys = urls.map(url => ({ url }));
        const urlsData: IDirectoryData[] = (await db.directory.find({ $or: querys }).exec()) as any[];
        if (urlsData?.length > 0) {
            if (urlsData.length < urls.length) {
                readingMode = '_different';
                readingDirection = '_different';
                scrollModeDirection = '_different';
                pageReAlign = '_different';
                tag = '_different';
                author = '_different';
            }
            else {
                readingMode = urlsData[0].readingMode;
                readingDirection = urlsData[0].readingDirection;
                scrollModeDirection = urlsData[0].scrollModeDirection;
                pageReAlign = urlsData[0].pageReAlign;
                tag = urlsData[0].tag;
                author = urlsData[0].author;

                urlsData.forEach((urlData) => {
                    readingMode = readingMode === urlData.readingMode ? readingMode : '_different';
                    readingDirection = readingDirection === urlData.readingDirection ? readingDirection : '_different';
                    scrollModeDirection = scrollModeDirection === urlData.scrollModeDirection ? scrollModeDirection : '_different';
                    pageReAlign = pageReAlign === urlData.pageReAlign ? pageReAlign : '_different';
                    tag = (primitiveArrayDeepEqual(tag, urlData.tag)) ? tag : '_different';
                    author = (primitiveArrayDeepEqual(author, urlData.author)) ? author : '_different';
                });

                if (urlsData.length === 1) {
                    tag = urlsData[0].tag;
                    author = urlsData[0].author;
                }
            }
        }
        const manageDataObj: manageData = {
            readingMode,
            readingDirection,
            scrollModeDirection,
            pageReAlign,
            tags: tag,
            authors: author
        };
        const setStateObj: Partial<IManageBarState> = {};
        if (mode === 'deep') {
            setStateObj.deepModeLoading = false;
            setStateObj.deepData = manageDataObj;
        }
        else {
            setStateObj.normalModeLoading = false;
            setStateObj.normalData = manageDataObj;
        }
        this.setState(setStateObj as Pick<IManageBarState, keyof IManageBarState>);
    }

    getUrls = () => this.state.deepMode ? this.state.urls : this.state.selectedUrls;

    setSavingStatus = () => {
        if (this.state.deepMode) this.setState({ deepModeLoading: 'saving' });
        else this.setState({ normalModeLoading: 'saving' });
    }

    handleAuthorsChange = async (authors: string[]) => {
        this.setSavingStatus();
        this.setState({ authorSelectorIsShow: false });
        const urls = this.getUrls();
        const querys = urls.map(url => ({ url }));
        const updateObjs = { author: authors };

        await upsertMany(querys, updateObjs);

        for (const author of authors) {
            await db.author.update({ author_name: author }, { author_name: author }, { upsert: true });
        }
        if (this.state.deepMode) this.setState({ deepData: { ...this.state.deepData, authors }, deepModeLoading: false });
        else this.setState({ normalData: { ...this.state.normalData, authors }, authorSelectorIsShow: false, normalModeLoading: false });

        EventHub.emit(eventConstant.UPDATE_AUTHORS);
    }

    handleTagsChange = async (tags: string[]) => {
        this.setSavingStatus();
        this.setState({ tagSelectorIsShow: false });
        const urls = this.getUrls();
        const querys = urls.map(url => ({ url }));
        const updateObjs = { tag: tags };

        await upsertMany(querys, updateObjs);

        for (const tag of tags) {
            await db.tag.update({ tag_name: tag }, { tag_name: tag }, { upsert: true });
        }
        if (this.state.deepMode) this.setState({ deepData: { ...this.state.deepData, tags }, deepModeLoading: false });
        else this.setState({ normalData: { ...this.state.normalData, tags }, tagSelectorIsShow: false, normalModeLoading: false });

        EventHub.emit(eventConstant.UPDATE_TAGS);
    }

    setScrollModeDirection = async (value: any) => {
        this.setSavingStatus();
        await this.upsertToUrls({ scrollModeDirection: value });
        if (this.state.deepMode) this.setState({ deepData: { ...this.state.deepData, scrollModeDirection: value }, deepModeLoading: false });
        else this.setState({ normalData: { ...this.state.normalData, scrollModeDirection: value }, normalModeLoading: false });
    }

    setReadingDirection = async (value: any) => {
        this.setSavingStatus();
        await this.upsertToUrls({ readingDirection: value });
        if (this.state.deepMode) this.setState({ deepData: { ...this.state.deepData, readingDirection: value }, deepModeLoading: false });
        else this.setState({ normalData: { ...this.state.normalData, readingDirection: value }, normalModeLoading: false });
    }

    setReadingMode = async (value: any) => {
        this.setSavingStatus();
        await this.upsertToUrls({ readingMode: value });
        if (this.state.deepMode) this.setState({ deepData: { ...this.state.deepData, readingMode: value }, deepModeLoading: false });
        else this.setState({ normalData: { ...this.state.normalData, readingMode: value }, normalModeLoading: false });
    }

    setPageReAlign = async (value: any) => {
        this.setSavingStatus();
        await this.upsertToUrls({ pageReAlign: value });
        if (this.state.deepMode) this.setState({ deepData: { ...this.state.deepData, pageReAlign: value }, deepModeLoading: false });
        else this.setState({ normalData: { ...this.state.normalData, pageReAlign: value }, normalModeLoading: false });
    }

    upsertToUrls = async (upsertObj: { [key: string]: any }) => {
        const urls = this.getUrls();
        const querys = urls.map(url => ({ url }));
        await upsertMany(querys, upsertObj);
    }

    // getValue: <T extends manageData, K extends keyof T>(key: K) => T[K]

    getValue = <K extends keyof manageData>(key: K): manageData[K] =>
        this.state.deepMode ? this.state.deepData[key] : this.state.normalData[key]

    renderInfo = () => {
        const { t, i18n } = useTranslation();
        const selectedDirNum = this.state.selectedUrls.length;
        const dirNum = this.state.urls.length;

        return (
            <div className={style.info}>
                {this.state.deepMode ?
                    <h2 className={style.infoItem}>
                        {t('%dirNum%').replace('%{dirNum}', dirNum.toString())}
                    </h2>
                    :
                    <h2 className={style.infoItem}>
                        {t('%selectedDirNum%').replace('%{selectedDirNum}', selectedDirNum.toString())}
                    </h2>
                }
                <Button
                    className={this.state.deepMode ? 'active' : ''}
                    type='primary'
                    icon={< ApartmentOutlined />}
                    tabIndex={-1}
                    onClick={() => {
                        this.setState({ deepMode: !this.state.deepMode });
                    }}
                >
                    {t('%deepMode%')}
                </Button>
            </div>
        );
    }

    renderCategory = () => {
        const { t, i18n } = useTranslation();
        const tags = this.getValue('tags');
        const authors = this.getValue('authors');

        let tagsMessage = null;
        let authorsMessage = null;

        // get ellipsis text of tags, e.g: [animal]、[fruit] => animal, frui...
        // the maxium text length is decide by `MAX_MESSAGE_LENGTH`
        if (isArray(tags)) {
            if (tags.length > 0) {
                tagsMessage = tags.reduce((preVal, curVal) => `${preVal}, ${curVal}`, '').slice(2);
                if (tagsMessage.length > this.MAX_MESSAGE_LENGTH) {
                    tagsMessage = tags.length > 1
                        ? `${tagsMessage.slice(0, 10)}...${t('%totallyTagCount%')}`.replace('%{totallyTagCount}', tags.length.toString())
                        : tagsMessage.slice(0, 10);
                }
            }
            else {
                tagsMessage = t('%noTags%');
            }
        }
        else if (isUndefinedOrNull(tags)) {
            tagsMessage = t('%noTags%');
        }
        else if (tags === '_different') {
            tagsMessage = t('%differentSetting%');
        }

        // get ellipsis text of authors. e.g: [Johnson], [Washinton] => Johnson, Washin...
        // the maxium text length is decide by `MAX_MESSAGE_LENGTH`
        if (isArray(authors)) {
            if (authors.length > 0) {
                authorsMessage = authors.reduce((preVal, curVal) => `${preVal}, ${curVal}`, '').slice(2);
                if (authorsMessage.length > this.MAX_MESSAGE_LENGTH) {
                    authorsMessage = authors.length > 1
                        ? `${authorsMessage.slice(0, 10)}...${t('%totallyAuthorCount%')}`.replace('%{totallyAuthorCount}', authors.length.toString())
                        : authorsMessage.slice(0, 10);
                }
            }
            else {
                authorsMessage = t('%noAuthors%');
            }
        }
        else if (isUndefinedOrNull(authors)) {
            authorsMessage = t('%noAuthors%');
        }
        else if (authors === '_different') {
            authorsMessage = t('%differentSetting%');
        }

        return (
            <div className={style.group}>
                <h2>{t('%category%')}</h2>
                <div className={style.item}>
                    <h3>{t('%tag%')}</h3>
                    <div className={style.selectorButton} onClick={() => { this.setState({ tagSelectorIsShow: true }); }}>{tagsMessage}</div>
                </div>
                <div className={style.item}>
                    <h3>{t('%author%')}</h3>
                    <div className={style.selectorButton} onClick={() => { this.setState({ authorSelectorIsShow: true }); }}>{authorsMessage}</div>
                </div>
            </div>
        );
    }

    renderReadingSettings = () => {
        const { t, i18n } = useTranslation();
        const readingMode = this.getValue('readingMode');
        const scrollModeDirection = this.getValue('scrollModeDirection');
        const readingDirection = this.getValue('readingDirection');
        const pageReAlign = this.getValue('pageReAlign');

        return (
            <div className={style.group}>
                <h2>{t('%readingSettings%')}</h2>
                <div className={style.item}>
                    <h3>{t('%readingMode%')}</h3>
                    <div>
                        <Select
                            value={readingMode}
                            onChange={this.setReadingMode}
                            placeholder={isUndefinedOrNull(readingMode) ? t('%notSettingYet%') : t('%differentSetting%')}>
                            <Option value={'scroll'}>{t('%scrollMode%')}</Option>
                            <Option value={'single_page'}>{t('%singlePageMode%')}</Option>
                            <Option value={'double_page'}>{t('%doublePageMode%')}</Option>
                        </Select>
                    </div>
                </div>
                <div className={style.item}>
                    <h3>{t('%scrollModeDirection%')}</h3>
                    <div>
                        <Select
                            value={scrollModeDirection}
                            onChange={this.setScrollModeDirection}
                            placeholder={isUndefinedOrNull(scrollModeDirection) ? t('%notSettingYet%') : t('%differentSetting%')}>
                            <Option value={'LR'}>{t('%fromLeftToRight%')}</Option>
                            <Option value={'RL'}>{t('%fromRightToLeft%')}</Option>
                            <Option value={'TB'}>{t('%fromTopToBottom%')}</Option>
                            <Option value={'BT'}>{t('%fromBottomToTop%')}</Option>
                        </Select>
                    </div>
                </div>
                <div className={style.item}>
                    <h3>{t('%readingDirection%')}</h3>
                    <div>
                        <Select
                            value={readingDirection}
                            onChange={this.setReadingDirection}
                            placeholder={isUndefinedOrNull(readingDirection) ? t('%notSettingYet%') : t('%differentSetting%')}>
                            <Option value={'LR'}>{t('%fromLeftToRight%')}</Option>
                            <Option value={'RL'}>{t('%fromRightToLeft%')}</Option>
                        </Select>
                    </div>
                </div>
                <div className={style.item}>
                    <h3>{t('%pageReAlign%')}</h3>
                    <div>
                        <Select
                            value={pageReAlign}
                            onChange={this.setPageReAlign}
                            placeholder={isUndefinedOrNull(pageReAlign) ? t('%notSettingYet%') : t('%differentSetting%')}>
                            <Option value={true}>{t('%yes%')}</Option>
                            <Option value={false}>{t('%no%')}</Option>
                        </Select>
                    </div>
                </div>
            </div>
        );
    }

    renderLoadingModal = () => {
        const { t } = useTranslation();
        const loadingType = this.state.deepMode ? this.state.deepModeLoading : this.state.normalModeLoading;
        return (
            <div className={style.loadingModal}>
                {loadingType === 'saving' ? <SyncOutlined spin /> : <LoadingOutlined />}
                <span className={style.loadingText}>{loadingType === 'saving' ? t('%saving%') : t('%loading%')}</span>
            </div>
        );
    }

    render(): JSX.Element {
        const Info = this.renderInfo;
        const Category = this.renderCategory;
        const ReadingSettings = this.renderReadingSettings;
        const LoadingModal = this.renderLoadingModal;

        const { tagSelectorIsShow, authorSelectorIsShow } = this.state;

        const isLoading = this.state.deepMode ? this.state.deepModeLoading : this.state.normalModeLoading;

        const mainContent = (
            <div className={`${style.scrollWrapper} medium-scrollbar`} style={{ filter: isLoading !== false ? 'blur(4px)' : '' }}>
                <Info />
                <Category />
                <ReadingSettings />
            </div>
        );

        return <div className={`${style.manageBar}`} style={{ backgroundImage: `url(${bgimg})` }}>
            {mainContent}
            {isLoading && <LoadingModal />}

            {tagSelectorIsShow ?
                <TagSelector
                    visible={tagSelectorIsShow}
                    selectedTags={this.getValue('tags')}
                    onSubmit={this.handleTagsChange}
                    onCancel={() => { this.setState({ tagSelectorIsShow: false }); }} />
                : ''}

            {authorSelectorIsShow ?
                <AuthorSelector
                    visible={authorSelectorIsShow}
                    selectedAuthors={this.getValue('authors')}
                    onSubmit={this.handleAuthorsChange}
                    onCancel={() => { this.setState({ authorSelectorIsShow: false }); }} />
                : ''}
        </div>;
    }
}
