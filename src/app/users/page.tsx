"use client";
import { useEffect, useState } from "react";

const API_BASE = "http://localhost:4000";

async function api(path: string, options?: RequestInit) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
      ...(options?.headers || {}),
    },
  });
  if (res.status === 401) {
    window.location.href = "/login";
    return null as any;
  }
  return res.json();
}

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("EMPLOYEE");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api(`/users`);
      setUsers(data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { window.location.href = "/login"; return; }
    load();
  }, []);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api(`/users`, { method: "POST", body: JSON.stringify({ name, email, password, role }) });
      setName(""); setEmail(""); setPassword(""); setRole("EMPLOYEE");
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function deleteUser(id: string) {
    if (!confirm("Delete this user?")) return;
    setError(null);
    try {
      await api(`/users/${id}`, { method: "DELETE" });
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>User Management</h1>

      <section style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Create User</h2>
        <form onSubmit={createUser} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 12 }}>
          <input required placeholder="Name" value={name} onChange={e => setName(e.target.value)} style={{ padding: 10, border: "1px solid #d1d5db", borderRadius: 8 }} />
          <input required type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ padding: 10, border: "1px solid #d1d5db", borderRadius: 8 }} />
          <input required placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ padding: 10, border: "1px solid #d1d5db", borderRadius: 8 }} />
          <select value={role} onChange={e => setRole(e.target.value)} style={{ padding: 10, border: "1px solid #d1d5db", borderRadius: 8 }}>
            <option value="EMPLOYEE">Employee</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button type="submit" style={{ padding: "10px 16px", borderRadius: 8, background: "#2563eb", color: "#fff", border: 0, fontWeight: 600 }}>Create</button>
        </form>
      </section>

      <section style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>Users</h2>
          {loading && <span>Loading...</span>}
        </div>
        {error && <div style={{ color: "#b91c1c", marginBottom: 12 }}>Error: {error}</div>}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Name</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Email</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Role</th>
              <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{u.name}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{u.email}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{u.role}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", textAlign: "right" }}>
                  <button onClick={() => deleteUser(u._id)} style={{ padding: "6px 10px", borderRadius: 8, background: "#ef4444", color: "#fff", border: 0, fontWeight: 600 }}>Delete</button>
                </td>
              </tr>
            ))}
            {users.length === 0 && !loading && (
              <tr>
                <td colSpan={4} style={{ padding: 12, textAlign: "center", color: "#6b7280" }}>No users</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}


