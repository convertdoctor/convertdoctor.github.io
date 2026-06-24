"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Users, Settings, Trash2, Shield, Activity } from "lucide-react";

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
};

type Setting = {
  key: string;
  value: string;
};

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<"users" | "settings">("users");
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && (session?.user as any)?.role !== "ADMIN") {
      router.push("/dashboard");
    } else if (status === "authenticated") {
      fetchData();
    }
  }, [status, session]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, settingsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/settings")
      ]);
      if (usersRes.ok) setUsers(await usersRes.json());
      if (settingsRes.ok) setSettings(await settingsRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this user?")) return;
    
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== id));
      } else {
        const error = await res.json();
        alert(error.message || "Failed to delete user");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const changeUserRole = async (id: string, newRole: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role: newRole })
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
      } else {
        const error = await res.json();
        alert(error.message || "Failed to update role");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSetting = async (key: string, currentValue: string) => {
    const newValue = currentValue === "ENABLED" ? "DISABLED" : "ENABLED";
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: newValue })
      });
      if (res.ok) {
        setSettings(settings.map(s => s.key === key ? { ...s, value: newValue } : s));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || status === "loading") {
    return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>Loading Admin Panel...</div>;
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <header className="header-mobile" style={{ padding: "1.5rem 2rem", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Shield color="var(--accent-color)" size={28} />
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>Admin Control Panel</h1>
        </div>
        <button onClick={() => router.push("/dashboard")} className="btn-secondary" style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}>
          Back to Dashboard
        </button>
      </header>

      <main className="admin-layout-mobile" style={{ maxWidth: "1200px", margin: "0 auto", padding: "3rem 2rem", display: "flex", gap: "3rem" }}>
        {/* Sidebar */}
        <aside className="admin-sidebar-mobile" style={{ width: "250px", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <button 
            onClick={() => setActiveTab("users")}
            style={{ 
              display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem", 
              borderRadius: "0.5rem", border: "none", cursor: "pointer", fontSize: "1rem", fontWeight: "500",
              background: activeTab === "users" ? "rgba(99, 102, 241, 0.1)" : "transparent",
              color: activeTab === "users" ? "var(--accent-color)" : "var(--text-secondary)",
              transition: "all 0.2s"
            }}
          >
            <Users size={20} /> User Accounts
          </button>
          <button 
            onClick={() => setActiveTab("settings")}
            style={{ 
              display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem", 
              borderRadius: "0.5rem", border: "none", cursor: "pointer", fontSize: "1rem", fontWeight: "500",
              background: activeTab === "settings" ? "rgba(99, 102, 241, 0.1)" : "transparent",
              color: activeTab === "settings" ? "var(--accent-color)" : "var(--text-secondary)",
              transition: "all 0.2s"
            }}
          >
            <Settings size={20} /> System Toggles
          </button>
        </aside>

        {/* Content */}
        <div style={{ flex: 1 }} className="glass-panel">
          {activeTab === "users" && (
            <div style={{ padding: "2rem" }}>
              <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Users size={24} /> Manage Users
              </h2>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--border-color)", color: "var(--text-secondary)" }}>
                      <th style={{ padding: "1rem" }}>Username</th>
                      <th style={{ padding: "1rem" }}>Email</th>
                      <th style={{ padding: "1rem" }}>Name</th>
                      <th style={{ padding: "1rem" }}>Role</th>
                      <th style={{ padding: "1rem" }}>Joined</th>
                      <th style={{ padding: "1rem", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                        <td style={{ padding: "1rem", color: "var(--text-secondary)" }}>@{u.username || "none"}</td>
                        <td style={{ padding: "1rem", fontWeight: "500" }}>{u.email}</td>
                        <td style={{ padding: "1rem", color: "var(--text-secondary)" }}>{u.name || "N/A"}</td>
                        <td style={{ padding: "1rem" }}>
                          <select 
                            value={u.role} 
                            onChange={(e) => changeUserRole(u.id, e.target.value)}
                            disabled={u.id === (session?.user as any)?.id}
                            style={{ 
                              padding: "0.25rem 0.5rem", borderRadius: "1rem", fontSize: "0.75rem", fontWeight: "bold",
                              background: u.role === "ADMIN" ? "rgba(99, 102, 241, 0.1)" : "rgba(100, 116, 139, 0.1)",
                              color: u.role === "ADMIN" ? "var(--accent-color)" : "var(--text-secondary)",
                              border: "none", outline: "none", cursor: u.id === (session?.user as any)?.id ? "not-allowed" : "pointer"
                            }}
                          >
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </td>
                        <td style={{ padding: "1rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: "1rem", textAlign: "right" }}>
                          <button 
                            onClick={() => deleteUser(u.id)}
                            disabled={u.id === (session?.user as any)?.id}
                            style={{ 
                              background: "transparent", border: "none", cursor: u.id === (session?.user as any)?.id ? "not-allowed" : "pointer",
                              color: u.id === (session?.user as any)?.id ? "var(--border-color)" : "var(--error)",
                              padding: "0.5rem", borderRadius: "0.25rem"
                            }}
                            title="Delete User"
                          >
                            <Trash2 size={20} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div style={{ padding: "2rem" }}>
              <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Activity size={24} /> Feature Toggles
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {settings.map(s => (
                  <div key={s.key} style={{ 
                    display: "flex", justifyContent: "space-between", alignItems: "center", 
                    padding: "1.5rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)",
                    background: "var(--bg-secondary)"
                  }}>
                    <div>
                      <h3 style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "0.25rem" }}>
                        {s.key.replace("FEATURE_", "").replace(/_/g, " ")}
                      </h3>
                      <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                        Allow users to perform {s.key.replace("FEATURE_", "").replace(/_/g, " ")} conversions.
                      </p>
                    </div>
                    <button 
                      onClick={() => toggleSetting(s.key, s.value)}
                      style={{
                        padding: "0.5rem 1rem",
                        borderRadius: "var(--radius-md)",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: "bold",
                        background: s.value === "ENABLED" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                        color: s.value === "ENABLED" ? "var(--success)" : "var(--error)",
                        transition: "all 0.2s"
                      }}
                    >
                      {s.value}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
