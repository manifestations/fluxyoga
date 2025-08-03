import { useState } from 'react';
import {
  Box,
  Button,
  Grid,
  Paper,
  TextField,
  Typography,
  FormControlLabel,
  Switch,
  Slider,
} from '@mui/material';

const TrainingConfig = () => {
  const [config, setConfig] = useState({
    learningRate: 0.0001,
    batchSize: 1,
    maxTrainSteps: 1000,
    saveEveryNSteps: 100,
    mixedPrecision: 'fp16',
    gradientCheckpointing: true,
    cacheTextEncoderOutputs: false,
    networkDim: 32,
    networkAlpha: 32,
  });

  const handleChange = (field: string) => (event: any) => {
    setConfig({
      ...config,
      [field]: event.target.value,
    });
  };

  const handleSwitchChange = (field: string) => (event: any) => {
    setConfig({
      ...config,
      [field]: event.target.checked,
    });
  };

  return (
    <Box component={Paper} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Training Configuration
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Learning Rate"
            value={config.learningRate}
            onChange={handleChange('learningRate')}
            inputProps={{ step: 0.0001 }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Batch Size"
            value={config.batchSize}
            onChange={handleChange('batchSize')}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Max Training Steps"
            value={config.maxTrainSteps}
            onChange={handleChange('maxTrainSteps')}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Save Checkpoint Every N Steps"
            value={config.saveEveryNSteps}
            onChange={handleChange('saveEveryNSteps')}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography gutterBottom>Network Dimension</Typography>
          <Slider
            value={config.networkDim}
            onChange={handleChange('networkDim')}
            step={4}
            marks
            min={4}
            max={128}
            valueLabelDisplay="auto"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography gutterBottom>Network Alpha</Typography>
          <Slider
            value={config.networkAlpha}
            onChange={handleChange('networkAlpha')}
            step={4}
            marks
            min={4}
            max={128}
            valueLabelDisplay="auto"
          />
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={config.gradientCheckpointing}
                onChange={handleSwitchChange('gradientCheckpointing')}
              />
            }
            label="Enable Gradient Checkpointing"
          />
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={config.cacheTextEncoderOutputs}
                onChange={handleSwitchChange('cacheTextEncoderOutputs')}
              />
            }
            label="Cache Text Encoder Outputs"
          />
        </Grid>

        <Grid item xs={12}>
          <Button variant="contained" color="primary">
            Save Configuration
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TrainingConfig;
