/**
 * Configuration Service
 * 
 * Manages application-wide configuration including:
 * - User preferences and settings
 * - Window state and layout
 * - Recently used paths and models
 * - Training presets and defaults
 * - Theme and UI preferences
 */

import { AppSettings, DEFAULT_SETTINGS } from '../types/settings';

export interface WindowState {
  width: number;
  height: number;
  x?: number;
  y?: number;
  isMaximized: boolean;
}

export interface RecentItem {
  path: string;
  name: string;
  lastUsed: Date;
  type: 'model' | 'dataset' | 'output' | 'project';
}

export interface AppConfiguration extends AppSettings {
  // UI State
  ui: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    windowState: WindowState;
    lastSelectedTab: number;
    sidebarCollapsed: boolean;
    showWelcomeScreen: boolean;
  };

  // Recent items and history
  recent: {
    models: RecentItem[];
    datasets: RecentItem[];
    outputs: RecentItem[];
    projects: RecentItem[];
    maxItems: number;
  };

  // Application behavior
  behavior: {
    autoSave: boolean;
    autoSaveInterval: number; // minutes
    checkForUpdates: boolean;
    sendTelemetry: boolean;
    confirmBeforeExit: boolean;
    rememberWindowState: boolean;
  };

  // Version and migration
  version: string;
  configVersion: number;
}

const DEFAULT_CONFIGURATION: AppConfiguration = {
  ...DEFAULT_SETTINGS,
  
  ui: {
    theme: 'dark',
    language: 'en',
    windowState: {
      width: 1200,
      height: 800,
      isMaximized: false,
    },
    lastSelectedTab: 0,
    sidebarCollapsed: false,
    showWelcomeScreen: true,
  },

  recent: {
    models: [],
    datasets: [],
    outputs: [],
    projects: [],
    maxItems: 10,
  },

  behavior: {
    autoSave: true,
    autoSaveInterval: 5,
    checkForUpdates: true,
    sendTelemetry: false,
    confirmBeforeExit: true,
    rememberWindowState: true,
  },

  version: '1.0.0',
  configVersion: 1,
};

class ConfigurationService {
  private config: AppConfiguration = DEFAULT_CONFIGURATION;
  private listeners: ((config: AppConfiguration) => void)[] = [];
  private autoSaveTimer?: NodeJS.Timeout;

  constructor() {
    this.loadConfiguration();
    this.setupAutoSave();
  }

  /**
   * Load configuration from storage
   */
  async loadConfiguration(): Promise<AppConfiguration> {
    try {
      const savedConfig = await window.api.store.get('app-configuration');
      
      if (savedConfig) {
        // Merge with defaults to ensure all properties exist
        this.config = this.migrateConfiguration(savedConfig);
      } else {
        // First time setup
        this.config = { ...DEFAULT_CONFIGURATION };
        await this.saveConfiguration();
      }

      this.notifyListeners();
      return this.config;
    } catch (error) {
      console.error('Error loading configuration:', error);
      this.config = { ...DEFAULT_CONFIGURATION };
      return this.config;
    }
  }

  /**
   * Save configuration to storage
   */
  async saveConfiguration(): Promise<void> {
    try {
      await window.api.store.set('app-configuration', this.config);
      console.log('Configuration saved successfully');
    } catch (error) {
      console.error('Error saving configuration:', error);
      throw error;
    }
  }

