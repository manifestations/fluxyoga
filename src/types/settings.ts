export interface VRAMPreset {
  name: string;
  vramGB: number;
  description: string;
  settings: {
    batchSize: number;
    gradientCheckpointing: boolean;
    mixedPrecision: 'no' | 'fp16' | 'bf16';
    optimizer: string;
    optimizerArgs?: string[];
    splitMode?: boolean;
    networkArgs?: string[];
    additionalArgs?: string[];
    maxDataLoaderWorkers: number;
    cacheLatentsToDisk: boolean;
    cacheTextEncoderOutputsToDisk: boolean;
  };
}

export interface AppSettings {
  training: {
    defaultLearningRate: number;
    defaultBatchSize: number;
    defaultEpochs: number;
    defaultNetworkDim: number;
    defaultNetworkAlpha: number;
    defaultMixedPrecision: 'no' | 'fp16' | 'bf16';
    defaultOptimizer: string;
    
    // VRAM optimization settings
    selectedVRAMPreset: string;
    customVRAMSettings: boolean;
    gradientCheckpointing: boolean;
    cacheLatentsToDisk: boolean;
    cacheTextEncoderOutputsToDisk: boolean;
    maxDataLoaderWorkers: number;
    enableFP8Base: boolean;
    enableHighVRAM: boolean;
  };
  
  paths: {
    outputDirectory: string;
    pythonExecutable: string;
    sdScriptsPath: string;
  };
}

export const VRAM_PRESETS: VRAMPreset[] = [
  {
    name: "High VRAM (24GB+)",
    vramGB: 24,
    description: "For RTX 4090, RTX 3090 and similar high-end GPUs",
    settings: {
      batchSize: 2,
      gradientCheckpointing: true,
      mixedPrecision: 'bf16',
      optimizer: 'AdamW8bit',
      optimizerArgs: [],
      maxDataLoaderWorkers: 2,
      cacheLatentsToDisk: true,
      cacheTextEncoderOutputsToDisk: true,
      additionalArgs: ['--highvram', '--fp8_base', '--persistent_data_loader_workers']
    }
  },
  {
    name: "Medium VRAM (16GB)",
    vramGB: 16,
    description: "For RTX 4070 Ti, RTX 3080 and similar mid-range GPUs",
    settings: {
      batchSize: 1,
      gradientCheckpointing: true,
      mixedPrecision: 'bf16',
      optimizer: 'adafactor',
      optimizerArgs: ['relative_step=False', 'scale_parameter=False', 'warmup_init=False'],
      maxDataLoaderWorkers: 1,
      cacheLatentsToDisk: true,
      cacheTextEncoderOutputsToDisk: true,
      additionalArgs: ['--persistent_data_loader_workers']
    }
  },
  {
    name: "Low VRAM (12GB)",
    vramGB: 12,
    description: "For RTX 4060 Ti, RTX 3060 and similar budget GPUs",
    settings: {
      batchSize: 1,
      gradientCheckpointing: true,
      mixedPrecision: 'bf16',
      optimizer: 'adafactor',
      optimizerArgs: ['relative_step=False', 'scale_parameter=False', 'warmup_init=False'],
      splitMode: true,
      networkArgs: ['train_blocks=single'],
      maxDataLoaderWorkers: 1,
      cacheLatentsToDisk: true,
      cacheTextEncoderOutputsToDisk: true,
      additionalArgs: ['--split_mode']
    }
  },
  {
    name: "Very Low VRAM (8GB)",
    vramGB: 8,
    description: "For RTX 3050, GTX 1660 and similar entry-level GPUs",
    settings: {
      batchSize: 1,
      gradientCheckpointing: true,
      mixedPrecision: 'fp16',
      optimizer: 'adafactor',
      optimizerArgs: ['relative_step=False', 'scale_parameter=False', 'warmup_init=False'],
      splitMode: true,
      networkArgs: ['train_blocks=single'],
      maxDataLoaderWorkers: 0,
      cacheLatentsToDisk: true,
      cacheTextEncoderOutputsToDisk: true,
      additionalArgs: ['--split_mode', '--cpu_offload_checkpointing']
    }
  }
];

export const DEFAULT_SETTINGS: AppSettings = {
  training: {
    defaultLearningRate: 1e-4,
    defaultBatchSize: 1,
    defaultEpochs: 10,
    defaultNetworkDim: 16,
    defaultNetworkAlpha: 16,
    defaultMixedPrecision: 'bf16',
    defaultOptimizer: 'AdamW8bit',
    
    // VRAM optimization defaults
    selectedVRAMPreset: 'Medium VRAM (16GB)',
    customVRAMSettings: false,
    gradientCheckpointing: true,
    cacheLatentsToDisk: true,
    cacheTextEncoderOutputsToDisk: true,
    maxDataLoaderWorkers: 1,
    enableFP8Base: false,
    enableHighVRAM: false,
  },
  paths: {
    outputDirectory: '',
    pythonExecutable: '',
    sdScriptsPath: './sd-scripts',
  },
};
