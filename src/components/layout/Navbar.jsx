import { useAuth } from "../../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

function Navbar({ title }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="nav-bar">
      <h1 className="nav-title">PadhaAI Report</h1>

      <div className="nav-right">
        <span className="nav-subtitle">{title}</span>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}

export default Navbar;
