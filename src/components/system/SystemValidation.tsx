import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Button,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Computer as ComputerIcon,
  Code as CodeIcon,
  Folder as FolderIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

interface ValidationResult {
  isValid: boolean;
  error?: string;
  path?: string;
  version?: string;
  hasLibrary?: boolean;
  availableScripts?: string[];
  missingScripts?: string[];
}

interface PythonRequirements {
  pythonVersion: string;
  missing: string[];
  versions: Record<string, string>;
  isValid: boolean;
  error?: string;
}

interface SystemPaths {
  python: string;
  scripts: string;
  sdScripts: string;
}

interface SystemValidationProps {
  onValidationComplete?: (isValid: boolean) => void;
}

const SystemValidation: React.FC<SystemValidationProps> = ({ onValidationComplete }) => {
  const [isValidating, setIsValidating] = useState(false);
  const [sdScriptsValidation, setSdScriptsValidation] = useState<ValidationResult | null>(null);
  const [pythonRequirements, setPythonRequirements] = useState<PythonRequirements | null>(null);
  const [systemPaths, setSystemPaths] = useState<SystemPaths | null>(null);
  const [expanded, setExpanded] = useState<string | false>('validation');

  useEffect(() => {
    runValidation();
  }, []);

  useEffect(() => {
    if (sdScriptsValidation && pythonRequirements) {
      const isSystemValid = sdScriptsValidation.isValid && pythonRequirements.isValid;
      onValidationComplete?.(isSystemValid);
    }
  }, [sdScriptsValidation, pythonRequirements, onValidationComplete]);

  const runValidation = async () => {
    setIsValidating(true);
    try {
      const [sdScripts, pythonReqs, paths] = await Promise.all([
        (window as any).api?.system?.validateSdScripts(),
        (window as any).api?.system?.checkPythonRequirements(),
        (window as any).api?.system?.getSystemPaths(),
      ]);

      setSdScriptsValidation(sdScripts);
      setPythonRequirements(pythonReqs);
      setSystemPaths(paths);
    } catch (error) {
      console.error('Validation failed:', error);
      setSdScriptsValidation({
        isValid: false,
        error: 'Validation failed: API not available'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const getStatusIcon = (isValid: boolean, hasWarning = false) => {
    if (isValid) return <CheckCircleIcon color="success" />;
    if (hasWarning) return <WarningIcon color="warning" />;
    return <ErrorIcon color="error" />;
  };

  const getStatusColor = (isValid: boolean, hasWarning = false): 'success' | 'error' | 'warning' => {
    if (isValid) return 'success';
    if (hasWarning) return 'warning';
    return 'error';
  };

  const handleAccordionChange = (panel: string) => (
    event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpanded(isExpanded ? panel : false);
  };

  const overallStatus = sdScriptsValidation?.isValid && pythonRequirements?.isValid;
  const hasWarnings = (pythonRequirements?.missing.length || 0) > 0 || 
                     (sdScriptsValidation?.missingScripts?.length || 0) > 0;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h2">
              System Validation
            </Typography>
            <Tooltip title="Re-run validation">
              <IconButton onClick={runValidation} disabled={isValidating}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {isValidating && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" gutterBottom>
                Validating system configuration...
              </Typography>
              <LinearProgress />
            </Box>
          )}

          {!isValidating && (sdScriptsValidation || pythonRequirements) && (
            <Alert 
              severity={getStatusColor(overallStatus || false, hasWarnings)}
              sx={{ mb: 3 }}
            >
              {overallStatus ? (
                <Typography>
                  <strong>System Ready!</strong> All requirements are satisfied. You can start training.
                </Typography>
              ) : (
                <Typography>
                  <strong>System Issues Detected:</strong> Please resolve the issues below before training.
                </Typography>
              )}
            </Alert>
          )}

          {/* sd-scripts Validation */}
          <Accordion 
            expanded={expanded === 'sd-scripts'} 
            onChange={handleAccordionChange('sd-scripts')}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                {getStatusIcon(sdScriptsValidation?.isValid || false)}
                <Typography variant="h6">sd-scripts Installation</Typography>
                <Chip 
                  label={sdScriptsValidation?.isValid ? 'Valid' : 'Invalid'}
                  color={getStatusColor(sdScriptsValidation?.isValid || false)}
                  size="small"
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {sdScriptsValidation && (
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <FolderIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Installation Path"
                      secondary={sdScriptsValidation.path || 'Unknown'}
                    />
                  </ListItem>
                  {sdScriptsValidation.version && (
                    <ListItem>
                      <ListItemIcon>
                        <InfoIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Version"
                        secondary={sdScriptsValidation.version}
                      />
                    </ListItem>
                  )}
                  {sdScriptsValidation.availableScripts && sdScriptsValidation.availableScripts.length > 0 && (
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Available Scripts"
                        secondary={sdScriptsValidation.availableScripts.join(', ')}
                      />
                    </ListItem>
                  )}
                  {sdScriptsValidation.missingScripts && sdScriptsValidation.missingScripts.length > 0 && (
                    <ListItem>
                      <ListItemIcon>
                        <ErrorIcon color="error" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Missing Scripts"
                        secondary={sdScriptsValidation.missingScripts.join(', ')}
                      />
                    </ListItem>
                  )}
                  {sdScriptsValidation.error && (
                    <ListItem>
                      <ListItemIcon>
                        <ErrorIcon color="error" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Error"
                        secondary={sdScriptsValidation.error}
                      />
                    </ListItem>
                  )}
                </List>
              )}
            </AccordionDetails>
          </Accordion>

          {/* Python Requirements */}
          <Accordion 
            expanded={expanded === 'python'} 
            onChange={handleAccordionChange('python')}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                {getStatusIcon(pythonRequirements?.isValid || false, (pythonRequirements?.missing.length || 0) > 0)}
                <Typography variant="h6">Python Environment</Typography>
                <Chip 
                  label={pythonRequirements?.isValid ? 'Valid' : 'Issues'}
                  color={getStatusColor(pythonRequirements?.isValid || false, (pythonRequirements?.missing.length || 0) > 0)}
                  size="small"
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {pythonRequirements && (
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <CodeIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Python Version"
                      secondary={pythonRequirements.pythonVersion}
                    />
                  </ListItem>
                  {Object.entries(pythonRequirements.versions).map(([pkg, version]) => (
                    <ListItem key={pkg}>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={pkg}
                        secondary={`Version: ${version}`}
                      />
                    </ListItem>
                  ))}
                  {pythonRequirements.missing.map((pkg) => (
                    <ListItem key={pkg}>
                      <ListItemIcon>
                        <ErrorIcon color="error" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={`Missing: ${pkg}`}
                        secondary="This package is required for training"
                      />
                    </ListItem>
                  ))}
                  {pythonRequirements.error && (
                    <ListItem>
                      <ListItemIcon>
                        <ErrorIcon color="error" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Error"
                        secondary={pythonRequirements.error}
                      />
                    </ListItem>
                  )}
                </List>
              )}
            </AccordionDetails>
          </Accordion>

          {/* System Paths */}
          <Accordion 
            expanded={expanded === 'paths'} 
            onChange={handleAccordionChange('paths')}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <ComputerIcon />
                <Typography variant="h6">System Paths</Typography>
                <Chip 
                  label="Info"
                  color="info"
                  size="small"
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {systemPaths && (
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <CodeIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Python Executable"
                      secondary={systemPaths.python}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <FolderIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Scripts Directory"
                      secondary={systemPaths.scripts}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <FolderIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="sd-scripts Directory"
                      secondary={systemPaths.sdScripts}
                    />
                  </ListItem>
                </List>
              )}
            </AccordionDetails>
          </Accordion>

          {/* Installation Guide */}
          {!overallStatus && !isValidating && (
            <Box sx={{ mt: 3 }}>
              <Alert severity="info">
                <Typography variant="subtitle2" gutterBottom>
                  Installation Guide:
                </Typography>
                <Typography variant="body2" component="div">
                  <ol>
                    <li>Install sd-scripts: <code>git clone https://github.com/kohya-ss/sd-scripts.git</code></li>
                    <li>Set up Python environment: <code>python -m venv .venv</code></li>
                    <li>Activate environment: <code>.venv\Scripts\activate</code> (Windows) or <code>source .venv/bin/activate</code> (Unix)</li>
                    <li>Install requirements: <code>pip install torch torchvision transformers diffusers accelerate</code></li>
                    <li>Install sd-scripts requirements: <code>pip install -r sd-scripts/requirements.txt</code></li>
                  </ol>
                </Typography>
              </Alert>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default SystemValidation;
