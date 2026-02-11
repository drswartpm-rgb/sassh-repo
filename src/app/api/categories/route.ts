import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createCategorySchema = z.object({
  name: z.string().min(1),
  order: z.number().int().optional(),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.status !== "APPROVED") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { articles: true } } },
  });

  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Default order: max + 1
  const order =
    parsed.data.order ??
    ((await prisma.category.aggregate({ _max: { order: true } }))._max.order ?? 0) + 1;

  const category = await prisma.category.create({
    data: { name: parsed.data.name, order },
  });

  return NextResponse.json(category, { status: 201 });
}
