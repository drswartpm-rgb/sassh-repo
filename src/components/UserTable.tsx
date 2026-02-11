"use client";

import { useState } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  surname: string;
  cityOfPractice: string;
  cellNumber: string;
  status: string;
  createdAt: string;
}

interface Props {
  initialUsers: User[];
}

export default function UserTable({ initialUsers }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [loading, setLoading] = useState<string | null>(null);

  async function updateStatus(id: string, status: "APPROVED" | "REJECTED") {
    setLoading(id);
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status } : u))
      );
    }
    setLoading(null);
  }

  const pending = users.filter((u) => u.status === "PENDING");
  const others = users.filter((u) => u.status !== "PENDING");

  return (
    <div>
      <h2 className="font-[family-name:var(--font-display)] text-2xl mb-4">
        Pending Approvals ({pending.length})
      </h2>

      {pending.length === 0 ? (
        <p className="text-[var(--text-secondary)] text-sm mb-10">No pending users.</p>
      ) : (
        <div className="space-y-3 mb-10">
          {pending.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between p-4 bg-white/[0.03] border border-[var(--glass-border)] rounded-xl"
            >
              <div>
                <p className="font-medium">
                  {u.name} {u.surname}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  {u.email} &middot; {u.cityOfPractice} &middot; {u.cellNumber}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateStatus(u.id, "APPROVED")}
                  disabled={loading === u.id}
                  className="px-4 py-2 text-sm rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[var(--success)] hover:bg-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  Approve
                </button>
                <button
                  onClick={() => updateStatus(u.id, "REJECTED")}
                  disabled={loading === u.id}
                  className="px-4 py-2 text-sm rounded-lg bg-red-500/10 border border-red-500/20 text-[var(--error)] hover:bg-red-500/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="font-[family-name:var(--font-display)] text-2xl mb-4">
        All Users ({others.length})
      </h2>

      {others.length === 0 ? (
        <p className="text-[var(--text-secondary)] text-sm">No approved/rejected users yet.</p>
      ) : (
        <div className="space-y-2">
          {others.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between p-4 bg-white/[0.03] border border-[var(--glass-border)] rounded-xl"
            >
              <div>
                <p className="font-medium">
                  {u.name} {u.surname}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">{u.email}</p>
              </div>
              <span
                className={`px-3 py-1 text-xs rounded-full font-medium ${
                  u.status === "APPROVED"
                    ? "bg-emerald-500/10 text-[var(--success)] border border-emerald-500/20"
                    : "bg-red-500/10 text-[var(--error)] border border-red-500/20"
                }`}
              >
                {u.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
