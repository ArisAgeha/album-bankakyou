import DataStore from 'nedb-promises';
import { readingDirection } from '@/renderer/parts/mainView/pictureView/doublePage/doublePage';
import { readingMode, pageReAlign } from '@/renderer/parts/manageBar/manageBar';
import { scrollModeDirection } from '@/renderer/parts/mainView/pictureView/scrollList/scrollList';

export const db: {
    [key in DbName]?: DataStore;
} = {
    collection: DataStore.create({ filename: '../userdata/collection' }),
    directory: DataStore.create({ filename: '../userdata/directory' }),
    tag: DataStore.create({ filename: '../userdata/tag' }),
    author: DataStore.create({ filename: '../userdata/author' })
};

export type DbName = 'collection' | 'directory' | 'tag' | 'author';

export type Directory = {
    url: string;
    tag?: string[];
    author?: string[];
    readingDirection?: readingDirection;
    readingMode?: readingMode;
    scrollModeDirection?: scrollModeDirection;
    pageReAlign?: pageReAlign;
};

export type Tag = {
    tag_name: string;
};

export type Author = {
    author_name: string;
};