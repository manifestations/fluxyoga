# Configuration Management System

FluxYoga now includes a comprehensive configuration management system that automatically saves and loads your settings when the application starts and closes.

## Features

### 🔧 Automatic Configuration Management
- **Auto-save**: Settings are automatically saved every 5 minutes (configurable)
- **Persistent Settings**: All your preferences are preserved between app sessions
- **Auto-load**: Configuration is automatically loaded when the app starts
- **Backup & Restore**: Export and import your complete configuration

### 📁 What Gets Saved

#### Training Settings
- Default learning rates, batch sizes, and epochs
- VRAM optimization presets and custom settings
- Mixed precision preferences
- Optimizer defaults
- Gradient checkpointing and caching preferences

#### User Interface
- Theme preferences (Light/Dark/Auto)
- Language settings
- Window state and size
- Last selected tab
- Interface layout preferences

#### Paths & Directories
- Default output directory
- Python executable path
- SD-Scripts directory path
- Model and dataset directories

#### Recent Items
- Recently used models, datasets, and outputs
- Project history
- Quick access to frequently used paths

#### Application Behavior
- Auto-save preferences
- Update check settings
- Exit confirmation
- Window state memory

### 🚀 How to Use

#### Automatic Operation
The configuration system works automatically:
1. **First Launch**: Creates default configuration
2. **Daily Use**: Auto-saves changes every 5 minutes
3. **App Restart**: Loads your saved preferences
4. **Tab Selection**: Remembers your last active tab

#### Manual Configuration
Access the **Settings** tab for full control:
- **Training Tab**: Configure VRAM presets and default training parameters
- **Interface Tab**: Customize theme, language, and UI preferences
- **Paths Tab**: Set default directories and executables
- **Recent Tab**: View and manage recent items history
- **Behavior Tab**: Control auto-save and application behavior

#### Import & Export
- **Export**: Save your complete configuration to a JSON file
- **Import**: Load configuration from a previously exported file
- **Reset**: Restore all settings to factory defaults

### 📝 Configuration File Location

Your configuration is stored in the Electron app's userData directory:
- **Windows**: `%APPDATA%/FluxYoga/`
- **macOS**: `~/Library/Application Support/FluxYoga/`
- **Linux**: `~/.config/FluxYoga/`

### 🔄 Migration & Updates

The configuration system includes automatic migration:
- Older settings are automatically upgraded
- New features get sensible defaults
- Your existing preferences are preserved

### 💡 Tips

1. **VRAM Presets**: Choose the preset matching your GPU's VRAM for optimal performance
2. **Auto Theme**: Set theme to "Auto" to follow your system's dark/light mode
3. **Recent Items**: Use the Recent tab to quickly access frequently used files
4. **Export Configs**: Backup your configuration before major changes
5. **Auto-save**: Disable auto-save if you prefer manual control

### 🔧 Advanced Settings

#### Custom VRAM Settings
Enable "Custom VRAM Settings" in the Training tab for fine-grained control:
- Gradient checkpointing
- Cache settings
- Memory optimization
- Data loader workers

#### Behavior Customization
In the Behavior tab:
- Adjust auto-save interval (1-60 minutes)
- Enable/disable update checks
- Control exit confirmation
- Window state persistence

### 🐛 Troubleshooting

#### Configuration Issues
- **Settings not saving**: Check if auto-save is enabled in Behavior settings
- **Reset needed**: Use the Reset button in Settings to restore defaults
- **Import failed**: Ensure the JSON file is a valid FluxYoga configuration export

#### Performance
- **Slow startup**: Large recent items history can slow loading (automatically limited to 10 items per category)
- **Memory usage**: Disable unused caching options in VRAM settings

### 🆕 What's New

This comprehensive configuration system replaces the previous simple settings:
- **Full persistence**: Everything is now saved automatically
- **Enhanced UI**: New tabbed settings interface
- **Recent items**: Track and access your frequently used files
- **Import/Export**: Share configurations between installations
- **Theme sync**: Automatic theme persistence and system integration

The configuration system ensures your FluxYoga experience is tailored to your workflow and preserved across sessions.
