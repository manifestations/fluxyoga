const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const { PythonShell } = require('python-shell');
const sharp = require('sharp');
const { getPythonExecutablePath, getScriptsPath, getSdScriptsPath } = require('./utils/python-path');

// Load application configuration
const appConfig = require('./app.config.js');

// Initialize electron store
const store = new Store();

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: appConfig.electron.window.width,
    height: appConfig.electron.window.height,
    minWidth: appConfig.electron.window.minWidth,
    minHeight: appConfig.electron.window.minHeight,
    title: appConfig.app.title,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // In development, load from Vite dev server
  if (process.argv.includes('--dev')) {
    const devUrl = `http://${appConfig.development.host}:${appConfig.development.port}`;
    console.log(`Loading development server from: ${devUrl}`);
    mainWindow.loadURL(devUrl);
    
    if (appConfig.electron.showDevTools) {
      mainWindow.webContents.openDevTools();
    }
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for file dialogs
ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(options);
  return result;
});

// File system operations
ipcMain.handle('fs:readDir', async (event, dirPath) => {
  try {
    const files = await fs.promises.readdir(dirPath);
    return files;
  } catch (error) {
    console.error('Error reading directory:', error);
    throw error;
  }
});

ipcMain.handle('fs:readFile', async (event, filePath) => {
  try {
    const content = await fs.promises.readFile(filePath, 'utf8');
    return content;
  } catch (error) {
    console.error('Error reading file:', error);
    throw error;
  }
});

ipcMain.handle('fs:writeFile', async (event, filePath, content) => {
  try {
    await fs.promises.writeFile(filePath, content, 'utf8');
  } catch (error) {
    console.error('Error writing file:', error);
    throw error;
  }
});

ipcMain.handle('fs:mkdir', async (event, dirPath) => {
  try {
    await fs.promises.mkdir(dirPath, { recursive: true });
  } catch (error) {
    console.error('Error creating directory:', error);
    throw error;
  }
});

ipcMain.handle('fs:deleteFile', async (event, filePath) => {
  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
});

// Store operations
ipcMain.handle('electron-store-get', async (event, key) => {
  return store.get(key);
});

ipcMain.handle('electron-store-set', async (event, [key, val]) => {
  store.set(key, val);
});

ipcMain.handle('electron-store-delete', async (event, key) => {
  store.delete(key);
});

ipcMain.handle('electron-store-clear', async (event) => {
  store.clear();
});

