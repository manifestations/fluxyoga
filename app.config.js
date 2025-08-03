/**
 * Application Configuration
 * 
 * This file contains configurable settings for the FluxYoga UI application.
 * Users can modify these values to customize the application behavior.
 */

module.exports = {
  // Development server configuration
  development: {
    // Port for the Vite development server
    // Default: 4100
    // You can change this to any available port (e.g., 3000, 5000, 8080)
    port: parseInt(process.env.VITE_PORT || process.env.PORT || '4100'),
    
    // Host for the development server
    // Default: 'localhost'
    host: process.env.VITE_HOST || 'localhost',
    
    // Whether to automatically open browser when dev server starts
    // Default: false
    open: process.env.VITE_OPEN === 'true' || false,
  },

  // Electron configuration
  electron: {
    // Whether to show dev tools on startup in development mode
    // Default: false
    showDevTools: process.env.ELECTRON_DEV_TOOLS === 'true' || false,
    
    // Window dimensions
    window: {
      width: parseInt(process.env.ELECTRON_WINDOW_WIDTH || '1200'),
      height: parseInt(process.env.ELECTRON_WINDOW_HEIGHT || '800'),
      minWidth: parseInt(process.env.ELECTRON_MIN_WIDTH || '800'),
      minHeight: parseInt(process.env.ELECTRON_MIN_HEIGHT || '600'),
    }
  },

  // Application settings
  app: {
    // Default theme mode: 'light' or 'dark'
    defaultTheme: process.env.APP_DEFAULT_THEME || 'dark',
    
    // Application title
    title: process.env.APP_TITLE || 'FluxYoga - LoRA Training UI',
  }
};
