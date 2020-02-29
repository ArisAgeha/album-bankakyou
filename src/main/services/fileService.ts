import fs from 'fs';
import path from 'path';
import { injectable } from '@/common/decorator/injectable';
import { LogService } from './logService';

@injectable
export class FileService {
    constructor(private readonly logService: LogService) {}

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

    pr(...args: string[]): string {
        return path.resolve(...args);
    }
}
