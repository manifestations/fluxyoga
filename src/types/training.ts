// Core training configuration types

export interface LoRATrainingConfig {
  // Model Selection
  modelType: 'flux' | 'sdxl';
  baseModelPath: string;
  clipLPath?: string; // For FLUX only
  t5xxlPath?: string; // For FLUX only
  
  // Dataset
  datasetPath: string;
  
  // Output
  outputDir: string;
  outputName: string;
  
  // Training Parameters
  learningRate: number;
  batchSize: number;
  epochs: number;
  maxTrainSteps?: number;
  
  // Network Configuration
  networkDim: number;
  networkAlpha: number;
  networkModule: string;
  
  // Sample Generation
  samplePrompts: string[];
  sampleEveryNSteps: number;
  sampleBatchSize: number;
  
  // Advanced Options
  mixedPrecision: 'no' | 'fp16' | 'bf16';
  gradientCheckpointing: boolean;
  xformersMemoryEfficientAttention: boolean;
  
  // Optimizer
  optimizer: string;
  lrScheduler: string;
  lrWarmupSteps: number;
}

export interface TrainingProgress {
  epoch: number;
  step: number;
  totalSteps: number;
  loss: number;
  learningRate: number;
  timeElapsed: number;
  eta: number;
  samplesGenerated: string[];
  logs: string[];
}

export interface TrainingProcess {
  id: string;
  config: LoRATrainingConfig;
  status: 'starting' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress?: TrainingProgress;
  error?: string;
  startTime: Date;
  endTime?: Date;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export const DEFAULT_TRAINING_CONFIG: Partial<LoRATrainingConfig> = {
  learningRate: 1e-4,
  batchSize: 1,
  epochs: 10,
  networkDim: 16,
  networkAlpha: 16,
  networkModule: 'networks.lora',
  sampleEveryNSteps: 100,
  sampleBatchSize: 1,
  mixedPrecision: 'bf16',
  gradientCheckpointing: true,
  xformersMemoryEfficientAttention: true,
  optimizer: 'AdamW8bit',
  lrScheduler: 'cosine',
  lrWarmupSteps: 100,
  outputName: 'lora',
};
