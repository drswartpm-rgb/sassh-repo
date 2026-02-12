"use client";

import { useState } from "react";

interface SyncResult {
  ok: boolean;
  created: number;
  skipped: number;
  errors: { folder: string; file: string; error: string }[];
}

type SyncState = "idle" | "syncing" | "done" | "error";

export default function DropboxSyncButton() {
  const [state, setState] = useState<SyncState>("idle");
  const [result, setResult] = useState<SyncResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSync() {
    if (state === "syncing") return;
    setState("syncing");
    setResult(null);
    setErrorMsg("");

    try {
      const res = await fetch("/api/sync/dropbox", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setState("error");
        setErrorMsg(data.error || "Sync failed");
        return;
      }

      setResult(data);
      setState("done");
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "Network error");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <button
          onClick={handleSync}
          disabled={state === "syncing"}
          className="px-4 py-2 text-sm font-medium rounded-[10px] bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {state === "syncing" ? "Syncing..." : "Sync from Dropbox"}
        </button>
        {state === "syncing" && (
          <p className="text-sm text-[var(--text-secondary)]">
            This may take a few minutes...
          </p>
        )}
      </div>

      {state === "done" && result && (
        <div className="p-4 rounded-xl bg-white/[0.03] border border-[var(--border)] space-y-2">
          <p className="text-sm font-medium">Sync complete</p>
          <p className="text-sm text-[var(--text-secondary)]">
            Created: {result.created} | Skipped: {result.skipped}
          </p>
          {result.errors.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-sm text-[var(--error)]">
                {result.errors.length} error(s):
              </p>
              {result.errors.map((e, i) => (
                <p key={i} className="text-xs text-[var(--text-secondary)]">
                  {e.folder}/{e.file}: {e.error}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {state === "error" && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-[var(--error)]">
          {errorMsg}
        </div>
      )}
    </div>
  );
}
