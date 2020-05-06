import React, { PureComponent } from 'react';
import style from './tagView.scss';
import { db, Directory } from '@/common/nedb';
import { useTranslation } from 'react-i18next';
import { OrderedListOutlined, SortAscendingOutlined, SortDescendingOutlined } from '@ant-design/icons';
import { naturalCompare, toggleArrayItem } from '@/common/utils/functionTools';
import { isArray, isString } from '@/common/utils/types';
import { EventHub } from '@/common/eventHub';
import { eventConstant } from '@/common/constant/event.constant';

type SortMode = 'count' | 'countDesc' | 'name' | 'nameDesc';

export interface ITagViewProps {
}

export interface ITagViewState {
    searchData: string;
    sortMode: SortMode;
    tagMap: { [key: string]: number };
    selectedTags: string[];
    lastSelectedTag: string;
    lastSelectedTags: string[];
}

export class TagView extends PureComponent<ITagViewProps, ITagViewState> {

    tagsArray: Array<[string, number]> = [];

    constructor(props: ITagViewProps) {
        super(props);

        this.state = {
            selectedTags: [],
            lastSelectedTag: '',
            lastSelectedTags: [],
            searchData: '',
            sortMode: 'nameDesc',
            tagMap: {}
        };
    }

    async componentDidMount() {
        this.initEvent();
        this.fetchTags();
    }

    componentWillUnmount() {
        EventHub.cancel(eventConstant.UPDATE_TAGS, this.fetchTags);
    }

    initEvent() {
        EventHub.on(eventConstant.UPDATE_TAGS, this.fetchTags);
    }

    fetchTags = async () => {
        const directoryData: Directory[] = (await db.directory.find({}).exec()) as any[];
        const tagMap: { [key: string]: number } = {};
        directoryData.forEach(item => {
            item?.tag?.forEach(tag => {
                tagMap[tag] ? tagMap[tag]++ : tagMap[tag] = 1;
            });
        });
        this.setState({
            tagMap
        });
    }

    switchSortMode = () => {
        const sortMode: SortMode[] = ['countDesc', 'count', 'nameDesc', 'name'];
        const nextModeIndex = (sortMode.indexOf(this.state.sortMode) + 1) % sortMode.length;

        this.setState({
            sortMode: sortMode[nextModeIndex]
        });
    }

    renderFilterBar = () => {
        const { t, i18n } = useTranslation();
        let orderFieldName: string = '';
        if (this.state.sortMode.includes('count')) orderFieldName = t('%orderByCount%');
        else if (this.state.sortMode.includes('name')) orderFieldName = t('%orderByName%');

        return (
            <div className={style.filterBar}>
                <div className={style.searchInput}>
                    <input
                        type='text'
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => { this.setState({ searchData: e.target.value }); }}
                        value={this.state.searchData}
                        placeholder={t('%searchContent%')}
                    />
                </div>
                <div className={style.orderController} onClick={this.switchSortMode}>
                    <div className={style.orderFieldName}>
                        {orderFieldName}
                    </div>
                    <div className={style.orderMode}>
                        {this.state.sortMode.toLowerCase().includes('desc') ? <SortAscendingOutlined /> : <SortDescendingOutlined />}
                    </div>
                </div>
            </div>
        );
    }

    handleSelectTags = (e: React.MouseEvent, tag: string) => {
        e.stopPropagation();

        if (e.buttons === 0) {
            if (e.ctrlKey) {
                const selectedTags = toggleArrayItem(this.state.selectedTags, tag);

                this.setState({
                    selectedTags,
                    lastSelectedTag: tag,
                    lastSelectedTags: selectedTags
                });
            }
            else if (e.shiftKey) {
                const { lastSelectedTag, lastSelectedTags } = this.state;
                const lastSelectedIndex = this.tagsArray.findIndex(tagItem => tagItem[0] === lastSelectedTag);
                const curSelectedIndex = this.tagsArray.findIndex(tagItem => tagItem[0] === tag);

                if (lastSelectedIndex === curSelectedIndex) {
                    return;
                }
                else {
                    const newSelectedTags = this.tagsArray
                        .map((tagItem, index) => {
                            const startIndex = Math.min(curSelectedIndex, lastSelectedIndex);
                            const endIndex = Math.max(curSelectedIndex, lastSelectedIndex);

                            if ((index <= endIndex) && (index >= startIndex)) return tagItem[0];
                            return null;
                        })
                        .filter(isString);

                    this.setState({
                        selectedTags: Array.from(new Set([...lastSelectedTags, ...newSelectedTags]))
                    });
                }
            }
            else {
                EventHub.emit(eventConstant.SELECT_TAGS, [tag]);

                this.setState({
                    selectedTags: [tag],
                    lastSelectedTag: tag,
                    lastSelectedTags: [tag]
                });
            }
        }
    }

    handleDragNodeStart = (e: React.DragEvent, tag: string) => {
        e.stopPropagation();
        let transferTags: string = '';

        const curSelectedTags = this.state.selectedTags;
        if (curSelectedTags.includes(tag)) transferTags = curSelectedTags.join('?|?');
        else transferTags = tag;

        const dt = e.dataTransfer;
        const img = new Image();
        dt.setDragImage(img, 0, 0);
        dt.setData('tags', transferTags);
    }

    cancelSelected = () => {
        this.setState({
            selectedTags: []
        });
    }

    renderContent = () => {
        const sortMode = this.state.sortMode;
        let tagsArray = Object.entries(this.state.tagMap);

        if (sortMode.includes('count')) {
            tagsArray = tagsArray.sort((tagItemA, tagItemB) => tagItemB[1] - tagItemA[1]);
        }
        else {
            tagsArray = tagsArray.sort((tagItemA, tagItemB) => naturalCompare(tagItemA[0], tagItemB[0]));
        }

        if (!sortMode.toLowerCase().includes('desc')) {
            tagsArray.reverse();
        }

        if (this.state.searchData !== '') {
            tagsArray = tagsArray.filter(tagItem => tagItem[0].includes(this.state.searchData));
        }

        this.tagsArray = tagsArray;

        return <div className={style.tagsWrapper}>
            {
                tagsArray.map(tagItem => {
                    const tagName = tagItem[0];
                    const tagCount = tagItem[1];

                    return <div
                        onDragStart={(e: React.DragEvent) => { this.handleDragNodeStart(e, tagName); }}
                        draggable
                        className={`${style.tagItem} ${this.state.selectedTags.includes(tagName) ? style.selected : ''}`}
                        onClick={(e: React.MouseEvent) => { this.handleSelectTags(e, tagName); }}
                        key={tagName}
                    >
                        <div className={`${style.tagName} text-ellipsis-1`}>{tagName}</div>
                        <div>{tagCount}</div>
                    </div>;
                })
            }
        </div>;
    }

    render(): JSX.Element {
        const FilterBar = this.renderFilterBar;
        const Content = this.renderContent;

        return <div className={`${style.tagsTreeWrapper} medium-scrollbar text-ellipsis-1`} onClick={this.cancelSelected}>
            <FilterBar />
            <Content />
        </div>;
    }
}
