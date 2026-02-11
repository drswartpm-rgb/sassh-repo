import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyBearerToken } from "@/lib/auth";
import { adminAuth } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";

const signupSchema = z.object({
  name: z.string().min(1),
  surname: z.string().min(1),
  cityOfPractice: z.string().min(1),
  cellNumber: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const decoded = await verifyBearerToken(req.headers.get("Authorization"));
  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Check if user already exists
  const existing = await prisma.user.findUnique({
    where: { firebaseUid: decoded.uid },
  });
  if (existing) {
    return NextResponse.json({ error: "User already exists" }, { status: 409 });
  }

  // Get email from Firebase
  const firebaseUser = await adminAuth.getUser(decoded.uid);
  const email = firebaseUser.email!;

  // Auto-promote admin
  const isAdmin = email === process.env.ADMIN_EMAIL;

  const user = await prisma.user.create({
    data: {
      firebaseUid: decoded.uid,
      email,
      name: isAdmin ? "sassh-admin" : parsed.data.name,
      surname: parsed.data.surname,
      cityOfPractice: parsed.data.cityOfPractice,
      cellNumber: parsed.data.cellNumber,
      ...(isAdmin && { role: "ADMIN", status: "APPROVED" }),
    },
  });

  return NextResponse.json({ id: user.id, status: user.status }, { status: 201 });
}
