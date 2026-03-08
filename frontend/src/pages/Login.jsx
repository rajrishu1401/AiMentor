import { useState } from "react";
import "./Auth.css";

const API_BASE = "http://localhost:5012/api";

async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Login failed");
  return data;
}

export default function Login({ onLogin, goToSignup, goToLanding }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await loginUser(email, password);
      if (res.token) {
        localStorage.setItem("token", res.token);
        if (res.name) localStorage.setItem("userName", res.name);
        if (email) localStorage.setItem("userEmail", email);
        onLogin();
      } else {
        setError("Invalid email or password.");
      }
    } catch (err) {
      setError(err.message || "Invalid email or password.");
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
            <h3>Master Coding.</h3>
            <p>AI-Powered.</p>
          </div>

          <div className="feature-card feature-card-purple feature-card-icon">
            <div className="code-icon"><span>&lt;/&gt;</span></div>
          </div>

          <div className="feature-card feature-card-yellow">
            <div className="plus-icon">+</div>
            <h3>Learn Faster</h3>
            <p>with Real-time Feedback</p>
          </div>

          <div className="feature-card feature-card-purple feature-card-bottom">
            <div className="plus-icon">+</div>
            <h3>Build Skills</h3>
            <p>Step by Step</p>
          </div>

          <div className="feature-card feature-card-empty-bottom"></div>
        </div>
      </div>

      {/* ── Right Side – Login Form ── */}
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

          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to continue your learning journey</p>

          {error && <div className="auth-error"><span>{error}</span></div>}

          <form onSubmit={handleLogin} className="auth-form">
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
                  id="login-email"
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
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  id="toggle-login-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
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

            <button id="login-submit" type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
              <span className="btn-arrow">→</span>
            </button>
          </form>

          <p className="auth-footer">
            Don&apos;t have an account?{" "}
            <span className="auth-link" onClick={goToSignup}>Sign Up</span>
          </p>
        </div>
      </div>
    </div>
  );
}
