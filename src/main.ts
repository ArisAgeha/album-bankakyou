import { app, BrowserWindow, Menu } from 'electron';
import { CodeMain } from './main/code/main';
declare const MAIN_WINDOW_WEBPACK_ENTRY: any;
declare const WORKER_WINDOW_WEBPACK_ENTRY: any;
require('update-electron-app')({
    repo: 'ArisAgeha/album-bankakyou',
    updateInterval: '5 minutes'
});

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    // eslint-disable-line global-require
    app.quit();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: Electron.BrowserWindow;
let workerWindow: Electron.BrowserWindow;

const onReady: () => void = (): void => {
    Menu.setApplicationMenu(null);
    const codeMain: CodeMain = new CodeMain();
    codeMain.main();
    // Create the browser window.

    createMainWindow();
    // createWorkerWindow();
};

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1600,
        height: 900,
        fullscreen: false,
        webPreferences: {
            nodeIntegration: true,
            webSecurity: false
        }
    });

    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

    if (!app.isPackaged) mainWindow.webContents.openDevTools();

    mainWindow.on('closed', () => {
        mainWindow = null;
        workerWindow = null;
    });
}

function createWorkerWindow() {
    workerWindow = new BrowserWindow({
        width: 800,
        height: 450,
        fullscreen: false,
        webPreferences: {
            nodeIntegration: true,
            webSecurity: false
        }
    });

    workerWindow.loadURL(WORKER_WINDOW_WEBPACK_ENTRY);

    if (!app.isPackaged) mainWindow.webContents.openDevTools();

    workerWindow.on('closed', () => {
        workerWindow = null;
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', onReady);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        onReady();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

export { mainWindow };
