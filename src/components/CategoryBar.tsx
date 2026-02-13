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
    <div className="fixed top-[56px] sm:top-[84px] left-0 right-0 z-[90] flex justify-center px-3 sm:px-6 pt-3 pb-2 bg-[var(--bg-nav)] backdrop-blur-md overflow-x-auto">
      <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-[12px] bg-[var(--glass)] border border-[var(--glass-border)] backdrop-blur-[20px] flex-nowrap">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => scrollTo(cat.id)}
            className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[0.65rem] sm:text-xs font-medium rounded-lg border border-[var(--border)] text-[var(--text-secondary)] bg-transparent hover:text-[var(--text)] hover:bg-[var(--hover-bg)] hover:-translate-y-0.5 hover:scale-[1.06] transition-all cursor-pointer whitespace-nowrap"
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}
