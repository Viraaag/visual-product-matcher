import { useState } from "react";
import ImageUploader from "../components/ImageUploader";

export default function Home() {
  const [results, setResults] = useState([]);
  const [queryImage, setQueryImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [minScore, setMinScore] = useState(0.8);

  const handleSearch = async (data) => {
    setLoading(true);
    try {
      setResults(data.results || []);
      if (data.queryImage) setQueryImage(data.queryImage);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = results.filter((r) => r.score >= minScore);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="bg-white shadow-sm py-4 mb-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center px-6">
          <h1 className="text-2xl font-bold text-indigo-600">
            🪄 Visual Product Matcher
          </h1>
          <a
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-slate-500 hover:text-indigo-600"
          >
            View on GitHub →
          </a>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6">
        <p className="text-slate-600 mb-6">
          Upload an image or paste a URL to discover visually similar products powered by AI.
        </p>

        <ImageUploader onSearch={handleSearch} />

        {/* Filter */}
        <div className="mt-10 flex items-center gap-4">
          <label className="text-sm text-slate-600">Min similarity:</label>
          <input
            type="range"
            min="0.5"
            max="1"
            step="0.01"
            value={minScore}
            onChange={(e) => setMinScore(parseFloat(e.target.value))}
            className="w-48 accent-indigo-600"
          />
          <span className="text-sm font-medium">
            {(minScore * 100).toFixed(0)}%
          </span>
        </div>

        {/* Results */}
        {loading && (
          <div className="mt-8 text-slate-600 animate-pulse">
            Analyzing image...
          </div>
        )}

        {!loading && filteredResults.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-semibold mb-4">Results</h2>

            {queryImage && (
              <div className="mb-6">
                <p className="text-sm text-slate-600 mb-2">Query Image:</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={queryImage}
                  alt="query"
                  className="w-40 h-40 object-cover rounded-xl border"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredResults.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl shadow-sm p-4 hover:shadow-lg transition-all duration-200"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      item?.image
                        ? item.image.startsWith("http")
                          ? item.image
                          : `${typeof window !== "undefined" ? window.location.origin : ""}${item.image}`
                        : "/fallback.jpg"
                    }
                    alt={item?.name || "Product"}
                    className="rounded-lg w-full h-40 object-cover mb-3 bg-slate-100"
                  />


                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-slate-500">{item.category}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full">
                      🎯 {(item.score * 100).toFixed(1)}% match
                    </span>
                    {item.score > 0.9 && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        Highly similar
                      </span>
                    )}
                  </div>
                  <div className="mt-2 w-full bg-slate-200 h-2 rounded-full">
                    <div
                      className={`h-2 rounded-full ${
                        item.score > 0.9
                          ? "bg-green-500"
                          : item.score > 0.8
                          ? "bg-yellow-400"
                          : "bg-red-400"
                      }`}
                      style={{ width: `${(item.score * 100).toFixed(1)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {!loading && filteredResults.length === 0 && results.length > 0 && (
          <div className="mt-6 text-sm text-slate-500">
            No results match your current filter. Try lowering the threshold.
          </div>
        )}
      </div>
    </main>
  );
}
