import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { claude } from "@/lib/claude";

const chatSchema = z.object({
  message: z.string().min(1),
  model: z.string().optional().default("claude-haiku-4-5-20251001"),
  maxTokens: z.number().optional().default(1024),
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
    const { message, model, maxTokens } = parsed.data;

    const response = await claude.messages.create({
      model,
      max_tokens: maxTokens,
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    });

    return NextResponse.json({
      content: response.content[0].type === "text" ? response.content[0].text : "",
      model: response.model,
      usage: response.usage,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Claude API error:", msg);
    return NextResponse.json(
      { error: `Failed to get response from Claude: ${msg}` },
      { status: 500 }
    );
  }
}
