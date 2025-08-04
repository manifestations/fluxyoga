/**
 * Auto-Save Service
 * 
 * Centralized service for managing auto-save functionality across the application
 * Tracks all forms and their data, provides restore functionality
 */

export interface SavedFormData {
  formId: string;
  data: any;
  timestamp: number;
  lastModified: number;
  version: string;
}

export interface FormRegistration {
  formId: string;
  displayName: string;
  category: 'training' | 'settings' | 'dataset' | 'other';
  description?: string;
}

class AutoSaveService {
  private registeredForms: Map<string, FormRegistration> = new Map();
  private activeAutoSaves: Set<string> = new Set();
  
  /**
   * Register a form for auto-save tracking
   */
  registerForm(registration: FormRegistration) {
    this.registeredForms.set(registration.formId, registration);
  }

  /**
   * Unregister a form from auto-save tracking
   */
  unregisterForm(formId: string) {
    this.registeredForms.delete(formId);
    this.activeAutoSaves.delete(formId);
  }

  /**
   * Get all registered forms
   */
  getRegisteredForms(): FormRegistration[] {
    return Array.from(this.registeredForms.values());
  }

  /**
   * Get saved data for a specific form
   */
  async getSavedFormData(formId: string): Promise<SavedFormData | null> {
    try {
      const data = await window.api?.store?.get(`autosave_${formId}`);
      return data || null;
    } catch (error) {
      console.error(`Failed to get saved data for form ${formId}:`, error);
      return null;
    }
  }

  /**
   * Save data for a specific form
   */
  async saveFormData(formId: string, data: any): Promise<void> {
    try {
      const savedData: SavedFormData = {
        formId,
        data,
        timestamp: Date.now(),
        lastModified: Date.now(),
        version: '1.0'
      };

      await window.api?.store?.set(`autosave_${formId}`, savedData);
      this.activeAutoSaves.add(formId);
    } catch (error) {
      console.error(`Failed to save data for form ${formId}:`, error);
    }
  }

  /**
   * Clear saved data for a specific form
   */
  async clearFormData(formId: string): Promise<void> {
    try {
      await (window.api?.store as any)?.delete(`autosave_${formId}`);
      this.activeAutoSaves.delete(formId);
    } catch (error) {
      console.error(`Failed to clear saved data for form ${formId}:`, error);
    }
  }

  /**
   * Get all forms that have saved data
   */
  async getFormsWithSavedData(): Promise<(FormRegistration & { savedData: SavedFormData })[]> {
    const formsWithData: (FormRegistration & { savedData: SavedFormData })[] = [];

    for (const registration of this.registeredForms.values()) {
      const savedData = await this.getSavedFormData(registration.formId);
      if (savedData) {
        formsWithData.push({
          ...registration,
          savedData
        });
      }
    }

    return formsWithData;
  }

  /**
   * Clear all saved form data
   */
  async clearAllSavedData(): Promise<void> {
    const formIds = Array.from(this.registeredForms.keys());
    
    await Promise.all(
      formIds.map(formId => this.clearFormData(formId))
    );
  }

  /**
   * Export all saved data to a file
   */
  async exportSavedData(): Promise<{ [formId: string]: SavedFormData }> {
    const exportData: { [formId: string]: SavedFormData } = {};

    for (const formId of this.registeredForms.keys()) {
      const savedData = await this.getSavedFormData(formId);
      if (savedData) {
        exportData[formId] = savedData;
      }
    }

    return exportData;
  }

  /**
   * Import saved data from an export file
   */
  async importSavedData(importData: { [formId: string]: SavedFormData }): Promise<void> {
    for (const [formId, savedData] of Object.entries(importData)) {
      if (this.registeredForms.has(formId)) {
        await this.saveFormData(formId, savedData.data);
      }
    }
  }

  /**
   * Get statistics about saved data
   */
  async getStatistics() {
    const registeredCount = this.registeredForms.size;
    const formsWithData = await this.getFormsWithSavedData();
    const totalSavedForms = formsWithData.length;
    
    let totalDataSize = 0;
    let oldestSave: number | null = null;
    let newestSave: number | null = null;

    for (const form of formsWithData) {
      const dataSize = JSON.stringify(form.savedData).length;
      totalDataSize += dataSize;

      if (!oldestSave || form.savedData.timestamp < oldestSave) {
        oldestSave = form.savedData.timestamp;
      }
      if (!newestSave || form.savedData.timestamp > newestSave) {
        newestSave = form.savedData.timestamp;
      }
    }

    return {
      registeredFormsCount: registeredCount,
      formsWithSavedData: totalSavedForms,
      totalDataSize,
      oldestSave: oldestSave ? new Date(oldestSave) : null,
      newestSave: newestSave ? new Date(newestSave) : null,
      categories: this.getFormsByCategory()
    };
  }

  /**
   * Get forms grouped by category
   */
  private getFormsByCategory() {
    const categories: { [category: string]: FormRegistration[] } = {};
    
    for (const registration of this.registeredForms.values()) {
      if (!categories[registration.category]) {
        categories[registration.category] = [];
      }
      categories[registration.category].push(registration);
    }

    return categories;
  }

  /**
   * Initialize auto-save service with default form registrations
   */
  initialize() {
    // Register default forms
    this.registerForm({
      formId: 'training-config',
      displayName: 'Training Configuration',
      category: 'training',
      description: 'Main LoRA training configuration form'
    });

    this.registerForm({
      formId: 'app-settings',
      displayName: 'Application Settings',
      category: 'settings',
      description: 'General application settings and preferences'
    });

    this.registerForm({
      formId: 'model-settings',
      displayName: 'Model Settings',
      category: 'training',
      description: 'Model and network configuration'
    });

    this.registerForm({
      formId: 'dataset-manager',
      displayName: 'Dataset Manager',
      category: 'dataset',
      description: 'Dataset configuration and management'
    });

    console.log('[AutoSaveService] Initialized with', this.registeredForms.size, 'registered forms');
  }
}

// Export singleton instance
export const autoSaveService = new AutoSaveService();

// Initialize on import
autoSaveService.initialize();
