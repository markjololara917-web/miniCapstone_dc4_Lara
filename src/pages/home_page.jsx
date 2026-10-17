import { useState } from "react";
import "../pages_style/home_style.css";
import "../components/sidebar.css";
import DashboardPage from "./dashboard_page";
import ClassroomPage from "./classroom_page";

const navigation = [
  { label: "Overview", icon: "▦", group: "WORKSPACE" },
  { label: "Classrooms", icon: "▤", group: "WORKSPACE" },
  { label: "Readiness Checks", icon: "✓", group: "WORKSPACE" },
  { label: "Issue Reports", icon: "⚑", group: "WORKSPACE" },
  { label: "User Management", icon: "♙", group: "ADMINISTRATION" },
];

function HomePage() {
  const [currentPage, setCurrentPage] = useState("Overview");
  const [search, setSearch] = useState("");

  const pageTitle = currentPage === "Overview" ? "Dashboard" : currentPage;
  const renderPage = () => {
    if (currentPage === "Overview") return <DashboardPage onNavigate={setCurrentPage} />;
    if (currentPage === "Classrooms") return <ClassroomPage />;
    return (
      <section className="empty-module">
        <div className="empty-icon">{navigation.find(item => item.label === currentPage)?.icon || "▦"}</div>
        <p className="eyebrow">CLASSROOM OPERATIONS</p>
        <h2>{currentPage}</h2>
        <p>This workspace is ready for the {currentPage.toLowerCase()} module.</p>
        <span className="module-note">Connect this page to the Laravel API as you build each feature.</span>
      </section>
    );
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">CR</div>
          <div className="brand-copy"><strong>ClassReady</strong><span>FACILITY MONITORING</span></div>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <div className="nav-list">
          {navigation.map((item) => (
            <button key={item.label} className={`nav-item ${currentPage === item.label ? "active" : ""}`} onClick={() => setCurrentPage(item.label)}>
              <span className="nav-icon">{item.icon}</span><span>{item.label}</span>
              {item.label === "Issue Reports" && <span className="nav-count">4</span>}
            </button>
          ))}
        </div>
        <div className="sidebar-bottom">
          <div className="help-card"><div className="help-dot">?</div><strong>Need a hand?</strong><p>Check your workflow and system guide.</p><button onClick={() => alert("System guide will be added to the documentation.")}>View guide <span>↗</span></button></div>
          <div className="profile-row"><div className="avatar">ML</div><div className="profile-copy"><strong>Markjolo Lara</strong><span>Administrator</span></div><span className="profile-more">•••</span></div>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><span className="crumb-divider">/</span><strong>{pageTitle}</strong></div>
          <div className="topbar-actions">
            <label className="search-box"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search anything..." /><kbd>⌘ K</kbd></label>
            <button className="icon-button" aria-label="Notifications" onClick={() => alert("You’re all caught up.")}>♧<i /></button>
            <div className="top-avatar">ML</div>
          </div>
        </header>
        <main className="page-content">
          <div className="page-heading">
            <div><p className="eyebrow">SCHOOL FACILITIES · MANAGEMENT</p><h1>{pageTitle}</h1><p className="page-subtitle">Monitor classroom readiness and keep every learning space on track.</p></div>
            <div className="date-chip"><span>◷</span> Academic Year 2026–2027</div>
          </div>
          {renderPage()}
          <footer className="app-footer"><span>© 2026 ClassReady</span><span>Classroom Readiness Monitoring & Issue Reporting System</span><span><i className="status-dot" /> All systems operational</span></footer>
        </main>
      </div>
    </div>
  );
}

export default HomePage;
