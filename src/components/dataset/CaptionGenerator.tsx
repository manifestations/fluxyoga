import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Paper,
  Slider,
  Grid,
  Chip,
  LinearProgress,
} from '@mui/material';
import { datasetService } from '../../services/datasets/datasetService';
import { CaptionGenerationConfig, ImageDataset } from '../../services/datasets/types';

interface CaptionGeneratorProps {
  datasetId: string;
}

const CaptionGenerator: React.FC<CaptionGeneratorProps> = ({ datasetId }) => {
  const [dataset, setDataset] = useState<ImageDataset | null>(null);
  const [selectedImages] = useState<string[]>([]);
  const [progress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [config, setConfig] = useState<CaptionGenerationConfig>({
    model: 'gpt-4-vision',
    temperature: 0.7,
    maxTokens: 150,
    style: 'detailed',
    focus: [],
  });

  useEffect(() => {
    loadDataset();
  }, [datasetId]);

  const loadDataset = async () => {
    try {
      const storedDatasets = await window.api.store.get('datasets');
      const dataset = storedDatasets.find((ds: ImageDataset) => ds.id === datasetId);
      setDataset(dataset || null);
    } catch (error) {
      console.error('Error loading dataset:', error);
    }
  };

  const handleGenerateCaptions = async () => {
    if (!dataset) return;

    setIsGenerating(true);
    try {
      await datasetService.generateCaptions(datasetId, config, selectedImages);
      loadDataset(); // Reload dataset to get updated captions
    } catch (error) {
      console.error('Error generating captions:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFocusAdd = (focus: string) => {
    if (config.focus && !config.focus.includes(focus)) {
      setConfig({
        ...config,
        focus: [...config.focus, focus],
      });
    }
  };

  const handleFocusRemove = (focus: string) => {
    if (config.focus) {
      setConfig({
        ...config,
        focus: config.focus.filter((f) => f !== focus),
      });
    }
  };

  if (!dataset) {
    return <Typography>Loading dataset...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Caption Generator
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Model</InputLabel>
              <Select
                value={config.model}
                onChange={(e) =>
                  setConfig({ ...config, model: e.target.value as string })
                }
                label="Model"
              >
                <MenuItem value="gpt-4-vision">GPT-4 Vision</MenuItem>
                <MenuItem value="blip">BLIP</MenuItem>
                <MenuItem value="blip2">BLIP-2</MenuItem>
                <MenuItem value="vit-gpt2">ViT-GPT2</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Style</InputLabel>
              <Select
                value={config.style}
                onChange={(e) =>
                  setConfig({ ...config, style: e.target.value as string })
                }
                label="Style"
              >
                <MenuItem value="detailed">Detailed</MenuItem>
                <MenuItem value="simple">Simple</MenuItem>
                <MenuItem value="tags">Tags Only</MenuItem>
                <MenuItem value="artistic">Artistic</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography gutterBottom>Temperature</Typography>
            <Slider
              value={config.temperature}
              onChange={(_, value) =>
                setConfig({ ...config, temperature: value as number })
              }
              step={0.1}
              marks
              min={0}
              max={1}
              valueLabelDisplay="auto"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography gutterBottom>Max Tokens</Typography>
            <Slider
              value={config.maxTokens}
              onChange={(_, value) =>
                setConfig({ ...config, maxTokens: value as number })
              }
              step={50}
              marks
              min={50}
              max={500}
              valueLabelDisplay="auto"
            />
          </Grid>

          <Grid item xs={12}>
            <Typography gutterBottom>Focus Areas</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              {config.focus?.map((focus) => (
                <Chip
                  key={focus}
                  label={focus}
                  onDelete={() => handleFocusRemove(focus)}
                />
              ))}
            </Box>
            <TextField
              fullWidth
              label="Add Focus Area"
              placeholder="Type and press Enter"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const input = e.currentTarget as HTMLInputElement;
                  handleFocusAdd(input.value);
                  input.value = '';
                }
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {isGenerating && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <LinearProgress variant="determinate" value={progress} />
          <Typography variant="body2" color="text.secondary" align="center">
            Generating captions... {Math.round(progress)}%
          </Typography>
        </Box>
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={handleGenerateCaptions}
        disabled={isGenerating}
        fullWidth
      >
        Generate Captions
      </Button>
    </Box>
  );
};

export default CaptionGenerator;
