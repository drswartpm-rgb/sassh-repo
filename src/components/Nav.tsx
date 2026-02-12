"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import LoginModal from "./LoginModal";
import SignupModal from "./SignupModal";
import SettingsModal from "./SettingsModal";
import { useRouter } from "next/navigation";

export default function Nav() {
  const [modal, setModal] = useState<"login" | "signup" | "settings" | null>(null);
  const [user, setUser] = useState<{
    email: string | null;
    name?: string;
    surname?: string;
    role?: string;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser({ email: firebaseUser.email });
        // Fetch profile from session
        try {
          const token = await firebaseUser.getIdToken();
          const res = await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
          if (res.ok) {
            const data = await res.json();
            setUser({
              email: firebaseUser.email,
              name: data.name,
              surname: data.surname,
              role: data.role,
            });
          }
        } catch {
          // Session fetch failed, user still logged in but no role info
        }
      } else {
        setUser(null);
      }
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
      <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center px-6 py-4 bg-black/90 backdrop-blur-md">
        <div className="absolute left-6 top-1/2 -translate-y-1/2">
          {user?.name && (
            <span className="text-sm text-[var(--text-secondary)] pl-2 select-none">
              Welcome, <span className="text-white font-medium">{user.name}</span>
            </span>
          )}
        </div>

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
              {user.role === "ADMIN" && (
                <button
                  onClick={() => router.push("/admin")}
                  className="btn btn-ghost"
                >
                  Admin
                </button>
              )}
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

        <div className="absolute right-6 top-1/2 -translate-y-1/2">
          {user && (
            <button
              onClick={() => setModal("settings")}
              className="settings-gear"
              aria-label="Settings"
              title="Settings"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16.167 12.5a1.375 1.375 0 00.275 1.517l.05.05a1.667 1.667 0 11-2.359 2.358l-.05-.05a1.375 1.375 0 00-1.516-.275 1.375 1.375 0 00-.834 1.258v.142a1.667 1.667 0 11-3.333 0v-.075a1.375 1.375 0 00-.9-1.258 1.375 1.375 0 00-1.517.275l-.05.05a1.667 1.667 0 11-2.358-2.359l.05-.05a1.375 1.375 0 00.275-1.516 1.375 1.375 0 00-1.258-.834h-.142a1.667 1.667 0 110-3.333h.075a1.375 1.375 0 001.258-.9 1.375 1.375 0 00-.275-1.517l-.05-.05A1.667 1.667 0 115.867 3.558l.05.05a1.375 1.375 0 001.516.275h.067a1.375 1.375 0 00.833-1.258v-.142a1.667 1.667 0 013.334 0v.075a1.375 1.375 0 00.833 1.258 1.375 1.375 0 001.517-.275l.05-.05a1.667 1.667 0 112.358 2.359l-.05.05a1.375 1.375 0 00-.275 1.516v.067a1.375 1.375 0 001.258.833h.142a1.667 1.667 0 010 3.334h-.075a1.375 1.375 0 00-1.258.833z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
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
      <SettingsModal
        isOpen={modal === "settings"}
        onClose={closeModal}
        onUpdated={(data) => {
          setUser((prev) => prev ? { ...prev, name: data.name, surname: data.surname } : prev);
        }}
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
        .settings-gear {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .settings-gear:hover {
          color: var(--text);
          background: rgba(255, 255, 255, 0.06);
          transform: translateY(-1px);
        }
        .settings-gear:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
      `}</style>
    </>
  );
}
