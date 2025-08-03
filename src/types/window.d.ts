interface OpenDialogOptions {
  properties?: Array<'openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles'>;
  filters?: Array<{
    name: string;
    extensions: string[];
  }>;
  defaultPath?: string;
}

interface OpenDialogResult {
  canceled: boolean;
  filePaths: string[];
}

interface PreprocessConfig {
  inputDir: string;
  outputDir: string;
  resizeMode: 'keep_ratio' | 'fill' | 'crop';
  targetWidth: number;
  targetHeight: number;
  autoContrast?: boolean;
  normalize?: boolean;
  sharpen?: boolean;
}

interface BatchCaptionConfig {
  model: 'gpt-4-vision' | 'blip' | 'blip2' | 'vit-gpt2' | 'florence-2';
  sourceFolder: string;
  style?: 'detailed' | 'simple' | 'tags' | 'artistic';
  template?: string;
  overwrite?: boolean;
  maxTokens?: number;
  modelType?: 'base' | 'large';
}

interface ScanResult {
  name: string;
  path: string;
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
    hasEXIF: boolean;
  };
}

interface Window {
  api: {
    // File system operations
    fs: {
      readDir: (dirPath: string) => Promise<string[]>;
      readFile: (filePath: string) => Promise<string>;
      writeFile: (filePath: string, content: string) => Promise<void>;
      mkdir: (dirPath: string) => Promise<void>;
      deleteFile: (filePath: string) => Promise<void>;
    };
    
    // File dialogs
    showOpenDialog: (options: OpenDialogOptions) => Promise<OpenDialogResult>;
    
    // Python operations
    python: {
      preprocess: (config: PreprocessConfig) => Promise<void>;
      generateCaption: (config: any) => Promise<string>;
      generateBatchCaptions: (config: BatchCaptionConfig) => Promise<{ processedFiles: string[]; totalProcessed: number; }>;
      startTraining: (config: any) => Promise<string>;
      stopTraining: (trainingId: string) => Promise<void>;
      pauseTraining: (trainingId: string) => Promise<void>;
      resumeTraining: (trainingId: string) => Promise<void>;
    };
    
    // Progress callbacks
    onProgress: (callback: (value: number) => void) => () => void;
    onTrainingUpdate: (callback: (update: any) => void) => () => void;
    onTrainingProgress: (callback: (data: any) => void) => void;
    
    // Training operations
    startTraining: (config: any) => Promise<any>;
    
    // Store operations
    store: {
      get: (key: string) => Promise<any>;
      set: (key: string, val: any) => Promise<void>;
      delete: (key: string) => Promise<void>;
      clear: () => Promise<void>;
    };
    
    // Dataset management
    scanDirectory: (path: string) => Promise<ScanResult[]>;
    generateCaption: (config: any) => Promise<string>;
    saveDataset: (dataset: any) => Promise<void>;
    exportDataset: (params: {
      dataset: any;
      format: 'json' | 'csv' | 'txt' | 'kohya';
      outputPath: string;
    }) => Promise<void>;
    
    // Python script execution
    runPythonScript: (config: any) => Promise<any>;
  };
}
