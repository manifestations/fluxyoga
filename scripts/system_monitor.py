import argparse
import json
import psutil
import time
import sys

try:
    import torch
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

try:
    import pynvml
    pynvml.nvmlInit()
    HAS_NVIDIA = True
except ImportError:
    HAS_NVIDIA = False

def get_gpu_info():
    """Get GPU information"""
    gpu_info = {
        'available': False,
        'count': 0,
        'devices': []
    }
    
    if HAS_TORCH and torch.cuda.is_available():
        gpu_info['available'] = True
        gpu_info['count'] = torch.cuda.device_count()
        
        for i in range(gpu_info['count']):
            device_info = {
                'id': i,
                'name': torch.cuda.get_device_name(i),
                'memory_total': torch.cuda.get_device_properties(i).total_memory // (1024**2),  # MB
                'memory_allocated': torch.cuda.memory_allocated(i) // (1024**2),  # MB
                'memory_reserved': torch.cuda.memory_reserved(i) // (1024**2),  # MB
            }
            
            # Add NVIDIA specific info if available
            if HAS_NVIDIA:
                try:
                    handle = pynvml.nvmlDeviceGetHandleByIndex(i)
                    
                    # GPU utilization
                    util = pynvml.nvmlDeviceGetUtilizationRates(handle)
                    device_info['gpu_utilization'] = util.gpu
                    device_info['memory_utilization'] = util.memory
                    
                    # Temperature
                    temp = pynvml.nvmlDeviceGetTemperature(handle, pynvml.NVML_TEMPERATURE_GPU)
                    device_info['temperature'] = temp
                    
                    # Memory info
                    mem_info = pynvml.nvmlDeviceGetMemoryInfo(handle)
                    device_info['memory_used'] = mem_info.used // (1024**2)  # MB
                    device_info['memory_free'] = mem_info.free // (1024**2)  # MB
                    device_info['memory_total_nvidia'] = mem_info.total // (1024**2)  # MB
                    
                except Exception as e:
                    device_info['nvidia_error'] = str(e)
            
            gpu_info['devices'].append(device_info)
    
    return gpu_info

def get_system_info():
    """Get system information"""
    # CPU info
    cpu_info = {
        'count': psutil.cpu_count(),
        'usage_percent': psutil.cpu_percent(interval=1),
        'frequency': psutil.cpu_freq()._asdict() if psutil.cpu_freq() else None,
    }
    
    # Memory info
    memory = psutil.virtual_memory()
    memory_info = {
        'total': memory.total // (1024**2),  # MB
        'available': memory.available // (1024**2),  # MB
        'used': memory.used // (1024**2),  # MB
        'percent': memory.percent,
    }
    
    # Disk info
    disk = psutil.disk_usage('/')
    disk_info = {
        'total': disk.total // (1024**3),  # GB
        'used': disk.used // (1024**3),  # GB
        'free': disk.free // (1024**3),  # GB
        'percent': (disk.used / disk.total) * 100,
    }
    
    return {
        'cpu': cpu_info,
        'memory': memory_info,
        'disk': disk_info,
    }

def monitor_system(duration=10, interval=1):
    """Monitor system for a duration"""
    monitoring_data = []
    
    for _ in range(duration):
        timestamp = time.time()
        system_info = get_system_info()
        gpu_info = get_gpu_info()
        
        data_point = {
            'timestamp': timestamp,
            'system': system_info,
            'gpu': gpu_info,
        }
        
        monitoring_data.append(data_point)
        time.sleep(interval)
    
    return monitoring_data

def get_optimal_settings():
    """Get optimal training settings based on system specs"""
    gpu_info = get_gpu_info()
    system_info = get_system_info()
    
    recommendations = {
        'batch_size': 1,
        'mixed_precision': 'bf16',
        'gradient_checkpointing': True,
        'use_8bit_optimizer': True,
        'max_memory_usage': 0.85,  # Use 85% of available memory
    }
    
    if gpu_info['available'] and len(gpu_info['devices']) > 0:
        primary_gpu = gpu_info['devices'][0]
        memory_gb = primary_gpu['memory_total'] / 1024
        
        # Adjust batch size based on memory
        if memory_gb >= 24:  # RTX 4090, A6000, etc.
            recommendations['batch_size'] = 4
            recommendations['mixed_precision'] = 'bf16'
        elif memory_gb >= 16:  # RTX 4080, RTX 3080 Ti, etc.
            recommendations['batch_size'] = 2
            recommendations['mixed_precision'] = 'bf16'
        elif memory_gb >= 12:  # RTX 4070 Ti, RTX 3080, etc.
            recommendations['batch_size'] = 2
            recommendations['mixed_precision'] = 'bf16'
        elif memory_gb >= 8:  # RTX 4060 Ti, RTX 3070, etc.
            recommendations['batch_size'] = 1
            recommendations['mixed_precision'] = 'fp16'
        else:  # Lower end cards
            recommendations['batch_size'] = 1
            recommendations['mixed_precision'] = 'fp16'
            recommendations['gradient_checkpointing'] = True
    
    return recommendations

def main():
    parser = argparse.ArgumentParser(description="System monitoring and optimization")
    parser.add_argument("--action", choices=['info', 'monitor', 'optimize'], 
                       default='info', help="Action to perform")
    parser.add_argument("--duration", type=int, default=10, 
                       help="Monitoring duration in seconds")
    parser.add_argument("--interval", type=int, default=1, 
                       help="Monitoring interval in seconds")
    
    args = parser.parse_args()
    
    try:
        if args.action == 'info':
            result = {
                'system': get_system_info(),
                'gpu': get_gpu_info(),
            }
        elif args.action == 'monitor':
            result = monitor_system(args.duration, args.interval)
        elif args.action == 'optimize':
            result = get_optimal_settings()
        
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        print(json.dumps({'error': str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
