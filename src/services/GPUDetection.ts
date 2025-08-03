export interface GPUInfo {
  name: string;
  memory: number; // VRAM in GB
  vendor: 'nvidia' | 'amd' | 'intel' | 'unknown';
  architecture?: string;
  computeCapability?: string;
}

export interface VRAMOptimizations {
  recommendedBatchSize: number;
  enableGradientCheckpointing: boolean;
  enableXformers: boolean;
  mixedPrecision: 'no' | 'fp16' | 'bf16';
  enableLowVRAMMode: boolean;
  enableCPUOffload: boolean;
  enableGradientAccumulation: boolean;
  gradientAccumulationSteps: number;
  maxResolution: number;
  cacheLatentsToGPU: boolean;
  enableMemoryEfficientAttention: boolean;
}

export class GPUDetectionService {
  private static instance: GPUDetectionService;
  private gpuInfo: GPUInfo | null = null;
  private isDetecting = false;

  public static getInstance(): GPUDetectionService {
    if (!GPUDetectionService.instance) {
      GPUDetectionService.instance = new GPUDetectionService();
    }
    return GPUDetectionService.instance;
  }

  async detectGPU(): Promise<GPUInfo | null> {
    if (this.gpuInfo) {
      return this.gpuInfo;
    }

    if (this.isDetecting) {
      // Wait for ongoing detection
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!this.isDetecting) {
            clearInterval(checkInterval);
            resolve(this.gpuInfo);
          }
        }, 100);
      });
    }

    this.isDetecting = true;

    try {
      // Try to get GPU info through multiple methods
      const gpuInfo = await this.detectGPUInfo();
      this.gpuInfo = gpuInfo;
      return gpuInfo;
    } catch (error) {
      console.error('GPU detection failed:', error);
      return null;
    } finally {
      this.isDetecting = false;
    }
  }

  private async detectGPUInfo(): Promise<GPUInfo | null> {
    // Method 1: Try WebGL renderer info
    const webglInfo = this.getWebGLInfo();
    if (webglInfo) {
      const memory = this.estimateVRAMFromRenderer(webglInfo.renderer);
      return {
        name: webglInfo.renderer,
        memory,
        vendor: this.detectVendor(webglInfo.renderer),
        architecture: this.detectArchitecture(webglInfo.renderer),
      };
    }

    // Method 2: Try Electron system info if available
    if ((window as any).api?.system?.getGPUInfo) {
      try {
        const systemGPU = await (window as any).api.system.getGPUInfo();
        return systemGPU;
      } catch (error) {
        console.warn('System GPU info not available:', error);
      }
    }

    // Method 3: Try navigator.gpu (WebGPU) if available
    if ('gpu' in navigator) {
      try {
        const adapter = await (navigator as any).gpu.requestAdapter();
        if (adapter) {
          const info = await adapter.requestAdapterInfo();
          return {
            name: info.description || 'Unknown GPU',
            memory: this.estimateVRAMFromWebGPU(adapter),
            vendor: this.detectVendor(info.description || ''),
          };
        }
      } catch (error) {
        console.warn('WebGPU detection failed:', error);
      }
    }

    return null;
  }

  private getWebGLInfo(): { renderer: string; vendor: string } | null {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext;
      
      if (!gl) return null;

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (!debugInfo) return null;

      return {
        renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
        vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
      };
    } catch (error) {
      return null;
    }
  }

  private detectVendor(gpuName: string): 'nvidia' | 'amd' | 'intel' | 'unknown' {
    const name = gpuName.toLowerCase();
    if (name.includes('nvidia') || name.includes('geforce') || name.includes('rtx') || name.includes('gtx') || name.includes('quadro') || name.includes('tesla')) {
      return 'nvidia';
    }
    if (name.includes('amd') || name.includes('radeon') || name.includes('rx ') || name.includes('vega') || name.includes('navi')) {
      return 'amd';
    }
    if (name.includes('intel') || name.includes('iris') || name.includes('uhd') || name.includes('hd graphics')) {
      return 'intel';
    }
    return 'unknown';
  }

  private detectArchitecture(gpuName: string): string | undefined {
    const name = gpuName.toLowerCase();
    
    // NVIDIA architectures
    if (name.includes('rtx 40')) return 'Ada Lovelace';
    if (name.includes('rtx 30')) return 'Ampere';
    if (name.includes('rtx 20')) return 'Turing';
    if (name.includes('gtx 16')) return 'Turing';
    if (name.includes('gtx 10')) return 'Pascal';
    
    // AMD architectures
    if (name.includes('rx 7')) return 'RDNA 3';
    if (name.includes('rx 6')) return 'RDNA 2';
    if (name.includes('rx 5')) return 'RDNA';
    
    return undefined;
  }

  private estimateVRAMFromRenderer(renderer: string): number {
    const name = renderer.toLowerCase();
    
    // NVIDIA RTX 40 series
    if (name.includes('rtx 4090')) return 24;
    if (name.includes('rtx 4080')) return 16;
    if (name.includes('rtx 4070 ti super')) return 16;
    if (name.includes('rtx 4070 ti')) return 12;
    if (name.includes('rtx 4070 super')) return 12;
    if (name.includes('rtx 4070')) return 12;
    if (name.includes('rtx 4060 ti')) return 16; // 16GB variant exists
    if (name.includes('rtx 4060')) return 8;
    
    // NVIDIA RTX 30 series
    if (name.includes('rtx 3090 ti')) return 24;
    if (name.includes('rtx 3090')) return 24;
    if (name.includes('rtx 3080 ti')) return 12;
    if (name.includes('rtx 3080')) return 10;
    if (name.includes('rtx 3070 ti')) return 8;
    if (name.includes('rtx 3070')) return 8;
    if (name.includes('rtx 3060 ti')) return 8;
    if (name.includes('rtx 3060')) return 12; // 12GB variant
    
    // NVIDIA RTX 20 series
    if (name.includes('rtx 2080 ti')) return 11;
    if (name.includes('rtx 2080')) return 8;
    if (name.includes('rtx 2070')) return 8;
    if (name.includes('rtx 2060')) return 6;
    
    // AMD RX 7000 series
    if (name.includes('rx 7900')) return 20;
    if (name.includes('rx 7800')) return 16;
    if (name.includes('rx 7700')) return 12;
    if (name.includes('rx 7600')) return 8;
    
    // AMD RX 6000 series
    if (name.includes('rx 6950')) return 16;
    if (name.includes('rx 6900')) return 16;
    if (name.includes('rx 6800')) return 16;
    if (name.includes('rx 6700')) return 12;
    if (name.includes('rx 6600')) return 8;
    
    // Fallback estimation
    if (name.includes('rtx') || name.includes('rx')) return 8; // Modern mid-range
    if (name.includes('gtx')) return 4; // Older cards
    if (name.includes('intel')) return 2; // Integrated graphics
    
    return 4; // Conservative default
  }

  private estimateVRAMFromWebGPU(adapter: any): number {
    // WebGPU adapter limits might give us memory info
    try {
      const limits = adapter.limits;
      if (limits && limits.maxBufferSize) {
        // Rough estimation from buffer size limits
        const estimatedGB = Math.round(limits.maxBufferSize / (1024 * 1024 * 1024));
        return Math.max(2, Math.min(estimatedGB, 24)); // Clamp between 2-24GB
      }
    } catch (error) {
      console.warn('Could not estimate VRAM from WebGPU:', error);
    }
    return 8; // Default
  }

  getVRAMOptimizations(gpuInfo: GPUInfo): VRAMOptimizations {
    const vram = gpuInfo.memory;
    const isNvidia = gpuInfo.vendor === 'nvidia';
    const isModern = this.isModernGPU(gpuInfo);

    // High VRAM (16GB+) - Optimal settings
    if (vram >= 16) {
      return {
        recommendedBatchSize: 4,
        enableGradientCheckpointing: false,
        enableXformers: true,
        mixedPrecision: isNvidia ? 'bf16' : 'fp16',
        enableLowVRAMMode: false,
        enableCPUOffload: false,
        enableGradientAccumulation: false,
        gradientAccumulationSteps: 1,
        maxResolution: 1024,
        cacheLatentsToGPU: true,
        enableMemoryEfficientAttention: true,
      };
    }

    // Medium VRAM (8-15GB) - Balanced settings
    if (vram >= 8) {
      return {
        recommendedBatchSize: 2,
        enableGradientCheckpointing: true,
        enableXformers: true,
        mixedPrecision: isNvidia && isModern ? 'bf16' : 'fp16',
        enableLowVRAMMode: false,
        enableCPUOffload: false,
        enableGradientAccumulation: true,
        gradientAccumulationSteps: 2,
        maxResolution: 768,
        cacheLatentsToGPU: true,
        enableMemoryEfficientAttention: true,
      };
    }

    // Low VRAM (4-7GB) - Conservative settings
    if (vram >= 4) {
      return {
        recommendedBatchSize: 1,
        enableGradientCheckpointing: true,
        enableXformers: true,
        mixedPrecision: 'fp16',
        enableLowVRAMMode: true,
        enableCPUOffload: true,
        enableGradientAccumulation: true,
        gradientAccumulationSteps: 4,
        maxResolution: 512,
        cacheLatentsToGPU: false,
        enableMemoryEfficientAttention: true,
      };
    }

    // Very Low VRAM (< 4GB) - Maximum optimization
    return {
      recommendedBatchSize: 1,
      enableGradientCheckpointing: true,
      enableXformers: true,
      mixedPrecision: 'fp16',
      enableLowVRAMMode: true,
      enableCPUOffload: true,
      enableGradientAccumulation: true,
      gradientAccumulationSteps: 8,
      maxResolution: 512,
      cacheLatentsToGPU: false,
      enableMemoryEfficientAttention: true,
    };
  }

  private isModernGPU(gpuInfo: GPUInfo): boolean {
    const name = gpuInfo.name.toLowerCase();
    
    // NVIDIA: RTX 30 series and newer support BF16
    if (gpuInfo.vendor === 'nvidia') {
      return name.includes('rtx 40') || name.includes('rtx 30') || 
             name.includes('a100') || name.includes('h100');
    }
    
    // AMD: RDNA 2 and newer
    if (gpuInfo.vendor === 'amd') {
      return name.includes('rx 6') || name.includes('rx 7');
    }
    
    return false;
  }

  getOptimizationSummary(gpuInfo: GPUInfo): string {
    const vram = gpuInfo.memory;
    
    if (vram >= 16) {
      return `High VRAM (${vram}GB): Optimal performance settings enabled`;
    } else if (vram >= 8) {
      return `Medium VRAM (${vram}GB): Balanced performance and memory usage`;
    } else if (vram >= 4) {
      return `Low VRAM (${vram}GB): Memory-optimized settings for stability`;
    } else {
      return `Very Low VRAM (${vram}GB): Maximum memory optimizations applied`;
    }
  }
}

export const gpuDetection = GPUDetectionService.getInstance();
