import { injectable } from '@/common/decorator/injectable';
import { ipcMain, BrowserWindow } from 'electron';
import { command } from '@/common/constant/command.constant';
import { FileService } from './file.service';
import { ConfigurationService } from './configuration.service';
import { windowsConfig } from '@/common/constant/config.constant';
import { isUndefinedOrNull, isBoolean } from '@/common/utils/types';

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
    }

}