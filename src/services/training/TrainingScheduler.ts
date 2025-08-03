export interface ScheduleConfig {
  type: 'linear' | 'cosine' | 'polynomial' | 'constant' | 'warmup_cosine';
  initialLearningRate: number;
  finalLearningRate?: number;
  warmupSteps?: number;
  totalSteps: number;
  power?: number; // For polynomial
  cycleLength?: number; // For cosine with restarts
}

export interface TrainingSchedule {
  learningRateSchedule: ScheduleConfig;
  batchSizeSchedule?: {
    initial: number;
    final: number;
    rampupSteps: number;
  };
  saveSchedule: {
    saveEveryNSteps: number;
    keepNCheckpoints: number;
    saveAtSteps?: number[];
  };
  validationSchedule?: {
    validateEveryNSteps: number;
    validationSteps: number;
  };
}

export class TrainingScheduler {
  private schedule: TrainingSchedule;

  constructor(schedule: TrainingSchedule) {
    this.schedule = schedule;
  }

  calculateLearningRate(currentStep: number): number {
    const config = this.schedule.learningRateSchedule;
    const progress = currentStep / config.totalSteps;

    switch (config.type) {
      case 'linear':
        const finalLR = config.finalLearningRate || 0;
        return config.initialLearningRate + 
               (finalLR - config.initialLearningRate) * progress;

      case 'cosine':
        return config.finalLearningRate || 0 + 
               (config.initialLearningRate - (config.finalLearningRate || 0)) * 
               0.5 * (1 + Math.cos(Math.PI * progress));

      case 'polynomial':
        const power = config.power || 1.0;
        const finalLRPoly = config.finalLearningRate || 0;
        return finalLRPoly + 
               (config.initialLearningRate - finalLRPoly) * 
               Math.pow(1 - progress, power);

      case 'warmup_cosine':
        const warmupSteps = config.warmupSteps || 0;
        if (currentStep < warmupSteps) {
          // Linear warmup
          return config.initialLearningRate * (currentStep / warmupSteps);
        } else {
          // Cosine annealing
          const cosineProgress = (currentStep - warmupSteps) / (config.totalSteps - warmupSteps);
          const finalLRCosine = config.finalLearningRate || 0;
          return finalLRCosine + 
                 (config.initialLearningRate - finalLRCosine) * 
                 0.5 * (1 + Math.cos(Math.PI * cosineProgress));
        }

      case 'constant':
      default:
        return config.initialLearningRate;
    }
  }

  calculateBatchSize(currentStep: number): number {
    if (!this.schedule.batchSizeSchedule) {
      return 1; // Default batch size
    }

    const config = this.schedule.batchSizeSchedule;
    if (currentStep >= config.rampupSteps) {
      return config.final;
    }

    const progress = currentStep / config.rampupSteps;
    return Math.round(config.initial + (config.final - config.initial) * progress);
  }

  shouldSaveCheckpoint(currentStep: number): boolean {
    const config = this.schedule.saveSchedule;
    
    // Check if it's a specific save step
    if (config.saveAtSteps && config.saveAtSteps.includes(currentStep)) {
      return true;
    }

    // Check if it's a regular save interval
    return currentStep % config.saveEveryNSteps === 0;
  }

  shouldValidate(currentStep: number): boolean {
    if (!this.schedule.validationSchedule) {
      return false;
    }

    return currentStep % this.schedule.validationSchedule.validateEveryNSteps === 0;
  }

  generateTrainingArgs(): string[] {
    const config = this.schedule.learningRateSchedule;
    const args: string[] = [];

    // Learning rate scheduler args
    args.push('--lr_scheduler', config.type);
    args.push('--learning_rate', config.initialLearningRate.toString());

    if (config.finalLearningRate !== undefined) {
      args.push('--lr_scheduler_num_cycles', '1');
      args.push('--lr_scheduler_power', (config.power || 1.0).toString());
    }

    if (config.warmupSteps) {
      args.push('--lr_warmup_steps', config.warmupSteps.toString());
    }

    // Save configuration
    args.push('--save_every_n_epochs', '1');
    args.push('--save_n_epoch_ratio', (this.schedule.saveSchedule.keepNCheckpoints / 10).toString());

    return args;
  }
}
