"""
Florence-2 Image Captioning Script
Generates detailed captions using Florence-2-base-PromptGen-v2.0 model
"""

import argparse
import json
import sys
from pathlib import Path
from PIL import Image
import torch
from transformers import AutoProcessor, AutoModelForCausalLM
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def load_florence_model(model_source):
    """Load Florence-2 model and processor from local path or Hugging Face Hub"""
    try:
        logger.info(f"Loading Florence-2 model from {model_source}")
        
        # Load processor and model
        processor = AutoProcessor.from_pretrained(model_source, trust_remote_code=True)
        model = AutoModelForCausalLM.from_pretrained(
            model_source, 
            trust_remote_code=True,
            torch_dtype=torch.float32,  # Use float32 to avoid type mismatch
            attn_implementation="eager"  # Use eager attention to avoid SDPA issues
        )
        
        # Move to GPU if available
        device = "cuda" if torch.cuda.is_available() else "cpu"
        model = model.to(device)
        
        logger.info(f"Model loaded successfully on {device}")
        return processor, model, device
        
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        return None, None, None

def generate_caption(image_path, processor, model, device, prompt="<MORE_DETAILED_CAPTION>"):
    """Generate caption for a single image using Florence-2"""
    try:
        # Load and process image
        image = Image.open(image_path).convert('RGB')
        
        # Prepare inputs for Florence-2
        inputs = processor(text=prompt, images=image, return_tensors="pt")
        inputs = {k: v.to(device) for k, v in inputs.items()}
        
        # Generate caption
        with torch.no_grad():
            generated_ids = model.generate(
                input_ids=inputs["input_ids"],
                pixel_values=inputs["pixel_values"],
                max_new_tokens=1024,
                early_stopping=False,
                do_sample=False,
                num_beams=3,
                pad_token_id=processor.tokenizer.pad_token_id,
                use_cache=False  # Disable cache during generation
            )
        
        # Decode the generated caption
        generated_text = processor.batch_decode(generated_ids, skip_special_tokens=False)[0]
        
        # Parse the response using processor's post-processing
        try:
            parsed_answer = processor.post_process_generation(
                generated_text, 
                task=prompt, 
                image_size=(image.width, image.height)
            )
            
            # Extract caption from parsed answer
            if prompt in parsed_answer:
                caption = parsed_answer[prompt]
            else:
                # Fallback: try to extract from raw text
                caption = generated_text.split(prompt)[-1].strip()
        except Exception as parse_error:
            logger.warning(f"Post-processing failed: {parse_error}, using raw text")
            # Simple extraction from generated text
            if prompt in generated_text:
                caption = generated_text.split(prompt)[-1].strip()
            else:
                caption = generated_text.strip()
        
        return caption
        
    except Exception as e:
        logger.error(f"Error generating caption for {image_path}: {e}")
        return f"Error: {str(e)}"

def process_single_image(image_path, model_source, prompt="<MORE_DETAILED_CAPTION>"):
    """Process a single image and return caption"""
    
    # Load model
    processor, model, device = load_florence_model(model_source)
    if processor is None:
        return f"Error: Failed to load model from {model_source}"
    
    # Generate caption
    caption = generate_caption(image_path, processor, model, device, prompt)
    
    # Clean up model from memory
    del model
    del processor
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    
    return caption

def main():
    parser = argparse.ArgumentParser(description='Generate captions using Florence-2')
    parser.add_argument('--image_path', required=True, help='Path to the image file')
    parser.add_argument('--model_path', default=None, help='Path to local Florence-2 model directory (optional)')
    parser.add_argument('--model_id', default='microsoft/Florence-2-base', help='Hugging Face model ID for Florence-2')
    parser.add_argument('--prompt', default='<MORE_DETAILED_CAPTION>', 
                       help='Florence-2 prompt (default: <MORE_DETAILED_CAPTION>)')
    
    args = parser.parse_args()
    
    # Validate inputs
    image_path = Path(args.image_path)
    model_source = args.model_path if args.model_path else args.model_id
    
    if not image_path.exists():
        print(f"Error: Image file not found: {image_path}")
        sys.exit(1)
        
    if args.model_path and not Path(args.model_path).exists():
        print(f"Error: Model path not found: {args.model_path}")
        sys.exit(1)
    
    # Generate caption
    caption = process_single_image(str(image_path), model_source, args.prompt)
    
    # Output result as JSON for easy parsing
    result = {
        "image_path": str(image_path),
        "caption": caption,
        "model": model_source,
        "prompt": args.prompt
    }
    
    print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
