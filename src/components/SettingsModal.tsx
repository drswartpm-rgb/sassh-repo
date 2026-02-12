"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface ProfileData {
  name: string;
  surname: string;
  cityOfPractice: string;
  cellNumber: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (data: ProfileData) => void;
}

export default function SettingsModal({ isOpen, onClose, onUpdated }: Props) {
  const [form, setForm] = useState<ProfileData>({
    name: "",
    surname: "",
    cityOfPractice: "",
    cellNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSuccess(false);
    setError("");
    setFetching(true);
    fetch("/api/profile")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load profile");
        return res.json();
      })
      .then((data) =>
        setForm({
          name: data.name,
          surname: data.surname,
          cityOfPractice: data.cityOfPractice,
          cellNumber: data.cellNumber,
        })
      )
      .catch((err) => setError(err.message))
      .finally(() => setFetching(false));
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [isOpen]);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, handleEscape]);

  function update(field: keyof ProfileData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
    setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.surname.trim() || !form.cityOfPractice.trim() || !form.cellNumber.trim()) {
      setError("All fields are required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Update failed.");
        return;
      }

      const updated = await res.json();
      setSuccess(true);
      onUpdated(updated);
    } catch {
      setError("Update failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="modal-overlay fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-[8px] p-6 active"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settingsTitle"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="modal-panel bg-[#0f0f0f] border border-[var(--border)] rounded-[20px] p-10 w-full max-w-[480px] relative">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 rounded-lg border border-[var(--border)] bg-transparent text-[var(--text-secondary)] flex items-center justify-center text-lg hover:bg-white/[0.06] hover:text-white transition-all"
        >
          &times;
        </button>

        <h2
          id="settingsTitle"
          className="font-[family-name:var(--font-display)] text-[1.75rem] mb-2 tracking-tight"
        >
          Settings
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-7 leading-relaxed">
          Update your profile information.
        </p>

        {fetching ? (
          <p className="text-sm text-[var(--text-secondary)]">Loading...</p>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-[var(--error)]">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400">
                Profile updated successfully.
              </div>
            )}

            <div className="flex gap-3 max-sm:flex-col max-sm:gap-0">
              <div className="mb-4 flex-1">
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="First name"
                  className="form-input"
                />
              </div>
              <div className="mb-4 flex-1">
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                  Surname
                </label>
                <input
                  type="text"
                  value={form.surname}
                  onChange={(e) => update("surname", e.target.value)}
                  placeholder="Last name"
                  className="form-input"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                City of Practice
              </label>
              <input
                type="text"
                value={form.cityOfPractice}
                onChange={(e) => update("cityOfPractice", e.target.value)}
                placeholder="e.g. Cape Town"
                className="form-input"
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Cell Number
              </label>
              <input
                type="tel"
                value={form.cellNumber}
                onChange={(e) => update("cellNumber", e.target.value)}
                placeholder="+27 82 123 4567"
                className="form-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 text-[0.95rem] font-medium rounded-[10px] bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
