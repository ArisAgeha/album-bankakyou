import fs from 'fs';
import path from 'path';
import { injectable } from '@/common/decorator/injectable';
import { LogService } from './log.service';
import chokidar from 'chokidar';
import { isPicture } from '@/common/utils';
import { ipcMain, ipcRenderer } from 'electron';
import { TreeNodeNormal } from 'antd/lib/tree/Tree';
import { mainWindow } from '@/main';
import { isArray } from '@/common/types';

@injectable
export class FileService {
    constructor(private readonly logService: LogService) {}

    MAX_RECURSIVE_DEPTH: number = 2;

    /** directory tree methods */

    // invoke in import
    recurseDir(dir: string, level: number = 0, time: number = 0): TreeNodeNormal {
        const dirInfo = fs.readdirSync(dir);

        const dirTitle = (dir.match(/[^\\/]+$/) || []).pop();
        const tree: TreeNodeNormal = {
            title: dirTitle,
            key: dir
        };

        let index: number = 0;
        const childrenDir: TreeNodeNormal[] = [];

        if (level < this.MAX_RECURSIVE_DEPTH) {
            dirInfo.forEach((fileOrDirName: string) => {
                const fileOrDirUrl = this.pr(dir, fileOrDirName);
                if (fs.statSync(fileOrDirUrl).isDirectory()) {
                    childrenDir.push(this.recurseDir(fileOrDirUrl, level + 1, index++));
                }
            });
            if (childrenDir.length > 0) {
                if (tree.children && isArray(tree.children)) tree.children.splice(0, 0, ...childrenDir);
                else tree.children = childrenDir;
            }
        }

        return tree;
    }

    openDirByImporter(dir: string): void {
        const tree = this.recurseDir(dir);
        mainWindow.webContents.send('open-dir-by-importer', tree);
    }
    /** configuration methods */
    getDirInfoSync(url: string): string[] {
        return fs.readdirSync(this.pr(url));
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
