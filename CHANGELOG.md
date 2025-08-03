# Changelog

All notable changes to FluxYoga will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0-alpha] - 2025-08-03

### Added
- Initial alpha release of FluxYoga
- Smart GPU detection and VRAM optimization
- FLUX and SDXL LoRA training support
- Modern Electron + React + TypeScript interface
- Real-time training progress monitoring
- Automatic parameter optimization based on hardware
- Dark/Light theme support with adaptive logos
- Comprehensive settings management
- File picker integration for easy model/dataset selection

### Features
- **GPU Detection**: Automatic detection of 50+ GPU models (NVIDIA RTX 40/30/20 series, AMD RX 7000/6000 series, Intel integrated graphics)
- **VRAM Optimization**: Dynamic parameter adjustment based on available VRAM (4GB to 24GB+ support)
- **Training Pipeline**: Complete LoRA training workflow for FLUX.1 and SDXL models
- **Progress Monitoring**: Real-time loss tracking, sample generation, and ETA calculation
- **Smart Defaults**: Intelligent configuration based on hardware capabilities
- **Cross-Platform**: Windows, macOS, and Linux support

### Technical
- Electron 26.6.10 with React 18 and TypeScript 5.0.2
- Material-UI component library with custom theming
- Integration with Kohya's sd-scripts training framework
- Vite build system for fast development and optimized production builds
- Comprehensive error handling and validation

### Known Limitations (Alpha)
- Training execution requires manual sd-scripts setup
- Limited model format support (safetensors only)
- Basic error handling for training failures
- GPU detection may not work on all systems
- No training resume functionality yet

### Alpha Notes
- This is an alpha release for testing and feedback
- Users must manually clone and setup sd-scripts from https://github.com/kohya-ss/sd-scripts
- Some features may be incomplete or unstable
- Please report issues on GitHub

---

## Release Types

### 🎉 Major Releases
- Breaking changes requiring migration
- Major new features or redesigns
- Significant architecture changes

### ✨ Minor Releases  
- New features and enhancements
- Backward-compatible changes
- New GPU support additions

### 🐛 Patch Releases
- Bug fixes and security updates
- Performance improvements
- Documentation updates

---

## Upcoming Features

### Planned for v1.1.0
- [ ] Additional model format support (Diffusers, ONNX)
- [ ] Batch training for multiple datasets
- [ ] Advanced sample generation options
- [ ] Training resume functionality
- [ ] Custom optimizer configurations

### Planned for v1.2.0
- [ ] Training comparison and analysis tools
- [ ] Cloud training integration
- [ ] Advanced preprocessing options
- [ ] Training templates and presets
- [ ] Model merging capabilities

### Long-term Roadmap
- [ ] ControlNet training support
- [ ] Multi-GPU training
- [ ] Professional training analytics
- [ ] Community model sharing
- [ ] Plugin system for extensions
