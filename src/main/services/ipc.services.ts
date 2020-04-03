import { injectable } from '@/common/decorator/injectable';
import { ipcMain } from 'electron';
import { command } from '@/common/constant/command.constant';
import { workerWindow, mainWindow } from '@/main';
import { ICompressImageParams, ICompressImageReturn } from '@/worker/electronWorker';

@injectable
export class IpcService {
    constructor() {}

    initial(): void {
        this.listenMainRendererIpc();
        this.listenWorkerRendererIpc();
    }

    listenMainRendererIpc() {
        ipcMain.on(command.WORKER_COMPRESS_IMAGE, (event: Electron.IpcMainEvent, data: ICompressImageParams) => {
            workerWindow.webContents.send(command.WORKER_COMPRESS_IMAGE, data);
        });
    }

    listenWorkerRendererIpc() {
        ipcMain.on(command.WORKER_RETURN_COMPRESSED_IMAGE, (event: Electron.IpcMainEvent, data: ICompressImageReturn) => {
            mainWindow.webContents.send(command.WORKER_RETURN_COMPRESSED_IMAGE, data);
        });
    }
}
