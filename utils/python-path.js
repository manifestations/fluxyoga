const path = require('path');
const fs = require('fs');
const { app } = require('electron');

/**
 * Get the Python executable path dynamically
 * This function tries multiple strategies to find the Python executable:
 * 1. Virtual environment in the app directory
 * 2. Virtual environment relative to the main.js location
 * 3. System Python (fallback)
 */
function getPythonExecutablePath() {
  const appPath = app.isPackaged ? path.dirname(app.getPath('exe')) : __dirname;
  const mainJsDir = path.dirname(require.main.filename);
  
  // Strategy 1: Check for venv in the app directory
  const venvPaths = [
    // For packaged app
    path.join(appPath, '.venv', process.platform === 'win32' ? 'Scripts' : 'bin', process.platform === 'win32' ? 'python.exe' : 'python'),
    // For development - relative to main.js
    path.join(mainJsDir, '..', '.venv', process.platform === 'win32' ? 'Scripts' : 'bin', process.platform === 'win32' ? 'python.exe' : 'python'),
    // Alternative development path
    path.join(mainJsDir, '.venv', process.platform === 'win32' ? 'Scripts' : 'bin', process.platform === 'win32' ? 'python.exe' : 'python'),
  ];

  // Try each path
  for (const pythonPath of venvPaths) {
    try {
      if (fs.existsSync(pythonPath)) {
        console.log(`Found Python executable at: ${pythonPath}`);
        return pythonPath;
      }
    } catch (error) {
      console.warn(`Error checking Python path ${pythonPath}:`, error.message);
    }
  }

  // Fallback to system Python
  const systemPython = process.platform === 'win32' ? 'python.exe' : 'python';
  console.warn(`No virtual environment found, falling back to system Python: ${systemPython}`);
  return systemPython;
}

/**
 * Get the scripts directory path dynamically
 */
function getScriptsPath() {
  const appPath = app.isPackaged ? path.dirname(app.getPath('exe')) : __dirname;
  const mainJsDir = path.dirname(require.main.filename);
  
  // For packaged app, scripts should be in the app directory
  if (app.isPackaged) {
    return path.join(appPath, 'scripts');
  }
  
  // For development
  return path.join(mainJsDir, 'scripts');
}

/**
 * Get the sd-scripts directory path dynamically
 */
function getSdScriptsPath() {
  const appPath = app.isPackaged ? path.dirname(app.getPath('exe')) : __dirname;
  const mainJsDir = path.dirname(require.main.filename);
  
  // For packaged app
  if (app.isPackaged) {
    return path.join(appPath, 'sd-scripts');
  }
  
  // For development
  return path.join(mainJsDir, '..', 'sd-scripts');
}

module.exports = {
  getPythonExecutablePath,
  getScriptsPath,
  getSdScriptsPath
};
