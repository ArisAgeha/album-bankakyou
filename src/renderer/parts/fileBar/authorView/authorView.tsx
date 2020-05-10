import React, { PureComponent } from 'react';
import style from './authorView.scss';
import { db, Directory } from '@/common/nedb';
import { useTranslation } from 'react-i18next';
import { OrderedListOutlined, SortAscendingOutlined, SortDescendingOutlined } from '@ant-design/icons';
import { naturalCompare, toggleArrayItem } from '@/common/utils/functionTools';
import { isArray, isString } from '@/common/utils/types';
import { EventHub } from '@/common/eventHub';
import { eventConstant } from '@/common/constant/event.constant';
import { hintMainText } from '@/renderer/utils/tools';

type SortMode = 'count' | 'countDesc' | 'name' | 'nameDesc';

export interface IAuthorViewProps {
}

export interface IAuthorViewState {
    searchData: string;
    sortMode: SortMode;
    authorMap: { [key: string]: number };
    selectedAuthors: string[];
    lastSelectedAuthor: string;
    lastSelectedAuthors: string[];
}

export class AuthorView extends PureComponent<IAuthorViewProps, IAuthorViewState> {

    authorsArray: Array<[string, number]> = [];

    constructor(props: IAuthorViewProps) {
        super(props);

        this.state = {
            selectedAuthors: [],
            lastSelectedAuthor: '',
            lastSelectedAuthors: [],
            searchData: '',
            sortMode: 'nameDesc',
            authorMap: {}
        };
    }

    async componentDidMount() {
        this.initEvent();
        this.fetchAuthors();
    }

    componentWillUnmount() {
        EventHub.cancel(eventConstant.UPDATE_AUTHORS, this.fetchAuthors);
    }

    initEvent() {
        EventHub.on(eventConstant.UPDATE_AUTHORS, this.fetchAuthors);
    }

    fetchAuthors = async () => {
        const directoryData: Directory[] = (await db.directory.find({}).exec()) as any[];
        const authorMap: { [key: string]: number } = {};
        directoryData.forEach(item => {
            item?.author?.forEach(author => {
                authorMap[author] ? authorMap[author]++ : authorMap[author] = 1;
            });
        });
        this.setState({
            authorMap
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

    handleSelectAuthors = (e: React.MouseEvent, author: string) => {
        e.stopPropagation();

        if (e.buttons === 0) {
            if (e.ctrlKey) {
                const selectedAuthors = toggleArrayItem(this.state.selectedAuthors, author);

                this.setState({
                    selectedAuthors,
                    lastSelectedAuthor: author,
                    lastSelectedAuthors: selectedAuthors
                });
            }
            else if (e.shiftKey) {
                const { lastSelectedAuthor, lastSelectedAuthors } = this.state;
                const lastSelectedIndex = this.authorsArray.findIndex(authorItem => authorItem[0] === lastSelectedAuthor);
                const curSelectedIndex = this.authorsArray.findIndex(authorItem => authorItem[0] === author);

                if (lastSelectedIndex === curSelectedIndex) {
                    return;
                }
                else {
                    const newSelectedAuthors = this.authorsArray
                        .map((authorItem, index) => {
                            const startIndex = Math.min(curSelectedIndex, lastSelectedIndex);
                            const endIndex = Math.max(curSelectedIndex, lastSelectedIndex);

                            if ((index <= endIndex) && (index >= startIndex)) return authorItem[0];
                            return null;
                        })
                        .filter(isString);

                    this.setState({
                        selectedAuthors: Array.from(new Set([...lastSelectedAuthors, ...newSelectedAuthors]))
                    });
                }
            }
            else {
                EventHub.emit(eventConstant.SELECT_AUTHORS, [author]);

                this.setState({
                    selectedAuthors: [author],
                    lastSelectedAuthor: author,
                    lastSelectedAuthors: [author]
                });
            }
        }
    }

    handleDragNodeStart = (e: React.DragEvent, author: string) => {
        e.stopPropagation();
        let transferAuthors: string = '';

        const curSelectedAuthors = this.state.selectedAuthors;
        if (curSelectedAuthors.includes(author)) transferAuthors = curSelectedAuthors.join('?|?');
        else transferAuthors = author;

        const dt = e.dataTransfer;
        const img = new Image();
        dt.setDragImage(img, 0, 0);
        dt.setData('authors', transferAuthors);
    }

    cancelSelected = () => {
        this.setState({
            selectedAuthors: []
        });
    }

    renderContent = () => {
        const sortMode = this.state.sortMode;
        let authorsArray = Object.entries(this.state.authorMap);

        if (sortMode.includes('count')) {
            authorsArray = authorsArray.sort((authorItemA, authorItemB) => authorItemB[1] - authorItemA[1]);
        }
        else {
            authorsArray = authorsArray.sort((authorItemA, authorItemB) => naturalCompare(authorItemA[0], authorItemB[0]));
        }

        if (!sortMode.toLowerCase().includes('desc')) {
            authorsArray.reverse();
        }

        if (this.state.searchData !== '') {
            authorsArray = authorsArray.filter(authorItem => authorItem[0].includes(this.state.searchData));
        }

        this.authorsArray = authorsArray;

        return <div className={style.authorsWrapper}>
            {
                authorsArray.map(authorItem => {
                    const authorName = authorItem[0];
                    const authorCount = authorItem[1];

                    return <div
                        onMouseEnter={() => { hintMainText(authorName); }}
                        onDragStart={(e: React.DragEvent) => { this.handleDragNodeStart(e, authorName); }}
                        draggable
                        className={`${style.authorItem} ${this.state.selectedAuthors.includes(authorName) ? style.selected : ''}`}
                        onClick={(e: React.MouseEvent) => { this.handleSelectAuthors(e, authorName); }}
                        key={authorName}
                    >
                        <div className={`${style.authorName} text-ellipsis-1`}>{authorName}</div>
                        <div>{authorCount}</div>
                    </div>;
                })
            }
        </div>;
    }

    render(): JSX.Element {
        const FilterBar = this.renderFilterBar;
        const Content = this.renderContent;

        return <div className={`${style.authorsTreeWrapper} medium-scrollbar text-ellipsis-1`} onClick={this.cancelSelected}>
            <FilterBar />
            <Content />
        </div>;
    }
}
