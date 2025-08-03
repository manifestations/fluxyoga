# Port Configuration Guide

This document explains how to configure the development server port for the FluxyYoga UI application.

## Quick Start

The application uses port `4100` by default. You can change this in several ways:

### Method 1: Environment Variables (Recommended)

Set the `VITE_PORT` environment variable before running the application:

#### Windows (PowerShell)
```powershell
$env:VITE_PORT=3000; npm run dev
```

#### Windows (Command Prompt)
```cmd
set VITE_PORT=3000 && npm run dev
```

#### Linux/macOS
```bash
VITE_PORT=3000 npm run dev
```

### Method 2: NPM Config

Use npm's config system to set the port:

```bash
npm run dev --port=3000
```

### Method 3: Configuration File

Edit the `app.config.js` file in the project root:

```javascript
module.exports = {
  development: {
    port: 3000, // Change this to your desired port
    host: 'localhost',
    open: false,
  },
  // ... other configuration
};
```

### Method 4: Command Line with Electron

For development with Electron:

```bash
# Set port and run electron dev mode
VITE_PORT=3000 npm run electron-dev:port --port=3000
```

## Available Scripts

- `npm run dev` - Start development server on default port (4100)
- `npm run dev:port` - Start development server with custom port from npm config
- `npm run electron-dev` - Start Electron app with default port
- `npm run electron-dev:port` - Start Electron app with custom port

## Additional Configuration Options

The `app.config.js` file supports additional configuration:

```javascript
module.exports = {
  development: {
    port: 4100,                    // Development server port
    host: 'localhost',             // Development server host
    open: false,                   // Auto-open browser
  },
  electron: {
    showDevTools: false,           // Show DevTools on startup
    window: {
      width: 1200,                 // Window width
      height: 800,                 // Window height
      minWidth: 800,               // Minimum width
      minHeight: 600,              // Minimum height
    }
  },
  app: {
    defaultTheme: 'dark',          // Default theme: 'light' or 'dark'
    title: 'FluxyYoga - LoRA Training UI', // App title
  }
};
```

## Environment Variables

All configuration options can be overridden with environment variables:

- `VITE_PORT` or `PORT` - Development server port
- `VITE_HOST` - Development server host
- `VITE_OPEN` - Auto-open browser (true/false)
- `ELECTRON_DEV_TOOLS` - Show DevTools (true/false)
- `ELECTRON_WINDOW_WIDTH` - Window width
- `ELECTRON_WINDOW_HEIGHT` - Window height
- `ELECTRON_MIN_WIDTH` - Minimum window width
- `ELECTRON_MIN_HEIGHT` - Minimum window height
- `APP_DEFAULT_THEME` - Default theme (light/dark)
- `APP_TITLE` - Application title

## Examples

### Development on port 3000
```bash
VITE_PORT=3000 npm run dev
```

### Electron app with custom window size
```bash
ELECTRON_WINDOW_WIDTH=1600 ELECTRON_WINDOW_HEIGHT=900 npm run electron-dev
```

### Light theme by default
```bash
APP_DEFAULT_THEME=light npm run electron-dev
```

### Multiple environment variables
```bash
VITE_PORT=5000 APP_DEFAULT_THEME=light ELECTRON_DEV_TOOLS=true npm run electron-dev
```

## Troubleshooting

1. **Port already in use**: If you get a port conflict error, change to a different port number
2. **Permission denied**: On some systems, ports below 1024 require administrator privileges
3. **Firewall issues**: Make sure your firewall allows the chosen port

## Default Ports

- **Development Server**: 4100
- **Common alternatives**: 3000, 5000, 8080, 8000
- **Electron**: Uses the same port as the development server