// Python operations
ipcMain.handle('python:preprocess', async (event, config) => {
  try {
    // Use the dynamic Python executable path
    const pythonExecutable = getPythonExecutablePath();
    
    const options = {
      mode: 'text',
      pythonPath: pythonExecutable,
      scriptPath: getScriptsPath(),
      args: [
        '--input_dir', config.inputDir,
        '--output_dir', config.outputDir,
        '--target_width', config.targetWidth.toString(),
        '--target_height', config.targetHeight.toString(),
        '--resize_mode', config.resizeMode,
        ...(config.autoContrast ? ['--auto_contrast'] : []),
        ...(config.normalize ? ['--normalize'] : []),
        ...(config.sharpen ? ['--sharpen'] : []),
      ],
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
        PYTHONUTF8: '1'
      }
    };

    return new Promise((resolve, reject) => {
      let pyshell = new PythonShell('preprocess_images.py', options);

      pyshell.on('message', (message) => {
        // Send progress updates to renderer
        event.sender.send('python:progress', message);
      });

      pyshell.end((err) => {
        if (err) {
          console.error('Python preprocessing error:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Error preprocessing images:', error);
    throw error;
  }
});

ipcMain.handle('python:generate-batch-captions', async (event, config) => {
  try {
    // Use the dynamic Python executable path
    const pythonExecutable = getPythonExecutablePath();
    
    const options = {
      mode: 'text',
      pythonPath: pythonExecutable,
      scriptPath: getScriptsPath(),
      args: [
        '--source_folder', config.sourceFolder,
        '--model', config.model,
        ...(config.template ? ['--template', config.template] : []),
        ...(config.overwrite ? ['--overwrite'] : []),
        ...(config.style ? ['--style', config.style] : []),
        ...(config.maxTokens ? ['--max_tokens', config.maxTokens.toString()] : []),
      ],
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
        PYTHONUTF8: '1'
      }
    };

    return new Promise((resolve, reject) => {
      let processedFiles = [];
      let totalProcessed = 0;
      
      console.log('Starting Python script with options:', options);
      console.log('Python path:', pythonExecutable);
      console.log('Script path:', path.join(__dirname, 'scripts', 'batch_caption.py'));
      
      let pyshell = new PythonShell('batch_caption.py', options);

      pyshell.on('message', (message) => {
        console.log('Python output:', message);
        try {
          const data = JSON.parse(message);
          if (data.type === 'progress') {
            event.sender.send('python:progress', data);
          } else if (data.type === 'file_processed') {
            processedFiles.push(data.filename);
            totalProcessed++;
            event.sender.send('python:progress', data);
          } else if (data.type === 'summary') {
            totalProcessed = data.processed;
            processedFiles = data.processed_files || processedFiles;
          } else if (data.type === 'error') {
            console.error('Python script error:', data.message);
            event.sender.send('python:progress', data);
          }
        } catch (e) {
          // Handle non-JSON messages as progress
          console.log('Non-JSON message:', message);
          event.sender.send('python:progress', { type: 'progress', message: message });
        }
      });

      pyshell.on('stderr', (data) => {
        console.error('Python stderr:', data.toString());
      });

      pyshell.end((err) => {
        if (err) {
          console.error('Python caption generation error:', err);
          reject(err);
        } else {
          console.log('Python script completed successfully');
          resolve({ processedFiles, totalProcessed });
        }
      });
    });
  } catch (error) {
    console.error('Error generating batch captions:', error);
    throw error;
  }
});

// Dataset operations
ipcMain.handle('scan-directory', async (event, dirPath) => {
  try {
    const files = await fs.promises.readdir(dirPath);
    const imageFiles = files.filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));
    
    const results = await Promise.all(
      imageFiles.map(async (file) => {
        const filePath = path.join(dirPath, file);
        try {
          const metadata = await sharp(filePath).metadata();
          return {
            name: file,
            path: filePath,
            metadata: {
              width: metadata.width,
              height: metadata.height,
              format: metadata.format,
              size: (await fs.promises.stat(filePath)).size,
              hasEXIF: !!metadata.exif,
            },
          };
        } catch (error) {
          console.error(`Error processing ${file}:`, error);
          return null;
        }
      })
    );
    
    return results.filter(result => result !== null);
  } catch (error) {
    console.error('Error scanning directory:', error);
    throw error;
  }
});

ipcMain.handle('generate-caption', async (event, config) => {
  try {
    // Use the dynamic Python executable path
    const pythonExecutable = getPythonExecutablePath();
    
    // Initialize the LLM based on config.model
    const pythonScript = config.model === 'gpt-4-vision' ? 'generate_gpt4v_caption.py' : 'generate_blip_caption.py';
    
    const options = {
      mode: 'text',
      pythonPath: pythonExecutable,
      scriptPath: getScriptsPath(),
      args: [
        '--image_path', config.imagePath,
        '--max_tokens', (config.maxTokens || 150).toString(),
        '--style', config.style || 'detailed',
        ...(config.focus ? ['--focus', ...config.focus] : []),
      ],
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
        PYTHONUTF8: '1'
      }
    };

    return new Promise((resolve, reject) => {
      let caption = '';
      let pyshell = new PythonShell(pythonScript, options);

      pyshell.on('message', (message) => {
        caption = message;
      });

      pyshell.end((err) => {
        if (err) {
          console.error('Caption generation error:', err);
          reject(err);
        } else {
          resolve(caption);
        }
      });
    });
  } catch (error) {
    console.error('Error generating caption:', error);
    throw error;
  }
});

