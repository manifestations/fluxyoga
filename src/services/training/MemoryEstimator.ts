export interface MemoryRequirement {
  modelMemory: number; // MB
  activationMemory: number; // MB
  gradientMemory: number; // MB
  optimizerMemory: number; // MB
  totalMemory: number; // MB
}

export interface SystemSpecs {
  gpuMemory: number; // MB
  systemMemory: number; // MB
  gpuName?: string;
  cudaVersion?: string;
}

export class MemoryEstimator {
  private static readonly BYTES_PER_MB = 1024 * 1024;
  private static readonly SAFETY_MARGIN = 0.85; // Use 85% of available memory

  // Model parameter counts (approximate)
  private static readonly MODEL_PARAMS = {
    'flux-dev': 12000, // 12B parameters
    'flux-schnell': 12000,
    'sdxl-base': 3500, // 3.5B parameters
    'sd1.5': 860, // 860M parameters
  };

  // Memory requirements per parameter (bytes)
  private static readonly MEMORY_PER_PARAM = {
    fp32: 4,
    fp16: 2,
    bf16: 2,
    int8: 1,
  };

  static estimateMemoryRequirements(
    modelType: string,
    batchSize: number,
    resolution: number,
    precision: 'fp32' | 'fp16' | 'bf16' | 'int8',
    networkDim: number = 64,
    enableGradientCheckpointing: boolean = false,
    enableLoRA: boolean = true
  ): MemoryRequirement {
    const paramCount = this.MODEL_PARAMS[modelType as keyof typeof this.MODEL_PARAMS] || 3500;
    const bytesPerParam = this.MEMORY_PER_PARAM[precision];

    // Base model memory
    const modelMemory = (paramCount * 1000000 * bytesPerParam) / this.BYTES_PER_MB;

    // LoRA parameters (much smaller)
    const loraParams = enableLoRA ? networkDim * networkDim * 2 * 12 : 0; // Approximate LoRA params
    const loraMemory = (loraParams * bytesPerParam) / this.BYTES_PER_MB;

    // Activation memory (depends on batch size and resolution)
    const pixelsPerBatch = batchSize * resolution * resolution * 3; // RGB
    const activationLayers = enableGradientCheckpointing ? 5 : 20; // Fewer layers stored with checkpointing
    const activationMemory = (pixelsPerBatch * activationLayers * bytesPerParam) / this.BYTES_PER_MB;

    // Gradient memory (same size as model for full fine-tuning, much smaller for LoRA)
    const gradientMemory = enableLoRA ? loraMemory : modelMemory;

    // Optimizer memory (Adam: 2x model size, AdamW8bit: ~0.5x)
    const optimizerMemory = enableLoRA ? loraMemory * 2 : modelMemory * 0.5;

    const totalMemory = modelMemory + loraMemory + activationMemory + gradientMemory + optimizerMemory;

    return {
      modelMemory: Math.round(modelMemory),
      activationMemory: Math.round(activationMemory),
      gradientMemory: Math.round(gradientMemory),
      optimizerMemory: Math.round(optimizerMemory),
      totalMemory: Math.round(totalMemory),
    };
  }

  static getOptimalBatchSize(
    modelType: string,
    availableMemory: number,
    resolution: number,
    precision: 'fp32' | 'fp16' | 'bf16' | 'int8',
    networkDim: number = 64,
    enableGradientCheckpointing: boolean = false
  ): number {
    const maxMemory = availableMemory * this.SAFETY_MARGIN;
    let maxBatchSize = 1;

    // Binary search for optimal batch size
    for (let testBatch = 1; testBatch <= 32; testBatch++) {
      const estimate = this.estimateMemoryRequirements(
        modelType,
        testBatch,
        resolution,
        precision,
        networkDim,
        enableGradientCheckpointing,
        true
      );

      if (estimate.totalMemory <= maxMemory) {
        maxBatchSize = testBatch;
      } else {
        break;
      }
    }

    return maxBatchSize;
  }

  static getMemoryOptimizationSuggestions(
    currentRequirement: MemoryRequirement,
    availableMemory: number
  ): string[] {
    const suggestions: string[] = [];
    const usageRatio = currentRequirement.totalMemory / availableMemory;

    if (usageRatio > 0.9) {
      suggestions.push('Memory usage is very high. Consider reducing batch size.');
      suggestions.push('Enable gradient checkpointing to reduce activation memory.');
      suggestions.push('Use mixed precision training (fp16/bf16) instead of fp32.');
      suggestions.push('Consider using 8-bit optimizers (AdamW8bit).');
      
      if (currentRequirement.activationMemory > currentRequirement.modelMemory * 0.5) {
        suggestions.push('Activation memory is high. Reduce resolution or batch size.');
      }
      
      suggestions.push('Use LoRA instead of full fine-tuning to reduce memory usage.');
    } else if (usageRatio > 0.7) {
      suggestions.push('Memory usage is moderate. You can likely increase batch size slightly.');
      suggestions.push('Consider enabling gradient accumulation for effective larger batches.');
    } else {
      suggestions.push('Memory usage is efficient. You can increase batch size for faster training.');
      suggestions.push('Consider increasing network dimension for potentially better results.');
    }

    return suggestions;
  }

  static formatMemorySize(sizeInMB: number): string {
    if (sizeInMB >= 1024) {
      return `${(sizeInMB / 1024).toFixed(1)} GB`;
    }
    return `${sizeInMB.toFixed(0)} MB`;
  }
}
