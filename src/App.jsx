import { useCallback, useEffect, useMemo, useState } from "react";
import { api, clearToken, getToken, saveToken } from "./services/api";

const NAV = [
  { id: "dashboard", label: "Overview", icon: "▦", group: "WORKSPACE" },
  { id: "classrooms", label: "Classrooms", icon: "▤", group: "WORKSPACE" },
  { id: "readiness-checks", label: "Readiness checks", icon: "✓", group: "WORKSPACE" },
  { id: "issue-reports", label: "Issue reports", icon: "⚑", group: "WORKSPACE" },
  { id: "users", label: "User management", icon: "♙", group: "ADMINISTRATION", admin: true },
];
const emptyClassroom = { room_code: "", building: "", floor: "", capacity: 40, notes: "" };
const emptyCheck = { classroom_id: "", checked_at: new Date().toISOString().slice(0, 10), cleanliness: "good", chairs: "good", lights: "good", fans: "good", equipment: "good", notes: "" };
const emptyIssue = { classroom_id: "", title: "", description: "", category: "other", priority: "medium", status: "reported", resolution_notes: "" };
const emptyUser = { name: "", email: "", role: "teacher", password: "" };

function App() {
  const [token, setToken] = useState(getToken());
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [dashboard, setDashboard] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [checks, setChecks] = useState([]);
  const [issues, setIssues] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [editingId, setEditingId] = useState(null);

  const notifyError = (e) => { setError(e?.message || "Something went wrong."); setNotice(""); };
  const notifySuccess = (message) => { setNotice(message); setError(""); };

  const loadCore = useCallback(async () => {
    if (!getToken()) return;
    setLoading(true);
    setError("");
    try {
      const [me, rooms, readiness, reports, stats] = await Promise.all([
        api("/me"), api("/classrooms?per_page=100"), api("/readiness-checks?per_page=100"),
        api("/issue-reports?per_page=100"), api("/dashboard"),
      ]);
      setUser(me.user);
      setClassrooms(rooms.data || []);
      setChecks(readiness.data || []);
      setIssues(reports.data || []);
      setDashboard(stats);
      if (me.user.role === "admin") {
        const people = await api("/users?per_page=100");
        setUsers(people.data || []);
      } else {
        setUsers([]);
      }
    } catch (e) {
      clearToken(); setToken(null); setUser(null); notifyError(e);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (token) { void Promise.resolve().then(loadCore); } }, [token, loadCore]);

  async function login(event) {
    event.preventDefault(); setLoading(true); setError("");
    const fd = new FormData(event.currentTarget);
    try {
      const result = await api("/login", { method: "POST", body: JSON.stringify({ email: fd.get("email"), password: fd.get("password") }) });
      saveToken(result.token); setToken(result.token); setUser(result.user); notifySuccess("Welcome back.");
    } catch (e) { notifyError(e); }
    finally { setLoading(false); }
  }

  async function logout() {
    try { await api("/logout", { method: "POST" }); } catch (e) { console.warn("Logout request failed", e); }
    clearToken(); setToken(null); setUser(null); setDashboard(null); setPage("dashboard");
  }

  function openCreate(type) {
    const defaults = type === "classrooms" ? emptyClassroom : type === "readiness-checks" ? { ...emptyCheck, classroom_id: classrooms[0]?.id || "" } : type === "issue-reports" ? { ...emptyIssue, classroom_id: classrooms[0]?.id || "" } : emptyUser;
    setModal(type); setForm(defaults); setEditingId(null); setError(""); setNotice("");
  }
  function openEdit(type, item) {
    let values = { ...item };
    if (type === "readiness-checks") values = { ...item, classroom_id: item.classroom_id, checked_at: item.checked_at || new Date().toISOString().slice(0, 10) };
    if (type === "issue-reports") values = { ...item, classroom_id: item.classroom_id };
    if (type === "users") values = { name: item.name, email: item.email, role: item.role, password: "" };
    setModal(type); setForm(values); setEditingId(item.id); setError(""); setNotice("");
  }
  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  async function submitForm(event) {
    event.preventDefault(); setLoading(true); setError("");
    try {
      const type = modal;
      const base = type === "classrooms" ? "classrooms" : type === "readiness-checks" ? "readiness-checks" : type === "issue-reports" ? "issue-reports" : "users";
      const payload = { ...form };
      if (type === "users" && !payload.password) delete payload.password;
      const path = `/${base}${editingId ? `/${editingId}` : ""}`;
      await api(path, { method: editingId ? "PUT" : "POST", body: JSON.stringify(payload) });
      setModal(null); notifySuccess(`${type.replaceAll("-", " ")} ${editingId ? "updated" : "created"} successfully.`);
      await loadCore();
    } catch (e) { notifyError(e); }
    finally { setLoading(false); }
  }

  async function removeItem(type, item) {
    if (!window.confirm(`Delete ${item.room_code || item.title || item.name || "this record"}? This cannot be undone.`)) return;
    const base = type === "classrooms" ? "classrooms" : type === "readiness-checks" ? "readiness-checks" : type === "issue-reports" ? "issue-reports" : "users";
    try { await api(`/${base}/${item.id}`, { method: "DELETE" }); notifySuccess("Record deleted."); await loadCore(); }
    catch (e) { notifyError(e); }
  }

  const currentNav = NAV.find((item) => item.id === page) || NAV[0];
  const visibleNav = NAV.filter((item) => !item.admin || user?.role === "admin");
  const filteredRooms = useMemo(() => classrooms.filter((r) => `${r.room_code} ${r.building} ${r.floor || ""}`.toLowerCase().includes(search.toLowerCase())), [classrooms, search]);
  const filteredChecks = useMemo(() => checks.filter((r) => `${r.classroom?.room_code || ""} ${r.inspector?.name || ""}`.toLowerCase().includes(search.toLowerCase()) && (filter === "all" || r.status === filter)), [checks, search, filter]);
  const filteredIssues = useMemo(() => issues.filter((r) => `${r.title} ${r.classroom?.room_code || ""} ${r.description}`.toLowerCase().includes(search.toLowerCase()) && (filter === "all" || r.status === filter)), [issues, search, filter]);

  if (!token || !user) return <Login onSubmit={login} loading={loading} error={error} />;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">CR</div><div><strong>ClassReady</strong><span>FACILITY MONITORING</span></div></div>
        {["WORKSPACE", "ADMINISTRATION"].map((group) => <div key={group}><p className="nav-group">{group}</p>{visibleNav.filter((n) => n.group === group).map((n) => <button key={n.id} className={`nav-link ${page === n.id ? "active" : ""}`} onClick={() => { setPage(n.id); setSearch(""); setFilter("all"); setNotice(""); setError(""); }}><span className="nav-icon">{n.icon}</span>{n.label}{n.id === "issue-reports" && issues.filter((i) => i.status !== "resolved").length > 0 && <span className="nav-badge">{issues.filter((i) => i.status !== "resolved").length}</span>}</button>)}</div>)}
        <div className="sidebar-bottom"><div className="help-card"><span className="help-mark">?</span><strong>Keep classrooms ready</strong><p>Log inspections and track maintenance issues in one place.</p></div><div className="profile"><div className="avatar">{initials(user.name)}</div><div className="profile-copy"><strong>{user.name}</strong><span>{user.role === "admin" ? "Administrator" : "Teacher / Inspector"}</span></div><button className="logout-mini" onClick={logout} title="Sign out">↗</button></div></div>
      </aside>
      <main className="main-area">
        <header className="topbar"><div className="crumb">Workspace <span>/</span> <strong>{currentNav.label}</strong></div><div className="top-actions"><span className="online-dot">● API connected</span><div className="avatar small">{initials(user.name)}</div><button className="signout" onClick={logout}>Sign out</button></div></header>
        <div className="content">
          <div className="page-heading"><div><p className="eyebrow">SCHOOL FACILITIES · MANAGEMENT</p><h1>{currentNav.id === "dashboard" ? "Good day, " + user.name.split(" ")[0] : currentNav.label}</h1><p className="subtitle">{pageSubtitle(page)}</p></div><div className="academic-chip"><span>◷</span> Academic Year 2026–2027</div></div>
          {notice && <div className="alert success">{notice}<button onClick={() => setNotice("")}>×</button></div>}
          {error && <div className="alert error">{error}<button onClick={() => setError("")}>×</button></div>}
          {loading && <div className="loading-line"><span /> Syncing records with the API…</div>}
          {page === "dashboard" && <Dashboard dashboard={dashboard} checks={checks} issues={issues} onNavigate={setPage} />}
          {page === "classrooms" && <DataSection title="Classrooms" description="Manage learning spaces and their capacity." count={classrooms.length} onAdd={() => openCreate("classrooms")} addLabel="Add classroom" search={search} setSearch={setSearch}><ClassroomTable rows={filteredRooms} onEdit={(r) => openEdit("classrooms", r)} onDelete={(r) => removeItem("classrooms", r)} /></DataSection>}
          {page === "readiness-checks" && <DataSection title="Readiness inspections" description="Record cleanliness, furniture, lighting, fans, and equipment." count={checks.length} onAdd={() => openCreate("readiness-checks")} addLabel="New inspection" search={search} setSearch={setSearch} filter={<select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All statuses</option><option value="ready">Ready</option><option value="needs_attention">Needs attention</option></select>}><ChecksTable rows={filteredChecks} onEdit={(r) => openEdit("readiness-checks", r)} onDelete={(r) => removeItem("readiness-checks", r)} /></DataSection>}
          {page === "issue-reports" && <DataSection title="Issue reports" description="Report facility problems and follow their resolution status." count={issues.length} onAdd={() => openCreate("issue-reports")} addLabel="Report an issue" search={search} setSearch={setSearch} filter={<select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All statuses</option><option value="reported">Reported</option><option value="assigned">Assigned</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option></select>}><IssuesTable rows={filteredIssues} onEdit={(r) => openEdit("issue-reports", r)} onDelete={(r) => removeItem("issue-reports", r)} /></DataSection>}
          {page === "users" && user.role === "admin" && <DataSection title="User management" description="Create accounts and assign access roles." count={users.length} onAdd={() => openCreate("users")} addLabel="Add user" search={search} setSearch={setSearch}><UsersTable rows={users.filter((u) => `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(search.toLowerCase()))} onEdit={(u) => openEdit("users", u)} onDelete={(u) => removeItem("users", u)} /></DataSection>}
          <footer className="footer"><span>© 2026 ClassReady</span><span>Classroom Readiness Monitoring & Issue Reporting System</span><span><i /> Connected to Laravel API</span></footer>
        </div>
      </main>
      {modal && <RecordModal type={modal} form={form} setField={setField} classrooms={classrooms} onClose={() => setModal(null)} onSubmit={submitForm} loading={loading} editing={Boolean(editingId)} />}
    </div>
  );
}

function Login({ onSubmit, loading, error }) {
  return <div className="login-page"><div className="login-visual"><div className="login-brand"><div className="brand-mark">CR</div><div><strong>ClassReady</strong><span>FACILITY MONITORING</span></div></div><div className="login-message"><span className="welcome-tag">A BETTER WAY TO PREPARE</span><h1>Every classroom,<br /><em>ready to learn.</em></h1><p>Keep track of inspections, classroom conditions, and maintenance issues from one simple workspace.</p><div className="visual-building"><div className="sun" /><div className="building b1"><i /><i /><i /><i /><i /><i /></div><div className="building b2"><i /><i /><i /><i /><i /><i /><i /><i /></div><div className="grass" /></div></div><span className="login-foot">CLASSROOM READINESS MONITORING SYSTEM</span></div><div className="login-panel"><div className="login-card"><p className="eyebrow">WELCOME BACK</p><h2>Sign in to ClassReady</h2><p className="login-subtitle">Enter your school account to continue.</p>{error && <div className="alert error">{error}</div>}<form onSubmit={onSubmit}><label>Email address<input name="email" type="email" placeholder="you@school.edu" required autoComplete="username" /></label><label>Password<input name="password" type="password" placeholder="Enter your password" required autoComplete="current-password" /></label><button className="primary-button wide" disabled={loading}>{loading ? "Signing in…" : "Sign in"} <span>→</span></button></form><div className="demo-accounts"><strong>Demo access</strong><p><b>Admin</b> admin@classready.test / Admin12345!</p><p><b>Teacher</b> teacher@classready.test / Teacher12345!</p></div></div></div></div>;
}

function Dashboard({ dashboard, checks, issues, onNavigate }) {
  const stats = dashboard?.stats || {};
  const cards = [
    { label: "Total classrooms", value: stats.classrooms ?? "—", note: "Registered learning spaces", icon: "▤", tone: "blue" },
    { label: "Ready for classes", value: stats.ready ?? "—", note: "Latest inspection is ready", icon: "✓", tone: "green" },
    { label: "Need attention", value: stats.needs_attention ?? "—", note: "Latest inspection flagged", icon: "⚠", tone: "amber" },
    { label: "Open issues", value: stats.open_issues ?? "—", note: `${stats.resolved_issues ?? 0} resolved so far`, icon: "⚑", tone: "rose" },
  ];
  return <><section className="hero-banner"><div className="hero-copy"><span className="welcome-tag">✦ YOUR FACILITIES AT A GLANCE</span><h2>Every classroom,<br /><em>ready to learn.</em></h2><p>Keep track of what is ready and what needs attention. Every inspection helps create a better learning space.</p><button className="hero-button" onClick={() => onNavigate("readiness-checks")}>View readiness checks <span>→</span></button></div><div className="hero-art" aria-hidden="true"><div className="hero-sun" /><div className="hero-building back"><i /><i /><i /><i /></div><div className="hero-building front"><i /><i /><i /><i /><i /><i /><i /><i /></div><div className="hero-ground" /><div className="hero-plant">✳</div></div></section><div className="stats-grid">{cards.map((c) => <article className="stat-card" key={c.label}><div className={`stat-icon ${c.tone}`}>{c.icon}</div><span>{c.label}</span><strong>{c.value}</strong><small>{c.note}</small></article>)}</div><div className="dashboard-grid"><section className="panel"><div className="panel-heading"><div><h3>Recent inspections</h3><p>Latest classroom readiness checks</p></div><button className="text-button" onClick={() => onNavigate("readiness-checks")}>View all →</button></div>{checks.slice(0, 5).length ? <div className="recent-list">{checks.slice(0, 5).map((r) => <div className="recent-row" key={r.id}><div className="recent-icon">✓</div><div className="recent-main"><strong>{r.classroom?.room_code || "Classroom"}</strong><span>{r.inspector?.name || "Inspector"} · {r.checked_at}</span></div><Status value={r.status} /></div>)}</div> : <EmptyState text="No inspections yet. Create the first readiness check." />}</section><section className="panel"><div className="panel-heading"><div><h3>Latest issue reports</h3><p>Facility concerns that need follow-up</p></div><button className="text-button" onClick={() => onNavigate("issue-reports")}>View all →</button></div>{issues.slice(0, 5).length ? <div className="recent-list">{issues.slice(0, 5).map((r) => <div className="recent-row" key={r.id}><div className="recent-icon issue">!</div><div className="recent-main"><strong>{r.title}</strong><span>{r.classroom?.room_code || "Classroom"} · {r.priority} priority</span></div><Status value={r.status} /></div>)}</div> : <EmptyState text="No issue reports yet." />}</section></div></>;
}

function DataSection({ title, description, count, onAdd, addLabel, search, setSearch, filter, children }) {
  return <section className="data-section"><div className="section-heading"><div><h2>{title}</h2><p>{description}</p></div><button className="primary-button" onClick={onAdd}>＋ {addLabel}</button></div><div className="table-toolbar"><label className="search-control"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search records…" /></label>{filter}<span className="record-count">{count} total records</span></div><div className="table-wrap">{children}</div></section>;
}

function ClassroomTable({ rows, onEdit, onDelete }) {
  if (!rows.length) return <EmptyState text="No classrooms found. Add your first classroom." />;
  return <table><thead><tr><th>Room</th><th>Building / Floor</th><th>Capacity</th><th>Inspections</th><th>Issues</th><th>Actions</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id}><td><strong className="room-code">{r.room_code}</strong><small className="cell-sub">{r.notes || "Classroom"}</small></td><td>{r.building}<small className="cell-sub">{r.floor || "Floor not set"}</small></td><td>{r.capacity} students</td><td>{r.readiness_checks_count ?? 0}</td><td>{r.issue_reports_count ?? 0}</td><td><Actions onEdit={() => onEdit(r)} onDelete={() => onDelete(r)} /></td></tr>)}</tbody></table>;
}
function ChecksTable({ rows, onEdit, onDelete }) {
  if (!rows.length) return <EmptyState text="No readiness checks match your search." />;
  return <table><thead><tr><th>Classroom</th><th>Inspection date</th><th>Inspector</th><th>Condition</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id}><td><strong>{r.classroom?.room_code || `Room #${r.classroom_id}`}</strong><small className="cell-sub">{r.classroom?.building || ""}</small></td><td>{r.checked_at}</td><td>{r.inspector?.name || "—"}</td><td><span className="condition">{["cleanliness", "chairs", "lights", "fans", "equipment"].filter((k) => r[k] !== "good").length ? `${["cleanliness", "chairs", "lights", "fans", "equipment"].filter((k) => r[k] !== "good").length} flagged item(s)` : "All good"}</span></td><td><Status value={r.status} /></td><td><Actions onEdit={() => onEdit(r)} onDelete={() => onDelete(r)} /></td></tr>)}</tbody></table>;
}
function IssuesTable({ rows, onEdit, onDelete }) {
  if (!rows.length) return <EmptyState text="No issue reports match your search." />;
  return <table><thead><tr><th>Issue</th><th>Classroom</th><th>Category</th><th>Priority</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id}><td><strong>{r.title}</strong><small className="cell-sub description-cell">{r.description}</small></td><td>{r.classroom?.room_code || `Room #${r.classroom_id}`}</td><td><span className="capitalize">{r.category}</span></td><td><span className={`priority ${r.priority}`}>{r.priority}</span></td><td><Status value={r.status} /></td><td><Actions onEdit={() => onEdit(r)} onDelete={() => onDelete(r)} /></td></tr>)}</tbody></table>;
}
function UsersTable({ rows, onEdit, onDelete }) {
  if (!rows.length) return <EmptyState text="No users found." />;
  return <table><thead><tr><th>Name</th><th>Email address</th><th>Role</th><th>Actions</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id}><td><div className="user-cell"><div className="avatar">{initials(r.name)}</div><strong>{r.name}</strong></div></td><td>{r.email}</td><td><span className={`role-pill ${r.role}`}>{r.role}</span></td><td><Actions onEdit={() => onEdit(r)} onDelete={() => onDelete(r)} /></td></tr>)}</tbody></table>;
}
function Actions({ onEdit, onDelete }) { return <div className="row-actions"><button onClick={onEdit} title="Edit record">Edit</button><button className="delete-action" onClick={onDelete} title="Delete record">Delete</button></div>; }
function Status({ value }) { const labels = { ready: "Ready", needs_attention: "Needs attention", reported: "Reported", assigned: "Assigned", in_progress: "In progress", resolved: "Resolved" }; return <span className={`status-pill ${value || "reported"}`}><i />{labels[value] || value}</span>; }
function EmptyState({ text }) { return <div className="empty-state"><span>▤</span><strong>Nothing to show yet</strong><p>{text}</p></div>; }
function RecordModal({ type, form, setField, classrooms, onClose, onSubmit, loading, editing }) {
  const title = type === "classrooms" ? "Classroom" : type === "readiness-checks" ? "Readiness inspection" : type === "issue-reports" ? "Issue report" : "User account";
  return <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><section className="modal-card"><header className="modal-heading"><div><p className="eyebrow">{editing ? "UPDATE RECORD" : "NEW RECORD"}</p><h2>{editing ? "Edit " : "Create "}{title}</h2></div><button className="close-button" onClick={onClose} aria-label="Close">×</button></header><form onSubmit={onSubmit}><div className="modal-fields">
    {type === "classrooms" && <><Field label="Room code" value={form.room_code} onChange={(v) => setField("room_code", v)} required placeholder="e.g. ROOM-101" /><Field label="Building" value={form.building} onChange={(v) => setField("building", v)} required placeholder="Main Building" /><Field label="Floor" value={form.floor} onChange={(v) => setField("floor", v)} placeholder="1st Floor" /><Field label="Capacity" type="number" value={form.capacity} onChange={(v) => setField("capacity", v)} required /><Field label="Notes" value={form.notes} onChange={(v) => setField("notes", v)} wide placeholder="Optional details" /></>}
    {type === "readiness-checks" && <><SelectField label="Classroom" value={form.classroom_id} onChange={(v) => setField("classroom_id", v)} options={classrooms.map((c) => [c.id, `${c.room_code} · ${c.building}`])} required /><Field label="Inspection date" type="date" value={form.checked_at} onChange={(v) => setField("checked_at", v)} required />{["cleanliness", "chairs", "lights", "fans", "equipment"].map((key) => <SelectField key={key} label={key[0].toUpperCase() + key.slice(1)} value={form[key]} onChange={(v) => setField(key, v)} options={[["good", "Good"], ["needs_attention", "Needs attention"], ["poor", "Poor"]]} required />)}<Field label="Inspection notes" value={form.notes} onChange={(v) => setField("notes", v)} wide /></>}
    {type === "issue-reports" && <><SelectField label="Classroom" value={form.classroom_id} onChange={(v) => setField("classroom_id", v)} options={classrooms.map((c) => [c.id, `${c.room_code} · ${c.building}`])} required /><Field label="Issue title" value={form.title} onChange={(v) => setField("title", v)} required placeholder="e.g. Ceiling fan not working" /><SelectField label="Category" value={form.category} onChange={(v) => setField("category", v)} options={["cleanliness", "furniture", "electrical", "equipment", "safety", "other"].map((v) => [v, cap(v)])} required /><SelectField label="Priority" value={form.priority} onChange={(v) => setField("priority", v)} options={["low", "medium", "high", "urgent"].map((v) => [v, cap(v)])} required /><SelectField label="Status" value={form.status} onChange={(v) => setField("status", v)} options={[["reported", "Reported"], ["assigned", "Assigned"], ["in_progress", "In progress"], ["resolved", "Resolved"]]} required /><Field label="Description" value={form.description} onChange={(v) => setField("description", v)} required wide textarea placeholder="Describe the problem and its impact…" /><Field label="Resolution notes" value={form.resolution_notes} onChange={(v) => setField("resolution_notes", v)} wide placeholder="Optional repair or follow-up notes" /></>}
    {type === "users" && <><Field label="Full name" value={form.name} onChange={(v) => setField("name", v)} required /><Field label="Email address" type="email" value={form.email} onChange={(v) => setField("email", v)} required /><SelectField label="Role" value={form.role} onChange={(v) => setField("role", v)} options={[["teacher", "Teacher / Inspector"], ["admin", "Administrator"]]} required /><Field label={editing ? "New password (optional)" : "Temporary password"} type="password" value={form.password} onChange={(v) => setField("password", v)} required={!editing} minLength={8} placeholder={editing ? "Leave blank to keep current password" : "At least 8 characters"} /></>}
    </div><div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={loading}>{loading ? "Saving…" : editing ? "Save changes" : "Create record"}</button></div></form></section></div>;
}
function Field({ label, value, onChange, type = "text", required = false, placeholder = "", wide = false, textarea = false, minLength }) { return <label className={`form-field ${wide ? "wide" : ""}`}>{label}{textarea ? <textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder} rows="3" /> : <input type={type} value={value ?? ""} onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)} required={required} placeholder={placeholder} minLength={minLength} min={type === "number" ? 0 : undefined} />}</label>; }
function SelectField({ label, value, onChange, options, required = false }) { return <label className="form-field">{label}<select value={value ?? ""} onChange={(e) => onChange(e.target.value)} required={required}><option value="">Choose…</option>{options.map(([v, labelText]) => <option key={v} value={v}>{labelText}</option>)}</select></label>; }
function initials(name = "") { return name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]).join("").toUpperCase() || "CR"; }
function cap(value = "") { return value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()); }
function pageSubtitle(page) { return ({ dashboard: "Monitor classroom readiness and keep every learning space on track.", classrooms: "Keep classroom details accurate and easy to find.", "readiness-checks": "Document classroom conditions before learning begins.", "issue-reports": "Track maintenance needs from report to resolution.", users: "Manage who can access the classroom monitoring system." })[page] || ""; }

export default App;
