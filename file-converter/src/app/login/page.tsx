"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, FileUp, FileDown, Sun, Moon, ChevronDown } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);

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

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push("/dashboard");
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
          
          <nav style={{ display: "flex", gap: "1.5rem", fontWeight: "500", fontSize: "0.95rem", alignItems: "center" }} className="hidden-mobile">
            <div 
              style={{ position: "relative" }} 
              onMouseEnter={() => setShowToolsDropdown(true)} 
              onMouseLeave={() => setShowToolsDropdown(false)}
            >
              <div style={{ color: "var(--text-primary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                Tools <ChevronDown size={14} />
              </div>
              {showToolsDropdown && (
                <div style={{ position: "absolute", top: "100%", left: 0, marginTop: "0.5rem", width: "180px", background: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-md)", display: "flex", flexDirection: "column", padding: "0.5rem", zIndex: 100 }}>
                  <Link href="/dashboard/pdf-to-word" style={{ padding: "0.5rem 1rem", color: "var(--text-primary)", textDecoration: "none", borderRadius: "var(--radius-sm)", transition: "background 0.2s" }} className="dropdown-item">PDF to Word</Link>
                  <Link href="/dashboard/word-to-pdf" style={{ padding: "0.5rem 1rem", color: "var(--text-primary)", textDecoration: "none", borderRadius: "var(--radius-sm)", transition: "background 0.2s" }} className="dropdown-item">Word to PDF</Link>
                  <Link href="/dashboard/pdf-to-jpg" style={{ padding: "0.5rem 1rem", color: "var(--text-primary)", textDecoration: "none", borderRadius: "var(--radius-sm)", transition: "background 0.2s" }} className="dropdown-item">PDF to JPG</Link>
                  <Link href="/dashboard/pdf-ocr" style={{ padding: "0.5rem 1rem", color: "var(--text-primary)", textDecoration: "none", borderRadius: "var(--radius-sm)", transition: "background 0.2s" }} className="dropdown-item">PDF OCR</Link>
                  <Link href="/dashboard/word-to-excel" style={{ padding: "0.5rem 1rem", color: "var(--text-primary)", textDecoration: "none", borderRadius: "var(--radius-sm)", transition: "background 0.2s" }} className="dropdown-item">Word to Excel</Link>
                  <Link href="/dashboard/word-to-ppt" style={{ padding: "0.5rem 1rem", color: "var(--text-primary)", textDecoration: "none", borderRadius: "var(--radius-sm)", transition: "background 0.2s" }} className="dropdown-item">Word to PPT</Link>
                </div>
              )}
            </div>
            <Link href="/dashboard" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Dashboard</Link>
            <Link href="/" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Convert</Link>
            <Link href="/" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Merge</Link>
            <Link href="/pricing" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Pricing</Link>
          </nav>
        </div>
        
        <div className="header-controls-mobile" style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <button onClick={toggleTheme} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", borderRadius: "50%", background: "var(--bg-base)", border: "1px solid var(--border-color)", color: "var(--text-primary)", transition: "all 0.2s ease" }}>
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Link href="/login" style={{ color: "var(--text-primary)", fontWeight: "500", textDecoration: "none", fontSize: "0.875rem" }}>Log in</Link>
            <Link href="/register" className="btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.875rem", textDecoration: "none" }}>Sign up</Link>
          </div>
        </div>
      </header>

      <div className="container" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 0" }}>
        <div className="glass-panel animate-fade-in" style={{ width: "100%", maxWidth: "450px", padding: "2.5rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <FileUp size={32} color="var(--accent-color)" />
            <FileDown size={32} color="var(--accent-color)" />
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "700", marginBottom: "0.5rem" }}>
            Welcome Back
          </h1>
          <p style={{ color: "var(--text-muted)" }}>Sign in to continue to your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {error && (
            <div style={{ padding: "0.75rem", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--error)", color: "var(--error)", borderRadius: "var(--radius-md)", fontSize: "0.875rem" }}>
              {error}
            </div>
          )}

          <div style={{ position: "relative" }}>
            <Mail size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Username or Email address"
              className="input-field"
              style={{ paddingLeft: "2.75rem" }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={{ position: "relative" }}>
            <Lock size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="password"
              placeholder="Password"
              className="input-field"
              style={{ paddingLeft: "2.75rem" }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Link href="/forgot-password" style={{ fontSize: "0.875rem", color: "var(--accent-color)", textDecoration: "none", fontWeight: "500" }}>
              Forgot password?
            </Link>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: "0.5rem" }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          Don't have an account?{" "}
          <Link href="/register" style={{ fontWeight: "600" }}>
            Create an account
          </Link>
        </p>
      </div>
    </div>
    </div>
  );
}
