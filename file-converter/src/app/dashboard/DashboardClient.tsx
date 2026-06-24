"use client";

import { useState, useRef, useEffect } from "react";
import { signOut, signIn } from "next-auth/react";
import { 
  UploadCloud, 
  FileText, 
  Image as ImageIcon, 
  Settings, 
  LogOut, 
  Moon, 
  Sun,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileDown,
  Shield,
  User,
  Lightbulb,
  Award,
  ThumbsUp,
  Lock,
  Layers,
  ShieldCheck,
  X,
  ChevronDown,
  Mail
} from "lucide-react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { countries } from "@/lib/countries";

type ConversionType = "pdf-to-word" | "word-to-pdf" | "pdf-to-jpg" | "pdf-ocr" | "word-to-excel" | "word-to-ppt" | "other";

export default function DashboardClient({ user, initialConversionType = "pdf-to-word" }: { user: any, initialConversionType?: ConversionType }) {
  const [localUser, setLocalUser] = useState(user);
  
  useEffect(() => {
    setLocalUser(user);
  }, [user]);

  const [file, setFile] = useState<File | null>(null);
  const [conversionType, setConversionType] = useState<ConversionType>(initialConversionType);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<"idle" | "uploading" | "converting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>("downloaded-file");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Login Dropdown State
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Profile Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  // Extract country code if possible
  const initPhone = localUser?.phoneNumber || "";
  let defaultCode = "+1";
  let defaultIso = "US";
  let defaultPhoneRaw = initPhone;
  if (initPhone) {
    const match = countries.find(c => initPhone.startsWith(c.dialCode));
    if (match) {
      defaultCode = match.dialCode;
      defaultIso = match.code;
      defaultPhoneRaw = initPhone.slice(match.dialCode.length);
    }
  }

  const [countryCode, setCountryCode] = useState(defaultCode);
  const [countryIso, setCountryIso] = useState(defaultIso);
  const [phone, setPhone] = useState(defaultPhoneRaw);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    username: user?.username || "",
    email: user?.email || "",
    phoneNumber: user?.phoneNumber || "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError("");
    setProfileSuccess(false);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profileData,
          phoneNumber: `${countryCode}${phone}`
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setProfileSuccess(true);
        setIsEditingProfile(false);
        setLocalUser({ ...localUser, ...profileData, phoneNumber: `${countryCode}${phone}` });
        // We do not force reload the session here to keep it simple, 
        // but the DB is updated. The user can see it on next login.
        // Or we could trigger a router.refresh() if needed.
      } else {
        setProfileError(data.message || "Failed to update profile");
      }
    } catch (err: any) {
      setProfileError("An unexpected error occurred");
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    // Check initial theme from document
    if (document.documentElement.getAttribute("data-theme") === "light") {
      setTheme("light");
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      setStatus("idle");
      setDownloadUrl(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setStatus("idle");
      setDownloadUrl(null);
    }
  };

  const handleConvert = async (bypassUserCheck = false) => {
    if (!bypassUserCheck && !localUser) {
      setShowLoginDropdown(true);
      return;
    }
    
    if (!file) return;

    setStatus("uploading");
    setErrorMessage("");
    
    // Create FormData
    const formData = new FormData();
    formData.append("file", file);
    formData.append("conversionType", conversionType);

    try {
      // Simulate network request and conversion delay
      setStatus("converting");
      
      const response = await fetch("/api/convert", {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      if (!response.ok) {
        if (response.status === 401) {
          setLocalUser(null);
          setShowLoginDropdown(true);
          setStatus("idle");
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Conversion failed");
      }

      const contentType = response.headers.get("Content-Type") || "";
      
      if (contentType.includes("application/json")) {
        const data = await response.json();
        
        if (data.type === "html2pdf") {
           // use html2pdf for client-side rendering
           const html2pdf = (await import('html2pdf.js')).default;
           
           // Wrap html in a div with basic styling for better rendering
           const element = document.createElement('div');
           element.innerHTML = data.html;
           element.style.padding = '40px'; // standard A4 padding
           element.style.fontFamily = 'Arial, sans-serif';
           element.style.fontSize = '11pt';
           element.style.lineHeight = '1.5';
           element.style.color = '#000';
           
           // Fix images from enlarging beyond the page width without forcing center alignment
           const images = element.querySelectorAll('img');
           images.forEach(img => {
               img.style.maxWidth = '80%';
               img.style.maxHeight = '400px'; // Prevents native high-res images from blowing up
               img.style.width = 'auto';
               img.style.height = 'auto';
               img.style.objectFit = 'contain';
               // Do not force display: block or margin: auto so images stay exactly where they were placed
           });

           // Prevent paragraphs from splitting across pages
           const paragraphs = element.querySelectorAll('p, h1, h2, h3, h4, h5, h6, ul, ol');
           paragraphs.forEach(p => {
               (p as HTMLElement).style.pageBreakInside = 'avoid';
               (p as HTMLElement).style.marginBottom = '12px';
           });
           
           const opt = {
             margin:       10,
             filename:     `converted-${(file.name || "file").split('.')[0]}.pdf`,
             image:        { type: 'jpeg' as const, quality: 0.98 },
             html2canvas:  { scale: 2, useCORS: true },
             jsPDF:        { unit: 'mm' as const, format: 'a4', orientation: 'portrait' as const },
             pagebreak:    { mode: ['css', 'legacy'] }
           };
           
           const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
           const url = window.URL.createObjectURL(pdfBlob);
           setDownloadUrl(url);
           setStatus("success");
           return;
         }
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `converted-${(file?.name || "file").split('.')[0]}.${conversionType === 'pdf-to-word' ? 'docx' : conversionType.split('-to-')[1] || 'bin'}`;
      
      if (contentDisposition && contentDisposition.includes('filename="')) {
        filename = contentDisposition.split('filename="')[1].split('"')[0];
      }

      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);
      setDownloadFilename(filename);
      setStatus("success");
      
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred");
      setStatus("error");
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    const res = await signIn("credentials", {
      redirect: false,
      email: loginEmail,
      password: loginPassword,
    });

    if (res?.error) {
      setLoginError(res.error);
      setLoginLoading(false);
    } else {
      setShowLoginDropdown(false);
      setLoginLoading(false);
      setLocalUser({ name: loginEmail.split("@")[0], email: loginEmail, role: "USER" });
      
      // Auto convert if file exists
      setTimeout(() => {
        const convertBtn = document.getElementById("hidden-convert-trigger");
        if (convertBtn) convertBtn.click();
      }, 100);
    }
  };

  const getFileIcon = () => {
    if (!file) return <UploadCloud size={48} color="var(--accent-color)" />;
    if (file.type.includes("pdf")) return <FileText size={48} color="var(--error)" />;
    if (file.type.includes("image")) return <ImageIcon size={48} color="var(--success)" />;
    return <FileText size={48} color="var(--accent-color)" />;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <button 
        id="hidden-convert-trigger" 
        style={{ display: 'none' }} 
        onClick={() => handleConvert(true)} 
      />
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
            <a href="#" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Convert</a>
            <a href="#" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Merge</a>
            <a href="#" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Pricing</a>
          </nav>
        </div>
        
        <div className="header-controls-mobile" style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <button onClick={toggleTheme} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", borderRadius: "50%", background: "var(--bg-base)", border: "1px solid var(--border-color)", color: "var(--text-primary)", transition: "all 0.2s ease" }}>
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          {localUser?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="btn-secondary"
              style={{ padding: "0.5rem 1rem", fontSize: "0.875rem", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <Shield size={16} /> Admin
            </Link>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {localUser ? (
              <>
                <button 
                  onClick={() => setIsProfileModalOpen(true)}
                  style={{ 
                    background: "transparent", border: "none", cursor: "pointer", 
                    fontSize: "0.875rem", fontWeight: "500", color: "var(--text-primary)",
                    display: "flex", alignItems: "center", gap: "0.5rem" 
                  }}
                >
                  <User size={16} /> {localUser.name || localUser.email}
                </button>
                <button 
                  onClick={() => signOut()}
                  className="btn-secondary"
                  style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </>
            ) : (
              <>
                <div style={{ position: "relative" }}>
                  <button 
                    onClick={() => setShowLoginDropdown(!showLoginDropdown)}
                    style={{ background: "transparent", border: "none", color: "var(--text-primary)", fontWeight: "500", fontSize: "0.875rem", cursor: "pointer", padding: "0.5rem 1rem" }}
                  >
                    Log in
                  </button>
                  {showLoginDropdown && (
                    <div className="glass-panel animate-fade-in" style={{ position: "absolute", top: "100%", right: 0, marginTop: "0.5rem", width: "320px", padding: "1.5rem", zIndex: 100, boxShadow: "var(--shadow-xl)" }}>
                      <h3 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "1rem" }}>Sign In</h3>
                      <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {loginError && (
                          <div style={{ padding: "0.5rem", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--error)", color: "var(--error)", borderRadius: "var(--radius-md)", fontSize: "0.875rem" }}>
                            {loginError}
                          </div>
                        )}
                        <div style={{ position: "relative" }}>
                          <Mail size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                          <input
                            type="text"
                            placeholder="Username or Email"
                            className="input-field"
                            style={{ paddingLeft: "2.5rem" }}
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div style={{ position: "relative" }}>
                          <Lock size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                          <input
                            type="password"
                            placeholder="Password"
                            className="input-field"
                            style={{ paddingLeft: "2.5rem" }}
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            required
                          />
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                          <Link href="/forgot-password" onClick={() => setShowLoginDropdown(false)} style={{ fontSize: "0.75rem", color: "var(--accent-color)", textDecoration: "none", fontWeight: "500" }}>
                            Forgot password?
                          </Link>
                        </div>
                        <button type="submit" className="btn-primary" disabled={loginLoading} style={{ marginTop: "0.5rem", padding: "0.5rem" }}>
                          {loginLoading ? "Signing in..." : "Sign In"}
                        </button>
                      </form>
                      <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                        Don't have an account? <Link href="/register" style={{ fontWeight: "600" }}>Sign up</Link>
                      </p>
                    </div>
                  )}
                </div>
                <Link href="/register" className="btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.875rem", textDecoration: "none" }}>Sign up</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        
        {/* HERO SECTION */}
        <div style={{ 
          width: "100%", 
          background: "linear-gradient(135deg, #1e3a8a 0%, #06b6d4 100%)",
          padding: "5rem 1rem 6rem",
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center"
        }}>
          <div style={{ textAlign: "center", marginBottom: "3rem", maxWidth: "800px" }}>
            <h1 style={{ fontSize: "3.5rem", fontWeight: "800", marginBottom: "1rem", lineHeight: "1.2", color: "#fff" }}>
              Convert Your Files Instantly
            </h1>
            <p style={{ fontSize: "1.25rem", color: "rgba(255,255,255,0.9)" }}>
              Convert your documents in seconds. Transform your files instantly. Drag, drop, and download for free.
            </p>
          </div>

          <div className="glass-panel animate-fade-in animate-delay-1" style={{ width: "100%", maxWidth: "900px", padding: "2.5rem", background: "var(--bg-surface)", borderRadius: "var(--radius-xl)", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          {/* Options row */}
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
            {[
              { id: "pdf-to-word", label: "PDF to Word" },
              { id: "word-to-pdf", label: "Word to PDF" },
              { id: "pdf-to-jpg", label: "PDF to JPG" },
              { id: "pdf-ocr", label: "PDF OCR" },
              { id: "word-to-excel", label: "Word to Excel" },
              { id: "word-to-ppt", label: "Word to PPT" },
            ].map(opt => (
              <Link
                key={opt.id}
                href={`/dashboard/${opt.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  setConversionType(opt.id as ConversionType);
                  window.history.pushState({}, '', `/dashboard/${opt.id}`);
                }}
                style={{
                  padding: "0.75rem 1.5rem",
                  borderRadius: "var(--radius-xl)",
                  border: `2px solid ${conversionType === opt.id ? "var(--accent-color)" : "var(--border-color)"}`,
                  background: conversionType === opt.id ? "rgba(99, 102, 241, 0.1)" : "transparent",
                  color: conversionType === opt.id ? "var(--accent-color)" : "var(--text-primary)",
                  fontWeight: "600",
                  transition: "all 0.2s ease",
                  textDecoration: "none",
                }}
              >
                {opt.label}
              </Link>
            ))}
          </div>

          {/* Drag and Drop Zone */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? "var(--accent-color)" : "var(--border-color)"}`,
              borderRadius: "var(--radius-lg)",
              padding: "4rem 2rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "1rem",
              background: isDragging ? "rgba(99, 102, 241, 0.05)" : "var(--bg-base)",
              cursor: "pointer",
              transition: "all 0.3s ease"
            }}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: "none" }} 
              onChange={handleFileChange}
            />
            
            <div style={{ transition: "transform 0.3s ease", transform: isDragging ? "scale(1.1)" : "scale(1)" }}>
              {getFileIcon()}
            </div>
            
            {file ? (
              <div style={{ textAlign: "center" }}>
                <p style={{ fontWeight: "600", fontSize: "1.125rem", color: "var(--text-primary)" }}>{file.name}</p>
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div style={{ textAlign: "center" }}>
                <p style={{ fontWeight: "600", fontSize: "1.25rem", color: "var(--text-primary)" }}>
                  Click to browse or drag file here
                </p>
                <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
                  Supported formats: PDF, DOCX, JPG, PNG, and more
                </p>
              </div>
            )}
          </div>

          {/* Action Area */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            {status === "idle" && file && (
              <button onClick={handleConvert} className="btn-primary animate-fade-in" style={{ padding: "1rem 3rem", fontSize: "1.125rem" }}>
                <Settings size={20} /> Convert Now
              </button>
            )}

            {(status === "uploading" || status === "converting") && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                <Loader2 size={32} color="var(--accent-color)" className="animate-spin" style={{ animation: "spin 2s linear infinite" }} />
                <p style={{ fontWeight: "600", color: "var(--accent-color)" }}>
                  {status === "uploading" ? "Uploading file..." : "Converting document..."}
                </p>
              </div>
            )}

            {status === "success" && downloadUrl && (
              <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", width: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--success)" }}>
                  <CheckCircle2 size={24} />
                  <span style={{ fontWeight: "600", fontSize: "1.125rem" }}>Conversion Complete!</span>
                </div>
                <a 
                  href={downloadUrl} 
                  download={downloadFilename}
                  className="btn-primary" 
                  style={{ width: "100%", maxWidth: "300px", padding: "1rem", background: "var(--success)", boxShadow: "0 0 15px rgba(16, 185, 129, 0.3)" }}
                >
                  <FileDown size={20} /> Download File
                </a>
                <button onClick={() => { setFile(null); setStatus("idle"); }} style={{ color: "var(--text-secondary)", fontSize: "0.875rem", textDecoration: "underline", marginTop: "0.5rem" }}>
                  Convert another file
                </button>
              </div>
            )}

            {status === "error" && (
              <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "1rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--error)", borderRadius: "var(--radius-md)", width: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--error)" }}>
                  <AlertCircle size={20} />
                  <span style={{ fontWeight: "600" }}>{errorMessage}</span>
                </div>
                <button onClick={() => setStatus("idle")} className="btn-secondary">Try Again</button>
              </div>
            )}
          </div>

          {/* Trust Badges */}
          <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginTop: "1rem", flexWrap: "wrap", color: "var(--text-secondary)", fontSize: "0.875rem", fontWeight: "500" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><CheckCircle2 size={16} color="var(--success)" /> Trusted by millions of users</div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><CheckCircle2 size={16} color="var(--success)" /> Free converter—no installation needed</div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><CheckCircle2 size={16} color="var(--success)" /> Safe and Secure</div>
          </div>
        </div>
      </div>

      {/* FEATURES GRID */}
        <section style={{ padding: "6rem 2rem", background: "var(--bg-base)", display: "flex", justifyContent: "center" }}>
          <div style={{ maxWidth: "1200px", width: "100%", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "4rem" }}>
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(99, 102, 241, 0.1)", color: "var(--accent-color)", display: "flex", alignItems: "center", justifyContent: "center" }}><Lightbulb size={32} /></div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "700" }}>Conversion Without the Hassle</h3>
              <p style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>No software to download or install, no signup required. Just drop your file into the box above and convert instantly.</p>
            </div>
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(99, 102, 241, 0.1)", color: "var(--accent-color)", display: "flex", alignItems: "center", justifyContent: "center" }}><Award size={32} /></div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "700" }}>Intuitive Interface</h3>
              <p style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>ConvertDoctor is designed to be simple for everyone. Converting files shouldn't require technical knowledge.</p>
            </div>
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(99, 102, 241, 0.1)", color: "var(--accent-color)", display: "flex", alignItems: "center", justifyContent: "center" }}><ThumbsUp size={32} /></div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "700" }}>High-Quality Output</h3>
              <p style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>Our converter delivers high-resolution results that look great. Find out how to convert files without losing quality.</p>
            </div>
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(99, 102, 241, 0.1)", color: "var(--accent-color)", display: "flex", alignItems: "center", justifyContent: "center" }}><Lock size={32} /></div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "700" }}>Works on Any Platform</h3>
              <p style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>This converter is fully browser-based. Convert files easily on Mac, Windows, Linux, iOS, or Android.</p>
            </div>
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(99, 102, 241, 0.1)", color: "var(--accent-color)", display: "flex", alignItems: "center", justifyContent: "center" }}><Layers size={32} /></div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "700" }}>Convert More Than Just PDFs</h3>
              <p style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>Need to convert other file types? We let you seamlessly convert between PDF, Word, JPG, and other formats.</p>
            </div>
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(99, 102, 241, 0.1)", color: "var(--accent-color)", display: "flex", alignItems: "center", justifyContent: "center" }}><ShieldCheck size={32} /></div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "700" }}>Safe & Secure at Every Step</h3>
              <p style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>Advanced TLS encryption protects your files during transfer. All documents are automatically deleted after processing.</p>
            </div>
          </div>
        </section>

        {/* ARTICLES/GUIDES */}
        <section style={{ padding: "4rem 2rem 6rem", background: "var(--bg-surface)", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ maxWidth: "1200px", width: "100%" }}>
            <h2 style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "3rem", color: "var(--text-primary)" }}>Image Editing Tips and File Format Guides</h2>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "2rem" }}>
              {/* Card 1 */}
              <div style={{ background: "var(--bg-base)", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border-color)", transition: "transform 0.2s ease" }}>
                <div style={{ height: "200px", background: "#e2e8f0" }}>
                  <img src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=800" style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Editing tips" />
                </div>
                <div style={{ padding: "1.5rem" }}>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "1rem" }}>How to Resize an Image Without Losing Quality</h3>
                  <p style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>Say goodbye to blurry, pixelated images forever, and explore the art of resizing images without losing quality. Your visuals deserve to look their best.</p>
                </div>
              </div>

              {/* Card 2 */}
              <div style={{ background: "var(--bg-base)", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border-color)", transition: "transform 0.2s ease" }}>
                <div style={{ height: "200px", background: "#e2e8f0" }}>
                  <img src="https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=800" style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="File formats" />
                </div>
                <div style={{ padding: "1.5rem" }}>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "1rem" }}>PNG vs JPG vs PDF: Why Image Format Matters</h3>
                  <p style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>Here, we provide helpful insights to assist you in distinguishing JPG vs JPEG, PNG vs JPEG, PDF vs PNG, and everything in-between.</p>
                </div>
              </div>

              {/* Card 3 */}
              <div style={{ background: "var(--bg-base)", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border-color)", transition: "transform 0.2s ease" }}>
                <div style={{ height: "200px", background: "#e2e8f0" }}>
                  <img src="https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&q=80&w=800" style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Vector vs Raster" />
                </div>
                <div style={{ padding: "1.5rem" }}>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "1rem" }}>Raster vs. Vector Files: Key Differences</h3>
                  <p style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>With so many digital images to choose from online, which file format is ideal—raster or vector? Discover everything you need to know in our guide.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(4px)"
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: "100%", maxWidth: "400px", padding: "2rem", position: "relative" }}>
            <button 
              onClick={() => { setIsProfileModalOpen(false); setIsEditingProfile(false); setProfileSuccess(false); setProfileError(""); }}
              style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "transparent", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}
            >
              <X size={20} />
            </button>
            
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <User /> Your Profile
            </h2>

            {profileSuccess && (
              <div style={{ padding: "0.75rem", backgroundColor: "rgba(34, 197, 94, 0.1)", border: "1px solid var(--success)", color: "var(--success)", borderRadius: "var(--radius-md)", fontSize: "0.875rem", marginBottom: "1rem" }}>
                Profile updated successfully!
              </div>
            )}

            {profileError && (
              <div style={{ padding: "0.75rem", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--error)", color: "var(--error)", borderRadius: "var(--radius-md)", fontSize: "0.875rem", marginBottom: "1rem" }}>
                {profileError}
              </div>
            )}

            <form onSubmit={handleProfileUpdate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Full Name</label>
                <input 
                  type="text" 
                  value={profileData.name} 
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  className="input-field" 
                  disabled={!isEditingProfile} 
                />
              </div>
              
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Username</label>
                <input 
                  type="text" 
                  value={profileData.username} 
                  onChange={(e) => setProfileData({...profileData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')})}
                  className="input-field" 
                  disabled={!isEditingProfile} 
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Email Address</label>
                <input 
                  type="email" 
                  value={profileData.email} 
                  onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  className="input-field" 
                  disabled={!isEditingProfile} 
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Phone Number</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <div ref={dropdownRef} style={{ position: "relative", flex: 3, minWidth: 0 }}>
                    <div 
                      className={`input-field ${!isEditingProfile ? "opacity-50 cursor-not-allowed" : ""}`}
                      tabIndex={isEditingProfile ? 0 : -1}
                      style={{ 
                        display: "flex", alignItems: "center", cursor: isEditingProfile ? "pointer" : "not-allowed", 
                        paddingLeft: "0.75rem", paddingRight: "0.75rem", 
                        height: "100%", width: "100%", outline: "none",
                        backgroundColor: !isEditingProfile ? "rgba(0,0,0,0.05)" : "transparent"
                      }}
                      onClick={() => isEditingProfile && setIsDropdownOpen(!isDropdownOpen)}
                      onKeyDown={(e) => {
                        if (!isEditingProfile) return;
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setIsDropdownOpen(!isDropdownOpen);
                        } else if (isDropdownOpen && e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
                          const letter = e.key.toLowerCase();
                          const match = countries.find(c => c.name.toLowerCase().startsWith(letter));
                          if (match) {
                            const el = document.getElementById(`profile-country-${match.code}`);
                            if (el) {
                              el.scrollIntoView({ block: 'nearest' });
                            }
                          }
                        }
                      }}
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
                    
                    {isDropdownOpen && isEditingProfile && (
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
                            id={`profile-country-${c.code}`}
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
                            <span style={{ flex: 1, fontSize: "0.875rem" }}>{c.name}</span>
                            <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginLeft: "0.5rem" }}>{c.dialCode}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <input
                    type="tel"
                    placeholder="Phone number"
                    className="input-field"
                    style={{ flex: 4, minWidth: 0 }}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    disabled={!isEditingProfile}
                    required
                  />
                </div>
              </div>

              <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                {isEditingProfile ? (
                  <>
                    <button type="button" className="btn-secondary" onClick={() => setIsEditingProfile(false)} disabled={profileLoading}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary" disabled={profileLoading}>
                      {profileLoading ? <Loader2 size={16} className="animate-spin" /> : "Save Changes"}
                    </button>
                  </>
                ) : (
                  <button type="button" className="btn-primary" onClick={() => setIsEditingProfile(true)}>
                    Edit Profile
                  </button>
                )}
              </div>
            </form>
            {localUser && (
              <div style={{ padding: "1rem 0 0", borderTop: "1px solid var(--border-color)", marginTop: "1rem" }}>
                <button type="button" className="btn-secondary" style={{ width: "100%", padding: "0.5rem" }} onClick={() => signOut()}>Sign Out</button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
