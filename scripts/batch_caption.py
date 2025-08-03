#!/usr/bin/env python3
"""
Batch Caption Generation Script for FluxYoga
Generates captions for all images in a folder using various AI models.
"""

import argparse
import os
import json
import sys
import subprocess
from pathlib import Path
from typing import List, Dict, Any
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Supported image extensions
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp'}

def find_image_files(source_folder: str) -> List[Path]:
    """Find all image files in the source folder."""
    source_path = Path(source_folder)
    if not source_path.exists():
        raise ValueError(f"Source folder does not exist: {source_folder}")
    
    image_files = []
    for file_path in source_path.iterdir():
        if file_path.is_file() and file_path.suffix.lower() in IMAGE_EXTENSIONS:
            image_files.append(file_path)
    
    return sorted(image_files)

def caption_exists(image_path: Path) -> bool:
    """Check if a caption file already exists for the image."""
    caption_path = image_path.with_suffix('.txt')
    return caption_path.exists()

def save_caption(image_path: Path, caption: str, template: str | None = None) -> None:
    """Save caption to a text file alongside the image."""
    if template and '{caption}' in template:
        final_caption = template.replace('{caption}', caption)
    else:
        final_caption = caption
    
    caption_path = image_path.with_suffix('.txt')
    with open(caption_path, 'w', encoding='utf-8') as f:
        f.write(final_caption)

def generate_caption_for_image(image_path: Path, model: str, style: str = 'detailed', max_tokens: int = 150) -> str:
    """Generate caption for a single image using the specified model."""
    script_dir = Path(__file__).parent
    models_dir = script_dir.parent / 'models' / 'llm'
    image_str = str(image_path)
    
    try:
        if model in ['blip', 'blip2']:
            script_path = script_dir / 'generate_blip_caption.py'
            model_type = 'large' if model == 'blip2' else 'base'
            
            cmd = [
                sys.executable, str(script_path),
                '--image_path', image_str,
                '--model_type', model_type,
                '--max_tokens', str(max_tokens),
                '--style', style
            ]
            
        elif model == 'gpt-4-vision':
            script_path = script_dir / 'generate_gpt4v_caption.py'
            cmd = [
                sys.executable, str(script_path),
                '--image_path', image_str,
                '--style', style,
                '--max_tokens', str(max_tokens)
            ]
            
        elif model == 'vit-gpt2':
            script_path = script_dir / 'generate_ofa_caption.py'
            cmd = [
                sys.executable, str(script_path),
                '--image_path', image_str,
                '--max_length', str(max_tokens),
                '--style', style
            ]
            
        elif model == 'florence-2':
            script_path = script_dir / 'generate_florence2_caption.py'
            cmd = [
                sys.executable, str(script_path),
                '--image_path', image_str,
                '--model_id', 'microsoft/Florence-2-base',
                '--prompt', '<MORE_DETAILED_CAPTION>'
            ]
            
        else:
            raise ValueError(f"Unsupported model: {model}")
        
        # Run the caption generation script
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        
        if result.returncode == 0:
            # For Florence-2, parse JSON response
            if model == 'florence-2':
                try:
                    response = json.loads(result.stdout.strip())
                    return response.get('caption', 'No caption generated')
                except json.JSONDecodeError:
                    return result.stdout.strip()
            else:
                return result.stdout.strip()
        else:
            error_msg = result.stderr.strip() or "Unknown error"
            logger.error(f"Caption generation failed for {image_path}: {error_msg}")
            return f"Error: {error_msg}"
            
    except subprocess.TimeoutExpired:
        return "Error: Caption generation timed out"
    except Exception as e:
        logger.error(f"Error generating caption for {image_path}: {e}")
        return f"Error: {str(e)}"

def main():
    parser = argparse.ArgumentParser(description='Generate captions for images in batch')
    parser.add_argument('--source_folder', required=True, help='Folder containing images to caption')
    parser.add_argument('--model', default='florence-2', choices=['blip', 'blip2', 'gpt-4-vision', 'vit-gpt2', 'florence-2'], 
                       help='Caption model to use (default: florence-2)')
    parser.add_argument('--style', default='detailed', choices=['detailed', 'simple', 'tags', 'artistic'],
                       help='Caption style (for GPT-4V)')
    parser.add_argument('--template', help='Caption template with {caption} placeholder')
    parser.add_argument('--overwrite', action='store_true', help='Overwrite existing captions')
    parser.add_argument('--max_tokens', type=int, default=150, help='Maximum tokens for caption generation')
    
    args = parser.parse_args()
    
    try:
        # Find all image files
        image_files = find_image_files(args.source_folder)
        
        if not image_files:
            print(json.dumps({
                "type": "error",
                "message": f"No image files found in {args.source_folder}"
            }))
            return
        
        total_files = len(image_files)
        processed_files = []
        skipped_files = []
        failed_files = []
        
        print(json.dumps({
            "type": "progress",
            "message": f"Found {total_files} images to process"
        }))
        
        for i, image_path in enumerate(image_files):
            try:
                # Check if caption already exists
                if not args.overwrite and caption_exists(image_path):
                    skipped_files.append(str(image_path.name))
                    print(json.dumps({
                        "type": "progress",
                        "message": f"Skipped {image_path.name} (caption exists)"
                    }))
                    continue
                
                print(json.dumps({
                    "type": "progress",
                    "message": f"Processing {i+1}/{total_files}: {image_path.name}",
                    "current": i+1,
                    "total": total_files,
                    "filename": str(image_path.name)
                }))
                
                # Generate caption
                caption = generate_caption_for_image(
                    image_path, 
                    args.model, 
                    args.style, 
                    args.max_tokens
                )
                
                if caption and not caption.startswith("Error"):
                    # Save caption
                    save_caption(image_path, caption, args.template)
                    processed_files.append(str(image_path.name))
                    
                    print(json.dumps({
                        "type": "file_processed",
                        "filename": str(image_path.name),
                        "caption": caption[:100] + "..." if len(caption) > 100 else caption
                    }))
                else:
                    failed_files.append(str(image_path.name))
                    logger.error(f"Failed to generate caption for {image_path.name}")
                
            except Exception as e:
                failed_files.append(str(image_path.name))
                logger.error(f"Error processing {image_path.name}: {e}")
        
        # Final summary
        print(json.dumps({
            "type": "summary",
            "total_files": total_files,
            "processed": len(processed_files),
            "skipped": len(skipped_files),
            "failed": len(failed_files),
            "processed_files": processed_files
        }))
        
        print(json.dumps({
            "type": "progress",
            "message": f"Batch caption generation completed! Processed: {len(processed_files)}, Skipped: {len(skipped_files)}, Failed: {len(failed_files)}"
        }))
        
    except Exception as e:
        print(json.dumps({
            "type": "error",
            "message": f"Batch caption generation failed: {str(e)}"
        }))
        logger.error(f"Batch caption generation failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
