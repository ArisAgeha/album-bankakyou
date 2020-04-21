import * as React from 'react';
import { EventHub } from '@/common/eventHub';
import { eventConstant } from '@/common/constant/event.constant';
import { extractDirUrlFromKey } from '@/common/utils/tools';
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
const { Option } = Select;

type readingMode = 'scroll' | 'double_page' | 'single_page' | '_different';
type readingDirection = 'LR' | 'RL' | '_different';
type pageReAlign = boolean | '_different';

export interface IManageBarState {
    loading: boolean;
    deepMode: boolean;
    urls: string[];
    tags: string[] | null;
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

    handleRecieveUrlsFromService = async (urls: string[]) => {
        this.setState({ urls });
        const readingMode: readingMode = null;
        const readingDirection: readingDirection = null;
        const pageReAlign: pageReAlign = null;

        const urlsData = await db.directory.find({ urls }).exec();
        console.log(urlsData);
    }

    initEvent() {
        EventHub.on(eventConstant.SHOW_MANAGE_BAR, this.loadPreference);
    }

    removeEvent() {
        EventHub.cancel(eventConstant.SHOW_MANAGE_BAR, this.loadPreference);
    }

    loadPreference = (data: string[]) => {
        const selectedUrls = data.map(extractDirUrlFromKey);
        this.setState({ selectedUrls });
        ipcRenderer.send(command.LOAD_SUB_DIRECTORY_INFO, selectedUrls);
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
        const urls = this.getUrls();
        urls.forEach((url) => {
            db.directory.update({ url }, { readingDirection: value }, { upsert: true });
        });
        this.setState({ readingDirection: value });
    }

    setReadingMode = (value: any) => {
        const urls = this.getUrls();
        urls.forEach((url) => {
            db.directory.update({ url }, { readingMode: value }, { upsert: true });
        });
        this.setState({ readingMode: value });
    }

    setPageReAlign = (value: any) => {
        const urls = this.getUrls();
        urls.forEach((url) => {
            db.directory.update({ url }, { pageReAlign: value }, { upsert: true });
        });
        this.setState({ pageReAlign: value });
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
