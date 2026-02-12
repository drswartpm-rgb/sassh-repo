import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  surname: z.string().min(1).optional(),
  cityOfPractice: z.string().min(1).optional(),
  cellNumber: z.string().min(1).optional(),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    surname: user.surname,
    cityOfPractice: user.cityOfPractice,
    cellNumber: user.cellNumber,
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = updateProfileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: parsed.data,
  });

  return NextResponse.json({
    id: updated.id,
    email: updated.email,
    name: updated.name,
    surname: updated.surname,
    cityOfPractice: updated.cityOfPractice,
    cellNumber: updated.cellNumber,
  });
}
