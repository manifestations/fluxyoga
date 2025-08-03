import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Alert,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  Tune as TuneIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { GPUInfo, VRAMOptimizations, gpuDetection } from '../../services/GPUDetection';

interface GPUInfoCardProps {
  onOptimizationsChange?: (optimizations: VRAMOptimizations) => void;
}

const GPUInfoCard: React.FC<GPUInfoCardProps> = ({ onOptimizationsChange }) => {
  const [gpuInfo, setGpuInfo] = useState<GPUInfo | null>(null);
  const [optimizations, setOptimizations] = useState<VRAMOptimizations | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    detectGPU();
  }, []);

  useEffect(() => {
    if (gpuInfo && optimizations && onOptimizationsChange) {
      onOptimizationsChange(optimizations);
    }
  }, [gpuInfo, optimizations, onOptimizationsChange]);

  const detectGPU = async () => {
    setIsDetecting(true);
    setError(null);

    try {
      const detected = await gpuDetection.detectGPU();
      if (detected) {
        setGpuInfo(detected);
        const opts = gpuDetection.getVRAMOptimizations(detected);
        setOptimizations(opts);
      } else {
        setError('Could not detect GPU information. Manual configuration recommended.');
      }
    } catch (err) {
      setError('GPU detection failed. Please check browser permissions.');
      console.error('GPU detection error:', err);
    } finally {
      setIsDetecting(false);
    }
  };

  const getVendorColor = (vendor: string) => {
    switch (vendor) {
      case 'nvidia': return '#76b900';
      case 'amd': return '#ed1c24';
      case 'intel': return '#0071c5';
      default: return '#666';
    }
  };

  const getVRAMStatusColor = (vram: number) => {
    if (vram >= 16) return 'success';
    if (vram >= 8) return 'info';
    if (vram >= 4) return 'warning';
    return 'error';
  };

  const getOptimizationImpact = (optimization: keyof VRAMOptimizations, value: any): 'high' | 'medium' | 'low' => {
    if (optimization === 'enableLowVRAMMode' && value) return 'high';
    if (optimization === 'enableCPUOffload' && value) return 'high';
    if (optimization === 'enableGradientCheckpointing' && value) return 'medium';
    if (optimization === 'mixedPrecision' && value !== 'no') return 'medium';
    if (optimization === 'enableXformers' && value) return 'medium';
    return 'low';
  };

  if (isDetecting) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={24} />
            <Typography>Detecting graphics card...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert 
            severity="warning" 
            action={
              <Button color="inherit" size="small" onClick={detectGPU}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!gpuInfo || !optimizations) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info">
            No GPU information available. Click detect to scan for graphics cards.
          </Alert>
          <Box sx={{ mt: 2 }}>
            <Button variant="outlined" onClick={detectGPU} startIcon={<RefreshIcon />}>
              Detect GPU
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              Graphics Card Detected
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {gpuInfo.name}
              </Typography>
              <Chip 
                label={gpuInfo.vendor.toUpperCase()} 
                size="small"
                sx={{ 
                  backgroundColor: getVendorColor(gpuInfo.vendor),
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <MemoryIcon fontSize="small" />
                <Typography variant="body2" color="textSecondary">
                  VRAM:
                </Typography>
                <Chip 
                  label={`${gpuInfo.memory} GB`}
                  size="small"
                  color={getVRAMStatusColor(gpuInfo.memory)}
                  variant="outlined"
                />
              </Box>
              
              {gpuInfo.architecture && (
                <Typography variant="body2" color="textSecondary">
                  {gpuInfo.architecture}
                </Typography>
              )}
            </Box>

            <Alert severity="info" sx={{ mt: 2 }}>
              {gpuDetection.getOptimizationSummary(gpuInfo)}
            </Alert>
          </Box>

          <Button 
            size="small" 
            onClick={detectGPU}
            startIcon={<RefreshIcon />}
            sx={{ ml: 2 }}
          >
            Refresh
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TuneIcon />
          Recommended Optimizations
        </Typography>

        <List dense>
          <ListItem>
            <ListItemIcon>
              <SpeedIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Batch Size"
              secondary={`Recommended: ${optimizations.recommendedBatchSize}`}
            />
            <Chip 
              label={optimizations.recommendedBatchSize}
              size="small"
              color="primary"
            />
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <MemoryIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Mixed Precision"
              secondary={`${optimizations.mixedPrecision.toUpperCase()} for optimal memory usage`}
            />
            <Chip 
              label={optimizations.mixedPrecision.toUpperCase()}
              size="small"
              color="primary"
            />
          </ListItem>

          {optimizations.enableGradientCheckpointing && (
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" />
              </ListItemIcon>
              <ListItemText 
                primary="Gradient Checkpointing"
                secondary="Enabled to reduce memory usage"
              />
              <Chip label="ENABLED" size="small" color="success" />
            </ListItem>
          )}

          {optimizations.enableXformers && (
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" />
              </ListItemIcon>
              <ListItemText 
                primary="Memory Efficient Attention"
                secondary="xFormers optimization enabled"
              />
              <Chip label="ENABLED" size="small" color="success" />
            </ListItem>
          )}

          {optimizations.enableLowVRAMMode && (
            <ListItem>
              <ListItemIcon>
                <WarningIcon color="warning" />
              </ListItemIcon>
              <ListItemText 
                primary="Low VRAM Mode"
                secondary="Additional memory optimizations applied"
              />
              <Chip label="ACTIVE" size="small" color="warning" />
            </ListItem>
          )}

          {optimizations.enableCPUOffload && (
            <ListItem>
              <ListItemIcon>
                <InfoIcon color="info" />
              </ListItemIcon>
              <ListItemText 
                primary="CPU Offloading"
                secondary="Some operations moved to CPU to save VRAM"
              />
              <Chip label="ENABLED" size="small" color="info" />
            </ListItem>
          )}

          {optimizations.enableGradientAccumulation && (
            <ListItem>
              <ListItemIcon>
                <InfoIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Gradient Accumulation"
                secondary={`${optimizations.gradientAccumulationSteps} steps for effective larger batch size`}
              />
              <Chip 
                label={`${optimizations.gradientAccumulationSteps} steps`}
                size="small"
                color="primary"
              />
            </ListItem>
          )}
        </List>

        <Alert severity="success" sx={{ mt: 2 }}>
          <Typography variant="body2">
            These optimizations have been automatically applied to your training settings based on your graphics card capabilities.
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default GPUInfoCard;