ipcMain.handle('export-dataset', async (event, { dataset, format, outputPath }) => {
  try {
    switch (format) {
      case 'json':
        await fs.promises.writeFile(
          path.join(outputPath, 'dataset.json'),
          JSON.stringify(dataset, null, 2)
        );
        break;
      
      case 'csv':
        const csvContent = dataset.images
          .map(img => `"${img.filename}","${img.caption}","${img.tags.join(',')}"`)
          .join('\\n');
        await fs.promises.writeFile(
          path.join(outputPath, 'dataset.csv'),
          `filename,caption,tags\\n${csvContent}`
        );
        break;
      
      case 'txt':
        await Promise.all(
          dataset.images.map(img =>
            fs.promises.writeFile(
              path.join(outputPath, `${path.parse(img.filename).name}.txt`),
              `${img.caption}\\n\\nTags: ${img.tags.join(', ')}`
            )
          )
        );
        break;
      
      case 'kohya':
        // Create metadata.jsonl
        const metadata = dataset.images.map(img => ({
          file: img.filename,
          text: img.caption,
          tags: img.tags,
        }));
        await fs.promises.writeFile(
          path.join(outputPath, 'metadata.jsonl'),
          metadata.map(m => JSON.stringify(m)).join('\\n')
        );
        break;
    }
  } catch (error) {
    console.error('Error exporting dataset:', error);
    throw error;
  }
});

// IPC handlers for training operations
ipcMain.handle('start-training', async (event, config) => {
  try {
    // Use the dynamic Python executable path
    const pythonExecutable = getPythonExecutablePath();
    
    const options = {
      mode: 'text',
      encoding: 'utf8',
      pythonPath: pythonExecutable,
      pythonOptions: ['-u', '-X', 'utf8'], // unbuffered output + UTF-8 mode
      scriptPath: config.scriptPath || getSdScriptsPath(),
      args: config.args || [],
      cwd: process.cwd(), // Always use project root as working directory
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
        PYTHONUTF8: '1'
      }
    };

    console.log('Starting training with script:', config.script);
    console.log('Python path:', pythonExecutable);
    console.log('Script path:', options.scriptPath);
    console.log('Arguments:', config.args);

    let pyshell = new PythonShell(config.script || 'flux_train_network.py', options);
    
    // Generate unique process ID
    const processId = `training_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    pyshell.on('message', (message) => {
      console.log('Training output:', message);
      // Send training progress to renderer
      event.sender.send('training-progress', {
        processId,
        type: 'progress',
        message: message,
        timestamp: new Date().toISOString(),
      });
    });

    pyshell.on('stderr', (data) => {
      console.error('Training stderr:', data.toString());
      event.sender.send('training-progress', {
        processId,
        type: 'error',
        message: data.toString(),
        timestamp: new Date().toISOString(),
      });
    });

    return new Promise((resolve, reject) => {
      pyshell.end((err, code, signal) => {
        if (err) {
          console.error('Training error:', err);
          event.sender.send('training-progress', {
            processId,
            type: 'error',
            message: err.message,
            timestamp: new Date().toISOString(),
          });
          reject(err);
        } else {
          console.log('Training completed with code:', code);
          event.sender.send('training-progress', {
            processId,
            type: 'completed',
            code,
            signal,
            timestamp: new Date().toISOString(),
          });
          resolve({ processId, code, signal });
        }
      });
    });
  } catch (error) {
    console.error('Training startup error:', error);
    throw error;
  }
});

ipcMain.handle('cancel-training', async (event, processId) => {
  try {
    // Note: This is a simplified implementation
    // In a real scenario, you'd need to track the actual process PIDs
    // and implement proper process termination
    console.log('Cancelling training process:', processId);
    
    // For now, we'll just send a cancellation message
    event.sender.send('training-progress', {
      processId,
      type: 'cancelled',
      message: 'Training cancelled by user',
      timestamp: new Date().toISOString(),
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error cancelling training:', error);
    throw error;
  }
});
