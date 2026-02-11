"use client";

import { useState, useEffect, useCallback } from "react";

interface Category {
  id: string;
  name: string;
  order: number;
  _count: { articles: number };
}

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCategories = useCallback(async () => {
    const res = await fetch("/api/categories");
    if (res.ok) setCategories(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError("");
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to add category.");
      return;
    }
    setNewName("");
    fetchCategories();
  }

  async function handleRename(id: string) {
    if (!editName.trim()) return;
    setError("");
    const res = await fetch(`/api/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to rename.");
      return;
    }
    setEditingId(null);
    fetchCategories();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category?")) return;
    setError("");
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to delete.");
      return;
    }
    fetchCategories();
  }

  if (loading) return <p className="text-sm text-[var(--text-secondary)]">Loading...</p>;

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-[var(--error)]">
          {error}
        </div>
      )}

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name"
          className="form-input flex-1"
        />
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium rounded-[10px] bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-all cursor-pointer"
        >
          Add
        </button>
      </form>

      <div className="space-y-2">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center justify-between p-4 bg-white/[0.03] border border-[var(--glass-border)] rounded-xl"
          >
            {editingId === cat.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRename(cat.id);
                }}
                className="flex gap-2 flex-1 mr-2"
              >
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="form-input flex-1"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs rounded-lg bg-[var(--accent)]/20 border border-[var(--accent)]/30 text-[var(--accent)] hover:bg-[var(--accent)]/30 transition-all cursor-pointer"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-white/[0.06] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-white/[0.1] transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <>
                <div>
                  <p className="font-medium">{cat.name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {cat._count.articles} article{cat._count.articles !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingId(cat.id);
                      setEditName(cat.name);
                    }}
                    className="px-3 py-1.5 text-xs rounded-lg bg-white/[0.06] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-white/[0.1] transition-all cursor-pointer"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="px-3 py-1.5 text-xs rounded-lg bg-red-500/10 border border-red-500/20 text-[var(--error)] hover:bg-red-500/20 transition-all cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
