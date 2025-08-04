/**
 * Auto-Save Manager Component
 * 
 * Provides a comprehensive interface for managing auto-saved data across the application
 * Shows saved forms, allows restoration, and provides data management controls
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  Restore as RestoreIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Description as FormIcon,
  Settings as SettingsIcon,
  School as TrainingIcon,
  Dataset as DatasetIcon,
  Info as InfoIcon,
  CloudDownload as ExportIcon,
  CloudUpload as ImportIcon,
} from '@mui/icons-material';
import { autoSaveService, SavedFormData, FormRegistration } from '../../services/AutoSaveService';

interface AutoSaveManagerProps {
  onFormRestore?: (formId: string, data: any) => void;
}

const AutoSaveManager: React.FC<AutoSaveManagerProps> = ({ onFormRestore }) => {
  const [formsWithData, setFormsWithData] = useState<(FormRegistration & { savedData: SavedFormData })[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [forms, stats] = await Promise.all([
        autoSaveService.getFormsWithSavedData(),
        autoSaveService.getStatistics()
      ]);
      
      setFormsWithData(forms);
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load auto-save data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreForm = async (formId: string, data: any) => {
    try {
      onFormRestore?.(formId, data);
      console.log(`Form ${formId} restored`);
    } catch (error) {
      console.error(`Failed to restore form ${formId}:`, error);
    }
  };

  const handleDeleteFormData = async (formId: string) => {
    try {
      await autoSaveService.clearFormData(formId);
      setDeleteDialogOpen(false);
      setSelectedFormId(null);
      await loadData(); // Refresh data
    } catch (error) {
      console.error(`Failed to delete form data for ${formId}:`, error);
    }
  };

  const handleClearAllData = async () => {
    try {
      await autoSaveService.clearAllSavedData();
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Failed to clear all saved data:', error);
    }
  };

  const handleExportData = async () => {
    try {
      const exportData = await autoSaveService.exportSavedData();
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `fluxyoga-autosave-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export saved data:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'training': return <TrainingIcon />;
      case 'settings': return <SettingsIcon />;
      case 'dataset': return <DatasetIcon />;
      default: return <FormIcon />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6">Loading saved data...</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {/* Statistics Overview */}
      {statistics && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoIcon />
              Auto-Save Statistics
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {statistics.formsWithSavedData}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Forms with saved data
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="secondary">
                    {formatFileSize(statistics.totalDataSize)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total data size
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body1" color="success.main">
                    {statistics.newestSave ? statistics.newestSave.toLocaleDateString() : 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Most recent save
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body1" color="warning.main">
                    {statistics.oldestSave ? statistics.oldestSave.toLocaleDateString() : 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Oldest save
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Saved Forms List */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Saved Form Data</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                startIcon={<ExportIcon />}
                onClick={handleExportData}
                disabled={formsWithData.length === 0}
              >
                Export
              </Button>
              <Button
                size="small"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleClearAllData}
                disabled={formsWithData.length === 0}
              >
                Clear All
              </Button>
            </Box>
          </Box>

          {formsWithData.length === 0 ? (
            <Alert severity="info">
              No saved form data found. Form data will appear here as you use the application.
            </Alert>
          ) : (
            <List>
              {formsWithData.map((form, index) => (
                <React.Fragment key={form.formId}>
                  <ListItem>
                    <ListItemIcon>
                      {getCategoryIcon(form.category)}
                    </ListItemIcon>
                    <ListItemText
                      primary={form.displayName}
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            {form.description}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            <Chip
                              size="small"
                              label={form.category}
                              variant="outlined"
                            />
                            <Chip
                              size="small"
                              label={`Saved: ${new Date(form.savedData.timestamp).toLocaleString()}`}
                              variant="outlined"
                            />
                            <Chip
                              size="small"
                              label={formatFileSize(JSON.stringify(form.savedData).length)}
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          edge="end"
                          onClick={() => handleRestoreForm(form.formId, form.savedData.data)}
                          color="primary"
                        >
                          <RestoreIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          onClick={() => {
                            setSelectedFormId(form.formId);
                            setDeleteDialogOpen(true);
                          }}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < formsWithData.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Saved Data</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the saved data for this form? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => selectedFormId && handleDeleteFormData(selectedFormId)}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AutoSaveManager;
