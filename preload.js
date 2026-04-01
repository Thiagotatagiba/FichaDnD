const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    novoPersonagem: () => ipcRenderer.send('novo-personagem'),
    importarPersonagem: () => ipcRenderer.invoke('importar-personagem'),
    receberPersonagem: (callback) => {
        const listener = (_event, data) => callback(data);
        ipcRenderer.on('carregar-personagem', listener);

        return () => {
            ipcRenderer.removeListener('carregar-personagem', listener);
        };
    }
});