  /**
   * Get current configuration
   */
  getConfiguration(): AppConfiguration {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  async updateConfiguration(updates: Partial<AppConfiguration>): Promise<void> {
    this.config = this.deepMerge(this.config, updates);
    this.notifyListeners();
    
    if (this.config.behavior.autoSave) {
      await this.saveConfiguration();
    }
  }

  /**
   * Update specific section of configuration
   */
  async updateSection<K extends keyof AppConfiguration>(
    section: K,
    updates: Partial<AppConfiguration[K]>
  ): Promise<void> {
    (this.config[section] as any) = { ...(this.config[section] as any), ...(updates as any) };
    this.notifyListeners();
    
    if (this.config.behavior.autoSave) {
      await this.saveConfiguration();
    }
  }

  /**
   * Reset configuration to defaults
   */
  async resetConfiguration(): Promise<void> {
    this.config = { ...DEFAULT_CONFIGURATION };
    await this.saveConfiguration();
    this.notifyListeners();
  }

  /**
   * Export configuration to file
   */
  exportConfiguration(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration from file
   */
  async importConfiguration(configData: string): Promise<void> {
    try {
      const importedConfig = JSON.parse(configData);
      this.config = this.migrateConfiguration(importedConfig);
      await this.saveConfiguration();
      this.notifyListeners();
    } catch (error) {
      throw new Error('Invalid configuration file format');
    }
  }

  /**
   * Add recent item
   */
  async addRecentItem(type: 'models' | 'datasets' | 'outputs' | 'projects', item: Omit<RecentItem, 'lastUsed'>): Promise<void> {
    const recentItems = this.config.recent[type] as RecentItem[];
    const existingIndex = recentItems.findIndex(r => r.path === item.path);
    
    const recentItem: RecentItem = {
      ...item,
      lastUsed: new Date(),
    };

    if (existingIndex >= 0) {
      // Update existing item
      recentItems[existingIndex] = recentItem;
    } else {
      // Add new item at the beginning
      recentItems.unshift(recentItem);
    }

    // Keep only the max number of items
    if (recentItems.length > this.config.recent.maxItems) {
      recentItems.splice(this.config.recent.maxItems);
    }

    await this.updateSection('recent', { [type]: recentItems } as any);
  }

  /**
   * Get recent items
   */
  getRecentItems(type: 'models' | 'datasets' | 'outputs' | 'projects'): RecentItem[] {
    const items = this.config.recent[type] as RecentItem[];
    return [...items].sort((a, b) => 
      new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
    );
  }

  /**
   * Subscribe to configuration changes
   */
  subscribe(listener: (config: AppConfiguration) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index >= 0) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Setup auto-save functionality
   */
  private setupAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    if (this.config.behavior.autoSave && this.config.behavior.autoSaveInterval > 0) {
      this.autoSaveTimer = setInterval(() => {
        this.saveConfiguration().catch(console.error);
      }, this.config.behavior.autoSaveInterval * 60 * 1000); // Convert minutes to milliseconds
    }
  }

  /**
   * Migrate configuration from older versions
   */
  private migrateConfiguration(savedConfig: any): AppConfiguration {
    // Start with defaults and merge saved values
    const migrated = this.deepMerge(DEFAULT_CONFIGURATION, savedConfig);
    
    // Handle version-specific migrations
    if (!savedConfig.configVersion || savedConfig.configVersion < 1) {
      // Migrate from old format if needed
      if (savedConfig.training && !migrated.training) {
        migrated.training = savedConfig.training;
      }
      if (savedConfig.paths && !migrated.paths) {
        migrated.paths = savedConfig.paths;
      }
    }

    // Update version numbers
    migrated.version = DEFAULT_CONFIGURATION.version;
    migrated.configVersion = DEFAULT_CONFIGURATION.configVersion;

    return migrated;
  }

  /**
   * Deep merge two objects
   */
  private deepMerge<T>(target: T, source: Partial<T>): T {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] !== undefined) {
        if (this.isObject(source[key]) && this.isObject(result[key])) {
          result[key] = this.deepMerge(result[key], source[key]!);
        } else {
          result[key] = source[key]!;
        }
      }
    }
    
    return result;
  }

  /**
   * Check if value is an object
   */
  private isObject(value: any): value is Record<string, any> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  /**
   * Notify all listeners of configuration changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.config);
      } catch (error) {
        console.error('Error in configuration listener:', error);
      }
    });
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    this.listeners.length = 0;
  }
}

// Export singleton instance
export const configService = new ConfigurationService();
export default configService;
