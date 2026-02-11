"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import LoginModal from "./LoginModal";
import SignupModal from "./SignupModal";
import { useRouter } from "next/navigation";

export default function Nav() {
  const [modal, setModal] = useState<"login" | "signup" | null>(null);
  const [user, setUser] = useState<{ email: string | null } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ? { email: firebaseUser.email } : null);
    });
    return unsub;
  }, []);

  function openModal(type: "login" | "signup") {
    setModal(type);
  }

  function closeModal() {
    setModal(null);
  }

  function switchModal(type: "login" | "signup") {
    setModal(null);
    setTimeout(() => setModal(type), 80);
  }

  async function handleLogout() {
    await signOut(auth);
    await fetch("/api/auth/session", { method: "DELETE" });
    router.refresh();
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center px-6 py-4">
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-[14px] bg-white/[0.04] border border-[var(--glass-border)] backdrop-blur-[20px]">
          <span className="font-[family-name:var(--font-display)] text-[1.15rem] tracking-tight text-white mr-3 select-none">
            SASSH
          </span>
          {user ? (
            <>
              <button
                onClick={() => router.push("/dashboard")}
                className="btn btn-ghost"
              >
                Dashboard
              </button>
              <button onClick={handleLogout} className="btn btn-primary">
                Logout
              </button>
            </>
          ) : (
            <>
              <button onClick={() => openModal("login")} className="btn btn-ghost">
                Login
              </button>
              <button onClick={() => openModal("signup")} className="btn btn-primary">
                Sign Up
              </button>
            </>
          )}
        </div>
      </nav>

      <LoginModal
        isOpen={modal === "login"}
        onClose={closeModal}
        onSwitchToSignup={() => switchModal("signup")}
      />
      <SignupModal
        isOpen={modal === "signup"}
        onClose={closeModal}
        onSwitchToLogin={() => switchModal("login")}
      />

      <style jsx>{`
        .btn {
          font-family: var(--font-body);
          font-size: 0.875rem;
          font-weight: 500;
          padding: 8px 20px;
          border-radius: 9px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          letter-spacing: -0.01em;
          line-height: 1;
        }
        .btn:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
        .btn-ghost {
          background: transparent;
          color: var(--text-secondary);
          border: 1px solid var(--border);
        }
        .btn-ghost:hover {
          color: var(--text);
          background: rgba(255, 255, 255, 0.06);
          transform: translateY(-1px);
        }
        .btn-primary {
          background: var(--text);
          color: var(--bg);
        }
        .btn-primary:hover {
          background: #e0e0e0;
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </>
  );
}
