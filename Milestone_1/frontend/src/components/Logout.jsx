// In a new NavBar.js or similar file
function NavBar({ onLogout }) {
  return (
    <nav className="navbar navbar-light bg-light">
      <span className="navbar-brand mb-0 h1">WealthWise</span>
      <button onClick={onLogout} className="btn btn-danger">
        Logout
      </button>
    </nav>
  );
}
export default NavBar;
