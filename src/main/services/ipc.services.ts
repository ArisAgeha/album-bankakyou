import { injectable } from '@/common/decorator/injectable';
import { ipcMain, BrowserWindow, app } from 'electron';
import { command } from '@/common/constant/command.constant';
import { FileService } from './file.service';
import { ConfigurationService } from './configuration.service';
import { windowsConfig } from '@/common/constant/config.constant';
import { isUndefinedOrNull, isBoolean } from '@/common/utils/types';
import path from 'path';
import fs, { mkdirSync } from 'fs';
import childProcess from 'child_process';
import { writeFile } from '@/common/utils/fsHelper';
const exec = childProcess.exec;

@injectable
export class IpcService {
    constructor(private readonly fileService: FileService, private readonly configurationService: ConfigurationService) {
    }

    initial(): void {
        ipcMain.on(command.TOGGLE_FULLSCREEN, (event: Electron.IpcMainEvent, setToFullscreen?: boolean) => {
            const window = BrowserWindow.getAllWindows()[0];
            const setVal = isBoolean(setToFullscreen) ? setToFullscreen : !window.isFullScreen();
            window.setFullScreen(setVal);
        });

        ipcMain.on(command.SAVE_UPDATE_FILE, async (
            event: any,
            data: { file: any; filename: string }
        ) => {
            const { file, filename } = data;
            console.log(data);
            const saveDirPath = path.resolve('./update');
            const savePath = path.resolve('./update', filename);
            if (!fs.existsSync(saveDirPath)) mkdirSync(saveDirPath);
            // TODO
            if (fs.existsSync(savePath)) return;

            await writeFile(savePath, file);

            file.pipe(fs.createWriteStream(savePath));

            console.log('---');
            this.installNewVersion(filename);
        });
    }

    installNewVersion(programName: string) {
        console.log('====');
        console.log(programName);
        console.log(fs.existsSync(path.resolve('./update', programName)));
        if (!programName || fs.existsSync(path.resolve('./update', programName))) return;

        const cmdStr = `start ${programName}`;
        const cmdPath = path.resolve('./update');
        let workerProcess;

        // 执行命令行，如果命令不需要路径，或就是项目根目录，则不需要cwd参数：
        workerProcess = exec(cmdStr, { cwd: cmdPath });
        // 不受child_process默认的缓冲区大小的使用方法，没参数也要写上{}：workerProcess = exec(cmdStr, {})

        // 打印正常的后台可执行程序输出
        workerProcess.stdout.on('data', function(data) {
            console.log('stdout: ' + data);
        });

        // 打印错误的后台可执行程序输出
        workerProcess.stderr.on('data', function(data) {
            console.log('stderr: ' + data);
        });

        // 退出之后的输出
        workerProcess.on('close', function(code) {
            console.log('out code：' + code);
        });

        app.quit();

    }

}