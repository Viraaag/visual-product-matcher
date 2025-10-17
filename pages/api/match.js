// pages/api/match.js
import fs from "fs/promises";
import path from "path";

// Hugging Face embedding helper
async function getEmbeddingFromHuggingFace(imageUrl) {
  const res = await fetch(
    "https://api-inference.huggingface.co/pipeline/feature-extraction/openai/clip-vit-base-patch32",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: imageUrl }),
    }
  );

  if (!res.ok) throw new Error("Hugging Face API error");
  const result = await res.json();
  if (!Array.isArray(result) || !Array.isArray(result[0])) {
    throw new Error("Invalid embedding response");
  }
  return result[0];
}

// cosine similarity helper
function cosineSimilarity(a, b) {
  const dot = a.reduce((s, v, i) => s + v * b[i], 0);
  const normA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const normB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return dot / (normA * normB);
}

// rank & return results
function rankSimilarities(queryEmb, embeddings, products) {
  const scores = embeddings.map((item, i) => ({
    ...products[i],
    score: cosineSimilarity(queryEmb, item.embedding),
  }));
  return scores.sort((a, b) => b.score - a.score).slice(0, 10);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });

  try {
    const body = await new Promise((resolve) => {
      let data = "";
      req.on("data", (c) => (data += c));
      req.on("end", () => resolve(JSON.parse(data || "{}")));
    });

    const { imageUrl } = body;
    if (!imageUrl) return res.status(400).json({ error: "imageUrl required" });

    // load pre-computed embeddings & product metadata
    const baseDir = process.cwd();
    const embeddings = JSON.parse(await fs.readFile(path.join(baseDir, "data", "embeddings.json"), "utf8"));
    const products = JSON.parse(await fs.readFile(path.join(baseDir, "data", "products.json"), "utf8"));

    // generate query embedding via Hugging Face
    const embedding = await getEmbeddingFromHuggingFace(imageUrl);

    // find most similar products
    const results = rankSimilarities(embedding, embeddings, products);

    res.status(200).json({ results, queryImage: imageUrl });
  } catch (err) {
    console.error("API error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
}
