import { LoRATrainingConfig, TrainingProcess, TrainingProgress } from '../types/training';
import { trainingCommandBuilder } from './TrainingCommandBuilder';
import { v4 as uuidv4 } from 'uuid';

export class TrainingExecutor {
  private activeProcesses: Map<string, TrainingProcess> = new Map();
  private progressCallbacks: Map<string, (progress: TrainingProgress) => void> = new Map();

  /**
   * Start a new training process
   */
  async startTraining(config: LoRATrainingConfig): Promise<TrainingProcess> {
    // Validate configuration
    const validation = trainingCommandBuilder.validateConfig(config);
    if (!validation.isValid) {
      throw new Error(`Configuration invalid: ${validation.errors.join(', ')}`);
    }

    // Create process
    const process: TrainingProcess = {
      id: uuidv4(),
      config,
      status: 'starting',
      startTime: new Date(),
    };

    this.activeProcesses.set(process.id, process);

    try {
      // Build command arguments
      const script = trainingCommandBuilder.getTrainingScript(config.modelType);
      const args = config.modelType === 'flux' 
        ? trainingCommandBuilder.buildFluxCommand(config)
        : trainingCommandBuilder.buildSDXLCommand(config);

      // Start training via IPC
      const result = await window.api.python.startTraining({
        script,
        args,
        scriptPath: './sd-scripts',
        workingDirectory: config.outputDir,
      });

      // Update process status
      process.status = 'running';
      this.activeProcesses.set(process.id, process);

      // Set up progress monitoring
      this.setupProgressMonitoring(process.id, result.processId);

      return process;
    } catch (error) {
      process.status = 'failed';
      process.error = error instanceof Error ? error.message : 'Unknown error';
      process.endTime = new Date();
      this.activeProcesses.set(process.id, process);
      throw error;
    }
  }

  /**
   * Monitor training progress
   */
  onProgress(processId: string, callback: (progress: TrainingProgress) => void): void {
    this.progressCallbacks.set(processId, callback);
  }

  /**
   * Cancel a training process
   */
  async cancelTraining(processId: string): Promise<void> {
    const process = this.activeProcesses.get(processId);
    if (!process) {
      throw new Error(`Process ${processId} not found`);
    }

    try {
      await window.api.python.cancelTraining(processId);
      process.status = 'cancelled';
      process.endTime = new Date();
      this.activeProcesses.set(processId, process);
    } catch (error) {
      console.error('Failed to cancel training:', error);
      throw error;
    }
  }

  /**
   * Get process status
   */
  getProcess(processId: string): TrainingProcess | undefined {
    return this.activeProcesses.get(processId);
  }

  /**
   * Get all active processes
   */
  getActiveProcesses(): TrainingProcess[] {
    return Array.from(this.activeProcesses.values())
      .filter(p => p.status === 'running' || p.status === 'starting');
  }

  /**
   * Set up progress monitoring for a training process
   */
  private setupProgressMonitoring(processId: string, pythonProcessId: string): void {
    // Listen for progress updates from Python process
    window.api.onProgress((data: any) => {
      if (data.processId !== pythonProcessId) return;

      const process = this.activeProcesses.get(processId);
      if (!process) return;

      const progress = this.parseProgressData(data);
      process.progress = progress;

      // Check if training completed
      if (data.type === 'completed') {
        process.status = 'completed';
        process.endTime = new Date();
      } else if (data.type === 'error') {
        process.status = 'failed';
        process.error = data.message;
        process.endTime = new Date();
      }

      this.activeProcesses.set(processId, process);

      // Notify listeners
      const callback = this.progressCallbacks.get(processId);
      if (callback && progress) {
        callback(progress);
      }
    });
  }

  /**
   * Parse progress data from Python training script
   */
  private parseProgressData(data: any): TrainingProgress | undefined {
    try {
      // Parse common training output patterns
      if (data.type === 'progress' && data.message) {
        const message = data.message;
        
        // Extract epoch and step information
        const epochMatch = message.match(/epoch (\d+)/i);
        const stepMatch = message.match(/step (\d+)/i);
        const lossMatch = message.match(/loss[:\s]+([0-9.]+)/i);
        const lrMatch = message.match(/lr[:\s]+([0-9.e-]+)/i);

        const epoch = epochMatch ? parseInt(epochMatch[1]) : 0;
        const step = stepMatch ? parseInt(stepMatch[1]) : 0;
        const loss = lossMatch ? parseFloat(lossMatch[1]) : 0;
        const learningRate = lrMatch ? parseFloat(lrMatch[1]) : 0;

        return {
          epoch,
          step,
          totalSteps: data.totalSteps || 0,
          loss,
          learningRate,
          timeElapsed: data.timeElapsed || 0,
          eta: data.eta || 0,
          samplesGenerated: data.samplesGenerated || [],
          logs: [message],
        };
      }

      return undefined;
    } catch (error) {
      console.error('Failed to parse progress data:', error);
      return undefined;
    }
  }

  /**
   * Estimate dataset size from directory
   */
  async estimateDatasetSize(datasetPath: string): Promise<number> {
    try {
      const files = await window.api.fs.readDir(datasetPath);
      const imageFiles = files.filter(file => 
        /\.(jpg|jpeg|png|webp|bmp)$/i.test(file)
      );
      return imageFiles.length;
    } catch (error) {
      console.warn('Failed to estimate dataset size:', error);
      return 100; // Default estimate
    }
  }

  /**
   * Create sample prompts file for training
   */
  async createSamplePromptsFile(config: LoRATrainingConfig): Promise<string> {
    const promptsPath = `${config.outputDir}/sample_prompts.txt`;
    const prompts = config.samplePrompts.join('\n');
    
    try {
      await window.api.fs.writeFile(promptsPath, prompts);
      return promptsPath;
    } catch (error) {
      console.error('Failed to create sample prompts file:', error);
      throw error;
    }
  }

  /**
   * Clean up completed or failed processes
   */
  cleanup(): void {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    for (const [id, process] of this.activeProcesses.entries()) {
      if (
        (process.status === 'completed' || process.status === 'failed' || process.status === 'cancelled') &&
        process.endTime &&
        process.endTime < cutoffTime
      ) {
        this.activeProcesses.delete(id);
        this.progressCallbacks.delete(id);
      }
    }
  }
}

export const trainingExecutor = new TrainingExecutor();
