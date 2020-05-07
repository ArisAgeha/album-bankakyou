import { injectable } from '@/common/decorator/injectable';
import fs from 'fs';
import path from 'path';
import { isObject } from '@/common/utils/types';

@injectable
export class LogService {
    constructor() {}

    log(message: any): void {
    }

    warn(message: any): void {
        console.warn(message);
    }

    error(message: any): void {
        console.error(message);
    }
}
