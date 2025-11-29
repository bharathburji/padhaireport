import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getItem } from "../../utils/storage.js";
import { SUBJECTS, EXAMS, getStatusFromPercent } from "../../utils/data.js";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import "../../App.css";

const MARKS_KEY = "padhaai_marks";
const STUDENTS_KEY = "padhaai_students";

// 4 colors for 4 subjects (matches dark UI nicely)
const SUBJECT_COLORS = ["#22c55e", "#60a5fa", "#f97316", "#a855f7"];

function StudentDashboard() {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    // IMPORTANT: when user is null (after logout), don't touch user.email
    if (!user) {
      setStudent(null);
      setRecords([]);
      return;
    }

    const allStudents = getItem(STUDENTS_KEY, []);
    const mine = allStudents.find((s) => s.email === user.email);
    setStudent(mine || null);

    const allMarks = getItem(MARKS_KEY, []);
    const myMarks = mine ? allMarks.filter((r) => r.studentId === mine.id) : [];
    setRecords(myMarks);
  }, [user]);

  const summary = useMemo(() => {
    if (!student) {
      return {
        status: "Not evaluated",
        strength: { subject: "-" },
        weakness: { subject: "-" },
      };
    }

    const status = getStatusFromPercent(student.overallPercent);

    const subjectTotals = {};
    const subjectCounts = {};
    SUBJECTS.forEach((sub) => {
      subjectTotals[sub] = 0;
      subjectCounts[sub] = 0;
    });

    records.forEach((rec) => {
      SUBJECTS.forEach((sub) => {
        const val = rec.marks[sub];
        if (typeof val === "number") {
          subjectTotals[sub] += val;
          subjectCounts[sub] += 1;
        }
      });
    });

    const subjectAverages = SUBJECTS.map((sub) => ({
      subject: sub,
      average:
        subjectCounts[sub] === 0
          ? 0
          : Number((subjectTotals[sub] / subjectCounts[sub]).toFixed(2)),
    }));

    const strength = subjectAverages.reduce(
      (best, current) => (current.average > best.average ? current : best),
      subjectAverages[0]
    );

    const weakness = subjectAverages.reduce(
      (worst, current) => (current.average < worst.average ? current : worst),
      subjectAverages[0]
    );

    return {
      status,
      strength,
      weakness,
    };
  }, [student, records]);

  // Exam-wise subject marks for bar chart (4 colors = 4 subjects)
  const examChartData = useMemo(() => {
    return EXAMS.map((exam) => {
      const rec = records.find((r) => r.exam === exam);
      const item = { exam };

      SUBJECTS.forEach((sub) => {
        item[sub] =
          rec && typeof rec.marks[sub] === "number" ? rec.marks[sub] : 0;
      });

      return item;
    });
  }, [records]);

  const displayName =
    student?.name || user?.email?.split("@")[0] || "Student";

  // If user is null while router is redirecting, don't render anything
  if (!user) return null;

  return (
    <div className="page">
      <h2 className="page-title">Welcome, {displayName}</h2>
      <p className="page-subtitle">
        Here&apos;s your academic performance summary and progress insights.
      </p>

      {!student && (
        <div className="card" style={{ marginBottom: "1.2rem" }}>
          <p className="card-subtitle">
            Your account is not yet linked to a student record. Once your
            teacher adds you in &quot;Manage Students&quot; and enters your
            marks, your full analytics will appear here.
          </p>
        </div>
      )}

      {/* Summary */}
      <div className="card">
        <h3 className="card-title">Your Summary</h3>

        <div className="stat-grid" style={{ marginTop: "1rem" }}>
          <div className="stat-card">
            <p className="stat-label">Overall Percentage</p>
            <p className="stat-value">
              {student?.overallPercent == null
                ? "-"
                : `${student.overallPercent} / 100`}
            </p>
          </div>

          <div className="stat-card">
            <p className="stat-label">Status</p>
            <p
              className="stat-value"
              style={{
                color:
                  summary.status === "Top Performer"
                    ? "#22c55e"
                    : summary.status === "At Risk"
                    ? "#ef4444"
                    : summary.status === "Average"
                    ? "#60a5fa"
                    : "#9ca3af",
              }}
            >
              {summary.status}
            </p>
          </div>

          <div className="stat-card">
            <p className="stat-label">Strength</p>
            <p className="stat-value">{summary.strength.subject}</p>
          </div>

          <div className="stat-card">
            <p className="stat-label">Needs Improvement</p>
            <p className="stat-value danger">
              {summary.weakness.subject}
            </p>
          </div>
        </div>
      </div>

      {/* Progress chart – subject-wise bars per exam */}
      <div className="card" style={{ marginTop: "1.4rem" }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">Progress Across Exams</h3>
            <p className="card-subtitle">
              Each color shows your marks in a subject for that exam.
            </p>
          </div>
        </div>

        {records.length === 0 ? (
          <div className="empty-cell" style={{ padding: "1rem" }}>
            No marks available yet. Your performance chart will appear once your
            teacher records your scores.
          </div>
        ) : (
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={examChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="exam" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                {/* 4 colored bars = 4 subjects */}
                {SUBJECTS.map((sub, index) => (
                  <Bar
                    key={sub}
                    dataKey={sub}
                    fill={SUBJECT_COLORS[index % SUBJECT_COLORS.length]}
                    radius={[6, 6, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentDashboard;