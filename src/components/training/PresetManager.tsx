import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  TextField,
  Typography,
  Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';

interface TrainingPreset {
  id: string;
  name: string;
  description: string;
  config: any;
  created: string;
  modified: string;
  tags: string[];
}

interface PresetManagerProps {
  onLoadPreset: (config: any) => void;
  currentConfig?: any;
}

const PresetManager: React.FC<PresetManagerProps> = ({ onLoadPreset, currentConfig }) => {
  const [presets, setPresets] = useState<TrainingPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<TrainingPreset | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [presetForm, setPresetForm] = useState({
    name: '',
    description: '',
    tags: [] as string[],
  });

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    try {
      const storedPresets = await window.api.store.get('training-presets') || [];
      setPresets(storedPresets);
    } catch (error) {
      console.error('Error loading presets:', error);
    }
  };

  const savePreset = async () => {
    if (!currentConfig || !presetForm.name) return;

    setSaving(true);
    try {
      const newPreset: TrainingPreset = {
        id: Date.now().toString(),
        name: presetForm.name,
        description: presetForm.description,
        config: currentConfig,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        tags: presetForm.tags,
      };

      const updatedPresets = [...presets, newPreset];
      await window.api.store.set('training-presets', updatedPresets);
      setPresets(updatedPresets);
      setDialogOpen(false);
      setPresetForm({ name: '', description: '', tags: [] });
    } catch (error) {
      console.error('Error saving preset:', error);
    } finally {
      setSaving(false);
    }
  };

  const deletePreset = async (presetId: string) => {
    try {
      const updatedPresets = presets.filter(p => p.id !== presetId);
      await window.api.store.set('training-presets', updatedPresets);
      setPresets(updatedPresets);
    } catch (error) {
      console.error('Error deleting preset:', error);
    }
  };

  const loadPreset = (preset: TrainingPreset) => {
    onLoadPreset(preset.config);
    setSelectedPreset(preset);
  };

  const getPresetSummary = (config: any) => {
    const summary = [];
    if (config.modelType) summary.push(`Model: ${config.modelType}`);
    if (config.networkType) summary.push(`Network: ${config.networkType}`);
    if (config.batchSize) summary.push(`Batch: ${config.batchSize}`);
    if (config.learningRate) summary.push(`LR: ${config.learningRate}`);
    return summary.join(' • ');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Training Presets</Typography>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={() => setDialogOpen(true)}
          disabled={!currentConfig}
        >
          Save Current as Preset
        </Button>
      </Box>

      <Grid container spacing={3}>
        {presets.map((preset) => (
          <Grid item xs={12} md={6} lg={4} key={preset.id}>
            <Card 
              variant={selectedPreset?.id === preset.id ? "outlined" : "elevation"}
              sx={{ 
                cursor: 'pointer',
                border: selectedPreset?.id === preset.id ? 2 : 0,
                borderColor: 'primary.main'
              }}
              onClick={() => loadPreset(preset)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="h6" component="div" noWrap>
                    {preset.name}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePreset(preset.id);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>

                {preset.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {preset.description}
                  </Typography>
                )}

                <Typography variant="body2" sx={{ mb: 2 }}>
                  {getPresetSummary(preset.config)}
                </Typography>

                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                  {preset.tags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" />
                  ))}
                </Box>

                <Typography variant="caption" color="text.secondary">
                  Created: {new Date(preset.created).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {presets.length === 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No training presets saved yet.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Configure your training settings and save them as a preset for quick reuse.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Save Preset Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Save Training Preset</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Preset Name"
            value={presetForm.name}
            onChange={(e) => setPresetForm({ ...presetForm, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Description"
            value={presetForm.description}
            onChange={(e) => setPresetForm({ ...presetForm, description: e.target.value })}
            margin="normal"
            multiline
            rows={2}
          />
          <TextField
            fullWidth
            label="Tags (comma-separated)"
            value={presetForm.tags.join(', ')}
            onChange={(e) => setPresetForm({ 
              ...presetForm, 
              tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) 
            })}
            margin="normal"
            placeholder="e.g., flux, lora, portrait"
          />
          
          {currentConfig && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Current Configuration Summary:
              </Typography>
              <Typography variant="body2">
                {getPresetSummary(currentConfig)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={savePreset}
            disabled={!presetForm.name || saving}
            variant="contained"
          >
            {saving ? 'Saving...' : 'Save Preset'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PresetManager;
