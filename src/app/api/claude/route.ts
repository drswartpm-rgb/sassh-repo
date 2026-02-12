import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

const chatSchema = z.object({
  message: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.status !== "APPROVED") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = chatSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const { message } = parsed.data;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent(message);
    const text = result.response.text();

    return NextResponse.json({
      content: text || "I couldn't generate a response this time.",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Gemini API error:", msg);

    const isRateLimit = msg.includes("429") || msg.includes("quota");
    return NextResponse.json(
      { error: isRateLimit
          ? "Search limits exceeded, try again later."
          : "Something went wrong, please try again."
      },
      { status: isRateLimit ? 429 : 500 }
    );
  }
}
