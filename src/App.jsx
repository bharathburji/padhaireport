import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/auth/Login.jsx";

import TeacherLayout from "./components/layout/TeacherLayout.jsx";
import StudentLayout from "./components/layout/StudentLayout.jsx";

import TeacherDashboard from "./pages/teacher/TeacherDashboard.jsx";
import ManageStudents from "./pages/teacher/ManageStudents.jsx";
import ManageMarks from "./pages/teacher/ManageMarks.jsx";

import StudentDashboard from "./pages/student/StudentDashboard.jsx";
import StudentReports from "./pages/student/StudentReports.jsx";

function App() {
  return (
    <Routes>
      {/* Login */}
      <Route path="/login" element={<Login />} />

      {/* Teacher area (no guards – navigation is direct) */}
      <Route path="/teacher" element={<TeacherLayout />}>
        <Route path="dashboard" element={<TeacherDashboard />} />
        <Route path="students" element={<ManageStudents />} />
        <Route path="marks" element={<ManageMarks />} />
      </Route>

      {/* Student area (no guards – navigation is direct) */}
      <Route path="/student" element={<StudentLayout />}>
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="reports" element={<StudentReports />} />
      </Route>

      {/* Fallback – send anything unknown to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
