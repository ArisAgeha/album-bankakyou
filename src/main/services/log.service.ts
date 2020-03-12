import { injectable } from '@/common/decorator/injectable';
import fs from 'fs';
import path from 'path';
import { isObject } from '@/common/types';

@injectable
export class LogService {
    constructor() {}

    log(message: any): void {
        if (isObject) message = JSON.stringify(message, null, 4);
        console.log(message);
        const p = path.resolve('C:/Users/87725/Desktop/debugger/log.txt');
        if (fs.existsSync(p)) fs.appendFileSync(p, `\r\n\r\n${message}`);
        else fs.writeFileSync(p, message);
    }

    warn(message: any): void {
        console.warn(message);
    }

    error(message: any): void {
        console.error(message);
    }
}
