const { contextBridge, ipcRenderer } = require('electron');
const { dialog } = require('@electron/remote');

// Expose file system APIs
contextBridge.exposeInMainWorld('api', {
  fs: {
    readDir: (dirPath) => ipcRenderer.invoke('fs:readDir', dirPath),
    readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
    writeFile: (filePath, content) => ipcRenderer.invoke('fs:writeFile', filePath, content),
    mkdir: (dirPath) => ipcRenderer.invoke('fs:mkdir', dirPath),
  },
  store: {
    get: (key) => ipcRenderer.invoke('store:get', key),
    set: (key, value) => ipcRenderer.invoke('store:set', key, value),
  },
  python: {
    preprocess: (config) => ipcRenderer.invoke('python:preprocess', config),
    generateCaption: (config) => ipcRenderer.invoke('python:generate-caption', config),
  },
  onProgress: (callback) => {
    const subscription = (event, value) => callback(value);
    ipcRenderer.on('python:progress', subscription);
    return () => {
      ipcRenderer.removeListener('python:progress', subscription);
    };
  },
  showOpenDialog: (options) => dialog.showOpenDialog(options),
});
