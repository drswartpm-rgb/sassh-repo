"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut, getRedirectResult, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import LoginModal from "./LoginModal";
import SignupModal from "./SignupModal";
import SettingsModal from "./SettingsModal";
import { useRouter } from "next/navigation";
import { useTheme } from "./ThemeProvider";

const THEME_LABELS: Record<string, string> = {
  dark: "Dark",
  light: "Light",
  "scrub-green": "Scrub",
};

export default function Nav() {
  const [modal, setModal] = useState<"login" | "signup" | "settings" | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<{
    email: string | null;
    name?: string;
    surname?: string;
    role?: string;
  } | null>(null);
  const router = useRouter();
  const { theme, cycleTheme } = useTheme();

  useEffect(() => {
    // Handle Google redirect result (mobile login flow)
    getRedirectResult(auth)
      .then(async (result) => {
        if (result && GoogleAuthProvider.credentialFromResult(result)) {
          const token = await result.user.getIdToken();
          const res = await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
          const data = await res.json();

          if (data.error === "USER_NOT_FOUND") {
            setModal("signup");
            return;
          }

          if (data.status !== "PENDING" && data.status !== "REJECTED") {
            router.push("/dashboard");
            router.refresh();
          }
        }
      })
      .catch(() => {
        // Redirect result failed silently
      });

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      {/* ===== DESKTOP NAV ===== */}
      <nav className="fixed top-0 left-0 right-0 z-[100] hidden sm:flex items-center justify-center px-6 pt-5 pb-4 bg-[var(--bg-nav)] backdrop-blur-md">
        <div className="absolute left-6 top-1/2 -translate-y-1/2">
          {user?.name && (
            <span className="text-sm text-[var(--text-secondary)] pl-2 select-none">
              Welcome, <span className="text-[var(--text)] font-medium">{user.name}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 px-4 py-2.5 rounded-[14px] bg-[var(--glass)] border border-[var(--glass-border)] backdrop-blur-[20px]">
          <span className="font-[family-name:var(--font-display)] text-[1.15rem] tracking-tight text-[var(--text)] mr-3 select-none">
            SASSH
          </span>
          {user ? (
            <>
              <button onClick={() => router.push("/dashboard")} className="btn btn-ghost">Dashboard</button>
              {user.role === "ADMIN" && (
                <button onClick={() => router.push("/admin")} className="btn btn-ghost">Admin</button>
              )}
              <button onClick={handleLogout} className="btn btn-primary">Logout</button>
            </>
          ) : (
            <>
              <button onClick={() => openModal("login")} className="btn btn-ghost">Login</button>
              <button onClick={() => openModal("signup")} className="btn btn-primary">Sign Up</button>
            </>
          )}
        </div>

        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <button
            onClick={cycleTheme}
            className="theme-toggle"
            aria-label={`Switch theme (current: ${THEME_LABELS[theme]})`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="3" cy="3" r="1.5" fill="currentColor" opacity="0.4"/>
              <circle cx="13" cy="3" r="1.5" fill="currentColor" opacity="0.6"/>
              <circle cx="3" cy="13" r="1.5" fill="currentColor" opacity="0.8"/>
              <circle cx="13" cy="13" r="1.5" fill="currentColor" opacity="0.5"/>
            </svg>
            <span className="text-[10px] font-medium tracking-wide uppercase">{THEME_LABELS[theme]}</span>
          </button>
          {user && (
            <button onClick={() => setModal("settings")} className="settings-gear" aria-label="Settings">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16.167 12.5a1.375 1.375 0 00.275 1.517l.05.05a1.667 1.667 0 11-2.359 2.358l-.05-.05a1.375 1.375 0 00-1.516-.275 1.375 1.375 0 00-.834 1.258v.142a1.667 1.667 0 11-3.333 0v-.075a1.375 1.375 0 00-.9-1.258 1.375 1.375 0 00-1.517.275l-.05.05a1.667 1.667 0 11-2.358-2.359l.05-.05a1.375 1.375 0 00.275-1.516 1.375 1.375 0 00-1.258-.834h-.142a1.667 1.667 0 110-3.333h.075a1.375 1.375 0 001.258-.9 1.375 1.375 0 00-.275-1.517l-.05-.05A1.667 1.667 0 115.867 3.558l.05.05a1.375 1.375 0 001.516.275h.067a1.375 1.375 0 00.833-1.258v-.142a1.667 1.667 0 013.334 0v.075a1.375 1.375 0 00.833 1.258 1.375 1.375 0 001.517-.275l.05-.05a1.667 1.667 0 112.358 2.359l-.05.05a1.375 1.375 0 00-.275 1.516v.067a1.375 1.375 0 001.258.833h.142a1.667 1.667 0 010 3.334h-.075a1.375 1.375 0 00-1.258.833z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
      </nav>

      {/* ===== MOBILE NAV ===== */}
      <nav className="fixed top-0 left-0 right-0 z-[100] flex sm:hidden items-center justify-between px-4 pt-4 pb-3 bg-[var(--bg-nav)] backdrop-blur-md">
        <span className="font-[family-name:var(--font-display)] text-[1.1rem] tracking-tight text-[var(--text)] select-none">
          SASSH
        </span>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="mobile-burger"
          aria-label="Menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {menuOpen ? (
              <>
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="6" y1="18" x2="18" y2="6" />
              </>
            ) : (
              <>
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </>
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="fixed top-[52px] left-0 right-0 z-[99] sm:hidden bg-[var(--bg-nav)] backdrop-blur-md border-b border-[var(--border)] px-4 pb-4 pt-2">
          <div className="flex flex-col gap-2">
            {user?.name && (
              <p className="text-sm text-[var(--text-secondary)] px-1 pb-1 border-b border-[var(--border)]">
                Welcome, <span className="text-[var(--text)] font-medium">{user.name}</span>
              </p>
            )}
            {user ? (
              <>
                <button
                  onClick={() => { router.push("/dashboard"); setMenuOpen(false); }}
                  className="mobile-menu-item"
                >
                  Dashboard
                </button>
                {user.role === "ADMIN" && (
                  <button
                    onClick={() => { router.push("/admin"); setMenuOpen(false); }}
                    className="mobile-menu-item"
                  >
                    Admin
                  </button>
                )}
                <button
                  onClick={() => { setModal("settings"); setMenuOpen(false); }}
                  className="mobile-menu-item"
                >
                  Settings
                </button>
                <button
                  onClick={cycleTheme}
                  className="mobile-menu-item"
                >
                  Theme: {THEME_LABELS[theme]}
                </button>
                <button
                  onClick={() => { handleLogout(); setMenuOpen(false); }}
                  className="mobile-menu-item mobile-menu-item-primary"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { openModal("login"); setMenuOpen(false); }}
                  className="mobile-menu-item"
                >
                  Login
                </button>
                <button
                  onClick={() => { openModal("signup"); setMenuOpen(false); }}
                  className="mobile-menu-item mobile-menu-item-primary"
                >
                  Sign Up
                </button>
                <button
                  onClick={cycleTheme}
                  className="mobile-menu-item"
                >
                  Theme: {THEME_LABELS[theme]}
                </button>
              </>
            )}
          </div>
        </div>
      )}

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
          white-space: nowrap;
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
          background: var(--hover-bg);
          transform: translateY(-2px) scale(1.06);
        }
        .btn-primary {
          background: var(--text);
          color: var(--bg);
        }
        .btn-primary:hover {
          background: var(--btn-inverse-hover-bg);
          transform: translateY(-2px) scale(1.06);
          box-shadow: 0 4px 16px var(--btn-inverse-shadow);
        }
        .theme-toggle {
          display: flex;
          align-items: center;
          gap: 5px;
          height: 36px;
          padding: 0 10px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .theme-toggle:hover {
          color: var(--text);
          background: var(--hover-bg);
          transform: translateY(-2px) scale(1.08);
        }
        .theme-toggle:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
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
          background: var(--hover-bg);
          transform: translateY(-2px) scale(1.08);
        }
        .settings-gear:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
        .mobile-burger {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .mobile-burger:hover {
          color: var(--text);
          background: var(--hover-bg);
        }
        .mobile-menu-item {
          font-family: var(--font-body);
          font-size: 0.9rem;
          font-weight: 500;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          text-align: left;
          transition: all 0.15s ease;
        }
        .mobile-menu-item:hover {
          color: var(--text);
          background: var(--hover-bg);
        }
        .mobile-menu-item-primary {
          background: var(--text);
          color: var(--bg);
          border-color: transparent;
          text-align: center;
        }
        .mobile-menu-item-primary:hover {
          background: var(--btn-inverse-hover-bg);
          color: var(--bg);
        }
      `}</style>
    </>
  );
}
