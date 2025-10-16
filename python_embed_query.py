import sys, json, argparse, requests
from PIL import Image
from transformers import CLIPProcessor, CLIPModel
import torch
from io import BytesIO

model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

def get_embedding(image):
    inputs = processor(images=image, return_tensors="pt")
    with torch.no_grad():
        emb = model.get_image_features(**inputs)
    emb = emb / emb.norm(p=2, dim=-1, keepdim=True)
    return emb.squeeze().tolist()

parser = argparse.ArgumentParser()
parser.add_argument("--path", type=str)
parser.add_argument("--url", type=str)
args = parser.parse_args()

if args.path:
    image = Image.open(args.path).convert("RGB")
elif args.url:
    response = requests.get(args.url)
    image = Image.open(BytesIO(response.content)).convert("RGB")
else:
    print("[]")
    sys.exit(0)

embedding = get_embedding(image)
print(json.dumps(embedding))
