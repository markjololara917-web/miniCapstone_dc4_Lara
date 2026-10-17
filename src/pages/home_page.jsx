
import "../pages_style/home_style.css";

function App() {
  return (
    <div className="home">
      <nav className="navbar">
        <h2>My Website</h2>
        <span>Home</span>
      </nav>

      <main className="content">
        <h1>Welcome!</h1>
        <p>This is my simple home page using React.</p>

        <button onClick={() => alert("Getting Started!")}>
          Get Started
        </button>

        <button onClick={() => alert("Settings")}>
          Settings
        </button>

        <button onClick={() => alert("About Us")}>
          About
        </button>
      </main>
    </div>
  );
}

export default App;
