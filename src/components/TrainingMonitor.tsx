import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  LinearProgress,
} from '@mui/material';

const TrainingMonitor = () => {
  const [trainingStatus, setTrainingStatus] = useState<'idle' | 'training' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // Listen for training progress updates from the main process
    (window.api as any).onTrainingProgress((data: any) => {
      // Parse the progress data and update the state
      try {
        const parsed = JSON.parse(data);
        setProgress(parsed.progress);
        setCurrentStep(parsed.currentStep);
        setLogs(prev => [...prev, parsed.message]);
      } catch (e) {
        // If the data isn't JSON, treat it as a log message
        setLogs(prev => [...prev, data]);
      }
    });
  }, []);

  const handleStartTraining = async () => {
    try {
      setTrainingStatus('training');
      await (window.api as any).startTraining({
        script: 'flux_train_network.py',
        pythonPath: 'path/to/python',
        scriptPath: 'path/to/scripts',
        args: [
          '--pretrained_model_name_or_path', 'path/to/model',
          // Add other training arguments
        ]
      });
      setTrainingStatus('completed');
    } catch (error) {
      console.error('Training error:', error);
      setTrainingStatus('error');
    }
  };

  return (
    <Box component={Paper} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Training Progress
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ width: '100%', mr: 1 }}>
              <LinearProgress variant="determinate" value={progress} />
            </Box>
            <Box sx={{ minWidth: 35 }}>
              <Typography variant="body2" color="text.secondary">
                {`${Math.round(progress)}%`}
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Step: {currentStep} / {totalSteps}
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Training Logs
          </Typography>
          <Paper
            sx={{
              height: 300,
              overflow: 'auto',
              backgroundColor: 'background.default',
              p: 1,
            }}
          >
            <List dense>
              {logs.map((log, index) => (
                <ListItem key={index}>
                  <ListItemText primary={log} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleStartTraining}
            disabled={trainingStatus === 'training'}
            startIcon={trainingStatus === 'training' ? <CircularProgress size={20} /> : null}
          >
            {trainingStatus === 'training' ? 'Training...' : 'Start Training'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TrainingMonitor;
