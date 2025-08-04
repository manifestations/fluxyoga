/**
 * Auto-Save Notification Component
 * 
 * Provides visual feedback about auto-save operations
 * Shows notifications for save success, restore operations, and errors
 */

import React, { useState, useEffect } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Box,
  Typography,
  Chip,
  Slide,
  Portal,
} from '@mui/material';
import {
  Save as SaveIcon,
  Restore as RestoreIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material';

export interface AutoSaveNotification {
  id: string;
  type: 'save' | 'restore' | 'error' | 'clear';
  formName: string;
  message?: string;
  timestamp: number;
  duration?: number;
}

interface AutoSaveNotificationProviderProps {
  children: React.ReactNode;
}

// Global notification state
let notificationListeners: Array<(notification: AutoSaveNotification) => void> = [];
let notificationCounter = 0;

export const showAutoSaveNotification = (notification: Omit<AutoSaveNotification, 'id' | 'timestamp'>) => {
  const fullNotification: AutoSaveNotification = {
    ...notification,
    id: `autosave-${++notificationCounter}`,
    timestamp: Date.now(),
    duration: notification.duration || 4000
  };

  notificationListeners.forEach(listener => listener(fullNotification));
};

const AutoSaveNotificationProvider: React.FC<AutoSaveNotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<AutoSaveNotification[]>([]);

  useEffect(() => {
    const listener = (notification: AutoSaveNotification) => {
      setNotifications(prev => [...prev, notification]);

      // Auto-remove notification after duration
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, notification.duration);
    };

    notificationListeners.push(listener);

    return () => {
      notificationListeners = notificationListeners.filter(l => l !== listener);
    };
  }, []);

  const handleClose = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const getNotificationIcon = (type: AutoSaveNotification['type']) => {
    switch (type) {
      case 'save': return <SaveIcon />;
      case 'restore': return <RestoreIcon />;
      case 'error': return <ErrorIcon />;
      case 'clear': return <SuccessIcon />;
      default: return <SaveIcon />;
    }
  };

  const getNotificationSeverity = (type: AutoSaveNotification['type']) => {
    switch (type) {
      case 'save': return 'success' as const;
      case 'restore': return 'info' as const;
      case 'error': return 'error' as const;
      case 'clear': return 'warning' as const;
      default: return 'info' as const;
    }
  };

  const getNotificationTitle = (type: AutoSaveNotification['type']) => {
    switch (type) {
      case 'save': return 'Auto-Saved';
      case 'restore': return 'Data Restored';
      case 'error': return 'Auto-Save Error';
      case 'clear': return 'Data Cleared';
      default: return 'Auto-Save';
    }
  };

  return (
    <>
      {children}
      
      {/* Notification Stack */}
      <Portal>
        <Box
          sx={{
            position: 'fixed',
            top: 80,
            right: 20,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            maxWidth: 400,
          }}
        >
          {notifications.map((notification, index) => (
            <Slide
              key={notification.id}
              direction="left"
              in={true}
              timeout={300}
              style={{ 
                transitionDelay: `${index * 100}ms`,
              }}
            >
              <Alert
                severity={getNotificationSeverity(notification.type)}
                onClose={() => handleClose(notification.id)}
                icon={getNotificationIcon(notification.type)}
                sx={{
                  boxShadow: 3,
                  backdropFilter: 'blur(10px)',
                  backgroundColor: theme => 
                    theme.palette.mode === 'dark' 
                      ? 'rgba(0, 0, 0, 0.8)' 
                      : 'rgba(255, 255, 255, 0.9)',
                }}
              >
                <AlertTitle sx={{ mb: 0.5 }}>
                  {getNotificationTitle(notification.type)}
                </AlertTitle>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Chip
                    size="small"
                    label={notification.formName}
                    variant="outlined"
                  />
                  <Typography variant="caption" color="textSecondary">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </Typography>
                </Box>
                
                {notification.message && (
                  <Typography variant="body2">
                    {notification.message}
                  </Typography>
                )}
              </Alert>
            </Slide>
          ))}
        </Box>
      </Portal>
    </>
  );
};

export default AutoSaveNotificationProvider;
