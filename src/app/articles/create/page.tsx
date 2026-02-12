import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import Nav from "@/components/Nav";
import CreateArticleForm from "./CreateArticleForm";

export default async function CreateArticlePage() {
  const user = await getSessionUser();

  if (!user) redirect("/");
  if (user.status !== "APPROVED") redirect("/dashboard");

  return (
    <>
      <Nav />
      <main className="min-h-screen pt-28 pb-16 px-6 max-w-2xl mx-auto">
        <h1 className="font-[family-name:var(--font-display)] text-4xl mb-2 tracking-tight">
          Upload Article
        </h1>
        <p className="text-[var(--text-secondary)] mb-8">
          Share a new article with the community.
        </p>
        <div className="p-6 bg-white/[0.03] border border-[var(--glass-border)] rounded-2xl">
          <CreateArticleForm />
        </div>
      </main>
    </>
  );
}
