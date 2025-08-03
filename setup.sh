#!/bin/bash

# Install dependencies
npm install

# Add additional dependencies
npm install @vitejs/plugin-react
npm install @types/node --save-dev
npm install @mui/icons-material

# Create necessary directories
mkdir -p dist

# Initialize TypeScript configuration
echo '{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["node"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}' > tsconfig.json

# Create electron-builder configuration
echo '{
  "appId": "com.fluxyoga.app",
  "productName": "FluxYoga",
  "directories": {
    "output": "dist"
  },
  "files": [
    "dist/**/*",
    "main.js",
    "preload.js"
  ],
  "win": {
    "target": ["nsis"]
  },
  "mac": {
    "target": ["dmg"]
  },
  "linux": {
    "target": ["AppImage"]
  }
}' > electron-builder.json

# Create types file for window.api
echo 'interface Window {
  api: {
    startTraining: (config: any) => Promise<any>;
    onTrainingProgress: (callback: (data: any) => void) => void;
    store: {
      get: (key: string) => Promise<any>;
      set: (key: string, val: any) => Promise<void>;
      delete: (key: string) => Promise<void>;
      clear: () => Promise<void>;
    };
  };
}' > src/types/window.d.ts

echo "Setup complete. Run 'npm run dev' to start the development server."
