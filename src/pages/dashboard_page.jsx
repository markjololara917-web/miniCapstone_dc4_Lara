import "../pages_style/dashboard_style.css";

const metrics = [
  { label: "Total classrooms", value: "48", change: "+4 this term", icon: "▤", tone: "blue", detail: "Across all buildings" },
  { label: "Ready for classes", value: "36", change: "75% readiness", icon: "✓", tone: "green", detail: "Passed latest inspection" },
  { label: "Need attention", value: "12", change: "3 high priority", icon: "⚠", tone: "amber", detail: "Require follow-up" },
  { label: "Open issues", value: "08", change: "4 in progress", icon: "⚑", tone: "rose", detail: "Awaiting resolution" },
];

const issues = [
  { room: "Room 204", building: "North Wing · 2nd Floor", issue: "Ceiling fan not working", priority: "High", status: "In progress", initials: "JD", color: "purple" },
  { room: "Room 108", building: "Main Building · 1st Floor", issue: "Damaged student chairs", priority: "Medium", status: "Reported", initials: "AM", color: "orange" },
  { room: "Lab 03", building: "Science Building · Ground Floor", issue: "Projector display problem", priority: "High", status: "Assigned", initials: "RL", color: "teal" },
  { room: "Room 312", building: "East Wing · 3rd Floor", issue: "Lighting needs replacement", priority: "Low", status: "Resolved", initials: "CS", color: "blue" },
];

function DashboardPage({ onNavigate = () => {} }) {
  return (
    <div className="dashboard">
      <section className="welcome-banner">
        <div className="welcome-copy"><span className="welcome-tag"><span className="welcome-spark">✦</span> YOUR FACILITIES AT A GLANCE</span><h2>Every classroom, <em>ready to learn.</em></h2><p>Here’s the latest readiness snapshot for your school. Keep track of what’s ready and what needs attention.</p><button className="banner-button" onClick={() => onNavigate("Readiness Checks")}>View readiness checks <span>→</span></button></div>
        <div className="banner-art" aria-hidden="true"><div className="art-sun" /><div className="art-building building-back"><span /><span /><span /><span /></div><div className="art-building building-front"><span /><span /><span /><span /><span /><span /></div><div className="art-ground" /><div className="art-plant">✳</div></div>
      </section>

      <div className="section-heading"><div><h2>School overview</h2><p>A quick look at your classroom status</p></div><button className="subtle-button" onClick={() => onNavigate("Classrooms")}>View all classrooms <span>→</span></button></div>
      <section className="metric-grid">
        {metrics.map((metric) => <article className="metric-card" key={metric.label}><div className="metric-top"><span>{metric.label}</span><span className={`metric-icon ${metric.tone}`}>{metric.icon}</span></div><div className="metric-value">{metric.value}</div><div className="metric-bottom"><span className={`metric-change ${metric.tone}`}>{metric.change}</span><span className="metric-detail">{metric.detail}</span></div></article>)}
      </section>

      <div className="dashboard-columns">
        <section className="panel readiness-panel">
          <div className="panel-heading"><div><h2>Classroom readiness</h2><p>Latest inspection results</p></div><button className="more-button" aria-label="More readiness options">•••</button></div>
          <div className="readiness-summary"><div className="readiness-ring"><div><strong>75%</strong><span>READY</span></div></div><div className="readiness-legend"><div><i className="legend-ready" /><span>Ready classrooms</span><strong>36</strong></div><div><i className="legend-review" /><span>Needs attention</span><strong>12</strong></div><p>Based on the latest classroom checks.</p></div></div>
          <div className="progress-caption"><span>Overall readiness</span><strong>75% <small>of 48 rooms</small></strong></div><div className="progress-track"><span /></div>
          <button className="panel-link" onClick={() => onNavigate("Readiness Checks")}>Explore inspections <span>→</span></button>
        </section>
        <section className="panel activity-panel">
          <div className="panel-heading"><div><h2>Recent issue reports</h2><p>Issues that may need your attention</p></div><button className="more-button" aria-label="More issue options">•••</button></div>
          <div className="activity-list">
            <div className="activity-item"><div className="activity-symbol rose">⚑</div><div className="activity-copy"><strong>Ceiling fan not working</strong><span>Room 204 · Reported by J. Dela Cruz</span><small>12 minutes ago</small></div><span className="priority-pill high">High</span></div>
            <div className="activity-item"><div className="activity-symbol amber">▤</div><div className="activity-copy"><strong>Damaged student chairs</strong><span>Room 108 · Reported by A. Mendoza</span><small>1 hour ago</small></div><span className="priority-pill medium">Medium</span></div>
            <div className="activity-item"><div className="activity-symbol blue">▣</div><div className="activity-copy"><strong>Projector display problem</strong><span>Lab 03 · Reported by R. Lim</span><small>3 hours ago</small></div><span className="priority-pill high">High</span></div>
          </div>
          <button className="panel-link" onClick={() => onNavigate("Issue Reports")}>View all issue reports <span>→</span></button>
        </section>
      </div>

      <section className="panel issues-table-panel">
        <div className="panel-heading table-panel-heading"><div><h2>Issue tracking</h2><p>Monitor reported problems from submission to resolution</p></div><button className="subtle-button" onClick={() => onNavigate("Issue Reports")}>All reports <span>→</span></button></div>
        <div className="table-scroll"><table className="issues-table"><thead><tr><th>CLASSROOM</th><th>ISSUE DESCRIPTION</th><th>PRIORITY</th><th>STATUS</th><th>REPORTED BY</th></tr></thead><tbody>{issues.map((issue) => <tr key={issue.room}><td><strong>{issue.room}</strong><span className="table-secondary">{issue.building}</span></td><td>{issue.issue}</td><td><span className={`priority-pill ${issue.priority.toLowerCase()}`}>{issue.priority}</span></td><td><span className={`status-pill ${issue.status.toLowerCase().replace(" ", "-")}`}><i />{issue.status}</span></td><td><div className="reporter"><span className={`reporter-avatar ${issue.color}`}>{issue.initials}</span><span>{issue.initials === "JD" ? "J. Dela Cruz" : issue.initials === "AM" ? "A. Mendoza" : issue.initials === "RL" ? "R. Lim" : "C. Santos"}</span></div></td></tr>)}</tbody></table></div>
      </section>
    </div>
  );
}

export default DashboardPage;
