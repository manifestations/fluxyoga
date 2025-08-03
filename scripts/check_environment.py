#!/usr/bin/env python3
def main():
    print("FluxY        print("✅ All required packages are installed!")
        print("FluxYoga should work correctly.")
    else: Python Environment Check")
    print("=" * 35)
Python Environment Check Script
Verifies that all required packages are installed for FluxYoga.
"""

import sys
import subprocess
import importlib.util

def check_package(package_name, import_name=None):
    """Check if a package is installed and importable."""
    if import_name is None:
        import_name = package_name
    
    try:
        spec = importlib.util.find_spec(import_name)
        if spec is not None:
            return True, "✓ Installed"
        else:
            return False, "✗ Not found"
    except Exception as e:
        return False, f"✗ Error: {e}"

def main():
    print("FluxyYoga Python Environment Check")
    print("=" * 40)
    
    # Required packages
    packages = [
        ('torch', 'torch'),
        ('torchvision', 'torchvision'),
        ('Pillow', 'PIL'),
        ('transformers', 'transformers'),
        ('requests', 'requests'),
        ('tqdm', 'tqdm'),
        ('numpy', 'numpy'),
        ('safetensors', 'safetensors'),
    ]
    
    all_installed = True
    
    for package_name, import_name in packages:
        installed, status = check_package(package_name, import_name)
        print(f"{package_name:15} {status}")
        if not installed:
            all_installed = False
    
    print("\n" + "=" * 40)
    
    if all_installed:
        print("✓ All required packages are installed!")
        print("FluxYoga should work correctly.")
    else:
        print("✗ Some packages are missing.")
        print("Run: pip install -r requirements.txt")
    
    # Check Python version
    print(f"\nPython version: {sys.version}")
    if sys.version_info < (3, 8):
        print("⚠ Warning: Python 3.8+ is recommended")
    
    return 0 if all_installed else 1

if __name__ == "__main__":
    sys.exit(main())
