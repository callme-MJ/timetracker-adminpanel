"use client";
import { useEffect, useState } from "react";
import "./Home.css"; // import external CSS

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://cdd468997899.ngrok-free.app";

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

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedUserName, setSelectedUserName] = useState<string>("");
  const [workdays, setWorkdays] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [from, setFrom] = useState<string | undefined>(undefined);
  const [to, setTo] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  async function loadUsers() {
    console.log("hereee");
    
    const list = await api("/users");
    console.log(list);
    
    setUsers(list || []);
    setLoading(false);
  }

  async function loadWorkdays(uid: string) {
    const qs = new URLSearchParams();
    qs.set("userId", uid);
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    qs.set("page", String(page));
    qs.set("limit", String(limit));
    const data = await api(`/time/admin/user?${qs.toString()}`);
    setWorkdays(data?.items || []);
    setTotal(data?.total || 0);
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log(token);
    
    if (!token) {
      window.location.href = "/login";
      return;
    }
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) loadWorkdays(selectedUserId);
  }, [selectedUserId, page, limit, from, to]);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <button
          className="logout-btn"
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/login";
          }}
        >
          Logout
        </button>
      </header>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <div className="dashboard-grid">
          {/* Sidebar */}
          <aside className="sidebar">
            <h3>Employees</h3>
            <ul className="user-list">
              {users.map((u) => (
                <li key={u._id}>
                  <button
                    className={`user-btn ${selectedUserId === u._id ? "active" : ""}`}
                    onClick={() => {
                      setSelectedUserId(u._id);
                      setSelectedUserName(u.name);
                      loadWorkdays(u._id);
                    }}
                  >
                    <strong>{u.name}</strong>
                    <span className="email">{u.email}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {/* Main Content */}
          <main className="main-content">
            <h3>Workdays {selectedUserName ? `for ${selectedUserName}` : ""}</h3>

            {/* Filters */}
            <div className="filters">
              <label>
                From:
                <input type="date" value={from || ""} onChange={(e) => setFrom(e.target.value || undefined)} />
              </label>
              <label>
                To:
                <input type="date" value={to || ""} onChange={(e) => setTo(e.target.value || undefined)} />
              </label>
              <label>
                Per page:
                <select
                  value={limit}
                  onChange={(e) => {
                    setPage(1);
                    setLimit(Number(e.target.value));
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </label>
              <button
                className="export-btn"
                disabled={!selectedUserId}
                onClick={async () => {
                  if (!selectedUserId) return;
                  const qs = new URLSearchParams();
                  qs.set("userId", selectedUserId);
                  if (from) qs.set("from", from);
                  if (to) qs.set("to", to);
                  const url = `${API_BASE}/time/admin/export/user?${qs.toString()}`;
                  const token = localStorage.getItem("token");
                  const res = await fetch(url, {
                    headers: { Authorization: token ? `Bearer ${token}` : "" },
                  });
                  const blob = await res.blob();
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = `workdays_${selectedUserId}.csv`;
                  a.click();
                }}
              >
                Export CSV
              </button>
            </div>

            {/* Table */}
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Total Work</th>
                    <th>Total Break</th>
                    <th>Breaks</th>
                  </tr>
                </thead>
                <tbody>
                  {workdays.map((wd) => (
                    <tr key={wd._id}>
                      <td>{wd.date}</td>
                      <td>{wd.startTime ? new Date(wd.startTime).toLocaleTimeString() : "-"}</td>
                      <td>{wd.endTime ? new Date(wd.endTime).toLocaleTimeString() : "-"}</td>
                      <td>
                        {wd.totalWorkTime
                          ? `${Math.floor(wd.totalWorkTime / 3600000)}h ${Math.floor(
                              (wd.totalWorkTime % 3600000) / 60000
                            )}m`
                          : "-"}
                      </td>
                      <td>
                        {wd.totalBreakTime
                          ? `${Math.floor(wd.totalBreakTime / 3600000)}h ${Math.floor(
                              (wd.totalBreakTime % 3600000) / 60000
                            )}m`
                          : "-"}
                      </td>
                      <td>
                        {(wd.breaks || []).map((b: any, i: number) => (
                          <div key={i}>
                            {new Date(b.start).toLocaleTimeString()} -{" "}
                            {b.end ? new Date(b.end).toLocaleTimeString() : "..."}
                          </div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Prev
              </button>
              <div>
                Page {page} / {Math.max(1, Math.ceil(total / limit))}
              </div>
              <button disabled={page >= Math.ceil(total / limit)} onClick={() => setPage((p) => p + 1)}>
                Next
              </button>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
