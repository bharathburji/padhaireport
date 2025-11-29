import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Sidebar from "./Sidebar.jsx";


function StudentLayout() {
 const links = [
  { to: "/student/dashboard", label: "Dashboard" },
  { to: "/student/reports", label: "My Reports" },
];


  return (
    <div className="app-shell">
      <Navbar title="Student Panel" />
      <div className="app-body">
        <Sidebar links={links} />
        <main className="app-content app-content-student">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default StudentLayout;
