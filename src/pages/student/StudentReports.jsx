import { useEffect, useMemo, useState, useRef } from "react";
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "../../App.css";

const MARKS_KEY = "padhaai_marks";
const STUDENTS_KEY = "padhaai_students";

const PIE_COLORS = ["#22c55e", "#1f2937"]; // green vs dark background
const SUBJECT_BAR_COLOR = "#38bdf8"; // cyan

function StudentReports() {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [records, setRecords] = useState([]);

  const reportRef = useRef(null);

  useEffect(() => {
    // handle logout safely
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

  const computed = useMemo(() => {
    if (!student) return null;

    const status = getStatusFromPercent(student.overallPercent);

    // exam-wise summary
    const examsSummary = EXAMS.map((exam) => {
      const rec = records.find((r) => r.exam === exam);
      if (!rec) {
        return {
          exam,
          total: null,
          percent: null,
          grade: "-",
        };
      }

      const percent = rec.percent;
      let grade = "C";
      if (percent >= 80) grade = "A";
      else if (percent >= 60) grade = "B";
      else if (percent < 50) grade = "D";

      return {
        exam,
        total: rec.total,
        percent,
        grade,
      };
    });

    // subject-wise average
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

    const subjectSummary = SUBJECTS.map((sub) => ({
      subject: sub,
      average:
        subjectCounts[sub] === 0
          ? 0
          : Number((subjectTotals[sub] / subjectCounts[sub]).toFixed(2)),
    }));

    const strength = subjectSummary.reduce(
      (best, current) => (current.average > best.average ? current : best),
      subjectSummary[0]
    );

    const weakness = subjectSummary.reduce(
      (worst, current) => (current.average < worst.average ? current : worst),
      subjectSummary[0]
    );

    return {
      status,
      examsSummary,
      subjectSummary,
      strength,
      weakness,
    };
  }, [student, records]);

  // While router is redirecting on logout, don't try to render report
  if (!user) return null;

  if (!student || !computed) {
    return (
      <div className="page">
        <h2 className="page-title">My Detailed Performance Report</h2>
        <p className="page-subtitle">
          Your report will be available once your teacher links your account and
          uploads marks.
        </p>
      </div>
    );
  }

  const fullMarksPerExam = SUBJECTS.length * 100;
  const overallPercent = student.overallPercent ?? 0;
  const overallPieData = [
    { name: "Scored", value: overallPercent },
    { name: "Remaining", value: 100 - overallPercent },
  ];

  // PDF download handler
  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    const element = reportRef.current;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      scrollX: 0,
      scrollY: -window.scrollY,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgProps = pdf.getImageProperties(imgData);
    const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    const safeName = (student.name || "Student").replace(/[^a-z0-9]/gi, "_");
    pdf.save(`Student_Report_${safeName}.pdf`);
  };

  return (
    <div className="page">
      {/* Header row with title + PDF button */}
      <div className="page-header-row">
        <div>
          <h2 className="page-title">My Detailed Performance Report</h2>
          <p className="page-subtitle">
            View your marks across exams, subject-wise averages, and focus
            areas.
          </p>
        </div>
        <button className="pdf-btn" onClick={handleDownloadPdf}>
          🧾 Download Report
        </button>
      </div>

      {/* Everything below will go into PDF */}
      <div ref={reportRef}>
        {/* Basic student info + overall summary */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">{student.name}</h3>
              <p className="card-subtitle">
                ID: {student.studentId || "N/A"} • Class:{" "}
                {student.className || "N/A"}
              </p>
            </div>
            <div>
              <span
                className={
                  "status-badge " +
                  (computed.status === "Top Performer"
                    ? "status-top"
                    : computed.status === "At Risk"
                    ? "status-risk"
                    : computed.status === "Average"
                    ? "status-average"
                    : "")
                }
              >
                {computed.status}
              </span>
            </div>
          </div>

          <div className="stat-grid" style={{ marginTop: "1rem" }}>
            <div className="stat-card">
              <p className="stat-label">Overall Percentage</p>
              <p className="stat-value">
                {student.overallPercent == null
                  ? "-"
                  : `${student.overallPercent} / 100`}
              </p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Best Subject</p>
              <p className="stat-value">{computed.strength.subject}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Needs Focus</p>
              <p className="stat-value danger">
                {computed.weakness.subject}
              </p>
            </div>
          </div>

          {/* Overall pie chart */}
          <div
            style={{
              marginTop: "1.4rem",
              width: "100%",
              height: 220,
            }}
          >
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={overallPieData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {overallPieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p
            className="card-subtitle"
            style={{ textAlign: "center", marginTop: "-1rem" }}
          >
            Green shows how much you scored; dark part shows marks you missed.
          </p>
        </div>

        {/* Exam-wise summary */}
        <div className="card" style={{ marginTop: "1.4rem" }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">Exam-wise Performance</h3>
              <p className="card-subtitle">
                Check your scores and grades in each exam.
              </p>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Exam</th>
                  <th>Total Marks</th>
                  <th>Percentage</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {computed.examsSummary.every((e) => e.percent == null) ? (
                  <tr>
                    <td colSpan="4" className="empty-cell">
                      No exam marks available yet. Please wait for your teacher
                      to upload your scores.
                    </td>
                  </tr>
                ) : (
                  computed.examsSummary.map((e) => (
                    <tr key={e.exam}>
                      <td>{e.exam}</td>
                      <td>
                        {e.total == null
                          ? `- / ${fullMarksPerExam}`
                          : `${e.total} / ${fullMarksPerExam}`}
                      </td>
                      <td>
                        {e.percent == null
                          ? "-"
                          : `${e.percent.toFixed(2)}%`}
                      </td>
                      <td>{e.grade}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Subject-wise summary + bar chart */}
        <div className="card" style={{ marginTop: "1.4rem" }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">Subject-wise Average</h3>
              <p className="card-subtitle">
                Understand where you are strong and where you can improve.
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Average Score</th>
                </tr>
              </thead>
              <tbody>
                {computed.subjectSummary.map((s) => (
                  <tr key={s.subject}>
                    <td>{s.subject}</td>
                    <td>{`${s.average} / 100`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bar chart for subjects */}
          <div style={{ width: "100%", height: 240, marginTop: "1rem" }}>
            <ResponsiveContainer>
              <BarChart data={computed.subjectSummary}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar
                  dataKey="average"
                  fill={SUBJECT_BAR_COLOR}
                  radius={[10, 10, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <ul
            style={{
              marginTop: "0.8rem",
              fontSize: "0.9rem",
              lineHeight: 1.7,
            }}
          >
            <li>
              Focus more on <strong>{computed.weakness.subject}</strong> to
              boost your overall percentage.
            </li>
            <li>
              Maintain your performance in{" "}
              <strong>{computed.strength.subject}</strong> by practicing
              regularly.
            </li>
            <li>
              Try to keep all subjects above <strong>60%</strong> to avoid risk
              category.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default StudentReports;