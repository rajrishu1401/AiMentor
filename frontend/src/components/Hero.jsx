export default function Hero({ onStartLearning, onTrySandbox }) {
    return (
        <section className="hero">
            <div className="hero-container">
                <div className="hero-content">
                    <h1 className="hero-title">
                        Master Computer Science with{' '}
                        <span className="gradient-text">AI-Powered Learning</span>
                    </h1>
                    <p className="hero-subtitle">
                        Personalized roadmaps, interactive coding challenges, and real-time AI mentorship
                        to accelerate your journey from beginner to expert.
                    </p>
                    <div className="hero-cta">
                        <button className="btn btn-primary btn-large" onClick={onStartLearning}>
                            Start Learning Free
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </button>
                        <button className="btn btn-secondary btn-large" onClick={onTrySandbox}>
                            Try Sandbox
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="16 18 22 12 16 6" />
                                <polyline points="8 6 2 12 8 18" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="hero-visual">
                    <div className="code-window">
                        <div className="code-header">
                            <span className="dot"></span>
                            <span className="dot"></span>
                            <span className="dot"></span>
                        </div>
                        <div className="code-content">
                            <pre>
                                {`function learnCS() {
  const skills = [
    'Data Structures',
    'Algorithms',
    'System Design'
  ];
  
  return skills.map(skill => 
    master(skill)
  );
}`}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
