import json
p = json.load(open("data/products.json"))
e = json.load(open("data/embeddings.json"))
print("Products:", len(p), "Embeddings:", len(e))
