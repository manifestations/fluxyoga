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
  Alert,
  Collapse,
} from '@mui/material';
import {
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Memory as MemoryIcon,
} from '@mui/icons-material';
import { ThemeContext } from './main';
import DatasetManager from './components/DatasetManager';
import TrainingMonitor from './components/TrainingMonitor';
import SettingsManager from './components/settings/SimplifiedSettingsManager';
import SimpleTrainingForm from './components/training/SimpleTrainingForm';
import TrainingProgressMonitor from './components/training/TrainingProgressMonitor';
import GPUInfoCard from './components/gpu/GPUInfoCard';
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
  const [tabValue, setTabValue] = useState(0);
  const [currentTrainingProcess, setCurrentTrainingProcess] = useState<TrainingProcess | null>(null);
  const [gpuOptimizations, setGpuOptimizations] = useState<VRAMOptimizations | null>(null);
  const [showGpuInfo, setShowGpuInfo] = useState(true);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  // Update body theme attribute when theme changes
  useEffect(() => {
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

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
    setTabValue(1); // Switch to progress monitor tab
  };

  const handleTrainingProgress = (progress: any) => {
    if (currentTrainingProcess) {
      setCurrentTrainingProcess(prev => prev ? { ...prev, progress } : null);
    }
  };

  const handleGPUOptimizationsChange = (optimizations: VRAMOptimizations) => {
    setGpuOptimizations(optimizations);
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        backgroundColor: isDarkMode ? '#0a0a0a' : '#f5f5f5',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '30px 20px',
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
              mb: 3,
            }}
          >
            Advanced LoRA training interface for FLUX and SDXL models
          </Typography>

          {/* GPU Information Card */}
          <Collapse in={showGpuInfo}>
            <Box sx={{ mb: 3 }}>
              <GPUInfoCard onOptimizationsChange={handleGPUOptimizationsChange} />
            </Box>
          </Collapse>

          {gpuOptimizations && (
            <Alert 
              severity="info" 
              sx={{ mb: 3 }}
              action={
                <IconButton
                  size="small"
                  onClick={() => setShowGpuInfo(!showGpuInfo)}
                  sx={{ color: 'inherit' }}
                >
                  <MemoryIcon />
                </IconButton>
              }
            >
              GPU optimizations applied automatically. Training settings have been adjusted for your {gpuOptimizations.enableLowVRAMMode ? 'low VRAM' : 'high VRAM'} configuration.
            </Alert>
          )}
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
            <Tab label="Quick Train" />
            <Tab label="Progress Monitor" />
            <Tab label="Dataset" />
            <Tab label="Monitor" />
            <Tab label="Settings" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <SimpleTrainingForm 
              onTrainingStart={handleTrainingStart}
              onTrainingProgress={handleTrainingProgress}
              gpuOptimizations={gpuOptimizations}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <TrainingProgressMonitor 
              process={currentTrainingProcess}
              onProcessUpdate={setCurrentTrainingProcess}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <DatasetManager />
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <TrainingMonitor />
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            <SettingsManager />
          </TabPanel>
        </Paper>
      </Container>
    </Box>
  );
}

export default App;
