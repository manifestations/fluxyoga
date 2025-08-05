import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  Container,
  Tab,
  Tabs,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Backdrop,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
} from '@mui/icons-material';
import { ThemeContext } from './main';
import { useConfiguration, useUIConfig } from './contexts/ConfigurationContext';
import DatasetManager from './components/DatasetManager';
import TrainingMonitor from './components/TrainingMonitor';
import SettingsManager from './components/settings/EnhancedSettingsManager';
import SimpleTrainingForm from './components/training/SimpleTrainingForm';
import TrainingProgressMonitor from './components/training/TrainingProgressMonitor';
import BottomGPUBar from './components/gpu/BottomGPUBar';
import SystemValidation from './components/system/SystemValidation';
import { TrainingProcess } from './types/training';
import { VRAMOptimizations, gpuDetection } from './services/GPUDetection';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function App() {
  const [currentTrainingProcess, setCurrentTrainingProcess] = useState<TrainingProcess | null>(null);
  const [gpuOptimizations, setGpuOptimizations] = useState<VRAMOptimizations | null>(null);
  const [isSystemValid, setIsSystemValid] = useState<boolean | null>(null);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const { config, isLoading } = useConfiguration();
  const { ui, updateUI } = useUIConfig();
  
  // Use configuration for tab value
  const [tabValue, setTabValue] = useState(ui.lastSelectedTab || 0);

  // Update body theme attribute when theme changes
  useEffect(() => {
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Save tab selection to configuration
  useEffect(() => {
    if (tabValue !== ui.lastSelectedTab) {
      updateUI({ lastSelectedTab: tabValue });
    }
  }, [tabValue, ui.lastSelectedTab, updateUI]);

  // Auto-detect GPU on startup
  useEffect(() => {
    const detectGPUOnStartup = async () => {
      try {
        const gpuInfo = await gpuDetection.detectGPU();
        if (gpuInfo) {
          const optimizations = gpuDetection.getVRAMOptimizations(gpuInfo);
          setGpuOptimizations(optimizations);
        }
      } catch (error) {
        console.warn('Initial GPU detection failed:', error);
      }
    };

    detectGPUOnStartup();
  }, []);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleTrainingStart = (process: TrainingProcess) => {
    setCurrentTrainingProcess(process);
    // Stay on the same tab since training monitor is now integrated
  };

  const handleTrainingProgress = (progress: any) => {
    if (currentTrainingProcess) {
      setCurrentTrainingProcess(prev => prev ? { ...prev, progress } : null);
    }
  };

  const handleGPUOptimizationsChange = (optimizations: VRAMOptimizations) => {
    setGpuOptimizations(optimizations);
  };

  // Show loading screen while configuration is being loaded
  if (isLoading) {
    return (
      <Backdrop open={true} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress color="inherit" />
          <Typography variant="h6">Loading Configuration...</Typography>
        </Box>
      </Backdrop>
    );
  }

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        backgroundColor: isDarkMode ? '#0a0a0a' : '#f5f5f5',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '30px 20px 60px 20px', // Added bottom padding for GPU bar
      }}
    >
      <Container 
        maxWidth="xl" 
        sx={{
          maxWidth: '1200px',
          padding: '30px 50px',
          borderRadius: '20px',
          border: isDarkMode ? '1px solid hsla(240, 5%, 65%, 0.2)' : '1px solid rgba(0, 0, 0, 0.12)',
          backgroundColor: isDarkMode ? 'hsl(240, 3.7%, 15.9%)' : '#ffffff',
          marginTop: 0,
          boxShadow: isDarkMode ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Box sx={{ width: '100%', textAlign: 'center', mb: 4, position: 'relative' }}>
          {/* Theme Toggle Button */}
          <Box sx={{ position: 'absolute', top: 0, right: 0 }}>
            <Tooltip title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              <IconButton 
                onClick={toggleTheme}
                sx={{
                  color: isDarkMode ? '#f9f9f9' : '#1976d2',
                  '&:hover': {
                    backgroundColor: isDarkMode ? 'hsla(240, 3.7%, 15.9%, 0.8)' : 'rgba(25, 118, 210, 0.04)',
                  },
                }}
              >
                {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
          </Box>

          {/* Logo */}
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
            <img
              src={isDarkMode ? '../media/images/logo_light.png' : '../media/images/logo_dark.png'}
              alt="FluxYoga"
              style={{
                height: '60px',
                maxWidth: '100%',
                objectFit: 'contain',
              }}
              onError={(e) => {
                // Fallback to text if image fails to load
                e.currentTarget.style.display = 'none';
                const fallbackText = document.createElement('div');
                fallbackText.textContent = 'FluxYoga';
                fallbackText.style.fontSize = '2rem';
                fallbackText.style.fontWeight = '700';
                fallbackText.style.color = isDarkMode ? '#f9f9f9' : '#212121';
                e.currentTarget.parentNode?.appendChild(fallbackText);
              }}
            />
          </Box>
          
          <Typography 
            variant="body2" 
            sx={{
              color: isDarkMode ? 'hsl(240, 5%, 64.9%)' : '#757575',
              fontSize: '0.9rem',
              mb: 2,
            }}
          >
            Advanced LoRA training interface for FLUX and SDXL models
          </Typography>
        </Box>
        
        <Paper 
          sx={{ 
            width: '100%', 
            mb: 2,
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '20px',
            boxShadow: 'none',
          }}
        >
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: isDarkMode ? '1px solid hsla(240, 5%, 65%, 0.2)' : '1px solid rgba(0, 0, 0, 0.12)',
              mb: 2,
            }}
          >
            <Tab label="Train" disabled={isSystemValid === false} />
            <Tab label="Dataset" />
            <Tab label="System" />
            <Tab label="Settings & Config" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            {isSystemValid === false ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography>
                  <strong>System validation required:</strong> Please resolve system issues in the System tab before training.
                </Typography>
              </Alert>
            ) : (
              <SimpleTrainingForm 
                onTrainingStart={handleTrainingStart}
                onTrainingProgress={handleTrainingProgress}
                gpuOptimizations={gpuOptimizations}
                currentTrainingProcess={currentTrainingProcess}
              />
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <DatasetManager />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <SystemValidation onValidationComplete={setIsSystemValid} />
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Box sx={{ mb: 2 }}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Settings & Configuration:</strong> Configure VRAM presets, training defaults, 
                  UI preferences, file paths, and application behavior. Import/export your settings 
                  and manage recent items.
                </Typography>
              </Alert>
            </Box>
            <SettingsManager />
          </TabPanel>
        </Paper>
      </Container>

      {/* Bottom GPU Bar - Fixed at bottom */}
      <BottomGPUBar 
        onOptimizationsChange={handleGPUOptimizationsChange}
        isDarkMode={isDarkMode}
      />
    </Box>
  );
}

export default App;
