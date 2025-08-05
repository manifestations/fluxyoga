/**
 * Enhanced Settings Manager
 * 
 * Comprehensive settings management with app-wide configuration integration
 */

import React, { useState } from 'react';
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
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
} from '@mui/material';
import {
  Memory as MemoryIcon,
  ImportExport as ImportExportIcon,
  Settings as SettingsIcon,
  RestoreFromTrash as ResetIcon,
} from '@mui/icons-material';
import FileSelector from '../common/FileSelector';
import { useConfiguration, useTrainingConfig, useBehaviorConfig } from '../../contexts/ConfigurationContext';
import { VRAM_PRESETS } from '../../types/settings';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const EnhancedSettingsManager: React.FC = () => {
  const { config, resetConfig, exportConfig, importConfig } = useConfiguration();
  const { training, updateTraining } = useTrainingConfig();
  const { behavior, updateBehavior } = useBehaviorConfig();
  
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' 
  });
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleReset = async () => {
    try {
      await resetConfig();
      setResetDialogOpen(false);
      showSnackbar('Settings reset to defaults', 'success');
    } catch (error) {
      showSnackbar('Failed to reset settings', 'error');
    }
  };

  const handleExport = () => {
    try {
      const configData = exportConfig();
      const blob = new Blob([configData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fluxyoga-config-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      showSnackbar('Configuration exported successfully', 'success');
    } catch (error) {
      showSnackbar('Failed to export configuration', 'error');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await importConfig(text);
      setImportDialogOpen(false);
      showSnackbar('Configuration imported successfully', 'success');
    } catch (error) {
      showSnackbar('Failed to import configuration', 'error');
    }
  };

  const applyVRAMPreset = (presetName: string) => {
    const preset = VRAM_PRESETS.find(p => p.name === presetName);
    if (!preset) return;

    updateTraining({
      selectedVRAMPreset: presetName,
      defaultBatchSize: preset.settings.batchSize,
      gradientCheckpointing: preset.settings.gradientCheckpointing,
      defaultMixedPrecision: preset.settings.mixedPrecision,
      defaultOptimizer: preset.settings.optimizer,
      maxDataLoaderWorkers: preset.settings.maxDataLoaderWorkers,
      cacheLatentsToDisk: preset.settings.cacheLatentsToDisk,
      cacheTextEncoderOutputsToDisk: preset.settings.cacheTextEncoderOutputsToDisk,
    });

    showSnackbar(`Applied ${presetName} preset`, 'success');
  };

  // Training Settings Tab
  const renderTrainingSettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MemoryIcon />
          VRAM Optimization Presets
        </Typography>
        
        <Grid container spacing={2}>
          {VRAM_PRESETS.map((preset) => (
            <Grid item xs={12} md={6} key={preset.name}>
              <Paper
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  border: training.selectedVRAMPreset === preset.name ? 2 : 1,
                  borderColor: training.selectedVRAMPreset === preset.name 
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
                    color={training.selectedVRAMPreset === preset.name ? 'primary' : 'default'}
                  />
                </Box>
                <Typography variant="body2" color="textSecondary">
                  {preset.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Grid>

      <Grid item xs={12}>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" gutterBottom>
          Default Training Parameters
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Learning Rate"
              value={training.defaultLearningRate}
              onChange={(e) => updateTraining({ defaultLearningRate: parseFloat(e.target.value) })}
              inputProps={{ step: 0.0001, min: 0.0001, max: 0.01 }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Batch Size"
              value={training.defaultBatchSize}
              onChange={(e) => updateTraining({ defaultBatchSize: parseInt(e.target.value) })}
              inputProps={{ min: 1, max: 32 }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Epochs"
              value={training.defaultEpochs}
              onChange={(e) => updateTraining({ defaultEpochs: parseInt(e.target.value) })}
              inputProps={{ min: 1, max: 1000 }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Mixed Precision</InputLabel>
              <Select
                value={training.defaultMixedPrecision}
                onChange={(e) => updateTraining({ defaultMixedPrecision: e.target.value as any })}
                label="Mixed Precision"
              >
                <MenuItem value="no">No</MenuItem>
                <MenuItem value="fp16">FP16</MenuItem>
                <MenuItem value="bf16">BF16</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );



  // Behavior Settings Tab
  const renderBehaviorSettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Auto-Save
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={behavior.autoSave}
                  onChange={(e) => updateBehavior({ autoSave: e.target.checked })}
                />
              }
              label="Enable auto-save"
            />
            
            {behavior.autoSave && (
              <TextField
                fullWidth
                type="number"
                label="Auto-save interval (minutes)"
                value={behavior.autoSaveInterval}
                onChange={(e) => updateBehavior({ autoSaveInterval: parseInt(e.target.value) })}
                margin="normal"
                inputProps={{ min: 1, max: 60 }}
              />
            )}
          </CardContent>
        </Card>
      </Grid>


    </Grid>
  );

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Settings</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <input
            accept=".json"
            style={{ display: 'none' }}
            id="import-config-file"
            type="file"
            onChange={handleImport}
          />
          <label htmlFor="import-config-file">
            <Button variant="outlined" component="span" startIcon={<ImportExportIcon />}>
              Import
            </Button>
          </label>
          
          <Button
            variant="outlined"
            startIcon={<ImportExportIcon />}
            onClick={handleExport}
          >
            Export
          </Button>
          
          <Button
            variant="outlined"
            color="error"
            startIcon={<ResetIcon />}
            onClick={() => setResetDialogOpen(true)}
          >
            Reset
          </Button>
        </Box>
      </Box>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="settings tabs">
            <Tab label="Training" icon={<MemoryIcon />} />
            <Tab label="Behavior" icon={<SettingsIcon />} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {renderTrainingSettings()}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {renderBehaviorSettings()}
        </TabPanel>
      </Card>

      {/* Reset Confirmation Dialog */}
      <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)}>
        <DialogTitle>Reset Settings</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to reset all settings to their default values?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleReset} color="error" variant="contained">
            Reset All Settings
          </Button>
        </DialogActions>
      </Dialog>

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

export default EnhancedSettingsManager;
