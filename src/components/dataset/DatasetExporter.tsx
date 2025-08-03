import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Paper,
  Grid,
} from '@mui/material';
import FileSelector from '../common/FileSelector';
import { datasetService } from '../../services/datasets/datasetService';
import { ImageDataset, DatasetExportFormat } from '../../services/datasets/types';

interface DatasetExporterProps {
  datasetId: string;
}

const DatasetExporter: React.FC<DatasetExporterProps> = ({ datasetId }) => {
  const [dataset, setDataset] = useState<ImageDataset | null>(null);
  const [exportFormat, setExportFormat] = useState<DatasetExportFormat>('kohya');
  const [exportPath, setExportPath] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadDataset();
  }, [datasetId]);

  const loadDataset = async () => {
    try {
      const storedDatasets = await window.api.store.get('datasets');
      const dataset = storedDatasets.find((ds: ImageDataset) => ds.id === datasetId);
      setDataset(dataset || null);
    } catch (error) {
      console.error('Error loading dataset:', error);
    }
  };

  const handleExport = async () => {
    if (!dataset || !exportPath) return;

    setIsExporting(true);
    try {
      await datasetService.exportDataset(datasetId, exportFormat, exportPath);
    } catch (error) {
      console.error('Error exporting dataset:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (!dataset) {
    return <Typography>Loading dataset...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Export Dataset
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Export Format</InputLabel>
              <Select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as DatasetExportFormat)}
                label="Export Format"
              >
                <MenuItem value="kohya">Kohya Format</MenuItem>
                <MenuItem value="json">JSON</MenuItem>
                <MenuItem value="csv">CSV</MenuItem>
                <MenuItem value="txt">Text Files</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FileSelector
              label="Export Directory"
              value={exportPath}
              onChange={setExportPath}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body2" gutterBottom>
              Dataset Summary:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Total Images: {dataset.metadata.totalImages}
              <br />
              • Average Resolution: {dataset.metadata.averageResolution.width} x{' '}
              {dataset.metadata.averageResolution.height}
              <br />
              • Total Tags: {dataset.metadata.tags.length}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleExport}
              disabled={isExporting || !exportPath}
              fullWidth
            >
              {isExporting ? 'Exporting...' : 'Export Dataset'}
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default DatasetExporter;
