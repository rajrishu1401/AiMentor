import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { apiRequest } from "../api/api";
import AIMentorDrawer from "./AIMentorDrawer";
import Sandbox from "./Sandbox";
import KnowledgeGraph from "./KnowledgeGraph";
import "./Dashboard2.css";

/* ── helpers ─────────────────────────────────────── */
function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function fmtDate(d) {
  if (!d) return new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function Dashboard({ onCreate, onOpenProfile, onOpenPDFLearning, onLogout }) {
  const [roadmaps, setRoadmaps] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [goals, setGoals] = useState("");
  const [language, setLanguage] = useState("Python");
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMentor, setShowMentor] = useState(false);
  const [pendingLanguageRoadmapIndex, setPendingLanguageRoadmapIndex] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState("Python");

  const userMenuRef = useRef(null);

  const userName = localStorage.getItem("userName") || "Learner";
  const userEmail = localStorage.getItem("userEmail") || "";
  const initials = getInitials(userName) || "U";
  const firstName = userName.split(" ")[0];

  const recentActivity = [...roadmaps]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 3)
    .map((rm) => ({ label: `Created: ${rm.subject || "Untitled"}`, date: fmtDate(rm.createdAt) }));

  const languageMap = { Python: 71, JavaScript: 63, Java: 62, "C++": 54, C: 50 };

  useEffect(() => {
    loadRoadmaps();
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const loadRoadmaps = async () => {
    try { const res = await apiRequest("/learning/my-roadmaps"); setRoadmaps(res.roadmaps || []); }
    catch (e) { console.error(e); }
  };

  const deleteRoadmap = async (index, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this learning path?")) return;
    try {
      await apiRequest("/learning/delete-roadmap", "POST", { roadmapIndex: index });
      setRoadmaps((prev) => prev.filter((_, i) => i !== index));
    } catch { alert("Failed to delete"); }
  };

  const handleCreate = async () => {
    try {
      setCreating(true);
      const finalLanguage = language === "None" ? "Python" : language;
      const finalLanguageId = languageMap[finalLanguage];
      const res = await apiRequest("/learning/create-roadmap", "POST", { subject, level, goals });
      setRoadmaps((prev) => {
        const updated = [...prev, res.roadmap];
        const newIndex = updated.length - 1;
        setLanguageForRoadmap(newIndex, finalLanguage, finalLanguageId);
        return updated;
      });
      closeForm();
    } catch (err) { alert("Failed to create roadmap: " + (err.message || "Unknown error")); }
    finally { setCreating(false); }
  };

  const setLanguageForRoadmap = async (roadmapIndex, lang, langId) => {
    try {
      await apiRequest("/learning/set-roadmap-language", "POST", { roadmapIndex, language: lang, languageId: langId });
      setRoadmaps((prev) => {
        const updated = [...prev];
        updated[roadmapIndex] = { ...updated[roadmapIndex], language: lang, languageId: langId };
        onCreate(updated[roadmapIndex], roadmapIndex);
        return updated;
      });
    } catch { alert("Failed to set language"); }
  };

  const handleConfirmLanguage = async () => {
    try {
      await apiRequest("/learning/set-roadmap-language", "POST", {
        roadmapIndex: pendingLanguageRoadmapIndex,
        language: selectedLanguage,
        languageId: languageMap[selectedLanguage],
      });
      setRoadmaps((prev) => {
        const updated = [...prev];
        updated[pendingLanguageRoadmapIndex] = { ...updated[pendingLanguageRoadmapIndex], language: selectedLanguage };
        onCreate(updated[pendingLanguageRoadmapIndex], pendingLanguageRoadmapIndex);
        return updated;
      });
      setPendingLanguageRoadmapIndex(null);
    } catch { alert("Failed to set language"); }
  };

  const closeForm = () => { setShowForm(false); setSubject(""); setGoals(""); setLevel("Beginner"); setLanguage("Python"); };
  const handleLogoutClick = () => { setShowUserMenu(false); onLogout(); };

  /* ══════════════════════════════════════════════════ */
  return (
    <div className="d2-root">

      {/* ── Top Nav ─────────────────────────────────── */}
      <nav className="d2-nav">
        <div className="d2-nav-logo">
          <div className="d2-logo-icon">&lt;/&gt;</div>
          <span className="d2-logo-text">HackVeda<span className="d2-logo-ai">AI</span></span>
        </div>

        <div className="d2-nav-tabs">
          {["dashboard", "sandbox", "knowledge"].map((tab) => (
            <button
              key={tab}
              className={`d2-nav-tab ${activeTab === tab ? "d2-nav-tab-active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "dashboard" ? "Dashboard" : tab === "sandbox" ? "Sandbox" : "Knowledge Graph"}
            </button>
          ))}
        </div>

        <div className="d2-nav-right">
          <button className="d2-bell-btn" title="Notifications">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>

          <div className="d2-avatar-wrap" ref={userMenuRef}>
            <button className="d2-avatar" onClick={() => setShowUserMenu((v) => !v)}>
              {initials}
            </button>

            {showUserMenu && (
              <div className="d2-user-menu">
                <div className="d2-um-header">
                  <div className="d2-um-avatar">{initials}</div>
                  <div>
                    <p className="d2-um-name">{userName}</p>
                    <p className="d2-um-email">{userEmail}</p>
                  </div>
                </div>

                <div className="d2-um-divider" />

                <button className="d2-um-item" onClick={() => { setShowUserMenu(false); onOpenProfile(); }}>
                  <span className="d2-um-icon">👤</span> Profile
                </button>
                <button className="d2-um-item">
                  <span className="d2-um-icon">⚙️</span> Account Settings
                </button>
                <button className="d2-um-item" onClick={() => setShowUserMenu(false)}>
                  <span className="d2-um-icon">📊</span> My Roadmaps
                </button>

                <div className="d2-um-divider" />

                <button className="d2-um-item d2-um-signout" onClick={handleLogoutClick}>
                  <span className="d2-um-icon">🚪</span> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── Sandbox (full page) ── */}
      {activeTab === "sandbox" && <Sandbox />}

      {/* ── Knowledge Graph (full page) ── */}
      {activeTab === "knowledge" && <KnowledgeGraph />}

      {/* ── Dashboard Body + Footer ── */}
      {activeTab === "dashboard" && (
        <>
          <div className="d2-body">
            {/* Left */}
            <div className="d2-main">
              <div className="d2-top-row">
                <p className="d2-greeting">
                  Hello, <strong>{firstName}</strong> — Your Learning Roadmaps ({roadmaps.length})
                </p>
                <button className="d2-create-btn" onClick={() => setShowForm(true)}>
                  + Create Roadmap
                </button>
              </div>

              <div className="d2-cards-grid">
                {roadmaps.length === 0 ? (
                  <div className="d2-no-cards">No learning paths yet.<br />Create one to get started!</div>
                ) : (
                  roadmaps.map((rm, i) => (
                    <div key={i} className="d2-card" onClick={() => onCreate(rm, i)}>
                      <div className="d2-card-top">
                        <h3 className="d2-card-title">{rm.subject}</h3>
                        <button className="d2-card-del" onClick={(e) => deleteRoadmap(i, e)} title="Delete">🗑️</button>
                      </div>
                      <div className="d2-card-badges">
                        <span className="d2-badge d2-badge-level">{rm.level || "Beginner"}</span>
                        {rm.language
                          ? <span className="d2-badge d2-badge-lang">📋 {fmtDate(rm.createdAt)}</span>
                          : <span className="d2-badge d2-badge-date">📋 {fmtDate(rm.createdAt)}</span>}
                      </div>
                      <div className="d2-card-progress">
                        <div className="d2-progress-bar">
                          <div
                            className="d2-progress-fill"
                            style={{ width: `${rm.topics?.length > 0 ? (rm.progress / rm.topics.length) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Sidebar */}
            <aside className="d2-sidebar">
              <button className="d2-action-btn d2-action-primary">
                <span>⚡</span> Start Coding
              </button>
              <button className="d2-action-btn d2-action-secondary" onClick={() => setShowMentor(true)}>
                <span>📅</span> Ask AI Mentor
              </button>
              <button className="d2-action-btn d2-action-secondary" onClick={onOpenPDFLearning}>
                <span>📄</span> Learn from PDF
              </button>
              <button className="d2-action-btn d2-action-secondary" onClick={onOpenProfile}>
                <span>🗺️</span> View Progress Map
              </button>

              <div className="d2-activity">
                <h4 className="d2-activity-title">RECENT ACTIVITY</h4>
                {recentActivity.length === 0 ? (
                  <p className="d2-no-activity">No activity yet.</p>
                ) : (
                  recentActivity.map((a, i) => (
                    <div key={i} className="d2-activity-item">
                      <p className="d2-activity-label">📚 {a.label}</p>
                      <p className="d2-activity-date">{a.date}</p>
                    </div>
                  ))
                )}
              </div>
            </aside>
          </div>

          {/* Footer */}
          <footer className="d2-footer">
            <div className="d2-footer-top">
              <div className="d2-footer-brand">
                <div className="d2-nav-logo" style={{ marginBottom: 10 }}>
                  <div className="d2-logo-icon">&lt;/&gt;</div>
                  <span className="d2-logo-text">HackVeda<span className="d2-logo-ai">AI</span></span>
                </div>
                <p>An intelligent, adaptive learning platform for Computer Science education. Master coding with AI-powered mentorship.</p>
                <div className="d2-footer-socials">
                  <button className="d2-social-btn">𝕏</button>
                  <button className="d2-social-btn">in</button>
                  <button className="d2-social-btn">⌨</button>
                </div>
              </div>

              <div className="d2-footer-col">
                <h4>Platform</h4>
                <ul>
                  <li><a href="#">Dashboard</a></li>
                  <li><a href="#">Code Sandbox</a></li>
                  <li><a href="#">Knowledge Graph</a></li>
                </ul>
              </div>

              <div className="d2-footer-col">
                <h4>Resources</h4>
                <ul>
                  <li><a href="#">Documentation</a></li>
                  <li><a href="#">Tutorials</a></li>
                  <li><a href="#">Community</a></li>
                  <li><a href="#">Support</a></li>
                </ul>
              </div>

              <div className="d2-footer-col">
                <h4>Account</h4>
                <ul>
                  <li><a href="#" onClick={() => onOpenProfile()}>Profile</a></li>
                  <li><a href="#">Settings</a></li>
                  <li><a href="#" onClick={onLogout} style={{ color: "#f87171" }}>Sign Out</a></li>
                </ul>
              </div>
            </div>
          </footer>
        </>
      )}

      {/* ── AI Mentor Drawer ─────────────────────────── */}
      <AIMentorDrawer open={showMentor} onClose={() => setShowMentor(false)} />

      {/* ── Create Roadmap Modal ─────────────────────── */}
      {showForm && createPortal(
        <div className="modal-overlay" onClick={closeForm}>
          <div className="create-form" onClick={(e) => e.stopPropagation()}>
            <h3>Create Learning Path</h3>
            <input
              placeholder="Enter any topic name (e.g. Dynamic Programming, Arrays)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="form-input"
            />
            <p className="form-hint">Examples: arrays_basic, trees_basic, dynamic_programming</p>
            <select value={level} onChange={(e) => setLevel(e.target.value)} className="form-select">
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="form-select">
              <option value="None">None (defaults to Python)</option>
              <option value="Python">Python</option>
              <option value="JavaScript">JavaScript</option>
              <option value="Java">Java</option>
              <option value="C++">C++</option>
              <option value="C">C</option>
            </select>
            <textarea
              placeholder="Any specific goals or focus areas? (optional)"
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              className="form-textarea"
            />
            <div className="form-buttons">
              <button className="btn-primary" disabled={creating || !subject} onClick={handleCreate}>
                {creating ? (<><span className="spinner" />Creating...</>) : "Create"}
              </button>
              <button className="btn-secondary" disabled={creating} onClick={closeForm}>Cancel</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Language Selection Modal ─────────────────── */}
      {pendingLanguageRoadmapIndex !== null && createPortal(
        <div className="modal-overlay">
          <div className="create-form" onClick={(e) => e.stopPropagation()}>
            <h3>Select Programming Language</h3>
            <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} className="form-select">
              <option value="Python">Python</option>
              <option value="C++">C++</option>
              <option value="Java">Java</option>
              <option value="JavaScript">JavaScript</option>
              <option value="C">C</option>
            </select>
            <div className="form-buttons">
              <button className="btn-primary" onClick={handleConfirmLanguage}>Confirm</button>
              <button className="btn-secondary" onClick={() => setPendingLanguageRoadmapIndex(null)}>Cancel</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}