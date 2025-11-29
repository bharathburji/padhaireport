import { useEffect, useState } from "react";
import { getItem, setItem } from "../../utils/storage.js";
import "../../App.css";

const STUDENTS_KEY = "padhaai_students";

function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [className, setClassName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const stored = getItem(STUDENTS_KEY, []);
    setStudents(stored);
  }, []);

  const saveStudents = (updated) => {
    setStudents(updated);
    setItem(STUDENTS_KEY, updated);
  };

  const resetForm = () => {
    setName("");
    setStudentId("");
    setClassName("");
    setEmail("");
    setEditingId(null);
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !studentId.trim() || !className.trim() || !email.trim()) {
      setError("All fields are required.");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }

    const trimmedId = studentId.trim().toLowerCase();

    const idTaken = students.some(
      (s) => s.studentId.toLowerCase() === trimmedId && s.id !== editingId
    );

    if (idTaken) {
      setError("A student with this ID already exists.");
      return;
    }

    if (editingId) {
      // update existing
      const updated = students.map((s) =>
        s.id === editingId
          ? {
              ...s,
              name: name.trim(),
              studentId: studentId.trim(),
              className: className.trim(),
              email: email.trim(),
            }
          : s
      );
      saveStudents(updated);
    } else {
      // create new
      const newStudent = {
        id: `stu-${Date.now()}`,
        name: name.trim(),
        studentId: studentId.trim(),
        className: className.trim(),
        email: email.trim(),
        overallPercent: null, // will be filled later from marks
        status: "Not evaluated", // Top / Average / At Risk later
      };
      saveStudents([newStudent, ...students]);
    }

    resetForm();
  };

  const handleEdit = (student) => {
    setEditingId(student.id);
    setName(student.name);
    setStudentId(student.studentId);
    setClassName(student.className);
    setEmail(student.email);
    setError("");
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this student? This cannot be undone.")) return;
    const updated = students.filter((s) => s.id !== id);
    saveStudents(updated);
    if (editingId === id) resetForm();
  };

  return (
    <div className="page">
      <h2 className="page-title">Manage Students</h2>
      <p className="page-subtitle">
        Add, edit, and remove students from your class. These records will be used
        for performance analytics and reports.
      </p>

      {/* Form card */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">
              {editingId ? "Edit Student" : "Add New Student"}
            </h3>
            <p className="card-subtitle">
              Enter student details carefully. Student ID should be unique.
            </p>
          </div>
          {editingId && (
            <button type="button" className="btn-ghost" onClick={resetForm}>
              Cancel edit
            </button>
          )}
        </div>

        {error && <div className="form-error">{error}</div>}

        <form className="grid-2" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              placeholder="e.g., Rohan Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Student ID</label>
            <input
              type="text"
              placeholder="e.g., STU001"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Class / Section</label>
            <input
              type="text"
              placeholder="e.g., 2nd Year CSE - A"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Email (for reports)</label>
            <input
              type="email"
              placeholder="e.g., student@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingId ? "Save Changes" : "Add Student"}
            </button>
          </div>
        </form>
      </div>

      {/* Table card */}
      <div className="card" style={{ marginTop: "1.4rem" }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">Students List</h3>
            <p className="card-subtitle">
              {students.length === 0
                ? "No students added yet. Start by creating a few records."
                : `Total students: ${students.length}`}
            </p>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Class / Section</th>
                <th>Email</th>
                <th>Overall %</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-cell">
                    No students to display.
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.id}>
                    <td>{s.studentId}</td>
                    <td>{s.name}</td>
                    <td>{s.className}</td>
                    <td>{s.email}</td>
                    <td>{s.overallPercent ?? "-"}</td>
                    <td>{s.status}</td>
                    <td className="table-actions">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => handleEdit(s)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-ghost danger"
                        onClick={() => handleDelete(s.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ManageStudents;
