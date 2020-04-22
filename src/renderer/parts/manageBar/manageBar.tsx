import * as React from 'react';
import { EventHub } from '@/common/eventHub';
import { eventConstant } from '@/common/constant/event.constant';
import style from './manageBar.scss';
import { useTranslation, withTranslation } from 'react-i18next';
import bgimg from '@/renderer/static/image/background02.jpg';
import { Select } from '@/renderer/components/select/select';
import { TagSelector } from '@/renderer/components/tagSelector/tagSelector';
import { isArray } from '@/common/utils/types';
import { db } from '@/common/nedb';
import { ipcRenderer, IpcRendererEvent } from 'electron';
import { command } from '@/common/constant/command.constant';
import { Button } from 'antd';
import { ApartmentOutlined } from '@ant-design/icons';
import { upsertMany } from '@/common/utils/dbHelper';
import { IDirectoryData } from '../fileBar/directoryView/directoryView';
import { deepEqual } from '@/common/utils/functionTools';
import { extractDirUrlFromKey } from '@/common/utils/businessTools';
const { Option } = Select;

export type readingMode = 'scroll' | 'double_page' | 'single_page' | '_different';
export type readingDirection = 'LR' | 'RL' | '_different';
export type pageReAlign = boolean | '_different';

export interface IManageBarState {
    loading: boolean;
    deepMode: boolean;
    urls: string[];
    tags: IDirectoryData['tag'] | '_different';
    authors: string[] | null;
    selectedUrls: string[];
    readingMode: readingMode;
    readingDirection: readingDirection;
    pageReAlign: pageReAlign;
    historyState: {
        readingMode: readingMode;
        readingDirection: readingDirection;
        pageReAlign: pageReAlign;
    };
    tagSelectorIsShow: boolean;
    authorSelectorIsShow: boolean;
}

export class ManageBar extends React.PureComponent<{}, IManageBarState> {

    MAX_TAGS_MESSAGE_LENGTH: number = 10;

