import { injectable } from '@/common/decorator/injectable';
import { ipcMain, BrowserWindow, app } from 'electron';
import { command } from '@/common/constant/command.constant';
import { FileService } from './file.service';
import { ConfigurationService } from './configuration.service';
import { windowsConfig } from '@/common/constant/config.constant';
import { isUndefinedOrNull, isBoolean } from '@/common/utils/types';
import path from 'path';
import fs, { mkdirSync, createWriteStream } from 'fs';
import childProcess from 'child_process';
import { writeFile } from '@/common/utils/fsHelper';
import axios from 'axios';
import { throttle } from '@/common/decorator/decorator';
import { extractDirNameFromUrl } from '@/common/utils/businessTools';
const exec = childProcess.exec;

@injectable
export class IpcService {
    constructor(private readonly fileService: FileService, private readonly configurationService: ConfigurationService) {
    }

    initial(): void {
        ipcMain.on(command.TOGGLE_FULLSCREEN, this.toggleFullscreen);

        ipcMain.on(command.DOWNLOAD_UPDATE, this.downloadUpdate);
    }

    saveFileToFsAndInstall = async (file: any, filename: string) => {
        const saveDirPath = path.resolve('./update');
        const savePath = path.resolve('./update', filename);
        if (!fs.existsSync(saveDirPath)) mkdirSync(saveDirPath);
        // TODO
        if (fs.existsSync(savePath)) return;

        await writeFile(savePath, file);

        file.pipe(fs.createWriteStream(savePath));

        this.installNewVersion(filename);

    }

    installNewVersion(programName: string) {
        if (!programName || !fs.existsSync(path.resolve('./update', programName))) return;

        const cmdStr = `start ${programName}`;
        const cmdPath = path.resolve('./update');
        let workerProcess;

        workerProcess = exec(cmdStr, { cwd: cmdPath });

        workerProcess.stdout.on('readable', function(data: any) {
            app.quit();
        });

        workerProcess.stdout.on('data', function(data) {
            app.quit();
        });

        workerProcess.on('close', function(code) {
            app.quit();
        });

        setTimeout(() => {
            app.quit();
        }, 3000);
    }

    downloadUpdate = async (event: Electron.IpcMainEvent, url: string) => {
        const filename = extractDirNameFromUrl(url);
        const outputLocationPath = path.resolve('./update', filename);
        const writer = createWriteStream(outputLocationPath);

        const response = await axios({
            method: 'get',
            url,
            responseType: 'stream'
        });

        let curLength = 0;
        const { data, headers } = response;
        const totalLength = headers['content-length'];

        data.on('data', (chunk: any) => {
            curLength += chunk.length;
            const percentage = Math.floor(curLength / totalLength * 10000) / 100;
            this.handleProgress(event, percentage);
        });

        data.pipe(writer);

        let error: Error = null;
        writer.on('error', err => {
            error = err;
            writer.close();
        });
        writer.on('close', () => {
            if (!error) {
                event.reply(command.DOWNLOAD_SUCCESS);
                this.installNewVersion(filename);
            }
            else {
                event.reply(command.DOWNLOAD_FAIL);
            }
        });
    }

    @throttle(500)
    handleProgress(event: any, percentage: number) {
        event.reply(command.DOWNLOAD_PROGRESS, percentage);
    }

    toggleFullscreen = (event: any, setToFullscreen?: boolean) => {
        const window = BrowserWindow.getAllWindows()[0];
        const setVal = isBoolean(setToFullscreen) ? setToFullscreen : !window.isFullScreen();
        window.setFullScreen(setVal);
    }
}