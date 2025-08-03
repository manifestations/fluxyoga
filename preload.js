const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // File system operations
    fs: {
      readDir: (dirPath) => ipcRenderer.invoke('fs:readDir', dirPath),
      readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
      writeFile: (filePath, content) => ipcRenderer.invoke('fs:writeFile', filePath, content),
      mkdir: (dirPath) => ipcRenderer.invoke('fs:mkdir', dirPath),
      deleteFile: (filePath) => ipcRenderer.invoke('fs:deleteFile', filePath),
    },
    
    // File dialogs
    showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
    
    // Python operations
    python: {
      preprocess: (config) => ipcRenderer.invoke('python:preprocess', config),
      generateCaption: (config) => ipcRenderer.invoke('generate-caption', config),
      generateBatchCaptions: (config) => ipcRenderer.invoke('python:generate-batch-captions', config),
      startTraining: (config) => ipcRenderer.invoke('start-training', config),
      cancelTraining: (processId) => ipcRenderer.invoke('cancel-training', processId),
      stopTraining: (trainingId) => ipcRenderer.invoke('stop-training', trainingId),
      pauseTraining: (trainingId) => ipcRenderer.invoke('pause-training', trainingId),
      resumeTraining: (trainingId) => ipcRenderer.invoke('resume-training', trainingId),
    },
    
    // Training progress callbacks
    onProgress: (callback) => {
      const subscription = (event, data) => callback(data);
      ipcRenderer.on('training-progress', subscription);
      ipcRenderer.on('python:progress', subscription);
      return () => {
        ipcRenderer.removeListener('training-progress', subscription);
        ipcRenderer.removeListener('python:progress', subscription);
      };
    },
    onTrainingUpdate: (callback) => {
      const subscription = (event, update) => callback(update);
      ipcRenderer.on('training:update', subscription);
      return () => {
        ipcRenderer.removeListener('training:update', subscription);
      };
    },
    
    // Store operations
    store: {
      get: (key) => ipcRenderer.invoke('electron-store-get', key),
      set: (key, val) => ipcRenderer.invoke('electron-store-set', [key, val]),
      delete: (key) => ipcRenderer.invoke('electron-store-delete', key),
      clear: () => ipcRenderer.invoke('electron-store-clear')
    }
  }
);
