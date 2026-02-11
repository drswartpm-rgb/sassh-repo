"use client";

import { useState, useEffect, useCallback } from "react";
import ArticleUploadForm from "@/components/ArticleUploadForm";

interface Article {
  id: string;
  title: string;
  description: string;
  published: boolean;
  createdAt: string;
  imageUrl?: string | null;
  category?: { id: string; name: string } | null;
}

export default function AdminArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchArticles = useCallback(async () => {
    const res = await fetch("/api/articles");
    if (res.ok) {
      setArticles(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this article?")) return;
    const res = await fetch(`/api/articles/${id}`, { method: "DELETE" });
    if (res.ok) {
      setArticles((prev) => prev.filter((a) => a.id !== id));
    }
  }

  async function handleRemoveImage(article: Article) {
    if (!article.imageUrl) return;
    if (!confirm("Remove this article's cover image?")) return;

    const delRes = await fetch("/api/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: article.imageUrl }),
    });
    if (!delRes.ok) return;

    const patchRes = await fetch(`/api/articles/${article.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: null }),
    });
    if (patchRes.ok) {
      setArticles((prev) =>
        prev.map((a) => (a.id === article.id ? { ...a, imageUrl: null } : a))
      );
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <h3 className="text-lg font-medium mb-4">Create Article</h3>
        <div className="p-6 bg-white/[0.03] border border-[var(--glass-border)] rounded-2xl">
          <ArticleUploadForm onCreated={fetchArticles} />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">
          Published Articles ({articles.length})
        </h3>

        {loading ? (
          <p className="text-sm text-[var(--text-secondary)]">Loading...</p>
        ) : articles.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">No articles yet.</p>
        ) : (
          <div className="space-y-3">
            {articles.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-4 p-4 bg-white/[0.03] border border-[var(--glass-border)] rounded-xl"
              >
                {a.imageUrl && (
                  <img
                    src={a.imageUrl}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{a.title}</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {a.category?.name && (
                      <span className="inline-block mr-2 px-2 py-0.5 rounded-full bg-white/[0.06] border border-[var(--glass-border)]">
                        {a.category.name}
                      </span>
                    )}
                    {new Date(a.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {a.imageUrl && (
                    <button
                      onClick={() => handleRemoveImage(a)}
                      className="px-3 py-1.5 text-xs rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 transition-all cursor-pointer"
                    >
                      Remove Image
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="px-3 py-1.5 text-xs rounded-lg bg-red-500/10 border border-red-500/20 text-[var(--error)] hover:bg-red-500/20 transition-all cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
