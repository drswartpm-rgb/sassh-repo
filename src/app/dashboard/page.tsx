import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Nav from "@/components/Nav";
import CategoryBar from "@/components/CategoryBar";
import ArticleCard from "@/components/ArticleCard";
import ClaudeAssistant from "@/components/ClaudeAssistant";

export default async function DashboardPage() {
  const user = await getSessionUser();

  if (!user) redirect("/");

  if (user.status === "PENDING") {
    return (
      <>
        <Nav />
        <main className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-5 text-2xl">
            &#9202;
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl mb-3">
            Account Pending
          </h1>
          <p className="text-[var(--text-secondary)] max-w-md leading-relaxed">
            Your account is awaiting admin approval. You&apos;ll be able to access
            articles once approved.
          </p>
          <div className="inline-flex items-center gap-1.5 mt-4 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-[var(--pending)] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--pending)] animate-[pulse_2s_infinite]" />
            Pending approval
          </div>
        </main>
      </>
    );
  }

  if (user.status === "REJECTED") {
    return (
      <>
        <Nav />
        <main className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
          <h1 className="font-[family-name:var(--font-display)] text-3xl mb-3">
            Access Denied
          </h1>
          <p className="text-[var(--text-secondary)] max-w-md leading-relaxed">
            Your account has been rejected. Please contact an administrator.
          </p>
        </main>
      </>
    );
  }

  const [articles, categories, myArticleCount] = await Promise.all([
    prisma.article.findMany({
      where: { published: true },
      orderBy: { title: "asc" },
      include: {
        author: { select: { name: true, surname: true } },
        category: { select: { id: true, name: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { order: "asc" } }),
    prisma.article.count({ where: { published: true, authorId: user.id } }),
  ]);

  // Group articles by category
  const grouped = categories.map((cat) => ({
    ...cat,
    articles: articles.filter((a) => a.category?.id === cat.id),
  }));

  const uncategorized = articles.filter((a) => !a.category);

  return (
    <>
      <Nav />
      <CategoryBar
        categories={grouped
          .filter((cat) => cat.articles.length > 0)
          .map((cat) => ({ id: cat.id, name: cat.name }))}
      />
      <main className="min-h-screen pt-40 pb-16 px-6 max-w-6xl mx-auto">
        <h1 className="font-[family-name:var(--font-display)] text-4xl mb-2 tracking-tight">
          Articles
        </h1>
        <p className="text-[var(--text-secondary)] mb-8">
          Browse the latest hand surgery articles and resources.
        </p>

        {/* Counter cards */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="p-5 bg-white/[0.03] border border-[var(--glass-border)] rounded-2xl">
            <p className="text-3xl font-semibold tracking-tight">{articles.length}</p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Total Articles</p>
          </div>
          <div className="p-5 bg-white/[0.03] border border-[var(--glass-border)] rounded-2xl">
            <p className="text-3xl font-semibold tracking-tight">{myArticleCount}</p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">My Uploads</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1.1fr)] items-start">
          <div>
            {articles.length === 0 ? (
              <div className="text-center py-20 text-[var(--text-secondary)]">
                <p className="text-lg mb-2">No articles yet</p>
                <p className="text-sm text-white/40">Check back soon for new content.</p>
              </div>
            ) : (
              <div className="space-y-10">
                {grouped.map(
                  (cat) =>
                    cat.articles.length > 0 && (
                      <section
                        key={cat.id}
                        id={`category-${cat.id}`}
                        className="p-6 bg-white/[0.02] border border-[var(--glass-border)] rounded-2xl scroll-mt-48"
                      >
                        <h2 className="font-[family-name:var(--font-display)] text-xl mb-5 tracking-tight">
                          {cat.name}
                          <span className="ml-2 text-sm font-normal text-[var(--text-secondary)]">
                            ({cat.articles.length})
                          </span>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {cat.articles.map((article) => (
                            <ArticleCard
                              key={article.id}
                              id={article.id}
                              title={article.title}
                              description={article.description}
                              imageUrl={article.imageUrl}
                              author={article.author}
                            />
                          ))}
                        </div>
                      </section>
                    )
                )}

                {uncategorized.length > 0 && (
                  <section className="p-6 bg-white/[0.02] border border-[var(--glass-border)] rounded-2xl scroll-mt-48">
                    <h2 className="font-[family-name:var(--font-display)] text-xl mb-5 tracking-tight">
                      Uncategorized
                      <span className="ml-2 text-sm font-normal text-[var(--text-secondary)]">
                        ({uncategorized.length})
                      </span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {uncategorized.map((article) => (
                        <ArticleCard
                          key={article.id}
                          id={article.id}
                          title={article.title}
                          description={article.description}
                          imageUrl={article.imageUrl}
                          author={article.author}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>

          <ClaudeAssistant />
        </div>
      </main>
    </>
  );
}
