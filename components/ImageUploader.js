// components/ImageUploader.js
import { useState, useRef, useCallback } from "react";

export default function ImageUploader({ onSearch }) {
  const [preview, setPreview] = useState(null);
  const [inputUrl, setInputUrl] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();

  const handleFile = useCallback((file) => {
    setError("");
    if (!file) return;
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxBytes = 5 * 1024 * 1024; // 5MB
    if (!validTypes.includes(file.type)) {
      setError("Only JPG, PNG or WEBP images are allowed.");
      return;
    }
    if (file.size > maxBytes) {
      setError("File too large. Max 5 MB.");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview({ src: url, file });
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const onSelectFile = (e) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const onUseUrl = () => {
    setError("");
    if (!inputUrl) {
      setError("Paste an image URL first.");
      return;
    }
    // Basic url validation
    try {
      new URL(inputUrl);
    } catch {
      setError("Invalid URL.");
      return;
    }
    setPreview({ src: inputUrl, file: null, url: inputUrl });
  };

  const onSearchClick = async () => {
    setError("");
    if (!preview) {
      setError("Upload a file or paste an image URL first.");
      return;
    }
    setUploading(true);
    try {
      // If file, send as FormData; if url, send JSON
      if (preview.file) {
        const fd = new FormData();
        fd.append("image", preview.file);
        const res = await fetch("/api/match", {
          method: "POST",
          body: fd,
        });
        const data = await res.json();
        onSearch(data);
      } else {
        // url path
        const res = await fetch("/api/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: preview.src }),
        });
        const data = await res.json();
        onSearch(data);
      }
    } catch (e) {
      console.error(e);
      setError("Network error. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Upload image or paste URL
      </label>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="border-2 border-dashed rounded-lg p-4 flex flex-col md:flex-row gap-4 items-center justify-between"
      >
        <div className="flex-1 w-full">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="px-4 py-2 bg-slate-800 text-white rounded-md hover:opacity-95"
            >
              Choose file
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onSelectFile}
            />
            <div className="flex-1">
              <input
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Paste image URL and click Use URL"
                className="mt-2 sm:mt-0 block w-full border rounded px-3 py-2"
                aria-label="Image URL"
              />
            </div>
            <button
              type="button"
              onClick={onUseUrl}
              className="px-3 py-2 bg-white border rounded-md"
            >
              Use URL
            </button>
          </div>

          <p className="text-xs text-slate-500 mt-2">
            Supported: JPG, PNG, WEBP. Max 5 MB. Or drag & drop an image here.
          </p>
        </div>

        <div className="w-40 h-40 bg-slate-50 border rounded overflow-hidden flex items-center justify-center">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview.src} alt="preview" className="object-cover w-full h-full" />
          ) : (
            <span className="text-xs text-slate-400">Preview</span>
          )}
        </div>
      </div>

      {error && <p className="text-red-600 mt-2 text-sm">{error}</p>}

      <div className="mt-4 flex gap-3">
        <button
          onClick={onSearchClick}
          disabled={uploading}
          className={`px-4 py-2 rounded-md text-white ${uploading ? "bg-slate-400" : "bg-indigo-600 hover:opacity-95"}`}
        >
          {uploading ? "Searching..." : "Search Similar"}
        </button>
        <button
          onClick={() => {
            setPreview(null);
            setInputUrl("");
            setError("");
          }}
          className="px-4 py-2 border rounded-md"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
