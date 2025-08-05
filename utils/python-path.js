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
  const mainJsDir = require.main && require.main.filename 
    ? path.dirname(require.main.filename) 
    : process.cwd();
  
  // Strategy 1: Check for venv in the app directory
  const venvPaths = [
    // For packaged app
    path.join(appPath, '.venv', process.platform === 'win32' ? 'Scripts' : 'bin', process.platform === 'win32' ? 'python.exe' : 'python'),
    // For development - relative to main.js
    path.join(mainJsDir, '..', '.venv', process.platform === 'win32' ? 'Scripts' : 'bin', process.platform === 'win32' ? 'python.exe' : 'python'),
    // Alternative development path
    path.join(mainJsDir, '.venv', process.platform === 'win32' ? 'Scripts' : 'bin', process.platform === 'win32' ? 'python.exe' : 'python'),
    // Environment variable override
    process.env.PYTHON_PATH,
  ].filter(Boolean);

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
  const mainJsDir = require.main && require.main.filename 
    ? path.dirname(require.main.filename) 
    : process.cwd();
  
  // For packaged app, scripts should be in the app directory
  if (app.isPackaged) {
    return path.join(appPath, 'scripts');
  }
  
  // For development
  return path.join(mainJsDir, 'scripts');
}

/**
 * Get the sd-scripts directory path dynamically with validation
 */
function getSdScriptsPath() {
  const appPath = app.isPackaged ? path.dirname(app.getPath('exe')) : __dirname;
  const mainJsDir = require.main && require.main.filename 
    ? path.dirname(require.main.filename) 
    : process.cwd();
  
  // Possible sd-scripts locations
  const possiblePaths = [
    // Environment variable override
    process.env.SD_SCRIPTS_PATH,
    // For packaged app
    app.isPackaged ? path.join(appPath, 'sd-scripts') : null,
    // For development - relative to main.js
    path.join(mainJsDir, '..', 'sd-scripts'),
    path.join(mainJsDir, 'sd-scripts'),
    // Alternative locations
    path.join(process.cwd(), 'sd-scripts'),
    path.join(__dirname, '..', 'sd-scripts'),
  ].filter(Boolean);

  // Try each path and validate it contains expected files
  for (const sdScriptsPath of possiblePaths) {
    try {
      if (fs.existsSync(sdScriptsPath)) {
        // Validate that this is actually sd-scripts by checking for key files
        const expectedFiles = ['flux_train_network.py', 'sdxl_train_network.py', 'train_network.py'];
        const hasExpectedFiles = expectedFiles.some(file => 
          fs.existsSync(path.join(sdScriptsPath, file))
        );
        
        if (hasExpectedFiles) {
          console.log(`Found sd-scripts directory at: ${sdScriptsPath}`);
          return sdScriptsPath;
        } else {
          console.warn(`Directory exists but doesn't contain expected sd-scripts files: ${sdScriptsPath}`);
        }
      }
    } catch (error) {
      console.warn(`Error checking sd-scripts path ${sdScriptsPath}:`, error.message);
    }
  }

  // Fallback to default path with warning
  const fallbackPath = path.join(mainJsDir, '..', 'sd-scripts');
  console.error(`No valid sd-scripts directory found! Falling back to: ${fallbackPath}`);
  console.error('Please ensure sd-scripts is properly installed or set SD_SCRIPTS_PATH environment variable');
  return fallbackPath;
}

/**
 * Validate sd-scripts installation and get version info
 */
async function validateSdScriptsInstallation() {
  const sdScriptsPath = getSdScriptsPath();
  
  try {
    // Check if directory exists
    if (!fs.existsSync(sdScriptsPath)) {
      return {
        isValid: false,
        error: 'sd-scripts directory not found',
        path: sdScriptsPath
      };
    }

    // Check for required training scripts
    const requiredScripts = [
      'flux_train_network.py',
      'sdxl_train_network.py', 
      'train_network.py'
    ];

    const missingScripts = requiredScripts.filter(script => 
      !fs.existsSync(path.join(sdScriptsPath, script))
    );

    if (missingScripts.length > 0) {
      return {
        isValid: false,
        error: `Missing required scripts: ${missingScripts.join(', ')}`,
        path: sdScriptsPath,
        missingScripts
      };
    }

    // Try to get version info
    let version = 'unknown';
    const versionFiles = ['version.txt', 'VERSION', '.version'];
    for (const versionFile of versionFiles) {
      const versionPath = path.join(sdScriptsPath, versionFile);
      if (fs.existsSync(versionPath)) {
        try {
          version = fs.readFileSync(versionPath, 'utf8').trim();
          break;
        } catch (error) {
          console.warn(`Error reading version file ${versionPath}:`, error);
        }
      }
    }

    // Check library folder
    const libraryPath = path.join(sdScriptsPath, 'library');
    const hasLibrary = fs.existsSync(libraryPath);

    return {
      isValid: true,
      path: sdScriptsPath,
      version,
      hasLibrary,
      availableScripts: requiredScripts.filter(script =>
        fs.existsSync(path.join(sdScriptsPath, script))
      )
    };

  } catch (error) {
    return {
      isValid: false,
      error: `Validation failed: ${error.message}`,
      path: sdScriptsPath
    };
  }
}

/**
 * Get Python requirements status for sd-scripts
 */
async function checkPythonRequirements() {
  try {
    const pythonPath = getPythonExecutablePath();
    const { spawn } = require('child_process');
    
    return new Promise((resolve) => {
      const child = spawn(pythonPath, ['-c', `
import sys
packages = ['torch', 'torchvision', 'transformers', 'diffusers', 'accelerate']
missing = []
versions = {}
for pkg in packages:
    try:
        module = __import__(pkg)
        versions[pkg] = getattr(module, '__version__', 'unknown')
    except ImportError:
        missing.append(pkg)

print(f"Python: {sys.version}")
print(f"Missing: {missing}")
print(f"Versions: {versions}")
      `], { 
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
      });

      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.on('close', (code) => {
        try {
          const lines = output.split('\n');
          const pythonVersion = lines.find(l => l.startsWith('Python:'))?.replace('Python: ', '') || 'unknown';
          const missingStr = lines.find(l => l.startsWith('Missing:'))?.replace('Missing: ', '') || '[]';
          const versionsStr = lines.find(l => l.startsWith('Versions:'))?.replace('Versions: ', '') || '{}';
          
          resolve({
            pythonVersion,
            missing: eval(missingStr),
            versions: eval(versionsStr),
            isValid: code === 0 && eval(missingStr).length === 0
          });
        } catch (error) {
          resolve({
            pythonVersion: 'unknown',
            missing: ['torch', 'transformers', 'diffusers'],
            versions: {},
            isValid: false,
            error: error.message
          });
        }
      });
    });
  } catch (error) {
    return {
      pythonVersion: 'unknown',
      missing: ['torch', 'transformers', 'diffusers'],
      versions: {},
      isValid: false,
      error: error.message
    };
  }
}

module.exports = {
  getPythonExecutablePath,
  getScriptsPath,
  getSdScriptsPath,
  validateSdScriptsInstallation,
  checkPythonRequirements
};
