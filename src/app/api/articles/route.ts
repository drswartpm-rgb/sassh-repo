import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createArticleSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  pdfUrl: z.string().url(),
  imageUrl: z.string().url().optional(),
  published: z.boolean().optional(),
  categoryId: z.string().min(1),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.status !== "APPROVED") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const articles = await prisma.article.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: { name: true, surname: true },
      },
      category: {
        select: { id: true, name: true },
      },
    },
  });

  return NextResponse.json(articles);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.status !== "APPROVED") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createArticleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const article = await prisma.article.create({
    data: {
      ...parsed.data,
      published: parsed.data.published ?? true,
      authorId: user.id,
    },
  });

  return NextResponse.json(article, { status: 201 });
}
