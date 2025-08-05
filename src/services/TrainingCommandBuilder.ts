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
      ...(config.vaePath ? ['--ae', config.vaePath] : []),
      
      // Dataset and resolution
      '--train_data_dir', config.datasetPath,
      '--resolution', config.resolution,
      '--caption_extension', '.txt',
      
      // Output
      '--output_dir', config.outputDir,
      '--output_name', config.outputName,
      '--save_model_as', 'safetensors',
      
      // Training parameters
      '--learning_rate', config.learningRate.toString(),
      '--train_batch_size', config.batchSize.toString(),
      '--max_train_epochs', config.epochs.toString(),
      
      // Network configuration
      '--network_module', 'networks.lora_flux',
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
      '--sample_prompts', `${config.outputDir}/sample_prompts.txt`,
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
      '--fp8_base',
      '--network_args', 'train_blocks=single',
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
      
      // VAE (optional for SDXL)
      ...(config.vaePath ? ['--vae', config.vaePath] : []),
      
      // Dataset and resolution
      '--train_data_dir', config.datasetPath,
      '--resolution', config.resolution,
      
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
      '--sample_prompts', `${config.outputDir}/sample_prompts.txt`,
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
    if (!config.resolution) {
      errors.push('Training resolution is required');
    } else {
      // Validate resolution format
      const resolutionPattern = /^(\d+)(,\d+)?$/;
      if (!resolutionPattern.test(config.resolution)) {
        errors.push('Resolution must be in format "512" or "1024,1024"');
      }
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
   * Create sample prompts file for training
   */
  async createSamplePromptsFile(config: LoRATrainingConfig): Promise<void> {
    const promptsPath = `${config.outputDir}/sample_prompts.txt`;
    const promptsContent = config.samplePrompts.join('\n');
    
    try {
      // Ensure output directory exists
      await window.api.fs.mkdir(config.outputDir);
      // Write prompts file
      await window.api.fs.writeFile(promptsPath, promptsContent);
    } catch (error) {
      console.error('Failed to create sample prompts file:', error);
      throw error;
    }
  }

  /**
   * Generate default sample prompts based on model type
   */
  getDefaultSamplePrompts(modelType: 'flux' | 'sdxl'): string[] {
    if (modelType === 'flux') {
      return [
        'a beautiful woman model in a casual outfit, standing pose, professional photography',
        'a woman model in an elegant dress, sitting gracefully, studio lighting',
        'a woman model in sportswear, dynamic pose, high quality portrait',
      ];
    } else {
      return [
        'a beautiful woman model in a casual outfit, standing pose, professional photography', 
        'a woman model in an elegant dress, sitting gracefully, studio lighting',
        'a woman model in sportswear, dynamic pose, masterpiece quality',
      ];
    }
  }
}

export const trainingCommandBuilder = new TrainingCommandBuilder();
