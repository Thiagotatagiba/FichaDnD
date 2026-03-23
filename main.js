const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 400,
        height: 300,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

// NOVO PERSONAGEM
ipcMain.on('novo-personagem', () => {
    const ficha = new BrowserWindow({
        width: 1200,
        height: 800
    });

    ficha.loadFile('ficha/Ficha DnD - Tatagiba 1.0.html');
});

// IMPORTAR PERSONAGEM
ipcMain.handle('importar-personagem', async () => {
    const result = await dialog.showOpenDialog({
        filters: [{ name: 'JSON', extensions: ['json'] }],
        properties: ['openFile']
    });

    if (result.canceled) return;

    const filePath = result.filePaths[0];
    const data = fs.readFileSync(filePath, 'utf-8');

    const ficha = new BrowserWindow({
        width: 1200,
        height: 800
    });

    ficha.loadFile('ficha/Ficha DnD - Tatagiba 1.0.html');

    ficha.webContents.once('did-finish-load', () => {
        ficha.webContents.send('carregar-personagem', data);
    });
});