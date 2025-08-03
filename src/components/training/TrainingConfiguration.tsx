import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Chip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ScheduleConfig } from '../../services/training/TrainingScheduler';
import { MemoryEstimator, MemoryRequirement } from '../../services/training/MemoryEstimator';
import FileSelector from '../common/FileSelector';

interface TrainingConfig {
  // Model Configuration
  modelType: 'flux' | 'sdxl';
  baseModel: string;
  clipModel: string;
  t5Model: string;
  
  // Network Configuration
  networkType: 'lora' | 'full' | 'db_lora';
  networkDim: number;
  networkAlpha: number;
  
  // Training Parameters
  batchSize: number;
  learningRate: number;
  maxTrainSteps: number;
  saveEveryNSteps: number;
  
  // Optimization
  optimizer: 'AdamW' | 'AdamW8bit' | 'Lion' | 'SGD';
  mixedPrecision: 'no' | 'fp16' | 'bf16';
  gradientCheckpointing: boolean;
  xformers: boolean;
  
  // Dataset
  datasetPath: string;
  resolution: number;
  enableBuckets: boolean;
  
  // Advanced
  scheduleConfig: ScheduleConfig;
  useWandb: boolean;
  wandbProject: string;
}

interface TrainingConfigurationProps {
  onStartTraining: (config: TrainingConfig) => void;
  onSavePreset: (config: TrainingConfig, name: string) => void;
  onLoadPreset: (name: string) => void;
}

