import "../pages_style/classroom_style.css";

const rooms = [
  ["Room 101", "Main Building", "1st Floor", "40", "Ready", "green"],
  ["Room 108", "Main Building", "1st Floor", "35", "Needs attention", "amber"],
  ["Room 204", "North Wing", "2nd Floor", "40", "Needs attention", "amber"],
  ["Room 215", "North Wing", "2nd Floor", "45", "Ready", "green"],
  ["Lab 03", "Science Building", "Ground Floor", "30", "Under inspection", "blue"],
  ["Room 312", "East Wing", "3rd Floor", "40", "Ready", "green"],
];

function ClassroomPage() {
  return <section className="classroom-module"><div className="classroom-toolbar"><label className="classroom-search">⌕ <input placeholder="Search room code or building..." /></label><select aria-label="Filter by status"><option>All statuses</option><option>Ready</option><option>Needs attention</option><option>Under inspection</option></select><button onClick={() => alert("Classroom form will be connected to the Laravel API.")}>＋ Add classroom</button></div><div className="classroom-grid">{rooms.map(([room, building, floor, capacity, status, tone]) => <article className="room-card" key={room}><div className="room-card-top"><div className="room-symbol">▤</div><span className={`room-status ${tone}`}><i />{status}</span></div><h3>{room}</h3><p>{building} · {floor}</p><div className="room-card-footer"><span>♙ Capacity</span><strong>{capacity} students</strong></div><button className="room-details" onClick={() => alert(`${room} details will be available when classroom records are connected to the API.`)}>View details <span>→</span></button></article>)}</div><div className="classroom-pagination"><span>Showing <strong>6</strong> of <strong>48</strong> classrooms</span><div><button disabled>←</button><button className="page-current">1</button><button>2</button><button>3</button><button>→</button></div></div></section>;
}

export default ClassroomPage;
