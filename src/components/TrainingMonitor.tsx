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
  Card,
  CardContent,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface SampleImage {
  path: string;
  prompt: string;
  step: number;
  timestamp: string;
}

const TrainingMonitor = () => {
  const [trainingStatus, setTrainingStatus] = useState<'idle' | 'training' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps] = useState(1000);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sampleImages, setSampleImages] = useState<SampleImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<SampleImage | null>(null);

  // Mock sample images for demonstration
  useEffect(() => {
    // Load sample images from localStorage or use default
    const savedSamples = localStorage.getItem('latestSampleImages');
    if (savedSamples) {
      try {
        setSampleImages(JSON.parse(savedSamples));
      } catch (error) {
        console.error('Error loading sample images:', error);
        setSampleImages(getMockSampleImages());
      }
    } else {
      setSampleImages(getMockSampleImages());
    }
  }, []);

  const getMockSampleImages = (): SampleImage[] => [
    {
      path: '../sample/reanita/simin_01.png',
      prompt: 'a beautiful landscape with mountains and a lake',
      step: 100,
      timestamp: new Date().toISOString(),
    },
    {
      path: '../sample/reanita/simin_02.png', 
      prompt: 'a portrait of a young woman with detailed eyes',
      step: 200,
      timestamp: new Date().toISOString(),
    },
    {
      path: '../sample/reanita/simin_03.png',
      prompt: 'a futuristic cityscape at sunset',
      step: 300,
      timestamp: new Date().toISOString(),
    },
  ];

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
            // Handle sample images
            if (parsed.sampleImages) {
              setSampleImages(parsed.sampleImages);
              localStorage.setItem('latestSampleImages', JSON.stringify(parsed.sampleImages));
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
      if (!window.api || typeof window.api.python?.startTraining !== 'function') {
        throw new Error('Training API not available');
      }

      await window.api.python.startTraining({
        script: 'flux_train_network.py',
        args: [
          '--pretrained_model_name_or_path', 'black-forest-labs/FLUX.1-dev',
          '--train_data_dir', './sample/reanita',
          '--output_dir', './output',
          '--output_name', 'flux_lora_test',
          '--mixed_precision', 'bf16',
          '--save_precision', 'bf16',
          '--network_module', 'networks.lora',
          '--network_dim', '32',
          '--network_alpha', '16',
          '--train_batch_size', '1',
          '--learning_rate', '1e-4',
          '--max_train_epochs', '5',
          '--save_every_n_epochs', '1',
          '--sample_every_n_steps', '100',
          '--sample_prompts', './sample_prompts.txt'
        ],
        scriptPath: './sd-scripts',
        workingDirectory: './output'
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

  const handleRefreshSamples = () => {
    // Refresh sample images (in a real app, this would fetch from the training process)
    setSampleImages(getMockSampleImages());
    setLogs(prev => [...prev, 'Sample images refreshed']);
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
        {/* Training Progress */}
        <Grid item xs={12}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Training Progress</Typography>
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
            </CardContent>
          </Card>
        </Grid>

        {/* Sample Images */}
        <Grid item xs={12}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Latest Sample Images</Typography>
                <IconButton onClick={handleRefreshSamples} size="small">
                  <RefreshIcon />
                </IconButton>
              </Box>
              
              {sampleImages.length > 0 ? (
                <ImageList cols={3} gap={8} sx={{ mb: 0 }}>
                  {sampleImages.map((sample, index) => (
                    <ImageListItem key={index}>
                      <img
                        src={sample.path}
                        alt={`Sample ${index + 1}`}
                        loading="lazy"
                        style={{
                          cursor: 'pointer',
                          height: 200,
                          objectFit: 'cover',
                          borderRadius: 4,
                        }}
                        onClick={() => setSelectedImage(sample)}
                        onError={(e) => {
                          // Fallback to a placeholder if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const placeholder = document.createElement('div');
                          placeholder.style.width = '100%';
                          placeholder.style.height = '200px';
                          placeholder.style.backgroundColor = '#f0f0f0';
                          placeholder.style.display = 'flex';
                          placeholder.style.alignItems = 'center';
                          placeholder.style.justifyContent = 'center';
                          placeholder.style.borderRadius = '4px';
                          placeholder.textContent = `Sample ${index + 1}`;
                          placeholder.style.color = '#666';
                          target.parentNode?.appendChild(placeholder);
                        }}
                      />
                      <ImageListItemBar
                        title={`Step ${sample.step}`}
                        subtitle={sample.prompt.length > 30 ? `${sample.prompt.substring(0, 30)}...` : sample.prompt}
                        actionIcon={
                          <IconButton
                            sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
                            onClick={() => setSelectedImage(sample)}
                          >
                            <ZoomInIcon />
                          </IconButton>
                        }
                      />
                    </ImageListItem>
                  ))}
                </ImageList>
              ) : (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No sample images generated yet. Start training to see sample outputs here.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Training Logs */}
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

      {/* Sample Image Dialog */}
      <Dialog
        open={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Sample Image - Step {selectedImage?.step}
        </DialogTitle>
        <DialogContent>
          {selectedImage && (
            <Box>
              <img
                src={selectedImage.path}
                alt="Sample"
                style={{ width: '100%', height: 'auto', borderRadius: 4 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                <strong>Prompt:</strong> {selectedImage.prompt}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Generated at:</strong> {new Date(selectedImage.timestamp).toLocaleString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default TrainingMonitor;
