"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, FileUp, FileDown, Sun, Moon, CheckCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    if (document.documentElement.getAttribute("data-theme") === "light") {
      setTheme("light");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    if (newTheme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!token) {
      setError("Invalid or missing reset token. Please request a new link.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    if (!specialCharRegex.test(password)) {
      setError("Password must contain at least one special character.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login");
      }, 3000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Top Navigation */}
      <header className="header-mobile" style={{ padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", background: "var(--bg-surface)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "2.5rem" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", color: "inherit" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <img src="/logo.png" alt="ConvertDoctor Logo" style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.25)" }} />
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "700" }}>ConvertDoctor</h2>
          </Link>
        </div>
        
        <div className="header-controls-mobile" style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <button onClick={toggleTheme} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", borderRadius: "50%", background: "var(--bg-base)", border: "1px solid var(--border-color)", color: "var(--text-primary)", transition: "all 0.2s ease" }}>
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      <div className="container" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 0" }}>
        <div className="glass-panel animate-fade-in" style={{ width: "100%", maxWidth: "450px", padding: "2.5rem" }}>
          
          {success ? (
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                <CheckCircle size={32} />
              </div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "0.5rem" }}>Password Reset!</h2>
              <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                Your password has been changed successfully. You will be redirected to the login page momentarily.
              </p>
              <Link href="/login" className="btn-primary" style={{ display: "inline-block", padding: "0.75rem 2rem", textDecoration: "none" }}>
                Go to Login
              </Link>
            </div>
          ) : (
            <>
              <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                  <FileUp size={32} color="var(--accent-color)" />
                  <FileDown size={32} color="var(--accent-color)" />
                </div>
                <h1 style={{ fontSize: "1.75rem", fontWeight: "700", marginBottom: "0.5rem" }}>
                  New Password
                </h1>
                <p style={{ color: "var(--text-muted)" }}>Enter your new secure password below</p>
              </div>

              {!token ? (
                <div style={{ padding: "1rem", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--error)", color: "var(--error)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
                  <p style={{ marginBottom: "1rem" }}>Missing reset token.</p>
                  <Link href="/forgot-password" style={{ color: "var(--error)", textDecoration: "underline" }}>Request a new link</Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {error && (
                    <div style={{ padding: "0.75rem", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--error)", color: "var(--error)", borderRadius: "var(--radius-md)", fontSize: "0.875rem" }}>
                      {error}
                    </div>
                  )}

                  <div style={{ position: "relative" }}>
                    <Lock size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input
                      type="password"
                      placeholder="New Password"
                      className="input-field"
                      style={{ paddingLeft: "2.75rem" }}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ position: "relative" }}>
                    <Lock size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input
                      type="password"
                      placeholder="Confirm New Password"
                      className="input-field"
                      style={{ paddingLeft: "2.75rem" }}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: "0.5rem" }}>
                    {loading ? "Resetting..." : "Reset Password"}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
