import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  Alert,
  Chip,
  Paper,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  LinearProgress,
} from '@mui/material';
import {
  FolderOpen as FolderOpenIcon,
  Settings as SettingsIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Help as HelpIcon,
  Memory as MemoryIcon,
  Save as SaveIcon,
  Restore as RestoreIcon,
} from '@mui/icons-material';
import { LoRATrainingConfig, DEFAULT_TRAINING_CONFIG, TrainingProcess } from '../../types/training';
import { AppSettings, DEFAULT_SETTINGS } from '../../types/settings';
import { VRAMOptimizations } from '../../services/GPUDetection';
import { trainingCommandBuilder } from '../../services/TrainingCommandBuilder';
import { trainingExecutor } from '../../services/TrainingExecutor';
import PromptManager from '../prompts/PromptManager';
import useAutoSave from '../../hooks/useAutoSave';
import { autoSaveService } from '../../services/AutoSaveService';
import { SxProps } from '@mui/system';

// Common styles for form inputs
const commonInputStyles: SxProps = {
  '& .MuiOutlinedInput-root': {
    border: '2px solid',
    borderColor: 'divider',
    '&:hover': {
      borderColor: 'primary.main',
    },
    '&.Mui-focused': {
      borderColor: 'primary.main',
    },
    '&.Mui-error': {
      borderColor: 'error.main',
    },
  },
};

interface SimpleTrainingFormProps {
  onTrainingStart?: (process: any) => void;
  onTrainingProgress?: (progress: any) => void;
  gpuOptimizations?: VRAMOptimizations | null;
  currentTrainingProcess?: TrainingProcess | null;
}

