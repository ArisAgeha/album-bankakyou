import fs from 'fs';
import path from 'path';
import { injectable } from '@/common/decorator/injectable';
import { LogService } from './log.service';
import chokidar from 'chokidar';

@injectable
export class ChokidarService {
    constructor(private readonly logService: LogService) {}

    private readonly _watch: {
        [key: string]: chokidar.FSWatcher;
    } = {};

    watchDir(dir: string) {
        const watcher = chokidar.watch(dir, { depth: 2 });
        watcher
            .on('add', path => console.log(`File ${path} has been added`))
            .on('change', path => console.log(`File ${path} has been changed`))
            .on('unlink', path => console.log(`File ${path} has been removed`))
            .on('addDir', path => console.log(`Directory ${path} has been added`))
            .on('unlinkDir', path => console.log(`Directory ${path} has been removed`))
            .on('error', error => console.log(`Watcher error: ${String(error)}`))
            .on('ready', () => console.log('Initial scan complete. Ready for changes'))
            .on('raw', (event, path, details) => {
                // internal
                console.log('Raw event info:', event, path, details);
            });

        this._watch[dir] = watcher;
    }

    unwatchDir(dir: string) {
        this._watch[dir]?.unwatch('*');
        delete this._watch[dir];
    }

    private pr(...args: string[]): string {
        return path.resolve(...args);
    }
}
