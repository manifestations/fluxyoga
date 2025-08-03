import { useState } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Button,
  Grid,
  Typography,
  Paper,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import FileSelector from './common/FileSelector';

const ModelSettings = () => {
  const [modelType, setModelType] = useState('flux');
  const [baseModel, setBaseModel] = useState('');
  const [networkType, setNetworkType] = useState('lora');
  const [clipLModel, setClipLModel] = useState('');
  const [t5xxlModel, setT5xxlModel] = useState('');
  const [aeModel, setAeModel] = useState('');
  
  // Validation state
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<any[]>([]);
  const [showValidationDialog, setShowValidationDialog] = useState(false);

  const validateModelConfiguration = async () => {
    setIsValidating(true);
    const results: any[] = [];

    try {
      // Basic validation checks
      if (!baseModel) {
        results.push({
          type: 'error',
          message: 'Base Model Path is required',
          details: 'Please select a base model file (.ckpt, .safetensors)',
        });
      } else {
        // Check if base model file exists
        try {
          await window.api.fs.readFile(baseModel);
          results.push({
            type: 'success',
            message: 'Base model file found',
            details: `File: ${baseModel}`,
          });
        } catch (error) {
          results.push({
            type: 'error',
            message: 'Base model file not found',
            details: `Cannot access file: ${baseModel}`,
          });
        }
      }

      if (modelType === 'flux') {
        // Flux-specific validation
        if (!clipLModel) {
          results.push({
            type: 'error',
            message: 'CLIP-L Model is required for Flux',
            details: 'Please select a CLIP-L model file',
          });
        } else {
          try {
            await window.api.fs.readFile(clipLModel);
            results.push({
              type: 'success',
              message: 'CLIP-L model file found',
              details: `File: ${clipLModel}`,
            });
          } catch (error) {
            results.push({
              type: 'error',
              message: 'CLIP-L model file not found',
              details: `Cannot access file: ${clipLModel}`,
            });
          }
        }

        if (!t5xxlModel) {
          results.push({
            type: 'error',
            message: 'T5XXL Model is required for Flux',
            details: 'Please select a T5XXL model file',
          });
        } else {
          try {
            await window.api.fs.readFile(t5xxlModel);
            results.push({
              type: 'success',
              message: 'T5XXL model file found',
              details: `File: ${t5xxlModel}`,
            });
          } catch (error) {
            results.push({
              type: 'error',
              message: 'T5XXL model file not found',
              details: `Cannot access file: ${t5xxlModel}`,
            });
          }
        }

        if (!aeModel) {
          results.push({
            type: 'error',
            message: 'AutoEncoder (AE) Model is required for Flux',
            details: 'Please select an AutoEncoder model file',
          });
        } else {
          try {
            await window.api.fs.readFile(aeModel);
            results.push({
              type: 'success',
              message: 'AutoEncoder model file found',
              details: `File: ${aeModel}`,
            });
          } catch (error) {
            results.push({
              type: 'error',
              message: 'AutoEncoder model file not found',
              details: `Cannot access file: ${aeModel}`,
            });
          }
        }
      }

      // Network type validation
      results.push({
        type: 'info',
        message: `Network Architecture: ${networkType.toUpperCase()}`,
        details: 'Network architecture configuration is valid',
      });

      // Check for common issues
      if (baseModel && clipLModel && baseModel === clipLModel) {
        results.push({
          type: 'warning',
          message: 'Base model and CLIP-L model paths are identical',
          details: 'This might not be correct - they should be different files',
        });
      }

      const errorCount = results.filter(r => r.type === 'error').length;
      const warningCount = results.filter(r => r.type === 'warning').length;

      if (errorCount === 0) {
        results.unshift({
          type: 'success',
          message: 'Model configuration is valid!',
          details: `Configuration passed validation${warningCount > 0 ? ` with ${warningCount} warnings` : ''}`,
        });
      } else {
        results.unshift({
          type: 'error',
          message: `Model configuration has ${errorCount} errors`,
          details: 'Please fix the errors before proceeding with training',
        });
      }

    } catch (error) {
      results.push({
        type: 'error',
        message: 'Validation failed',
        details: `Error during validation: ${error}`,
      });
    }

    setValidationResults(results);
    setShowValidationDialog(true);
    setIsValidating(false);
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckIcon color="success" />;
      case 'error': return <ErrorIcon color="error" />;
      case 'warning': return <WarningIcon color="warning" />;
      case 'info': return <InfoIcon color="info" />;
      default: return <InfoIcon />;
    }
  };

  return (
    <Box component={Paper} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Model Configuration
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Model Type</InputLabel>
            <Select
              value={modelType}
              onChange={(e) => setModelType(e.target.value)}
              label="Model Type"
            >
              <MenuItem value="flux">Flux</MenuItem>
              <MenuItem value="sdxl">SDXL</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={8}>
          <FileSelector
            label="Base Model Path"
            value={baseModel}
            onChange={setBaseModel}
            filter=".ckpt,.safetensors"
            helperText="Path to the pretrained model checkpoint"
            required
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Network Architecture</InputLabel>
            <Select
              value={networkType}
              onChange={(e) => setNetworkType(e.target.value)}
              label="Network Architecture"
            >
              <MenuItem value="lora">LoRA</MenuItem>
              <MenuItem value="loha">LoHA</MenuItem>
              <MenuItem value="lycoris">LyCORIS</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {modelType === 'flux' && (
          <>
            <Grid item xs={12} md={4}>
              <FileSelector
                label="CLIP-L Model"
                value={clipLModel}
                onChange={setClipLModel}
                filter=".ckpt,.safetensors,.sft"
                helperText="Path to CLIP-L model (for Flux)"
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FileSelector
                label="T5XXL Model"
                value={t5xxlModel}
                onChange={setT5xxlModel}
                filter=".ckpt,.safetensors,.sft"
                helperText="Path to T5XXL model (for Flux)"
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FileSelector
                label="AutoEncoder (AE)"
                value={aeModel}
                onChange={setAeModel}
                filter=".ckpt,.safetensors,.sft"
                helperText="Path to AutoEncoder model (for Flux)"
                required
              />
            </Grid>
          </>
        )}

        <Grid item xs={12}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={validateModelConfiguration}
            disabled={isValidating}
            startIcon={isValidating ? <CircularProgress size={20} /> : undefined}
          >
            {isValidating ? 'Validating...' : 'Validate Model Configuration'}
          </Button>
        </Grid>
      </Grid>

      {/* Validation Results Dialog */}
      <Dialog
        open={showValidationDialog}
        onClose={() => setShowValidationDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Model Configuration Validation Results</DialogTitle>
        <DialogContent>
          <List>
            {validationResults.map((result, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  {getResultIcon(result.type)}
                </ListItemIcon>
                <ListItemText
                  primary={result.message}
                  secondary={result.details}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowValidationDialog(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ModelSettings;
