import fs from 'fs';
import path from 'path';
import { injectable } from '@/common/decorator/injectable';
import { LogService } from './log.service';
import { isPicture, naturalCompare, extractDirNameFromUrl } from '@/common/utils/tools';
import { ipcMain, ipcRenderer } from 'electron';
import { mainWindow } from '@/main';
import { isArray, isUndefinedOrNull } from '@/common/utils/types';
import { command } from '@/common/constant/command.constant';
import { ITreeDataNode } from '@/renderer/components/directoryTree/directoryTree';
import { page, LoadPictureRequest } from '@/renderer/parts/mainView/mainView';
import { readdir, readdirWithFileTypes } from '@/common/utils/fsHelper';
import { picture } from '@/renderer/parts/mainView/pictureView/pictureView';

@injectable
export class FileService {
    constructor(private readonly logService: LogService) { }

    MAX_RECURSIVE_DEPTH = 999;

    initial() {
        ipcMain.on(command.SELECT_DIR_IN_TREE, this.getAllPictureInDir);
        ipcMain.on(command.LOAD_SUB_DIRECTORY_INFO, this.getSubDirectoryInfo);
        ipcMain.on(command.IMPORT_DIR, (event: Electron.IpcMainEvent, data: { dir: string }) => {
            const { dir } = data;
            this.openDirByImport(dir);
        });
        ipcMain.on(command.EXPAND_DIR, (
            event: Electron.IpcMainEvent,
            data: {
                url: string;
                loadOptions: {
                    level: number;
                    keySuffix: string;
                    maxDepth: number;
                };
            }
        ) => {
            this.getSingleLevelDirInfo(event, data);
        });
    }

    getSingleLevelDirInfo = async (
        event: Electron.IpcMainEvent,
        data: {
            url: string;
            loadOptions: {
                level: number;
                keySuffix: string;
                maxDepth: number;
            };
        }
    ) => {
        const { url, loadOptions } = data;
        const tree = await this.loadDir(url, loadOptions);
        event.reply(command.RESPONSE_EXPAND_DIR, tree);
    }

    private readonly getAllPictureInDir = async (event: Electron.IpcMainEvent, data: LoadPictureRequest) => {
        const { id, title, urls, recursiveDepth = 0 } = data;

        const allPictureData: picture[] = [];

        let loopTime = 0;
        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            const resolvedUrl = this.pr(url);
            const dirIsExists = fs.existsSync(resolvedUrl);
            if (!dirIsExists) return;

            await this.getPicture(url, allPictureData, { maxRecursiveDepth: recursiveDepth, curDepth: 0 });
            loopTime++;
        }
        event.reply(command.RECEIVE_PICTURE, { id, data: allPictureData, title });
    }

    private readonly getPicture = async (url: string, pictureStore: picture[] = [], options: { curDepth: number; maxRecursiveDepth: number }) => {
        const { maxRecursiveDepth, curDepth } = options;
        const resolvedUrl = this.pr(url);

        const dirIsExists = fs.existsSync(resolvedUrl);
        if (!dirIsExists) return;

        const dirInfo = await readdirWithFileTypes(resolvedUrl);
        const dirInfoWithNaturalOrder = dirInfo.sort((a, b) => naturalCompare(a.name, b.name));

        for (let i = 0; i < dirInfoWithNaturalOrder.length; i++) {
            const dirent = dirInfoWithNaturalOrder[i];
            if (dirent.isFile() && isPicture(dirent.name)) {
                pictureStore.push({ id: `${url}-${i}`, url: this.pr(url, dirent.name), title: dirent.name });
            }
            else if (dirent.isDirectory() && curDepth < maxRecursiveDepth) {
                await this.getPicture(this.pr(url, dirent.name), pictureStore, { maxRecursiveDepth, curDepth: curDepth + 1 });
            }
        }
    }

    private readonly getSubDirectoryInfo = async (event: Electron.IpcMainEvent, urls: string[]) => {
        const allDirectory: string[] = [];

        (this as any).test = 0;
        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            const resolvedUrl = this.pr(url);
            const dirIsExists = fs.existsSync(resolvedUrl);
            if (!dirIsExists) return;

            await this.getDirectory(url, allDirectory);
        }
        event.reply(command.REPLY_LOAD_SUB_DIRECTORY_INFO, { urls: allDirectory });
    }

    private readonly getDirectory = async (url: string, allDirectory: string[]) => {
        (this as any).test++;
        const resolvedUrl = this.pr(url);
        if (allDirectory.includes(resolvedUrl)) return;
        allDirectory.push(resolvedUrl);

        const dirIsExists = fs.existsSync(resolvedUrl);
        if (!dirIsExists) return;

        const dirInfo = await readdirWithFileTypes(resolvedUrl);
        const dirInfoWithNaturalOrder = dirInfo.sort((a, b) => naturalCompare(a.name, b.name));

        for (let i = 0; i < dirInfoWithNaturalOrder.length; i++) {
            const dirent = dirInfoWithNaturalOrder[i];
            if (dirent.isDirectory()) {
                await this.getDirectory(this.pr(url, dirent.name), allDirectory);
            }
        }
    }

    /** directory tree methods */

    // invoke in import
    async loadDir(
        dir: string,
        options: {
            level: number;
            time?: number;
            keySuffix?: string;
            maxDepth?: number;
        } = {
                level: 0,
                time: 0,
                maxDepth: this.MAX_RECURSIVE_DEPTH // max recursive depth, no limit if maxDepth === -1;
            }
    ): Promise<ITreeDataNode> {
        if (!options.time) options.time = 0;
        if (!fs.existsSync(dir)) return null;
        const dirInfo = (await readdirWithFileTypes(dir));

        const dirTitle = (dir.match(/[^\\/]+$/) || []).pop();
        const suffix = options.keySuffix || `|${dirTitle}`;
        const tree: ITreeDataNode = {
            title: dirTitle,
            key: `${dir}${suffix}`
        };

        const { level } = options;
        const maxDepth = options.maxDepth || 2;
        if (maxDepth === -1 || (level < maxDepth)) {
            const childrenDir: ITreeDataNode[] = (await Promise.all(
                dirInfo
                    .filter(dirent => dirent.isDirectory())
                    .map(async (dirent, index) => this.loadDir(this.pr(dir, dirent.name), { level: options.level + 1, time: index++, keySuffix: suffix, maxDepth }))
            ))
                .filter(node => !isUndefinedOrNull(node))
                .sort((a, b) => naturalCompare(a.title, b.title));

            if (childrenDir.length > 0) tree.children = childrenDir;
        }

        return tree;
    }

    async openDirByImport(dir: string): Promise<void> {
        const tree = await this.loadDir(dir);
        mainWindow.webContents.send(command.OPEN_DIR_BY_IMPORT, {
            tree
        });
    }

    /** configuration methods */
    getDirInfoSync(url: string): string[] {
        if (fs.existsSync(this.pr(url))) return fs.readdirSync(this.pr(url));
        return null;
    }

    loadJsonSync(...url: string[]): any {
        const absUrl: string = path.resolve(...url);
        try {
            const buffer = fs.readFileSync(absUrl) as unknown;
            return JSON.parse(buffer as string);
        } catch (err) {
            this.logService.error(err);
            throw err;
        }
    }

    writeJson(url: string, id: string, content: any) {
        const absUrl: string = path.resolve(url, id) + '.json';
        const writeString: string = typeof content === 'string' ? content : JSON.stringify(content, null, 4);
        fs.writeFile(absUrl, writeString, () => {
            this.logService.log('update successfully');
        });
    }

    private pr(...args: string[]): string {
        return path.resolve(...args);
    }
}
