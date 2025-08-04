/**
 * Auto-Save Hook
 * 
 * Provides comprehensive auto-save functionality for form data persistence
 * Automatically saves user inputs and restores them on component mount
 */

import { useEffect, useRef, useCallback } from 'react';
import { showAutoSaveNotification } from '../components/common/AutoSaveNotificationProvider';

export interface AutoSaveOptions {
  /** Unique key for storing the data */
  key: string;
  /** Data to save */
  data: any;
  /** Human-readable name for notifications */
  displayName?: string;
  /** Callback to restore data when component mounts */
  onRestore?: (data: any) => void;
  /** Auto-save interval in milliseconds (default: 5000ms = 5 seconds) */
  interval?: number;
  /** Whether to save immediately on data change (default: true) */
  saveOnChange?: boolean;
  /** Whether to save on window beforeunload event (default: true) */
  saveOnUnload?: boolean;
  /** Whether to show notifications for save/restore operations (default: true) */
  showNotifications?: boolean;
  /** Whether to enable debug logging */
  debug?: boolean;
}

export const useAutoSave = ({
  key,
  data,
  displayName,
  onRestore,
  interval = 5000, // 5 seconds default
  saveOnChange = true,
  saveOnUnload = true,
  showNotifications = true,
  debug = false
}: AutoSaveOptions) => {
  const intervalRef = useRef<NodeJS.Timeout>();
  const lastDataRef = useRef<string>('');
  const isInitializedRef = useRef(false);
  const formDisplayName = displayName || key;

  // Log debug messages
  const log = useCallback((message: string, ...args: any[]) => {
    if (debug) {
      console.log(`[AutoSave:${key}] ${message}`, ...args);
    }
  }, [debug, key]);

  // Save data to storage
  const saveData = useCallback(async (dataToSave: any) => {
    try {
      const serializedData = JSON.stringify(dataToSave);
      
      // Don't save if data hasn't changed
      if (serializedData === lastDataRef.current) {
        return;
      }

      await window.api?.store?.set(`autosave_${key}`, {
        data: dataToSave,
        timestamp: Date.now(),
        version: '1.0'
      });

      lastDataRef.current = serializedData;
      log('Data saved successfully', { dataSize: serializedData.length });

      // Show notification
      if (showNotifications) {
        showAutoSaveNotification({
          type: 'save',
          formName: formDisplayName,
          message: `Configuration saved automatically`
        });
      }
    } catch (error) {
      console.error(`[AutoSave:${key}] Failed to save data:`, error);
      
      if (showNotifications) {
        showAutoSaveNotification({
          type: 'error',
          formName: formDisplayName,
          message: 'Failed to save data automatically'
        });
      }
    }
  }, [key, log, showNotifications, formDisplayName]);

  // Load data from storage
  const loadData = useCallback(async () => {
    try {
      const savedData = await window.api?.store?.get(`autosave_${key}`);
      
      if (savedData && savedData.data) {
        log('Data loaded successfully', { 
          timestamp: new Date(savedData.timestamp).toLocaleString(),
          version: savedData.version 
        });
        
        onRestore?.(savedData.data);
        lastDataRef.current = JSON.stringify(savedData.data);

        // Show notification
        if (showNotifications) {
          showAutoSaveNotification({
            type: 'restore',
            formName: formDisplayName,
            message: `Previous session restored from ${new Date(savedData.timestamp).toLocaleDateString()}`
          });
        }

        return savedData.data;
      } else {
        log('No saved data found');
      }
    } catch (error) {
      console.error(`[AutoSave:${key}] Failed to load data:`, error);
      
      if (showNotifications) {
        showAutoSaveNotification({
          type: 'error',
          formName: formDisplayName,
          message: 'Failed to restore previous session'
        });
      }
    }
    return null;
  }, [key, onRestore, log, showNotifications, formDisplayName]);

  // Clear saved data
  const clearSavedData = useCallback(async () => {
    try {
      // Type assertion to access the delete method that exists in the actual implementation
      await (window.api?.store as any)?.delete(`autosave_${key}`);
      lastDataRef.current = '';
      log('Saved data cleared');

      // Show notification
      if (showNotifications) {
        showAutoSaveNotification({
          type: 'clear',
          formName: formDisplayName,
          message: 'Saved data cleared'
        });
      }
    } catch (error) {
      console.error(`[AutoSave:${key}] Failed to clear data:`, error);
      
      if (showNotifications) {
        showAutoSaveNotification({
          type: 'error',
          formName: formDisplayName,
          message: 'Failed to clear saved data'
        });
      }
    }
  }, [key, log, showNotifications, formDisplayName]);

  // Get info about saved data
  const getSavedDataInfo = useCallback(async () => {
    try {
      const savedData = await window.api?.store?.get(`autosave_${key}`);
      if (savedData) {
        return {
          exists: true,
          timestamp: savedData.timestamp,
          lastSaved: new Date(savedData.timestamp).toLocaleString(),
          version: savedData.version || 'unknown'
        };
      }
    } catch (error) {
      console.error(`[AutoSave:${key}] Failed to get data info:`, error);
    }
    
    return {
      exists: false,
      timestamp: null,
      lastSaved: null,
      version: null
    };
  }, [key]);

  // Initialize and load saved data on mount
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      loadData();
      log('Auto-save initialized');
    }
  }, [loadData, log]);

  // Save on data change (immediate save)
  useEffect(() => {
    if (saveOnChange && isInitializedRef.current && data) {
      saveData(data);
    }
  }, [data, saveOnChange, saveData]);

  // Set up interval saving
  useEffect(() => {
    if (interval > 0) {
      intervalRef.current = setInterval(() => {
        if (data) {
          saveData(data);
        }
      }, interval);

      log(`Auto-save interval set to ${interval}ms`);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        log('Auto-save interval cleared');
      }
    };
  }, [interval, data, saveData, log]);

  // Save on window beforeunload
  useEffect(() => {
    if (saveOnUnload) {
      const handleBeforeUnload = () => {
        if (data) {
          // Use synchronous storage for beforeunload to ensure data is saved
          try {
            const serializedData = JSON.stringify({
              data,
              timestamp: Date.now(),
              version: '1.0'
            });
            localStorage.setItem(`autosave_${key}`, serializedData);
            log('Data saved on window unload');
          } catch (error) {
            console.error(`[AutoSave:${key}] Failed to save on unload:`, error);
          }
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [data, key, saveOnUnload, log]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      log('Auto-save hook unmounted');
    };
  }, [log]);

  return {
    saveData: () => saveData(data),
    loadData,
    clearSavedData,
    getSavedDataInfo,
    manualSave: () => saveData(data)
  };
};

export default useAutoSave;
