"use client";

import { useState, useRef, useEffect, FormEvent } from "react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function ClaudeAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      role: "assistant",
      content:
        "I’m your SASSH AI assistant. Ask me to summarise articles, suggest reading sequences, or explore topics in hand surgery.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    setIsLoading(true);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const res = await fetch("/api/claude", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to reach AI assistant");
      }

      const data = (await res.json()) as {
        content: string;
      };

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.content || "I couldn’t generate a response this time.",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Something went wrong talking to Claude."
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleQuickPrompt(prompt: string) {
    setInput(prompt);
  }

  return (
    <section className="p-5 sm:p-6 bg-[var(--glass)] border border-[var(--glass-border)] rounded-2xl shadow-[0_18px_60px_rgba(0,0,0,0.45)] relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(59,130,246,0.16), transparent 55%), radial-gradient(circle at bottom right, rgba(59,130,246,0.12), transparent 50%)",
        }}
      />

      <div className="relative flex items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg sm:text-xl tracking-tight">
            SASSH AI assistant
          </h2>
          <p className="text-xs sm:text-[0.8rem] text-[var(--text-secondary)] mt-1">
            Ask clinical questions, request reading guidance, or generate summaries.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-[var(--text-secondary)]">
          <span className="inline-flex w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.16)]" />
          <span>Powered by Gemini</span>
        </div>
      </div>

      <div className="relative mb-3 flex flex-wrap gap-1.5">
        {[
          "Summarise key takeaways from the last three articles.",
          "Suggest a reading path for a registrar new to wrist trauma.",
          "Explain the main controversies in flexor tendon repair.",
        ].map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => handleQuickPrompt(prompt)}
            className="text-[0.68rem] sm:text-[0.7rem] px-2.5 py-1 rounded-full border border-[var(--border)] bg-[var(--glass)] text-[var(--text-secondary)] hover:text-[var(--text)] hover:border-[var(--glass-border)] transition-colors duration-150"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div
        ref={scrollRef}
        className="relative mb-4 max-h-64 sm:max-h-72 overflow-y-auto pr-1.5 space-y-3 text-sm"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[82%] rounded-2xl px-3 py-2.5 text-[0.8rem] leading-relaxed ${
                msg.role === "user"
                  ? "bg-[var(--bubble-user-bg)] text-[var(--bubble-user-text)] shadow-[0_10px_30px_rgba(0,0,0,0.55)]"
                  : "bg-[var(--bubble-assistant-bg)] border border-[var(--bubble-assistant-border)] text-[var(--text)]"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <span className="inline-flex w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)] animate-pulse" />
            <span>Thinking about your question…</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="sr-only" htmlFor="sassh-ai-input">
              Ask the SASSH assistant
            </label>
            <textarea
              id="sassh-ai-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={2}
              placeholder="Ask about a case, a concept, or how to use the library effectively…"
              className="w-full text-xs sm:text-[0.8rem] resize-none rounded-xl border border-[var(--glass-border)] bg-[var(--input-bg)] text-[var(--text)] placeholder:text-[var(--input-placeholder)] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/70 focus:border-[var(--accent)]/70"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="shrink-0 px-3.5 py-2.5 rounded-xl bg-[var(--btn-inverse-bg)] text-[var(--btn-inverse-text)] text-xs font-medium tracking-tight shadow-[0_16px_40px_rgba(0,0,0,0.65)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-[1px] hover:shadow-[0_20px_55px_rgba(0,0,0,0.75)] transition-transform duration-150"
          >
            {isLoading ? "Sending…" : "Ask"}
          </button>
        </div>
        {error && (
          <p className="mt-2 text-[0.7rem] text-amber-300/90">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}

