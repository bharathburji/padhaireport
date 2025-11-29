import axios from "axios";
import { useEffect, useMemo, useState, useRef } from "react";
import { getItem } from "../../utils/storage.js";
import {
  SUBJECTS,
  getStatusFromPercent,
  STATUS_RULES,
} from "../../utils/data.js";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "../../App.css";

const STUDENTS_KEY = "padhaai_students";
const MARKS_KEY = "padhaai_marks";

function TeacherDashboard() {
  const [students, setStudents] = useState([]);
  const [marksRecords, setMarksRecords] = useState([]);

  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState("");
  const [quoteLoading, setQuoteLoading] = useState(false);

  // ref for PDF capture
  const reportRef = useRef(null);

  useEffect(() => {
    const s = getItem(STUDENTS_KEY, []);
    const m = getItem(MARKS_KEY, []);
    setStudents(s);
    setMarksRecords(m);
  }, []);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        setQuoteLoading(true);
        setQuoteError("");

        const res = await axios.get("https://type.fit/api/quotes");
        const data = res.data;

        if (Array.isArray(data) && data.length > 0) {
          const random = data[Math.floor(Math.random() * data.length)];
          setQuote(random);
        }
      } catch (err) {
        setQuoteError("Could not load tip right now.");
      } finally {
        setQuoteLoading(false);
      }
    };

    fetchQuote();
  }, []);

  const stats = useMemo(() => {
    const totalStudents = students.length;

    const validPercents = students
      .map((s) => s.overallPercent)
      .filter((p) => typeof p === "number" && !Number.isNaN(p));

    const classAverage =
      validPercents.length === 0
        ? null
        : Number(
            (
              validPercents.reduce((sum, p) => sum + p, 0) /
              validPercents.length
            ).toFixed(2)
          );

    let topCount = 0;
    let avgCount = 0;
    let riskCount = 0;

    students.forEach((s) => {
      const status = getStatusFromPercent(s.overallPercent);
      if (status === "Top Performer") topCount += 1;
      else if (status === "At Risk") riskCount += 1;
      else if (status === "Average") avgCount += 1;
    });

    // subject-wise averages
    const subjectTotals = {};
    const subjectCounts = {};
    SUBJECTS.forEach((sub) => {
      subjectTotals[sub] = 0;
      subjectCounts[sub] = 0;
    });

    marksRecords.forEach((rec) => {
      SUBJECTS.forEach((sub) => {
        const val = rec.marks?.[sub];
        if (typeof val === "number" && !Number.isNaN(val)) {
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

    // Top 3 performers
    const topStudents = students
      .filter(
        (s) =>
          typeof s.overallPercent === "number" &&
          !Number.isNaN(s.overallPercent)
      )
      .sort((a, b) => b.overallPercent - a.overallPercent)
      .slice(0, 3);

    // At-risk students (below STATUS_RULES.atRisk)
    const atRiskStudents = students
      .filter(
        (s) =>
          typeof s.overallPercent === "number" &&
          !Number.isNaN(s.overallPercent) &&
          s.overallPercent < STATUS_RULES.atRisk
      )
      .sort((a, b) => a.overallPercent - b.overallPercent)
      .slice(0, 3);

    return {
      totalStudents,
      classAverage,
      topCount,
      avgCount,
      riskCount,
      subjectAverages,
      topStudents,
      atRiskStudents,
    };
  }, [students, marksRecords]);

  // 🔔 Smart notifications based on stats
  const notifications = useMemo(() => {
    const items = [];

    if (stats.totalStudents === 0) {
      items.push({
        type: "info",
        message:
          "No students added yet. Go to 'Manage Students' to add your first student.",
      });
      return items;
    }

    if (stats.riskCount > 0) {
      items.push({
        type: "warning",
        message: `${stats.riskCount} student${
          stats.riskCount > 1 ? "s are" : " is"
        } at risk. Review their marks and plan interventions.`,
      });
    }

    if (stats.classAverage != null && stats.classAverage < 60) {
      items.push({
        type: "warning",
        message: `Class average is ${stats.classAverage}%. Overall performance needs improvement.`,
      });
    }

    const weakSubjects = stats.subjectAverages.filter(
      (s) => s.average > 0 && s.average < 60
    );
    weakSubjects.forEach((s) =>
      items.push({
        type: "subject",
        message: `Average in ${s.subject} is ${s.average}%. Consider revising this topic with the class.`,
      })
    );

    if (items.length === 0) {
      items.push({
        type: "success",
        message:
          "Class is performing well overall. Keep reinforcing good study habits.",
      });
    }

    return items;
  }, [stats]);

  // PDF download handler
  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    const element = reportRef.current;

    // make sure we capture full content, high-res
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

    pdf.save("Teacher_Dashboard_Report.pdf");
  };

  return (
    <div className="page">
      {/* Header row with title + PDF button */}
      <div className="page-header-row">
        <div>
          <h2 className="page-title">Teacher Dashboard</h2>
          <p className="page-subtitle">
            High-level snapshot of your class performance, key segments, and
            subject trends.
          </p>
        </div>
        <button className="pdf-btn" onClick={handleDownloadPdf}>
          🧾 Download PDF
        </button>
      </div>

      {/* Everything below will go into PDF */}
      <div ref={reportRef}>
        {/* Motivational tip card */}
        <div
          className="card"
          style={{ marginTop: "1rem", marginBottom: "0.8rem" }}
        >
          <h3 className="card-title">Daily Teaching Insight</h3>

          {quoteLoading && (
            <p className="card-subtitle">Loading a quick tip for you...</p>
          )}

          {quoteError && (
            <p className="card-subtitle" style={{ color: "#fca5a5" }}>
              {quoteError}
            </p>
          )}

          {quote && (
            <p
              className="card-subtitle"
              style={{ fontStyle: "italic", marginTop: "0.3rem" }}
            >
              {quote.text} {quote.author && <span>- {quote.author}</span>}
            </p>
          )}

          {!quote && !quoteLoading && !quoteError && (
            <p className="card-subtitle">
              Use this dashboard to identify students who need your attention.
            </p>
          )}
        </div>

        {/* 🔔 Notifications & Alerts */}
        <div className="card" style={{ marginBottom: "1rem" }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">Notifications & Alerts</h3>
              <p className="card-subtitle">
                Auto-generated insights based on class performance.
              </p>
            </div>
          </div>

          <ul className="notif-list">
            {notifications.map((n, idx) => (
              <li key={idx} className={`notif-item notif-${n.type}`}>
                <span className="notif-dot" />
                <span>{n.message}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Stat tiles */}
        <div className="stat-grid">
          <div className="stat-card">
            <p className="stat-label">Total Students</p>
            <p className="stat-value">{stats.totalStudents}</p>
          </div>

          <div className="stat-card">
            <p className="stat-label">Class Average</p>
            <p className="stat-value">
              {stats.classAverage == null ? "-" : `${stats.classAverage}%`}
            </p>
          </div>

          <div className="stat-card">
            <p className="stat-label">Top Performers</p>
            <p className="stat-value">{stats.topCount}</p>
          </div>

          <div className="stat-card">
            <p className="stat-label">At Risk</p>
            <p className="stat-value danger">{stats.riskCount}</p>
          </div>
        </div>

        {/* Subject chart */}
        <div className="card" style={{ marginTop: "1.4rem" }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">Average Marks by Subject</h3>
              <p className="card-subtitle">
                Quickly see which subjects are strong and which need attention.
              </p>
            </div>
          </div>

          {stats.subjectAverages.every((s) => s.average === 0) ? (
            <div className="empty-cell" style={{ padding: "1rem" }}>
              No marks data yet. Add marks in "Manage Marks" to see trends here.
            </div>
          ) : (
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={stats.subjectAverages}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="average"
                    radius={[10, 10, 0, 0]}
                    fill="#6366f1"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Top performers & At-risk students */}
        <div
          className="card"
          style={{ marginTop: "1.4rem", marginBottom: "1.4rem" }}
        >
          <div className="card-header">
            <div>
              <h3 className="card-title">Student Overview</h3>
              <p className="card-subtitle">
                Quick list of top performers and students who may need
                attention.
              </p>
            </div>
          </div>

          <div className="student-summary-grid">
            <div>
              <h4 className="student-list-title">Top Performers</h4>
              {stats.topStudents.length === 0 ? (
                <p className="empty-cell">No evaluated students yet.</p>
              ) : (
                <ul className="student-list">
                  {stats.topStudents.map((s) => (
                    <li key={s.id} className="student-list-item">
                      <span>{s.name}</span>
                      <span className="student-list-score">
                        {s.overallPercent}%
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h4 className="student-list-title">At Risk Students</h4>
              {stats.atRiskStudents.length === 0 ? (
                <p className="empty-cell">No students in risk category.</p>
              ) : (
                <ul className="student-list">
                  {stats.atRiskStudents.map((s) => (
                    <li key={s.id} className="student-list-item">
                      <span>{s.name}</span>
                      <span className="student-list-score danger">
                        {s.overallPercent}%
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherDashboard;