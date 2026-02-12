import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Nav from "@/components/Nav";
import UserTable from "@/components/UserTable";
import CategoryManager from "@/components/CategoryManager";
import AdminArticles from "./AdminArticles";
import DropboxSyncButton from "./DropboxSyncButton";

export default async function AdminPage() {
  const user = await getSessionUser();

  if (!user) redirect("/");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      surname: true,
      cityOfPractice: true,
      cellNumber: true,
      status: true,
      createdAt: true,
    },
  });

  const serializedUsers = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <>
      <Nav />
      <main className="min-h-screen pt-28 pb-16 px-6 max-w-6xl mx-auto">
        <h1 className="font-[family-name:var(--font-display)] text-4xl mb-10 tracking-tight">
          Admin Panel
        </h1>

        <section className="mb-16">
          <h2 className="font-[family-name:var(--font-display)] text-2xl mb-4">
            Dropbox Sync
          </h2>
          <DropboxSyncButton />
        </section>

        <section className="mb-16">
          <UserTable initialUsers={serializedUsers} />
        </section>

        <section className="mb-16">
          <h2 className="font-[family-name:var(--font-display)] text-2xl mb-4">
            Categories
          </h2>
          <CategoryManager />
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-display)] text-2xl mb-4">
            Articles
          </h2>
          <AdminArticles />
        </section>
      </main>
    </>
  );
}
