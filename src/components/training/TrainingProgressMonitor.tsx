import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
  Collapse,
  Alert,
  ImageList,
  ImageListItem,
  Dialog,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ZoomIn as ZoomInIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { TrainingProgress, TrainingProcess } from '../../types/training';
import { trainingExecutor } from '../../services/TrainingExecutor';

interface TrainingProgressMonitorProps {
  process?: TrainingProcess;
  onProcessUpdate?: (process: TrainingProcess) => void;
}

const TrainingProgressMonitor: React.FC<TrainingProgressMonitorProps> = ({
  process,
  onProcessUpdate,
}) => {
  const [progress, setProgress] = useState<TrainingProgress | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [selectedSample, setSelectedSample] = useState<string | null>(null);
  const [allLogs, setAllLogs] = useState<string[]>([]);

  useEffect(() => {
    if (!process) return;

    // Set up progress monitoring
    const unsubscribe = trainingExecutor.onProgress(process.id, (newProgress) => {
      setProgress(newProgress);
      if (newProgress.logs) {
        setAllLogs(prev => [...prev, ...newProgress.logs]);
      }
    });

    return () => {
      // Cleanup if needed
    };
  }, [process]);

  const handleStopTraining = async () => {
    if (process) {
      try {
        await trainingExecutor.cancelTraining(process.id);
        onProcessUpdate?.({
          ...process,
          status: 'cancelled',
          endTime: new Date(),
        });
      } catch (error) {
        console.error('Failed to stop training:', error);
      }
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'primary';
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'cancelled': return 'warning';
      default: return 'default';
    }
  };

  const getProgressPercentage = (): number => {
    if (!progress || !progress.totalSteps) return 0;
    return Math.min((progress.step / progress.totalSteps) * 100, 100);
  };

  if (!process) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" color="textSecondary" align="center">
            No training process active
          </Typography>
          <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 1 }}>
            Start a training process to see progress here
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      {/* Training Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" component="h2">
              Training Progress
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip 
                label={process.status.toUpperCase()} 
                color={getStatusColor(process.status) as any}
                variant="filled"
              />
              {process.status === 'running' && (
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleStopTraining}
                  startIcon={<StopIcon />}
                  size="small"
                >
                  Stop Training
                </Button>
              )}
            </Box>
          </Box>

          <Grid container spacing={3}>
            {/* Progress Bar */}
            <Grid item xs={12}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  {progress ? `Step ${progress.step} of ${progress.totalSteps} (Epoch ${progress.epoch})` : 'Initializing...'}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={getProgressPercentage()} 
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  {getProgressPercentage().toFixed(1)}% Complete
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {progress?.eta ? `ETA: ${formatDuration(progress.eta)}` : ''}
                </Typography>
              </Box>
            </Grid>

            {/* Metrics */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Current Metrics</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Loss</Typography>
                    <Typography variant="h6">{progress?.loss?.toFixed(4) || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Learning Rate</Typography>
                    <Typography variant="h6">{progress?.learningRate?.toExponential(2) || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Time Elapsed</Typography>
                    <Typography variant="h6">{progress?.timeElapsed ? formatDuration(progress.timeElapsed) : 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Samples Generated</Typography>
                    <Typography variant="h6">{progress?.samplesGenerated?.length || 0}</Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Training Configuration */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Configuration</Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Model Type</Typography>
                    <Typography variant="body1">{process.config.modelType.toUpperCase()}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Network Dim</Typography>
                    <Typography variant="body1">{process.config.networkDim}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Learning Rate</Typography>
                    <Typography variant="body1">{process.config.learningRate}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Batch Size</Typography>
                    <Typography variant="body1">{process.config.batchSize}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">Output</Typography>
                    <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                      {process.config.outputDir}/{process.config.outputName}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Sample Images */}
      {progress?.samplesGenerated && progress.samplesGenerated.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Generated Samples ({progress.samplesGenerated.length})
            </Typography>
            <ImageList cols={4} gap={8}>
              {progress.samplesGenerated.map((sample, index) => (
                <ImageListItem key={index}>
                  <img
                    src={`file://${sample}`}
                    alt={`Sample ${index + 1}`}
                    loading="lazy"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedSample(sample)}
                  />
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 4, 
                    right: 4,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    borderRadius: 1,
                  }}>
                    <IconButton 
                      size="small" 
                      onClick={() => setSelectedSample(sample)}
                      sx={{ color: 'white' }}
                    >
                      <ZoomInIcon />
                    </IconButton>
                  </Box>
                </ImageListItem>
              ))}
            </ImageList>
          </CardContent>
        </Card>
      )}

      {/* Training Logs */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Training Logs</Typography>
            <IconButton onClick={() => setShowLogs(!showLogs)}>
              {showLogs ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
          
          <Collapse in={showLogs}>
            <Paper 
              sx={{ 
                p: 2, 
                backgroundColor: 'black', 
                color: 'white',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                maxHeight: 400,
                overflow: 'auto',
              }}
            >
              {allLogs.length > 0 ? (
                allLogs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))
              ) : (
                <Typography color="inherit">No logs available yet...</Typography>
              )}
            </Paper>
            <Box sx={{ mt: 1, textAlign: 'right' }}>
              <Button
                size="small"
                onClick={() => setAllLogs([])}
                startIcon={<RefreshIcon />}
              >
                Clear Logs
              </Button>
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      {/* Sample Image Dialog */}
      <Dialog
        open={!!selectedSample}
        onClose={() => setSelectedSample(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Sample Image</DialogTitle>
        <DialogContent>
          {selectedSample && (
            <img
              src={`file://${selectedSample}`}
              alt="Sample"
              style={{ width: '100%', height: 'auto' }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Error Display */}
      {process.error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <Typography variant="h6">Training Error</Typography>
          <Typography>{process.error}</Typography>
        </Alert>
      )}
    </Box>
  );
};

export default TrainingProgressMonitor;
