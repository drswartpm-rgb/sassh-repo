import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import Groq from "groq-sdk";

const chatSchema = z.object({
  message: z.string().min(1),
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are the SASSH AI assistant, helping medical professionals with hand surgery topics. You summarise articles, suggest reading sequences, and answer clinical questions. Keep responses concise and professional.",
        },
        { role: "user", content: message },
      ],
      max_tokens: 1024,
    });

    const text = completion.choices[0]?.message?.content;

    return NextResponse.json({
      content: text || "I couldn't generate a response this time.",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Groq API error:", msg);

    const isRateLimit = msg.includes("429") || msg.includes("rate_limit");
    return NextResponse.json(
      { error: isRateLimit
          ? "Rate limit reached, try again in a moment."
          : "Something went wrong, please try again."
      },
      { status: isRateLimit ? 429 : 500 }
    );
  }
}
