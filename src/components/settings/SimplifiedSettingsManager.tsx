import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  Button,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  FormControlLabel,
  Switch,
  Chip,
  Paper,
} from '@mui/material';
import {
  Save as SaveIcon,
  RestoreFromTrash as ResetIcon,
  Memory as MemoryIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import FileSelector from '../common/FileSelector';
import { AppSettings, DEFAULT_SETTINGS, VRAM_PRESETS, VRAMPreset } from '../../types/settings';

const SettingsManager: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [originalSettings, setOriginalSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' 
  });

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasChanges(changed);
  }, [settings, originalSettings]);

  const loadSettings = async () => {
    try {
      const savedSettings = await window.api.store.get('app-settings');
      if (savedSettings) {
        const mergedSettings = { ...DEFAULT_SETTINGS, ...savedSettings };
        setSettings(mergedSettings);
        setOriginalSettings(mergedSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showSnackbar('Error loading settings', 'error');
    }
  };

  const saveSettings = async () => {
    try {
      await window.api.store.set('app-settings', settings);
      setOriginalSettings(settings);
      showSnackbar('Settings saved successfully', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showSnackbar('Error saving settings', 'error');
    }
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    showSnackbar('Settings reset to defaults', 'success');
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const updateTrainingSetting = (key: keyof AppSettings['training'], value: any) => {
    setSettings(prev => ({
      ...prev,
      training: { ...prev.training, [key]: value }
    }));
  };

  const updatePathSetting = (key: keyof AppSettings['paths'], value: string) => {
    setSettings(prev => ({
      ...prev,
      paths: { ...prev.paths, [key]: value }
    }));
  };

  const applyVRAMPreset = (presetName: string) => {
    const preset = VRAM_PRESETS.find(p => p.name === presetName);
    if (!preset) return;

    setSettings(prev => ({
      ...prev,
      training: {
        ...prev.training,
        selectedVRAMPreset: presetName,
        customVRAMSettings: false,
        defaultBatchSize: preset.settings.batchSize,
        defaultMixedPrecision: preset.settings.mixedPrecision,
        defaultOptimizer: preset.settings.optimizer,
        gradientCheckpointing: preset.settings.gradientCheckpointing,
        cacheLatentsToDisk: preset.settings.cacheLatentsToDisk,
        cacheTextEncoderOutputsToDisk: preset.settings.cacheTextEncoderOutputsToDisk,
        maxDataLoaderWorkers: preset.settings.maxDataLoaderWorkers,
        enableFP8Base: preset.settings.additionalArgs?.includes('--fp8_base') || false,
        enableHighVRAM: preset.settings.additionalArgs?.includes('--highvram') || false,
      }
    }));
    
    showSnackbar(`Applied ${presetName} optimization settings`, 'success');
  };

  const getSelectedPreset = (): VRAMPreset | undefined => {
    return VRAM_PRESETS.find(p => p.name === settings.training.selectedVRAMPreset);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom>
            Application Settings
          </Typography>
          
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Configure default training parameters, VRAM optimizations, and essential paths.
          </Typography>

          {/* VRAM Optimization Presets */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MemoryIcon />
              VRAM Optimization
            </Typography>
            
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Choose a preset based on your GPU's VRAM to optimize training performance and memory usage.
            </Typography>

            <Grid container spacing={2}>
              {VRAM_PRESETS.map((preset) => (
                <Grid item xs={12} md={6} key={preset.name}>
                  <Paper
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      border: settings.training.selectedVRAMPreset === preset.name ? 2 : 1,
                      borderColor: settings.training.selectedVRAMPreset === preset.name 
                        ? 'primary.main' 
                        : 'divider',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'action.hover'
                      }
                    }}
                    onClick={() => applyVRAMPreset(preset.name)}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {preset.name}
                      </Typography>
                      <Chip 
                        label={`${preset.vramGB}GB`} 
                        size="small" 
                        color={settings.training.selectedVRAMPreset === preset.name ? 'primary' : 'default'}
                      />
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      {preset.description}
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      <Chip label={`Batch: ${preset.settings.batchSize}`} size="small" variant="outlined" />
                      <Chip label={preset.settings.mixedPrecision.toUpperCase()} size="small" variant="outlined" />
                      <Chip label={preset.settings.optimizer} size="small" variant="outlined" />
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {getSelectedPreset() && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Current Settings:</strong> {getSelectedPreset()?.description}
                  <br />
                  Batch Size: {getSelectedPreset()?.settings.batchSize}, 
                  Mixed Precision: {getSelectedPreset()?.settings.mixedPrecision.toUpperCase()}, 
                  Optimizer: {getSelectedPreset()?.settings.optimizer}
                  {getSelectedPreset()?.settings.splitMode && ', Split Mode: Enabled'}
                </Typography>
              </Alert>
            )}

            {/* Advanced VRAM Settings */}
            <Box sx={{ mt: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.training.customVRAMSettings}
                    onChange={(e) => updateTrainingSetting('customVRAMSettings', e.target.checked)}
                  />
                }
                label="Custom VRAM Settings (Advanced)"
              />
              
              {settings.training.customVRAMSettings && (
                <Paper sx={{ p: 2, mt: 2, bgcolor: 'background.default' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.training.gradientCheckpointing}
                            onChange={(e) => updateTrainingSetting('gradientCheckpointing', e.target.checked)}
                          />
                        }
                        label="Gradient Checkpointing"
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.training.enableFP8Base}
                            onChange={(e) => updateTrainingSetting('enableFP8Base', e.target.checked)}
                          />
                        }
                        label="FP8 Base (High VRAM)"
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.training.cacheLatentsToDisk}
                            onChange={(e) => updateTrainingSetting('cacheLatentsToDisk', e.target.checked)}
                          />
                        }
                        label="Cache Latents to Disk"
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.training.cacheTextEncoderOutputsToDisk}
                            onChange={(e) => updateTrainingSetting('cacheTextEncoderOutputsToDisk', e.target.checked)}
                          />
                        }
                        label="Cache Text Encoder Outputs"
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Max Data Loader Workers"
                        value={settings.training.maxDataLoaderWorkers}
                        onChange={(e) => updateTrainingSetting('maxDataLoaderWorkers', parseInt(e.target.value))}
                        inputProps={{ min: 0, max: 8 }}
                        helperText="0 = single-threaded, higher = more CPU usage"
                      />
                    </Grid>
                  </Grid>
                </Paper>
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Training Defaults */}
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Training Defaults
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Default Learning Rate"
                value={settings.training.defaultLearningRate}
                onChange={(e) => updateTrainingSetting('defaultLearningRate', parseFloat(e.target.value))}
                inputProps={{ step: 0.0001, min: 0.00001, max: 0.01 }}
                helperText="Default learning rate for new training sessions"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Default Batch Size"
                value={settings.training.defaultBatchSize}
                onChange={(e) => updateTrainingSetting('defaultBatchSize', parseInt(e.target.value))}
                inputProps={{ min: 1, max: 32 }}
                helperText="Default batch size for training"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Default Epochs"
                value={settings.training.defaultEpochs}
                onChange={(e) => updateTrainingSetting('defaultEpochs', parseInt(e.target.value))}
                inputProps={{ min: 1, max: 1000 }}
                helperText="Default number of training epochs"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Default Network Dimension"
                value={settings.training.defaultNetworkDim}
                onChange={(e) => updateTrainingSetting('defaultNetworkDim', parseInt(e.target.value))}
                inputProps={{ min: 1, max: 1024 }}
                helperText="Default LoRA network dimension"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Default Network Alpha"
                value={settings.training.defaultNetworkAlpha}
                onChange={(e) => updateTrainingSetting('defaultNetworkAlpha', parseInt(e.target.value))}
                inputProps={{ min: 1, max: 1024 }}
                helperText="Default LoRA network alpha value"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Default Mixed Precision</InputLabel>
                <Select
                  value={settings.training.defaultMixedPrecision}
                  onChange={(e) => updateTrainingSetting('defaultMixedPrecision', e.target.value)}
                  label="Default Mixed Precision"
                >
                  <MenuItem value="no">No</MenuItem>
                  <MenuItem value="fp16">FP16</MenuItem>
                  <MenuItem value="bf16">BF16</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Default Optimizer</InputLabel>
                <Select
                  value={settings.training.defaultOptimizer}
                  onChange={(e) => updateTrainingSetting('defaultOptimizer', e.target.value)}
                  label="Default Optimizer"
                >
                  <MenuItem value="AdamW8bit">AdamW 8bit</MenuItem>
                  <MenuItem value="AdamW">AdamW</MenuItem>
                  <MenuItem value="SGD">SGD</MenuItem>
                  <MenuItem value="Lion">Lion</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          {/* Essential Paths */}
          <Typography variant="h6" gutterBottom>
            Essential Paths
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FileSelector
                label="Default Output Directory"
                value={settings.paths.outputDirectory}
                onChange={(value) => updatePathSetting('outputDirectory', value)}
                isDirectory={true}
                helperText="Default directory for saving trained models"
              />
            </Grid>

            <Grid item xs={12}>
              <FileSelector
                label="Python Executable (Optional)"
                value={settings.paths.pythonExecutable}
                onChange={(value) => updatePathSetting('pythonExecutable', value)}
                filter="exe"
                helperText="Path to Python executable (leave empty to use system Python)"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="SD-Scripts Path"
                value={settings.paths.sdScriptsPath}
                onChange={(e) => updatePathSetting('sdScriptsPath', e.target.value)}
                helperText="Path to sd-scripts directory (relative or absolute)"
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={resetSettings}
              startIcon={<ResetIcon />}
            >
              Reset to Defaults
            </Button>
            
            <Button
              variant="contained"
              onClick={saveSettings}
              disabled={!hasChanges}
              startIcon={<SaveIcon />}
            >
              Save Settings
            </Button>
          </Box>

          {hasChanges && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              You have unsaved changes. Click "Save Settings" to apply them.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsManager;
