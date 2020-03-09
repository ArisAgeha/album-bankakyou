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
    loadDir(dir: string, level: number = 0, time: number = 0): Promise<TreeNodeNormal> {
        return new Promise(resolveTop => {
            const dirInfo = fs.readdirSync(dir);

            const dirTitle = (dir.match(/[^\\/]+$/) || []).pop();
            const tree: TreeNodeNormal = {
                title: dirTitle,
                key: dir
            };

            let index: number = 0;
            const childrenDir: TreeNodeNormal[] = [];

            if (level < this.MAX_RECURSIVE_DEPTH) {
                const promises = dirInfo.map(
                    fileOrDirName =>
                        new Promise(resolve => {
                            const fileOrDirUrl = this.pr(dir, fileOrDirName);
                            fs.stat(fileOrDirUrl, (err, stats) => {
                                if (stats.isDirectory()) {
                                    this.loadDir(fileOrDirUrl, level + 1, index++).then(val => {
                                        childrenDir.push(val);
                                    });
                                }
                                resolve();
                            });
                        })
                );
                Promise.all(promises).then(() => {
                    if (childrenDir.length > 0) {
                        if (tree.children && isArray(tree.children)) tree.children.splice(0, 0, ...childrenDir);
                        else tree.children = childrenDir;
                    }
                    resolveTop(tree);
                });
            } else {
                resolveTop(tree);
            }
        });
    }

    async openDirByImporter(dir: string): Promise<void> {
        const tree = await this.loadDir(dir);
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
