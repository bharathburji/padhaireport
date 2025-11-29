import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Sidebar from "./Sidebar.jsx";


function TeacherLayout() {
 const links = [
  { to: "/teacher/dashboard", label: "Dashboard" },
  { to: "/teacher/students", label: "Manage Students" },
  { to: "/teacher/marks", label: "Manage Marks" },
  // later: analytics, etc.
];


  return (
    <div className="app-shell">
      <Navbar title="Teacher Panel" />
      <div className="app-body">
        <Sidebar links={links} />
        <main className="app-content app-content-teacher">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default TeacherLayout;
