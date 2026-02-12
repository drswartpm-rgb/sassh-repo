"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignup: () => void;
}

export default function LoginModal({ isOpen, onClose, onSwitchToSignup }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => firstInputRef.current?.focus());
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

  function resetForm() {
    setEmail("");
    setPassword("");
    setErrors({});
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function createSession(token: string) {
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    return res.json();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: typeof errors = {};

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!password) {
      newErrors.password = "Password is required.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const token = await cred.user.getIdToken();
      const data = await createSession(token);

      if (data.status === "PENDING") {
        setErrors({ general: "Your account is pending admin approval." });
        setLoading(false);
        return;
      }
      if (data.status === "REJECTED") {
        setErrors({ general: "Your account has been rejected." });
        setLoading(false);
        return;
      }

      handleClose();
      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrors({ general: "Invalid email or password." });
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    setErrors({});

    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const token = await cred.user.getIdToken();
      const data = await createSession(token);

      if (data.error === "USER_NOT_FOUND") {
        // New Google user — redirect to signup flow
        handleClose();
        onSwitchToSignup();
        return;
      }

      if (data.status === "PENDING") {
        setErrors({ general: "Your account is pending admin approval." });
        setLoading(false);
        return;
      }

      handleClose();
      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrors({ general: "Google sign-in failed." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      ref={overlayRef}
      className={`modal-overlay fixed inset-0 z-[200] flex items-center justify-center bg-[var(--bg-overlay)] backdrop-blur-[8px] p-6 ${isOpen ? "active" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="loginTitle"
      onClick={(e) => e.target === overlayRef.current && handleClose()}
    >
      <div className="modal-panel bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[20px] p-10 w-full max-w-[440px] relative">
        <button
          onClick={handleClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 rounded-lg border border-[var(--border)] bg-transparent text-[var(--text-secondary)] flex items-center justify-center text-lg hover:bg-[var(--hover-bg)] hover:text-[var(--text)] transition-all"
        >
          &times;
        </button>

        <h2
          id="loginTitle"
          className="font-[family-name:var(--font-display)] text-[1.75rem] mb-2 tracking-tight"
        >
          Welcome back
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-7 leading-relaxed">
          Sign in to access the article catalog.
        </p>

        {errors.general && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-[var(--error)]">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 tracking-wide">
              Email
            </label>
            <input
              ref={firstInputRef}
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder="you@example.com"
              className={`form-input ${errors.email ? "input-error" : ""}`}
            />
            {errors.email && (
              <p className="text-xs text-[var(--error)] mt-1">{errors.email}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 tracking-wide">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder="Your password"
              className={`form-input ${errors.password ? "input-error" : ""}`}
            />
            {errors.password && (
              <p className="text-xs text-[var(--error)] mt-1">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 text-[0.95rem] font-medium rounded-[10px] bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-[var(--border)]" />
          <span className="text-xs text-[var(--text-secondary)]">or</span>
          <div className="flex-1 h-px bg-[var(--border)]" />
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3 text-sm font-medium rounded-[10px] border border-[var(--border)] bg-transparent text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--hover-bg)] transition-all cursor-pointer disabled:opacity-50"
        >
          Continue with Google
        </button>

        <p className="text-center mt-5 text-sm text-[var(--text-secondary)]">
          Don&apos;t have an account?{" "}
          <button
            onClick={() => {
              resetForm();
              onSwitchToSignup();
            }}
            className="text-[var(--accent)] font-medium hover:underline cursor-pointer bg-transparent border-none"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}
