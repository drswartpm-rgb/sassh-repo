"use client";

import Link from "next/link";

interface Props {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  author: { name: string; surname: string };
}

export default function ArticleCard({ id, title, description, imageUrl, author }: Props) {
  return (
    <Link
      href={`/articles/${id}`}
      className="block bg-white/[0.03] border border-[var(--glass-border)] rounded-2xl overflow-hidden hover:border-[var(--border-focus)] hover:-translate-y-1 transition-all group"
    >
      {imageUrl && (
        <div className="aspect-video bg-white/[0.02] overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-5">
        <h3 className="font-[family-name:var(--font-display)] text-lg mb-2 tracking-tight">
          {title}
        </h3>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-2 mb-3">
          {description}
        </p>
        <p className="text-xs text-white/40">
          By {author.name} {author.surname}
        </p>
      </div>
    </Link>
  );
}
