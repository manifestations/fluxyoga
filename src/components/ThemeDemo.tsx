import React, { useContext } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Divider,
  Alert,
} from '@mui/material';
import { ThemeContext } from '../main';

const ThemeDemo: React.FC = () => {
  const { isDarkMode } = useContext(ThemeContext);

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Theme Demo - {isDarkMode ? 'Dark' : 'Light'} Mode
      </Typography>
      <Typography variant="body2" sx={{ mb: 3 }}>
        Demonstrating the new {isDarkMode ? 'dark' : 'light'} theme with modern design elements
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Use the theme toggle button in the top-right corner to switch between light and dark modes!
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card className="enhanced-card">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Form Elements
              </Typography>
              <Box component="form" sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Email"
                  placeholder="Enter your email"
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  sx={{ mb: 1 }}
                >
                  Sign In
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                >
                  Create Account
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card className="enhanced-card">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Status Indicators
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <span className="status-indicator status-success"></span>
                  <Typography variant="body2">Training Complete</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <span className="status-indicator status-warning"></span>
                  <Typography variant="body2">Validation Warning</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <span className="status-indicator status-error"></span>
                  <Typography variant="body2">Training Failed</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <span className="status-indicator status-info"></span>
                  <Typography variant="body2">Model Loading</Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="body2" gutterBottom>
                  Progress Bar Example
                </Typography>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '75%' }}></div>
                </div>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card className="enhanced-card">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Enhanced Form Container
              </Typography>
              <Box className="form-container" sx={{ maxWidth: 400, mx: 'auto' }}>
                <div className="form-header">
                  <Typography variant="h5" sx={{ 
                    color: isDarkMode ? '#f9f9f9' : '#212121', 
                    fontWeight: 700 
                  }}>
                    Model Configuration
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: isDarkMode ? 'hsl(240, 5%, 64.9%)' : '#757575' 
                  }}>
                    Configure your training parameters
                  </Typography>
                </div>
                
                <div className="form-content">
                  <input 
                    className="enhanced-input" 
                    placeholder="Model Name" 
                    type="text"
                  />
                  <input 
                    className="enhanced-input" 
                    placeholder="Learning Rate" 
                    type="number"
                    step="0.0001"
                  />
                  
                  <div className="divider-with-text">
                    Advanced Options
                  </div>
                  
                  <button className="enhanced-button">
                    Start Training
                  </button>
                  <button className="enhanced-button secondary">
                    Load Preset
                  </button>
                </div>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card className="enhanced-card">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Theme Features
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Current Theme: {isDarkMode ? 'Dark' : 'Light'}
                  </Typography>
                  <Typography variant="body2">
                    Background: {isDarkMode ? '#0a0a0a (Deep Black)' : '#f5f5f5 (Light Gray)'}
                  </Typography>
                  <Typography variant="body2">
                    Paper: {isDarkMode ? 'hsl(240, 3.7%, 15.9%) (Dark Gray)' : '#ffffff (White)'}
                  </Typography>
                  <Typography variant="body2">
                    Text: {isDarkMode ? '#f9f9f9 (White)' : '#212121 (Dark Gray)'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Features:
                  </Typography>
                  <Typography variant="body2">✓ Rounded corners (20px)</Typography>
                  <Typography variant="body2">✓ Smooth transitions</Typography>
                  <Typography variant="body2">✓ Custom scrollbars</Typography>
                  <Typography variant="body2">✓ Hover effects</Typography>
                  <Typography variant="body2">✓ Status indicators</Typography>
                  <Typography variant="body2">✓ Progress bars</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ThemeDemo;
