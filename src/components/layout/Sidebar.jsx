import { NavLink } from "react-router-dom";


function Sidebar({ links }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">📊</div>
      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
