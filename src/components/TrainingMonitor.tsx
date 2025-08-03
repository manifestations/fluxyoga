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
  Alert,
} from '@mui/material';

const TrainingMonitor = () => {
  const [trainingStatus, setTrainingStatus] = useState<'idle' | 'training' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps] = useState(1000);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Check if the API exists before using it
      if (!window.api || typeof (window.api as any).onTrainingProgress !== 'function') {
        console.warn('Training progress API not available');
        return;
      }

      // Listen for training progress updates from the main process
      const unsubscribe = (window.api as any).onTrainingProgress((data: any) => {
        try {
          // Parse the progress data and update the state
          if (typeof data === 'string') {
            const parsed = JSON.parse(data);
            setProgress(parsed.progress || 0);
            setCurrentStep(parsed.currentStep || 0);
            if (parsed.message) {
              setLogs(prev => [...prev, parsed.message]);
            }
          } else {
            // If the data isn't a string, treat it as a log message
            setLogs(prev => [...prev, String(data)]);
          }
        } catch (e) {
          // If the data isn't JSON, treat it as a log message
          setLogs(prev => [...prev, String(data)]);
        }
      });

      // Return cleanup function if provided
      return typeof unsubscribe === 'function' ? unsubscribe : undefined;
    } catch (error) {
      console.error('Error setting up training monitor:', error);
      setError('Failed to initialize training monitor');
    }
  }, []);

  const handleStartTraining = async () => {
    try {
      setError(null);
      setTrainingStatus('training');
      setLogs(prev => [...prev, 'Starting training...']);
      
      // Check if the API exists
      if (!window.api || typeof (window.api as any).startTraining !== 'function') {
        throw new Error('Training API not available');
      }

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
      setLogs(prev => [...prev, 'Training completed successfully!']);
    } catch (error) {
      console.error('Training error:', error);
      setTrainingStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      setLogs(prev => [...prev, `Error: ${errorMessage}`]);
    }
  };

  // If there's a critical error, show it
  if (error && trainingStatus === 'idle') {
    return (
      <Box component={Paper} sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>Training Monitor</Typography>
          <Typography>
            This tab provides basic training monitoring functionality. 
            For full training capabilities, use the "Quick Train" or "Progress Monitor" tabs.
          </Typography>
        </Alert>
        <Typography variant="body2" color="text.secondary">
          Error: {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box component={Paper} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Training Monitor
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        This is a basic training monitor. For advanced training features, use the "Quick Train" tab.
      </Alert>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

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
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            {logs.length > 0 ? (
              <List dense>
                {logs.map((log, index) => (
                  <ListItem key={index}>
                    <ListItemText 
                      primary={log}
                      sx={{ 
                        fontSize: '0.875rem',
                        fontFamily: 'monospace',
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No training logs yet. Start a training session to see progress here.
                </Typography>
              </Box>
            )}
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
