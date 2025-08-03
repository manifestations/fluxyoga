/**
 * Configuration Context
 * 
 * React context provider for app-wide configuration management
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { configService, AppConfiguration, RecentItem } from '../services/ConfigurationService';
import { DEFAULT_SETTINGS } from '../types/settings';

interface ConfigurationContextType {
  config: AppConfiguration;
  isLoading: boolean;
  updateConfig: (updates: Partial<AppConfiguration>) => Promise<void>;
  updateSection: <K extends keyof AppConfiguration>(
    section: K,
    updates: Partial<AppConfiguration[K]>
  ) => Promise<void>;
  resetConfig: () => Promise<void>;
  exportConfig: () => string;
  importConfig: (configData: string) => Promise<void>;
  addRecentItem: (type: 'models' | 'datasets' | 'outputs' | 'projects', item: Omit<RecentItem, 'lastUsed'>) => Promise<void>;
  getRecentItems: (type: 'models' | 'datasets' | 'outputs' | 'projects') => RecentItem[];
}

const ConfigurationContext = createContext<ConfigurationContextType | undefined>(undefined);

interface ConfigurationProviderProps {
  children: ReactNode;
}

export const ConfigurationProvider: React.FC<ConfigurationProviderProps> = ({ children }) => {
  const [config, setConfig] = useState<AppConfiguration>(() => configService.getConfiguration());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load configuration on startup
    const loadConfig = async () => {
      try {
        setIsLoading(true);
        await configService.loadConfiguration();
        setConfig(configService.getConfiguration());
      } catch (error) {
        console.error('Failed to load configuration:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();

    // Subscribe to configuration changes
    const unsubscribe = configService.subscribe((newConfig) => {
      setConfig(newConfig);
    });

    return unsubscribe;
  }, []);

  const updateConfig = async (updates: Partial<AppConfiguration>): Promise<void> => {
    await configService.updateConfiguration(updates);
  };

  const updateSection = async <K extends keyof AppConfiguration>(
    section: K,
    updates: Partial<AppConfiguration[K]>
  ): Promise<void> => {
    await configService.updateSection(section, updates);
  };

  const resetConfig = async (): Promise<void> => {
    await configService.resetConfiguration();
  };

  const exportConfig = (): string => {
    return configService.exportConfiguration();
  };

  const importConfig = async (configData: string): Promise<void> => {
    await configService.importConfiguration(configData);
  };

  const addRecentItem = async (
    type: 'models' | 'datasets' | 'outputs' | 'projects',
    item: Omit<RecentItem, 'lastUsed'>
  ): Promise<void> => {
    await configService.addRecentItem(type, item);
  };

  const getRecentItems = (type: 'models' | 'datasets' | 'outputs' | 'projects'): RecentItem[] => {
    return configService.getRecentItems(type);
  };

  const value: ConfigurationContextType = {
    config,
    isLoading,
    updateConfig,
    updateSection,
    resetConfig,
    exportConfig,
    importConfig,
    addRecentItem,
    getRecentItems,
  };

  return (
    <ConfigurationContext.Provider value={value}>
      {children}
    </ConfigurationContext.Provider>
  );
};

export const useConfiguration = (): ConfigurationContextType => {
  const context = useContext(ConfigurationContext);
  if (context === undefined) {
    throw new Error('useConfiguration must be used within a ConfigurationProvider');
  }
  return context;
};

// Convenience hooks for specific sections
export const useTrainingConfig = () => {
  const { config, updateSection } = useConfiguration();
  return {
    training: config.training,
    updateTraining: (updates: Partial<AppConfiguration['training']>) => 
      updateSection('training', updates),
  };
};

export const useUIConfig = () => {
  const { config, updateSection } = useConfiguration();
  return {
    ui: config.ui,
    updateUI: (updates: Partial<AppConfiguration['ui']>) => 
      updateSection('ui', updates),
  };
};

export const usePathsConfig = () => {
  const { config, updateSection } = useConfiguration();
  return {
    paths: config.paths,
    updatePaths: (updates: Partial<AppConfiguration['paths']>) => 
      updateSection('paths', updates),
  };
};

export const useBehaviorConfig = () => {
  const { config, updateSection } = useConfiguration();
  return {
    behavior: config.behavior,
    updateBehavior: (updates: Partial<AppConfiguration['behavior']>) => 
      updateSection('behavior', updates),
  };
};

export const useRecentItems = () => {
  const { addRecentItem, getRecentItems } = useConfiguration();
  return { addRecentItem, getRecentItems };
};
