import argparse
import os
from PIL import Image, ImageEnhance
import torchvision.transforms as transforms
import numpy as np
from tqdm import tqdm

def process_image(image_path, config):
    """Process a single image according to the configuration"""
    try:
        img = Image.open(image_path)
        
        # Convert RGBA to RGB if necessary
        if img.mode == 'RGBA':
            img = img.convert('RGB')
            
        # Resize image
        if config['resize_enabled']:
            target_size = (config['target_width'], config['target_height'])
            
            if config['resize_mode'] == 'keep_ratio':
                # Calculate new size maintaining aspect ratio
                ratio = min(target_size[0] / img.size[0], target_size[1] / img.size[1])
                new_size = (int(img.size[0] * ratio), int(img.size[1] * ratio))
                img = img.resize(new_size, Image.Resampling.LANCZOS)
            elif config['resize_mode'] == 'fill':
                img = img.resize(target_size, Image.Resampling.LANCZOS)
            elif config['resize_mode'] == 'crop':
                # Resize and crop to target size
                ratio = max(target_size[0] / img.size[0], target_size[1] / img.size[1])
                new_size = (int(img.size[0] * ratio), int(img.size[1] * ratio))
                img = img.resize(new_size, Image.Resampling.LANCZOS)
                
                # Center crop
                left = (img.size[0] - target_size[0]) // 2
                top = (img.size[1] - target_size[1]) // 2
                img = img.crop((left, top, left + target_size[0], top + target_size[1]))
        
        # Apply color corrections
        if config['auto_contrast']:
            img = ImageEnhance.Contrast(img).enhance(1.5)
        
        if config['normalize']:
            # Convert to tensor for normalization
            transform = transforms.Compose([
                transforms.ToTensor(),
                transforms.Normalize(
                    mean=[0.485, 0.456, 0.406],
                    std=[0.229, 0.224, 0.225]
                )
            ])
            img_tensor = transform(img)
            # Convert back to PIL Image
            img = transforms.ToPILImage()(img_tensor)
        
        if config['sharpen']:
            # Apply sharpening
            enhancer = ImageEnhance.Sharpness(img)
            img = enhancer.enhance(1.5)
        
        return img
        
    except Exception as e:
        print(f"Error processing {image_path}: {str(e)}")
        return None

def main():
    parser = argparse.ArgumentParser(description="Preprocess images for machine learning")
    parser.add_argument("--input_dir", required=True, help="Input directory containing images")
    parser.add_argument("--output_dir", required=True, help="Output directory for processed images")
    parser.add_argument("--resize_mode", choices=['keep_ratio', 'fill', 'crop'], default='keep_ratio')
    parser.add_argument("--target_width", type=int, default=512)
    parser.add_argument("--target_height", type=int, default=512)
    parser.add_argument("--auto_contrast", action="store_true", help="Apply automatic contrast")
    parser.add_argument("--normalize", action="store_true", help="Normalize pixel values")
    parser.add_argument("--sharpen", action="store_true", help="Apply sharpening")
    
    args = parser.parse_args()
    
    # Create output directory if it doesn't exist
    os.makedirs(args.output_dir, exist_ok=True)
    
    config = {
        'resize_enabled': True,
        'resize_mode': args.resize_mode,
        'target_width': args.target_width,
        'target_height': args.target_height,
        'auto_contrast': args.auto_contrast,
        'normalize': args.normalize,
        'sharpen': args.sharpen
    }
    
    # Get list of image files
    image_files = [f for f in os.listdir(args.input_dir) 
                  if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))]
    
    # Process images with progress bar
    for filename in tqdm(image_files, desc="Processing images"):
        input_path = os.path.join(args.input_dir, filename)
        output_path = os.path.join(args.output_dir, filename)
        
        processed_img = process_image(input_path, config)
        if processed_img:
            processed_img.save(output_path, quality=95, optimize=True)

if __name__ == "__main__":
    main()
