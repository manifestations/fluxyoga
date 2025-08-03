#!/usr/bin/env python3
"""
Test script to verify all caption generation models work
Tests on a single image from the sample folder
"""

import os
import sys
import subprocess
from pathlib import Path

# Test configuration
TEST_IMAGE = r"C:\Users\rosha\Work\apps\catnip\fluxyoga\sample\reanita\simin_01.png"
SCRIPT_DIR = Path(__file__).parent
PYTHON_EXE = r"C:/Users/rosha/Work/apps/catnip/fluxyoga/.venv/Scripts/python.exe"

# Models to test
MODELS = {
    'blip': {
        'script': 'generate_blip_caption.py',
        'args': ['--image_path', TEST_IMAGE, '--model_type', 'base', '--style', 'detailed']
    },
    'blip2': {
        'script': 'generate_blip_caption.py', 
        'args': ['--image_path', TEST_IMAGE, '--model_type', 'large', '--style', 'detailed']
    },
    'vit-gpt2': {
        'script': 'generate_ofa_caption.py',
        'args': ['--image_path', TEST_IMAGE, '--style', 'detailed']
    }
}

def test_model(model_name, config):
    """Test a single caption generation model"""
    print(f"\n🧪 Testing {model_name}...")
    print("-" * 50)
    
    script_path = SCRIPT_DIR / config['script']
    cmd = [PYTHON_EXE, str(script_path)] + config['args']
    
    try:
        # Run the caption generation script
        result = subprocess.run(
            cmd, 
            capture_output=True, 
            text=True, 
            timeout=120,  # 2 minute timeout
            cwd=str(SCRIPT_DIR.parent)
        )
        
        if result.returncode == 0:
            caption = result.stdout.strip()
            print(f"✅ {model_name} SUCCESS")
            print(f"📝 Caption: {caption}")
            return True, caption
        else:
            error = result.stderr.strip() or "Unknown error"
            print(f"❌ {model_name} FAILED")
            print(f"🚨 Error: {error}")
            return False, error
            
    except subprocess.TimeoutExpired:
        print(f"⏰ {model_name} TIMEOUT (>2 minutes)")
        return False, "Timeout"
    except Exception as e:
        print(f"💥 {model_name} EXCEPTION: {e}")
        return False, str(e)

def main():
    print("🚀 FluxYoga Caption Generation Model Test")
    print("=" * 60)
    print(f"📁 Test image: {TEST_IMAGE}")
    print(f"🐍 Python: {PYTHON_EXE}")
    print(f"📂 Script dir: {SCRIPT_DIR}")
    
    # Check if test image exists
    if not os.path.exists(TEST_IMAGE):
        print(f"❌ Test image not found: {TEST_IMAGE}")
        return
    
    results = {}
    success_count = 0
    
    # Test each model
    for model_name, config in MODELS.items():
        success, output = test_model(model_name, config)
        results[model_name] = {'success': success, 'output': output}
        if success:
            success_count += 1
    
    # Summary
    print("\n📊 SUMMARY")
    print("=" * 60)
    total_models = len(MODELS)
    print(f"✅ Successful: {success_count}/{total_models}")
    print(f"❌ Failed: {total_models - success_count}/{total_models}")
    
    print("\n📋 DETAILED RESULTS:")
    for model_name, result in results.items():
        status = "✅ PASS" if result['success'] else "❌ FAIL"
        print(f"  {model_name:12} {status}")
        if not result['success']:
            print(f"               Error: {result['output']}")
    
    if success_count == total_models:
        print("\n🎉 ALL MODELS WORKING! Caption generation is ready to use.")
    else:
        print(f"\n⚠️  {total_models - success_count} model(s) need attention.")

if __name__ == "__main__":
    main()
