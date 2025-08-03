import React, { useState } from 'react';
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
  LinearProgress,
} from '@mui/material';

interface PreprocessingConfig {
  resizeMode: 'keep_ratio' | 'fill' | 'crop';
  targetWidth: number;
  targetHeight: number;
  autoContrast: boolean;
  normalize: boolean;
  sharpen: boolean;
}

interface PreprocessingToolsProps {
  datasetId: string;
  onComplete: () => void;
}

const PreprocessingTools: React.FC<PreprocessingToolsProps> = ({ datasetId, onComplete }) => {
  const [config, setConfig] = useState<PreprocessingConfig>({
    resizeMode: 'keep_ratio',
    targetWidth: 512,
    targetHeight: 512,
    autoContrast: false,
    normalize: false,
    sharpen: false,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleConfigChange = (field: keyof PreprocessingConfig, value: any) => {
    setConfig({ ...config, [field]: value });
  };

  const handleProcess = async () => {
    setIsProcessing(true);
    try {
      // Get dataset info
      const datasets = await window.api.store.get('datasets');
      const dataset = datasets.find((ds: any) => ds.id === datasetId);
      
      if (!dataset) {
        throw new Error('Dataset not found');
      }

      // Create output directory
      const outputDir = `${dataset.path}_processed`;
      await window.api.fs.mkdir(outputDir);

      // Process images
      const totalImages = dataset.images.length;
      for (let i = 0; i < totalImages; i++) {
        const image = dataset.images[i];
        
        await (window.api as any).runPythonScript({
          script: 'preprocess_images.py',
          args: [
            '--input_dir', dataset.path,
            '--output_dir', outputDir,
            '--resize_mode', config.resizeMode,
            '--target_width', config.targetWidth.toString(),
            '--target_height', config.targetHeight.toString(),
            ...(config.autoContrast ? ['--auto_contrast'] : []),
            ...(config.normalize ? ['--normalize'] : []),
            ...(config.sharpen ? ['--sharpen'] : []),
          ],
        });

        setProgress(((i + 1) / totalImages) * 100);
      }

      // Create new dataset with processed images
      const newDataset = {
        ...dataset,
        id: `${dataset.id}_processed`,
        name: `${dataset.name} (Processed)`,
        path: outputDir,
      };

      await window.api.store.set('datasets', [...datasets, newDataset]);
      onComplete();
    } catch (error) {
      console.error('Error processing images:', error);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Image Preprocessing
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Resize Mode</InputLabel>
              <Select
                value={config.resizeMode}
                onChange={(e) => handleConfigChange('resizeMode', e.target.value)}
                label="Resize Mode"
              >
                <MenuItem value="keep_ratio">Keep Aspect Ratio</MenuItem>
                <MenuItem value="fill">Fill Target Size</MenuItem>
                <MenuItem value="crop">Crop to Target Size</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="number"
              label="Target Width"
              value={config.targetWidth}
              onChange={(e) => handleConfigChange('targetWidth', parseInt(e.target.value))}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="number"
              label="Target Height"
              value={config.targetHeight}
              onChange={(e) => handleConfigChange('targetHeight', parseInt(e.target.value))}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.autoContrast}
                  onChange={(e) => handleConfigChange('autoContrast', e.target.checked)}
                />
              }
              label="Auto Contrast"
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.normalize}
                  onChange={(e) => handleConfigChange('normalize', e.target.checked)}
                />
              }
              label="Normalize"
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.sharpen}
                  onChange={(e) => handleConfigChange('sharpen', e.target.checked)}
                />
              }
              label="Sharpen"
            />
          </Grid>

          {isProcessing && (
            <Grid item xs={12}>
              <Box sx={{ width: '100%', mb: 2 }}>
                <LinearProgress variant="determinate" value={progress} />
                <Typography variant="body2" color="text.secondary" align="center">
                  Processing... {Math.round(progress)}%
                </Typography>
              </Box>
            </Grid>
          )}

          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleProcess}
              disabled={isProcessing}
              fullWidth
            >
              Process Images
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default PreprocessingTools;