    constructor(props: {}) {
        super(props);

        this.state = {
            loading: true,
            deepMode: false,
            selectedUrls: [],
            urls: [],
            tags: null,
            authors: null,
            readingMode: '_different',
            readingDirection: '_different',
            pageReAlign: '_different',
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
        ipcRenderer.on(command.REPLY_LOAD_SUB_DIRECTORY_INFO, (event: IpcRendererEvent, data: { urls: string[] }) => {
            this.handleRecieveUrlsFromService(data.urls);
        });
    }

    handleRecieveUrlsFromService = (urlsWithSubDirs: string[]) => {
        this.setState({ urls: urlsWithSubDirs });

        setTimeout(async () => {
            if (this.state.deepMode) {
                this.loadPreference(urlsWithSubDirs);
            }
        }, 0);
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
            console.log('-----');
            console.log(path);
            console.log(checkItem);
            console.log(standardItem);

            return deepEqual(checkItem, standardItem, true);
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
        this.setState({ selectedUrls });
        ipcRenderer.send(command.LOAD_SUB_DIRECTORY_INFO, selectedUrls);
        if (!this.state.deepMode) this.loadPreference(selectedUrls);
    }

    loadPreference = async (urls: string[]) => {
        let readingMode: readingMode = null;
        let readingDirection: readingDirection = null;
        let pageReAlign: pageReAlign = null;
        let tag: IManageBarState['tags'] = null;

        const querys = urls.map(url => ({ url }));
        const urlsData: IDirectoryData[] = (await db.directory.find({ $or: querys }).exec()) as any[];
        if (urlsData?.length > 0) {
            readingMode = this.checkArrayIsInSameValue(urlsData, 'readingMode') ? urlsData[0].readingMode : '_different';
            readingDirection = this.checkArrayIsInSameValue(urlsData, 'readingDirection') ? urlsData[0].readingDirection : '_different';
            pageReAlign = this.checkArrayIsInSameValue(urlsData, 'pageReAlign') ? urlsData[0].pageReAlign : '_different';
            console.log('++++++');
            console.log(this.checkArrayIsInSameValue(urlsData, 'tag'));
            tag = this.checkArrayIsInSameValue(urlsData, 'tag') ? urlsData[0].tag : '_different';
        }
        this.setState({
            readingMode,
            readingDirection,
            pageReAlign,
            tags: tag
        });
    }

    getUrls = () => this.state.deepMode ? this.state.urls : this.state.selectedUrls;

    handleAuthorsChange = (authors: string[]) => {
        // TODO: save into database
        this.setState({
            authors,
            authorSelectorIsShow: false
        });
    }

    handleTagsChange = async (tags: string[]) => {
        const urls = this.getUrls();
        const querys = urls.map(url => ({ url }));
        const updateObjs = { tag: tags };

        await upsertMany(querys, updateObjs);

        for (const tag of tags) {
            await db.tag.update({ tag_name: tag }, { tag_name: tag }, { upsert: true });
        }
        this.setState({ tags, tagSelectorIsShow: false });
    }

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
                        setTimeout(() => {
                            const urls = this.getUrls();
                            this.loadPreference(urls);
                        }, 0);
                    }}
                >
                    {t('%deepMode%')}
                </Button>
            </div>
        );
    }

    renderCategory = () => {
        const { t, i18n } = useTranslation();
        const tags = this.state.tags;

        let tagsMessage = null;
        if (isArray(tags)) {
            if (tags.length > 0) {
                tagsMessage = tags.reduce((preVal, curVal) => `${preVal}, ${curVal}`, '').slice(2);
                if (tagsMessage.length > this.MAX_TAGS_MESSAGE_LENGTH) {
                    tagsMessage = tags.length > 1
                        ? `${tagsMessage.slice(0, 10)}...${t('%totallyTagCount%')}`.replace('%{totallyTagCount}', tags.length.toString())
                        : tagsMessage.slice(0, 10);
                }
            }
            else {
                tagsMessage = t('%noTags%');
            }
        }
        else {
            tagsMessage = t('%differentSetting%');
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
                    <div className={style.selectorButton} onClick={() => { this.setState({ authorSelectorIsShow: true }); }}>{tagsMessage}</div>
                </div>
            </div>
        );
    }

    setReadingDirection = (value: any) => {
        this.upsertToUrls({ readingDirection: value });
        this.setState({ readingDirection: value });
    }

    setReadingMode = (value: any) => {
        this.upsertToUrls({ readingMode: value });
        this.setState({ readingMode: value });
    }

    setPageReAlign = (value: any) => {
        this.upsertToUrls({ pageReAlign: value });
        this.setState({ pageReAlign: value });
    }

    upsertToUrls = (upsertObj: { [key: string]: any }) => {
        const urls = this.getUrls();
        const querys = urls.map(url => ({ url }));
        upsertMany(querys, upsertObj);
    }

    renderReadingSettings = () => {
        const { t, i18n } = useTranslation();

        return (
            <div className={style.group}>
                <h2>{t('%readingSettings%')}</h2>
                <div className={style.item}>
                    <h3>{t('%readingMode%')}</h3>
                    <div>
                        <Select value={this.state.readingMode} onChange={this.setReadingMode} placeholder={t('%differentSetting%')}>
                            <Option value={'scroll'}>{t('%scrollMode%')}</Option>
                            <Option value={'single_page'}>{t('%singlePageMode%')}</Option>
                            <Option value={'double_page'}>{t('%doublePageMode%')}</Option>
                        </Select>
                    </div>
                </div>
                <div className={style.item}>
                    <h3>{t('%readingDirection%')}</h3>
                    <div>
                        <Select value={this.state.readingDirection} onChange={this.setReadingDirection} placeholder={t('%differentSetting%')}>
                            <Option value={'LR'}>{t('%fromLeftToRight%')}</Option>
                            <Option value={'RL'}>{t('%fromRightToLeft%')}</Option>
                        </Select>
                    </div>
                </div>
                <div className={style.item}>
                    <h3>{t('%pageReAlign%')}</h3>
                    <div>
                        <Select value={this.state.pageReAlign} onChange={this.setPageReAlign} placeholder={t('%differentSetting%')}>
                            <Option value={true}>{t('%yes%')}</Option>
                            <Option value={false}>{t('%no%')}</Option>
                        </Select>
                    </div>
                </div>
            </div>
        );
    }

    render(): JSX.Element {
        const Info = this.renderInfo;
        const Category = this.renderCategory;
        const ReadingSettings = this.renderReadingSettings;

        const { tagSelectorIsShow, authorSelectorIsShow } = this.state;

        return <div className={`${style.manageBar} ${this.state.loading ? style.loading : ''}`} style={{ backgroundImage: `url(${bgimg})` }}>
            <div className={`${style.scrollWrapper} medium-scrollbar`}>
                <Info />
                <Category />
                <ReadingSettings />
            </div>
            {tagSelectorIsShow ?
                <TagSelector
                    visible={tagSelectorIsShow}
                    selectedTags={this.state.tags}
                    onSubmit={this.handleTagsChange}
                    onCancel={() => { this.setState({ tagSelectorIsShow: false }); }} />
                : ''}
        </div>;
    }
}
