"use client";

interface Props {
  categories: { id: string; name: string }[];
}

export default function CategoryBar({ categories }: Props) {
  if (categories.length === 0) return null;

  function scrollTo(id: string) {
    const el = document.getElementById(`category-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="fixed top-[72px] left-0 right-0 z-[90] flex justify-center px-6 py-2 bg-[var(--bg-nav)] backdrop-blur-md">
      <div className="flex items-center gap-2 px-4 py-2 rounded-[12px] bg-[var(--glass)] border border-[var(--glass-border)] backdrop-blur-[20px]">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => scrollTo(cat.id)}
            className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] text-[var(--text-secondary)] bg-transparent hover:text-[var(--text)] hover:bg-[var(--hover-bg)] transition-all cursor-pointer"
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}
