import argparse
import sys
import torch
from PIL import Image
from transformers import BlipProcessor, BlipForConditionalGeneration

def load_model(model_type="base"):
    if model_type == "base":
        model_name = "Salesforce/blip-image-captioning-base"
    else:
        model_name = "Salesforce/blip-image-captioning-large"
    
    processor = BlipProcessor.from_pretrained(model_name)
    model = BlipForConditionalGeneration.from_pretrained(model_name)
    
    if torch.cuda.is_available():
        model = model.to("cuda")
    
    return processor, model

def generate_caption(
    image_path,
    processor,
    model,
    max_length=150,
    num_beams=5,
    min_length=5,
    top_p=0.9,
    repetition_penalty=1.5,
    style="detailed"
):
    # Load and preprocess the image
    image = Image.open(image_path)
    
    # Convert RGBA to RGB if necessary
    if image.mode == 'RGBA':
        image = image.convert('RGB')
    
    # Prepare conditional text based on style
    if style == "detailed":
        conditional_text = "a detailed description of"
    elif style == "simple":
        conditional_text = "a simple description of"
    elif style == "tags":
        conditional_text = "list the key elements in"
    elif style == "artistic":
        conditional_text = "describe the artistic elements in"
    else:
        conditional_text = "describe"

    # Preprocess the image
    inputs = processor(image, conditional_text, return_tensors="pt")
    
    if torch.cuda.is_available():
        inputs = {k: v.to("cuda") for k, v in inputs.items()}

    # Generate caption
    out = model.generate(
        **inputs,
        max_length=max_length,
        num_beams=num_beams,
        min_length=min_length,
        top_p=top_p,
        repetition_penalty=repetition_penalty,
    )

    # Decode and return the caption
    caption = processor.decode(out[0], skip_special_tokens=True)
    
    # Post-process based on style
    if style == "tags":
        # Convert prose to comma-separated tags
        words = caption.lower().replace(".", "").replace(",", "").split()
        unique_words = list(set(words))
        caption = ", ".join(unique_words)
    
    return caption

def main():
    parser = argparse.ArgumentParser(description="Generate image captions using BLIP")
    parser.add_argument("--image_path", required=True, help="Path to the image file")
    parser.add_argument("--model_type", default="base", choices=["base", "large"], help="BLIP model type")
    parser.add_argument("--max_tokens", type=int, default=150, help="Maximum length of caption")
    parser.add_argument("--style", default="detailed", choices=["detailed", "simple", "tags", "artistic"])
    
    args = parser.parse_args()
    
    try:
        processor, model = load_model(args.model_type)
        caption = generate_caption(
            args.image_path,
            processor,
            model,
            max_length=args.max_tokens,
            style=args.style
        )
        print(caption)
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
