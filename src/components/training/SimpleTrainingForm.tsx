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
import { LoRATrainingConfig, DEFAULT_TRAINING_CONFIG } from '../../types/training';
import { AppSettings, DEFAULT_SETTINGS } from '../../types/settings';
import { VRAMOptimizations } from '../../services/GPUDetection';
import { trainingCommandBuilder } from '../../services/TrainingCommandBuilder';
import { trainingExecutor } from '../../services/TrainingExecutor';
import PromptManager from '../prompts/PromptManager';
import useAutoSave from '../../hooks/useAutoSave';
import { autoSaveService } from '../../services/AutoSaveService';

interface SimpleTrainingFormProps {
  onTrainingStart?: (process: any) => void;
  onTrainingProgress?: (progress: any) => void;
  gpuOptimizations?: VRAMOptimizations | null;
}

const SimpleTrainingForm: React.FC<SimpleTrainingFormProps> = ({
  onTrainingStart,
  onTrainingProgress,
  gpuOptimizations,
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
      // Merge saved data with current config, preserving structure
      setConfig(prev => ({
        ...prev,
        ...savedData,
        // Ensure required fields are preserved even if not in saved data
        samplePrompts: savedData.samplePrompts || trainingCommandBuilder.getDefaultSamplePrompts(savedData.modelType || 'flux'),
        outputName: savedData.outputName || 'my_lora',
        resolution: savedData.resolution || (savedData.modelType === 'flux' ? '1024,1024' : '512,512')
      }));
      console.log('Training configuration restored from auto-save');
    },
    interval: 5000, // Save every 5 seconds
    saveOnChange: true, // Save immediately when data changes
    saveOnUnload: true, // Save when window closes
    showNotifications: true, // Show user-friendly notifications
    debug: false // Disable debug logging in production
  });

  // Load saved configuration on startup
  useEffect(() => {
    const initializeForm = async () => {
      try {
        // Check if there's saved data
        const savedInfo = await getSavedDataInfo();
        if (savedInfo.exists) {
          console.log(`Found saved training configuration from ${savedInfo.lastSaved}`);
          // Data will be automatically loaded by the useAutoSave hook
        } else {
          console.log('No saved training configuration found, using defaults');
        }
      } catch (error) {
        console.warn('Failed to initialize form with saved data:', error);
      }
    };

    initializeForm();
  }, [getSavedDataInfo]);

  // Track auto-save status for user feedback
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const updateStatus = () => {
      setAutoSaveStatus('saving');
      timeoutId = setTimeout(() => {
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      }, 500);
    };

    updateStatus();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [config]);

  // Auto-save configuration every minute (legacy support)
  useEffect(() => {
    const autoSaveInterval = setInterval(async () => {
      try {
        await window.api.store.set('lastTrainingConfig', config);
      } catch (error) {
        console.warn('Legacy auto-save failed:', error);
      }
    }, 60000); // 60 seconds = 1 minute

    return () => clearInterval(autoSaveInterval);
  }, [config]);

  // Apply GPU optimizations when available
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

  // Validate configuration whenever it changes
  useEffect(() => {
    const result = trainingCommandBuilder.validateConfig(config);
    setValidationResult(result);
  }, [config]);

  // Estimate dataset size when dataset path changes
  useEffect(() => {
    if (config.datasetPath) {
      trainingExecutor.estimateDatasetSize(config.datasetPath)
        .then(setEstimatedDatasetSize)
        .catch(() => setEstimatedDatasetSize(0));
    }
  }, [config.datasetPath]);

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
    if (!validationResult?.isValid) {
      return;
    }

    try {
      setIsTraining(true);
      const process = await trainingExecutor.startTraining(config);
      
      // Set up progress monitoring
      trainingExecutor.onProgress(process.id, (progress) => {
        onTrainingProgress?.(progress);
      });

      onTrainingStart?.(process);
    } catch (error) {
      console.error('Failed to start training:', error);
      setIsTraining(false);
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

  // Manual save function
  const handleManualSave = async () => {
    try {
      await saveData();
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Manual save failed:', error);
    }
  };

  // Clear saved data function
  const handleClearSavedData = async () => {
    try {
      await clearSavedData();
      console.log('Saved training configuration cleared');
    } catch (error) {
      console.error('Failed to clear saved data:', error);
    }
  };

  // Reset form with option to preserve saved data
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
              {/* Auto-save status indicator */}
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

              {/* Manual save/restore controls */}
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
                label="Advanced Settings"
              />
            </Box>
          </Box>

          {/* GPU Optimization Status */}
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

          {/* Validation Alerts */}
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
            {/* Model Configuration */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Model Configuration
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Model Type</InputLabel>
                <Select
                  value={config.modelType}
                  onChange={(e) => handleModelTypeChange(e.target.value as 'flux' | 'sdxl')}
                  label="Model Type"
                >
                  <MenuItem value="flux">FLUX.1</MenuItem>
                  <MenuItem value="sdxl">SDXL</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  label="Base Model Path"
                  value={config.baseModelPath}
                  onChange={(e) => setConfig(prev => ({ ...prev, baseModelPath: e.target.value }))}
                  placeholder="Select base model file (.safetensors, .ckpt)"
                />
                <Button
                  variant="contained"
                  onClick={() => handleFileSelect('baseModelPath', 'safetensors,ckpt')}
                  startIcon={<FolderOpenIcon />}
                >
                  Browse
                </Button>
              </Box>
            </Grid>

            {config.modelType === 'flux' && (
              <>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      label="CLIP-L Model (Optional)"
                      value={config.clipLPath}
                      onChange={(e) => setConfig(prev => ({ ...prev, clipLPath: e.target.value }))}
                      placeholder="CLIP-L model path"
                    />
                    <Button
                      variant="outlined"
                      onClick={() => handleFileSelect('clipLPath', 'safetensors,ckpt')}
                      startIcon={<FolderOpenIcon />}
                    >
                      Browse
                    </Button>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      label="T5XXL Model (Optional)"
                      value={config.t5xxlPath}
                      onChange={(e) => setConfig(prev => ({ ...prev, t5xxlPath: e.target.value }))}
                      placeholder="T5XXL model path"
                    />
                    <Button
                      variant="outlined"
                      onClick={() => handleFileSelect('t5xxlPath', 'safetensors,ckpt')}
                      startIcon={<FolderOpenIcon />}
                    >
                      Browse
                    </Button>
                  </Box>
                </Grid>
              </>
            )}

            {/* VAE/AE Field for both FLUX and SDXL */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  label="VAE/AE Model (Optional)"
                  value={config.vaePath}
                  onChange={(e) => setConfig(prev => ({ ...prev, vaePath: e.target.value }))}
                  placeholder="VAE or AutoEncoder model path"
                  helperText="Optional VAE or AutoEncoder model for improved image quality"
                />
                <Button
                  variant="outlined"
                  onClick={() => handleFileSelect('vaePath', 'safetensors,ckpt,pth')}
                  startIcon={<FolderOpenIcon />}
                >
                  Browse
                </Button>
              </Box>
            </Grid>

            {/* Dataset Configuration */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Dataset Configuration
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  label="Dataset Path"
                  value={config.datasetPath}
                  onChange={(e) => setConfig(prev => ({ ...prev, datasetPath: e.target.value }))}
                  placeholder="Select folder containing training images"
                  helperText={estimatedDatasetSize > 0 ? `Estimated ${estimatedDatasetSize} images` : ''}
                />
                <Button
                  variant="contained"
                  onClick={() => handleFolderSelect('datasetPath')}
                  startIcon={<FolderOpenIcon />}
                >
                  Browse
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Training Resolution</InputLabel>
                <Select
                  value={config.resolution}
                  onChange={(e) => setConfig(prev => ({ ...prev, resolution: e.target.value }))}
                  label="Training Resolution"
                >
                  <MenuItem value="512">512x512</MenuItem>
                  <MenuItem value="768">768x768</MenuItem>
                  <MenuItem value="1024">1024x1024</MenuItem>
                  <MenuItem value="1024,1024">1024x1024 (FLUX Default)</MenuItem>
                  <MenuItem value="512,768">512x768 (Portrait)</MenuItem>
                  <MenuItem value="768,512">768x512 (Landscape)</MenuItem>
                  <MenuItem value="1024,768">1024x768 (Wide)</MenuItem>
                  <MenuItem value="768,1024">768x1024 (Tall)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Custom Resolution"
                placeholder="e.g., 1024,1024 or 512"
                helperText="Override preset resolution (width,height or single size)"
                value={config.resolution}
                onChange={(e) => setConfig(prev => ({ ...prev, resolution: e.target.value }))}
              />
            </Grid>

            {/* Output Configuration */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Output Configuration
              </Typography>
            </Grid>

            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  label="Output Directory"
                  value={config.outputDir}
                  onChange={(e) => setConfig(prev => ({ ...prev, outputDir: e.target.value }))}
                  placeholder="Select output directory for LoRA model"
                />
                <Button
                  variant="contained"
                  onClick={() => handleFolderSelect('outputDir')}
                  startIcon={<FolderOpenIcon />}
                >
                  Browse
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Output Name"
                value={config.outputName}
                onChange={(e) => setConfig(prev => ({ ...prev, outputName: e.target.value }))}
                placeholder="my_lora"
              />
            </Grid>

            {/* Training Parameters */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Training Parameters
              </Typography>
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Learning Rate"
                value={config.learningRate}
                onChange={(e) => setConfig(prev => ({ ...prev, learningRate: parseFloat(e.target.value) }))}
                inputProps={{ step: 0.0001, min: 0.00001, max: 0.01 }}
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
                helperText={calculateTotalSteps() > 0 ? `~${calculateTotalSteps()} steps` : ''}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Network Dimension"
                value={config.networkDim}
                onChange={(e) => setConfig(prev => ({ ...prev, networkDim: parseInt(e.target.value) }))}
                inputProps={{ min: 1, max: 1024 }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Network Alpha"
                value={config.networkAlpha}
                onChange={(e) => setConfig(prev => ({ ...prev, networkAlpha: parseInt(e.target.value) }))}
                inputProps={{ min: 1, max: 1024 }}
              />
            </Grid>

            {/* Advanced Settings */}
            {showAdvanced && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Advanced Settings
                  </Typography>
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Batch Size"
                    value={config.batchSize}
                    onChange={(e) => setConfig(prev => ({ ...prev, batchSize: parseInt(e.target.value) }))}
                    inputProps={{ min: 1, max: 32 }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Mixed Precision</InputLabel>
                    <Select
                      value={config.mixedPrecision}
                      onChange={(e) => setConfig(prev => ({ ...prev, mixedPrecision: e.target.value as any }))}
                      label="Mixed Precision"
                    >
                      <MenuItem value="no">No</MenuItem>
                      <MenuItem value="fp16">FP16</MenuItem>
                      <MenuItem value="bf16">BF16</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Optimizer</InputLabel>
                    <Select
                      value={config.optimizer}
                      onChange={(e) => setConfig(prev => ({ ...prev, optimizer: e.target.value }))}
                      label="Optimizer"
                    >
                      <MenuItem value="AdamW8bit">AdamW 8bit</MenuItem>
                      <MenuItem value="AdamW">AdamW</MenuItem>
                      <MenuItem value="SGD">SGD</MenuItem>
                      <MenuItem value="Lion">Lion</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}

            {/* Sample Generation */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Sample Generation
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <PromptManager
                value={config.samplePrompts}
                onChange={(prompts) => setConfig(prev => ({ ...prev, samplePrompts: prompts }))}
                label="Sample Generation Prompts"
                helperText={`Samples will be generated every ${calculateSampleSteps()} steps`}
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
    </Box>
  );
};

export default SimpleTrainingForm;
