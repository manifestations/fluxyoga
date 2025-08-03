import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  LinearProgress,
  Chip,
  Button,
} from '@mui/material';

export interface TrainingMetrics {
  step: number;
  epoch: number;
  loss: number;
  learningRate: number;
  memoryUsage: number;
  timeElapsed: number;
  averageStepTime: number;
  eta: number;
}

export interface TrainingStatus {
  isTraining: boolean;
  currentStep: number;
  totalSteps: number;
  currentEpoch: number;
  totalEpochs: number;
  status: 'idle' | 'training' | 'paused' | 'completed' | 'error';
  errorMessage?: string;
}

interface TrainingVisualizationProps {
  trainingId: string;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
}

const TrainingVisualization: React.FC<TrainingVisualizationProps> = ({
  trainingId,
  onStop,
  onPause,
  onResume,
}) => {
  const [status, setStatus] = useState<TrainingStatus>({
    isTraining: false,
    currentStep: 0,
    totalSteps: 1000,
    currentEpoch: 0,
    totalEpochs: 10,
    status: 'idle',
  });

  const [metrics, setMetrics] = useState<TrainingMetrics[]>([]);
  const [systemMetrics, setSystemMetrics] = useState({
    gpuUsage: 0,
    gpuMemory: 0,
    cpuUsage: 0,
    ramUsage: 0,
    temperature: 0,
  });

  useEffect(() => {
    // Subscribe to training updates
    const unsubscribe = window.api.onTrainingUpdate?.((update: any) => {
      if (update.type === 'status') {
        setStatus(update.data);
      } else if (update.type === 'metrics') {
        setMetrics(prev => [...prev, update.data].slice(-100)); // Keep last 100 points
      } else if (update.type === 'system') {
        setSystemMetrics(update.data);
      }
    });

    return unsubscribe;
  }, [trainingId]);

  const progress = (status.currentStep / status.totalSteps) * 100;
  const epochProgress = (status.currentEpoch / status.totalEpochs) * 100;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'training': return 'success';
      case 'paused': return 'warning';
      case 'error': return 'error';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Status Overview */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Training Status</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip 
                    label={status.status.toUpperCase()} 
                    color={getStatusColor(status.status) as any}
                    variant="filled"
                  />
                  {status.status === 'training' && (
                    <Button size="small" onClick={onPause}>Pause</Button>
                  )}
                  {status.status === 'paused' && (
                    <Button size="small" onClick={onResume}>Resume</Button>
                  )}
                  <Button size="small" color="error" onClick={onStop}>Stop</Button>
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" gutterBottom>
                    Step Progress: {status.currentStep} / {status.totalSteps}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={progress} 
                    sx={{ mb: 1, height: 8 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {progress.toFixed(1)}%
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="body2" gutterBottom>
                    Epoch Progress: {status.currentEpoch} / {status.totalEpochs}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={epochProgress} 
                    sx={{ mb: 1, height: 8 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {epochProgress.toFixed(1)}%
                  </Typography>
                </Grid>
              </Grid>

              {metrics.length > 0 && (
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="text.secondary">Current Loss</Typography>
                    <Typography variant="h6">{metrics[metrics.length - 1]?.loss.toFixed(4)}</Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="text.secondary">Learning Rate</Typography>
                    <Typography variant="h6">{metrics[metrics.length - 1]?.learningRate.toExponential(2)}</Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="text.secondary">Time Elapsed</Typography>
                    <Typography variant="h6">{formatTime(metrics[metrics.length - 1]?.timeElapsed || 0)}</Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="text.secondary">ETA</Typography>
                    <Typography variant="h6">{formatTime(metrics[metrics.length - 1]?.eta || 0)}</Typography>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Training Charts Placeholder */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Training Loss</Typography>
              <Box sx={{ 
                height: 300, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                bgcolor: 'grey.100',
                borderRadius: 1
              }}>
                <Typography color="text.secondary">
                  Chart will be displayed here (requires recharts library)
                </Typography>
              </Box>
              {metrics.length > 0 && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Latest Loss: {metrics[metrics.length - 1]?.loss.toFixed(4)}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* System Metrics */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>System Metrics</Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  GPU Usage: {systemMetrics.gpuUsage}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={systemMetrics.gpuUsage} 
                  sx={{ mb: 1 }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  GPU Memory: {systemMetrics.gpuMemory}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={systemMetrics.gpuMemory} 
                  color={systemMetrics.gpuMemory > 90 ? 'error' : 'primary'}
                  sx={{ mb: 1 }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  CPU Usage: {systemMetrics.cpuUsage}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={systemMetrics.cpuUsage} 
                  sx={{ mb: 1 }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  RAM Usage: {systemMetrics.ramUsage}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={systemMetrics.ramUsage} 
                  sx={{ mb: 1 }}
                />
              </Box>

              {systemMetrics.temperature > 0 && (
                <Box>
                  <Typography variant="body2" gutterBottom>
                    GPU Temperature: {systemMetrics.temperature}°C
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(systemMetrics.temperature / 100) * 100} 
                    color={systemMetrics.temperature > 80 ? 'error' : 'primary'}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Learning Rate Chart Placeholder */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Learning Rate Schedule</Typography>
              <Box sx={{ 
                height: 250, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                bgcolor: 'grey.100',
                borderRadius: 1
              }}>
                <Typography color="text.secondary">
                  Learning Rate Chart Placeholder
                </Typography>
              </Box>
              {metrics.length > 0 && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Current LR: {metrics[metrics.length - 1]?.learningRate.toExponential(2)}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Memory Usage Chart Placeholder */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Memory Usage</Typography>
              <Box sx={{ 
                height: 250, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                bgcolor: 'grey.100',
                borderRadius: 1
              }}>
                <Typography color="text.secondary">
                  Memory Usage Chart Placeholder
                </Typography>
              </Box>
              {metrics.length > 0 && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Current Memory: {metrics[metrics.length - 1]?.memoryUsage.toFixed(1)} MB
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TrainingVisualization;
