import os, json, re

base_dir = "public/images"
output_file = "data/products.json"

def clean_name(filename):
    name = os.path.splitext(filename)[0]
    name = re.sub(r'[_\-]+', ' ', name).title()
    return name.strip()

data = []
for idx, fname in enumerate(sorted(os.listdir(base_dir)), 1):
    if fname.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
        name = clean_name(fname)
        lower = name.lower()
        if any(w in lower for w in ["shoe", "sneaker", "boot"]):
            cat = "Footwear"
        elif any(w in lower for w in ["shirt", "tshirt", "hoodie", "top"]):
            cat = "Clothing"
        elif any(w in lower for w in ["bag", "purse", "backpack"]):
            cat = "Accessories"
        elif any(w in lower for w in ["watch", "necklace", "jewel"]):
            cat = "Jewelry"
        else:
            cat = "General"

        data.append({
            "id": idx,
            "name": name,
            "category": cat,
            "image": f"/images/{fname}"
        })

with open(output_file, "w") as f:
    json.dump(data, f, indent=2)

print(f"✅ Rebuilt {len(data)} products in {output_file}")
