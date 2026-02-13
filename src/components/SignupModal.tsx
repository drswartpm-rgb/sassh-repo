"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

interface FormData {
  name: string;
  surname: string;
  city: string;
  cell: string;
  email: string;
  password: string;
}

const empty: FormData = { name: "", surname: "", city: "", cell: "", email: "", password: "" };

export default function SignupModal({ isOpen, onClose, onSwitchToLogin }: Props) {
  const [form, setForm] = useState<FormData>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData | "general", string>>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // If user signed in with Google, pre-fill email
  useEffect(() => {
    if (isOpen && auth.currentUser?.email) {
      setForm((prev) => ({ ...prev, email: auth.currentUser!.email! }));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      if (!success) requestAnimationFrame(() => firstInputRef.current?.focus());
    } else {
      document.body.style.overflow = "";
    }
  }, [isOpen, success]);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, handleEscape]);

  function handleClose() {
    setForm(empty);
    setErrors({});
    setSuccess(false);
    onClose();
  }

  function update(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function isValidSAPhone(phone: string) {
    const cleaned = phone.replace(/[\s\-()]/g, "");
    return /^(\+27|0)\d{9}$/.test(cleaned);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: typeof errors = {};

    if (!form.name.trim()) newErrors.name = "Name is required.";
    if (!form.surname.trim()) newErrors.surname = "Surname is required.";
    if (!form.city.trim()) newErrors.city = "City is required.";
    if (!isValidSAPhone(form.cell)) newErrors.cell = "Enter a valid SA number (+27... or 0...).";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Please enter a valid email address.";

    // Password only required if not already signed in via Google
    const isGoogleUser = auth.currentUser !== null;
    if (!isGoogleUser && form.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      let token: string;

      if (isGoogleUser) {
        // Google user completing profile
        token = await auth.currentUser!.getIdToken();
      } else {
        // Email/password signup
        const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
        token = await cred.user.getIdToken();
      }

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          surname: form.surname.trim(),
          cityOfPractice: form.city.trim(),
          cellNumber: form.cell.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrors({ general: data.error || "Signup failed." });
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signup failed.";
      if (message.includes("email-already-in-use")) {
        setErrors({ general: "An account with this email already exists." });
      } else {
        setErrors({ general: message });
      }
    } finally {
      setLoading(false);
    }
  }

  const isGoogleUser = auth.currentUser !== null && isOpen;

  return (
    <div
      ref={overlayRef}
      className={`modal-overlay fixed inset-0 z-[200] flex items-center justify-center bg-[var(--bg-overlay)] backdrop-blur-[8px] p-6 ${isOpen ? "active" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="signupTitle"
      onClick={(e) => e.target === overlayRef.current && handleClose()}
    >
      <div className="modal-panel bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[20px] p-6 sm:p-10 w-full max-w-[480px] relative">
        <button
          onClick={handleClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 rounded-lg border border-[var(--border)] bg-transparent text-[var(--text-secondary)] flex items-center justify-center text-lg hover:bg-[var(--hover-bg)] hover:text-[var(--text)] transition-all"
        >
          &times;
        </button>

        {success ? (
          <div className="text-center py-5">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5 text-2xl">
              &#10003;
            </div>
            <h3 className="font-[family-name:var(--font-display)] text-2xl mb-3">
              Account Created
            </h3>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-[320px] mx-auto">
              Your registration has been received. An administrator will review and
              approve your account shortly.
            </p>
            <div className="inline-flex items-center gap-1.5 mt-4 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-[var(--pending)] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--pending)] animate-[pulse_2s_infinite]" />
              Pending admin approval
            </div>
          </div>
        ) : (
          <>
            <h2
              id="signupTitle"
              className="font-[family-name:var(--font-display)] text-[1.75rem] mb-2 tracking-tight"
            >
              {isGoogleUser ? "Complete your profile" : "Create an account"}
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mb-7 leading-relaxed">
              {isGoogleUser
                ? "Fill in your details to complete registration."
                : "Join the SASSH professional network."}
            </p>

            {errors.general && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-[var(--error)]">
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="flex gap-3 max-sm:flex-col max-sm:gap-0">
                <div className="mb-4 flex-1">
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                    Name
                  </label>
                  <input
                    ref={firstInputRef}
                    type="text"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="First name"
                    className={`form-input ${errors.name ? "input-error" : ""}`}
                  />
                  {errors.name && (
                    <p className="text-xs text-[var(--error)] mt-1">{errors.name}</p>
                  )}
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
                    className={`form-input ${errors.surname ? "input-error" : ""}`}
                  />
                  {errors.surname && (
                    <p className="text-xs text-[var(--error)] mt-1">{errors.surname}</p>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                  City of Practice
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  placeholder="e.g. Cape Town"
                  className={`form-input ${errors.city ? "input-error" : ""}`}
                />
                {errors.city && (
                  <p className="text-xs text-[var(--error)] mt-1">{errors.city}</p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                  Cell Number
                </label>
                <input
                  type="tel"
                  value={form.cell}
                  onChange={(e) => update("cell", e.target.value)}
                  placeholder="+27 82 123 4567"
                  className={`form-input ${errors.cell ? "input-error" : ""}`}
                />
                {errors.cell && (
                  <p className="text-xs text-[var(--error)] mt-1">{errors.cell}</p>
                )}
              </div>

              {!isGoogleUser && (
                <>
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      placeholder="you@example.com"
                      className={`form-input ${errors.email ? "input-error" : ""}`}
                    />
                    {errors.email && (
                      <p className="text-xs text-[var(--error)] mt-1">{errors.email}</p>
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                      Password
                    </label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => update("password", e.target.value)}
                      placeholder="Minimum 8 characters"
                      className={`form-input ${errors.password ? "input-error" : ""}`}
                    />
                    {errors.password && (
                      <p className="text-xs text-[var(--error)] mt-1">{errors.password}</p>
                    )}
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-2 text-[0.95rem] font-medium rounded-[10px] bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            {!isGoogleUser && (
              <p className="text-center mt-5 text-sm text-[var(--text-secondary)]">
                Already have an account?{" "}
                <button
                  onClick={() => {
                    setForm(empty);
                    setErrors({});
                    onSwitchToLogin();
                  }}
                  className="text-[var(--accent)] font-medium hover:underline cursor-pointer bg-transparent border-none"
                >
                  Login
                </button>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
