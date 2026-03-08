import { useEffect, useState } from "react";
import { apiRequest } from "../api/api";
import "./Subtopics.css";

export default function Subtopics({ topic, onBack, onOpenLesson }) {
  const [subtopics, setSubtopics] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("🔍 Topic data:", topic); // Debug log

    const fetchSubtopics = async () => {
      try {
        console.log("📡 Fetching subtopics with:", {
          roadmapIndex: topic.roadmapIndex,
          topicIndex: topic.topicIndex
        });

        const res = await apiRequest(
          `/learning/my-subtopics?roadmapIndex=${topic.roadmapIndex}&topicIndex=${topic.topicIndex}`,
          "GET"
        );

        console.log("✅ Subtopics response:", res);
        setSubtopics(res.subtopics || []);
      } catch (err) {
        console.error("❌ Failed to fetch subtopics:", err);
      }
    };

    if (topic.roadmapIndex !== undefined && topic.topicIndex !== undefined) {
      fetchSubtopics();
    } else {
      console.error("❌ Missing roadmapIndex or topicIndex!");
    }
  }, [topic]);

  const generateSubtopics = async () => {
    try {
      setLoading(true);

      const res = await apiRequest(
        "/learning/generate-subtopics",
        "POST",
        {
          roadmapIndex: topic.roadmapIndex,
          topicIndex: topic.topicIndex
        }
      );

      setSubtopics(res.subtopics);
    } catch (err) {
      alert("Failed to generate subtopics");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Check if a subtopic is unlocked (all subtopics are unlocked)
  const isSubtopicUnlocked = (subtopicIndex) => {
    return true; // All subtopics are always unlocked
  };

  return (
    <div className="subtopics-page">
      {/* Header */}
      <div className="subtopics-header">
        <div className="header-content">
          <h1 className="subtopics-title">{topic.title}</h1>
          <p className="subtopics-description">
            {topic.description || "Complete all subtopics to master this module"}
          </p>
        </div>
        <button className="btn-back" onClick={onBack}>
          ← Back to Roadmap
        </button>
      </div>

      {/* Subtopics Container */}
      <div className="subtopics-container">
        {subtopics.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>No subtopics generated yet.</h3>
            <p>Generate subtopics to start learning this module</p>
            <button
              className="btn-generate"
              onClick={generateSubtopics}
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate Subtopics"}
            </button>
          </div>
        ) : (
          <>
            {subtopics.map((sub, idx) => {
              const unlocked = isSubtopicUnlocked(idx);
              const completed = sub.completed;

              return (
                <div
                  key={idx}
                  className={`subtopic-card ${!unlocked ? 'locked' : ''} ${completed ? 'completed' : ''}`}
                  onClick={() => {
                    if (unlocked) {
                      onOpenLesson({
                        roadmapIndex: topic.roadmapIndex,
                        topicIndex: topic.topicIndex,
                        subtopicIndex: idx,
                        subtopicTitle: sub.title
                      });
                    }
                  }}
                >
                  {/* Subtopic Number Badge */}
                  <div className="subtopic-number">
                    {idx + 1}
                  </div>

                  {/* Subtopic Content */}
                  <div className="subtopic-content">
                    <h3 className="subtopic-title">{sub.title}</h3>
                    <p className="subtopic-description">
                      {sub.description || `Learn about ${sub.title} in detail`}
                    </p>
                    {completed && (
                      <div className="subtopic-status">
                        <span className="status-badge completed-badge">
                          ✓ Completed
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right Side - Lock/Start Button */}
                  <div className="subtopic-action">
                    {!unlocked ? (
                      <div className="lock-icon">
                        🔒
                      </div>
                    ) : completed ? (
                      <div className="completed-icon">
                        ✓
                      </div>
                    ) : (
                      <button className="btn-start">
                        Start ▶
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Progress Summary */}
      {subtopics.length > 0 && (
        <div className="progress-summary">
          <div className="summary-card">
            <h3>Your Progress</h3>
            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-value">
                  {subtopics.filter(s => s.status === "completed").length}
                </span>
                <span className="stat-label">Subtopics Completed</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-value">{subtopics.length}</span>
                <span className="stat-label">Total Subtopics</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-value">
                  {Math.round((subtopics.filter(s => s.status === "completed").length / subtopics.length) * 100)}%
                </span>
                <span className="stat-label">Overall Progress</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}