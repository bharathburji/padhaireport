import axios from "axios";

import { useEffect, useMemo, useState } from "react";
import { getItem } from "../../utils/storage.js";
import { SUBJECTS, getStatusFromPercent } from "../../utils/data.js";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "../../App.css";

const STUDENTS_KEY = "padhaai_students";
const MARKS_KEY = "padhaai_marks";

function TeacherDashboard() {
  const [students, setStudents] = useState([]);
  const [marksRecords, setMarksRecords] = useState([]);

  // NEW: Quote states
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState("");
  const [quoteLoading, setQuoteLoading] = useState(false);

  useEffect(() => {
    const s = getItem(STUDENTS_KEY, []);
    const m = getItem(MARKS_KEY, []);
    setStudents(s);
    setMarksRecords(m);
  }, []);

  // NEW: Quote fetching useEffect
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

    return {
      totalStudents,
      classAverage,
      topCount,
      avgCount,
      riskCount,
      subjectAverages,
    };
  }, [students, marksRecords]);

  return (
    <div className="page">
      <h2 className="page-title">Teacher Dashboard</h2>
      <p className="page-subtitle">
        High-level snapshot of your class performance, key segments, and subject
        trends.
      </p>

      {/* NEW: Motivational tip card */}
      <div className="card" style={{ marginTop: "1rem", marginBottom: "0.8rem" }}>
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
            {quote.text}{" "}
            {quote.author && <span>- {quote.author}</span>}
          </p>
        )}

        {!quote && !quoteLoading && !quoteError && (
          <p className="card-subtitle">
            Use this dashboard to identify students who need your attention.
          </p>
        )}
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
            No marks data yet. Add marks in &quot;Manage Marks&quot; to see
            trends here.
          </div>
        ) : (
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={stats.subjectAverages}>
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="average" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

export default TeacherDashboard;
