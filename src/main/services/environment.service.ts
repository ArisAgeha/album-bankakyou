import { injectable } from '@/common/decorator/injectable';
import { FileService } from './file.service';
import fs from 'fs';
import path from 'path';

@injectable
export class EnvironmentService {
    constructor(private readonly fileService: FileService) {}

    initial(): void {
        this.initCfgDoc();
    }

    initCfgDoc() {
        const dirPath = path.resolve('configuration');
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath);
            fs.mkdirSync(path.resolve(dirPath, 'user'));
        }
    }
}