const TrainingConfiguration: React.FC<TrainingConfigurationProps> = ({
  onStartTraining,
  onSavePreset,
  onLoadPreset,
}) => {
  const [config, setConfig] = useState<TrainingConfig>({
    modelType: 'flux',
    baseModel: '',
    clipModel: '',
    t5Model: '',
    networkType: 'lora',
    networkDim: 64,
    networkAlpha: 32,
    batchSize: 1,
    learningRate: 1e-4,
    maxTrainSteps: 1000,
    saveEveryNSteps: 100,
    optimizer: 'AdamW8bit',
    mixedPrecision: 'bf16',
    gradientCheckpointing: true,
    xformers: true,
    datasetPath: '',
    resolution: 512,
    enableBuckets: true,
    scheduleConfig: {
      type: 'cosine',
      initialLearningRate: 1e-4,
      finalLearningRate: 1e-6,
      totalSteps: 1000,
      warmupSteps: 100,
    },
    useWandb: false,
    wandbProject: '',
  });

  const [memoryEstimate, setMemoryEstimate] = useState<MemoryRequirement | null>(null);
  const [presetName, setPresetName] = useState('');
  const [availableGPUMemory] = useState(8192); // Default 8GB

  useEffect(() => {
    // Update memory estimate when config changes
    const estimate = MemoryEstimator.estimateMemoryRequirements(
      config.modelType === 'flux' ? 'flux-dev' : 'sdxl-base',
      config.batchSize,
      config.resolution,
      config.mixedPrecision === 'no' ? 'fp32' : config.mixedPrecision as any,
      config.networkDim,
      config.gradientCheckpointing,
      config.networkType === 'lora'
    );
    setMemoryEstimate(estimate);

    // Update schedule total steps
    setConfig(prev => ({
      ...prev,
      scheduleConfig: {
        ...prev.scheduleConfig,
        totalSteps: prev.maxTrainSteps,
      }
    }));
  }, [config.modelType, config.batchSize, config.resolution, config.mixedPrecision, 
      config.networkDim, config.gradientCheckpointing, config.networkType, config.maxTrainSteps]);

  const handleConfigChange = (field: keyof TrainingConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleScheduleChange = (field: keyof ScheduleConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      scheduleConfig: { ...prev.scheduleConfig, [field]: value }
    }));
  };

  const getOptimalBatchSize = () => {
    const optimal = MemoryEstimator.getOptimalBatchSize(
      config.modelType === 'flux' ? 'flux-dev' : 'sdxl-base',
      availableGPUMemory,
      config.resolution,
      config.mixedPrecision === 'no' ? 'fp32' : config.mixedPrecision as any,
      config.networkDim,
      config.gradientCheckpointing
    );
    handleConfigChange('batchSize', optimal);
  };

  const validateConfig = (): string[] => {
    const errors: string[] = [];
    
    if (!config.baseModel) errors.push('Base model path is required');
    if (!config.datasetPath) errors.push('Dataset path is required');
    if (config.modelType === 'flux' && !config.clipModel) errors.push('CLIP model is required for Flux');
    if (config.modelType === 'flux' && !config.t5Model) errors.push('T5XXL model is required for Flux');
    if (config.batchSize < 1) errors.push('Batch size must be at least 1');
    if (config.learningRate <= 0) errors.push('Learning rate must be positive');
    if (config.maxTrainSteps <= 0) errors.push('Max train steps must be positive');
    
    return errors;
  };

  const canStartTraining = validateConfig().length === 0;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Training Configuration
      </Typography>

      {memoryEstimate && (
        <Alert 
          severity={memoryEstimate.totalMemory > availableGPUMemory * 0.9 ? 'warning' : 'info'}
          sx={{ mb: 3 }}
        >
          <Typography variant="body2">
            Estimated Memory Usage: {MemoryEstimator.formatMemorySize(memoryEstimate.totalMemory)}
            {memoryEstimate.totalMemory > availableGPUMemory * 0.9 && 
              ' - Consider reducing batch size or enabling optimizations'}
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Button size="small" onClick={getOptimalBatchSize}>
              Optimize Batch Size
            </Button>
          </Box>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Model Configuration */}
        <Grid item xs={12}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Model Configuration</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Model Type</InputLabel>
                    <Select
                      value={config.modelType}
                      onChange={(e) => handleConfigChange('modelType', e.target.value)}
                      label="Model Type"
                    >
                      <MenuItem value="flux">Flux</MenuItem>
                      <MenuItem value="sdxl">SDXL</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={8}>
                  <FileSelector
                    label="Base Model"
                    value={config.baseModel}
                    onChange={(value) => handleConfigChange('baseModel', value)}
                    filter=".safetensors,.ckpt"
                    required
                  />
                </Grid>

                {config.modelType === 'flux' && (
                  <>
                    <Grid item xs={12} md={6}>
                      <FileSelector
                        label="CLIP-L Model"
                        value={config.clipModel}
                        onChange={(value) => handleConfigChange('clipModel', value)}
                        filter=".safetensors,.ckpt"
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FileSelector
                        label="T5XXL Model"
                        value={config.t5Model}
                        onChange={(value) => handleConfigChange('t5Model', value)}
                        filter=".safetensors,.ckpt"
                        required
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Network Configuration */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Network Configuration</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Network Type</InputLabel>
                    <Select
                      value={config.networkType}
                      onChange={(e) => handleConfigChange('networkType', e.target.value)}
                      label="Network Type"
                    >
                      <MenuItem value="lora">LoRA</MenuItem>
                      <MenuItem value="db_lora">DB-LoRA</MenuItem>
                      <MenuItem value="full">Full Fine-tuning</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Network Dimension"
                    value={config.networkDim}
                    onChange={(e) => handleConfigChange('networkDim', parseInt(e.target.value))}
                    inputProps={{ min: 1, max: 1024 }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Network Alpha"
                    value={config.networkAlpha}
                    onChange={(e) => handleConfigChange('networkAlpha', parseInt(e.target.value))}
                    inputProps={{ min: 1, max: 1024 }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Training Parameters */}
        <Grid item xs={12}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Training Parameters</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Batch Size"
                    value={config.batchSize}
                    onChange={(e) => handleConfigChange('batchSize', parseInt(e.target.value))}
                    inputProps={{ min: 1, max: 32 }}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Learning Rate"
                    value={config.learningRate}
                    onChange={(e) => handleConfigChange('learningRate', parseFloat(e.target.value))}
                    inputProps={{ min: 0, max: 1, step: 0.0001 }}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Max Train Steps"
                    value={config.maxTrainSteps}
                    onChange={(e) => handleConfigChange('maxTrainSteps', parseInt(e.target.value))}
                    inputProps={{ min: 1 }}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Save Every N Steps"
                    value={config.saveEveryNSteps}
                    onChange={(e) => handleConfigChange('saveEveryNSteps', parseInt(e.target.value))}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Optimization */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Optimization</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Optimizer</InputLabel>
                    <Select
                      value={config.optimizer}
                      onChange={(e) => handleConfigChange('optimizer', e.target.value)}
                      label="Optimizer"
                    >
                      <MenuItem value="AdamW">AdamW</MenuItem>
                      <MenuItem value="AdamW8bit">AdamW 8-bit</MenuItem>
                      <MenuItem value="Lion">Lion</MenuItem>
                      <MenuItem value="SGD">SGD</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Mixed Precision</InputLabel>
                    <Select
                      value={config.mixedPrecision}
                      onChange={(e) => handleConfigChange('mixedPrecision', e.target.value)}
                      label="Mixed Precision"
                    >
                      <MenuItem value="no">No</MenuItem>
                      <MenuItem value="fp16">FP16</MenuItem>
                      <MenuItem value="bf16">BF16</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.gradientCheckpointing}
                        onChange={(e) => handleConfigChange('gradientCheckpointing', e.target.checked)}
                      />
                    }
                    label="Gradient Checkpointing"
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.xformers}
                        onChange={(e) => handleConfigChange('xformers', e.target.checked)}
                      />
                    }
                    label="Use xFormers"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Dataset Configuration */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Dataset Configuration</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <FileSelector
                    label="Dataset Path"
                    value={config.datasetPath}
                    onChange={(value) => handleConfigChange('datasetPath', value)}
                    isDirectory
                    required
                  />
                </Grid>

                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Resolution"
                    value={config.resolution}
                    onChange={(e) => handleConfigChange('resolution', parseInt(e.target.value))}
                    inputProps={{ min: 256, max: 2048, step: 64 }}
                  />
                </Grid>

                <Grid item xs={12} md={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.enableBuckets}
                        onChange={(e) => handleConfigChange('enableBuckets', e.target.checked)}
                      />
                    }
                    label="Enable Buckets"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Learning Rate Schedule */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Learning Rate Schedule</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Schedule Type</InputLabel>
                    <Select
                      value={config.scheduleConfig.type}
                      onChange={(e) => handleScheduleChange('type', e.target.value)}
                      label="Schedule Type"
                    >
                      <MenuItem value="constant">Constant</MenuItem>
                      <MenuItem value="linear">Linear</MenuItem>
                      <MenuItem value="cosine">Cosine</MenuItem>
                      <MenuItem value="polynomial">Polynomial</MenuItem>
                      <MenuItem value="warmup_cosine">Warmup + Cosine</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {config.scheduleConfig.type !== 'constant' && (
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Final Learning Rate"
                      value={config.scheduleConfig.finalLearningRate || 0}
                      onChange={(e) => handleScheduleChange('finalLearningRate', parseFloat(e.target.value))}
                      inputProps={{ min: 0, max: 1, step: 0.000001 }}
                    />
                  </Grid>
                )}

                {config.scheduleConfig.type === 'warmup_cosine' && (
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Warmup Steps"
                      value={config.scheduleConfig.warmupSteps || 0}
                      onChange={(e) => handleScheduleChange('warmupSteps', parseInt(e.target.value))}
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                )}

                {config.scheduleConfig.type === 'polynomial' && (
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Power"
                      value={config.scheduleConfig.power || 1}
                      onChange={(e) => handleScheduleChange('power', parseFloat(e.target.value))}
                      inputProps={{ min: 0.1, max: 5, step: 0.1 }}
                    />
                  </Grid>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => onStartTraining(config)}
                  disabled={!canStartTraining}
                  size="large"
                >
                  Start Training
                </Button>

                <TextField
                  size="small"
                  label="Preset Name"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  sx={{ width: 200 }}
                />

                <Button
                  variant="outlined"
                  onClick={() => onSavePreset(config, presetName)}
                  disabled={!presetName}
                >
                  Save Preset
                </Button>

                <Button variant="outlined" onClick={() => onLoadPreset('')}>
                  Load Preset
                </Button>

                {!canStartTraining && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="error">
                      Please fix the following issues:
                    </Typography>
                    {validateConfig().map((error, index) => (
                      <Chip key={index} label={error} color="error" size="small" sx={{ mr: 1, mt: 0.5 }} />
                    ))}
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TrainingConfiguration;
