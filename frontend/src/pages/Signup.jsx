import { useState } from "react";
import "./Auth.css";

const API_BASE = "http://13.232.0.142/api";

async function registerUser(name, email, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Signup failed");
  return data;
}

export default function Signup({ goToLogin, goToLanding }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirm) return setError("Passwords do not match.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");

    setLoading(true);
    try {
      await registerUser(name, email, password);
      setSuccess("Account created! Redirecting to sign in…");
      setTimeout(() => goToLogin(), 1800);
    } catch (err) {
      setError(err.message || "Sign up failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* ── Left Side – Feature Cards ── */}
      <div className="auth-left">
        <div className="feature-grid">
          <div className="feature-card feature-card-empty"></div>

          <div className="feature-card feature-card-purple feature-card-large">
            <div className="feature-dots">
              {Array.from({ length: 15 }).map((_, i) => <span key={i}></span>)}
            </div>
            <h3>Start Learning.</h3>
            <p>Today.</p>
          </div>

          <div className="feature-card feature-card-purple feature-card-icon">
            <div className="code-icon"><span>🚀</span></div>
          </div>

          <div className="feature-card feature-card-yellow">
            <div className="plus-icon">+</div>
            <h3>Join 10,000+</h3>
            <p>active learners worldwide</p>
          </div>

          <div className="feature-card feature-card-purple feature-card-bottom">
            <div className="plus-icon">✓</div>
            <h3>Free to Start</h3>
            <p>No credit card needed</p>
          </div>

          <div className="feature-card feature-card-empty-bottom"></div>
        </div>
      </div>

      {/* ── Right Side – Signup Form ── */}
      <div className="auth-right">
        <button className="back-to-home" onClick={goToLanding}>
          ← Back to Home
        </button>
        <div className="auth-form-container">
          {/* Logo */}
          <div className="auth-logo">
            <div className="logo-icon"><span>&lt;/&gt;</span></div>
            <span className="logo-text">
              HackVeda<span className="logo-highlight">AI</span>
            </span>
          </div>

          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Start your AI-powered coding journey today</p>

          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Full Name */}
            <div className="form-group">
              <label>Full Name</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  id="signup-name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label>Email</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M22 6L12 13L2 6" />
                  </svg>
                </span>
                <input
                  id="signup-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label>Password</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <circle cx="12" cy="16" r="1" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </span>
                <input
                  id="signup-password"
                  type={showPw ? "text" : "password"}
                  placeholder="Min. 8 chars — upper, lower, number"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  id="toggle-signup-password"
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label>Confirm Password</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4" />
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </span>
                <input
                  id="signup-confirm-password"
                  type={showPw ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button id="signup-submit" type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? "Creating Account…" : "Create Account"}
              <span className="btn-arrow">→</span>
            </button>
          </form>

          <p className="auth-footer">
            Already have an account?{" "}
            <span className="auth-link" onClick={goToLogin}>Sign In</span>
          </p>
        </div>
      </div>
    </div>
  );
}
