import argparse
import base64
import os
import sys
import requests
from PIL import Image
import io

def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def generate_prompt(style, focus_areas=None):
    base_prompt = {
        "detailed": "Provide a detailed description of this image that could be used for training an AI model. Include important visual elements, composition, lighting, and atmosphere.",
        "simple": "Describe this image in a simple, clear way that captures its main elements.",
        "tags": "List the key elements, objects, styles, and attributes in this image as comma-separated tags.",
        "artistic": "Describe this image in an artistic way, focusing on its aesthetic qualities, mood, and artistic elements."
    }
    
    prompt = base_prompt.get(style, base_prompt["detailed"])
    
    if focus_areas:
        prompt += f" Pay particular attention to these aspects: {', '.join(focus_areas)}."
    
    return prompt

def generate_caption(image_path, temperature=0.7, max_tokens=150, style="detailed", focus_areas=None):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable is not set")

    # Resize image if needed
    with Image.open(image_path) as img:
        # GPT-4V has a maximum dimension requirement
        max_dim = 2048
        if max(img.size) > max_dim:
            ratio = max_dim / max(img.size)
            new_size = tuple(int(dim * ratio) for dim in img.size)
            img = img.resize(new_size, Image.Resampling.LANCZOS)
            
            # Save to bytes
            img_byte_arr = io.BytesIO()
            img.save(img_byte_arr, format=img.format or 'JPEG')
            img_byte_arr = img_byte_arr.getvalue()
            base64_image = base64.b64encode(img_byte_arr).decode('utf-8')
        else:
            base64_image = encode_image(image_path)

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }

    prompt = generate_prompt(style, focus_areas)

    payload = {
        "model": "gpt-4-vision-preview",
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": prompt
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        }
                    }
                ]
            }
        ],
        "max_tokens": max_tokens,
        "temperature": temperature
    }

    response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
    if response.status_code != 200:
        raise Exception(f"Error generating caption: {response.text}")

    return response.json()['choices'][0]['message']['content'].strip()

def main():
    parser = argparse.ArgumentParser(description="Generate image captions using GPT-4-Vision")
    parser.add_argument("--image_path", required=True, help="Path to the image file")
    parser.add_argument("--temperature", type=float, default=0.7, help="Temperature for generation")
    parser.add_argument("--max_tokens", type=int, default=150, help="Maximum tokens in response")
    parser.add_argument("--style", default="detailed", choices=["detailed", "simple", "tags", "artistic"])
    parser.add_argument("--focus", nargs="*", help="Areas to focus on in the description")
    
    args = parser.parse_args()
    
    try:
        caption = generate_caption(
            args.image_path,
            temperature=args.temperature,
            max_tokens=args.max_tokens,
            style=args.style,
            focus_areas=args.focus
        )
        print(caption)
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
