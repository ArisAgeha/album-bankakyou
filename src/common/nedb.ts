import DataStore from 'nedb-promises';

export const db: {
    [key in dbName]?: DataStore;
} = {
    collection: DataStore.create({ filename: '../userdata/collection' }),
    directory: DataStore.create({ filename: '../userdata/directoryqqq' }),
    tag: DataStore.create({ filename: '../userdata/tag' })
};

export type dbName = 'collection' | 'directory' | 'tag';
