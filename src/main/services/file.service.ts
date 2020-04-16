import fs from 'fs';
import path from 'path';
import { injectable } from '@/common/decorator/injectable';
import { LogService } from './log.service';
import { isPicture, naturalCompare } from '@/common/utils/tools';
import { ipcMain, ipcRenderer } from 'electron';
import { mainWindow } from '@/main';
import { isArray, isUndefinedOrNull } from '@/common/utils/types';
import { command } from '@/common/constant/command.constant';
import { ITreeDataNode } from '@/renderer/components/directoryTree/directoryTree';
import { page } from '@/renderer/parts/mainView/mainView';
import { readdir, readdirWithFileTypes } from '@/common/utils/fsHelper';

@injectable
export class FileService {
    constructor(private readonly logService: LogService) { }

    MAX_RECURSIVE_DEPTH: number = 2;

    initial() {
        ipcMain.on(command.SELECT_DIR_IN_TREE, this.getAllPictureInDir);
        ipcMain.on(command.LOAD_SUB_DIRECTORY_INFO, this.getSubDirectoryInfo);
    }

    getAllPictureInDir = async (event: Electron.IpcMainEvent, data: page) => {
        const { id, type, title } = data;
        const url = id;
        const resolvedUrl = this.pr(url);
        const dirIsExists = fs.existsSync(resolvedUrl);
        if (!dirIsExists) return;

        const dirInfo = await readdirWithFileTypes(resolvedUrl);
        const pictureData = dirInfo
            .filter(dirent => dirent.isFile() && isPicture(dirent.name))
            .map((dirent, index) => ({ id: index, url: this.pr(url, dirent.name), title: dirent.name }))
            .sort((a, b) => naturalCompare(a.title, b.title));

        event.reply(command.RECEIVE_PICTURE, { id, data: pictureData, title, type });
    }

    getSubDirectoryInfo = (event: Electron.IpcMainEvent, dirs: string[]) => {
        const res: string[] = [];
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) return;
        });
    }

    /** directory tree methods */

    // invoke in import
    async loadDir(
        dir: string,
        options: {
            level: number;
            time?: number;
            keySuffix?: string;
        } = {
                level: 0,
                time: 0
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

        if (options.level < this.MAX_RECURSIVE_DEPTH) {
            const childrenDir: ITreeDataNode[] = (await Promise.all(
                dirInfo
                    .filter(dirent => dirent.isDirectory())
                    .map(async (dirent, index) => this.loadDir(this.pr(dir, dirent.name), { level: options.level + 1, time: index++, keySuffix: suffix }))
            ))
            .filter(node => !isUndefinedOrNull(node))
            .sort((a, b) => naturalCompare(a.title, b.title));

            if (childrenDir.length > 0) tree.children = childrenDir;
        }

        return tree;
    }

    async openDirByImport(dir: string, auto: boolean): Promise<void> {
        const tree = await this.loadDir(dir);
        mainWindow.webContents.send(command.OPEN_DIR_BY_IMPORT, {
            autoImport: auto,
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
