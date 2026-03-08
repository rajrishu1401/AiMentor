import { useState } from "react";
import "./Roadmap-Enhanced.css";

export default function Roadmap({ roadmap, roadmapIndex, onOpenTopic, onBack }) {
  const [autoSaved, setAutoSaved] = useState(true);

  // Check if a topic is unlocked (all topics are unlocked)
  const isTopicUnlocked = (topicIndex) => {
    return true; // All topics are always unlocked
  };

  // Get completion status for a topic
  const getTopicProgress = (topic) => {
    if (!topic.subtopics) return { completed: 0, total: 0 };

    const completed = topic.subtopics.filter(sub => sub.completed).length;
    const total = topic.subtopics.length;

    return { completed, total };
  };

  const isTopicCompleted = (topic) => {
    const { completed, total } = getTopicProgress(topic);
    return completed === total && total > 0;
  };

  return (
    <div className="roadmap-page">
      {/* Header */}
      <div className="roadmap-header">
        <div className="header-content">
          <h1 className="roadmap-title">{roadmap.subject} Roadmap</h1>
          <div className="header-badges">
  <span className={`level-badge level-${roadmap.level.toLowerCase()}`}>
    {roadmap.level} Level
  </span>

  {/* 🔥 NEW: Show Programming Language */}
  {roadmap.language && (
    <span className="level-badge">
      {roadmap.language}
    </span>
  )}
            {autoSaved && (
              <span className="auto-saved-badge">
                ✓ Auto-saved
              </span>
            )}
          </div>
        </div>
        <button className="btn-back" onClick={onBack}>
          ← Dashboard
        </button>
      </div>

      {/* Topics List */}
      <div className="topics-container">
        {roadmap.topics.map((topic, topicIndex) => {
          const unlocked = isTopicUnlocked(topicIndex);
          const completed = isTopicCompleted(topic);
          const { completed: completedCount, total: totalCount } = getTopicProgress(topic);

          return (
            <div
              key={topicIndex}
              className={`topic-card ${!unlocked ? 'locked' : ''} ${completed ? 'completed' : ''}`}
              onClick={() => {
                if (unlocked) {
                  onOpenTopic({
                    ...topic,
                    roadmapIndex: roadmapIndex,
                    topicIndex: topicIndex
                  });
                }
              }}
            >
              {/* Topic Number Badge */}
              <div className="topic-number">
                {topicIndex + 1}
              </div>

              {/* Topic Content */}
              <div className="topic-content">
                <h3 className="topic-title">{topic.name}</h3>
                <p className="topic-description">
                  {topic.description || getDefaultDescription(topic.name)}
                </p>
                {unlocked && (
                  <div className="topic-progress">
                    <span className="progress-text">
                      {completedCount} / {totalCount} subtopics completed
                    </span>
                  </div>
                )}
              </div>

              {/* Right Side - Lock/Start Button */}
              <div className="topic-action">
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
      </div>

      {/* Progress Summary */}
      <div className="progress-summary">
        <div className="summary-card">
          <h3>Your Progress</h3>
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-value">
                {roadmap.topics.filter(t => isTopicCompleted(t)).length}
              </span>
              <span className="stat-label">Topics Completed</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-value">{roadmap.topics.length}</span>
              <span className="stat-label">Total Topics</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-value">
                {Math.round((roadmap.topics.filter(t => isTopicCompleted(t)).length / roadmap.topics.length) * 100)}%
              </span>
              <span className="stat-label">Overall Progress</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to generate default descriptions
function getDefaultDescription(topicName) {
  const descriptions = {
    "Arrays & Strings": "Master fundamental array operations, string manipulation, and common algorithmic patterns.",
    "Linked Lists": "Learn about singly, doubly, and circular linked lists with practical implementations.",
    "Stacks & Queues": "Understand LIFO and FIFO data structures and their real-world applications.",
    "Frontend Basics": "Build a solid foundation in HTML, CSS, and modern JavaScript.",
    "Backend Development": "Create robust server-side applications with Node.js and databases.",
    "Supervised Learning": "Explore regression, classification, and fundamental ML algorithms.",
    "Neural Networks": "Dive deep into artificial neural networks and deep learning concepts."
  };

  return descriptions[topicName] || "Complete this topic to unlock advanced concepts and practical exercises.";
}