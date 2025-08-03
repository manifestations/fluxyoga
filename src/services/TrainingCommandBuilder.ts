import { LoRATrainingConfig, ValidationResult } from '../types/training';

export class TrainingCommandBuilder {
  /**
   * Build command arguments for FLUX LoRA training
   */
  buildFluxCommand(config: LoRATrainingConfig): string[] {
    const args = [
      // Base model and architecture
      '--pretrained_model_name_or_path', config.baseModelPath,
      '--model_type', 'flux',
      
      // FLUX-specific models
      ...(config.clipLPath ? ['--clip_l', config.clipLPath] : []),
      ...(config.t5xxlPath ? ['--t5xxl', config.t5xxlPath] : []),
      
      // Dataset
      '--train_data_dir', config.datasetPath,
      
      // Output
      '--output_dir', config.outputDir,
      '--output_name', config.outputName,
      '--save_model_as', 'safetensors',
      
      // Training parameters
      '--learning_rate', config.learningRate.toString(),
      '--train_batch_size', config.batchSize.toString(),
      '--max_train_epochs', config.epochs.toString(),
      
      // Network configuration
      '--network_module', config.networkModule,
      '--network_dim', config.networkDim.toString(),
      '--network_alpha', config.networkAlpha.toString(),
      
      // Optimization
      '--optimizer_type', config.optimizer,
      '--lr_scheduler', config.lrScheduler,
      '--lr_warmup_steps', config.lrWarmupSteps.toString(),
      '--mixed_precision', config.mixedPrecision,
      
      // Memory optimization
      ...(config.gradientCheckpointing ? ['--gradient_checkpointing'] : []),
      ...(config.xformersMemoryEfficientAttention ? ['--xformers'] : []),
      
      // Sample generation
      '--sample_prompts', config.samplePrompts.join('\n'),
      '--sample_every_n_steps', config.sampleEveryNSteps.toString(),
      '--sample_sampler', 'euler_a',
      
      // Logging and saving
      '--logging_dir', `${config.outputDir}/logs`,
      '--log_with', 'tensorboard',
      '--save_every_n_epochs', '1',
      '--save_state',
      
      // Enable cache for faster training
      '--cache_latents',
      '--cache_latents_to_disk',
      
      // FLUX-specific optimizations
      '--split_qkv',
      '--fp8_base',
    ];

    return args.filter(arg => arg !== undefined && arg !== '');
  }

  /**
   * Build command arguments for SDXL LoRA training
   */
  buildSDXLCommand(config: LoRATrainingConfig): string[] {
    const args = [
      // Base model
      '--pretrained_model_name_or_path', config.baseModelPath,
      
      // Dataset
      '--train_data_dir', config.datasetPath,
      
      // Output
      '--output_dir', config.outputDir,
      '--output_name', config.outputName,
      '--save_model_as', 'safetensors',
      
      // Training parameters
      '--learning_rate', config.learningRate.toString(),
      '--train_batch_size', config.batchSize.toString(),
      '--max_train_epochs', config.epochs.toString(),
      
      // Network configuration
      '--network_module', config.networkModule,
      '--network_dim', config.networkDim.toString(),
      '--network_alpha', config.networkAlpha.toString(),
      
      // Optimization
      '--optimizer_type', config.optimizer,
      '--lr_scheduler', config.lrScheduler,
      '--lr_warmup_steps', config.lrWarmupSteps.toString(),
      '--mixed_precision', config.mixedPrecision,
      
      // Memory optimization
      ...(config.gradientCheckpointing ? ['--gradient_checkpointing'] : []),
      ...(config.xformersMemoryEfficientAttention ? ['--xformers'] : []),
      
      // Sample generation
      '--sample_prompts', config.samplePrompts.join('\n'),
      '--sample_every_n_steps', config.sampleEveryNSteps.toString(),
      '--sample_sampler', 'euler_a',
      
      // Logging and saving
      '--logging_dir', `${config.outputDir}/logs`,
      '--log_with', 'tensorboard',
      '--save_every_n_epochs', '1',
      '--save_state',
      
      // Enable cache for faster training
      '--cache_latents',
      '--cache_latents_to_disk',
      '--cache_text_encoder_outputs',
      '--cache_text_encoder_outputs_to_disk',
      
      // SDXL-specific
      '--enable_bucket',
      '--bucket_reso_steps', '64',
      '--bucket_no_upscale',
    ];

    return args.filter(arg => arg !== undefined && arg !== '');
  }

  /**
   * Get the appropriate training script for the model type
   */
  getTrainingScript(modelType: 'flux' | 'sdxl'): string {
    switch (modelType) {
      case 'flux':
        return 'flux_train_network.py';
      case 'sdxl':
        return 'sdxl_train_network.py';
      default:
        throw new Error(`Unsupported model type: ${modelType}`);
    }
  }

  /**
   * Validate training configuration
   */
  validateConfig(config: LoRATrainingConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!config.baseModelPath) {
      errors.push('Base model path is required');
    }
    if (!config.datasetPath) {
      errors.push('Dataset path is required');
    }
    if (!config.outputDir) {
      errors.push('Output directory is required');
    }
    if (!config.outputName) {
      errors.push('Output name is required');
    }

    // FLUX-specific validation
    if (config.modelType === 'flux') {
      if (!config.clipLPath) {
        warnings.push('CLIP-L model path not specified, will use default');
      }
      if (!config.t5xxlPath) {
        warnings.push('T5XXL model path not specified, will use default');
      }
    }

    // Parameter validation
    if (config.learningRate <= 0 || config.learningRate > 1) {
      warnings.push('Learning rate should typically be between 1e-6 and 1e-3');
    }
    if (config.batchSize < 1 || config.batchSize > 32) {
      warnings.push('Batch size should typically be between 1 and 32');
    }
    if (config.epochs < 1 || config.epochs > 1000) {
      warnings.push('Epochs should typically be between 1 and 100');
    }
    if (config.networkDim < 1 || config.networkDim > 1024) {
      warnings.push('Network dimension should typically be between 4 and 128');
    }

    // Sample prompts validation
    if (!config.samplePrompts || config.samplePrompts.length === 0) {
      warnings.push('No sample prompts specified - training will proceed without samples');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Calculate total training steps
   */
  calculateTotalSteps(config: LoRATrainingConfig, datasetSize: number): number {
    const stepsPerEpoch = Math.ceil(datasetSize / config.batchSize);
    return stepsPerEpoch * config.epochs;
  }

  /**
   * Generate default sample prompts based on model type
   */
  getDefaultSamplePrompts(modelType: 'flux' | 'sdxl'): string[] {
    const commonPrompts = [
      'a beautiful landscape with mountains and lakes',
      'a portrait of a person, professional photography',
      'a cute animal, detailed fur, studio lighting',
      'a futuristic city skyline at sunset',
    ];

    if (modelType === 'flux') {
      return [
        ...commonPrompts,
        'highly detailed digital art, trending on artstation',
        'photorealistic render, octane render, 8k',
      ];
    } else {
      return [
        ...commonPrompts,
        'masterpiece, best quality, ultra detailed',
        'concept art, digital painting, trending on pixiv',
      ];
    }
  }
}

export const trainingCommandBuilder = new TrainingCommandBuilder();
