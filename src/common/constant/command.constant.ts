export const command = {
    // remote commands
    OPEN_DIR_BY_IMPORT: 'open-dir-by-import',

    // main renderer ipc commands
    SELECT_DIR_IN_TREE: 'select-dir-in-tree',
    RECEIVE_PICTURE: 'receive_picture',
    LOAD_SUB_DIRECTORY_INFO: 'load-sub-directory-info',
    REPLY_LOAD_SUB_DIRECTORY_INFO: 'reply-load-sub-directory-info',
    IMPORT_DIR: 'import-dir',
    EXPAND_DIR: 'expand-dir',
    RESPONSE_EXPAND_DIR: 'response-expand-dir',

    TOGGLE_FULLSCREEN: 'toggle-fullscreen',

    DOWNLOAD_UPDATE: 'download-update',
    DOWNLOAD_PROGRESS: 'download-progress',
    DOWNLOAD_FAIL: 'download-faile',
    DOWNLOAD_SUCCESS: 'download-success',

    SAVE_UPDATE_FILE: 'save-update-file',

    // worker renderer ipc commands
    WORKER_COMPRESS_IMAGE: 'worker_compress_image',
    WORKER_RETURN_COMPRESSED_IMAGE: 'worker_return_compressed_image'
};
