import argparse
import sys
import torch
from PIL import Image
from transformers import VisionEncoderDecoderModel, GPT2TokenizerFast
from torchvision import transforms

def load_model():
    """Load the VIT-GPT2 model and tokenizer"""
    try:
        model = VisionEncoderDecoderModel.from_pretrained("nlpconnect/vit-gpt2-image-captioning")
        tokenizer = GPT2TokenizerFast.from_pretrained("nlpconnect/vit-gpt2-image-captioning")
        
        # Move to GPU if available
        if torch.cuda.is_available():
            model = model.cuda()
        
        return tokenizer, model
    except Exception as e:
        print(f"Error loading model: {e}", file=sys.stderr)
        sys.exit(1)

def preprocess_image(image_path):
    """Preprocess the image for VIT-GPT2 model"""
    try:
        # Standard ImageNet normalization for ViT
        mean = [0.485, 0.456, 0.406]
        std = [0.229, 0.224, 0.225]
        size = 224  # Standard ViT input size
        
        # Load and preprocess image
        image = Image.open(image_path).convert('RGB')
        
        transform = transforms.Compose([
            transforms.Resize((size, size)),
            transforms.ToTensor(),
            transforms.Normalize(mean=mean, std=std)
        ])
        
        # Apply transform and add batch dimension
        pixel_values = transform(image).unsqueeze(0)
        
        # Move to GPU if available
        if torch.cuda.is_available():
            pixel_values = pixel_values.cuda()
        
        return pixel_values
    
    except Exception as e:
        print(f"Error preprocessing image: {e}", file=sys.stderr)
        sys.exit(1)

def generate_caption(image_path, tokenizer, model, max_length=50, style="detailed"):
    """Generate a caption for the image using VIT-GPT2 model"""
    try:
        # Preprocess the image
        pixel_values = preprocess_image(image_path)
        
        # Generate caption
        with torch.no_grad():
            generated_ids = model.generate(
                pixel_values,
                max_length=max_length,
                num_beams=4,
                early_stopping=True,
                no_repeat_ngram_size=2,
                length_penalty=1.0
            )
        
        # Decode the generated caption
        caption = tokenizer.decode(generated_ids[0], skip_special_tokens=True)
        
        # Post-process based on style
        if style == "tags":
            # Convert to comma-separated tags
            words = caption.lower().replace(".", "").replace(",", "").split()
            # Remove common stop words
            stop_words = {"a", "an", "the", "is", "are", "with", "and", "or", "of", "in", "on", "at", "this", "that"}
            tags = [word for word in words if word not in stop_words and len(word) > 2]
            caption = ", ".join(tags[:8])  # Limit to 8 tags
        elif style == "simple":
            # Keep original (VIT-GPT2 already generates simple captions)
            pass
        elif style == "artistic":
            # Add artistic touch
            if not caption.endswith("."):
                caption += "."
            caption = f"An enchanting view of {caption.lower()}"
        
        return caption.strip()
    
    except Exception as e:
        print(f"Error generating caption: {e}", file=sys.stderr)
        return f"Error: {str(e)}"

def main():
    parser = argparse.ArgumentParser(description="Generate image captions using VIT-GPT2 model")
    parser.add_argument("--image_path", required=True, help="Path to the image file")
    parser.add_argument("--style", default="detailed", 
                       choices=["detailed", "simple", "tags", "artistic"])
    parser.add_argument("--max_length", type=int, default=50,
                       help="Maximum length of generated caption")
    
    args = parser.parse_args()
    
    try:
        # Load model and tokenizer
        tokenizer, model = load_model()
        
        # Generate caption
        caption = generate_caption(
            args.image_path,
            tokenizer,
            model,
            max_length=args.max_length,
            style=args.style
        )
        
        # Output the caption
        print(caption)
        
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
