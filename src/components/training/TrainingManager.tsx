import React, { useState } from 'react';
import {
  Box,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import TrainingConfiguration from './TrainingConfiguration';
import TrainingVisualization from './TrainingVisualization';

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
      id={`training-tabpanel-${index}`}
      aria-labelledby={`training-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const TrainingManager: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [activeTrainingId, setActiveTrainingId] = useState<string | null>(null);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleStartTraining = async (config: any) => {
    try {
      // Start training through API
      const result = await window.api.python.startTraining?.(config);
      setActiveTrainingId(result.processId);
      setSelectedTab(1); // Switch to visualization tab
    } catch (error) {
      console.error('Error starting training:', error);
    }
  };

  const handleStopTraining = async () => {
    if (activeTrainingId) {
      try {
        await window.api.python.stopTraining?.(activeTrainingId);
        setActiveTrainingId(null);
        setSelectedTab(0); // Switch back to configuration
      } catch (error) {
        console.error('Error stopping training:', error);
      }
    }
  };

  const handlePauseTraining = async () => {
    if (activeTrainingId) {
      try {
        await window.api.python.pauseTraining?.(activeTrainingId);
      } catch (error) {
        console.error('Error pausing training:', error);
      }
    }
  };

  const handleResumeTraining = async () => {
    if (activeTrainingId) {
      try {
        await window.api.python.resumeTraining?.(activeTrainingId);
      } catch (error) {
        console.error('Error resuming training:', error);
      }
    }
  };

  const handleSavePreset = async (config: any, name: string) => {
    try {
      await window.api.store.set(`training-preset-${name}`, config);
      console.log(`Saved preset: ${name}`);
    } catch (error) {
      console.error('Error saving preset:', error);
    }
  };

  const handleLoadPreset = async (name: string) => {
    try {
      const config = await window.api.store.get(`training-preset-${name}`);
      if (config) {
        console.log(`Loaded preset: ${name}`, config);
        // You would set this config in the TrainingConfiguration component
      }
    } catch (error) {
      console.error('Error loading preset:', error);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          aria-label="training management tabs"
        >
          <Tab label="Configuration" />
          <Tab 
            label="Training Monitor" 
            disabled={!activeTrainingId}
          />
          <Tab label="History" />
        </Tabs>

        <TabPanel value={selectedTab} index={0}>
          <TrainingConfiguration
            onStartTraining={handleStartTraining}
            onSavePreset={handleSavePreset}
            onLoadPreset={handleLoadPreset}
          />
        </TabPanel>

        <TabPanel value={selectedTab} index={1}>
          {activeTrainingId ? (
            <TrainingVisualization
              trainingId={activeTrainingId}
              onStop={handleStopTraining}
              onPause={handlePauseTraining}
              onResume={handleResumeTraining}
            />
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                No active training session
              </Typography>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={selectedTab} index={2}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Training History
            </Typography>
            <Typography color="text.secondary">
              Training history will be displayed here
            </Typography>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default TrainingManager;
