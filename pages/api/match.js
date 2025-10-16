// pages/api/match.js
// Add near the top of /pages/api/match.js
import fetch from "node-fetch";

async function getEmbeddingFromHuggingFace(imageUrl) {
  const response = await fetch("https://api-inference.huggingface.co/pipeline/feature-extraction/openai/clip-vit-base-patch32", {
    headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_TOKEN}` },
    method: "POST",
    body: JSON.stringify({ inputs: imageUrl }),
  });
  const result = await response.json();
  if (Array.isArray(result)) return result[0]; // normalized embedding
  throw new Error("Invalid embedding response");
}

import formidable from "formidable";
import fs from "fs/promises";
import path from "path";
import { spawn } from "child_process";

// Disable Next.js default body parser
export const config = { api: { bodyParser: false } };

// Helper: cosine similarity between 2 vectors
function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dot / (normA * normB);
}

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Only POST method allowed" });

  const contentType = req.headers["content-type"] || "";

  // Load precomputed embeddings
  const embeddingsPath = path.join(process.cwd(), "data", "embeddings.json");
  const productsPath = path.join(process.cwd(), "data", "products.json");
  const embeddings = JSON.parse(await fs.readFile(embeddingsPath, "utf8"));
  const products = JSON.parse(await fs.readFile(productsPath, "utf8"));

  // Handle file upload
  if (contentType.includes("multipart/form-data")) {
    const form = new formidable.IncomingForm();
    try {
      const { files } = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          else resolve({ files });
        });
      });

      const file = files.image[0] || files.image;
      const tempPath = file.filepath;

      // Run Python script to get embedding for uploaded image
      const embedding = await getPythonEmbedding(tempPath);

      // Compare with dataset
      const results = rankSimilarities(embedding, embeddings, products);

      return res.status(200).json({ results });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Failed to process upload" });
    }
  } else {
    // Handle image URL
    const body = await new Promise((resolve) => {
      let data = "";
      req.on("data", (chunk) => (data += chunk));
      req.on("end", () => resolve(JSON.parse(data || "{}")));
    });
    const { imageUrl } = body;
    if (!imageUrl) return res.status(400).json({ error: "imageUrl missing" });

    const embedding = await getEmbeddingFromHuggingFace(imageUrl);

    const results = rankSimilarities(embedding, embeddings, products);

    return res.status(200).json({ results, queryImage: imageUrl });
  }
}

// Helper: spawn Python to compute query embedding
async function getPythonEmbedding(input, isUrl = false) {
  return new Promise((resolve, reject) => {
    const script = path.join(process.cwd(), "python_embed_query.py");
    const args = isUrl ? ["--url", input] : ["--path", input];
    const proc = spawn("python", [script, ...args]);

    let data = "";
    proc.stdout.on("data", (chunk) => (data += chunk.toString()));
    proc.stderr.on("data", (err) => console.error("Python error:", err.toString()));

    proc.on("close", () => {
      try {
        resolve(JSON.parse(data));
      } catch {
        reject("Failed to parse embedding from Python");
      }
    });
  });
}

// Helper: rank products by similarity
function rankSimilarities(queryEmb, embeddings, products) {
  const scores = embeddings.map((item, i) => ({
    ...products[i],
    score: cosineSimilarity(queryEmb, item.embedding),
  }));
  return scores.sort((a, b) => b.score - a.score).slice(0, 10);
}
