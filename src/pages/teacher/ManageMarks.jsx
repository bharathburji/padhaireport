import { useEffect, useMemo, useState } from "react";
import { getItem, setItem } from "../../utils/storage.js";
import { SUBJECTS, EXAMS, getStatusFromPercent } from "../../utils/data.js";
import "../../App.css";

const STUDENTS_KEY = "padhaai_students";
const MARKS_KEY = "padhaai_marks";

function ManageMarks() {
  const [students, setStudents] = useState([]);
  const [marksRecords, setMarksRecords] = useState([]);

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedExam, setSelectedExam] = useState(EXAMS[0]);
  const [marks, setMarks] = useState({});
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);

  // load initial data
  useEffect(() => {
    const storedStudents = getItem(STUDENTS_KEY, []);
    const storedMarks = getItem(MARKS_KEY, []);
    setStudents(storedStudents);
    setMarksRecords(storedMarks);
  }, []);

  // helper: save marks and also recompute overall stats per student
  const saveMarksRecords = (updatedMarks) => {
    setMarksRecords(updatedMarks);
    setItem(MARKS_KEY, updatedMarks);

    // recompute overall percent per student
    const byStudent = new Map();

    updatedMarks.forEach((rec) => {
      if (!byStudent.has(rec.studentId)) {
        byStudent.set(rec.studentId, []);
      }
      byStudent.get(rec.studentId).push(rec.percent);
    });

    const updatedStudents = students.map((s) => {
      const percents = byStudent.get(s.id);
      if (!percents || percents.length === 0) {
        return { ...s, overallPercent: null, status: "Not evaluated" };
      }

      const avg =
        percents.reduce((sum, p) => sum + p, 0) / percents.length;
      const rounded = Number(avg.toFixed(2));
      return {
        ...s,
        overallPercent: rounded,
        status: getStatusFromPercent(rounded),
      };
    });

    setStudents(updatedStudents);
    setItem(STUDENTS_KEY, updatedStudents);
  };

  const resetForm = () => {
    setSelectedStudentId("");
    setSelectedExam(EXAMS[0]);
    setMarks({});
    setEditingId(null);
    setError("");
  };

  const handleMarksChange = (subject, value) => {
    setMarks((prev) => ({
      ...prev,
      [subject]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!selectedStudentId) {
      setError("Please select a student.");
      return;
    }

    // validate marks
    const parsedMarks = {};
    for (const subject of SUBJECTS) {
      const raw = marks[subject] ?? "";
      if (raw === "") {
        setError("Please enter marks for all subjects.");
        return;
      }
      const num = Number(raw);
      if (Number.isNaN(num) || num < 0 || num > 100) {
        setError("Marks must be a number between 0 and 100.");
        return;
      }
      parsedMarks[subject] = num;
    }

    const total = SUBJECTS.reduce((sum, s) => sum + parsedMarks[s], 0);
    const percent = Number(
      ((total / (SUBJECTS.length * 100)) * 100).toFixed(2)
    );

    const recordBase = {
      studentId: selectedStudentId,
      exam: selectedExam,
      marks: parsedMarks,
      total,
      percent,
    };

    let updated;
    if (editingId) {
      updated = marksRecords.map((r) =>
        r.id === editingId ? { ...r, ...recordBase } : r
      );
    } else {
      const newRecord = {
        id: `mark-${Date.now()}`,
        ...recordBase,
      };
      updated = [newRecord, ...marksRecords];
    }

    saveMarksRecords(updated);
    resetForm();
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    setSelectedStudentId(record.studentId);
    setSelectedExam(record.exam);
    setMarks(record.marks);
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this marks record?")) return;
    const updated = marksRecords.filter((r) => r.id !== id);
    saveMarksRecords(updated);
    if (editingId === id) resetForm();
  };

  const marksWithStudentNames = useMemo(() => {
    const byId = new Map(students.map((s) => [s.id, s]));
    return marksRecords.map((r) => {
      const student = byId.get(r.studentId);
      return {
        ...r,
        studentName: student?.name || "Unknown",
        studentCode: student?.studentId || "-",
        className: student?.className || "-",
      };
    });
  }, [marksRecords, students]);

  return (
    <div className="page">
      <h2 className="page-title">Manage Marks & Exams</h2>
      <p className="page-subtitle">
        Record exam-wise marks for each student. These values power analytics
        and individual performance reports.
      </p>

      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">
              {editingId ? "Edit Marks" : "Add Marks for Student"}
            </h3>
            <p className="card-subtitle">
              Select a student, choose an exam, and enter subject-wise marks.
            </p>
          </div>
          {editingId && (
            <button className="btn-ghost" type="button" onClick={resetForm}>
              Cancel edit
            </button>
          )}
        </div>

        {students.length === 0 && (
          <div className="form-error">
            No students found. Please add students in &quot;Manage Students&quot;
            first.
          </div>
        )}

        {error && <div className="form-error">{error}</div>}

        <form className="grid-2" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Student</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              disabled={students.length === 0}
            >
              <option value="">Select student</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.studentId} - {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Exam</label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
            >
              {EXAMS.map((exam) => (
                <option key={exam} value={exam}>
                  {exam}
                </option>
              ))}
            </select>
          </div>

          {SUBJECTS.map((subject) => (
            <div className="form-group" key={subject}>
              <label>{subject} (out of 100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={marks[subject] ?? ""}
                onChange={(e) => handleMarksChange(subject, e.target.value)}
              />
            </div>
          ))}

          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={students.length === 0}
            >
              {editingId ? "Save Changes" : "Save Marks"}
            </button>
          </div>
        </form>
      </div>

      <div className="card" style={{ marginTop: "1.4rem" }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">Marks Records</h3>
            <p className="card-subtitle">
              {marksWithStudentNames.length === 0
                ? "No marks recorded yet."
                : `Total records: ${marksWithStudentNames.length}`}
            </p>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Exam</th>
                <th>Total</th>
                <th>Percent</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {marksWithStudentNames.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-cell">
                    No marks data to display.
                  </td>
                </tr>
              ) : (
                marksWithStudentNames.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div>{r.studentName}</div>
                      <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                        {r.studentCode} • {r.className}
                      </div>
                    </td>
                    <td>{r.exam}</td>
                    <td>{r.total}</td>
                    <td>{r.percent}%</td>
                    <td className="table-actions">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => handleEdit(r)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-ghost danger"
                        onClick={() => handleDelete(r.id)}
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

export default ManageMarks;
