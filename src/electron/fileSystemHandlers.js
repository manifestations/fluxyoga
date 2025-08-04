const { ipcMain } = require('electron');
const fs = require('fs').promises;
const path = require('path');

// Setup file system handlers
ipcMain.handle('fs:readDir', async (event, dirPath) => {
  try {
    const files = await fs.readdir(dirPath);
    return files;
  } catch (error) {
    console.error('Error reading directory:', error);
    throw error;
  }
});

ipcMain.handle('fs:readFile', async (event, filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error('Error reading file:', error);
    throw error;
  }
});

ipcMain.handle('fs:writeFile', async (event, filePath, content) => {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
  } catch (error) {
    console.error('Error writing file:', error);
    throw error;
  }
});

ipcMain.handle('fs:mkdir', async (event, dirPath) => {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    console.error('Error creating directory:', error);
    throw error;
  }
});

// Additional handlers for image processing and python scripts
ipcMain.handle('python:preprocess', async (event, config) => {
  const { PythonShell } = require('python-shell');

  const options = {
    mode: 'text',
    pythonPath: 'python',
    scriptPath: path.join(__dirname, 'scripts'),
    args: [
      '--input_dir', config.inputDir,
      '--output_dir', config.outputDir,
      '--resize_mode', config.resizeMode,
      '--target_width', config.targetWidth.toString(),
      '--target_height', config.targetHeight.toString(),
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
      // Forward progress updates to renderer
      event.sender.send('python:progress', message);
    });

    pyshell.end((err) => {
      if (err) reject(err);
      resolve();
    });
  });
});

// Caption generation with multiple models
ipcMain.handle('python:generate-caption', async (event, config) => {
  const { PythonShell } = require('python-shell');

  const scriptMap = {
    'gpt-4-vision': 'generate_gpt4v_caption.py',
    'blip': 'generate_blip_caption.py',
    'blip2': 'generate_blip2_caption.py',
    'vit-gpt2': 'generate_vit_caption.py',
  };

  const script = scriptMap[config.model];
  if (!script) {
    throw new Error('Invalid model selection');
  }

  const options = {
    mode: 'text',
    pythonPath: 'python',
    scriptPath: path.join(__dirname, 'scripts'),
    args: [
      '--image_path', config.imagePath,
      '--style', config.style || 'detailed',
      ...(config.maxTokens ? ['--max_tokens', config.maxTokens.toString()] : []),
      ...(config.model === 'blip' ? ['--model_type', config.modelType || 'base'] : []),
      ...(config.focus ? ['--focus', ...config.focus] : []),
    ],
    env: {
      ...process.env,
      PYTHONIOENCODING: 'utf-8',
      PYTHONUTF8: '1'
    }
  };

  return new Promise((resolve, reject) => {
    let pyshell = new PythonShell(script, options);
    let caption = '';

    pyshell.on('message', (message) => {
      caption = message;
    });

    pyshell.end((err) => {
      if (err) reject(err);
      resolve(caption);
    });
  });
});
