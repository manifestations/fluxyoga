import React, { useState } from 'react';
import {
  Box,
  Paper,
  Grid,
  Typography,
  Tab,
  Tabs,
} from '@mui/material';
import DatasetList from './DatasetList';
import DatasetEditor from './DatasetEditor';
import CaptionGenerator from './CaptionGenerator';
import DatasetExporter from './DatasetExporter';
import DatasetImport from './DatasetImport';
import PreprocessingTools from './PreprocessingTools';

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
      id={`dataset-tabpanel-${index}`}
      aria-labelledby={`dataset-tab-${index}`}
      {...other}
    >
      <Box sx={{ p: 3, display: value === index ? 'block' : 'none' }}>{children}</Box>
    </div>
  );
}

const DatasetManager: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          aria-label="dataset management tabs"
        >
          <Tab label="Datasets" />
          <Tab label="Import" />
          <Tab label="Editor" disabled={!selectedDataset} />
          <Tab label="Preprocessing" disabled={!selectedDataset} />
          <Tab label="Caption Generator" disabled={!selectedDataset} />
          <Tab label="Export" disabled={!selectedDataset} />
        </Tabs>

        <TabPanel value={selectedTab} index={0}>
          <DatasetList
            onDatasetSelect={(datasetId: string) => {
              setSelectedDataset(datasetId);
              setSelectedTab(1); // Switch to editor tab
            }}
          />
        </TabPanel>

        <TabPanel value={selectedTab} index={1}>
          <DatasetImport onComplete={() => setSelectedTab(0)} />
        </TabPanel>

        <TabPanel value={selectedTab} index={2}>
          {selectedDataset && <DatasetEditor datasetId={selectedDataset} />}
        </TabPanel>

        <TabPanel value={selectedTab} index={3}>
          {selectedDataset && (
            <PreprocessingTools 
              datasetId={selectedDataset} 
              onComplete={() => {
                setSelectedDataset(null);
                setSelectedTab(0);
              }} 
            />
          )}
        </TabPanel>

        <TabPanel value={selectedTab} index={4}>
          {selectedDataset && <CaptionGenerator datasetId={selectedDataset} />}
        </TabPanel>

        <TabPanel value={selectedTab} index={5}>
          {selectedDataset && <DatasetExporter datasetId={selectedDataset} />}
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default DatasetManager;
