# FluxYoga - Advanced LoRA Training Interface

<div align="center">

![FluxYoga Logo](media/images/logo_dark.png)

**A modern, intelligent LoRA training interface for FLUX and SDXL models**

> **🚧 Alpha Release Notice**: This is an alpha version (v1.0.0-alpha) released for testing and community feedback. Some features may be incomplete or require manual setup. Please report issues and provide feedback!

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0--alpha-orange.svg)](https://github.com/manifestations/fluxyoga/releases)
[![Node.js](https://img.shields.io/badge/node-%3E%3D%2018.0.0-brightgreen.svg)](https://nodejs.org/)
[![Electron](https://img.shields.io/badge/electron-26.6.10-blue.svg)](https://www.electronjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.0.2-blue.svg)](https://www.typescriptlang.org/)

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [GPU Optimization](#-gpu-optimization) • [Contributing](#-contributing)

</div>

---

## 🌟 Features

### 🚀 Core Functionality
- **FLUX & SDXL Support**: Complete training pipeline for both FLUX.1 and SDXL models
- **Smart GPU Detection**: Automatic graphics card detection with VRAM optimization
- **Simplified Interface**: Clean, modern UI focused on essential training parameters
- **Real-time Monitoring**: Live training progress with loss tracking and sample generation
- **Intelligent Defaults**: Auto-configured settings based on your hardware capabilities

### 🧠 Smart GPU Optimization
- **Automatic VRAM Detection**: Supports 50+ GPU models (RTX 40/30/20, RX 7000/6000, Intel)
- **Dynamic Parameter Adjustment**: Batch size, mixed precision, and memory optimizations
- **Low VRAM Support**: Gradient checkpointing, CPU offloading for 4GB+ cards
- **Performance Profiles**: High/Medium/Low VRAM configurations with optimal settings

### 🎨 User Experience
- **Dark/Light Themes**: Elegant theming with automatic logo adaptation
- **File Pickers**: Integrated file selection for models, datasets, and outputs
- **Validation**: Real-time configuration validation with helpful error messages
- **Progress Tracking**: Visual progress monitoring with ETA and sample previews

### ⚙️ Technical Features
- **Electron + React**: Cross-platform desktop application
- **TypeScript**: Full type safety and modern development experience
- **Material-UI**: Professional, accessible interface components
- **Kohya Integration**: Built on proven sd-scripts training framework

---

## 📋 Prerequisites

### System Requirements
- **Node.js** 18.0.0 or higher
- **Python** 3.10+ (3.10.6 recommended)
- **Graphics Card** with 4GB+ VRAM (8GB+ recommended)
- **Operating System**: Windows 10/11, macOS 10.14+, or Linux
- **Git** for cloning the required sd-scripts repository
- **Disk Space**: 10GB+ free space for models and outputs

### GPU Requirements by Platform

#### ✅ NVIDIA GPUs (Recommended - Best Support)
**Windows/Linux/macOS** - CUDA 11.8+ or 12.1+
- **Minimum**: GTX 1060 6GB, RTX 2060 (6GB VRAM)
- **Recommended**: RTX 3070, RTX 4070 (8-12GB VRAM)
- **Optimal**: RTX 3080, RTX 4080, RTX 4090 (16GB+ VRAM)

#### ⚠️ AMD GPUs (Linux Only - Experimental)
**Linux with ROCm 6.3+** - Limited compatibility
- **Supported**: RX 6700 XT, RX 7800 XT, RX 7900 XTX (8GB+ VRAM)
- **Note**: Performance may be 10-20% slower than equivalent NVIDIA
- **Limitation**: Windows support not available due to ROCm restrictions

#### 🧪 Intel GPUs (Experimental - Limited Support)  
**Windows/Linux** - Intel Extension for PyTorch required
- **Supported**: Arc A750, Arc A770 (8GB+ VRAM)
- **Note**: Performance may be 30-50% slower than equivalent NVIDIA
- **Limitation**: Training stability may vary across different models

### Memory Requirements
- **4-6GB VRAM**: Basic LoRA training with reduced settings
- **8-12GB VRAM**: Standard LoRA training with good performance
- **16GB+ VRAM**: Optimal settings with fastest training speeds
- **System RAM**: 16GB+ recommended for large datasets

---

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/manifestations/fluxyoga.git
cd fluxyoga
```

### 2. Install Dependencies
```bash
# Install Node.js dependencies
npm install

# Clone Kohya's sd-scripts (required for training)
git clone https://github.com/kohya-ss/sd-scripts.git

# Set up Python environment (recommended)
python -m venv .venv
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # macOS/Linux

# Install PyTorch (choose your platform)
# For NVIDIA GPUs (CUDA)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

# For AMD GPUs (Linux only - ROCm)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/rocm6.3

# For Intel GPUs (Windows/Linux - XPU)
pip install --pre torch torchvision torchaudio --index-url https://download.pytorch.org/whl/nightly/xpu

# Install Python dependencies for sd-scripts
cd sd-scripts
pip install -r requirements.txt
cd ..
```

### 3. Build the Application
```bash
# Development build
npm run dev

# Production build
npm run build

# Package as Electron app
npm run electron
```

---

## ⚠️ Alpha Release Limitations

### Known Issues
- **Manual sd-scripts Setup**: Users must manually clone and configure sd-scripts
- **Limited Error Handling**: Training failures may not provide detailed feedback
- **GPU Detection**: May not work correctly on all hardware configurations
- **Model Support**: Currently supports safetensors format only
- **Training Resume**: No ability to resume interrupted training sessions

### Required Manual Setup
1. **Clone sd-scripts**:
   ```bash
   git clone https://github.com/kohya-ss/sd-scripts.git
   cd sd-scripts
   pip install -r requirements.txt
   ```

2. **Configure Python Environment**: Ensure PyTorch with CUDA support is installed

3. **Model Files**: Download FLUX/SDXL base models and place in accessible directories

### Feedback Welcome
This alpha release is for testing and community feedback. Please report:
- GPU detection issues
- Training failures or errors  
- UI/UX improvement suggestions
- Feature requests for v1.0.0

---

## 🎯 Usage

### Quick Start

1. **Launch the Application**
   ```bash
   npm run electron
   ```

2. **GPU Detection**
   - The app automatically detects your graphics card on startup
   - Optimal settings are applied based on your VRAM capacity
   - View detection results in the GPU info card

3. **Configure Training**
   - Select your model type (FLUX or SDXL)
   - Choose base model and dataset paths
   - Adjust parameters or use auto-optimized defaults
   - Set output directory and model name

4. **Start Training**
   - Click "Start Training" to begin
   - Monitor progress in real-time
   - View generated samples and training logs

### Training Configuration

#### FLUX Training
```
Base Model: path/to/flux-model.safetensors
CLIP-L: path/to/clip_l.safetensors
T5-XXL: path/to/t5xxl.safetensors
Dataset: path/to/your/dataset/
```

#### SDXL Training
```
Base Model: path/to/sdxl-model.safetensors
Dataset: path/to/your/dataset/
```

### Dataset Structure
```
dataset/
├── image1.jpg
├── image1.txt
├── image2.png
├── image2.txt
└── ...
```

---

## 🎮 GPU Optimization

FluxYoga intelligently optimizes training parameters based on your graphics card:

### High VRAM (16GB+)
- **Batch Size**: 4
- **Mixed Precision**: BF16 (NVIDIA) / FP16 (AMD)
- **Gradient Checkpointing**: Disabled
- **Max Resolution**: 1024px
- **Performance**: Optimal speed and quality

### Medium VRAM (8-15GB)
- **Batch Size**: 2
- **Mixed Precision**: BF16/FP16
- **Gradient Checkpointing**: Enabled
- **Gradient Accumulation**: 2 steps
- **Max Resolution**: 768px
- **Performance**: Balanced speed and memory usage

### Low VRAM (4-7GB)
- **Batch Size**: 1
- **Low VRAM Mode**: Enabled
- **CPU Offloading**: Enabled
- **Gradient Accumulation**: 4 steps
- **Max Resolution**: 512px
- **Performance**: Memory-optimized for stability

### GPU Platform Support

#### NVIDIA GPUs (Windows/Linux/macOS)
- **RTX 40 Series**: RTX 4090, 4080, 4070 Ti, 4070, 4060 Ti, 4060
- **RTX 30 Series**: RTX 3090, 3080, 3070, 3060 Ti, 3060
- **RTX 20 Series**: RTX 2080 Ti, 2080, 2070, 2060
- **GTX 16/10 Series**: GTX 1660 Ti, 1060, 1050 Ti (limited support)
- **Professional**: Quadro, Tesla, A100, H100

**Installation**:
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

#### AMD GPUs (Linux Only)
- **RX 7000 Series**: RX 7900 XTX, 7900 XT, 7800 XT, 7700 XT, 7600
- **RX 6000 Series**: RX 6950 XT, 6900 XT, 6800 XT, 6700 XT, 6600 XT, 6500 XT
- **RX 5000 Series**: RX 5700 XT, 5600 XT, 5500 XT
- **Professional**: Radeon Pro, Instinct MI series

**Installation (Stable ROCm 6.3)**:
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/rocm6.3
```

**Installation (Nightly ROCm 6.4 - Better Performance)**:
```bash
pip install --pre torch torchvision torchaudio --index-url https://download.pytorch.org/whl/nightly/rocm6.4
```

#### Intel GPUs (Windows/Linux)
- **Arc A-Series**: A770, A750, A580, A380
- **Integrated Graphics**: Iris Xe, UHD Graphics (limited support)

**Option 1: Native XPU Support (Recommended)**:
```bash
pip install --pre torch torchvision torchaudio --index-url https://download.pytorch.org/whl/nightly/xpu
```

**Option 2: Intel Extension for PyTorch (IPEX)**:
```bash
# Create conda environment first
conda install libuv
pip install torch==2.3.1.post0+cxx11.abi torchvision==0.18.1.post0+cxx11.abi torchaudio==2.3.1.post0+cxx11.abi intel-extension-for-pytorch==2.3.110.post0+xpu --extra-index-url https://pytorch-extension.intel.com/release-whl/stable/xpu/us/ --extra-index-url https://pytorch-extension.intel.com/release-whl/stable/xpu/cn/
```

### Performance Expectations
- **High-end NVIDIA (RTX 4090, 3090)**: 2-4 hours for typical LoRA
- **Mid-range NVIDIA (RTX 4070, 3070)**: 4-8 hours for typical LoRA  
- **Budget NVIDIA (RTX 4060, 3060)**: 6-12 hours for typical LoRA
- **AMD RX 7000/6000**: 10-20% slower than equivalent NVIDIA
- **Intel Arc**: 30-50% slower than equivalent NVIDIA (experimental)

---

## 🏗️ Architecture

### Frontend (Electron + React)
```
src/
├── components/
│   ├── training/          # Training forms and monitoring
│   ├── settings/          # Configuration management
│   ├── gpu/              # GPU detection and optimization
│   └── common/           # Reusable UI components
├── services/
│   ├── GPUDetection.ts   # Smart GPU detection
│   ├── TrainingExecutor.ts # Training process management
│   └── TrainingCommandBuilder.ts # Command generation
├── types/                # TypeScript definitions
└── styles/              # Theme and styling
```

### Backend Integration
- **sd-scripts**: Kohya's training framework (clone separately from [kohya-ss/sd-scripts](https://github.com/kohya-ss/sd-scripts))
- **Python Scripts**: Custom preprocessing and monitoring
- **IPC Communication**: Electron main/renderer process bridge

---

## ⚙️ Configuration

### Application Settings
- **Training Defaults**: Default parameters for new sessions
- **Paths**: Output directories and Python executable
- **GPU Preferences**: Override automatic optimization

### Environment Variables
```bash
# Optional: Custom Python path
PYTHON_PATH=/path/to/python

# Optional: Custom sd-scripts path
SD_SCRIPTS_PATH=/path/to/sd-scripts
```

---

## 🔧 Development

### Project Structure
```
fluxyoga/
├── src/                  # React/TypeScript source
├── scripts/             # Python training scripts
├── media/               # Assets and images
├── dist/                # Built application
└── package.json         # Dependencies and scripts

# Required external dependency (clone separately):
sd-scripts/              # Kohya's training framework
```

### Available Scripts
```bash
npm run dev          # Development server
npm run build        # Production build
npm run electron     # Run Electron app
npm run lint         # Code linting
npm run type-check   # TypeScript validation
```

### Tech Stack
- **Frontend**: React 18, TypeScript, Material-UI
- **Desktop**: Electron 26
- **Build**: Vite, ESBuild
- **Training**: Python, PyTorch, sd-scripts

---

## 🐛 Troubleshooting

### Common Issues

#### GPU Not Detected
```bash
# Check WebGL support
# Open browser console and run:
navigator.gpu !== undefined
```

#### Training Fails to Start
- Verify Python environment is properly configured
- Check that sd-scripts is cloned and dependencies are installed
- Ensure CUDA is available for PyTorch
- Verify sd-scripts path in Settings matches your installation

#### Out of Memory Errors
- Enable low VRAM mode in settings
- Reduce batch size manually
- Try CPU offloading option

#### Model Loading Issues
- Verify model file paths are correct
- Check file permissions
- Ensure sufficient disk space

### Log Files
- **Application Logs**: `%APPDATA%/fluxyoga/logs/`
- **Training Logs**: Output directory specified in settings
- **Electron Logs**: Developer console (F12)

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Style
- Use TypeScript for type safety
- Follow Material-UI design patterns
- Add JSDoc comments for public APIs
- Maintain existing code formatting

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **[Kohya](https://github.com/kohya-ss)** for the excellent sd-scripts training framework
- **Stability AI** for SDXL and training methodologies
- **Black Forest Labs** for FLUX.1 model architecture
- **Material-UI Team** for the beautiful component library
- **Electron Team** for the cross-platform framework

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/manifestations/fluxyoga/issues)
- **Discussions**: [GitHub Discussions](https://github.com/manifestations/fluxyoga/discussions)
- **Documentation**: [Wiki](https://github.com/manifestations/fluxyoga/wiki)

---

<div align="center">

**Made with ❤️ for the AI art community**

[⭐ Star this repo](https://github.com/manifestations/fluxyoga/stargazers) • [🐛 Report bug](https://github.com/manifestations/fluxyoga/issues) • [💡 Request feature](https://github.com/manifestations/fluxyoga/issues)

</div>
