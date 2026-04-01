const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const PRELOAD_PATH = path.join(__dirname, 'preload.js');
let mainWindow;

function createAppWindow(options = {}) {
    const window = new BrowserWindow({
        show: false,
        webPreferences: {
            preload: PRELOAD_PATH,
            contextIsolation: true,
            nodeIntegration: false
        },
        ...options
    });

    let allowInitialNavigation = true;

    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    window.webContents.on('will-navigate', event => {
        if (!allowInitialNavigation) {
            event.preventDefault();
        }
    });
    window.webContents.once('did-finish-load', () => {
        allowInitialNavigation = false;
    });

    return window;
}

function createMainWindow() {
    mainWindow = createAppWindow({
        width: 400,
        height: 300,
        resizable: false
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.loadFile('index.html');
}

function createCharacterWindow() {
    const characterWindow = createAppWindow({
        width: 1200,
        height: 800
    });

    characterWindow.once('ready-to-show', () => {
        characterWindow.show();
    });

    characterWindow.loadFile('ficha/Ficha DnD - Tatagiba 1.0.html');
    return characterWindow;
}

app.whenReady().then(() => {
    createMainWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.on('novo-personagem', () => {
    createCharacterWindow();
});

ipcMain.handle('importar-personagem', async () => {
    const result = await dialog.showOpenDialog({
        filters: [{ name: 'JSON', extensions: ['json'] }],
        properties: ['openFile']
    });

    if (result.canceled) {
        return null;
    }

    const filePath = result.filePaths[0];
    const data = fs.readFileSync(filePath, 'utf-8');
    const characterWindow = createCharacterWindow();

    characterWindow.webContents.once('did-finish-load', () => {
        characterWindow.webContents.send('carregar-personagem', data);
    });

    return data;
});