const SimpleTrainingForm: React.FC<SimpleTrainingFormProps> = ({
  onTrainingStart,
  onTrainingProgress,
  gpuOptimizations,
  currentTrainingProcess,
}) => {
  const [config, setConfig] = useState<LoRATrainingConfig>({
    modelType: 'flux',
    baseModelPath: '',
    clipLPath: '',
    t5xxlPath: '',
    vaePath: '',
    datasetPath: '',
    resolution: '1024,1024', // Default FLUX resolution
    outputDir: '',
    outputName: 'my_lora',
    samplePrompts: trainingCommandBuilder.getDefaultSamplePrompts('flux'),
    ...DEFAULT_TRAINING_CONFIG,
  } as LoRATrainingConfig);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [estimatedDatasetSize, setEstimatedDatasetSize] = useState<number>(0);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [trainingLogs, setTrainingLogs] = useState<string[]>([]);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [totalEpochs, setTotalEpochs] = useState(0);
  const [currentProcessId, setCurrentProcessId] = useState<string | null>(null);

  // Enhanced auto-save with immediate save on change and comprehensive restoration
  const { 
    saveData, 
    loadData, 
    clearSavedData, 
    getSavedDataInfo 
  } = useAutoSave({
    key: 'training-config',
    displayName: 'Training Configuration',
    data: config,
    onRestore: (savedData) => {
      setConfig(prev => ({
        ...prev,
        ...savedData,
        samplePrompts: savedData.samplePrompts || trainingCommandBuilder.getDefaultSamplePrompts(savedData.modelType || 'flux'),
        outputName: savedData.outputName || 'my_lora',
        resolution: savedData.resolution || (savedData.modelType === 'flux' ? '1024,1024' : '512,512')
      }));
      console.log('Training configuration restored from auto-save');
    },
    interval: 30000,
    saveOnChange: false,
    saveOnUnload: true,
    showNotifications: false,
    debug: false
  });

  useEffect(() => {
    const initializeForm = async () => {
      try {
        const savedInfo = await getSavedDataInfo();
        if (savedInfo.exists) {
          console.log(`Found saved training configuration from ${savedInfo.lastSaved}`);
        } else {
          console.log('No saved training configuration found, using defaults');
        }
      } catch (error) {
        console.warn('Failed to initialize form with saved data:', error);
      }
    };
    initializeForm();
  }, [getSavedDataInfo]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (autoSaveStatus === 'saving') {
      timeoutId = setTimeout(() => {
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      }, 1000); // Increased to 1 second to allow save to complete
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [autoSaveStatus]);

  // Debounced config change effect to prevent excessive saving
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setAutoSaveStatus('saving');
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [config]);

  useEffect(() => {
    if (gpuOptimizations) {
      setConfig(prev => ({
        ...prev,
        batchSize: gpuOptimizations.recommendedBatchSize,
        mixedPrecision: gpuOptimizations.mixedPrecision,
        gradientCheckpointing: gpuOptimizations.enableGradientCheckpointing,
        xformersMemoryEfficientAttention: gpuOptimizations.enableMemoryEfficientAttention,
      }));
    }
  }, [gpuOptimizations]);

  useEffect(() => {
    const result = trainingCommandBuilder.validateConfig(config);
    setValidationResult(result);
  }, [config]);

  useEffect(() => {
    if (config.datasetPath) {
      trainingExecutor.estimateDatasetSize(config.datasetPath)
        .then(setEstimatedDatasetSize)
        .catch(() => setEstimatedDatasetSize(0));
    }
  }, [config.datasetPath]);

  useEffect(() => {
    if (!(window.api as any)?.onTrainingProgress) return;
    
    const unsubscribe = (window.api as any).onTrainingProgress((progressData: any) => {
      // Always update logs if there's a message
      if (progressData.message) {
        setTrainingLogs(prev => [...prev.slice(-50), progressData.message]);
        // Parse epoch info
        const epochMatch = progressData.message.match(/epoch (\d+)\/(\d+)/i);
        if (epochMatch) {
          setCurrentEpoch(parseInt(epochMatch[1]));
          setTotalEpochs(parseInt(epochMatch[2]));
        } else {
          const altEpochMatch = progressData.message.match(/epoch[:\s]*(\d+)(?:[\/\s]*of[\/\s]*(\d+))?/i);
          if (altEpochMatch) {
            setCurrentEpoch(parseInt(altEpochMatch[1]));
            if (altEpochMatch[2]) setTotalEpochs(parseInt(altEpochMatch[2]));
          }
        }
      }
      
      // Handle different event types
      switch (progressData.type) {
        case 'started':
          setIsTraining(true);
          console.log('Training started:', progressData.processId);
          break;
        case 'progress':
          // Already handled above
          setIsTraining(true); // Ensure training state is active
          break;
        case 'heartbeat':
          console.log('Training heartbeat received at:', new Date().toLocaleTimeString());
          setIsTraining(true); // Ensure training state is active
          break;
        case 'completed':
          console.log('Training completed');
          setIsTraining(false);
          break;
        case 'error':
          console.error('Training error:', progressData.message);
          setIsTraining(false);
          break;
        case 'cancelled':
          console.log('Training cancelled');
          setIsTraining(false);
          break;
      }
      
      if (onTrainingProgress) onTrainingProgress(progressData);
    });
    
    // Set up an additional heartbeat check
    const heartbeatChecker = setInterval(() => {
      if (isTraining && (window.api as any)?.checkTrainingStatus) {
        console.log('Requesting training status check...');
        (window.api as any).checkTrainingStatus(currentProcessId || 'current')
          .catch((err: any) => {
            console.error('Error checking training status:', err);
          });
      }
    }, 15000); // Check every 15 seconds
    
    return () => { 
      if (typeof unsubscribe === 'function') {
        console.log('Unsubscribing from training progress events');
        unsubscribe();
      }
      clearInterval(heartbeatChecker);
    };
  }, [onTrainingProgress, isTraining, currentProcessId]);

  const handleFileSelect = async (field: keyof LoRATrainingConfig, filters?: string) => {
    try {
      const result = await window.api.showOpenDialog({
        properties: ['openFile'],
        filters: filters ? [
          { name: 'Model Files', extensions: filters.split(',') }
        ] : undefined,
      });
      if (!result.canceled && result.filePaths.length > 0) {
        setConfig(prev => ({ ...prev, [field]: result.filePaths[0] }));
      }
    } catch (error) {
      console.error('Error selecting file:', error);
    }
  };

  const handleFolderSelect = async (field: keyof LoRATrainingConfig) => {
    try {
      const result = await window.api.showOpenDialog({
        properties: ['openDirectory'],
      });
      if (!result.canceled && result.filePaths.length > 0) {
        setConfig(prev => ({ ...prev, [field]: result.filePaths[0] }));
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
    }
  };

  const handleModelTypeChange = (modelType: 'flux' | 'sdxl') => {
    const defaultResolution = modelType === 'flux' ? '1024,1024' : '512,512';
    setConfig(prev => ({
      ...prev,
      modelType,
      resolution: defaultResolution,
      samplePrompts: trainingCommandBuilder.getDefaultSamplePrompts(modelType),
    }));
  };

  const handleStartTraining = async () => {
    if (!validationResult?.isValid) return;
    setIsTraining(true);
    setTrainingLogs([]);
    setCurrentEpoch(0);
    setTotalEpochs(config.epochs);
    try {
      const script = trainingCommandBuilder.getTrainingScript(config.modelType);
      const args = config.modelType === 'flux' 
        ? trainingCommandBuilder.buildFluxCommand(config)
        : trainingCommandBuilder.buildSDXLCommand(config);
      const trainingConfig = {
        script,
        args,
        scriptPath: './sd-scripts',
        workingDirectory: config.outputDir,
      };
      
      console.log('Starting training with config:', trainingConfig);
      const result = await window.api.python.startTraining(trainingConfig).catch(error => {
        setIsTraining(false);
        setTrainingLogs(prev => [...prev, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
        throw error;
      });
      
      console.log('Training process started with ID:', result?.processId);
      
      // Store the process ID in state for later reference (for cancel operations)
      setCurrentProcessId(result?.processId || null);
      
    } catch (error) {
      setIsTraining(false);
      setTrainingLogs(prev => [...prev, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    }
  };

  const calculateTotalSteps = () => {
    if (estimatedDatasetSize > 0) {
      return trainingCommandBuilder.calculateTotalSteps(config, estimatedDatasetSize);
    }
    return 0;
  };

  const calculateSampleSteps = () => {
    const totalSteps = calculateTotalSteps();
    if (totalSteps > 0) {
      return Math.floor(totalSteps / Math.max(1, config.epochs));
    }
    return config.sampleEveryNSteps;
  };

  const handleManualSave = async () => {
    try {
      await saveData();
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Manual save failed:', error);
    }
  };

  const handleClearSavedData = async () => {
    try {
      await clearSavedData();
    } catch (error) {
      console.error('Failed to clear saved data:', error);
    }
  };

  const handleResetForm = () => {
    setConfig({ ...DEFAULT_TRAINING_CONFIG } as LoRATrainingConfig);
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 2 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h2">
              LoRA Training Configuration
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  size="small"
                  icon={<SaveIcon />}
                  label={
                    autoSaveStatus === 'saving' ? 'Saving...' :
                    autoSaveStatus === 'saved' ? 'Saved' : 
                    'Auto-save Active'
                  }
                  color={
                    autoSaveStatus === 'saving' ? 'warning' :
                    autoSaveStatus === 'saved' ? 'success' : 
                    'default'
                  }
                  variant={autoSaveStatus === 'idle' ? 'outlined' : 'filled'}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Save configuration now">
                  <IconButton 
                    size="small" 
                    onClick={handleManualSave}
                    disabled={autoSaveStatus === 'saving'}
                  >
                    <SaveIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Clear saved data">
                  <IconButton 
                    size="small" 
                    onClick={handleClearSavedData}
                    color="error"
                  >
                    <RestoreIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={showAdvanced}
                    onChange={(e) => setShowAdvanced(e.target.checked)}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography>Advanced Settings</Typography>
                    <Chip 
                      label={showAdvanced ? 'Shown' : 'Hidden'} 
                      size="small" 
                      color={showAdvanced ? 'primary' : 'default'}
                      variant={showAdvanced ? 'filled' : 'outlined'}
                    />
                  </Box>
                }
              />
            </Box>
          </Box>
          {gpuOptimizations && (
            <Alert 
              severity="success" 
              sx={{ mb: 3 }}
              icon={<MemoryIcon />}
            >
              <Typography variant="body2">
                <strong>GPU Optimizations Active:</strong> Settings automatically configured for {gpuOptimizations.enableLowVRAMMode ? 'low VRAM' : 'optimal'} performance 
                (Batch: {gpuOptimizations.recommendedBatchSize}, Precision: {gpuOptimizations.mixedPrecision.toUpperCase()})
              </Typography>
            </Alert>
          )}
          {validationResult && !validationResult.isValid && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <strong>Configuration Errors:</strong>
              <ul>
                {validationResult.errors.map((error: string, index: number) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </Alert>
          )}
          {validationResult && validationResult.warnings.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <strong>Warnings:</strong>
              <ul>
                {validationResult.warnings.map((warning: string, index: number) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </Alert>
          )}
          <Grid container spacing={3}>
            {/* Model Type Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={commonInputStyles}>
                <InputLabel>Model Type</InputLabel>
                <Select
                  value={config.modelType}
                  label="Model Type"
                  onChange={(e) => handleModelTypeChange(e.target.value as 'flux' | 'sdxl')}
                >
                  <MenuItem value="flux">FLUX (1024x1024)</MenuItem>
                  <MenuItem value="sdxl">SDXL (512x512)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Resolution */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Training Resolution"
                value={config.resolution}
                onChange={(e) => setConfig(prev => ({ ...prev, resolution: e.target.value }))}
                placeholder="1024,1024"
                helperText="Format: width,height (e.g., 1024,1024)"
                sx={commonInputStyles}
              />
            </Grid>

            {/* Base Model Path */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  fullWidth
                  label="Base Model Path"
                  value={config.baseModelPath}
                  onChange={(e) => setConfig(prev => ({ ...prev, baseModelPath: e.target.value }))}
                  placeholder="Path to base model file"
                  error={validationResult?.errors.some(err => err.includes('base model'))}
                  sx={commonInputStyles}
                />
                <IconButton onClick={() => handleFileSelect('baseModelPath', 'safetensors,ckpt,pt')}>
                  <FolderOpenIcon />
                </IconButton>
              </Box>
            </Grid>

            {/* FLUX-specific model paths */}
            {config.modelType === 'flux' && (
              <>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField
                      fullWidth
                      label="CLIP-L Path"
                      value={config.clipLPath || ''}
                      onChange={(e) => setConfig(prev => ({ ...prev, clipLPath: e.target.value }))}
                      placeholder="Path to CLIP-L model"
                      sx={commonInputStyles}
                    />
                    <IconButton onClick={() => handleFileSelect('clipLPath', 'safetensors,bin')}>
                      <FolderOpenIcon />
                    </IconButton>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField
                      fullWidth
                      label="T5-XXL Path"
                      value={config.t5xxlPath || ''}
                      onChange={(e) => setConfig(prev => ({ ...prev, t5xxlPath: e.target.value }))}
                      placeholder="Path to T5-XXL model"
                      sx={commonInputStyles}
                    />
                    <IconButton onClick={() => handleFileSelect('t5xxlPath', 'safetensors,bin')}>
                      <FolderOpenIcon />
                    </IconButton>
                  </Box>
                </Grid>
              </>
            )}

            {/* VAE Path (Optional) */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  fullWidth
                  label="VAE Path (Optional)"
                  value={config.vaePath || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, vaePath: e.target.value }))}
                  placeholder="Path to VAE model (optional)"
                  sx={commonInputStyles}
                />
                <IconButton onClick={() => handleFileSelect('vaePath', 'safetensors,ckpt,pt')}>
                  <FolderOpenIcon />
                </IconButton>
              </Box>
            </Grid>

            {/* Dataset Path */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  fullWidth
                  label="Dataset Path"
                  value={config.datasetPath}
                  onChange={(e) => setConfig(prev => ({ ...prev, datasetPath: e.target.value }))}
                  placeholder="Path to training dataset folder"
                  error={validationResult?.errors.some(err => err.includes('dataset'))}
                  sx={commonInputStyles}
                />
                <IconButton onClick={() => handleFolderSelect('datasetPath')}>
                  <FolderOpenIcon />
                </IconButton>
              </Box>
              {estimatedDatasetSize > 0 && (
                <Typography variant="caption" color="text.secondary">
                  Estimated dataset size: {estimatedDatasetSize} images
                </Typography>
              )}
            </Grid>

            {/* Output Configuration */}
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  fullWidth
                  label="Output Directory"
                  value={config.outputDir}
                  onChange={(e) => setConfig(prev => ({ ...prev, outputDir: e.target.value }))}
                  placeholder="Path to save trained model"
                  error={validationResult?.errors.some(err => err.includes('output'))}
                  sx={commonInputStyles}
                />
                <IconButton onClick={() => handleFolderSelect('outputDir')}>
                  <FolderOpenIcon />
                </IconButton>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Model Name"
                value={config.outputName}
                onChange={(e) => setConfig(prev => ({ ...prev, outputName: e.target.value }))}
                placeholder="my_lora"
                sx={commonInputStyles}
              />
            </Grid>

            {/* Training Parameters */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1 }}>
                Training Parameters
              </Typography>
              <Divider />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Learning Rate"
                value={config.learningRate}
                onChange={(e) => setConfig(prev => ({ ...prev, learningRate: parseFloat(e.target.value) }))}
                inputProps={{ step: 0.0001, min: 0.0001, max: 0.01 }}
                helperText="Typical: 1e-4 to 1e-5"
                sx={commonInputStyles}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Batch Size"
                value={config.batchSize}
                onChange={(e) => setConfig(prev => ({ ...prev, batchSize: parseInt(e.target.value) }))}
                inputProps={{ min: 1, max: 8 }}
                helperText={gpuOptimizations ? `Recommended: ${gpuOptimizations.recommendedBatchSize}` : 'GPU-dependent'}
                sx={commonInputStyles}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Epochs"
                value={config.epochs}
                onChange={(e) => setConfig(prev => ({ ...prev, epochs: parseInt(e.target.value) }))}
                inputProps={{ min: 1, max: 1000 }}
                helperText="Training iterations"
                sx={commonInputStyles}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Max Train Steps"
                value={config.maxTrainSteps || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, maxTrainSteps: e.target.value ? parseInt(e.target.value) : undefined }))}
                inputProps={{ min: 1 }}
                helperText="Optional override"
                sx={commonInputStyles}
              />
            </Grid>

            {/* Network Configuration */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1 }}>
                Network Configuration
              </Typography>
              <Divider />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Network Dimension"
                value={config.networkDim}
                onChange={(e) => setConfig(prev => ({ ...prev, networkDim: parseInt(e.target.value) }))}
                inputProps={{ min: 1, max: 1024 }}
                helperText="LoRA rank (4-128)"
                sx={commonInputStyles}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Network Alpha"
                value={config.networkAlpha}
                onChange={(e) => setConfig(prev => ({ ...prev, networkAlpha: parseInt(e.target.value) }))}
                inputProps={{ min: 1, max: 1024 }}
                helperText="Usually same as dim"
                sx={commonInputStyles}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth sx={commonInputStyles}>
                <InputLabel>Network Module</InputLabel>
                <Select
                  value={config.networkModule}
                  label="Network Module"
                  onChange={(e) => setConfig(prev => ({ ...prev, networkModule: e.target.value }))}
                >
                  <MenuItem value="networks.lora">LoRA</MenuItem>
                  <MenuItem value="networks.dylora">DyLoRA</MenuItem>
                  <MenuItem value="networks.lora_fa">LoRA-FA</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Advanced Settings */}
            {showAdvanced && (
              <>
                <Grid item xs={12}>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      mt: 2, 
                      border: '2px dashed',
                      borderColor: 'primary.main',
                      bgcolor: 'action.hover'
                    }}
                  >
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SettingsIcon color="primary" />
                      Advanced Settings
                      <Chip label="Expert Mode" size="small" color="primary" />
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Fine-tune optimizer, scheduler, and memory settings for optimal performance
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth sx={commonInputStyles}>
                    <InputLabel>Mixed Precision</InputLabel>
                    <Select
                      value={config.mixedPrecision}
                      label="Mixed Precision"
                      onChange={(e) => setConfig(prev => ({ ...prev, mixedPrecision: e.target.value as any }))}
                    >
                      <MenuItem value="no">No</MenuItem>
                      <MenuItem value="fp16">FP16</MenuItem>
                      <MenuItem value="bf16">BF16</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth sx={commonInputStyles}>
                    <InputLabel>Optimizer</InputLabel>
                    <Select
                      value={config.optimizer}
                      label="Optimizer"
                      onChange={(e) => setConfig(prev => ({ ...prev, optimizer: e.target.value }))}
                    >
                      <MenuItem value="AdamW">AdamW</MenuItem>
                      <MenuItem value="AdamW8bit">AdamW8bit</MenuItem>
                      <MenuItem value="Lion">Lion</MenuItem>
                      <MenuItem value="SGDNesterov">SGD Nesterov</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth sx={commonInputStyles}>
                    <InputLabel>LR Scheduler</InputLabel>
                    <Select
                      value={config.lrScheduler}
                      label="LR Scheduler"
                      onChange={(e) => setConfig(prev => ({ ...prev, lrScheduler: e.target.value }))}
                    >
                      <MenuItem value="cosine">Cosine</MenuItem>
                      <MenuItem value="cosine_with_restarts">Cosine with Restarts</MenuItem>
                      <MenuItem value="linear">Linear</MenuItem>
                      <MenuItem value="constant">Constant</MenuItem>
                      <MenuItem value="polynomial">Polynomial</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="LR Warmup Steps"
                    value={config.lrWarmupSteps}
                    onChange={(e) => setConfig(prev => ({ ...prev, lrWarmupSteps: parseInt(e.target.value) }))}
                    inputProps={{ min: 0 }}
                    helperText="Learning rate warmup"
                    sx={commonInputStyles}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Sample Every N Steps"
                    value={config.sampleEveryNSteps}
                    onChange={(e) => setConfig(prev => ({ ...prev, sampleEveryNSteps: parseInt(e.target.value) }))}
                    inputProps={{ min: 1 }}
                    helperText="Generate samples"
                    sx={commonInputStyles}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.gradientCheckpointing}
                        onChange={(e) => setConfig(prev => ({ ...prev, gradientCheckpointing: e.target.checked }))}
                      />
                    }
                    label="Gradient Checkpointing"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.xformersMemoryEfficientAttention}
                        onChange={(e) => setConfig(prev => ({ ...prev, xformersMemoryEfficientAttention: e.target.checked }))}
                      />
                    }
                    label="xFormers Memory Efficient Attention"
                  />
                </Grid>
              </>
            )}

            {/* Sample Prompts */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1 }}>
                Sample Prompts
              </Typography>
              <Divider />
            </Grid>
            <Grid item xs={12}>
              <PromptManager
                value={config.samplePrompts}
                onChange={(prompts) => setConfig(prev => ({ ...prev, samplePrompts: prompts }))}
                label="Sample Prompts"
                helperText="Prompts used for validation during training"
              />
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={handleResetForm}
                  startIcon={<RefreshIcon />}
                >
                  Reset Form
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleManualSave}
                  startIcon={<SaveIcon />}
                  disabled={autoSaveStatus === 'saving'}
                >
                  Save Now
                </Button>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleStartTraining}
                  disabled={!validationResult?.isValid || isTraining}
                  startIcon={isTraining ? <StopIcon /> : <PlayArrowIcon />}
                  sx={{ px: 4 }}
                >
                  {isTraining ? 'Training...' : 'Start Training'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      {isTraining && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Training Progress
            </Typography>
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Training Status: {isTraining ? 'Running' : 'Idle'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Epoch {currentEpoch} / {config.epochs}
                </Typography>
              </Box>
              <Box sx={{ width: '100%', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={config.epochs > 0 ? (currentEpoch / config.epochs) * 100 : 0}
                      sx={{ height: 8, borderRadius: 5 }}
                    />
                  </Box>
                  <Box sx={{ minWidth: 35 }}>
                    <Typography variant="body2" color="text.secondary">
                      {config.epochs > 0 ? Math.round((currentEpoch / config.epochs) * 100) : 0}%
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<StopIcon />}
                  onClick={() => window.api.python.cancelTraining(currentProcessId || 'current')}
                  disabled={!isTraining}
                >
                  Stop Training
                </Button>
              </Box>
              <Typography variant="subtitle2" gutterBottom>
                Recent Training Output:
              </Typography>
              <Paper
                sx={{
                  maxHeight: 300,
                  overflow: 'auto',
                  backgroundColor: 'background.default',
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                }}
              >
                {trainingLogs.length > 0 ? (
                  trainingLogs.slice(-20).map((log, index) => (
                    <Typography 
                      key={index}
                      variant="body2" 
                      sx={{ 
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        mb: 0.5,
                        whiteSpace: 'pre-wrap',
                        color: log.includes('error') || log.includes('Error') ? 'error.main' : 'text.primary',
                      }}
                    >
                      {log}
                    </Typography>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Waiting for training output...
                  </Typography>
                )}
              </Paper>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default SimpleTrainingForm;
