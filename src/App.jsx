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
  const [authMode, setAuthMode] = useState("choose");
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
      const me = await api("/me");
      setUser(me.user);
      if (me.user.role === "admin" || me.user.is_temporary_admin) {
        const [rooms, reports, stats, readiness, people] = await Promise.all([
          api("/classrooms?per_page=100"), api("/issue-reports?per_page=100"), api("/dashboard"),
          me.user.role === "admin" ? api("/readiness-checks?per_page=100") : Promise.resolve({ data: [] }),
          me.user.role === "admin" ? api("/users?per_page=100") : Promise.resolve({ data: [] }),
        ]);
        setClassrooms(rooms.data || []); setChecks(readiness.data || []); setIssues(reports.data || []);
        setDashboard(stats); setUsers(people.data || []);
      } else {
        const [rooms, reports, stats] = await Promise.all([
          api("/classrooms?per_page=100"), api("/issue-reports?per_page=100"), api("/dashboard"),
        ]);
        setClassrooms(rooms.data || []); setChecks([]); setIssues(reports.data || []); setDashboard(stats); setUsers([]);
      }
    } catch (e) {
      clearToken(); setToken(null); setUser(null); notifyError(e);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (token) { void Promise.resolve().then(loadCore); } }, [token, loadCore]);
  useEffect(() => { if (!token) return; const id = window.setInterval(() => { if (document.visibilityState === "visible") void loadCore(); }, 30000); return () => window.clearInterval(id); }, [token, loadCore]);

  async function login(event) {
    event.preventDefault(); setLoading(true); setError("");
    const fd = new FormData(event.currentTarget);
    try {
      const result = await api("/login", {
        method: "POST",
        body: JSON.stringify({ email: fd.get("email"), password: fd.get("password"), role: authMode === "admin-login" ? "admin" : "teacher" }),
      });
      saveToken(result.token);
      setToken(result.token);
      setUser(result.user);
      notifySuccess("Welcome back.");
    } catch (e) { notifyError(e); }
    finally { setLoading(false); }
  }

  async function register(event) {
    event.preventDefault(); setLoading(true); setError("");
    const fd = new FormData(event.currentTarget);
    const password = String(fd.get("password") || "");
    const passwordConfirmation = String(fd.get("password_confirmation") || "");
    if (password !== passwordConfirmation) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }
    try {
      const result = await api("/register", {
        method: "POST",
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          password,
          password_confirmation: passwordConfirmation,
          invite_code: fd.get("invite_code"),
        }),
      });
      saveToken(result.token);
      setToken(result.token);
      setUser(result.user);
      notifySuccess("Account created successfully. Welcome to ClassReady!");
    } catch (e) { notifyError(e); }
    finally { setLoading(false); }
  }

  async function logout() {
    try { await api("/logout", { method: "POST" }); } catch (e) { console.warn("Logout request failed", e); }
    clearToken(); setToken(null); setUser(null); setDashboard(null); setPage("dashboard"); setAuthMode("choose");
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
    if (!window.confirm(type === "users" ? `Revoke access for ${item.name}? Their existing reports will be preserved.` : `Delete ${item.room_code || item.title || item.name || "this record"}? This cannot be undone.`)) return;
    const base = type === "classrooms" ? "classrooms" : type === "readiness-checks" ? "readiness-checks" : type === "issue-reports" ? "issue-reports" : "users";
    try { await api(`/${base}/${item.id}`, { method: "DELETE" }); notifySuccess(type === "users" ? "Teacher access revoked. Existing reports were preserved." : "Record deleted."); await loadCore(); }
    catch (e) { notifyError(e); }
  }

  const currentNav = NAV.find((item) => item.id === page) || NAV[0];
  const isMainAdmin = user?.role === "admin";
  const isTempAdmin = Boolean(user?.is_temporary_admin);
  const canManageIssues = isMainAdmin || isTempAdmin;
  const visibleNav = NAV.filter((item) => (item.id !== "users" && item.id !== "readiness-checks") || (isMainAdmin && item.id === "users") || (isMainAdmin && item.id === "readiness-checks")).filter((item) => item.id !== "users" || isMainAdmin);
  const filteredRooms = useMemo(() => classrooms.filter((r) => `${r.room_code} ${r.building} ${r.floor || ""}`.toLowerCase().includes(search.toLowerCase())), [classrooms, search]);
  const filteredChecks = useMemo(() => checks.filter((r) => `${r.classroom?.room_code || ""} ${r.inspector?.name || ""}`.toLowerCase().includes(search.toLowerCase()) && (filter === "all" || r.status === filter)), [checks, search, filter]);
  const filteredIssues = useMemo(() => issues.filter((r) => `${r.title} ${r.classroom?.room_code || ""} ${r.description}`.toLowerCase().includes(search.toLowerCase()) && (filter === "all" || r.status === filter)), [issues, search, filter]);

  if (!token || !user) return <Login mode={authMode} onModeChange={(mode) => { setAuthMode(mode); setError(""); setNotice(""); }} onSubmit={authMode === "teacher-register" ? register : login} loading={loading} error={error} />;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">CR</div><div><strong>ClassReady</strong><span>FACILITY MONITORING</span></div></div>
        {["WORKSPACE", "ADMINISTRATION"].map((group) => <div key={group}><p className="nav-group">{group}</p>{visibleNav.filter((n) => n.group === group).map((n) => <button key={n.id} className={`nav-link ${page === n.id ? "active" : ""}`} onClick={() => { setPage(n.id); setSearch(""); setFilter("all"); setNotice(""); setError(""); }}><span className="nav-icon">{n.icon}</span>{n.label}{n.id === "issue-reports" && issues.filter((i) => i.status !== "resolved").length > 0 && <span className="nav-badge">{issues.filter((i) => i.status !== "resolved").length}</span>}</button>)}</div>)}
        <div className="sidebar-bottom"><div className="help-card"><span className="help-mark">?</span><strong>Keep classrooms ready</strong><p>Log inspections and track maintenance issues in one place.</p></div><div className="profile"><div className="avatar">{initials(user.name)}</div><div className="profile-copy"><strong>{user.name}</strong><span>{user.role === "admin" ? "Main Administrator" : user.is_temporary_admin ? "Temporary Admin" : "Teacher / Inspector"}</span></div><button className="logout-mini" onClick={logout} title="Sign out">↗</button></div></div>
      </aside>
      <main className="main-area">
        <header className="topbar"><div className="crumb">Workspace <span>/</span> <strong>{currentNav.label}</strong></div><div className="top-actions">{!canManageIssues && issues.filter((r) => r.assigned_to === user.id && r.status !== "resolved").length > 0 && <button className="secondary-button" onClick={() => setPage("issue-reports")}>🔔 Assignments ({issues.filter((r) => r.assigned_to === user.id && r.status !== "resolved").length})</button>}<span className="online-dot">● API connected</span><div className="avatar small">{initials(user.name)}</div><button className="signout" onClick={logout}>Sign out</button></div></header>
        <div className="content">
          <div className="page-heading"><div><p className="eyebrow">SCHOOL FACILITIES · MANAGEMENT</p><h1>{currentNav.id === "dashboard" ? "Good day, " + user.name.split(" ")[0] : currentNav.label}</h1><p className="subtitle">{pageSubtitle(page)}</p></div><div className="academic-chip"><span>◷</span> Academic Year 2026–2027</div></div>
          {notice && <div className="alert success">{notice}<button onClick={() => setNotice("")}>×</button></div>}
          {error && <div className="alert error">{error}<button onClick={() => setError("")}>×</button></div>}
          {loading && <div className="loading-line"><span /> Syncing records with the API…</div>}
          {page === "dashboard" && <Dashboard dashboard={dashboard} checks={checks} issues={issues} onNavigate={setPage} />}
          {page === "classrooms" && <DataSection title="Buildings & classrooms" description={isMainAdmin ? "Manage learning spaces and their capacity." : "View classroom locations and room information. Editing is restricted to the main admin."} count={classrooms.length} onAdd={isMainAdmin ? () => openCreate("classrooms") : null} addLabel="Add classroom" search={search} setSearch={setSearch}><ClassroomTable rows={filteredRooms} onEdit={isMainAdmin ? (r) => openEdit("classrooms", r) : null} onDelete={isMainAdmin ? (r) => removeItem("classrooms", r) : null} readOnly={!isMainAdmin} /></DataSection>}
          {page === "readiness-checks" && isMainAdmin && <DataSection title="Readiness inspections" description="Record cleanliness, furniture, lighting, fans, and equipment." count={checks.length} onAdd={() => openCreate("readiness-checks")} addLabel="New inspection" search={search} setSearch={setSearch} filter={<select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All statuses</option><option value="ready">Ready</option><option value="needs_attention">Needs attention</option></select>}><ChecksTable rows={filteredChecks} onEdit={(r) => openEdit("readiness-checks", r)} onDelete={(r) => removeItem("readiness-checks", r)} /></DataSection>}
          {page === "issue-reports" && !canManageIssues && issues.some((r) => r.assigned_to === user.id && r.status !== "resolved") && <div className="alert success">You have a room inspection assignment from the administrator. Open the assigned report below and send your response.</div>}
          {page === "issue-reports" && <DataSection title="Issue reports" description="Report facility problems and follow their resolution status." count={issues.length} onAdd={user.role === "teacher" && !isTempAdmin ? () => openCreate("issue-reports") : null} addLabel="Report an issue" search={search} setSearch={setSearch} filter={<select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All statuses</option><option value="reported">Reported</option><option value="assigned">Assigned</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option></select>}><IssuesTable rows={filteredIssues} currentUserId={user.id} isAdmin={canManageIssues} canAssign={isMainAdmin} canRespond={!canManageIssues} onEdit={canManageIssues ? (r) => openEdit("issue-reports", r) : null} onDelete={isMainAdmin ? (r) => removeItem("issue-reports", r) : null} teachers={users.filter((u) => u.role === "teacher" && !u.is_temporary_admin)} onRespond={async (r, comment) => { try { await api(`/issue-reports/${r.id}/response`, { method: "POST", body: JSON.stringify({ comment }) }); notifySuccess("Response sent to the administrator."); await loadCore(); } catch (e) { notifyError(e); } }} onAssign={async (r, teacherId) => { try { await api(`/issue-reports/${r.id}`, { method: "PATCH", body: JSON.stringify({ classroom_id: r.classroom_id, title: r.title, description: r.description, category: r.category, priority: r.priority, status: r.status, resolution_notes: r.resolution_notes || "", assigned_to: teacherId ? Number(teacherId) : null }) }); notifySuccess("Teacher assigned. The assignment will appear in their account."); await loadCore(); } catch (e) { notifyError(e); } }} /></DataSection>}
          {page === "users" && user.role === "admin" && <><section className="panel invite-panel"><div><p className="eyebrow">TEACHER INVITATIONS</p><h3>Your admin invite code</h3><p>Share this code only with teachers who should join your administrator account.</p></div><div className="invite-code"><strong>{user.invite_code || "Run database seeder"}</strong><button className="secondary-button" onClick={() => { navigator.clipboard?.writeText(user.invite_code || ""); notifySuccess("Invite code copied."); }}>Copy code</button></div></section><DataSection title="Teacher management" description="Add, edit, or remove teachers connected to your administrator account." count={users.length} onAdd={() => openCreate("users")} addLabel="Add teacher" search={search} setSearch={setSearch}><UsersTable rows={users.filter((u) => u.role === "teacher" && `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(search.toLowerCase()))} onEdit={(u) => openEdit("users", u)} onDelete={(u) => removeItem("users", u)} onToggleTemporary={async (u) => { try { await api(`/users/${u.id}`, { method: "PATCH", body: JSON.stringify({ is_temporary_admin: !u.is_temporary_admin }) }); notifySuccess(u.is_temporary_admin ? "Temporary admin access revoked." : "Teacher promoted to temporary admin."); await loadCore(); } catch (e) { notifyError(e); } }} /></DataSection></>}
          <footer className="footer"><span>© 2026 ClassReady</span><span>Classroom Readiness Monitoring & Issue Reporting System</span><span><i /> Connected to Laravel API</span></footer>
        </div>
      </main>
      {modal && <RecordModal type={modal} form={form} setField={setField} classrooms={classrooms} onClose={() => setModal(null)} onSubmit={submitForm} loading={loading} editing={Boolean(editingId)} isAdmin={canManageIssues} isMainAdmin={isMainAdmin} users={users} />}
    </div>
  );
}

function Login({ mode, onModeChange, onSubmit, loading, error }) {
  const isChoose = mode === "choose";
  const isRegister = mode === "teacher-register";
  const isAdmin = mode === "admin-login";
  return <div className="login-page"><div className="login-visual"><div className="login-brand"><div className="brand-mark">CR</div><div><strong>ClassReady</strong><span>FACILITY MONITORING</span></div></div><div className="login-message"><span className="welcome-tag">A BETTER WAY TO PREPARE</span><h1>Every classroom,<br /><em>ready to learn.</em></h1><p>Teachers report facility issues. Administrators manage access, review reports, and control resolution.</p><div className="visual-building"><div className="sun" /><div className="building b1"><i /><i /><i /><i /><i /><i /></div><div className="building b2"><i /><i /><i /><i /><i /><i /><i /><i /></div><div className="grass" /></div></div><span className="login-foot">CLASSROOM READINESS MONITORING SYSTEM</span></div><div className="login-panel"><div className="login-card">
    {isChoose ? <><p className="eyebrow">WELCOME TO CLASSREADY</p><h2>How will you sign in?</h2><p className="login-subtitle">Choose your account type to continue.</p><div className="role-choice"><button className="primary-button wide" onClick={() => onModeChange("admin-login")}>Administrator sign in <span>→</span></button><button className="secondary-button wide" onClick={() => onModeChange("teacher-login")}>Teacher sign in <span>→</span></button><button className="text-button" onClick={() => onModeChange("teacher-register")}>New teacher? Join an administrator</button></div></> : <>
      <button type="button" className="back-link" onClick={() => onModeChange("choose")}>← Change account type</button><p className="eyebrow">{isRegister ? "JOIN A SCHOOL ADMINISTRATOR" : isAdmin ? "ADMINISTRATOR ACCESS" : "TEACHER ACCESS"}</p><h2>{isRegister ? "Create teacher account" : isAdmin ? "Administrator sign in" : "Teacher sign in"}</h2><p className="login-subtitle">{isRegister ? "Enter the invite code provided by your administrator." : isAdmin ? "Use your administrator account credentials." : "Sign in to report issues to your administrator."}</p>{error && <div className="alert error" role="alert">{error}</div>}<form onSubmit={onSubmit}>
      {isRegister && <label>Full name<input name="name" type="text" placeholder="Your full name" required minLength={2} maxLength={120} autoComplete="name" /></label>}
      {isRegister && <label>Admin invite code<input name="invite_code" type="text" placeholder="Enter code from your administrator" required autoComplete="off" /></label>}
      <label>Email address<input name="email" type="email" placeholder="you@school.edu" required maxLength={255} autoComplete="email" /></label>
      <label>Password<input name="password" type="password" placeholder={isRegister ? "At least 8 characters" : "Enter your password"} required minLength={isRegister ? 8 : undefined} autoComplete={isRegister ? "new-password" : "current-password"} /></label>
      {isRegister && <label>Confirm password<input name="password_confirmation" type="password" placeholder="Enter password again" required minLength={8} autoComplete="new-password" /></label>}
      <button className="primary-button wide" disabled={loading}>{loading ? (isRegister ? "Creating account…" : "Signing in…") : (isRegister ? "Join administrator" : "Sign in securely")} <span>→</span></button>
      </form><p className="auth-switch">{isRegister ? "Already have an account?" : isAdmin ? "Need teacher access?" : "Need an account?"} <button type="button" onClick={() => onModeChange(isRegister ? "teacher-login" : isAdmin ? "choose" : "teacher-register")}>{isRegister ? "Sign in" : isAdmin ? "Back" : "Join with code"}</button></p>{isRegister && <p className="auth-note">Your account will be linked only to the administrator whose code you enter. Other teachers' reports remain private.</p>}
    </>}
    </div></div></div>;
}

function Dashboard({ dashboard, checks, issues, onNavigate }) {
  const stats = dashboard?.stats || {};
  const cards = [
    { label: "Total classrooms", value: stats.classrooms ?? "—", note: "Registered learning spaces", icon: "▤", tone: "blue" },
    { label: "Ready for classes", value: stats.ready ?? "—", note: "Latest inspection is ready", icon: "✓", tone: "green" },
    { label: "Need attention", value: stats.needs_attention ?? "—", note: "Latest inspection flagged", icon: "⚠", tone: "amber" },
    { label: "Total reports", value: stats.reports ?? "—", note: `${stats.open_issues ?? 0} still open`, icon: "⚑", tone: "rose" },
    { label: "Teachers", value: stats.teachers ?? "—", note: "Connected to this administrator", icon: "♙", tone: "blue" },
  ];
  return <><section className="hero-banner"><div className="hero-copy"><span className="welcome-tag">✦ YOUR FACILITIES AT A GLANCE</span><h2>Every classroom,<br /><em>ready to learn.</em></h2><p>Keep track of what is ready and what needs attention. Every inspection helps create a better learning space.</p><button className="hero-button" onClick={() => onNavigate("readiness-checks")}>View readiness checks <span>→</span></button></div><div className="hero-art" aria-hidden="true"><div className="hero-sun" /><div className="hero-building back"><i /><i /><i /><i /></div><div className="hero-building front"><i /><i /><i /><i /><i /><i /><i /><i /></div><div className="hero-ground" /><div className="hero-plant">✳</div></div></section><div className="stats-grid">{cards.map((c) => <article className="stat-card" key={c.label}><div className={`stat-icon ${c.tone}`}>{c.icon}</div><span>{c.label}</span><strong>{c.value}</strong><small>{c.note}</small></article>)}</div><div className="dashboard-grid"><section className="panel"><div className="panel-heading"><div><h3>Recent inspections</h3><p>Latest classroom readiness checks</p></div><button className="text-button" onClick={() => onNavigate("readiness-checks")}>View all →</button></div>{checks.slice(0, 5).length ? <div className="recent-list">{checks.slice(0, 5).map((r) => <div className="recent-row" key={r.id}><div className="recent-icon">✓</div><div className="recent-main"><strong>{r.classroom?.room_code || "Classroom"}</strong><span>{r.inspector?.name || "Inspector"} · {r.checked_at}</span></div><Status value={r.status} /></div>)}</div> : <EmptyState text="No inspections yet. Create the first readiness check." />}</section><section className="panel"><div className="panel-heading"><div><h3>Latest issue reports</h3><p>Facility concerns that need follow-up</p></div><button className="text-button" onClick={() => onNavigate("issue-reports")}>View all →</button></div>{issues.slice(0, 5).length ? <div className="recent-list">{issues.slice(0, 5).map((r) => <div className="recent-row" key={r.id}><div className="recent-icon issue">!</div><div className="recent-main"><strong>{r.title}</strong><span>{r.classroom?.room_code || "Classroom"} · {r.priority} priority</span></div><Status value={r.status} /></div>)}</div> : <EmptyState text="No issue reports yet." />}</section></div></>;
}

function DataSection({ title, description, count, onAdd, addLabel, search, setSearch, filter, children }) {
  return <section className="data-section"><div className="section-heading"><div><h2>{title}</h2><p>{description}</p></div>{onAdd && <button className="primary-button" onClick={onAdd}>＋ {addLabel}</button>}</div><div className="table-toolbar"><label className="search-control"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search records…" /></label>{filter}<span className="record-count">{count} total records</span></div><div className="table-wrap">{children}</div></section>;
}

function ClassroomTable({ rows, onEdit, onDelete, readOnly = false }) {
  if (!rows.length) return <EmptyState text="No classrooms found. Add your first classroom." />;
  return <table><thead><tr><th>Room</th><th>Building / Floor</th><th>Capacity</th><th>Inspections</th><th>Issues</th>{!readOnly && <th>Actions</th>}</tr></thead><tbody>{rows.map((r) => <tr key={r.id}><td><strong className="room-code">{r.room_code}</strong><small className="cell-sub">{r.notes || "Classroom"}</small></td><td>{r.building}<small className="cell-sub">{r.floor || "Floor not set"}</small></td><td>{r.capacity} students</td><td>{r.readiness_checks_count ?? 0}</td><td>{r.issue_reports_count ?? 0}</td>{!readOnly && <td><Actions onEdit={() => onEdit?.(r)} onDelete={() => onDelete?.(r)} /></td>}</tr>)}</tbody></table>;
}
function ChecksTable({ rows, onEdit, onDelete }) {
  if (!rows.length) return <EmptyState text="No readiness checks match your search." />;
  return <table><thead><tr><th>Classroom</th><th>Inspection date</th><th>Inspector</th><th>Condition</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id}><td><strong>{r.classroom?.room_code || `Room #${r.classroom_id}`}</strong><small className="cell-sub">{r.classroom?.building || ""}</small></td><td>{r.checked_at}</td><td>{r.inspector?.name || "—"}</td><td><span className="condition">{["cleanliness", "chairs", "lights", "fans", "equipment"].filter((k) => r[k] !== "good").length ? `${["cleanliness", "chairs", "lights", "fans", "equipment"].filter((k) => r[k] !== "good").length} flagged item(s)` : "All good"}</span></td><td><Status value={r.status} /></td><td><Actions onEdit={() => onEdit(r)} onDelete={() => onDelete(r)} /></td></tr>)}</tbody></table>;
}
function IssuesTable({ rows, onEdit, onDelete, isAdmin, canAssign = false, canRespond = false, teachers = [], onAssign, onRespond, currentUserId }) {
  const [responses, setResponses] = useState({});
  const [assignments, setAssignments] = useState({});
  if (!rows.length) return <EmptyState text="No issue reports match your search." />;
  return <table><thead><tr><th>Issue</th>{isAdmin && <th>Reported by</th>}<th>Classroom</th><th>Category</th><th>Priority</th><th>Status</th>{(isAdmin || canRespond) && <th>{canRespond ? "Assignment / response" : "Assignment / teacher response"}</th>}{isAdmin && <th>Admin actions</th>}</tr></thead><tbody>{rows.map((r) => <tr key={r.id}><td><strong>{r.title}</strong><small className="cell-sub description-cell">{r.description}</small>{r.resolution_notes && <small className="cell-sub">Resolution: {r.resolution_notes}</small>}</td>{isAdmin && <td>{r.reporter?.name || "Teacher"}</td>}<td>{r.classroom?.room_code || `Room #${r.classroom_id}`}</td><td><span className="capitalize">{r.category}</span></td><td><span className={`priority ${r.priority}`}>{r.priority}</span></td><td><Status value={r.status} /></td>{(isAdmin || canRespond) && <td>{canAssign && <div className="assignment-control"><select value={assignments[r.id] ?? r.assigned_to ?? ""} onChange={(e) => setAssignments((v) => ({ ...v, [r.id]: e.target.value }))}><option value="">Unassigned</option>{teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select><button onClick={() => onAssign?.(r, assignments[r.id] ?? r.assigned_to ?? "")}>Assign</button></div>}{r.assignee && <small className="cell-sub">Assigned to: {r.assignee.name}</small>}{canRespond && r.assigned_to === currentUserId && r.status !== "resolved" && <div className="assignment-control"><textarea value={responses[r.id] ?? ""} onChange={(e) => setResponses((v) => ({ ...v, [r.id]: e.target.value }))} placeholder="Comment to admin…" rows="2" /><button disabled={!(responses[r.id] || "").trim()} onClick={() => onRespond?.(r, responses[r.id].trim())}>Send</button></div>}{isAdmin && r.teacher_response && <small className="cell-sub">Teacher response: {r.teacher_response}</small>}</td>}{isAdmin && <td><div className="row-actions">{onEdit && <button onClick={() => onEdit(r)}>Edit / Status</button>}{onDelete && <button className="delete-action" onClick={() => onDelete(r)}>Delete</button>}</div></td>}</tr>)}</tbody></table>;
}
function UsersTable({ rows, onEdit, onDelete, onToggleTemporary }) {
  if (!rows.length) return <EmptyState text="No users found." />;
  return <table><thead><tr><th>Name</th><th>Email address</th><th>Role / access</th><th>Actions</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id}><td><div className="user-cell"><div className="avatar">{initials(r.name)}</div><strong>{r.name}</strong></div></td><td>{r.email}</td><td><span className={`role-pill ${r.role}`}>{r.is_temporary_admin ? "Temporary Admin" : "Teacher"}</span></td><td><div className="row-actions"><button onClick={() => onToggleTemporary(r)}>{r.is_temporary_admin ? "Revoke Temp Admin" : "Make Temporary Admin"}</button><button onClick={() => onEdit(r)}>Edit</button><button className="delete-action" onClick={() => onDelete(r)}>Kick</button></div></td></tr>)}</tbody></table>;
}
function Actions({ onEdit, onDelete, deleteLabel = "Delete" }) { return <div className="row-actions"><button onClick={onEdit} title="Edit record">Edit</button><button className="delete-action" onClick={onDelete} title={deleteLabel}>{deleteLabel}</button></div>; }
function Status({ value }) { const labels = { ready: "Ready", needs_attention: "Needs attention", reported: "Reported", assigned: "Assigned", in_progress: "In progress", resolved: "Resolved" }; return <span className={`status-pill ${value || "reported"}`}><i />{labels[value] || value}</span>; }
function EmptyState({ text }) { return <div className="empty-state"><span>▤</span><strong>Nothing to show yet</strong><p>{text}</p></div>; }
function RecordModal({ type, form, setField, classrooms, onClose, onSubmit, loading, editing, isAdmin, isMainAdmin = false, users = [] }) {
  const title = type === "classrooms" ? "Classroom" : type === "readiness-checks" ? "Readiness inspection" : type === "issue-reports" ? "Issue report" : "User account";
  return <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><section className="modal-card"><header className="modal-heading"><div><p className="eyebrow">{editing ? "UPDATE RECORD" : "NEW RECORD"}</p><h2>{editing ? "Edit " : "Create "}{title}</h2></div><button className="close-button" onClick={onClose} aria-label="Close">×</button></header><form onSubmit={onSubmit}><div className="modal-fields">
    {type === "classrooms" && <><Field label="Room code" value={form.room_code} onChange={(v) => setField("room_code", v)} required placeholder="e.g. ROOM-101" /><Field label="Building" value={form.building} onChange={(v) => setField("building", v)} required placeholder="Main Building" /><Field label="Floor" value={form.floor} onChange={(v) => setField("floor", v)} placeholder="1st Floor" /><Field label="Capacity" type="number" value={form.capacity} onChange={(v) => setField("capacity", v)} required /><Field label="Notes" value={form.notes} onChange={(v) => setField("notes", v)} wide placeholder="Optional details" /></>}
    {type === "readiness-checks" && <><SelectField label="Classroom" value={form.classroom_id} onChange={(v) => setField("classroom_id", v)} options={classrooms.map((c) => [c.id, `${c.room_code} · ${c.building}`])} required /><Field label="Inspection date" type="date" value={form.checked_at} onChange={(v) => setField("checked_at", v)} required />{["cleanliness", "chairs", "lights", "fans", "equipment"].map((key) => <SelectField key={key} label={key[0].toUpperCase() + key.slice(1)} value={form[key]} onChange={(v) => setField(key, v)} options={[["good", "Good"], ["needs_attention", "Needs attention"], ["poor", "Poor"]]} required />)}<Field label="Inspection notes" value={form.notes} onChange={(v) => setField("notes", v)} wide /></>}
    {type === "issue-reports" && <><SelectField label="Classroom" value={form.classroom_id} onChange={(v) => setField("classroom_id", v)} options={classrooms.map((c) => [c.id, `${c.room_code} · ${c.building}`])} required /><Field label="Issue title" value={form.title} onChange={(v) => setField("title", v)} required placeholder="e.g. Ceiling fan not working" /><SelectField label="Category" value={form.category} onChange={(v) => setField("category", v)} options={["cleanliness", "furniture", "electrical", "equipment", "safety", "other"].map((v) => [v, cap(v)])} required /><SelectField label="Priority" value={form.priority} onChange={(v) => setField("priority", v)} options={["low", "medium", "high", "urgent"].map((v) => [v, cap(v)])} required />{isAdmin && <SelectField label="Status" value={form.status} onChange={(v) => setField("status", v)} options={[["reported", "Reported"], ["assigned", "Assigned"], ["in_progress", "In progress"], ["resolved", "Resolved"]]} required />}<Field label="Description" value={form.description} onChange={(v) => setField("description", v)} required wide textarea placeholder="Describe the problem and its impact…" />{isAdmin && <Field label="Resolution notes" value={form.resolution_notes} onChange={(v) => setField("resolution_notes", v)} wide placeholder="Optional repair or follow-up notes" />}{isMainAdmin && <SelectField label="Assign inspection to teacher" value={form.assigned_to || ""} onChange={(v) => setField("assigned_to", v)} options={users.filter((u) => !u.is_temporary_admin).map((u) => [u.id, u.name])} />}</>}
    {type === "users" && <><Field label="Full name" value={form.name} onChange={(v) => setField("name", v)} required /><Field label="Email address" type="email" value={form.email} onChange={(v) => setField("email", v)} required /><SelectField label="Role" value={form.role} onChange={(v) => setField("role", v)} options={[["teacher", "Teacher / Inspector"]]} required /><Field label={editing ? "New password (optional)" : "Temporary password"} type="password" value={form.password} onChange={(v) => setField("password", v)} required={!editing} minLength={8} placeholder={editing ? "Leave blank to keep current password" : "At least 8 characters"} /></>}
    </div><div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={loading}>{loading ? "Saving…" : editing ? "Save changes" : "Create record"}</button></div></form></section></div>;
}
function Field({ label, value, onChange, type = "text", required = false, placeholder = "", wide = false, textarea = false, minLength }) { return <label className={`form-field ${wide ? "wide" : ""}`}>{label}{textarea ? <textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder} rows="3" /> : <input type={type} value={value ?? ""} onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)} required={required} placeholder={placeholder} minLength={minLength} min={type === "number" ? 0 : undefined} />}</label>; }
function SelectField({ label, value, onChange, options, required = false }) { return <label className="form-field">{label}<select value={value ?? ""} onChange={(e) => onChange(e.target.value)} required={required}><option value="">Choose…</option>{options.map(([v, labelText]) => <option key={v} value={v}>{labelText}</option>)}</select></label>; }
function initials(name = "") { return name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]).join("").toUpperCase() || "CR"; }
function cap(value = "") { return value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()); }
function pageSubtitle(page) { return ({ dashboard: "Monitor classroom readiness and keep every learning space on track.", classrooms: "Keep classroom details accurate and easy to find.", "readiness-checks": "Document classroom conditions before learning begins.", "issue-reports": "Track maintenance needs from report to resolution.", users: "Manage who can access the classroom monitoring system." })[page] || ""; }

export default App;
