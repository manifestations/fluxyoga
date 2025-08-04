/**
 * Auto-Save Feature Summary Component
 * 
 * Displays information about the auto-save functionality to users
 * Shows what data is being saved and how to manage it
 */

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Chip,
  Button,
  Paper,
  Grid,
} from '@mui/material';
import {
  AutoMode as AutoIcon,
  Save as SaveIcon,
  Restore as RestoreIcon,
  Schedule as ScheduleIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

interface AutoSaveFeatureSummaryProps {
  onManageData?: () => void;
}

const AutoSaveFeatureSummary: React.FC<AutoSaveFeatureSummaryProps> = ({ onManageData }) => {
  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoIcon color="primary" />
            Auto-Save Feature
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Never lose your work again!</strong> FluxYoga automatically saves all your configurations 
              and restores them when you return. Your data is safely stored locally on your device.
            </Typography>
          </Alert>

          <Grid container spacing={3}>
            {/* What gets saved */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StorageIcon />
                  What Gets Saved
                </Typography>
                
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <Chip size="small" label="Training" color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Training Configuration"
                      secondary="Model paths, datasets, hyperparameters, and sample prompts"
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <Chip size="small" label="Settings" color="secondary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Application Settings"
                      secondary="VRAM presets, default paths, and interface preferences"
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <Chip size="small" label="Paths" color="success" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Directory Selections"
                      secondary="Previously selected folders and files for quick access"
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>

            {/* How it works */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SettingsIcon />
                  How It Works
                </Typography>
                
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <SaveIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Automatic Saving"
                      secondary="Saves every 5 seconds and immediately when you make changes"
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <RestoreIcon color="secondary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Automatic Restore"
                      secondary="Restores your previous session when you reopen the app"
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <SecurityIcon color="success" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Local Storage"
                      secondary="All data is stored securely on your device, never in the cloud"
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
          </Grid>

          {/* Actions */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={onManageData}
              startIcon={<SettingsIcon />}
            >
              Manage Saved Data
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AutoSaveFeatureSummary;
