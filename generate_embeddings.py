# generate_embeddings.py
from PIL import Image
from transformers import CLIPProcessor, CLIPModel
import torch, json, os

model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

def get_embedding(image_path):
    image = Image.open(image_path).convert("RGB")
    inputs = processor(images=image, return_tensors="pt")
    with torch.no_grad():
        emb = model.get_image_features(**inputs)
    emb = emb / emb.norm(p=2, dim=-1, keepdim=True)  # normalize
    return emb.squeeze().tolist()

base_dir = "public/images"
output = []
for fname in os.listdir(base_dir):
    if fname.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
        path = os.path.join(base_dir, fname)
        emb = get_embedding(path)
        output.append({"image": f"/images/{fname}", "embedding": emb})
        print(f"Processed {fname}")

with open("data/embeddings.json", "w") as f:
    json.dump(output, f)
print("✅ embeddings.json saved!")
