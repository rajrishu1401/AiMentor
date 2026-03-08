import { useEffect, useState } from "react";
import { apiRequest } from "../api/api";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');

  .profile-root {
    min-height: 100vh;
    background: #0a0a0f;
    color: #e8e6f0;
    font-family: 'DM Mono', monospace;
    padding: 0;
  }

  .profile-header {
    border-bottom: 1px solid #1e1e2e;
    padding: 24px 40px;
    display: flex;
    align-items: center;
    gap: 20px;
    background: #0d0d15;
  }

  .back-btn {
    background: none;
    border: 1px solid #2a2a3e;
    color: #7c7a9a;
    padding: 8px 14px;
    border-radius: 6px;
    cursor: pointer;
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    letter-spacing: 0.05em;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .back-btn:hover {
    border-color: #5b4fcf;
    color: #b8b0f0;
    background: #16163a;
  }

  .header-title {
    font-family: 'Syne', sans-serif;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #5b4fcf;
  }

  .profile-body {
    padding: 48px 40px;
    max-width: 760px;
    margin: 0 auto;
  }

  .page-title {
    font-family: 'Syne', sans-serif;
    font-size: 38px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #f0eeff;
    margin: 0 0 6px 0;
    line-height: 1;
  }

  .page-subtitle {
    font-size: 12px;
    color: #4e4c66;
    letter-spacing: 0.08em;
    margin: 0 0 48px 0;
  }

  .skills-grid {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .skill-card {
    background: #0f0f1a;
    border: 1px solid #1a1a2e;
    border-radius: 10px;
    padding: 24px 28px;
    transition: border-color 0.25s ease, background 0.25s ease;
    animation: fadeUp 0.4s ease both;
  }

  .skill-card:hover {
    border-color: #2e2b52;
    background: #111120;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .skill-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 18px;
  }

  .skill-name {
    font-family: 'Syne', sans-serif;
    font-size: 17px;
    font-weight: 700;
    color: #dcd8f8;
    text-transform: capitalize;
    letter-spacing: -0.01em;
  }

  .confidence-badge {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.06em;
    padding: 4px 10px;
    border-radius: 20px;
    font-family: 'DM Mono', monospace;
  }

  .badge-high   { background: #0d2e15; color: #4ade80; border: 1px solid #166534; }
  .badge-mid    { background: #2d1e06; color: #fb923c; border: 1px solid #7c3a0a; }
  .badge-low    { background: #2d0a0a; color: #f87171; border: 1px solid #7f1d1d; }

  .bar-track {
    height: 4px;
    background: #1a1a2e;
    border-radius: 99px;
    overflow: hidden;
    margin-bottom: 20px;
  }

  .bar-fill {
    height: 100%;
    border-radius: 99px;
    width: 0%;
    transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .bar-high { background: linear-gradient(90deg, #166534, #4ade80); }
  .bar-mid  { background: linear-gradient(90deg, #7c3a0a, #fb923c); }
  .bar-low  { background: linear-gradient(90deg, #7f1d1d, #f87171); }

  .skill-stats {
    display: flex;
    gap: 24px;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .stat-label {
    font-size: 10px;
    letter-spacing: 0.12em;
    color: #3e3c56;
    text-transform: uppercase;
  }

  .stat-value {
    font-size: 20px;
    font-weight: 500;
    color: #9490c4;
    font-family: 'Syne', sans-serif;
  }

  .empty-state {
    text-align: center;
    padding: 80px 20px;
    color: #2e2c44;
  }

  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.4;
  }

  .empty-text {
    font-family: 'Syne', sans-serif;
    font-size: 18px;
    color: #3e3c56;
    font-weight: 600;
  }

  .loading-state {
    min-height: 100vh;
    background: #0a0a0f;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    letter-spacing: 0.15em;
    color: #3e3c56;
  }

  .loading-dot {
    display: inline-block;
    animation: blink 1.2s ease-in-out infinite;
  }
  .loading-dot:nth-child(2) { animation-delay: 0.2s; }
  .loading-dot:nth-child(3) { animation-delay: 0.4s; }

  @keyframes blink {
    0%, 80%, 100% { opacity: 0.2; }
    40% { opacity: 1; }
  }

  .skills-count {
    font-size: 11px;
    color: #3e3c56;
    letter-spacing: 0.1em;
    margin-bottom: 20px;
  }
`;

function BarFill({ percent, colorClass }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setWidth(percent), 80);
    return () => clearTimeout(t);
  }, [percent]);

  return (
    <div className="bar-track">
      <div
        className={`bar-fill ${colorClass}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

export default function ProfilePage({ onBack }) {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSkills = async () => {
      try {
        const res = await apiRequest("/profile/my-skills");
        setSkills(res.skills || []);
      } catch (err) {
        alert("Failed to load skills");
      } finally {
        setLoading(false);
      }
    };
    loadSkills();
  }, []);

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="loading-state">
          LOADING
          <span className="loading-dot">.</span>
          <span className="loading-dot">.</span>
          <span className="loading-dot">.</span>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="profile-root">
        <header className="profile-header">
          <button className="back-btn" onClick={onBack}>
            ← Back
          </button>
          <span className="header-title">Skill Profile</span>
        </header>

        <div className="profile-body">
          <h1 className="page-title">My Skills</h1>
          <p className="page-subtitle">TRACKED COMPETENCIES · {skills.length} TOTAL</p>

          {skills.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">◎</div>
              <p className="empty-text">No skills tracked yet</p>
            </div>
          ) : (
            <div className="skills-grid">
              {skills.map((skill, i) => {
                const pct = Math.min(100, Math.max(0, skill.confidence || 0));
                const colorClass =
                  pct > 70 ? "high" : pct > 40 ? "mid" : "low";

                return (
                  <div
                    key={i}
                    className="skill-card"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="skill-top">
                      <span className="skill-name">
                        {skill.skill.replaceAll("_", " ")}
                      </span>
                      <span className={`confidence-badge badge-${colorClass}`}>
                        {pct}%
                      </span>
                    </div>

                    <BarFill percent={pct} colorClass={`bar-${colorClass}`} />

                    <div className="skill-stats">
                      <div className="stat-item">
                        <span className="stat-label">Quiz Attempts</span>
                        <span className="stat-value">{skill.quizAttempts}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Code Attempts</span>
                        <span className="stat-value">{skill.codeAttempts}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}