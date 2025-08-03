import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FileSelector from '../common/FileSelector';
import { datasetService } from '../../services/datasets/datasetService';
import { ImageDataset } from '../../services/datasets/types';

interface DatasetListProps {
  onDatasetSelect: (datasetId: string) => void;
}

const DatasetList: React.FC<DatasetListProps> = ({ onDatasetSelect }) => {
  const [datasets, setDatasets] = useState<ImageDataset[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newDatasetPath, setNewDatasetPath] = useState('');
  const [newDatasetName, setNewDatasetName] = useState('');
  const [newDatasetDescription, setNewDatasetDescription] = useState('');

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    try {
      const storedDatasets = await window.api.store.get('datasets') || [];
      setDatasets(storedDatasets);
    } catch (error) {
      console.error('Error loading datasets:', error);
    }
  };

  const handleCreateDataset = async () => {
    try {
      const dataset = await datasetService.createDataset(
        newDatasetPath,
        newDatasetName,
        newDatasetDescription
      );
      setDatasets([...datasets, dataset]);
      setOpenDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error creating dataset:', error);
    }
  };

  const handleDeleteDataset = async (datasetId: string) => {
    try {
      const updatedDatasets = datasets.filter((ds) => ds.id !== datasetId);
      await window.api.store.set('datasets', updatedDatasets);
      setDatasets(updatedDatasets);
    } catch (error) {
      console.error('Error deleting dataset:', error);
    }
  };

  const resetForm = () => {
    setNewDatasetPath('');
    setNewDatasetName('');
    setNewDatasetDescription('');
  };

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Dataset Management</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Add Dataset
        </Button>
      </Box>

      <Paper sx={{ maxHeight: 400, overflow: 'auto' }}>
        <List>
          {datasets.map((dataset) => (
            <ListItem
              key={dataset.id}
              button
              onClick={() => onDatasetSelect(dataset.id)}
            >
              <ListItemText
                primary={dataset.metadata.name}
                secondary={`${dataset.metadata.totalImages} images | Last modified: ${new Date(
                  dataset.metadata.modified
                ).toLocaleDateString()}`}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  aria-label="edit"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDatasetSelect(dataset.id);
                  }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteDataset(dataset.id);
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Dataset</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FileSelector
              label="Dataset Directory"
              value={newDatasetPath}
              onChange={setNewDatasetPath}
              required
            />
            <TextField
              label="Dataset Name"
              value={newDatasetName}
              onChange={(e) => setNewDatasetName(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={newDatasetDescription}
              onChange={(e) => setNewDatasetDescription(e.target.value)}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateDataset}
            variant="contained"
            color="primary"
            disabled={!newDatasetPath || !newDatasetName}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DatasetList;
