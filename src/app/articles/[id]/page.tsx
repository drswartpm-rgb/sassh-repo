import { redirect, notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Nav from "@/components/Nav";
import Link from "next/link";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user || user.status !== "APPROVED") redirect("/");

  const { id } = await params;
  const article = await prisma.article.findUnique({
    where: { id },
    include: { author: { select: { name: true, surname: true } } },
  });

  if (!article) notFound();

  return (
    <>
      <Nav />
      <main className="min-h-screen pt-28 pb-16 px-6 max-w-4xl mx-auto">
        <Link
          href="/dashboard"
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors mb-6 inline-block"
        >
          &larr; Back to articles
        </Link>

        <h1 className="font-[family-name:var(--font-display)] text-4xl mb-3 tracking-tight">
          {article.title}
        </h1>
        <p className="text-[var(--text-secondary)] mb-2">{article.description}</p>
        <p className="text-xs text-[var(--text-muted)] mb-8">
          By {article.author.name} {article.author.surname} &middot;{" "}
          {article.createdAt.toLocaleDateString()}
        </p>

        {article.imageUrl && (
          <div className="mb-8 rounded-2xl overflow-hidden border border-[var(--glass-border)]">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full"
            />
          </div>
        )}

        <div className="rounded-2xl overflow-hidden border border-[var(--glass-border)] bg-[var(--glass)]">
          <iframe
            src={article.pdfUrl}
            className="w-full h-[80vh]"
            title={`${article.title} PDF`}
          />
        </div>
      </main>
    </>
  );
}
