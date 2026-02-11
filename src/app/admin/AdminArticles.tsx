"use client";

import { useState, useEffect, useCallback } from "react";
import ArticleUploadForm from "@/components/ArticleUploadForm";

interface Article {
  id: string;
  title: string;
  description: string;
  published: boolean;
  createdAt: string;
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
                className="flex items-center justify-between p-4 bg-white/[0.03] border border-[var(--glass-border)] rounded-xl"
              >
                <div>
                  <p className="font-medium">{a.title}</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {a.category?.name && (
                      <span className="inline-block mr-2 px-2 py-0.5 rounded-full bg-white/[0.06] border border-[var(--glass-border)]">
                        {a.category.name}
                      </span>
                    )}
                    {new Date(a.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-red-500/10 border border-red-500/20 text-[var(--error)] hover:bg-red-500/20 transition-all cursor-pointer"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
