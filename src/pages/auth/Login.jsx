import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./auth.css";
import "../../App.css";
import { useAuth } from "../../context/AuthContext.jsx";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("teacher");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Captcha state
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [error, setError] = useState("");

  // generate a simple math captcha like "7 + 3"
  const generateCaptcha = () => {
    const a = Math.floor(Math.random() * 9) + 1; // 1–9
    const b = Math.floor(Math.random() * 9) + 1;
    setCaptchaQuestion(`${a} + ${b}`);
    setCaptchaAnswer(String(a + b));
    setCaptchaInput("");
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    // Captcha validation
    if (!captchaInput.trim()) {
      setError("Please solve the captcha before logging in.");
      return;
    }

    if (captchaInput.trim() !== captchaAnswer) {
      setError("Incorrect captcha. Please try again.");
      generateCaptcha();
      return;
    }

    setIsSubmitting(true);

    try {
      // Your existing universal login logic
      const finalEmail = email.trim() || "user@example.com";
      const finalPassword = password.trim() || "password123";

      login(finalEmail, finalPassword, role);

      if (role === "teacher") {
        navigate("/teacher/dashboard", { replace: true });
      } else {
        navigate("/student/dashboard", { replace: true });
      }
    } finally {
      setIsSubmitting(false);
      // regenerate captcha after a successful attempt (extra safety)
      generateCaptcha();
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2 className="auth-title">Login to PadhaAI Report</h2>
        <p className="auth-subtitle">
          Enter any email and password, choose your role, and solve the captcha
          to continue.
        </p>

        {error && <div className="form-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label> Email </label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label> Password </label>
            <input
              type="password"
              name="password"
              placeholder="enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label> Role </label>
            <select
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="teacher">Teacher / Admin</option>
              <option value="student">Student</option>
            </select>
          </div>

          {/* Captcha block */}
          <div className="form-group captcha-group">
            <label>Captcha</label>
            <div className="captcha-row">
              <div className="captcha-box">
                <span className="captcha-label">Solve:</span>
                <span className="captcha-question">{captchaQuestion} = ?</span>
              </div>
              <button
                type="button"
                className="captcha-refresh"
                onClick={generateCaptcha}
              >
                ↻
              </button>
            </div>
            <input
              type="text"
              placeholder="Enter answer"
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;