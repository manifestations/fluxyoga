declare module 'electron' {
  interface IpcMainEvent {
    reply: (channel: string, ...args: any[]) => void;
  }
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

interface CaptionConfig {
  model: 'gpt-4-vision' | 'blip' | 'blip2' | 'vit-gpt2' | 'florence-2';
  imagePath: string;
  style?: 'detailed' | 'simple' | 'tags' | 'artistic';
  maxTokens?: number;
  modelType?: 'base' | 'large';  // For BLIP models
  focus?: string[];
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

interface TrainingStartConfig {
  script: string;
  args: string[];
  scriptPath?: string;
  workingDirectory?: string;
}

interface TrainingResult {
  processId: string;
  pid: number;
}

interface Window {
  electron: {
    ipcRenderer: {
      send: (channel: string, ...args: any[]) => void;
      on: (channel: string, func: (...args: any[]) => void) => void;
      invoke: (channel: string, ...args: any[]) => Promise<any>;
    };
  };
  api: {
    fs: {
      readDir: (dirPath: string) => Promise<string[]>;
      readFile: (filePath: string) => Promise<string>;
      writeFile: (filePath: string, content: string) => Promise<void>;
      mkdir: (dirPath: string) => Promise<void>;
      deleteFile: (filePath: string) => Promise<void>;
    };
    store: {
      get: (key: string) => Promise<any>;
      set: (key: string, value: any) => Promise<void>;
    };
    python: {
      preprocess: (config: PreprocessConfig) => Promise<void>;
      generateCaption: (config: CaptionConfig) => Promise<string>;
      generateBatchCaptions: (config: BatchCaptionConfig) => Promise<{ processedFiles: string[]; totalProcessed: number; }>;
      startTraining: (config: TrainingStartConfig) => Promise<TrainingResult>;
      cancelTraining: (processId: string) => Promise<void>;
      stopTraining: (trainingId: string) => Promise<void>;
      pauseTraining: (trainingId: string) => Promise<void>;
      resumeTraining: (trainingId: string) => Promise<void>;
    };
    onProgress: (callback: (data: any) => void) => () => void;
    onTrainingUpdate: (callback: (update: any) => void) => () => void;
    showOpenDialog: (options: {
      properties: string[];
      filters?: { name: string; extensions: string[]; }[];
    }) => Promise<{ canceled: boolean; filePaths: string[]; }>;
  };
}
