"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Mail, Phone, FileUp, FileDown, ChevronDown, Sun, Moon, ArrowLeft } from "lucide-react";
import { countries } from "@/lib/countries";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [countryIso, setCountryIso] = useState("US");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [resetUrl, setResetUrl] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (document.documentElement.getAttribute("data-theme") === "light") {
      setTheme("light");
    }
    
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
    setResetUrl("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phoneNumber: `${countryCode}${phone}` }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      // In development, show the link directly on screen
      setResetUrl(data.resetUrl);

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
          <div style={{ marginBottom: "2rem", position: "relative" }}>
            <Link href="/login" style={{ position: "absolute", left: "-1rem", top: 0, color: "var(--text-muted)", textDecoration: "none" }}>
              <ArrowLeft size={24} />
            </Link>
            <div style={{ textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <FileUp size={32} color="var(--accent-color)" />
                <FileDown size={32} color="var(--accent-color)" />
              </div>
              <h1 style={{ fontSize: "1.75rem", fontWeight: "700", marginBottom: "0.5rem" }}>
                Reset Password
              </h1>
              <p style={{ color: "var(--text-muted)" }}>Enter your email and phone to reset</p>
            </div>
          </div>

          {resetUrl ? (
            <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                <Mail size={32} />
              </div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>Request Verified!</h3>
              <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem", lineHeight: "1.6" }}>
                Normally, we would send a secure link to your email. Since we are in development mode, please click the link below to continue:
              </p>
              <Link href={resetUrl} className="btn-primary" style={{ display: "inline-block", padding: "0.75rem 2rem", textDecoration: "none" }}>
                Proceed to Reset Password
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {error && (
                <div style={{ padding: "0.75rem", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--error)", color: "var(--error)", borderRadius: "var(--radius-md)", fontSize: "0.875rem" }}>
                  {error}
                </div>
              )}

              <div style={{ position: "relative" }}>
                <Mail size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  type="email"
                  placeholder="Registered Email Address"
                  className="input-field"
                  style={{ paddingLeft: "2.75rem" }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <div ref={dropdownRef} style={{ position: "relative", flex: 3, minWidth: 0 }}>
                  <div 
                    className="input-field"
                    tabIndex={0}
                    style={{ 
                      display: "flex", alignItems: "center", cursor: "pointer", 
                      paddingLeft: "0.75rem", paddingRight: "0.75rem", 
                      height: "100%", width: "100%", outline: "none"
                    }}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <img 
                      src={`https://flagcdn.com/w20/${countryIso.toLowerCase()}.png`} 
                      alt={countryIso} 
                      style={{ marginRight: "0.5rem", width: "20px" }} 
                    />
                    <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {countries.find(c => c.code === countryIso)?.name} ({countryCode})
                    </span>
                    <ChevronDown size={16} style={{ color: "var(--text-muted)", marginLeft: "0.25rem" }} />
                  </div>
                  
                  {isDropdownOpen && (
                    <div style={{ 
                      position: "absolute", top: "100%", left: 0, right: 0, 
                      marginTop: "0.25rem", background: "var(--bg-surface)", 
                      border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", 
                      maxHeight: "200px", overflowY: "auto", zIndex: 50,
                      boxShadow: "var(--shadow-md)"
                    }}>
                      {countries.map((c) => (
                        <div 
                          key={c.code}
                          id={`country-${c.code}`}
                          style={{ 
                            padding: "0.5rem 0.75rem", display: "flex", alignItems: "center", 
                            cursor: "pointer", borderBottom: "1px solid var(--border-color)",
                            background: c.code === countryIso ? "rgba(99, 102, 241, 0.1)" : "transparent"
                          }}
                          onClick={() => {
                            setCountryCode(c.dialCode);
                            setCountryIso(c.code);
                            setIsDropdownOpen(false);
                          }}
                        >
                          <img 
                            src={`https://flagcdn.com/w20/${c.code.toLowerCase()}.png`} 
                            alt={c.code} 
                            style={{ marginRight: "0.5rem", width: "20px" }} 
                          />
                          <span style={{ fontSize: "0.875rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {c.name} ({c.dialCode})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ position: "relative", flex: 4, minWidth: 0 }}>
                  <Phone size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input
                    type="tel"
                    placeholder="Registered Phone"
                    className="input-field"
                    style={{ paddingLeft: "2.75rem" }}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: "0.5rem" }}>
                {loading ? "Verifying..." : "Get Reset Link"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
